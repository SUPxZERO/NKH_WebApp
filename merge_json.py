import json
from collections import OrderedDict

def deep_merge(dict1, dict2):
    for key, value in dict2.items():
        if key in dict1 and isinstance(dict1[key], dict) and isinstance(value, dict):
            deep_merge(dict1[key], value)
        else:
            dict1[key] = value
    return dict1

def merge_duplicates(filepath):
    print(f"Merging duplicates in {filepath}...")
    
    # We can't use json.load if there are duplicates we want to catch.
    # But wait, json.load(object_pairs_hook=...) allows us to see duplicates.
    
    merged_data = OrderedDict()
    
    def process_pairs(pairs):
        obj = OrderedDict()
        for k, v in pairs:
            if k in obj:
                if isinstance(obj[k], dict) and isinstance(v, dict):
                    deep_merge(obj[k], v)
                else:
                    obj[k] = v
            else:
                obj[k] = v
        return obj

    with open(filepath, 'r', encoding='utf-8') as f:
        # This will call process_pairs for every object found
        data = json.load(f, object_pairs_hook=process_pairs)
    
    # Sort keys for consistency
    def sort_dict(d):
        res = OrderedDict()
        for k in sorted(d.keys()):
            if isinstance(d[k], dict):
                res[k] = sort_dict(d[k])
            else:
                res[k] = d[k]
        return res

    sorted_data = sort_dict(data)

    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(sorted_data, f, ensure_ascii=False, indent=4)
    print("Done.")

merge_duplicates('lang/en.json')
merge_duplicates('lang/km.json')
