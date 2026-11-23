"""Live read/identity adapters. No send, publish, approval or mock success paths."""
from __future__ import annotations
import asyncio, base64, hashlib, ipaddress, json, re, socket
from urllib.parse import urlencode, urlsplit, quote
import httpx
from .core import now

class ProviderError(Exception):
    def __init__(self, code, message): self.code=code;self.message=message;super().__init__(code)

# Minimum connection/identity scopes, not publishing permissions.
OAUTH = {
 'linkedin':{'env':'LINKEDIN','authorize':'https://www.linkedin.com/oauth/v2/authorization','token':'https://www.linkedin.com/oauth/v2/accessToken','scope':'openid profile email'},
 'meta':{'env':'META','scope':'pages_show_list pages_read_engagement instagram_basic'},
 'youtube':{'env':'GOOGLE','authorize':'https://accounts.google.com/o/oauth2/v2/auth','token':'https://oauth2.googleapis.com/token','scope':'https://www.googleapis.com/auth/youtube.readonly'},
 'threads':{'env':'THREADS','authorize':'https://www.threads.com/oauth/authorize','token':'https://graph.threads.net/oauth/access_token','scope':'threads_basic'},
 'x':{'env':'X','authorize':'https://x.com/i/oauth2/authorize','token':'https://api.x.com/2/oauth2/token','scope':'tweet.read users.read offline.access'},
}
CATALOG = [
 {'id':'linkedin','name':'LinkedIn','icon':'briefcase-business','description':'Authorize a member profile and verify its identity. Multiple profiles can be linked separately.','method':'oauth'},
 {'id':'meta','name':'Facebook & Instagram','icon':'messages-square','description':'Choose Facebook Pages and the Instagram professional accounts linked to them.','method':'oauth'},
 {'id':'youtube','name':'YouTube','icon':'video','description':'Authorize Google, then choose a YouTube channel. Read-only channel verification.','method':'oauth'},
 {'id':'threads','name':'Threads','icon':'at-sign','description':'Authorize a Threads profile and verify the connected username.','method':'oauth'},
 {'id':'x','name':'X (Twitter)','icon':'hash','description':'Connect an X profile using OAuth with PKCE. Provider access and charges may apply.','method':'oauth'},
 {'id':'telegram','name':'Telegram','icon':'send','description':'Verify your bot and a channel or group where that bot is an administrator.','method':'credential'},
 {'id':'discord','name':'Discord','icon':'headphones','description':'Verify a channel’s incoming webhook. No developer app is needed for this flow.','method':'credential'},
 {'id':'wordpress','name':'WordPress','icon':'globe','description':'Verify a self-hosted HTTPS WordPress site with a dedicated Application Password.','method':'credential'},
 {'id':'whatsapp','name':'WhatsApp Business','icon':'message-circle','description':'Verify a Cloud API phone number belonging to your WABA using a system-user token.','method':'credential'},
]

def version(cfg, key='META_GRAPH_VERSION'):
    value=cfg.env(key)
    if not re.fullmatch(r'v\d{1,3}\.\d{1,2}',value):raise ProviderError('setup_required','Set a supported API version in the backend environment.')
    return value

def catalog(cfg):
    result=[]
    for item in CATALOG:
        item=dict(item);p=item['id'];required=[]
        if p in OAUTH:
            prefix=OAUTH[p]['env'];required=[prefix+'_CLIENT_ID',prefix+'_CLIENT_SECRET']
        if p in ('meta','whatsapp'):required+=['META_GRAPH_VERSION']
        if p=='wordpress':required+=['WORDPRESS_ALLOWED_HOSTS']
        missing=[k for k in required if not cfg.env(k)]
        if p in ('meta','whatsapp') and cfg.env('META_GRAPH_VERSION') and not re.fullmatch(r'v\d{1,3}\.\d{1,2}',cfg.env('META_GRAPH_VERSION')):missing+=['META_GRAPH_VERSION (valid version)']
        item.update(configured=not missing,missing=missing,callback=cfg.callback(p) if p in OAUTH else None,scope=OAUTH.get(p,{}).get('scope'),docs={
         'linkedin':'https://learn.microsoft.com/en-us/linkedin/consumer/integrations/self-serve/sign-in-with-linkedin-v2',
         'meta':'https://developers.facebook.com/docs/facebook-login/',
         'youtube':'https://developers.google.com/youtube/data/guides/auth/server-side-web-apps',
         'threads':'https://www.postman.com/meta/threads/overview',
         'x':'https://docs.x.com/fundamentals/authentication/oauth-2-0/authorization-code',
         'telegram':'https://core.telegram.org/bots/api',
         'discord':'https://docs.discord.com/developers/resources/webhook',
         'wordpress':'https://developer.wordpress.org/rest-api/using-the-rest-api/authentication/',
         'whatsapp':'https://developers.facebook.com/docs/whatsapp/cloud-api/get-started'}[p])
        result.append(item)
    return result

