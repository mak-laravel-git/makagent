"""Chromium UI + ASGI backend bridge, with explicitly mocked upstream providers.
No live authorization is claimed. A running source server on 8082 serves assets only.
"""
import importlib.util,json,sys
from pathlib import Path
from playwright.sync_api import sync_playwright
R=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('connection_fixture',R/'tests/backend.test.py');fixture=importlib.util.module_from_spec(spec);spec.loader.exec_module(fixture)
T=fixture.ConnectionTests;T.setUpClass()
try:
 with T.db.open() as c:
  for table in ['limits','connections','pending','oauth_states']:c.execute('DELETE FROM '+table)
 T.client.cookies.clear()
 with sync_playwright() as p:
  b=p.chromium.launch();q=b.new_page(viewport={'width':1440,'height':1000});q.set_default_timeout(7000);errors=[];q.on('pageerror',lambda e:errors.append(str(e)))
  def bridge(route):
   req=route.request;headers={k:v for k,v in req.all_headers().items() if k.lower() not in ['content-length','accept-encoding','connection']};headers['host']='127.0.0.1:8082'
   path=req.url.split('127.0.0.1:8082',1)[1]
   response=T.client.request(req.method,path,content=req.post_data_buffer,headers=headers,follow_redirects=False)
   route.fulfill(status=response.status_code,headers={k:v for k,v in response.headers.items() if k.lower() not in ['content-length','transfer-encoding','content-encoding']},body=response.content)
  q.route('**/api/**',bridge);q.goto('http://127.0.0.1:8082/app/connections.html',wait_until='networkidle')
  assert q.locator('.provider-card').count()==9;assert q.locator('#live-email').is_enabled();assert q.locator('[data-provider=linkedin]').is_disabled()
  q.locator('#live-email').fill('owner1@example.com');q.locator('#live-password').fill(fixture.PASSWORD);q.locator('#live-auth-form .primary').click();q.locator('.live-session').wait_for();assert 'owner1@example.com' in q.locator('.live-session').inner_text()
  for id in ['linkedin','meta','youtube','threads','x','telegram','discord','wordpress','whatsapp']:
   q.locator('[data-guide='+id+']').click();assert q.get_by_role('dialog').count()==1;assert len(q.get_by_role('dialog').inner_text())>250;q.keyboard.press('Escape')
  q.locator('[data-provider=telegram]').click();q.locator('[name=token]').fill(fixture.BOT);q.locator('[name=chat_id]').fill('@test_channel');assert q.locator('[name=token]').get_attribute('type')=='password';q.get_by_role('button',name='Verify & save connection',exact=True).click();q.get_by_role('dialog').wait_for(state='detached');assert 'TEST Telegram Channel' in q.locator('.live-accounts').inner_text();assert q.locator('.live-account').count()==1
  assert fixture.BOT not in q.evaluate('JSON.stringify(localStorage)');assert fixture.BOT not in q.evaluate('JSON.stringify(sessionStorage)')
  q.reload(wait_until='networkidle');q.locator('.live-account').wait_for();q.locator('[data-verify]').click();q.wait_for_timeout(200);assert 'Verified' in q.locator('.live-account').inner_text()
  # Open an encrypted, staged OAuth account selection via real ASGI endpoints.
  headers={'Origin':'http://localhost','X-CSRF-Token':T.client.get('/api/auth/me').json()['csrf']}
  start=T.client.post('/api/oauth/meta/start',headers=headers).json()['authorization_url']
  from urllib.parse import parse_qs,urlsplit
  state=parse_qs(urlsplit(start).query)['state'][0]
  cb=T.client.get('/api/oauth/meta/callback',params={'state':state,'code':'FAKE_CODE_NOT_LIVE'},follow_redirects=False)
  flow=parse_qs(urlsplit(cb.headers['location']).query)['flow'][0]
  q.goto('http://127.0.0.1:8082/app/connections.html?flow='+flow,wait_until='networkidle');q.get_by_role('dialog').wait_for();assert q.locator('#live-picker input').count()==3
  q.locator('#live-picker input').first.check();q.get_by_role('button',name='Save selected accounts',exact=True).click();q.get_by_role('dialog').wait_for(state='detached');q.wait_for_timeout(150);assert q.locator('.live-account').count()==2;assert 'TEST Unselected Page' not in q.locator('.live-accounts').inner_text()
  for theme in ['light','dark']:
   q.evaluate('(t)=>{Store.set("theme",t);UI.theme.apply()}',theme)
   for width in [360,768,1280]:
    q.set_viewport_size({'width':width,'height':900});q.wait_for_timeout(120);assert not q.evaluate('document.documentElement.scrollWidth>innerWidth'),(theme,width)
  # A prototype reset has no authority over server credentials/session.
  q.evaluate('Store.reset()');q.reload(wait_until='networkidle');q.locator('.live-session').wait_for();assert q.locator('.live-account').count()==2
  q.locator('[data-remove]').first.click();q.get_by_role('button',name='Confirm action',exact=True).click();q.wait_for_timeout(200);assert q.locator('.live-account').count()==1
  q.locator('#live-audit').click();assert 'connection removed locally' in q.get_by_role('dialog').inner_text();q.keyboard.press('Escape')
  q.locator('#live-logout').click();q.locator('#live-auth-form').wait_for();assert q.locator('.live-account').count()==0
  assert not errors,errors
  print('PASS — Chromium + actual ASGI routing/session/CSRF/encrypted DB through mocked provider APIs: 9 cards/guides, secure sign-in, Telegram verification, saved reload, explicit Meta selection, no token localStorage, verify/remove/audit/logout, demo-reset isolation, 6 theme/width layouts.')
  # Native offline/file mode is visibly nonfunctional and never accepts a token.
  off=b.new_page();off.goto((R/'app/connections.html').as_uri(),wait_until='networkidle');off.get_by_text('Start the real connection service.',exact=True).wait_for();assert off.locator('[data-provider]:not(:disabled)').count()==0;assert off.locator('[name=token]').count()==0;assert off.locator('.provider-card').count()==9
  print('PASS — file:// explains backend requirement, keeps guides available, disables credential entry; no fake connection success.')
  b.close()
finally:T.tearDownClass()
