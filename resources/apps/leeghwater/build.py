#!/usr/bin/env python3
"""Leeghwater bouwen: plakt de delen uit src/ in vaste volgorde aan elkaar.

  python3 build.py          -> dist/page.html  (dit wordt gepubliceerd)
  python3 build.py --test   -> ook dist/test.html (nep-database + testhaakjes, NIET publiceren, niet in git)

page.html moet byte voor byte gelijk zijn aan wat als artifact gepubliceerd is
(het artifact-platform zet er zelf nog een <!doctype>/<head>-schil omheen).
"""
import glob, json, os, sys

HIER = os.path.dirname(os.path.abspath(__file__))
SRC, DIST, TESTS = (os.path.join(HIER, d) for d in ('src', 'dist', 'tests'))

def lees(p):
    with open(p, encoding='utf-8', newline='') as f:
        return f.read()

def pagina():
    deel = lambda n: lees(os.path.join(SRC, n))
    js = ''.join(lees(p) for p in sorted(glob.glob(os.path.join(SRC, '[3-9]?-*.js'))))
    return (deel('00-kop.html') + '<style>\n' + deel('10-stijl.css') + '</style>\n'
            + deel('20-pagina.html') + '<script>\n' + js + '</script>\n')

HAAK_OUD = "render();\nboot();\n})();"
HAAK_NIEUW = ("window.__sr=()=>scheduleRows();window.__pc=()=>(typeof planCompute==='function'?planCompute():null);"
              "window.__P=()=>P;\nrender();\nboot();\n})();")

def testpagina(page):
    assert page.count(HAAK_OUD) == 1, 'startregel niet gevonden'
    seed = json.dumps(json.load(open(os.path.join(TESTS, 'seed.json'), encoding='utf-8')), ensure_ascii=False)
    kop = ('<!doctype html><html><head><meta charset=utf8></head><body><script>const SEED=' + seed + ';\n'
           + lees(os.path.join(TESTS, 'nep-db.js')) + '</script>\n')
    return kop + page.replace(HAAK_OUD, HAAK_NIEUW) + '</body></html>'

def schrijf(naam, tekst):
    os.makedirs(DIST, exist_ok=True)
    with open(os.path.join(DIST, naam), 'w', encoding='utf-8', newline='') as f:
        f.write(tekst)
    print(naam, len(tekst.encode('utf-8')), 'bytes')

if __name__ == '__main__':
    p = pagina()
    schrijf('page.html', p)
    if '--test' in sys.argv:
        schrijf('test.html', testpagina(p))