def oauth_spec(cfg,p):
    if p not in OAUTH:raise ProviderError('unsupported_provider','This provider does not use this OAuth flow.')
    entry=next(x for x in catalog(cfg) if x['id']==p)
    if not entry['configured']:raise ProviderError('setup_required','Configure the provider environment before connecting.')
    s=dict(OAUTH[p]);s['client_id']=cfg.env(s['env']+'_CLIENT_ID');s['secret']=cfg.env(s['env']+'_CLIENT_SECRET')
    if p=='meta':
        v=version(cfg);s.update(authorize=f'https://www.facebook.com/{v}/dialog/oauth',token=f'https://graph.facebook.com/{v}/oauth/access_token')
    return s

def authorization(cfg,p,state,verifier):
    s=oauth_spec(cfg,p);args={'client_id':s['client_id'],'redirect_uri':cfg.callback(p),'response_type':'code','scope':s['scope'],'state':state}
    if p in ('x','youtube'):
        args.update(code_challenge=base64.urlsafe_b64encode(hashlib.sha256(verifier.encode()).digest()).decode().rstrip('='),code_challenge_method='S256')
    if p=='youtube':args.update(access_type='offline',prompt='consent',include_granted_scopes='true')
    if p in ('meta','threads'):args['scope']=s['scope'].replace(' ',',')
    if p=='meta' and cfg.env('META_LOGIN_CONFIG_ID'):
        config=cfg.env('META_LOGIN_CONFIG_ID')
        if not re.fullmatch(r'\d{5,30}',config):raise ProviderError('setup_required','Set a valid Facebook Login for Business configuration ID.')
        args['config_id']=config;args.pop('scope',None)
    return s['authorize']+'?'+urlencode(args)

async def _api_request(client,method,url,**kw):
    """Fixed provider URLs or explicitly allowlisted, DNS-pinned WordPress URLs only."""
    try:
        async with client.stream(method,url,**kw) as r:
            if r.status_code in (401,403):raise ProviderError('authorization_rejected','The provider rejected access. Reconnect or check the granted permissions.')
            if r.status_code==429:raise ProviderError('rate_limited','Provider rate limit reached. Wait before trying again; provider charges may apply.')
            if r.status_code==400:
                raw=bytearray()
                async for chunk in r.aiter_bytes():
                    raw.extend(chunk)
                    if len(raw)>1048576:raise ProviderError('response_too_large','Provider response exceeded the safety limit.')
                try:err=json.loads(raw).get('error')
                except (ValueError,AttributeError):err=None
                if (isinstance(err,dict) and err.get('code') in (10,102,190,200,299)) or (isinstance(err,str) and err in ('invalid_grant','invalid_token','access_denied')):
                    raise ProviderError('authorization_rejected','Provider access expired or was rejected. Reconnect and check the granted permissions.')
                if err=='invalid_client':raise ProviderError('setup_required','Provider app credentials were rejected. Check the server-side client configuration.')
                raise ProviderError('provider_error','The provider did not accept this request. Check setup, permissions and account access.')
            if not 200<=r.status_code<300:raise ProviderError('provider_error','The provider did not accept this request. Check setup, permissions and account access.')
            buf=bytearray()
            async for chunk in r.aiter_bytes():
                buf.extend(chunk)
                if len(buf)>1048576:raise ProviderError('response_too_large','Provider response exceeded the safety limit.')
            value=json.loads(buf)
            if not isinstance(value,dict):raise ValueError()
            if value.get('error'):raise ProviderError('provider_error','Provider returned an error. Check the app configuration and access grant.')
            return value
    except (httpx.HTTPError,TimeoutError):raise ProviderError('provider_unavailable','Cannot reach the provider securely. Try again later.') from None
    except (ValueError,TypeError):raise ProviderError('invalid_response','Provider response could not be verified.') from None

