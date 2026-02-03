<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Validation Language Lines
    |--------------------------------------------------------------------------
    |
    | The following language lines contain the default error messages used by
    | the validator class. Some of these rules have multiple versions such
    | as the size rules. Feel free to tweak each of these messages here.
    |
    */

    'accepted' => 'វាល :attribute ត្រូវតែទទួលយក។',
    'accepted_if' => 'វាល :attribute ត្រូវតែទទួលយកនៅពេល :other គឺ :value។',
    'active_url' => 'វាល :attribute មិនមែនជា URL ត្រឹមត្រូវទេ។',
    'after' => 'វាល :attribute ត្រូវតែជាកាលបរិច្ឆេទបន្ទាប់ពី :date។',
    'after_or_equal' => 'វាល :attribute ត្រូវតែជាកាលបរិច្ឆេទបន្ទាប់ពី ឬស្មើនឹង :date។',
    'alpha' => 'វាល :attribute ត្រូវតែមានតែអក្សរប៉ុណ្ណោះ។',
    'alpha_dash' => 'វាល :attribute ត្រូវតែមានតែអក្សរ លេខ សញ្ញាដាច់ និងគូសក្រោម។',
    'alpha_num' => 'វាល :attribute ត្រូវតែមានតែអក្សរ និងលេខ។',
    'array' => 'វាល :attribute ត្រូវតែជាអារេ។',
    'ascii' => 'វាល :attribute ត្រូវតែមានតែតួអក្សរ និងនិមិត្តសញ្ញា single-byte alphanumeric។',
    'before' => 'វាល :attribute ត្រូវតែជាកាលបរិច្ឆេទមុន :date។',
    'before_or_equal' => 'វាល :attribute ត្រូវតែជាកាលបរិច្ឆេទមុន ឬស្មើនឹង :date។',
    'between' => [
        'array' => 'វាល :attribute ត្រូវតែមានរវាង :min និង :max ធាតុ។',
        'file' => 'វាល :attribute ត្រូវតែស្ថិតនៅចន្លោះ :min និង :max គីឡូបៃ។',
        'numeric' => 'វាល :attribute ត្រូវតែស្ថិតនៅចន្លោះ :min និង :max។',
        'string' => 'វាល :attribute ត្រូវតែស្ថិតនៅចន្លោះ :min និង :max តួអក្សរ។',
    ],
    'boolean' => 'វាល :attribute ត្រូវតែជាពិត ឬមិនពិត។',
    'can' => 'វាល :attribute មានតម្លៃមិនត្រូវបានអនុញ្ញាត។',
    'confirmed' => 'ការបញ្ជាក់ :attribute មិនត្រូវគ្នាទេ។',
    'contains' => 'វាល :attribute ខ្វះតម្លៃដែលចាំបាច់។',
    'current_password' => 'ពាក្យសម្ងាត់មិនត្រឹមត្រូវទេ។',
    'date' => 'វាល :attribute មិនមែនជាកាលបរិច្ឆេទត្រឹមត្រូវទេ។',
    'date_equals' => 'វាល :attribute ត្រូវតែជាកាលបរិច្ឆេទស្មើនឹង :date។',
    'date_format' => 'វាល :attribute មិនត្រូវគ្នានឹងទម្រង់ :format ទេ។',
    'decimal' => 'វាល :attribute ត្រូវតែមាន :decimal ខ្ទង់ទសភាគ។',
    'declined' => 'វាល :attribute ត្រូវតែបដិសេធ។',
    'declined_if' => 'វាល :attribute ត្រូវតែបដិសេធនៅពេល :other គឺ :value។',
    'different' => 'វាល :attribute និង :other ត្រូវតែខុសគ្នា។',
    'digits' => 'វាល :attribute ត្រូវតែមាន :digits ខ្ទង់។',
    'digits_between' => 'វាល :attribute ត្រូវតែស្ថិតនៅចន្លោះ :min និង :max ខ្ទង់។',
    'dimensions' => 'វាល :attribute មានទំហំរូបភាពមិនត្រឹមត្រូវ។',
    'distinct' => 'វាល :attribute មានតម្លៃស្ទួន។',
    'doesnt_end_with' => 'វាល :attribute មិនត្រូវបញ្ចប់ដោយមួយក្នុងចំណោម៖ :values។',
    'doesnt_start_with' => 'វាល :attribute មិនត្រូវចាប់ផ្តើមដោយមួយក្នុងចំណោម៖ :values។',
    'email' => 'វាល :attribute ត្រូវតែជាអាសយដ្ឋានអ៊ីមែលត្រឹមត្រូវ។',
    'ends_with' => 'វាល :attribute ត្រូវតែបញ្ចប់ដោយមួយក្នុងចំណោម៖ :values។',
    'enum' => ':attribute ដែលបានជ្រើសរើសមិនត្រឹមត្រូវទេ។',
    'exists' => ':attribute ដែលបានជ្រើសរើសមិនត្រឹមត្រូវទេ។',
    'extensions' => 'វាល :attribute ត្រូវតែមានផ្នែកបន្ថែមមួយក្នុងចំណោម៖ :values។',
    'file' => 'វាល :attribute ត្រូវតែជាឯកសារ។',
    'filled' => 'វាល :attribute ត្រូវតែមានតម្លៃ។',
    'gt' => [
        'array' => 'វាល :attribute ត្រូវតែមានច្រើនជាង :value ធាតុ។',
        'file' => 'វាល :attribute ត្រូវតែធំជាង :value គីឡូបៃ។',
        'numeric' => 'វាល :attribute ត្រូវតែធំជាង :value។',
        'string' => 'វាល :attribute ត្រូវតែធំជាង :value តួអក្សរ។',
    ],
    'gte' => [
        'array' => 'វាល :attribute ត្រូវតែមាន :value ធាតុ ឬច្រើនជាងនេះ។',
        'file' => 'វាល :attribute ត្រូវតែធំជាង ឬស្មើនឹង :value គីឡូបៃ។',
        'numeric' => 'វាល :attribute ត្រូវតែធំជាង ឬស្មើនឹង :value។',
        'string' => 'វាល :attribute ត្រូវតែធំជាង ឬស្មើនឹង :value តួអក្សរ។',
    ],
    'hex_color' => 'វាល :attribute ត្រូវតែជាពណ៌ hexadecimal ត្រឹមត្រូវ។',
    'image' => 'វាល :attribute ត្រូវតែជារូបភាព។',
    'in' => ':attribute ដែលបានជ្រើសរើសមិនត្រឹមត្រូវទេ។',
    'in_array' => 'វាល :attribute មិនមាននៅក្នុង :other ទេ។',
    'integer' => 'វាល :attribute ត្រូវតែជាចំនួនគត់។',
    'ip' => 'វាល :attribute ត្រូវតែជាអាសយដ្ឋាន IP ត្រឹមត្រូវ។',
    'ipv4' => 'វាល :attribute ត្រូវតែជាអាសយដ្ឋាន IPv4 ត្រឹមត្រូវ។',
    'ipv6' => 'វាល :attribute ត្រូវតែជាអាសយដ្ឋាន IPv6 ត្រឹមត្រូវ។',
    'json' => 'វាល :attribute ត្រូវតែជាខ្សែអក្សរ JSON ត្រឹមត្រូវ។',
    'list' => 'វាល :attribute ត្រូវតែជាបញ្ជី។',
    'lowercase' => 'វាល :attribute ត្រូវតែជាអក្សរតូច។',
    'lt' => [
        'array' => 'វាល :attribute ត្រូវតែមានតិចជាង :value ធាតុ។',
        'file' => 'វាល :attribute ត្រូវតែតូចជាង :value គីឡូបៃ។',
        'numeric' => 'វាល :attribute ត្រូវតែតូចជាង :value។',
        'string' => 'វាល :attribute ត្រូវតែតូចជាង :value តួអក្សរ។',
    ],
    'lte' => [
        'array' => 'វាល :attribute មិនត្រូវមានច្រើនជាង :value ធាតុទេ។',
        'file' => 'វាល :attribute ត្រូវតែតូចជាង ឬស្មើនឹង :value គីឡូបៃ។',
        'numeric' => 'វាល :attribute ត្រូវតែតូចជាង ឬស្មើនឹង :value។',
        'string' => 'វាល :attribute ត្រូវតែតូចជាង ឬស្មើនឹង :value តួអក្សរ។',
    ],
    'mac_address' => 'វាល :attribute ត្រូវតែជាអាសយដ្ឋាន MAC ត្រឹមត្រូវ។',
    'max' => [
        'array' => 'វាល :attribute មិនត្រូវមានច្រើនជាង :max ធាតុទេ។',
        'file' => 'វាល :attribute មិនត្រូវធំជាង :max គីឡូបៃទេ។',
        'numeric' => 'វាល :attribute មិនត្រូវធំជាង :max ទេ។',
        'string' => 'វាល :attribute មិនត្រូវធំជាង :max តួអក្សរទេ។',
    ],
    'max_digits' => 'វាល :attribute មិនត្រូវមានច្រើនជាង :max ខ្ទង់ទេ។',
    'mimes' => 'វាល :attribute ត្រូវតែជាឯកសារប្រភេទ៖ :values។',
    'mimetypes' => 'វាល :attribute ត្រូវតែជាឯកសារប្រភេទ៖ :values។',
    'min' => [
        'array' => 'វាល :attribute ត្រូវតែមានយ៉ាងហោចណាស់ :min ធាតុ។',
        'file' => 'វាល :attribute ត្រូវតែយ៉ាងហោចណាស់ :min គីឡូបៃ។',
        'numeric' => 'វាល :attribute ត្រូវតែយ៉ាងហោចណាស់ :min។',
        'string' => 'វាល :attribute ត្រូវតែយ៉ាងហោចណាស់ :min តួអក្សរ។',
    ],
    'min_digits' => 'វាល :attribute ត្រូវតែមានយ៉ាងហោចណាស់ :min ខ្ទង់។',
    'missing' => 'វាល :attribute ត្រូវតែបាត់។',
    'missing_if' => 'វាល :attribute ត្រូវតែបាត់នៅពេល :other គឺ :value។',
    'missing_unless' => 'វាល :attribute ត្រូវតែបាត់លុះត្រាតែ :other គឺ :value។',
    'missing_with' => 'វាល :attribute ត្រូវតែបាត់នៅពេល :values មានវត្តមាន។',
    'missing_with_all' => 'វាល :attribute ត្រូវតែបាត់នៅពេល :values មានវត្តមាន។',
    'multiple_of' => 'វាល :attribute ត្រូវតែជាគុណនៃ :value។',
    'not_in' => ':attribute ដែលបានជ្រើសរើសមិនត្រឹមត្រូវទេ។',
    'not_regex' => 'ទម្រង់វាល :attribute មិនត្រឹមត្រូវទេ។',
    'numeric' => 'វាល :attribute ត្រូវតែជាលេខ។',
    'password' => [
        'letters' => 'វាល :attribute ត្រូវតែមានយ៉ាងហោចណាស់មួយតួអក្សរ។',
        'mixed' => 'វាល :attribute ត្រូវតែមានយ៉ាងហោចណាស់មួយតួអក្សរធំ និងមួយតួអក្សរតូច។',
        'numbers' => 'វាល :attribute ត្រូវតែមានយ៉ាងហោចណាស់មួយលេខ។',
        'symbols' => 'វាល :attribute ត្រូវតែមានយ៉ាងហោចណាស់មួយនិមិត្តសញ្ញា។',
        'uncompromised' => ':attribute ដែលបានផ្តល់ឱ្យបានបង្ហាញនៅក្នុងការលេចធ្លាយទិន្នន័យ។ សូមជ្រើសរើស :attribute ផ្សេង។',
    ],
    'present' => 'វាល :attribute ត្រូវតែមានវត្តមាន។',
    'present_if' => 'វាល :attribute ត្រូវតែមានវត្តមាននៅពេល :other គឺ :value។',
    'present_unless' => 'វាល :attribute ត្រូវតែមានវត្តមានលុះត្រាតែ :other គឺ :value។',
    'present_with' => 'វាល :attribute ត្រូវតែមានវត្តមាននៅពេល :values មានវត្តមាន។',
    'present_with_all' => 'វាល :attribute ត្រូវតែមានវត្តមាននៅពេល :values ទាំងអស់មានវត្តមាន។',
    'prohibited' => 'វាល :attribute ត្រូវបានហាមឃាត់។',
    'prohibited_if' => 'វាល :attribute ត្រូវបានហាមឃាត់នៅពេល :other គឺ :value។',
    'prohibited_if_accepted' => 'វាល :attribute ត្រូវបានហាមឃាត់នៅពេល :other ត្រូវបានទទួលយក។',
    'prohibited_if_declined' => 'វាល :attribute ត្រូវបានហាមឃាត់នៅពេល :other ត្រូវបានបដិសេធ។',
    'prohibited_unless' => 'វាល :attribute ត្រូវបានហាមឃាត់លុះត្រាតែ :other នៅក្នុង :values។',
    'prohibits' => 'វាល :attribute ហាមឃាត់ :other មិនឱ្យមានវត្តមាន។',
    'regex' => 'ទម្រង់វាល :attribute មិនត្រឹមត្រូវទេ។',
    'required' => 'វាល :attribute គឺចាំបាច់។',
    'required_array_keys' => 'វាល :attribute ត្រូវតែមានធាតុសម្រាប់៖ :values។',
    'required_if' => 'វាល :attribute គឺចាំបាច់នៅពេល :other គឺ :value។',
    'required_if_accepted' => 'វាល :attribute គឺចាំបាច់នៅពេល :other ត្រូវបានទទួលយក។',
    'required_if_declined' => 'វាល :attribute គឺចាំបាច់នៅពេល :other ត្រូវបានបដិសេធ។',
    'required_unless' => 'វាល :attribute គឺចាំបាច់លុះត្រាតែ :other នៅក្នុង :values។',
    'required_with' => 'វាល :attribute គឺចាំបាច់នៅពេល :values មានវត្តមាន។',
    'required_with_all' => 'វាល :attribute គឺចាំបាច់នៅពេល :values មានវត្តមាន។',
    'required_without' => 'វាល :attribute គឺចាំបាច់នៅពេល :values មិនមានវត្តមាន។',
    'required_without_all' => 'វាល :attribute គឺចាំបាច់នៅពេលគ្មាន :values ណាមួយមានវត្តមាន។',
    'same' => 'វាល :attribute និង :other ត្រូវតែដូចគ្នា។',
    'size' => [
        'array' => 'វាល :attribute ត្រូវតែមាន :size ធាតុ។',
        'file' => 'វាល :attribute ត្រូវតែមាន :size គីឡូបៃ។',
        'numeric' => 'វាល :attribute ត្រូវតែមាន :size។',
        'string' => 'វាល :attribute ត្រូវតែមាន :size តួអក្សរ។',
    ],
    'starts_with' => 'វាល :attribute ត្រូវតែចាប់ផ្តើមដោយមួយក្នុងចំណោម៖ :values។',
    'string' => 'វាល :attribute ត្រូវតែជាខ្សែអក្សរ។',
    'timezone' => 'វាល :attribute ត្រូវតែជាតំបន់ពេលវេលាត្រឹមត្រូវ។',
    'unique' => ':attribute ត្រូវបានប្រើប្រាស់រួចហើយ។',
    'uploaded' => ':attribute បរាជ័យក្នុងការផ្ទុកឡើង។',
    'uppercase' => 'វាល :attribute ត្រូវតែជាអក្សរធំ។',
    'url' => 'វាល :attribute ត្រូវតែជា URL ត្រឹមត្រូវ។',
    'ulid' => 'វាល :attribute ត្រូវតែជា ULID ត្រឹមត្រូវ។',
    'uuid' => 'វាល :attribute ត្រូវតែជា UUID ត្រឹមត្រូវ។',

    /*
    |--------------------------------------------------------------------------
    | Custom Validation Language Lines
    |--------------------------------------------------------------------------
    |
    | Here you may specify custom validation messages for attributes using the
    | convention "attribute.rule" to name the lines. This makes it quick to
    | specify a specific custom language line for a given attribute rule.
    |
    */

    'custom' => [
        'attribute-name' => [
            'rule-name' => 'custom-message',
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Custom Validation Attributes
    |--------------------------------------------------------------------------
    |
    | The following language lines are used to swap our attribute placeholder
    | with something more reader friendly such as "E-Mail Address" instead
    | of "email". This simply helps us make our message more expressive.
    |
    */

    'attributes' => [
        'name' => 'ឈ្មោះ',
        'username' => 'ឈ្មោះអ្នកប្រើប្រាស់',
        'email' => 'អ៊ីមែល',
        'first_name' => 'នាម',
        'last_name' => 'គោត្តនាម',
        'password' => 'ពាក្យសម្ងាត់',
        'password_confirmation' => 'ការបញ្ជាក់ពាក្យសម្ងាត់',
        'city' => 'ទីក្រុង',
        'country' => 'ប្រទេស',
        'address' => 'អាសយដ្ឋាន',
        'phone' => 'ទូរស័ព្ទ',
        'mobile' => 'ទូរស័ព្ទដៃ',
        'age' => 'អាយុ',
        'sex' => 'ភេទ',
        'gender' => 'ភេទ',
        'day' => 'ថ្ងៃ',
        'month' => 'ខែ',
        'year' => 'ឆ្នាំ',
        'hour' => 'ម៉ោង',
        'minute' => 'នាទី',
        'second' => 'វិនាទី',
        'title' => 'ចំណងជើង',
        'content' => 'មាតិកា',
        'description' => 'ការពិពណ៌នា',
        'excerpt' => 'អត្ថបទដកស្រង់',
        'date' => 'កាលបរិច្ឆេទ',
        'time' => 'ពេលវេលា',
        'available' => 'មាន',
        'size' => 'ទំហំ',
    ],

];
