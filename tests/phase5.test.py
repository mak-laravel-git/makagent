"""Optional final workflow QA. Real controls; the coach does not manufacture success."""
from pathlib import Path
from playwright.sync_api import sync_playwright
import json
R=Path(__file__).resolve().parents[1]; BASE='http://127.0.0.1:8080/'
with sync_playwright() as p:
 b=p.chromium.launch(args=['--no-sandbox']);q=b.new_page(viewport={'width':1440,'height':1000});q.set_default_timeout(8000);errors=[];q.on('pageerror',lambda e:errors.append(str(e)))
 q.goto(BASE+'index.html',wait_until='networkidle');q.evaluate('Store.reset()');q.reload(wait_until='networkidle')
 original=q.evaluate('Store.get("products")');q.locator('#public-demo').click();q.locator('#guided-demo-launch').click();assert 'five-minute' in q.get_by_role('dialog').inner_text();q.get_by_role('button',name='Start signup story',exact=True).click();q.wait_for_url('**/signup.html');q.wait_for_timeout(600)
 assert q.evaluate('Store.get("products")')==original;assert q.locator('#auth-form [name=business]').input_value()=='';assert q.evaluate('Store.get("guidedTour.index")')==0
 for k,v in {'business':'Gazipur Styles','email':'owner@demo.example','phone':'01712345678','password':'demo12345'}.items():q.locator(f'[name={k}]').fill(v)
 q.locator('[name=terms]').check();q.locator('#auth-form button[type=submit]').click();q.wait_for_url('**/onboarding.html');q.wait_for_timeout(600);assert q.evaluate('Store.get("guidedTour.index")')==1
 # Coach cannot click through required setup. Follow the real wizard.
 assert q.locator('#tour-next').is_disabled();q.locator('#next').click();q.wait_for_timeout(550);assert q.evaluate('Store.get("guidedTour.index")')==2
 q.locator('[data-connect=Facebook]').click();q.wait_for_timeout(550);assert q.locator('#guided-coach').is_hidden()
 for _ in range(4):q.locator('#connect-next').click()
 q.locator('#instagram-checklist').click();q.locator('#ig-access').check();q.get_by_role('button',name='Re-check access',exact=True).click();q.keyboard.press('Escape')
 q.locator('[data-connect=WhatsApp]').click()
 for _ in range(3):q.locator('#wa-next').click()
 q.locator('#wa-phone').fill('01712345678');q.locator('#wa-next').click();q.locator('#wa-otp').fill('123456');q.locator('#wa-next').click();q.locator('#wa-consent').check();q.locator('#wa-next').click();q.locator('#wa-next').click();q.locator('#next').click();q.wait_for_timeout(550)
 for k,v in {'name':'Premium Blue Linen Shirt','price':'1490','stock':'20','colour':'Blue'}.items():q.locator('#manual-product [name='+k+']').fill(v)
 q.locator('#manual-product button').click();q.locator('#next').click();q.locator('#starter-faq').click();q.locator('#next').click();q.locator('#next').click();q.wait_for_timeout(550);assert q.evaluate('Store.get("guidedTour.index")')==6
 for message in ['Premium Blue Linen Shirt price','I want to order Premium Blue Linen Shirt','Rakib Hasan','01712345678','Tongi, Gazipur','2','M','Blue']:
  q.locator('#playground-input').fill(message);q.locator('#playground-form button').click();q.wait_for_timeout(750)
 assert q.evaluate('Store.get("orders").length')==1
 q.locator('#next').click();q.wait_for_timeout(550);q.locator('#tour-focus').click();q.locator('#go-live-toggle').check();q.get_by_role('button',name='Confirm',exact=True).click();q.locator('#open-dashboard').click();q.wait_for_url('**/app/overview.html');q.wait_for_timeout(650);assert q.evaluate('Store.get("guidedTour.index")')==8
 q.locator('#tour-expand').click();q.locator('#tour-next').click();q.wait_for_url('**/app/orders.html');q.wait_for_timeout(550);assert q.locator('#tour-next').is_disabled();q.locator('[data-order-move]').select_option('Confirmed');q.wait_for_timeout(550);q.locator('#tour-next').click();q.wait_for_url('**/app/inbox.html')
 q.locator('#simulate-incoming').click();q.locator('[name=incomingText]').fill('agent chai');q.get_by_role('button',name='Deliver demo message',exact=True).click();q.wait_for_timeout(1000);assert q.evaluate('Store.get("conversations")[0].status')=='Needs human';q.locator('#take-over').click();q.wait_for_timeout(550);q.locator('#tour-next').click();q.get_by_role('button',name='Confirm',exact=True).click();q.wait_for_url('**/admin/client-detail.html?*');assert q.evaluate('Store.session().role')=='admin';assert 'Gazipur Styles' in q.locator('#app-content').inner_text();q.wait_for_timeout(550)
 q.locator('#tour-next').click();q.wait_for_url('**/admin/meta-status.html');q.wait_for_timeout(550);q.locator('#tour-next').click();assert q.evaluate('Store.get("guidedTour.active")')==False;assert q.evaluate('Store.get("guidedTour.completedAt")');assert q.evaluate('Store.get("orders")[0].status')=='Confirmed';q.keyboard.press('Escape')
 print('PASS — full guided signup/FB/WA/product/knowledge/rules/playground order/go-live/kanban/handover/admin business/Meta story, without invented state; role switch explicitly confirmed.')
 # Empty catalog regression: marketing remains illustrative and usable.
 q.evaluate("Store.set('products',[])");q.goto(BASE+'index.html',wait_until='networkidle');assert q.locator('.hero h1').count()==1
 # Overlay replacement must not close the replacement; trap hidden inputs/background.
 q.goto(BASE+'components.html',wait_until='networkidle');q.locator('#open-modal').focus();q.evaluate('''UI.openModal({title:'First',body:'<input type="hidden" id="hidden-first"><input aria-label="Visible field">',actions:[{label:'Replace dialog',onClick:()=>UI.openModal({title:'Second',body:'<p>Replacement survives.</p>',actions:[{label:'Done'}]})}]})''');q.get_by_role('button',name='Replace dialog',exact=True).click();assert q.get_by_role('dialog').inner_text().startswith('Second');assert q.locator('#shell').evaluate('(e)=>e.inert');q.keyboard.press('Shift+Tab');assert q.evaluate('document.activeElement.textContent')=='Done';q.keyboard.press('Tab');assert q.evaluate('document.activeElement.hasAttribute("data-close")');q.keyboard.press('Escape');assert not q.locator('#shell').evaluate('(e)=>e.inert');assert q.evaluate('document.activeElement.id')=='open-modal'
 # Mobile sidebar: closed links cannot receive focus; Escape returns to menu.
 q.set_viewport_size({'width':360,'height':900});q.locator('#menu-toggle').click();assert q.locator('#menu-toggle').get_attribute('aria-expanded')=='true';q.keyboard.press('Escape');assert q.locator('#menu-toggle').get_attribute('aria-expanded')=='false';assert q.locator('#sidebar').evaluate('(e)=>e.inert');assert q.evaluate('document.activeElement.id')=='menu-toggle'
 # Dropdown toggle/replacement and Escape; no stale listeners after many opens.
 for _ in range(4):q.locator('#account-button').click();q.keyboard.press('Escape')
 q.locator('#account-button').click();q.locator('#notifications-button').click();assert q.locator('#notifications-button-panel').count()==1;assert q.locator('#account-button-panel').count()==0;q.keyboard.press('Escape');assert q.evaluate('document.activeElement.id')=='notifications-button'
 q.set_viewport_size({'width':1280,'height':900});q.goto(BASE+'tools/check-links.html',wait_until='networkidle');q.locator('#links-run').click();q.wait_for_function('LinkChecker.getResults().length>0 && !document.getElementById("links-run").disabled');assert not q.evaluate('LinkChecker.getResults().filter(r=>r.status==="Missing")');assert len(q.evaluate('LinkChecker.getResults()'))>500
 with q.expect_download() as d:q.locator('#links-export').click()
 assert d.value.suggested_filename=='local-reference-audit.json';q.locator('#links-search').fill('not-a-source-987654');assert q.locator('#links-empty').inner_text();q.locator('#links-clear').click();assert q.evaluate('LinkChecker.getResults().length')==0
 # Selected file mode really reads files, including in direct double-click mode.
 q.goto((R/'tools/check-links.html').as_uri(),wait_until='networkidle');q.locator('#links-run').click();assert q.evaluate('LinkChecker.getResults().length')==0
 q.locator('#links-folder').set_input_files(str(R));q.wait_for_function('LinkChecker.getResults().length>0 && !document.getElementById("links-run").disabled');assert not q.evaluate('LinkChecker.getResults().filter(r=>r.status==="Missing")');assert 'Selected local folder' in q.locator('#links-status').inner_text()
 # An incomplete selected-folder fixture must report real missing files.
 q.evaluate("""()=>{const files=[new File(['# Spec fixture'],'SPEC.md'),new File(['<!doctype html><title>Missing-file fixture</title>'],'index.html')];files.forEach(f=>Object.defineProperty(f,'webkitRelativePath',{value:'incomplete/'+f.name}));return LinkChecker.run(files)}""")
 assert q.evaluate('LinkChecker.getResults().some(r=>r.status==="Missing")')

 # Resume/pause, guide layout in both themes, and reset clear the coach.
 q.evaluate('Store.reset();Store.set("guidedTour",{active:true,index:0})');q.goto((R/'signup.html').as_uri(),wait_until='networkidle');q.wait_for_timeout(600)
 for theme in ['light','dark']:
  q.evaluate('(t)=>UI.theme.set(t)',theme) if False else q.evaluate('(t)=>{Store.set("theme",t);UI.theme.apply()}',theme)
  for width in [360,768,1280]:
   q.set_viewport_size({'width':width,'height':900});q.wait_for_timeout(100);assert not q.evaluate('document.documentElement.scrollWidth>innerWidth')
 q.locator('#tour-pause').click();assert q.evaluate('Store.get("guidedTour.paused")');q.reload(wait_until='networkidle');assert q.locator('#guided-coach').count()==0;q.locator('#public-demo').click();q.locator('#guided-demo-launch').click();q.get_by_role('button',name='Resume guide',exact=True).click();q.wait_for_timeout(600);assert q.locator('#guided-coach').count()==1;q.evaluate('Store.reset()');assert q.locator('#guided-coach').count()==0
 assert not errors,errors
 print('PASS — empty-catalog landing, replacement overlay, visible-only focus trap, inert background, mobile Escape/return focus, repeated dropdowns, HTTP and selected-folder file:// checker/export/search/clear, coach resume/reset/layout; zero page exceptions.')
 b.close()