async def api(client,method,url,**kw):
    try:
        async with asyncio.timeout(25):return await _api_request(client,method,url,**kw)
    except TimeoutError:raise ProviderError('provider_unavailable','Provider request exceeded the overall timeout. Try again later.') from None

def bearer(token):return {'Authorization':'Bearer '+token}
def expiry(payload):return now()+int(payload['expires_in']) if payload.get('expires_in') else None

def candidate(provider,external,name,kind,credentials,expires=None):
    if not external or not name:raise ProviderError('invalid_response','Provider did not return a usable account identity.')
    return {'provider':provider,'external_id':str(external),'name':str(name)[:200],'kind':kind,'credentials':credentials,'expires_at':expires}

async def exchange(cfg,client,p,code,verifier):
    s=oauth_spec(cfg,p);data={'grant_type':'authorization_code','code':code,'redirect_uri':cfg.callback(p),'client_id':s['client_id']}
    kw={}
    if p=='x':data['code_verifier']=verifier;kw['auth']=httpx.BasicAuth(s['client_id'],s['secret'])
    else:data['client_secret']=s['secret']
    if p=='youtube':data['code_verifier']=verifier
    token=await api(client,'POST',s['token'],data=data,**kw)
    if not token.get('access_token'):raise ProviderError('invalid_response','Provider did not issue an access token.')
    if p=='meta':
        token=await api(client,'GET',s['token'],params={'grant_type':'fb_exchange_token','client_id':s['client_id'],'client_secret':s['secret'],'fb_exchange_token':token['access_token']})
    elif p=='threads':
        token=await api(client,'GET','https://graph.threads.net/access_token',params={'grant_type':'th_exchange_token','client_secret':s['secret'],'access_token':token['access_token']})
    if not token.get('access_token'):raise ProviderError('invalid_response','No usable provider access token was returned.')
    return token

async def discover(cfg,client,p,t):
    access=t['access_token'];exp=expiry(t);credentials={'oauth':t,'access_token':access}
    if p=='linkedin':
        d=await api(client,'GET','https://api.linkedin.com/v2/userinfo',headers=bearer(access))
        return [candidate(p,d.get('sub'),d.get('name') or d.get('email'),'member',credentials,exp)]
    if p=='x':
        d=(await api(client,'GET','https://api.x.com/2/users/me',headers=bearer(access))) .get('data',{})
        return [candidate(p,d.get('id'),d.get('username') or d.get('name'),'profile',credentials,exp)]
    if p=='threads':
        v=cfg.env('THREADS_API_VERSION') or 'v1.0'
        if not re.fullmatch(r'v\d{1,3}\.\d{1,2}',v):raise ProviderError('setup_required','Set a valid Threads API version.')
        d=await api(client,'GET',f'https://graph.threads.net/{v}/me',headers=bearer(access),params={'fields':'id,username'})
        return [candidate(p,d.get('id'),d.get('username'),'profile',credentials,exp)]
    if p=='youtube':
        d=await api(client,'GET','https://www.googleapis.com/youtube/v3/channels',headers=bearer(access),params={'part':'snippet','mine':'true','maxResults':50})
        return [candidate(p,c.get('id'),c.get('snippet',{}).get('title'),'channel',credentials,exp) for c in d.get('items',[])]
    if p=='meta':
        output=[];cursor=None
        for _ in range(10):
            params={'fields':'id,name,access_token,instagram_business_account{id,username}','limit':50}
            if cursor:params['after']=cursor
            d=await api(client,'GET',f'https://graph.facebook.com/{version(cfg)}/me/accounts',headers=bearer(access),params=params)
            for page in d.get('data',[]):
                if not page.get('access_token'):continue
                creds={'access_token':page['access_token'],'asset_id':str(page.get('id'))}
                output.append(candidate(p,'facebook:'+str(page.get('id')),page.get('name'),'facebook_page',creds,exp))
                ig=page.get('instagram_business_account')
                if ig:output.append(candidate(p,'instagram:'+str(ig.get('id')),ig.get('username') or 'Instagram '+str(ig.get('id')),'instagram',{'access_token':access,'asset_id':str(ig.get('id'))},exp))
            cursor=d.get('paging',{}).get('cursors',{}).get('after') if d.get('paging',{}).get('next') else None
            if not cursor:break
        if cursor:raise ProviderError('too_many_accounts','Too many Pages for a single discovery request. Limit the assets granted and reconnect.')
        return output
    raise ProviderError('unsupported_provider','Unsupported provider.')

