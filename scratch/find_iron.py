import urllib.request
import urllib.parse
import json

def search(q):
    url = f'https://commons.wikimedia.org/w/api.php?action=query&format=json&generator=search&gsrnamespace=6&gsrsearch={urllib.parse.quote(q + " filetype:bitmap")}&gsrlimit=5&prop=imageinfo&iiprop=url|mime'
    req = urllib.request.Request(url, headers={'User-Agent': 'BloomCare/1.0'})
    with urllib.request.urlopen(req) as r:
        d = json.loads(r.read().decode('utf-8'))
        for p in d.get('query', {}).get('pages', {}).values():
            info = p.get('imageinfo', [{}])[0]
            print(p.get('title'), '->', info.get('url'))

search('iron supplements bottle')
search('ferrous fumarate')
search('iron tablets')
