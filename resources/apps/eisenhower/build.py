"""Bouwt dist/page.html uit de bronbestanden in src/ (volgorde in src/volgorde.json).
Elk bronbestand is een aaneengesloten stuk van de pagina; ze worden met een regeleinde samengevoegd.
Gebruik: python build.py            -> dist/page.html
         python build.py --test     -> ook dist/test.html (pagina met nepdatabase uit tests/mock.js)"""
import json, os, sys
HIER = os.path.dirname(os.path.abspath(__file__))
def bouw():
    volgorde = json.load(open(os.path.join(HIER, 'src', 'volgorde.json'), encoding='utf-8'))
    stukken = [open(os.path.join(HIER, 'src', p), encoding='utf-8', newline='').read() for p in volgorde]
    return '\n'.join(stukken)
if __name__ == '__main__':
    os.makedirs(os.path.join(HIER, 'dist'), exist_ok=True)
    pagina = bouw()
    open(os.path.join(HIER, 'dist', 'page.html'), 'w', encoding='utf-8', newline='').write(pagina)
    print('dist/page.html', len(pagina.encode('utf-8')), 'bytes')
    if '--test' in sys.argv:
        mock = open(os.path.join(HIER, 'tests', 'mock.js'), encoding='utf-8').read()
        test = '<!doctype html><html><head><meta charset=utf-8></head><body><script>\n' + mock + '\n</script>' + pagina + '</body></html>'
        open(os.path.join(HIER, 'dist', 'test.html'), 'w', encoding='utf-8', newline='').write(test)
        print('dist/test.html')
