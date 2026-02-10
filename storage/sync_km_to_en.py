#!/usr/bin/env python3
"""
Add extra KM keys to en.json (reverse sync).
These keys exist in km.json and are used in code but missing from en.json.
"""
import json

def get_keys(d, prefix=''):
    keys = set()
    for k, v in d.items():
        full_key = f'{prefix}{k}'
        if isinstance(v, dict):
            keys.update(get_keys(v, full_key + '.'))
        else:
            keys.add(full_key)
    return keys

def get_value(d, path):
    keys = path.split('.')
    val = d
    for k in keys:
        if isinstance(val, dict) and k in val:
            val = val[k]
        else:
            return None
    return val

def set_value(d, path, value):
    keys = path.split('.')
    for k in keys[:-1]:
        d = d.setdefault(k, {})
    d[keys[-1]] = value

# English translations for Khmer values
EN_TRANSLATIONS = {
    # Layout actions
    "ថយក្រោយ": "Back",
    "បោះបង់": "Cancel",
    "បញ្ជាក់": "Confirm",
    "បង្កើត": "Create",
    "លុប": "Delete",
    "កែប្រែ": "Edit",
    "តម្រង": "Filter",
    "រក្សាទុក": "Save",
    "ស្វែងរក": "Search",
    "ធ្វើបច្ចុប្បន្នភាព": "Update",
    
    # Admin navigation
    "ផ្ទាំងគ្រប់គ្រង": "Dashboard",
    "ប្រតិបត្តិការ": "Operations",
    "ការកម្មង់": "Orders",
    "ការកក់កន្លែង": "Reservations",
    "ការជូនដំណឹង": "Notifications",
    "ការគ្រប់គ្រងម៉ឺនុយ": "Menu Management",
    "ប្រភេទ": "Categories",
    "មុខម្ហូប": "Menu Items",
    "រូបមន្ត": "Recipes",
    "ការផ្សព្វផ្សាយ": "Promotions",
    "ស្តុក និងការផ្គត់ផ្គង់": "Inventory & Procurement",
    "ការបញ្ជាទិញ": "Purchase Orders",
    "ស្តុក": "Inventory",
    "របាយការណ៍ស្តុក": "Inventory Reports",
    "គ្រឿងផ្សំ": "Ingredients",
    "ការកែប្រែស្តុក": "Adjustments",
    "ការជូនដំណឹងស្តុក": "Stock Alerts",
    "អ្នកផ្គត់ផ្គង់": "Suppliers",
    "ឯកតា": "Units",
    "ការគ្រប់គ្រងមនុស្ស": "People Management",
    "បុគ្គលិក": "Employees",
    "អ្នកគ្រប់គ្រង": "Admins",
    "អតិថិជន": "Customers",
    "មុខតំណែង": "Positions",
    "ពិន្ទុស្មោះត្រង់": "Loyalty Points",
    "កាលវិភាគ": "Scheduling",
    "វេនការងារ": "Shifts",
    "ការអនុម័តវេន": "Shift Approvals",
    "សំណើច្បាប់ឈប់សម្រាក": "Time Off Requests",
    "ការគ្រប់គ្រងវត្តមាន": "Attendance Management",
    "ការគ្រប់គ្រងប្រាក់ឈ្នួល": "Payroll Management",
    "ប្លង់ភោជនីយដ្ឋាន": "Restaurant Layout",
    "ទីតាំង": "Locations",
    "ជាន់": "Floors",
    "តុ": "Tables",
    "ហិរញ្ញវត្ថុ និងការវិភាគ": "Finance & Analytics",
    "ការវិភាគការលក់": "Sales Analytics",
    "ផ្ទាំងគ្រប់គ្រងហិរញ្ញវត្ថុ": "Financial Dashboard",
    "ការចំណាយ": "Expenses",
    "វិក័យប័ត្រ": "Invoices",
    "ប្រព័ន្ធ": "System",
    "ម៉ោងបើកដំណើរការ": "Operating Hours",
    "តួនាទី និងការអនុញ្ញាត": "Roles & Permissions",
    "ការបកប្រែ": "Translations",
    "កំណត់ហេតុសវនកម្ម": "Audit Logs",
    "វិធីបង់ប្រាក់": "Payment Methods",
    "ការកំណត់": "Settings",
    
    # Shifts
    "ចម្លងសប្តាហ៍": "Copy Week",
    "ខែ": "Month",
    "ចេញផ្សាយ": "Publish",
    "រក្សាទុក": "Save",
    "ថ្ងៃនេះ": "Today",
    "សប្តាហ៍": "Week",
    "បន្ថែមវេន": "Add Shift",
    "កែប្រែវេន": "Edit Shift",
    "ម៉ោង": "hours",
    "បោះពុម្ពកាលវិភាគសប្តាហ៍? អ្នកមិនអាចមិនទៅវិញទេ។": "Publish this week's schedule? This cannot be undone.",
    "៧ថ្ងៃ": "7 Days",
    "រយៈពេល": "Duration",
    "ម៉ោងបញ្ចប់": "End Time",
    "កំណត់ចំណាំ": "Notes",
    "ជ្រើសរើសមុខតំណែង": "Select Position",
    "ដាក់ស្លាក": "Label",
    "ជ្រើសរើសទីតាំង": "Select Location",
    "ម៉ោងចាប់ផ្តើម": "Start Time",
    "ព្រាង": "Draft",
    "បានចេញផ្សាយ": "Published",
    "ការកែប្រែ": "Edit",
    "ការចម្លង": "Create Copy",
    "បានចម្លង": "Copied",
    "បានបង្កើត": "Created",
    "បានលុប": "Deleted",
    "បានផ្សាយ": "Published",
    "បានធ្វើបច្ចុប្បន្នភាព": "Updated",
    "បរាជ័យក្នុងការកែប្រែ": "Failed",
    "លុបវេននេះ?": "Delete this shift?",
    "រកមិនឃើញវេន": "No shifts found",
    "គ្មានវេនដែលបានកំណត់សម្រាប់រយៈពេលនេះ។": "No shifts scheduled for this period.",
    "វេនសរុប": "Total Shifts",
    "បានចេញផ្សាយ": "Published",
    "មិនមានមុខតំណែង": "No Position",
    "មិនស្គាល់": "Unknown",
    
    # Employees 
    "មិនមានមុខតំណែង": "No Position",
    "មិនស្គាល់": "Unknown",
}

