import urllib.request
import json
import os

def check_dailymed(drug_name):
    url = f"https://dailymed.nlm.nih.gov/dailymed/services/v2/spls.json?drug_name={urllib.parse.quote(drug_name)}&pagesize=5"
    req = urllib.request.Request(url, headers={'User-Agent': 'BloomCare/1.0 (health@bloomcare.com)'})
    try:
        with urllib.request.urlopen(req, timeout=8) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            for item in data.get('data', []):
                setid = item.get('setid')
                title = item.get('title')
                media_url = f"https://dailymed.nlm.nih.gov/dailymed/services/v2/spls/{setid}/media.json"
                mreq = urllib.request.Request(media_url, headers={'User-Agent': 'BloomCare/1.0 (health@bloomcare.com)'})
                with urllib.request.urlopen(mreq, timeout=8) as mresp:
                    mdata = json.loads(mresp.read().decode('utf-8'))
                    media = mdata.get('data', {}).get('media', [])
                    for m in media:
                        if m.get('mime_type', '').startswith('image/'):
                            return {"title": title, "url": m.get('url'), "name": m.get('name')}
    except Exception as e:
        print(f"DailyMed error for {drug_name}: {e}")
    return None

def check_wikimedia(query):
    url = f"https://commons.wikimedia.org/w/api.php?action=query&format=json&generator=search&gsrnamespace=6&gsrsearch={urllib.parse.quote(query)}&gsrlimit=5&prop=imageinfo&iiprop=url|mime|size"
    req = urllib.request.Request(url, headers={'User-Agent': 'BloomCare/1.0 (health@bloomcare.com)'})
    try:
        with urllib.request.urlopen(req, timeout=8) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            pages = data.get('query', {}).get('pages', {})
            for pid, p in pages.items():
                title = p.get('title', '')
                info = p.get('imageinfo', [{}])[0]
                url = info.get('url', '')
                if url:
                    return {"title": title, "url": url}
    except Exception as e:
        print(f"Wikimedia error for {query}: {e}")
    return None

if __name__ == '__main__':
    meds = [
        ("folic acid", "Folic Acid 5mg Tablets"),
        ("hydrocortisone", "Hydrocortisone 1% Cream"),
        ("hand sanitizer", "Hand Sanitizer 70%"),
        ("metformin", "Metformin 500mg Tablets"),
        ("amlodipine", "Amlodipine 5mg Tablets"),
        ("losartan", "Losartan Potassium 50mg Tablets"),
        ("diclofenac", "Diclofenac 50mg Tablets"),
        ("clotrimazole", "Clotrimazole 1% Cream"),
        ("hydrogen peroxide", "Hydrogen Peroxide 3%"),
        ("povidone iodine", "Povidone-Iodine 10%"),
        ("calamine", "Calamine Lotion"),
        ("oral rehydration salts", "Oral Rehydration Salts"),
    ]

    for term, label in meds:
        dm = check_dailymed(term)
        wm = check_wikimedia(f"{term} bottle packaging")
        print(f"=== {label} ===")
        if dm:
            print(f"  DailyMed: {dm['name']} -> {dm['url']}")
        if wm:
            print(f"  Wikimedia: {wm['title']} -> {wm['url']}")

