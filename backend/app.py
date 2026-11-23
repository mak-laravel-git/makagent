from __future__ import annotations
import json, secrets, sqlite3, logging, hmac, asyncio
from contextlib import asynccontextmanager
from pathlib import Path
from urllib.parse import urlsplit
import httpx
from argon2.exceptions import VerificationError, InvalidHashError
from fastapi import FastAPI, Request, HTTPException, Depends
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse, RedirectResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field, ConfigDict
from .core import Settings, DB, ROOT, PASSWORDS, digest, now
from . import providers as P

class Input(BaseModel): model_config=ConfigDict(extra='forbid')
class Login(Input):
    email:str=Field(min_length=3,max_length=254)
    password:str=Field(min_length=1,max_length=256)
class Manual(Input):
    token:str=Field(default='',max_length=4000)
    chat_id:str=Field(default='',max_length=100)
    webhook_url:str=Field(default='',max_length=500)
    site_url:str=Field(default='',max_length=500)
    username:str=Field(default='',max_length=200)
    application_password:str=Field(default='',max_length=256)
    waba_id:str=Field(default='',max_length=30)
    phone_id:str=Field(default='',max_length=30)
class Complete(Input):
    flow:str=Field(min_length=20,max_length=100)
    accounts:list[str]=Field(min_length=1,max_length=500)

