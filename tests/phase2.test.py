"""Optional Playwright QA. No test dependency is needed to run the site."""
from pathlib import Path
from playwright.sync_api import sync_playwright
import json,io
from openpyxl import Workbook
BASE='http://127.0.0.1:8080/'
with sync_playwright() as p:
 b=p.chromium.launch(headless=True,args=['--no-sandbox']);page=b.new_page(viewport={'width':1440,'height':1000});errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto(BASE+'index.html',wait_until='networkidle');page.evaluate('Store.reset()')
 page.goto(BASE+'pricing.html',wait_until='networkidle');monthly=page.locator('.plan-price').all_text_contents();page.locator('[data-billing=yearly]').click();assert monthly!=page.locator('.plan-price').all_text_contents()
 page.goto(BASE+'signup.html',wait_until='networkidle')
 for k,v in {'business':'Gazipur Styles','email':'nusrat@demo.example','phone':'01712345678','password':'demo12345'}.items():page.locator(f'[name={k}]').fill(v)
 page.locator('[name=terms]').check();page.locator('#auth-form button[type=submit]').click();page.wait_for_url('**/onboarding.html');page.wait_for_timeout(300)
 assert page.evaluate("Store.get('products').length")==0
 page.locator('#next').click();assert page.evaluate("Store.get('onboarding.step')")==2
 page.locator('#save-later').click();page.get_by_role('button',name='Save & leave',exact=True).click();page.wait_for_url('**/login.html');page.locator('#demo-client').click();page.wait_for_url('**/onboarding.html');assert page.evaluate("Store.get('onboarding.step')")==2
 # Recover a permissions-denied scenario using the actual demo controls drawer.
 page.locator('#onboard-demo').click();page.locator('#connection-error').select_option('permission');page.get_by_role('button',name='Done',exact=True).click()
 page.locator('[data-connect=Facebook]').click();page.locator('#connect-next').click();page.locator('#connect-next').click();assert 'Permission not granted' in page.get_by_role('dialog').inner_text();page.locator('#recover-connection').click();page.locator('#connect-next').click();page.locator('#connect-next').click();page.locator('#connect-next').click()
 assert page.evaluate("Store.get('channels').filter(c=>c.status==='Connected').length")==2
 page.locator('#instagram-checklist').click();page.locator('#ig-access').check();page.get_by_role('button',name='Re-check access',exact=True).click();page.keyboard.press('Escape')
 page.locator('[data-connect=WhatsApp]').click();page.locator('#wa-next').click();page.locator('#wa-next').click();page.locator('#wa-next').click();page.locator('#wa-phone').fill('01712345678');page.locator('#wa-next').click();page.locator('#wa-otp').fill('123456');page.locator('#wa-next').click();page.locator('#wa-consent').check();page.locator('#wa-next').click();assert 'Pending review' in page.get_by_role('dialog').inner_text();page.locator('#wa-next').click()
 assert page.evaluate("Store.get('channels').filter(c=>c.status==='Connected').length")==3
 page.locator('#next').click()
 for k,v in {'name':'Premium Blue Linen Shirt','price':'1490','stock':'20','colour':'Blue'}.items():page.locator('#manual-product [name='+k+']').fill(v)
 page.locator('#manual-product button').click();assert page.evaluate("Store.get('products').length")==1
 # CSV mapping and row validation: one valid and one invalid row.
 page.locator('[data-method=upload]').click();page.locator('#catalog-file').set_input_files({'name':'catalog.csv','mimeType':'text/csv','buffer':b'name,price,stock,category\nCanvas Market Bag,690,10,Accessories\nBad price,0,-1,Shirts'})
 page.get_by_role('button',name='Validate rows',exact=True).click();assert '1 valid' in page.get_by_role('dialog').inner_text();page.get_by_role('button',name='Import valid products',exact=True).click();assert page.evaluate("Store.get('products').length")==2
 # Real XLSX file read through native browser decompression.
 wb=Workbook();ws=wb.active;ws.append(['name','price','stock','category']);ws.append(['Heritage Cotton Cap',450,18,'Accessories']);buf=io.BytesIO();wb.save(buf)
 page.locator('#catalog-file').set_input_files({'name':'catalog.xlsx','mimeType':'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','buffer':buf.getvalue()});page.get_by_role('button',name='Validate rows',exact=True).click();assert '1 valid' in page.get_by_role('dialog').inner_text();page.get_by_role('button',name='Import valid products',exact=True).click();assert page.evaluate("Store.get('products').length")==3
 page.locator('[data-method=website]').click();page.locator('#website-form button').click();page.locator('#approve-products').wait_for();page.locator('#approve-products').click();assert page.evaluate("Store.get('products').length")==6
 page.locator('[data-method=paste]').click();page.locator('#paste-products').fill('Everyday Scarf | 750 | 12');page.locator('#paste-form button').click();page.locator('#approve-products').click();assert page.evaluate("Store.get('products').length")==7
 page.locator('#next').click();page.locator('#starter-faq').click();page.locator('#knowledge-file').set_input_files({'name':'delivery-guide.txt','mimeType':'text/plain','buffer':b'Gazipur delivery takes 2 to 4 days.'});page.wait_for_timeout(1300);assert page.evaluate("Store.get('documents')[0].status")=='Indexed'
 page.locator('#next').click();page.locator('#step-form [name=name]').fill('Maya');page.locator('#next').click();assert page.evaluate("Store.get('agent.name')")=='Maya'
 for message in ['Premium Blue Linen Shirt price','I want to order Premium Blue Linen Shirt','Rakib Hasan','01712345678','Tongi, Gazipur','2','M','Blue']:
  page.locator('#playground-input').fill(message);page.locator('#playground-form button').click();page.wait_for_timeout(750)
 assert page.evaluate("Store.get('orders').length")==1
 assert 'Order collected' in page.locator('#playground-log').inner_text()
 page.locator('#reset-playground').click();page.locator('#playground-input').fill('agent chai');page.locator('#playground-form button').click();page.wait_for_timeout(750);assert 'AI paused' in page.locator('#playground-log').inner_text()
 page.locator('#next').click();assert not page.locator('#go-live-toggle').is_disabled();page.locator('#go-live-toggle').check();page.get_by_role('button',name='Confirm',exact=True).click();page.locator('#open-dashboard').wait_for();assert page.evaluate("Store.get('onboarding.completed')")==True
 page.locator('#open-dashboard').click();page.wait_for_url('**/app/overview.html');page.locator('.page-heading h1').wait_for();assert 'Overview' in page.title()
 assert not errors,errors
 print('PASS — landing/pricing, signup, save/resume, Facebook permission recovery, Instagram checklist, seven-step WhatsApp signup, manual/CSV/XLSX/website/paste products, document indexing, agent settings, persisted order, handover, go-live summary. Zero page exceptions.')
 # Responsive/dark pass for every public page, then every onboarding step.
 for theme in ['light','dark']:
  page.evaluate('(t)=>Store.set("theme",t)',theme)
  for route in ['index','pricing','login','signup','forgot-password','privacy','terms','data-deletion']:
   page.goto(BASE+route+'.html',wait_until='networkidle')
   for w in [360,768,1280]:
    page.set_viewport_size({'width':w,'height':900});page.wait_for_timeout(70)
    assert not page.evaluate('document.documentElement.scrollWidth>innerWidth'),(route,theme,w)
  page.evaluate('Store.set("onboarding.completed",false)')
  for s in range(1,8):
   page.evaluate('(s)=>Store.set("onboarding.step",s)',s);page.goto(BASE+'onboarding.html',wait_until='networkidle')
   for w in [360,768,1280]:
    page.set_viewport_size({'width':w,'height':900});page.wait_for_timeout(70)
    assert not page.evaluate('document.documentElement.scrollWidth>innerWidth'),('onboarding',s,theme,w)
 assert not errors,errors
 print('PASS — all 8 public pages and all 7 wizard steps in light/dark at 360/768/1280; zero horizontal page overflow and page exceptions.')
 page.goto((Path(__file__).resolve().parents[1]/'index.html').as_uri(),wait_until='networkidle');assert page.locator('h1').count()==1
 print('PASS — direct file:// landing.')
 b.close()
