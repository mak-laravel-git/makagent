from pathlib import Path
from playwright.sync_api import sync_playwright
BASE='http://127.0.0.1:8080/'
ROOT=Path(__file__).resolve().parents[1]
ROUTES=['overview','clients','client-detail','channels','meta-status','plans','billing']
with sync_playwright() as p:
 b=p.chromium.launch(args=['--no-sandbox']);page=b.new_page(viewport={'width':1280,'height':900});errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.goto(BASE+'login.html',wait_until='networkidle');page.evaluate("Store.reset();Store.login('admin')")
 for width in [360,768,1280]:
  page.set_viewport_size({'width':width,'height':900})
  for theme in ['light','dark']:
   page.evaluate('(theme)=>Store.set("theme",theme)',theme)
   for route in ROUTES:
    page.goto(BASE+'admin/'+route+'.html'+('?id=cl-2' if route=='client-detail' else ''),wait_until='networkidle');page.locator('.page-heading h1').wait_for();page.wait_for_timeout(160)
    assert not page.evaluate('document.documentElement.scrollWidth>innerWidth'),(width,theme,route,page.evaluate('document.documentElement.scrollWidth'))
    assert not page.locator('body').inner_text().count('undefined'),(width,theme,route)
    if route=='overview' or (width==360 and route=='meta-status'):page.screenshot(path=str(ROOT.parent/('phase4a-'+route+'-'+str(width)+'-'+theme+'.png')),full_page=True)
 print('Phase 4A layout: seven routes × three widths × both themes PASS')
 # Direct file opening (CDNs permitted; no application fetch/build dependencies).
 page.goto((ROOT/'login.html').as_uri(),wait_until='networkidle');page.evaluate("Store.reset();Store.login('admin')");
 for route in ROUTES:
  page.goto((ROOT/'admin'/(route+'.html')).as_uri()+('?id=cl-2' if route=='client-detail' else ''),wait_until='networkidle');page.locator('.page-heading h1').wait_for();assert page.locator('#app-content').inner_text().strip()
 page.reload(wait_until='networkidle');page.locator('.page-heading h1').wait_for();assert page.evaluate('Store.session().role')=='admin'
 assert not errors,errors
 print('Phase 4A file:// and persisted admin session PASS');b.close()
