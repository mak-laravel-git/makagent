"""Native-DOM runtime audit; not a WCAG certification or external-service probe."""
from pathlib import Path
from urllib.parse import urlparse,unquote
from playwright.sync_api import sync_playwright
import json,time,statistics
R=Path(__file__).resolve().parents[1];BASE='http://127.0.0.1:8080/'
# Real hub uses server API auth, not the demo role guard; test it separately.
ROUTES=[str(x.relative_to(R)) for x in sorted(R.rglob('*.html')) if str(x.relative_to(R))!='app/connections.html']
TARGETS='''()=>[...document.querySelectorAll('button,a[href],input,select,textarea,summary,[role=button]')].filter(e=>{const r=e.getBoundingClientRect();return r.width&&r.height&&r.right>0&&r.left<innerWidth&&!e.closest('[inert],[hidden]')&&getComputedStyle(e).visibility!=='hidden'&&!e.disabled}).map(e=>{let r=e.getBoundingClientRect();if(e.labels?.length)for(const l of e.labels){const s=l.getBoundingClientRect();if(s.height>=43.9&&s.width>=43.9){r=s;break}}return{tag:e.tagName,id:e.id,cls:e.className,text:(e.innerText||e.getAttribute('aria-label')||e.name||'').slice(0,80),w:r.width,h:r.height}}).filter(e=>e.w<43.9||e.h<43.9)'''
NAMES='''()=>{function name(e){return e.getAttribute('aria-label')||e.getAttribute('title')||(e.getAttribute('aria-labelledby')||'').split(' ').map(id=>document.getElementById(id)?.innerText||'').join(' ').trim()||[...(e.labels||[])].map(l=>l.innerText).join(' ').trim()||e.innerText?.trim()||e.querySelector('img')?.alt}return [...document.querySelectorAll('button,input:not([type=hidden]),select,textarea,[role=button],canvas')].filter(e=>e.getClientRects().length&&!e.closest('[inert],[hidden]')&&getComputedStyle(e).visibility!=='hidden').filter(e=>!name(e)).map(e=>({tag:e.tagName,id:e.id,html:e.outerHTML.slice(0,220)}))}'''
report={'routes':len(ROUTES),'layouts':[],'localLinks':0,'fileRoutes':0,'guards':0,'emptyRoutes':0,'pageErrors':[],'consoleErrors':[],'localHttpErrors':[],'nameIssues':[],'touchIssues':[],'brokenLinks':[],'performance':[]}
with sync_playwright() as p:
 b=p.chromium.launch(args=['--no-sandbox']);q=b.new_page(viewport={'width':1280,'height':900});q.set_default_timeout(8000);q.on('pageerror',lambda e:report['pageErrors'].append(str(e)));q.on('console',lambda m:report['consoleErrors'].append({'page':q.url,'text':m.text}) if m.type=='error' else None);q.on('response',lambda r:report['localHttpErrors'].append((r.url,r.status)) if r.url.startswith(BASE) and r.status>=400 else None)
 q.goto(BASE+'login.html',wait_until='networkidle');q.evaluate('Store.reset()');known_ids={};fragments=[];began=time.monotonic()
 for theme in ['light','dark']:
  for route in ROUTES:
   role='admin' if route.startswith('admin/') else 'client';q.evaluate('''({role,theme})=>{Store.login(role);Store.set('theme',theme)}''',{'role':role,'theme':theme})
   q.goto(BASE+route+('?id=cl-dhaka' if 'client-detail' in route else ''),wait_until='networkidle');q.locator('h1').first.wait_for()
   report['nameIssues'] += [{'route':route,'theme':theme,**i} for i in q.evaluate(NAMES)]
   ids=q.locator('[id]').evaluate_all('(es)=>es.map(e=>e.id)');known_ids[route]=set(ids)
   assert len(ids)==len(set(ids)),('Duplicate IDs',route)
   assert q.locator('html').get_attribute('lang')=='en';assert q.locator('h1').count()==1,(route,'h1')
   for link in q.locator('a[href]').evaluate_all('(es)=>es.map(a=>({href:a.href,raw:a.getAttribute("href"),text:a.innerText}))'):
    u=urlparse(link['href'])
    if not link['raw'] or link['raw']=='#' or u.scheme=='javascript':report['brokenLinks'].append({'source':route,**link});continue
    if not link['href'].startswith(BASE):continue
    target=unquote(u.path.lstrip('/'));target=target or 'index.html';report['localLinks']+=1
    if not (R/target).is_file():report['brokenLinks'].append({'source':route,'target':target})
    if u.fragment:fragments.append((route,target,unquote(u.fragment)))
   perf=q.evaluate('''()=>({domReadyMs:Math.round(performance.getEntriesByType('navigation')[0].domContentLoadedEventEnd),scripts:[...document.scripts].filter(s=>s.src&&new URL(s.src).origin===location.origin).length,canvases:document.querySelectorAll('canvas').length})''');report['performance'].append({'route':route,'theme':theme,**perf})
   for width in [360,768,1280]:
    q.set_viewport_size({'width':width,'height':900});q.wait_for_timeout(200);overflow=q.evaluate('document.documentElement.scrollWidth>innerWidth');assert not overflow,('Overflow',route,theme,width,q.evaluate("[...document.querySelectorAll('body *')].filter(e=>e.getBoundingClientRect().right>innerWidth+1&&!e.closest('aside,.table-scroll,.tabs')).map(e=>[e.tagName,e.className,e.getBoundingClientRect().right])"))
    if width in [360,768]:report['touchIssues'] += [{'route':route,'theme':theme,'width':width,**i} for i in q.evaluate(TARGETS)]
    assert ('dark' in (q.locator('html').get_attribute('class') or '').split())==(theme=='dark'),(route,theme)
    report['layouts'].append({'route':route,'theme':theme,'width':width,'overflow':False})
   if route in ['index.html','app/overview.html','admin/overview.html','tools/check-links.html']:
    q.screenshot(path=str(R.parent/('final-'+route.replace('/','-').replace('.html','')+'-'+theme+'.png')),full_page=True)
 for source,target,fragment in fragments:
  if target in known_ids and fragment not in known_ids[target]:report['brokenLinks'].append({'source':source,'target':target,'fragment':fragment})
 print('Runtime layout/reference scan completed:',len(report['layouts']),'layouts;',report['localLinks'],'generated local links; names',len(report['nameIssues']),'touch',len(report['touchIssues']),'broken',len(report['brokenLinks']),flush=True)
 # All protected routes redirect for anonymous and the wrong simulated role.
 for role in [None,'wrong']:
  for route in [r for r in ROUTES if r.startswith(('app/','admin/')) or r=='onboarding.html']:
   q.goto(BASE+'login.html',wait_until='networkidle');q.evaluate('(r)=>{Store.logout();if(r)Store.login(r)}',None if role is None else 'client' if route.startswith('admin/') else 'admin');q.goto(BASE+route,wait_until='networkidle');assert '/login.html' in q.url,(route,role,q.url);report['guards']+=1
 # Empty primary collections must not crash or expose undefined placeholders.
 q.goto(BASE+'login.html',wait_until='networkidle');q.evaluate("Store.reset();Store.login('client');['products','conversations','messages','orders','leads','documents','faqs','templates','posts','notifications','channels','comments'].forEach(k=>Store.set(k,[]))")
 for route in [r for r in ROUTES if r.startswith('app/') or r in ['index.html','components.html']]:
  q.goto(BASE+route,wait_until='networkidle');q.locator('h1').wait_for();assert 'undefined' not in q.locator('#app-content').inner_text(),route;report['emptyRoutes']+=1
 # CSV formula payloads stay strings; numeric totals stay numeric.
 q.goto(BASE+'app/orders.html',wait_until='networkidle')
 q.evaluate('''window._csvCapture=null;const old=SP.download;SP.download=(name,text)=>window._csvCapture=text;App.csv('qa.csv',[['=HYPERLINK("bad")','  +cmd','@sum','-formula','normal',-12,42]]);SP.download=old''') if q.evaluate('!!window.App') else None
 csv=q.evaluate('window._csvCapture');assert csv and "'=HYPERLINK" in csv and "'  +cmd" in csv and '"-12"' in csv,csv
 # Direct file opening: every wrapper and same explicit simulated roles.
 fq=b.new_page(viewport={'width':1280,'height':900});fq.on('pageerror',lambda e:report['pageErrors'].append('file: '+str(e)));fq.goto((R/'login.html').as_uri(),wait_until='networkidle');fq.evaluate('Store.reset()')
 for route in ROUTES:
  role='admin' if route.startswith('admin/') else 'client';fq.evaluate('(r)=>Store.login(r)',role);fq.goto((R/route).as_uri()+('?id=cl-dhaka' if 'client-detail' in route else ''),wait_until='networkidle');fq.locator('h1').first.wait_for();assert fq.locator('h1').count()==1;report['fileRoutes']+=1
 # Performance is a local smoke measurement, not a production benchmark.
 report['durationSeconds']=round(time.monotonic()-began,1);report['domReadyMedianMs']=statistics.median([x['domReadyMs'] for x in report['performance']]);report['maxLocalScriptBytes']=max(x.stat().st_size for x in (R/'assets/js').glob('*.js'))
 (R.parent/'salespilot-final-audit.json').write_text(json.dumps(report,indent=2));b.close()
assert not report['pageErrors'],report['pageErrors'];assert not report['localHttpErrors'],report['localHttpErrors'];assert not report['consoleErrors'],report['consoleErrors'];assert not report['brokenLinks'],report['brokenLinks'];assert not report['nameIssues'],report['nameIssues'];assert not report['touchIssues'],report['touchIssues']
print('PASS —',report['routes'],'routes;',len(report['layouts']),'theme/width layouts;',report['guards'],'guard redirects;',report['fileRoutes'],'direct-file routes;',report['emptyRoutes'],'empty-state routes; CSV safety; zero captured exceptions/console errors/local HTTP failures, missing names, small mobile targets or broken generated local links.')
print('Local smoke DOM-ready median:',report['domReadyMedianMs'],'ms; max own script:',report['maxLocalScriptBytes'],'bytes. Not a production/network performance guarantee.')