def create_app(settings=None,transport=None):
    cfg=(settings or Settings.load()).prepare();db=DB(cfg)
    # Token-bearing URLs must never appear in HTTP debug/access logs.
    logging.getLogger('httpx').setLevel(logging.WARNING);logging.getLogger('httpcore').setLevel(logging.WARNING)
    @asynccontextmanager
    async def lifespan(app):
        db.prune()
        async with httpx.AsyncClient(timeout=httpx.Timeout(20,connect=8),follow_redirects=False,trust_env=False,http2=False,transport=transport,limits=httpx.Limits(max_connections=30,max_keepalive_connections=10)) as client:
            app.state.http=client;yield
    app=FastAPI(title='SalesPilot real connection service',version='1.0.0',docs_url=None,redoc_url=None,openapi_url=None,lifespan=lifespan)
    app.state.cfg=cfg;app.state.db=db;app.state.verify_locks={}
    def fail(code,message,status=400):raise HTTPException(status,detail={'code':code,'message':message})
    @app.middleware('http')
    async def boundary(request,call_next):
        try:host=(urlsplit('//'+request.headers.get('host','')).hostname or '').lower()
        except ValueError:host=''
        public=urlsplit(cfg.public_url).hostname
        allowed=host==public or (not cfg.production and (host in ('localhost','127.0.0.1','::1','testserver') or host.endswith('.e2b.app')))
        if not allowed:return JSONResponse({'code':'invalid_host','message':'Host is not allowed.'},400)
        if cfg.production and request.url.scheme!='https':
            return RedirectResponse(cfg.public_url+request.url.path+('?' + request.url.query if request.url.query else ''),308)
        if request.url.path.startswith('/api/') and request.method in ('POST','PUT','PATCH','DELETE'):
            origin=request.headers.get('origin')
            permitted={cfg.public_url}
            if not cfg.production:
                permitted.add(str(request.base_url).rstrip('/'))
            if not origin or origin not in permitted:return JSONResponse({'code':'invalid_origin','message':'Use the same-origin Connections page; cross-site writes are not allowed.'},403)
            try: size=int(request.headers.get('content-length','0'))
            except ValueError:size=999999
            if size>20000:return JSONResponse({'code':'request_too_large','message':'Request exceeds the safety limit.'},413)
            buf=bytearray()
            async for chunk in request.stream():
                buf.extend(chunk)
                if len(buf)>20000:return JSONResponse({'code':'request_too_large','message':'Request exceeds the safety limit.'},413)
            request._body=bytes(buf)
        response=await call_next(request)
        response.headers['X-Content-Type-Options']='nosniff'
        response.headers['Referrer-Policy']='no-referrer'
        response.headers['Permissions-Policy']='camera=(), microphone=(), geolocation=()'
        if request.url.path.startswith('/api/'):
            response.headers['Cache-Control']='no-store';response.headers['Pragma']='no-cache'
        if cfg.production:
            response.headers['Strict-Transport-Security']='max-age=31536000'
            response.headers['Content-Security-Policy']="frame-ancestors 'self'; object-src 'none'; base-uri 'self'"
        return response
    @app.exception_handler(HTTPException)
    async def http_error(req,e):
        body=e.detail if isinstance(e.detail,dict) else {'code':'request_failed','message':'Request could not be completed.'}
        return JSONResponse(body,e.status_code)
    @app.exception_handler(RequestValidationError)
    async def validation(req,e):
        # Never echo submitted credentials, even when validation fails.
        return JSONResponse({'code':'invalid_input','message':'Check the required fields and input lengths.','fields':list({str(x['loc'][-1]) if str(x['loc'][-1]) in ('email','password','token','chat_id','webhook_url','site_url','username','application_password','waba_id','phone_id','flow','accounts') else 'unknown_field' for x in e.errors()})},422)
    @app.exception_handler(P.ProviderError)
    async def provider_error(req,e):return JSONResponse({'code':e.code,'message':e.message},503 if e.code=='provider_unavailable' else 400)
    @app.exception_handler(Exception)
    async def unhandled(req,e):
        return JSONResponse({'code':'service_error','message':'The service could not complete this operation. No provider success is assumed.'},500)
    def session(request:Request):
        value=request.cookies.get(cfg.cookie,'')
        if not value:fail('authentication_required','Sign in with your server account.',401)
        with db.open() as c:
            row=c.execute('SELECT s.*,u.email FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.hash=? AND s.expires_at>?',(digest(value),now())).fetchone()
        if not row:fail('authentication_required','Your session expired. Sign in again.',401)
        return dict(row)
    def write(request:Request,s=Depends(session)):
        if not hmac.compare_digest(request.headers.get('x-csrf-token',''),s['csrf']):fail('csrf_required','Refresh this page and retry the action.',403)
        if not db.limit('operations:'+s['user_id'],80,300):fail('rate_limited','Too many operations. Wait before trying again.',429)
        return s
    def own(id,user):
        with db.open() as c:r=c.execute('SELECT * FROM connections WHERE id=? AND user_id=?',(id,user)).fetchone()
        if not r:fail('not_found','Connection not found in this workspace.',404)
        return dict(r)
    def public(r):
        r=dict(r);status=r['status']
        if r.get('expires_at') and r['expires_at']<=now() and status=='connected':status='expired'
        return {k:r[k] for k in ('id','provider','external_id','name','kind','expires_at','last_verified','created_at','error_code')}|{'status':status}
    def save(c,user,item):
        existing=c.execute('SELECT id FROM connections WHERE user_id=? AND provider=? AND external_id=?',(user,item['provider'],item['external_id'])).fetchone()
        id=existing['id'] if existing else secrets.token_hex(16)
        c.execute('''INSERT INTO connections(id,user_id,provider,external_id,name,kind,status,sealed,expires_at,last_verified,created_at,error_code)
          VALUES(?,?,?,?,?,?,?,?,?,?,?,NULL) ON CONFLICT(user_id,provider,external_id) DO UPDATE SET name=excluded.name,kind=excluded.kind,status='connected',sealed=excluded.sealed,expires_at=excluded.expires_at,last_verified=excluded.last_verified,error_code=NULL''',
          (id,user,item['provider'],item['external_id'],item['name'],item['kind'],'connected',cfg.encrypt(item['credentials']),item.get('expires_at'),now(),now()))
        c.execute('INSERT INTO events(user_id,action,provider,connection_id,created_at) VALUES(?,?,?,?,?)',(user,'connection_verified_and_saved',item['provider'],id,now()))
        return id
    @app.get('/api/health')
    async def health():
        with db.open() as c:ready=c.execute('SELECT COUNT(*) FROM users').fetchone()[0]>0
        return {'service':'salespilot-connections','version':'1.0.0','owner_ready':ready,'production':cfg.production,'mode':'live-adapters','publishing_enabled':False}
    @app.post('/api/auth/login')
    async def login(body:Login,request:Request):
        db.prune()
        ip=request.client.host if request.client else 'unknown';email=body.email.strip().lower()
        if not db.limit('login-ip:'+digest(ip),40,900) or not db.limit('login-account:'+digest(email),10,900):fail('rate_limited','Too many sign-in attempts. Try again after 15 minutes.',429)
        with db.open() as c:user=c.execute('SELECT * FROM users WHERE email=?',(email,)).fetchone()
        # Dummy hash equalizes nonexistent-account verification cost.
        target=user['password_hash'] if user else app.state.dummy_hash
        try:ok=PASSWORDS.verify(target,body.password)
        except (VerificationError,InvalidHashError):ok=False
        if not user or not ok:fail('invalid_login','Email or password is incorrect.',401)
        raw=secrets.token_urlsafe(40);csrf=secrets.token_urlsafe(32)
        with db.open(True) as c:
            if request.cookies.get(cfg.cookie):c.execute('DELETE FROM sessions WHERE hash=?',(digest(request.cookies[cfg.cookie]),))
            c.execute('INSERT INTO sessions VALUES(?,?,?,?)',(digest(raw),user['id'],csrf,now()+43200))
        db.event(user['id'],'signed_in');db.prune()
        response=JSONResponse({'user':{'email':user['email']},'csrf':csrf})
        response.set_cookie(cfg.cookie,raw,max_age=43200,httponly=True,secure=cfg.production,samesite='lax',path='/')
        return response
    app.state.dummy_hash=PASSWORDS.hash(secrets.token_urlsafe(32))
    @app.get('/api/auth/session')
    async def session_state(request:Request):
        try:
            s=session(request);return {'user':{'email':s['email']},'csrf':s['csrf']}
        except HTTPException:return {'user':None,'csrf':None}
    @app.get('/api/auth/me')
    async def me(s=Depends(session)):return {'user':{'email':s['email']},'csrf':s['csrf']}
    @app.post('/api/auth/logout')
    async def logout(s=Depends(write)):
        with db.open(True) as c:
            c.execute('DELETE FROM sessions WHERE hash=?',(s['hash'],));c.execute('DELETE FROM oauth_states WHERE session_hash=?',(s['hash'],));c.execute('DELETE FROM pending WHERE session_hash=?',(s['hash'],))
        response=JSONResponse({'ok':True});response.delete_cookie(cfg.cookie,path='/',secure=cfg.production,httponly=True,samesite='lax');return response
    @app.get('/api/providers')
    async def providers(s=Depends(session)):return {'providers':P.catalog(cfg),'public_base_url':cfg.public_url}
    @app.get('/api/connections')
    async def connections(s=Depends(session)):
        with db.open() as c:rows=c.execute('SELECT * FROM connections WHERE user_id=? ORDER BY created_at DESC',(s['user_id'],)).fetchall()
        return {'connections':[public(x) for x in rows]}
    @app.get('/api/audit')
    async def audit(s=Depends(session)):
        with db.open() as c:rows=c.execute('SELECT action,provider,connection_id,created_at FROM events WHERE user_id=? ORDER BY id DESC LIMIT 50',(s['user_id'],)).fetchall()
        return {'events':[dict(x) for x in rows]}
    @app.post('/api/oauth/{provider}/start')
    async def start(provider:str,s=Depends(write)):
        if not db.limit('oauth:'+s['user_id'],12,300):fail('rate_limited','Wait before starting more authorization attempts.',429)
        P.oauth_spec(cfg,provider);state=secrets.token_urlsafe(40);verifier=secrets.token_urlsafe(64)
        url=P.authorization(cfg,provider,state,verifier)
        db.prune()
        with db.open() as c:c.execute('INSERT INTO oauth_states VALUES(?,?,?,?,?,?)',(digest(state),s['user_id'],s['hash'],provider,cfg.encrypt({'verifier':verifier}),now()+600))
        return {'authorization_url':url}
    @app.get('/api/oauth/{provider}/callback')
    async def callback(provider:str,request:Request):
        def back(code):return RedirectResponse('/app/connections.html?connection_error='+code,status_code=303)
        try:s=session(request)
        except HTTPException:return back('session_expired')
        state=request.query_params.get('state','')
        if len(state)>200:return back('invalid_state')
        with db.open(True) as c:
            row=c.execute('SELECT * FROM oauth_states WHERE hash=? AND user_id=? AND session_hash=? AND provider=? AND expires_at>?',(digest(state),s['user_id'],s['hash'],provider,now())).fetchone()
            if not row:return back('invalid_state')
            c.execute('DELETE FROM oauth_states WHERE hash=?',(digest(state),))
        if request.query_params.get('error'):return back('permission_denied')
        code=request.query_params.get('code','')
        if not code or len(code)>10000:return back('invalid_code')
        try:
            token=await P.exchange(cfg,app.state.http,provider,code,cfg.decrypt(row['sealed'])['verifier'])
            accounts=await P.discover(cfg,app.state.http,provider,token)
            if not accounts:return back('no_accounts')
            flow=secrets.token_urlsafe(32)
            with db.open() as c:c.execute('INSERT INTO pending VALUES(?,?,?,?,?)',(flow,s['user_id'],s['hash'],cfg.encrypt(accounts),now()+600))
            return RedirectResponse('/app/connections.html?flow='+flow,303)
        except P.ProviderError as e:db.event(s['user_id'],'oauth_failed:'+e.code,provider);return back(e.code)
    @app.get('/api/pending/{flow}')
    async def pending(flow:str,s=Depends(session)):
        with db.open() as c:r=c.execute('SELECT * FROM pending WHERE id=? AND user_id=? AND session_hash=? AND expires_at>?',(flow,s['user_id'],s['hash'],now())).fetchone()
        if not r:fail('expired_selection','This account selection expired or belongs to another session. Start authorization again.',404)
        return {'accounts':[{k:x[k] for k in ('provider','external_id','name','kind')} for x in cfg.decrypt(r['sealed'])]}
    @app.delete('/api/pending/{flow}')
    async def cancel_pending(flow:str,s=Depends(write)):
        with db.open() as c:c.execute('DELETE FROM pending WHERE id=? AND user_id=? AND session_hash=?',(flow,s['user_id'],s['hash']))
        return {'ok':True,'notice':'Nothing was saved. Provider consent may still exist; remove it in the provider account if needed.'}
    @app.post('/api/connections/complete')
    async def complete(body:Complete,s=Depends(write)):
        with db.open(True) as c:
            r=c.execute('SELECT * FROM pending WHERE id=? AND user_id=? AND session_hash=? AND expires_at>?',(body.flow,s['user_id'],s['hash'],now())).fetchone()
            if not r:fail('expired_selection','This account selection expired. Start authorization again.',404)
            accounts=cfg.decrypt(r['sealed']);byid={x['external_id']:x for x in accounts};selected=set(body.accounts)
            if not selected or not selected.issubset(byid):fail('invalid_selection','Select only the accounts returned by this authorization.')
            ids=[save(c,s['user_id'],byid[id]) for id in selected]
            c.execute('DELETE FROM pending WHERE id=?',(body.flow,))
        return {'connections':[public(own(id,s['user_id'])) for id in ids]}
    @app.post('/api/connections/{provider}/credential')
    async def credential(provider:str,body:Manual,s=Depends(write)):
        entry=next((x for x in P.catalog(cfg) if x['id']==provider),None)
        if not entry or entry['method']!='credential':fail('unsupported_provider','Use OAuth for this platform.')
        if not entry['configured']:fail('setup_required','Finish the server-side setup for this platform first.')
        item=await P.manual(cfg,app.state.http,provider,body.model_dump())
        with db.open(True) as c:id=save(c,s['user_id'],item)
        return {'connection':public(own(id,s['user_id']))}
    @app.post('/api/connections/{id}/verify')
    async def verify(id:str,s=Depends(write)):
        own(id,s['user_id'])
        async with app.state.verify_locks.setdefault(id,asyncio.Lock()):
            row=own(id,s['user_id'])
            try:
                item=await P.verify(cfg,app.state.http,row,cfg.decrypt(row['sealed']))
                if item['external_id']!=row['external_id']:raise P.ProviderError('identity_changed','Provider identity changed. Remove the old record and reconnect explicitly.')
                with db.open(True) as c:
                    # A concurrent remove must not resurrect credentials.
                    cursor=c.execute("UPDATE connections SET name=?,sealed=?,expires_at=?,last_verified=?,status='connected',error_code=NULL WHERE id=? AND user_id=?",(item['name'],cfg.encrypt(item['credentials']),item.get('expires_at'),now(),id,s['user_id']))
                    if cursor.rowcount!=1:fail('not_found','Connection was removed while verification was in progress.',404)
                db.event(s['user_id'],'connection_reverified',row['provider'],id)
                return {'connection':public(own(id,s['user_id']))}
            except P.ProviderError as e:
                status='needs_reconnect' if e.code in ('authorization_rejected','identity_changed') else 'verification_failed'
                with db.open() as c:c.execute('UPDATE connections SET status=?,error_code=? WHERE id=? AND user_id=?',(status,e.code,id,s['user_id']))
                db.event(s['user_id'],'verification_failed:'+e.code,row['provider'],id);raise
    @app.delete('/api/connections/{id}')
    async def remove(id:str,s=Depends(write)):
        row=own(id,s['user_id'])
        with db.open(True) as c:c.execute('DELETE FROM connections WHERE id=? AND user_id=?',(id,s['user_id']))
        db.event(s['user_id'],'connection_removed_locally',row['provider'],id)
        return {'ok':True,'notice':'Encrypted local credentials removed. Revoke the app, webhook, bot token or Application Password at the provider separately if required.'}
    @app.get('/')
    async def root():return RedirectResponse('/app/connections.html',307)
    for folder in ('assets','app','admin','tools'):app.mount('/'+folder,StaticFiles(directory=ROOT/folder),name=folder)
    public_files={p.name for p in ROOT.glob('*.html')}|{'README.md','DEMO_SCRIPT.md','QA_REPORT.md','SPEC.md','PHASES.md','INTEGRATIONS.md','PROVIDER_SETUP.md','SECURITY.md'}
    @app.get('/{filename}')
    async def public_file(filename:str):
        if filename not in public_files or not (ROOT/filename).is_file():raise HTTPException(404)
        return FileResponse(ROOT/filename)
    return app

# Factory startup: python -m uvicorn backend.app:create_app --factory ...
