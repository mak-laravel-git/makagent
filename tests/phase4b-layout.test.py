from pathlib import Path
from playwright.sync_api import sync_playwright
BASE='http://127.0.0.1:8080/'
ROOT=Path(__file__).resolve().parents[1]
ROUTES=['usage','ai-config','monitoring','templates','support','compliance','settings']
with sync_playwright() as p:
 b=p.chromium.launch(args=['--no-sandbox']);q=b.new_page(viewport={'width':1280,'height':900});q.set_default_timeout(7000);errors=[];q.on('pageerror',lambda e:errors.append(str(e)));q.goto(BASE+'login.html',wait_until='networkidle');q.evaluate("Store.reset();Store.login('admin')")
 def fit(label):
  q.wait_for_timeout(80);assert not q.evaluate('document.documentElement.scrollWidth>innerWidth'),(label,q.evaluate('document.documentElement.scrollWidth'))
 for width in [360,768,1280]:
  q.set_viewport_size({'width':width,'height':900})
  for theme in ['light','dark']:
   q.evaluate('(t)=>Store.set("theme",t)',theme)
   for route in ROUTES:
    q.goto(BASE+'admin/'+route+'.html',wait_until='networkidle');q.locator('.page-heading h1').wait_for();fit((width,theme,route))
    if route in ['compliance','settings']:
     names=['Consent logs','Policies','Audit log'] if route=='compliance' else ['Email previews','Admin access','API & webhook','Data & reset']
     for name in names:q.get_by_role('tab',name=name,exact=True).click();fit((width,theme,route,name))
    assert 'undefined' not in q.locator('#app-content').inner_text(),(width,theme,route)
    if route in ['usage','ai-config'] and width in [360,1280]:q.screenshot(path=str(ROOT.parent/('phase4b-'+route+'-'+str(width)+'-'+theme+'.png')),full_page=True)
 print('Phase 4B layout PASS — seven routes and every settings/compliance section at 360/768/1280, light/dark; no page overflow.')
 q.goto((ROOT/'login.html').as_uri(),wait_until='networkidle');q.evaluate("Store.reset();Store.login('admin')")
 for route in ROUTES:
  q.goto((ROOT/'admin'/(route+'.html')).as_uri(),wait_until='networkidle');q.locator('.page-heading h1').wait_for()
 q.reload(wait_until='networkidle');q.locator('.page-heading h1').wait_for();assert q.evaluate('Store.session().role')=='admin';assert not errors,errors
 print('Phase 4B file:// PASS — all seven pages, persistent session, no captured JavaScript exceptions.');b.close()
