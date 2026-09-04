import urllib.request
import urllib.parse
import json

def search(q):
    url = f'https://commons.wikimedia.org/w/api.php?action=query&format=json&generator=search&gsrnamespace=6&gsrsearch={urllib.parse.quote(q + " filetype:bitmap")}&gsrlimit=5&prop=imageinfo&iiprop=url|mime'
    req = urllib.request.Request(url, headers={'User-Agent': 'BloomCare/1.0 (contact@bloomcare.com)'})
    with urllib.request.urlopen(req) as resp:
        data = json.loads(resp.read().decode('utf-8'))
        for p in data.get('query', {}).get('pages', {}).values():
            info = p.get('imageinfo', [{}])[0]
            print(p.get('title'), '->', info.get('url'))

print('=== FISH OIL ===')
search('fish oil softgels')
print('=== FOLIC ACID ===')
search('folic acid tablets')
