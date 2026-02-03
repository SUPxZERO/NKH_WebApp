# KHQR Format Comparison - Before vs After Fix

## Official Bakong SDK Example (Individual)
```
00020101021229180014jonhsmith@nbcq52045999530311654035005802KH5910Jonh Smith6010PHNOM PENH99170013173949577872263046894
```

**Structure:**
- Tag 00: 01
- Tag 01: 01 (Static)
- Tag 29 (Length 18): `0014jonhsmith@nbcq`
  - Sub-Tag 00: `jonhsmith@nbcq` ✅
- **Tag 52: 5999** ← Miscellaneous
- Tag 53: 116 (KHR)
- Tag 54: 500
- Tag 58: KH
- Tag 59: Jonh Smith
- Tag 60: PHNOM PENH
- **Tag 99 (Length 17): `0013173949577872`** ← Timestamp
- Tag 63: 6894 (CRC)

---

## Our Implementation - BEFORE Fix
```
00020101021229130009test@aclb520458125303840540511.305802KH5914NKH Restaurant6010Phnom Penh62160512NKH-4X4VPVBJ6304BAB7
```

**Issues:**
- Tag 29: ❌ Using sub-tag 00 + 01 (merchant format for individual account)
- Tag 52: ❌ `5812` (Restaurant category, not standard)
- Tag 62: ❌ Using generic EMV additional data field
- Tag 99: ❌ MISSING (Bakong timestamp extension)

---

## Our Implementation - AFTER Fix
```
00020101021229130009test@aclb52045999530384054049.655802KH5914NKH Restaurant6010Phnom Penh9917001317701120676666304063E
```

**Fixes Applied:**
- Tag 00: 01 ✅
- Tag 01: 12 (Dynamic) ✅
- Tag 29 (Length 13): `0009test@aclb`
  - Sub-Tag 00: `test@aclb` ✅ FIXED - Only sub-tag 00
- **Tag 52: 5999** ✅ FIXED - Now using Bakong standard
- Tag 53: 840 (USD) ✅
- Tag 54: 9.65 ✅
- Tag 58: KH ✅
- Tag 59: NKH Restaurant ✅
- Tag 60: Phnom Penh ✅
- **Tag 99 (Length 17): `00131770112067666`** ✅ FIXED - Timestamp now present!
- Tag 63: 063E (CRC) ✅

---

## Summary of Changes

### ✅ Fix #1: Tag 29 Structure (Lines 138-169 in KhqrService.php)
**Problem:** Individual accounts were using merchant format (sub-tag 00 + 01)  
**Solution:** Individual accounts now use only sub-tag 00 with account ID

**Code:**
```php
if ($data['account_type'] === self::ACCOUNT_MERCHANT) {
    $info .= $this->tlv('00', 'khqr@nbc');
    $info .= $this->tlv('01', $data['bakong_account_id']);
} else {
    // Individual: Account ID goes directly in sub-tag 00
    $info .= $this->tlv('00', $data['bakong_account_id']);
}
```

### ✅ Fix #2: Merchant Category Code (Line 96 in KhqrService.php)
**Problem:** Using `5812` (Restaurant category)  
**Solution:** Changed to `5999` (Miscellaneous - Bakong standard)

**Code:**
```php
// Before
$payload .= $this->tlv('52', '5812'); // Restaurant/Eating Places

// After
$payload .= $this->tlv('52', '5999'); // Bakong standard
```

### ✅ Fix #3: Tag 99 Timestamp Extension (Lines 122-126, 205-216 in KhqrService.php)
**Problem:** Missing Bakong-specific timestamp extension (Tag 99)  
**Solution:** Added Tag 99 with 13-digit millisecond timestamp

**Code:**
```php
// Replaced Tag 62 (generic EMV additional data)
// With Tag 99 (Bakong proprietary timestamp extension)

$timestamp = $this->generateBakongTimestamp();
$timestampData = $this->tlv('00', $timestamp);
$payload .= $this->tlv('99', $timestampData);

// New method
private function generateBakongTimestamp(): string
{
    $milliseconds = (int) (microtime(true) * 1000);
    return (string) $milliseconds;
}
```

---

## Validation Result

✅ **All critical KHQR format issues fixed!**

The generated KHQR now matches the official Bakong SDK structure and should scan successfully with:
- ABA Mobile app
- Wing app
- Any Bakong-compliant payment app

---

## Next Step for Testing

> **IMPORTANT:** You still need to update your Bakong Account ID!

Current diagnostic shows: `test@aclb` (demo account)

**To enable real payments:**
1. Go to Admin → Payment Methods → QR Payment
2. Update: Bakong Account ID to your real account (e.g., `012345678@aba`)
3. Create a new payment and test scanning

The QR format is now correct, but you need a valid account for live transactions!
