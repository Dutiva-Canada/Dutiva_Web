"""Audit invest_market_news links: resolve each Google News redirect to its
publisher URL via the batchexecute Fbv4je RPC, then probe the target."""
import json, os, re, sys, urllib.parse, urllib.request
from concurrent.futures import ThreadPoolExecutor

UA = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}
MGMT = f"https://api.supabase.com/v1/projects/{os.environ['SUPABASE_PROJECT_REF']}/database/query"
TOKEN = os.environ['SUPABASE_ACCESS_TOKEN']


def sql(query):
    req = urllib.request.Request(
        MGMT, data=json.dumps({'query': query}).encode(),
        headers={'Authorization': f'Bearer {TOKEN}', 'Content-Type': 'application/json'})
    return json.loads(urllib.request.urlopen(req).read())


def resolve(google_url):
    """news.google.com/rss/articles/<id> -> publisher url or None"""
    try:
        body = urllib.request.urlopen(
            urllib.request.Request(google_url, headers=UA), timeout=15
        ).read().decode('utf-8', 'replace')
        aid = re.search(r'data-n-a-id="([^"]+)"', body)
        ts = re.search(r'data-n-a-ts="([^"]+)"', body)
        sg = re.search(r'data-n-a-sg="([^"]+)"', body)
        if not (aid and ts and sg):
            return None, 'no_sig'
        inner = json.dumps([
            'garturlreq',
            [['en-US', 'US', ['FINANCE_TOP_INDICES', 'WEB_TEST_1_0_0'], None, None, 1, 1,
              'US:en', None, 180, None, None, None, None, None, 0, None, None,
              [int(ts.group(1)), 0]],
             'en-US', 'US', 1, [2, 3, 4, 8], 1, 0, '655000234', 0, 0, None, 0],
            aid.group(1), int(ts.group(1)), sg.group(1),
        ])
        payload = 'f.req=' + urllib.parse.quote(json.dumps([[['Fbv4je', inner, None, 'generic']]]))
        resp = urllib.request.urlopen(urllib.request.Request(
            'https://news.google.com/_/DotsSplashUi/data/batchexecute',
            data=payload.encode(),
            headers={**UA, 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'},
        ), timeout=15).read().decode('utf-8', 'replace')
        m = re.search(r'\\"(https?://[^\\"]+)\\"', resp) or re.search(
            r'"(https?://[^"\\]+)"', resp
        )
        return (m.group(1), 'ok') if m else (None, 'no_target')
    except Exception as e:  # noqa: BLE001
        return None, f'err:{type(e).__name__}'


def probe(url):
    try:
        req = urllib.request.Request(url, headers=UA, method='HEAD')
        return urllib.request.urlopen(req, timeout=15).status
    except urllib.error.HTTPError as e:
        if e.code in (403, 405, 501):  # HEAD rejected — try GET
            try:
                req = urllib.request.Request(url, headers=UA)
                return urllib.request.urlopen(req, timeout=15).status
            except urllib.error.HTTPError as e2:
                return e2.code
            except Exception as e2:  # noqa: BLE001
                return f'err:{type(e2).__name__}'
        return e.code
    except Exception as e:  # noqa: BLE001
        return f'err:{type(e).__name__}'


CACHE = os.path.join(os.path.dirname(__file__), 'news_link_audit_map.json')


def main():
    rows = sql('select distinct url from invest_market_news order by url')
    urls = [r['url'] for r in rows]
    cache = {}
    if os.path.exists(CACHE):
        cache = json.loads(open(CACHE, encoding='utf-8').read())
    todo = [u for u in urls if u not in cache or cache[u][0] is None]
    print(f'{len(urls)} distinct urls; {len(todo)} to (re)resolve')
    if todo:
        with ThreadPoolExecutor(max_workers=4) as ex:
            for u, (target, how) in zip(todo, ex.map(resolve, todo)):
                cache[u] = [target, how]
        with open(CACHE, 'w', encoding='utf-8') as f:
            f.write(json.dumps(cache))
    resolved = {u: tuple(cache.get(u, [None, 'unresolved'])) for u in urls}
    fails = {u: h for u, (t, h) in resolved.items() if not t}
    print(f'resolved {len(urls) - len(fails)}/{len(urls)}; decode failures: {len(fails)}')
    status = {}
    targets = {t for t, h in resolved.values() if t}
    with ThreadPoolExecutor(max_workers=8) as ex:
        for t, s in zip(targets, ex.map(probe, targets)):
            status[t] = s
    dead = {t: s for t, s in status.items() if not (isinstance(s, int) and 200 <= s < 400)}
    hard404 = {t for t, s in dead.items() if s == 404}
    print(f'probed {len(targets)} targets; non-2xx/3xx: {len(dead)}; confirmed 404: {len(hard404)}')
    dead_google = [u for u, (t, h) in resolved.items() if t in hard404]
    print(f'{len(dead_google)} stored urls resolve to a confirmed-404 target')
    with open(os.path.join(os.path.dirname(__file__), 'news_link_audit_dead.json'), 'w', encoding='utf-8') as f:
        f.write(json.dumps(dead_google))
    for t in sorted(hard404):
        print(' 404', t[:130])
    if fails:
        for u, h in list(fails.items())[:10]:
            print(' DECODE_FAIL', h, u[:110])


if __name__ == '__main__':
    sys.exit(main())