async def resolve_public_host(host):
    return await asyncio.get_running_loop().getaddrinfo(host,443,type=socket.SOCK_STREAM)

async def wp_target(cfg,site):
    try:
        u=urlsplit(site);host=(u.hostname or '').lower().encode('idna').decode()
        allowed={s.strip().lower().encode('idna').decode() for s in cfg.env('WORDPRESS_ALLOWED_HOSTS').split(',') if s.strip()}
        if u.scheme!='https' or not host or host not in allowed or u.username or u.password or u.query or u.fragment or u.port not in (None,443) or '%' in u.path or '..' in u.path or '\\' in site:raise ValueError()
        infos=await asyncio.wait_for(resolve_public_host(host),timeout=8)
        addresses={ipaddress.ip_address(i[4][0]) for i in infos}
        if not addresses or any(not ip.is_global or (getattr(ip,'ipv4_mapped',None) and not ip.ipv4_mapped.is_global) for ip in addresses):raise ValueError()
        ip=sorted(str(x) for x in addresses)[0];netloc='['+ip+']' if ':' in ip else ip
        # Pin the validated address, keep original TLS certificate verification/SNI.
        path=u.path.rstrip('/')+'/wp-json/wp/v2/users/me'
        return 'https://'+netloc+path,host,'https://'+host+u.path.rstrip('/')
    except (ValueError,UnicodeError,OSError):raise ProviderError('unsafe_site','Use an operator-allowlisted public HTTPS WordPress hostname on port 443, without redirects or query strings.') from None

async def manual(cfg,client,p,data):
    if p=='telegram':
        token=data.get('token','').strip();chat=data.get('chat_id','').strip()
        if not re.fullmatch(r'\d{5,20}:[A-Za-z0-9_-]{20,150}',token) or not re.fullmatch(r'(?:-?\d{1,25}|@[A-Za-z0-9_]{5,50})',chat):raise ProviderError('invalid_credentials','Enter a valid bot token and channel/group ID.')
        async def call(method,**params):
            d=await api(client,'POST',f'https://api.telegram.org/bot{token}/{method}',data=params)
            if not d.get('ok'):raise ProviderError('authorization_rejected','Telegram did not authorize the bot/channel combination.')
            return d.get('result',{})
        bot=await call('getMe');c=await call('getChat',chat_id=chat)
        if not bot.get('is_bot') or not bot.get('id') or not c.get('id') or c.get('type') not in ('channel','supergroup','group'):raise ProviderError('invalid_channel','Choose a channel or group, not a private user chat.')
        membership=await call('getChatMember',chat_id=str(c['id']),user_id=str(bot['id']))
        if membership.get('status') not in ('creator','administrator') or (c['type']=='channel' and membership.get('can_post_messages') is not True):raise ProviderError('missing_permission','Make the bot an administrator with channel-posting permission before connecting.')
        return candidate(p,str(bot['id'])+':'+str(c['id']),c.get('title') or c.get('username'),'bot_channel',{'token':token,'chat_id':str(c['id'])})
    if p=='discord':
        url=data.get('webhook_url','').strip();m=re.fullmatch(r'https://discord\.com/api/(?:v10/)?webhooks/(\d{10,25})/([A-Za-z0-9._-]{20,300})/?',url)
        if not m:raise ProviderError('invalid_webhook','Use an official discord.com incoming webhook URL, without query strings.')
        d=await api(client,'GET',f'https://discord.com/api/v10/webhooks/{m[1]}/{m[2]}')
        if str(d.get('id'))!=m[1] or d.get('type')!=1 or not d.get('channel_id'):raise ProviderError('invalid_webhook','This is not a verified incoming channel webhook.')
        return candidate(p,m[1],d.get('name') or 'Discord channel '+str(d['channel_id']),'webhook',{'webhook_id':m[1],'token':m[2]})
    if p=='wordpress':
        url,host,base=await wp_target(cfg,data.get('site_url','').strip());username=data.get('username','').strip();password=data.get('application_password','').strip()
        if not username or not password:raise ProviderError('invalid_credentials','Enter the site username and a dedicated Application Password, not your main password.')
        d=await api(client,'GET',url,headers={'Host':host,'Connection':'close'},extensions={'sni_hostname':host},auth=httpx.BasicAuth(username,password),params={'context':'edit'})
        if not d.get('id'):raise ProviderError('invalid_response','WordPress did not return the authenticated user.')
        return candidate(p,base+':'+str(d['id']),host+' · '+str(d.get('name') or username),'site',{'site_url':base,'username':username,'application_password':password})
    if p=='whatsapp':
        token=data.get('token','').strip();waba=data.get('waba_id','').strip();phone=data.get('phone_id','').strip()
        if not token or not re.fullmatch(r'\d{5,30}',waba) or not re.fullmatch(r'\d{5,30}',phone):raise ProviderError('invalid_credentials','Enter the system-user access token, WABA ID and phone-number ID.')
        found=None;cursor=None
        for _ in range(10):
            params={'fields':'id,display_phone_number,verified_name','limit':50}
            if cursor:params['after']=cursor
            d=await api(client,'GET',f'https://graph.facebook.com/{version(cfg)}/{waba}/phone_numbers',headers=bearer(token),params=params)
            found=next((a for a in d.get('data',[]) if str(a.get('id'))==phone),None)
            if found:break
            cursor=d.get('paging',{}).get('cursors',{}).get('after') if d.get('paging',{}).get('next') else None
            if not cursor:break
        if not found:raise ProviderError('missing_phone','That phone-number ID was not found in the accessible WABA. No connection was saved.')
        return candidate(p,phone,found.get('display_phone_number') or found.get('verified_name'),'business_phone',{'token':token,'waba_id':waba,'phone_id':phone})
    raise ProviderError('unsupported_provider','This provider requires OAuth.')

