"""Optional QA only: requires Python Playwright, not needed to open the prototype."""
from pathlib import Path
from playwright.sync_api import sync_playwright
import json
url=(Path(__file__).resolve().parent.parent/'components.html').as_uri()
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,args=['--no-sandbox'])
    page=browser.new_page(viewport={'width':1440,'height':1000})
    errors=[]
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.goto(url,wait_until='networkidle')
    assert page.locator('#app-content h1').inner_text()=='A foundation for better sales.'
    assert page.locator('canvas').count()==3
    page.locator('#theme-button').click()
    assert page.locator('html').get_attribute('class')=='dark'
    page.reload(wait_until='networkidle')
    assert page.locator('html').get_attribute('class')=='dark'
    for width in [360,768,1280]:
        page.set_viewport_size({'width':width,'height':900})
        page.wait_for_timeout(300)
        assert not page.evaluate('document.documentElement.scrollWidth>innerWidth'),f'Overflow {width}'
    page.locator('#open-modal').click()
    page.get_by_role('dialog').wait_for()
    page.keyboard.press('Escape')
    assert page.get_by_role('dialog').count()==0
    assert page.evaluate("document.activeElement.id")=='open-modal'
    page.locator('#open-drawer').click()
    page.locator('.drawer input[name=price]').fill('1350')
    page.get_by_role('button',name='Save product',exact=True).click()
    assert page.evaluate("Store.get('products')[0].price")==1350
    page.locator('#role-admin').click()
    assert page.locator('body').get_attribute('data-role')=='admin'
    assert page.locator('.side-nav .nav-item').count()==14
    assert page.locator('.side-nav a.nav-item').count()==14  # Phase 4B: thirteen admin menu destinations plus components.
    assert page.locator('.side-nav [data-route]').count()==0  # All admin destinations are implemented.
    page.locator('#role-client').click()
    page.locator('#notifications-button').click()
    page.get_by_role('button',name='Mark all as read').click()
    assert page.evaluate("Store.get('notifications').every(n=>n.read)")
    page.locator('#agent-form input').fill('Bhai red shirt er price koto?')
    page.locator('#agent-form button').click()
    page.wait_for_timeout(800)
    assert '1,350' in page.locator('#agent-log').inner_text()
    page.locator('#reset-chat').click()
    before=page.evaluate("Store.get('orders').length")
    for message in ['I want to order a linen shirt','Rakib Hasan','01712345678','Tongi, Gazipur','2','M','Sage']:
        page.locator('#agent-message').fill(message)
        page.locator('#agent-form button').click()
        page.wait_for_timeout(700)
    assert page.evaluate("Store.get('orders').length")==before+1
    page.evaluate('Store.reset()')
    assert page.evaluate("Store.get('products')[0].price")==1200
    assert page.evaluate("Store.get('orders').length")==15
    assert not errors,errors
    print('PASS — file:// load, persisted theme, 360/768/1280 responsive layouts, modal Escape/focus return, drawer edits, both shells, notification reads, live catalog price, complete order persisted, reset, zero JS exceptions.')
    browser.close()
