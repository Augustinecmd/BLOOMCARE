import urllib.request
import json

drugs = ['Ferrous Sulfate', 'Amlodipine', 'Losartan', 'Metformin', 'Tramadol', 'Diclofenac', 'Calamine', 'Zinc Sulfate']
for drug in drugs:
    term = drug.replace(' ', '+')
    url = f'https://dailymed.nlm.nih.gov/dailymed/services/v2/spls.json?drug_name={term}&pagesize=1'
    req = urllib.request.Request(url, headers={'User-Agent': 'BloomCare/1.0'})
    try:
        with urllib.request.urlopen(req, timeout=5) as r:
            d = json.loads(r.read().decode('utf-8'))
            for item in d.get('data', []):
                setid = item['setid']
                murl = f'https://dailymed.nlm.nih.gov/dailymed/services/v2/spls/{setid}/media.json'
                mreq = urllib.request.Request(murl, headers={'User-Agent': 'BloomCare/1.0'})
                with urllib.request.urlopen(mreq, timeout=5) as mr:
                    md = json.loads(mr.read().decode('utf-8'))
                    for m in md.get('data', {}).get('media', []):
                        if m.get('mime_type','').startswith('image/'):
                            print(drug, ':', m.get('name'), '->', m.get('url'))
    except Exception as e:
        print(drug, 'error:', e)