def translate_to_english(km_value):
    """Translate Khmer value to English."""
    if not isinstance(km_value, str):
        return km_value
    if km_value in EN_TRANSLATIONS:
        return EN_TRANSLATIONS[km_value]
    # Return original if no translation found
    return km_value

def main():
    with open('lang/en.json', 'r', encoding='utf-8') as f:
        en = json.load(f)
    with open('lang/km.json', 'r', encoding='utf-8') as f:
        km = json.load(f)
    
    en_keys = get_keys(en)
    km_keys = get_keys(km)
    extra = sorted(km_keys - en_keys)
    
    print(f"Adding {len(extra)} extra keys from km.json to en.json")
    
    added = 0
    translated = 0
    for key in extra:
        km_value = get_value(km, key)
        en_value = translate_to_english(km_value)
        set_value(en, key, en_value)
        added += 1
        if en_value != km_value:
            translated += 1
    
    # Save
    with open('lang/en.json', 'w', encoding='utf-8') as f:
        json.dump(en, f, indent=4, ensure_ascii=False)
    
    print(f"Added: {added} keys")
    print(f"Translated: {translated} keys")
    print(f"Need manual review: {added - translated} keys")
    
    # Verify final state
    with open('lang/en.json', 'r', encoding='utf-8') as f:
        en_new = json.load(f)
    
    new_en_keys = get_keys(en_new)
    print(f"\nFinal state:")
    print(f"  EN keys: {len(new_en_keys)}")
    print(f"  KM keys: {len(km_keys)}")
    print(f"  Missing in KM: {len(new_en_keys - km_keys)}")
    print(f"  Missing in EN: {len(km_keys - new_en_keys)}")

if __name__ == '__main__':
    main()
