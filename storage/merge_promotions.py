import json
import os

def deep_merge(dict1, dict2):
    for key, value in dict2.items():
        if key in dict1 and isinstance(dict1[key], dict) and isinstance(value, dict):
            deep_merge(dict1[key], value)
        else:
            dict1[key] = value

def merge_translations(lang_file, form_file):
    if not os.path.exists(lang_file) or not os.path.exists(form_file):
        print(f"File missing: {lang_file} or {form_file}")
        return
    
    with open(lang_file, 'r', encoding='utf-8') as f:
        try:
            lang_data = json.load(f)
        except json.JSONDecodeError:
            print(f"Error decoding {lang_file}")
            return
    
    with open(form_file, 'r', encoding='utf-8') as f:
        form_data = json.load(f)
        
    deep_merge(lang_data, form_data)
    
    with open(lang_file, 'w', encoding='utf-8') as f:
        json.dump(lang_data, f, indent=4, ensure_ascii=False)

merge_translations('lang/en.json', 'storage/admin_promotions_en.json')
merge_translations('lang/km.json', 'storage/admin_promotions_km.json')
print("Merged promotions translations")
