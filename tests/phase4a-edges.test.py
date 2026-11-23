from playwright.sync_api import sync_playwright
BASE='http://127.0.0.1:8080/'
with sync_playwright() as p:
 b=p.chromium.launch(args=['--no-sandbox']);q=b.new_page(viewport={'width':1280,'height':900});errors=[];q.set_default_timeout(7000);q.on('pageerror',lambda e:errors.append(str(e)))
 def go(path):q.goto(BASE+path,wait_until='networkidle');q.locator('h1').first.wait_for()
 def reset():
  q.goto(BASE+'login.html',wait_until='networkidle');q.evaluate("Store.reset();Store.login('admin');Store.set('onboarding.completed',true)")
 def reason(button='Apply change'):
  q.locator('#admin-reason').fill('TK-201 support operation verified');q.get_by_role('dialog').get_by_role('button',name=button,exact=True).click()
 def enter(id='cl-2'):
  go('admin/client-detail.html?id='+id);q.locator('#client-impersonate').click();q.locator('#privacy-ack').check();reason('Enter client workspace');q.wait_for_url('**/app/overview.html');q.locator('h1').first.wait_for()
 # Admin routes are protected against anonymous and client sessions.
 reset()
 for role in [None,'client']:
  q.evaluate('(role)=>role?Store.login(role):Store.logout()',role)
  for path in ['overview','clients','client-detail','channels','meta-status','plans','billing']:
   q.goto(BASE+'admin/'+path+'.html',wait_until='networkidle');q.wait_for_url('**/login.html')
 reset();go('admin/client-detail.html?id=missing');assert 'Unknown client ID' in q.locator('#app-content').inner_text()
 # Suspension guards client pages and survives a fresh admin sync; reactivate keeps bots paused.
 go('admin/client-detail.html?id=cl-dhaka');q.locator('#client-suspend').click();reason('Suspend client');q.reload(wait_until='networkidle');q.locator('h1').first.wait_for();assert q.evaluate('Admin.client("cl-dhaka").status')=='Suspended';q.evaluate("Store.login('client')");q.goto(BASE+'app/overview.html',wait_until='networkidle');q.wait_for_url('**/login.html?blocked=suspended');assert 'suspended' in q.locator('#public-root').inner_text().lower()
 q.evaluate("Store.login('admin')");go('admin/client-detail.html?id=cl-dhaka');q.locator('#client-suspend').click();reason('Reactivate client');assert not q.evaluate('Store.get("client.agentLive")')
 # Moving a failed plan-change invoice via Admin must update the actual tenant only after success.
 enter();go('app/billing.html');assert q.evaluate('Store.get("invoices").length')==3;q.evaluate("Store.set('demo.paymentFailed',true)");q.locator('[data-change-plan=pro]').click();q.get_by_role('button',name='Confirm demo change',exact=True).click();iid=q.evaluate('Store.get("invoices").find(i=>i.proposal&&i.status==="Failed").id');assert q.evaluate('Store.get("client.plan")')=='Starter';q.locator('#exit-impersonation').click();q.wait_for_url('**/admin/client-detail.html?id=cl-2');q.locator('h1').first.wait_for();assert q.evaluate('(id)=>Admin.invoices().some(i=>i.id===id)',iid)
 go('admin/plans.html');q.locator('[data-plan-delete=pro]').click();assert q.get_by_role('dialog').count()==0;assert 'Resolve pending' in q.locator('#toasts').inner_text()
 go('admin/billing.html?client=cl-2&tab=Failures');q.locator('[data-admin-retry="'+iid+'"]').click();q.get_by_role('button',name='Confirm',exact=True).click();assert q.evaluate('Tenants.get("cl-2").client.plan')=='Pro';assert q.evaluate('Store.get("client.plan")')=='Growth';assert q.evaluate('(id)=>Admin.invoices().find(i=>i.id===id).status',iid)=='Paid'
 enter();go('app/billing.html');assert q.evaluate('Store.get("client.plan")')=='Pro';assert q.evaluate('(id)=>Store.get("invoices").find(i=>i.id===id).status',iid)=='Paid'
 # Admin navigation while impersonating and logout/new-login each restore original context.
 go('admin/overview.html');q.wait_for_url('**/admin/client-detail.html?id=cl-2');assert q.evaluate('Store.get("client.name")')=='Dhaka Threads';assert not q.evaluate('Store.session().impersonating')
 enter();q.evaluate('Store.logout()');q.goto(BASE+'login.html',wait_until='networkidle');assert q.evaluate('Store.get("client.name")')=='Dhaka Threads';assert q.evaluate('Store.session().role') is None
 q.evaluate("Store.login('admin')");enter('cl-3');q.evaluate("Store.login('client')");assert q.evaluate('Store.get("client.name")')=='Dhaka Threads';assert not q.evaluate('Store.session().impersonating')
 # Plan feature/price changes persist and the public pricing cards use the same catalog.
 q.evaluate("Store.login('admin')");go('admin/plans.html');q.locator('[data-plan-edit=starter]').click();q.locator('[name=monthly]').fill('1590');q.locator('[name=reason]').fill('Preview a small pricing adjustment');q.get_by_role('button',name='Save plan',exact=True).click();go('pricing.html');assert '1,590' in q.locator('#public-root').inner_text()
 # All-evidence readiness requires approvals AND mode, provider, verification, URLs/instructions flags.
 go('admin/meta-status.html');assert not q.evaluate('Admin.reviewReadiness().production');q.evaluate("Store.update('admin.metaStatus',m=>{m.appMode='Live';m.businessVerification='Verified';m.techProvider='Approved';m.reviewChecklist.forEach(c=>c.done=true);m.permissions.forEach(p=>{p.reviewState='Approved';p.reason='';p.screencast={recorded:true,permissionShown:true,testCredentials:true}})})");q.reload(wait_until='networkidle');q.locator('h1').first.wait_for();assert q.evaluate('Admin.reviewReadiness().production');assert 'production-readiness checks pass' in q.locator('.admin-ready').inner_text();q.evaluate("Store.set('admin.metaStatus.permissions.0.screencast.permissionShown',false)");assert not q.evaluate('Admin.reviewReadiness().production')
 # Exact reset clears all administrative edits, snapshots and migration state.
 q.evaluate('Store.reset()');assert q.evaluate('Store.get("admin.workspaces")') is None;assert q.evaluate('Store.get("notifications").length')==10;assert q.evaluate('Store.get("plans").find(p=>p.id==="starter").monthly')==1490
 assert not errors,errors
 print('Phase 4A edges PASS — seven route guards; suspension; arbitrary-tenant billing, pending-plan protection and invoice retry; exit/logout/login restoration; shared pricing; evidence-gated readiness; exact reset.');b.close()