async def verify(cfg,client,row,creds):
    p=row['provider'];expires=row['expires_at']
    if p not in OAUTH:
        if p=='discord':creds={'webhook_url':'https://discord.com/api/webhooks/'+creds['webhook_id']+'/'+creds['token']}
        return await manual(cfg,client,p,creds)
    if expires and expires<=now()+60:
        if p in ('youtube','x') and creds.get('oauth',{}).get('refresh_token'):
            s=oauth_spec(cfg,p);data={'grant_type':'refresh_token','refresh_token':creds['oauth']['refresh_token'],'client_id':s['client_id']};kw={}
            if p=='x':kw['auth']=httpx.BasicAuth(s['client_id'],s['secret'])
            else:data['client_secret']=s['secret']
            t=await api(client,'POST',s['token'],data=data,**kw)
            if not t.get('access_token'):raise ProviderError('authorization_rejected','Token renewal failed; reconnect this account.')
            t.setdefault('refresh_token',creds['oauth']['refresh_token']);creds={'oauth':t,'access_token':t['access_token']};expires=expiry(t)
        elif p=='threads':
            t=await api(client,'GET','https://graph.threads.net/refresh_access_token',params={'grant_type':'th_refresh_token','access_token':creds['access_token']})
            if not t.get('access_token'):raise ProviderError('authorization_rejected','Reconnect the Threads profile.')
            creds={'oauth':t,'access_token':t['access_token']};expires=expiry(t)
        else:raise ProviderError('authorization_rejected','The saved grant expired. Reconnect and authorize again.')
    if p=='meta':
        fields='id,username' if row['kind']=='instagram' else 'id,name'
        d=await api(client,'GET',f'https://graph.facebook.com/{version(cfg)}/{creds["asset_id"]}',headers=bearer(creds['access_token']),params={'fields':fields})
        if str(d.get('id'))!=creds['asset_id']:raise ProviderError('identity_changed','The provider identity no longer matches this connection.')
        return candidate(p,row['external_id'],d.get('username') or d.get('name'),row['kind'],creds,expires)
    values=await discover(cfg,client,p,creds.get('oauth',{'access_token':creds['access_token']}))
    found=next((x for x in values if x['external_id']==row['external_id']),None)
    if not found:raise ProviderError('identity_changed','The connected account is no longer accessible with this grant.')
    found['expires_at']=expires
    return found
