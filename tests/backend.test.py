"""Controlled upstream-fixture tests. These are NOT live provider authorizations."""
import sys,json,secrets,tempfile,unittest,socket,base64,hashlib
from pathlib import Path
from urllib.parse import urlsplit,parse_qs
from unittest.mock import patch,AsyncMock
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
import httpx
from fastapi.testclient import TestClient
from backend.app import create_app
from backend.core import Settings,create_owner,now
from backend import providers as P

TOKEN='FAKE_TEST_ACCESS_TOKEN_NEVER_LIVE'
BOT='12345678:FAKE_TEST_BOT_TOKEN_NEVER_LIVE_ABCDE'
WEB='FAKE_TEST_WEBHOOK_TOKEN_NEVER_LIVE'
PASSWORD='Only-a-test-passphrase-123!'
class ConnectionTests(unittest.TestCase):
 @classmethod
 def setUpClass(cls):
  cls.temp=tempfile.TemporaryDirectory();cls.calls=[];cls.forced=None
  values={'META_GRAPH_VERSION':'v99.0','WORDPRESS_ALLOWED_HOSTS':'wp.example.com,private.example.com'}
  for prefix in ['LINKEDIN','META','GOOGLE','THREADS','X']:
   values[prefix+'_CLIENT_ID']='FAKE_'+prefix+'_CLIENT_ID';values[prefix+'_CLIENT_SECRET']='FAKE_'+prefix+'_CLIENT_SECRET'
  cls.cfg=Settings(Path(cls.temp.name),'http://localhost',False,values=values)
  def upstream(req):
   cls.calls.append(req);path=req.url.path;host=req.url.host
   if cls.forced:return httpx.Response(cls.forced,json={'error':'TEST_UPSTREAM_FAILURE'},request=req)
   if 'oauth' in path or path.endswith('/token') or path.endswith('/accessToken') or host=='oauth2.googleapis.com':
    return httpx.Response(200,json={'access_token':TOKEN,'refresh_token':'FAKE_REFRESH_TOKEN_NEVER_LIVE','expires_in':3600},request=req)
   if host=='graph.threads.net' and path in ['/access_token','/refresh_access_token']:
    return httpx.Response(200,json={'access_token':TOKEN,'expires_in':5184000},request=req)
   if host=='api.linkedin.com':d={'sub':'li-1','name':'TEST LinkedIn Member'}
   elif host=='api.x.com':d={'data':{'id':'x-1','username':'TEST_x_profile'}}
   elif host=='www.googleapis.com':d={'items':[{'id':'yt-1','snippet':{'title':'TEST YouTube Channel'}}]}
   elif host=='graph.threads.net':d={'id':'threads-1','username':'TEST_threads_profile'}
   elif host=='graph.facebook.com' and path.endswith('/me/accounts'):d={'data':[{'id':'fb-1','name':'TEST Facebook Page','access_token':TOKEN,'instagram_business_account':{'id':'ig-1','username':'TEST_instagram_profile'}},{'id':'fb-2','name':'TEST Unselected Page','access_token':TOKEN}]}
   elif host=='graph.facebook.com' and path.endswith('/phone_numbers'):d={'data':[{'id':'12345678','display_phone_number':'+880 TEST PHONE'}]}
   elif host=='graph.facebook.com':d={'id':path.rsplit('/',1)[1],'name':'TEST Facebook Page','username':'TEST Instagram'}
   elif host=='api.telegram.org':
    if path.endswith('/getMe'):d={'ok':True,'result':{'id':12345678,'is_bot':True,'username':'TEST_bot'}}
    elif path.endswith('/getChat'):d={'ok':True,'result':{'id':-100123456,'type':'channel','title':'TEST Telegram Channel'}}
    else:d={'ok':True,'result':{'status':'administrator','can_post_messages':True}}
   elif host=='discord.com':d={'id':'1234567890123456','type':1,'channel_id':'2222222222222222','name':'TEST Discord Channel'}
   elif host=='93.184.216.34':
    assert req.headers['host']=='wp.example.com';assert req.extensions['sni_hostname']=='wp.example.com'
    d={'id':9,'name':'TEST WP User'}
   else:raise AssertionError('Unexpected upstream host/path: '+host+path)
   return httpx.Response(200,json=d,request=req)
  cls.app=create_app(cls.cfg,httpx.MockTransport(upstream));cls.db=cls.app.state.db
  create_owner(cls.db,'owner1@example.com',PASSWORD);create_owner(cls.db,'owner2@example.com',PASSWORD)
  cls.client=TestClient(cls.app,base_url='http://localhost');cls.client.__enter__()
 @classmethod
 def tearDownClass(cls):cls.client.__exit__(None,None,None);cls.temp.cleanup()
 def setUp(self):
  type(self).forced=None
  with self.db.open() as c:c.execute('DELETE FROM limits')
  self.client.cookies.clear();r=self.client.post('/api/auth/login',json={'email':'owner1@example.com','password':PASSWORD},headers={'Origin':'http://localhost'})
  self.assertEqual(r.status_code,200,r.text);self.headers={'Origin':'http://localhost','X-CSRF-Token':r.json()['csrf']}
  with self.db.open() as c:
   for table in ['connections','pending','oauth_states']:c.execute('DELETE FROM '+table)
 def post(self,path,data=None,**kwargs):return self.client.post(path,json=data,headers=self.headers,**kwargs)
 def oauth(self,p):
  r=self.post('/api/oauth/'+p+'/start');self.assertEqual(r.status_code,200,r.text)
  query=parse_qs(urlsplit(r.json()['authorization_url']).query);state=query['state'][0]
  if p in ['x','youtube']:self.assertEqual(query['code_challenge_method'],['S256'])
  cb=self.client.get('/api/oauth/'+p+'/callback',params={'state':state,'code':'FAKE_CODE_NOT_LIVE'},follow_redirects=False)
  self.assertEqual(cb.status_code,303,cb.text);self.assertIn('flow=',cb.headers['location'])
  flow=parse_qs(urlsplit(cb.headers['location']).query)['flow'][0]
  pending=self.client.get('/api/pending/'+flow);self.assertEqual(pending.status_code,200,pending.text)
  return flow,pending.json()['accounts'],state
 def test_01_auth_csrf_and_source_boundaries(self):
  self.assertEqual(self.client.get('/api/auth/me').status_code,200)
  self.assertEqual(self.client.post('/api/oauth/x/start',headers={'Origin':'https://evil.example','X-CSRF-Token':self.headers['X-CSRF-Token']}).status_code,403)
  self.assertEqual(self.client.post('/api/oauth/x/start',headers={'Origin':'http://localhost'}).status_code,403)
  for path in ['/.env','/.env.example','/backend/core.py','/backend/requirements.txt','/assets/%2e%2e/backend/core.py','/openapi.json','/docs']:
   self.assertEqual(self.client.get(path).status_code,404,path)
  self.assertNotIn('access-control-allow-origin',self.client.get('/api/auth/me').headers)
  self.assertEqual(self.client.get('/api/auth/me').headers['cache-control'],'no-store')
  self.assertIn('HttpOnly',self.client.post('/api/auth/login',json={'email':'owner1@example.com','password':PASSWORD},headers={'Origin':'http://localhost'}).headers['set-cookie'])
  self.client.cookies.clear();self.assertEqual(self.client.get('/api/connections').status_code,401)
 def test_02_all_oauth_adapters_selection_and_replay(self):
  for p in ['linkedin','meta','youtube','threads','x']:
   flow,assets,state=self.oauth(p);self.assertGreater(len(assets),0)
   self.assertNotIn(TOKEN,json.dumps(assets));self.assertNotIn('credentials',json.dumps(assets))
   rejected=self.post('/api/connections/complete',{'flow':flow,'accounts':['not-returned-by-provider']});self.assertEqual(rejected.status_code,400)
   selected=assets[0]['external_id'];saved=self.post('/api/connections/complete',{'flow':flow,'accounts':[selected]});self.assertEqual(saved.status_code,200,saved.text)
   self.assertEqual(saved.json()['connections'][0]['status'],'connected');self.assertNotIn(TOKEN,saved.text)
   self.assertEqual(self.post('/api/connections/complete',{'flow':flow,'accounts':[selected]}).status_code,404)
   count=len(self.calls);replay=self.client.get('/api/oauth/'+p+'/callback',params={'state':state,'code':'FAKE_CODE'},follow_redirects=False)
   self.assertIn('invalid_state',replay.headers['location']);self.assertEqual(count,len(self.calls))
  records=self.client.get('/api/connections').json()['connections'];self.assertEqual(len(records),5)
  self.assertFalse(any(a['external_id'] in ('instagram:ig-1','facebook:fb-2') for a in records))
  self.assertNotIn(TOKEN,self.db.path.read_bytes().decode('latin1'))
  self.assertNotIn('FAKE_REFRESH_TOKEN',self.db.path.read_bytes().decode('latin1'))
  for p in ['x','youtube']:
   request=next(req for req in reversed(self.calls) if req.method=='POST' and ('/token' in req.url.path) and parse_qs(req.content.decode()).get('code_verifier'))
   self.assertIn('code_verifier',parse_qs(request.content.decode()))
 def test_03_telegram_discord_wordpress_whatsapp(self):
  bodies={'telegram':{'token':BOT,'chat_id':'@test_channel'},'discord':{'webhook_url':'https://discord.com/api/webhooks/1234567890123456/'+WEB},'wordpress':{'site_url':'https://wp.example.com/blog','username':'TEST_user','application_password':'FAKE_APPLICATION_PASSWORD'},'whatsapp':{'token':TOKEN,'waba_id':'123456789','phone_id':'12345678'}}
  dns=[(socket.AF_INET,socket.SOCK_STREAM,6,'',('93.184.216.34',443))]
  with patch('backend.providers.resolve_public_host',new=AsyncMock(return_value=dns)):
   for p,data in bodies.items():
    r=self.post('/api/connections/'+p+'/credential',data);self.assertEqual(r.status_code,200,r.text);id=r.json()['connection']['id']
    r2=self.post('/api/connections/'+id+'/verify');self.assertEqual(r2.status_code,200,r2.text)
    self.assertNotIn(TOKEN,r.text+r2.text);self.assertNotIn(BOT,r.text+r2.text);self.assertNotIn(WEB,r.text+r2.text)
  self.assertEqual(len(self.client.get('/api/connections').json()['connections']),4)
  self.assertNotIn(BOT,self.db.path.read_bytes().decode('latin1'))
 def test_04_failure_does_not_create_connection(self):
  type(self).forced=401;r=self.post('/api/connections/telegram/credential',{'token':BOT,'chat_id':'@test_channel'})
  self.assertEqual(r.status_code,400);self.assertEqual(self.client.get('/api/connections').json()['connections'],[])
  type(self).forced=None
  for u in ['https://evil.example/webhook','http://discord.com/api/webhooks/1234567890123456/'+WEB,'https://discord.com@127.0.0.1/api/webhooks/1234567890123456/'+WEB]:
   r=self.post('/api/connections/discord/credential',{'webhook_url':u});self.assertEqual(r.status_code,400)
  sensitive='SECRETVALUE'*501;r=self.post('/api/connections/telegram/credential',{'token':sensitive,'chat_id':'test'})
  self.assertEqual(r.status_code,422);self.assertNotIn('SECRETVALUE',r.text)
 def test_05_wordpress_ssrf_no_redirects(self):
  initial=len(self.calls)
  for url in ['http://wp.example.com','https://unlisted.example','https://user:pass@wp.example.com','https://wp.example.com:444','https://wp.example.com/%2e%2e','https://wp.example.com?url=x']:
   r=self.post('/api/connections/wordpress/credential',{'site_url':url,'username':'test','application_password':'test'});self.assertEqual(r.status_code,400)
  with patch('backend.providers.resolve_public_host',new=AsyncMock(return_value=[(socket.AF_INET,socket.SOCK_STREAM,6,'',('10.0.0.1',443))])):
   r=self.post('/api/connections/wordpress/credential',{'site_url':'https://private.example.com','username':'test','application_password':'test'});self.assertEqual(r.status_code,400)
  self.assertEqual(initial,len(self.calls))
 def test_06_workspace_isolation(self):
  flow,assets,_=self.oauth('linkedin');saved=self.post('/api/connections/complete',{'flow':flow,'accounts':[assets[0]['external_id']]}).json()['connections'][0]
  flow2,_,_=self.oauth('youtube')
  r=self.client.post('/api/auth/login',json={'email':'owner2@example.com','password':PASSWORD},headers={'Origin':'http://localhost'});self.headers['X-CSRF-Token']=r.json()['csrf']
  self.assertEqual(self.client.get('/api/connections').json()['connections'],[])
  self.assertEqual(self.post('/api/connections/'+saved['id']+'/verify').status_code,404)
  self.assertEqual(self.client.delete('/api/connections/'+saved['id'],headers=self.headers).status_code,404)
  self.assertEqual(self.client.get('/api/pending/'+flow2).status_code,404)
  self.assertEqual(self.post('/api/connections/complete',{'flow':flow2,'accounts':['yt-1']}).status_code,404)
 def test_07_refresh_and_reconnect_status(self):
  for provider in ['youtube','x','threads']:
   flow,assets,_=self.oauth(provider);r=self.post('/api/connections/complete',{'flow':flow,'accounts':[assets[0]['external_id']]}).json()['connections'][0]
   with self.db.open() as c:c.execute('UPDATE connections SET expires_at=? WHERE id=?',(now()-10,r['id']))
   checked=self.post('/api/connections/'+r['id']+'/verify');self.assertEqual(checked.status_code,200,checked.text)
   self.assertGreater(checked.json()['connection']['expires_at'],now())
  type(self).forced=401;r=self.post('/api/connections/'+r['id']+'/verify');self.assertEqual(r.status_code,400)
  rows=self.client.get('/api/connections').json()['connections'];self.assertTrue(any(x['status']=='needs_reconnect' for x in rows))
 def test_08_expired_state_and_cancellation(self):
  r=self.post('/api/oauth/x/start');state=parse_qs(urlsplit(r.json()['authorization_url']).query)['state'][0]
  with self.db.open() as c:c.execute('UPDATE oauth_states SET expires_at=0')
  r=self.client.get('/api/oauth/x/callback',params={'state':state,'code':'CODE'},follow_redirects=False);self.assertIn('invalid_state',r.headers['location'])
  flow,assets,_=self.oauth('meta');r=self.client.delete('/api/pending/'+flow,headers=self.headers);self.assertEqual(r.status_code,200)
  self.assertEqual(self.client.get('/api/pending/'+flow).status_code,404)
  self.assertEqual(self.client.get('/api/connections').json()['connections'],[])
 def test_09_local_remove_does_not_call_provider(self):
  r=self.post('/api/connections/discord/credential',{'webhook_url':'https://discord.com/api/webhooks/1234567890123456/'+WEB}).json()['connection'];count=len(self.calls)
  deleted=self.client.delete('/api/connections/'+r['id'],headers=self.headers);self.assertEqual(deleted.status_code,200);self.assertIn('Revoke',deleted.json()['notice']);self.assertEqual(count,len(self.calls))
  self.assertEqual(self.client.get('/api/connections').json()['connections'],[])
 def test_10_missing_configuration(self):
  old=self.cfg.values['LINKEDIN_CLIENT_SECRET'];self.cfg.values['LINKEDIN_CLIENT_SECRET']=''
  try:
   r=self.post('/api/oauth/linkedin/start');self.assertEqual(r.status_code,400);self.assertEqual(r.json()['code'],'setup_required')
   row=next(x for x in self.client.get('/api/providers').json()['providers'] if x['id']=='linkedin');self.assertFalse(row['configured']);self.assertIn('LINKEDIN_CLIENT_SECRET',row['missing'])
  finally:self.cfg.values['LINKEDIN_CLIENT_SECRET']=old
  # Environment secret values are never returned in the authenticated catalog.
  self.assertNotIn('FAKE_META_CLIENT_SECRET',self.client.get('/api/providers').text)
 def test_11_production_cookie_and_https_gate(self):
  from cryptography.fernet import Fernet
  with tempfile.TemporaryDirectory() as d:
   with self.assertRaises(RuntimeError):Settings(Path(d),'http://localhost',True).prepare()
   cfg=Settings(Path(d),'https://localhost',True,key=Fernet.generate_key().decode())
   app=create_app(cfg,httpx.MockTransport(lambda r:httpx.Response(500)))
   create_owner(app.state.db,'prod@example.com',PASSWORD)
   with TestClient(app,base_url='https://localhost') as client:
    r=client.post('/api/auth/login',json={'email':'prod@example.com','password':PASSWORD},headers={'Origin':'https://localhost'})
    self.assertEqual(r.status_code,200,r.text);cookie=r.headers['set-cookie'];self.assertIn('__Host-makagent_session=',cookie);self.assertIn('Secure',cookie);self.assertIn('HttpOnly',cookie);self.assertIn('SameSite=lax',cookie)
 def test_12_request_limit_and_logout(self):
  r=self.client.post('/api/auth/login',content=b'x'*21000,headers={'Origin':'http://localhost','Content-Type':'application/json'});self.assertEqual(r.status_code,413)
  self.assertEqual(self.post('/api/auth/logout').status_code,200);self.assertEqual(self.client.get('/api/auth/me').status_code,401)

 def test_13_safe_expired_grant_mapping(self):
  import asyncio
  async def check():
   async with httpx.AsyncClient(transport=httpx.MockTransport(lambda r:httpx.Response(400,json={'error':{'code':190,'message':TOKEN}},request=r))) as client:
    with self.assertRaises(P.ProviderError) as caught:await P.api(client,'GET','https://graph.facebook.com/v99.0/me')
    self.assertEqual(caught.exception.code,'authorization_rejected');self.assertNotIn(TOKEN,caught.exception.message)
  asyncio.run(check())
 def test_14_failed_login_throttle(self):
  self.client.cookies.clear()
  statuses=[]
  for i in range(11):
   r=self.client.post('/api/auth/login',json={'email':'missing@example.com','password':'wrong-test-only'},headers={'Origin':'http://localhost'});statuses.append(r.status_code)
  self.assertEqual(statuses[:10],[401]*10);self.assertEqual(statuses[-1],429)

if __name__=='__main__':unittest.main(verbosity=2)
