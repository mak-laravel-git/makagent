from playwright.sync_api import sync_playwright
from pathlib import Path
BASE='http://127.0.0.1:8080/'
with sync_playwright() as p:
 b=p.chromium.launch(args=['--no-sandbox']);q=b.new_page(viewport={'width':1440,'height':1000});errors=[];q.on('pageerror',lambda e:errors.append(str(e)))
 def go(route):
  q.goto(BASE+'app/'+route+'.html',wait_until='networkidle');q.locator('.page-heading h1').wait_for()
 q.goto(BASE+'app/overview.html',wait_until='networkidle');q.wait_for_url('**/login.html')
 q.evaluate("Store.reset();Store.set('onboarding.completed',true);Store.set('client.agentLive',true)");q.locator('#demo-client').click();q.wait_for_url('**/app/overview.html');q.locator('#overview-range').wait_for();q.locator('#overview-range').select_option('7');assert q.evaluate("Chart.getChart('overview-messages').data.labels.length")==7
 assert q.locator('.side-nav a[href="../app/inbox.html"]').count()==1
 go('inbox');q.locator('[data-conversation=cv2]').click();q.locator('#take-over').click();assert q.evaluate("Store.get('conversations').find(c=>c.id==='cv2').status")=='Human handling';q.locator('#return-ai').click();assert q.evaluate("Store.get('conversations').find(c=>c.id==='cv2').status")=='AI handling'
 q.locator('[data-compose=note]').click();q.locator('#reply-message').fill('Bulk quote requested; manager to follow up.');q.locator('#send-reply').click();assert 'Bulk quote requested' in q.locator('#thread-log').inner_text();assert q.evaluate("Store.get('messages').some(m=>m.conversationId==='cv2'&&m.role==='note')")
 q.locator('[data-compose=message]').click();q.locator('#suggest-reply').click();q.locator('#suggestion-text').fill('Thanks Sadia. I can help with the team shirts.');q.get_by_role('button',name='Use this draft',exact=True).click();q.locator('#send-reply').click();assert q.evaluate("Store.get('conversations').find(c=>c.id==='cv2').messages.at(-1).role")=='human'
 q.locator('#customer-notes').fill('Interested in a 20-piece team order.');q.locator('#save-customer-notes').click();q.locator('#add-customer-tag').click();q.get_by_role('dialog').locator('input').fill('Bulk buyer');q.get_by_role('button',name='Add tag',exact=True).click();assert 'Bulk buyer' in q.locator('.profile-tags').inner_text()
 wa=q.evaluate("Store.get('conversations').find(c=>c.channel==='WhatsApp'&&c.windowHours===0).id");q.evaluate('(id)=>AppInbox.select(id)',wa);q.locator('#template-picker').click();q.locator('#template-optin').check();q.get_by_role('button',name='Send demo template',exact=True).click();assert q.locator('#reply-form').count()==0;assert q.evaluate('(id)=>Store.get("conversations").find(c=>c.id===id).messages.at(-1).templateName',wa)
 q.evaluate("Store.set('demo.windowExpired',false);AppInbox.select('cv1');Store.patch('conversations','cv1',{status:'AI handling'})")
 # Customer simulation drives an actual order through the inbox AI.
 before=q.evaluate("Store.get('orders').length")
 for text in ['I want to order a linen shirt','Raisa Ahmed','01712345678','Tongi, Gazipur','2','M','Sage']:
  q.evaluate('(t)=>AppInbox.simulateIncoming(t)',text);q.wait_for_timeout(1000)
 assert q.evaluate("Store.get('orders').length")==before+1
 assert 'AI-collected order' in q.locator('#thread-log').inner_text()
 # Products: full editor, preview, variants, pending/success, selection/bulk and persistence.
 go('products');q.locator('#add-product').click();q.locator('#product-form [name=name]').fill('Gazipur Test Linen Shirt');q.locator('#product-form [name=sku]').fill('QA-LINEN');q.locator('#product-form [name=price]').fill('1750');q.locator('#product-form [name=stock]').fill('10');q.locator('#product-form [name=stock]').dispatch_event('change');q.locator('#product-form [name=status]').select_option('Active');q.locator('[data-variant=colour]').fill('Teal');q.locator('[data-variant=colour]').dispatch_event('change');q.get_by_role('button',name='Save product',exact=True).click();q.wait_for_timeout(900)
 pid=q.evaluate("Store.get('products').find(p=>p.sku==='QA-LINEN').id");assert q.evaluate('(id)=>Store.get("products").find(p=>p.id===id).variants[0].stock',pid)==10
 q.locator('#product-search').fill('Gazipur Test');q.locator('[data-edit]').first.click();q.locator('[data-editor-tab=preview]').click();q.locator('#product-ai-test input').fill('What is the price?');q.locator('#product-ai-test form button').click();q.wait_for_timeout(700);assert '1,750' in q.locator('#product-ai-test').inner_text();q.keyboard.press('Escape')
 q.locator('[data-select]').check();q.locator('#bulk-price').click();q.get_by_role('dialog').locator('input').fill('1890');q.get_by_role('button',name='Update prices',exact=True).click();assert q.evaluate('(id)=>Store.get("products").find(p=>p.id===id).price',pid)==1890
 q.locator('[data-bulk=Draft]').click();assert q.evaluate('(id)=>Store.get("products").find(p=>p.id===id).status',pid)=='Draft';q.locator('[data-bulk=Active]').click();q.locator('#clear-selection').click();q.locator('[data-view=table]').click();assert q.locator('.product-table tbody tr').count()==1
 with q.expect_download() as download:q.locator('#export-products').click()
 assert download.value.suggested_filename.endswith('.csv')
 q.locator('#categories-manager').click();q.locator('#category-add input').fill('Limited Edition');q.locator('#category-add button').click();assert q.evaluate("Store.get('categories').some(c=>c.name==='Limited Edition')");q.keyboard.press('Escape')
 q.locator('#offers-manager').click();q.locator('#offer-form [name=name]').fill('QA Eid offer');q.locator('#offer-form [name=category]').select_option('Shirts');q.locator('#offer-form [name=percent]').fill('8');q.locator('#offer-form button').click();assert q.evaluate("Store.get('offers').some(o=>o.name==='QA Eid offer')");q.keyboard.press('Escape')
 # Knowledge CRUD, error/retry and source citations.
 go('knowledge');q.locator('#kb-add').click();q.locator('#kb-editor [name=title]').fill('Do you offer complimentary gift wrapping?');q.locator('#kb-editor [name=text]').fill('Yes, complimentary gift wrapping is available for orders above ৳2,000.');q.locator('#kb-editor [name=indexMode]').select_option('error');q.get_by_role('button',name='Save & index',exact=True).click();q.wait_for_timeout(950);assert q.locator('[data-kb-retry]').count()==1;q.locator('[data-kb-retry]').click();q.wait_for_timeout(950);assert q.locator('[data-kb-retry]').count()==0
 q.locator('#kb-question').fill('Do you offer complimentary gift wrapping?');q.locator('#kb-question-form button').click();q.wait_for_timeout(750);assert 'complimentary gift wrapping' in q.locator('#kb-answer').inner_text();assert q.locator('#kb-answer .source-chips .badge').count()>0
 # Agent settings affect the engine and persist across reload.
 go('agent');q.locator('#agent-settings [name=name]').fill('Rumi');q.locator('#agent-settings [name=blockedWords]').fill('secret vault');q.locator('#agent-settings [name=override-WhatsApp]').check();q.locator('#agent-settings [name=language-WhatsApp]').select_option('English');q.locator('#agent-settings [name=greeting-WhatsApp]').fill('Hello from Rumi on WhatsApp.');q.locator('#agent-settings button[type=submit]').click();assert q.evaluate("Store.get('agent.name')")=='Rumi';q.reload(wait_until='networkidle');q.locator('#agent-preview-channel').select_option('WhatsApp');q.locator('#agent-preview input').fill('hello');q.locator('#agent-preview form button').click();q.wait_for_timeout(700);assert 'Hello from Rumi' in q.locator('#agent-preview').inner_text();assert q.evaluate("MockAgent.reply({message:'secret vault',conversationState:{}}).handover")
 # Channel bot control and token expiry demo.
 go('channels');q.locator('[data-bot=ch-fb]').uncheck();assert not q.evaluate("Store.get('channels').find(c=>c.id==='ch-fb').bot");q.locator('[data-bot=ch-fb]').check();q.evaluate("Store.set('demo.tokenExpired',true)");assert 'OAuth error 190' in q.locator('#app-content').inner_text();q.evaluate("Store.set('demo.tokenExpired',false)");q.locator('[data-webhook=ch-fb]').click();q.wait_for_timeout(750);assert q.evaluate("Store.get('channels').find(c=>c.id==='ch-fb').lastEvent")=='Just now'
 assert not errors,errors
 print('PASS — role protection/login routing, overview date charts, inbox handover/notes/suggestions/tags/profile/expired template, inbox order collection, product CRUD/variants/preview/bulk/export/categories/offers, knowledge indexing/retry/citations, agent overrides/blocked words, channel bot/token/webhook. Zero JS page exceptions.')
 for route in ['overview','inbox','channels','products','knowledge','agent']:
  go(route)
  for theme in ['light','dark']:
   q.evaluate('(t)=>{Store.set("theme",t);UI.theme.apply()}',theme)
   for w in [360,768,1280]:
    q.set_viewport_size({'width':w,'height':900});q.wait_for_timeout(150);assert not q.evaluate('document.documentElement.scrollWidth>innerWidth'),(route,theme,w)
 assert not errors,errors
 print('PASS — all six routes at 360/768/1280 in light and dark, no horizontal page overflow.')
 b.close()
