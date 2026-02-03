# Bakong KHQR Payment Integration with Laravel (Fully Explained Guide)

This document is a complete text conversion and expanded explanation of the provided PDF. It explains **what to do**, **why each step exists**, and **how the full payment flow works end-to-end**.

---

## 1. Project Setup

### Purpose
This step initializes a new Laravel project and installs all required dependencies for Bakong KHQR payment generation and QR rendering.

### Commands
```bash
composer create-project laravel/laravel khqr-bakong
cd khqr-bakong
composer require khqr-gateway/bakong-khqr-php
composer require simplesoftwareio/simple-qrcode
```

### Explanation
- `laravel/laravel`: Creates a fresh Laravel application
- `bakong-khqr-php`: Official KHQR SDK to generate and verify Bakong QR codes
- `simple-qrcode`: Used to visually render the QR string into an image

### Environment Configuration (.env)
You must configure:
- `APP_NAME`
- `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD`
- `BAKONG_TOKEN` (obtained from Bakong API registration)

This token is required later for **transaction verification**.

---

## 2. Database Setup

### Goal
Create a simple product catalog that users can purchase using KHQR.

### Create Product Model + Migration
```bash
php artisan make:model Product -m
```

### Migration Structure
```php
Schema::create('products', function (Blueprint $table) {
    $table->id();
    $table->string('name');
    $table->text('description')->nullable();
    $table->decimal('price', 10, 2);
    $table->string('image')->nullable();
    $table->timestamps();
});
```

### Field Explanation
- `name`: Product title
- `description`: Optional product details
- `price`: Payment amount used to generate KHQR
- `image`: Product preview image

### Run Migration
```bash
php artisan migrate
```

### Seed Sample Products
Example:
```php
Product::create([
  'name' => 'iPhone 17 Pro',
  'description' => '128GB, Blue Titanium',
  'price' => 200,
  'image' => 'https://i.ebayimg.com/images/g/EDEAAeSwLb9owuv8/s-l1600.webp'
]);
```

This provides real data for testing the payment flow.

---

## 3. ProductController

### Role
Handles product listing and product detail display.

### Create Controller
```bash
php artisan make:controller ProductController
```

### Methods
- `index()` → Fetch all products and show them in a list
- `show($id)` → Display a single product with purchase option

This controller is **read-only** and does not handle payments.

---

## 4. PaymentController (Bakong Integration)

### Role
This is the **core logic** of KHQR payment generation and verification.

### Create Controller
```bash
php artisan make:controller PaymentController
```

### checkout($id)

Flow:
1. Load selected product
2. Create merchant info object
3. Generate KHQR string
4. Send QR + MD5 hash to the view

```php
$merchant = new IndividualInfo(
    bakongAccountID: 'vannak_dim@cadi',
    merchantName: 'VANNAK DIM',
    merchantCity: 'Phnom Penh',
    currency: KHQRData::CURRENCY_KHR,
    amount: $product->price
);
```

### Why MD5 Matters
- Each KHQR generates a unique MD5 hash
- This hash is used to **check payment status** via Bakong API
- It acts as the transaction fingerprint

---

### verifyTransaction(Request $request)

Purpose:
- Check whether the QR code has been paid
- Uses Bakong API + MD5 hash

Flow:
1. Validate MD5
2. Call Bakong API
3. Return JSON result

```php
$bakong = new BakongKHQR(env('BAKONG_TOKEN'));
$result = $bakong->checkTransactionByMD5($request->md5);
```

This enables **real-time polling** from the frontend.

---

## 5. Routes

### Structure
```php
Route::get('/', [ProductController::class, 'index']);
Route::get('/product/{id}', [ProductController::class, 'show']);
Route::post('/checkout/{id}', [PaymentController::class, 'checkout']);
Route::post('/verify', [PaymentController::class, 'verifyTransaction']);
```

### Design Logic
- GET routes → display UI
- POST routes → generate QR & verify payments

---

## 6. Views (Blade Templates)

### Product List (index.blade.php)
Displays products as Bootstrap cards with:
- Image
- Name
- Description
- Price
- Buy button

### Product Detail (show.blade.php)
Shows:
- Product info
- "Generate KHQR to Pay" button

---

### Checkout Page (checkout.blade.php)

This page handles:
- QR code rendering
- Countdown timer (120s)
- Auto payment verification

#### Countdown Logic
- Timer ticks every second
- Calls `/verify` API repeatedly
- Stops when:
  - Payment success
  - Time expires

```js
if (data.responseCode === 0) {
  alert("Transaction successful!");
}
```

This simulates **real merchant payment behavior**.

---

## 7. Layout

Minimal Bootstrap-based layout using CDN.

Purpose:
- Fast setup
- No frontend framework dependency

---

## 8. Run the Project

```bash
php artisan serve
```

Visit:
```
http://127.0.0.1:8000
```

### Full User Flow
1. User selects product
2. KHQR generated
3. User scans via Bakong App
4. System verifies payment
5. Success detected automatically

---

## Security & Production Notes

- Never expose `BAKONG_TOKEN` in frontend
- Use HTTPS in production
- Store successful transactions in database
- Add webhook support if available

---

## What You Can Extend Next

- Order table + payment status
- Invoice generation
- Merchant dashboard
- Webhook-based verification
- QR expiration handling

---

This document is designed to be **copy-ready**, **teachable**, and **production-scalable**.

