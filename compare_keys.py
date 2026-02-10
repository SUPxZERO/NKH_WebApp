import json

def get_keys(d, prefix=''):
    keys = set()
    for k, v in d.items():
        full_key = f"{prefix}.{k}" if prefix else k
        keys.add(full_key)
        if isinstance(v, dict):
            keys.update(get_keys(v, full_key))
    return keys

with open('lang/en.json', 'r', encoding='utf-8') as f:
    en = json.load(f)
with open('lang/km.json', 'r', encoding='utf-8') as f:
    km = json.load(f)

en_keys = get_keys(en)
km_keys = get_keys(km)

missing_in_km = en_keys - km_keys
print(f"Missing keys in km.json: {len(missing_in_km)}")
for k in sorted(list(missing_in_km))[:20]:
    print(k)
