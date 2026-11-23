from pathlib import Path
from playwright.sync_api import sync_playwright
BASE='http://127.0.0.1:8080/'
with sync_playwright() as p:
 b=p.chromium.launch(args=['--no-sandbox']);page=b.new_page(viewport={'width':360,'height':900});errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto(BASE+'login.html',wait_until='networkidle');page.locator('#demo-admin').click();page.wait_for_url('**/admin/overview.html');page.locator('.page-heading h1').wait_for();assert page.evaluate('Store.session().role')=='admin';page.goto(BASE+'login.html',wait_until='networkidle');page.locator('#demo-client').click();page.wait_for_url('**/onboarding.html')
 page.evaluate("Store.reset();Store.login('client');Store.set('onboarding.step',2);Store.set('onboarding.maxStep',7)");page.reload(wait_until='networkidle')
 for code in ['role','instagram','expired']:
  page.evaluate('(code)=>Store.set("demo.connectionError",code)',code)
  page.locator('[data-connect=Facebook]').click();page.locator('#connect-next').click();page.locator('#connect-next').click()
  if code!='expired':page.locator('#connect-next').click()
  assert page.locator('#recover-connection').is_visible(),code
  assert not page.evaluate('document.documentElement.scrollWidth>innerWidth'),('connection-modal',code)
  page.locator('#recover-connection').click();page.locator('#connect-next').click()
  if code=='expired':page.locator('#connect-next').click()
  page.locator('#connect-next').click();assert page.get_by_role('dialog').count()==0
 # Real no-linked-Instagram selection, rather than only a scenario flag.
 page.evaluate("Store.set('channels',SEED.channels.map(c=>({...c,status:'Not connected'})))")
 page.locator('[data-connect=Instagram]').click();page.locator('#connect-next').click();page.locator('#connect-next').click();page.locator('input[value=page-dhaka]').uncheck();page.locator('input[value=page-food]').check();page.locator('#connect-next').click();assert 'not linked' in page.get_by_role('dialog').inner_text();page.locator('#recover-connection').click();page.locator('input[value=page-food]').uncheck();page.locator('input[value=page-dhaka]').check();page.locator('input[value=page-gadget]').check();page.locator('#connect-next').click();page.locator('#connect-next').click()
 # Finish linked Instagram checks for BOTH selected Pages.
 page.locator('#ig-access').check();page.get_by_role('button',name='Re-check access',exact=True).click();page.keyboard.press('Escape')
 page.locator('#instagram-checklist').click();page.locator('#ig-access').check();page.get_by_role('button',name='Re-check access',exact=True).click();page.keyboard.press('Escape')
 assert page.evaluate("Store.get('channels').filter(c=>c.type==='Instagram').every(c=>c.messageAccess)")
 fb=page.evaluate("Store.get('channels').find(c=>c.type==='Facebook').id")
 page.locator(f'[data-disconnect="{fb}"]').click();page.get_by_role('button',name='Confirm action',exact=True).click();assert page.evaluate('(id)=>Store.get("channels").find(c=>c.id===id).status',fb)=='Not connected'
 # Cancellation restores prior channel state.
 previous=page.evaluate("Store.get('channels')");page.locator('[data-connect=WhatsApp]').click();page.keyboard.press('Escape');assert previous==page.evaluate("Store.get('channels')")
 # Forgot password never sends an email; it renders an explicit simulation result.
 page.goto(BASE+'forgot-password.html',wait_until='networkidle');page.locator('[name=email]').fill('recover@demo.example');page.locator('#auth-form button').click();assert 'No email has been sent' in page.locator('#auth-card').inner_text()
 # Every current public link resolves; future dashboard targets are not dead anchor links.
 links=set()
 for route in ['index','pricing','login','signup','forgot-password','privacy','terms','data-deletion','onboarding']:
  page.goto(BASE+route+'.html',wait_until='networkidle');links.update(page.locator('a[href]').evaluate_all('(as)=>as.map(a=>a.getAttribute("href"))'))
 root=Path(__file__).resolve().parents[1]
 for link in links:
  if not link.startswith(('http','mailto:','#','data:')):assert (root/link.split('#')[0].split('?')[0]).exists(),link
 assert not errors,errors
 print('PASS — admin role session, missing-role/unlinked-Instagram/token-expiry recovery, actual unlinked Page guard, multiple Page Instagram checklists, confirmed disconnect, cancellation rollback, password recovery and current public links. Zero JS exceptions.')
 b.close()
