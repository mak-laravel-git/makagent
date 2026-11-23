from playwright.sync_api import sync_playwright
from pathlib import Path
BASE='http://127.0.0.1:8080/'
ROOT=Path(__file__).resolve().parents[1]
with sync_playwright() as p:
 b=p.chromium.launch(args=['--no-sandbox']);q=b.new_page(viewport={'width':1280,'height':900});errors=[];q.on('pageerror',lambda e:errors.append(str(e)))
 def go(r):q.goto(BASE+'app/'+r+'.html',wait_until='networkidle');q.locator('.page-heading h1').wait_for()
 def reset():q.evaluate("Store.reset();Store.login('client');Store.set('client.agentLive',true);Store.set('onboarding.completed',true)")
 def btn(s):return q.get_by_role('button',name=s,exact=True)
 q.goto(BASE+'login.html',wait_until='networkidle');reset()
 # Scheduler fires for due posts, and records a failure rather than publishing through an expired token.
 go('posts');q.evaluate("Store.add('posts',{id:'due-ok',text:'Scheduled linen launch',channels:['Facebook'],date:Workspace.today(),time:'10:00',status:'Scheduled',scheduledAt:new Date(Date.now()-1000).toISOString()})");q.wait_for_function('Store.get("posts").find(p=>p.id==="due-ok").status==="Published"',timeout=20000)
 q.evaluate("Store.set('demo.tokenExpired',true);Store.add('posts',{id:'due-fail',text:'Expired-token launch',channels:['Facebook'],date:Workspace.today(),time:'10:00',status:'Scheduled',scheduledAt:new Date(Date.now()-1000).toISOString()})");q.wait_for_function('Store.get("posts").find(p=>p.id==="due-fail").status==="Failed"',timeout=20000);q.evaluate("Store.set('demo.tokenExpired',false)");print('PASS — actual 15-second scheduler publishes due records and records channel/token failure.')
 # Review resumes after a reload; malformed variable/name handling leaves the form open.
 go('templates');q.locator('#template-create').click();q.locator('#template-form [name=name]').fill('resume_test');q.locator('#template-body').fill('Hello {{2}}, your order is ready.');q.locator('#template-consent').check();btn('Submit for review').click();assert q.get_by_role('dialog').count()==1;assert 'sequential numeric' in q.locator('#toasts').inner_text();q.locator('#template-body').fill('Hello {{1}}, your order {{2}} is ready.');btn('Submit for review').click();tid=q.evaluate('Store.get("templates").at(-1).id');q.reload(wait_until='networkidle');q.locator('.page-heading h1').wait_for();q.wait_for_function('(id)=>Store.get("templates").find(t=>t.id===id).status==="Approved"',arg=tid,timeout=5000);print('PASS — template variable validation and interrupted-review recovery.')
 # Failed plan-change invoice must preserve the old plan until successful retry.
 go('billing');q.evaluate("Store.set('demo.paymentFailed',true)");q.locator('[data-change-plan=pro]').click();btn('Confirm demo change').click();assert q.evaluate('Store.get("client.plan")')=='Growth';iid=q.evaluate('Store.get("invoices").find(i=>i.proposal&&i.status==="Failed").id');q.locator('[data-change-plan=starter]').click();assert 'Resolve the failed plan-change invoice' in q.locator('#toasts').inner_text();q.evaluate("Store.set('demo.paymentFailed',false)");q.locator(f'[data-invoice-pay="{iid}"]').click();btn('Confirm').click();assert q.evaluate('Store.get("client.plan")')=='Pro';print('PASS — failed upgrade keeps the existing subscription, blocks stale competing changes and applies only after retry.')
 # No-data and invalid date ranges; alerts from live low-stock edits and reset exactness.
 go('analytics');q.locator('#analytics-period').select_option('custom');q.locator('[name=start]').fill('2026-09-01');q.locator('[name=end]').fill('2026-09-03');q.locator('#analytics-filter button').click();assert 'No records in this reporting window' in q.locator('#app-content').inner_text();q.locator('[name=start]').fill('2026-10-20');q.locator('[name=end]').fill('2026-10-10');q.locator('#analytics-filter button').click();assert 'Choose an ordered date range' in q.locator('#toasts').inner_text();q.evaluate("Store.patch('products','p2',{stock:2})");q.locator('#notifications-button').click();assert 'Everyday Linen Shirt is running low' in q.locator('.dropdown').inner_text();q.keyboard.press('Escape');q.evaluate("Store.set('products',[]);Store.reset()");assert q.evaluate('Store.get("notifications").length')==10;print('PASS — empty/invalid reporting ranges, low-stock bell alerts and exact seed reset without extra alert mutations.')
 # Unsigned / wrong-role checks for every new route.
 for role in [None,'admin']:
  q.evaluate('(r)=>r?Store.login(r):Store.logout()',role)
  for route in ['comments','orders','posts','templates','analytics','billing','settings','notifications']:
   q.goto(BASE+'app/'+route+'.html',wait_until='networkidle');q.wait_for_url('**/login.html')
 reset();go('settings');q.locator('[data-settings-section="Data & safety"]').click();q.locator('#settings-reset').click();btn('Confirm action').click();q.wait_for_url('**/login.html');assert q.evaluate('Store.session().role') is None;assert q.evaluate('Store.get("products").length')==24;print('PASS — anonymous/admin client-route protection and Settings reset/sign-out.')
 # Direct file:// operation, required libraries only, and persistence through reload.
 q.goto((ROOT/'login.html').as_uri(),wait_until='networkidle');reset()
 for route in ['comments','orders','posts','templates','analytics','billing','settings','notifications']:
  q.goto((ROOT/'app'/f'{route}.html').as_uri(),wait_until='networkidle');q.locator('.page-heading h1').wait_for();assert q.locator('#app-content').inner_text().strip()
  if route=='orders':q.locator('[data-order-move="SP-1042"]').select_option('Confirmed');q.reload(wait_until='networkidle');q.locator('.page-heading h1').wait_for();assert q.evaluate('Store.get("orders").find(o=>o.id==="SP-1042").status')=='Confirmed'
  if route=='settings':q.locator('#business-profile [name=name]').fill('Direct File Threads');q.locator('#business-profile button').click();q.reload(wait_until='networkidle');q.locator('#business-profile').wait_for();assert q.locator('[name=name]').input_value()=='Direct File Threads'
 assert not errors,errors
 print('PASS — all eight pages through direct file:// opening, edits/reload persistence; zero captured JavaScript page exceptions.')
 b.close()
