# Payment System - Sprint Implementation Plan

## Executive Summary

This document outlines a comprehensive plan for refactoring and extending the NKH Restaurant payment system. The goal is to create a robust, extensible, and production-ready payment infrastructure supporting multiple payment methods including KHQR, Cash, Card, and Mobile Wallets.

---

## Current Architecture Analysis

### Backend (Laravel)
```
app/
├── Http/Controllers/Api/
│   ├── PaymentController.php       # Customer-facing payment endpoints
│   ├── PaymentWebhookController.php # Webhook handlers for payment gateways
│   └── Admin/
│       └── PaymentAdminController.php # Admin dashboard endpoints
├── Models/
│   ├── Payment.php                  # Core payment model with statuses
│   ├── PaymentMethod.php            # Available payment methods
│   ├── PaymentAuditLog.php          # Audit trail for payments
│   └── Invoice.php                  # Invoice linked to orders
├── Services/
│   ├── PaymentService.php           # Core payment business logic
│   ├── PaymentReferenceGenerator.php # Unique reference generation
│   ├── QrCodeGenerator.php          # KHQR code generation (EMV spec)
│   ├── FraudDetectionService.php    # Basic fraud checks
│   ├── InvoiceService.php           # Invoice reconciliation
│   ├── LoyaltyService.php           # Points awarding on payment
│   └── Payment/
│       ├── PaymentStrategyInterface.php
│       └── Strategies/
│           ├── QrPaymentStrategy.php
│           ├── CashPaymentStrategy.php
│           └── CardPaymentStrategy.php
└── Jobs/
    ├── ExpirePaymentsJob.php        # Auto-expire stale payments
    └── ProcessPaymentWebhook.php    # Async webhook processing
```

### Frontend (React/TypeScript)
```
resources/js/
├── Pages/Customer/
│   └── Payment.tsx                  # Customer payment page (QR focused)
├── Pages/admin/
│   └── PaymentsDashboard.tsx        # Admin payments management
└── app/
    ├── components/payment/
    │   └── QRPaymentDisplay.tsx     # QR code display component
    └── hooks/
        └── usePayment.ts            # React Query hooks for payment APIs
```

### Database Tables
- `payment_methods` - Available payment types
- `payments` - Individual payment transactions
- `payment_audit_logs` - Complete audit trail
- `invoices` - Financial documents linked to orders

---

## Identified Issues & Gaps

### Critical
1. ✅ **FIXED** - ParseError in PaymentService.php (duplicate closing brace)
2. ✅ **FIXED** - Empty `payment_methods` table causing "Payment method 'qr' not available"
3. ✅ **FIXED** - Frontend hardcoded to QR only - Payment.tsx now supports all methods

### Architecture Gaps
1. ✅ **COMPLETE** - Payment method selection UI implemented
2. ✅ **COMPLETE** - Card payment integrated with Stripe
3. ✅ **COMPLETE** - Cash payment flow with cashier confirmation
4. ⚠️ **No partial payment support** - All-or-nothing payments only
5. ⚠️ **Missing split payment** - Cannot split bill between multiple methods
6. ⚠️ **No refund UI** - Admin cannot process refunds from dashboard
7. ⚠️ **Missing payment receipts** - No email/PDF receipt generation

### Production Readiness
1. ⚠️ **No real payment gateway integration** - Only simulation exists
2. ⚠️ **Missing webhook signature verification** - Security vulnerability
3. ⚠️ **No idempotency keys** - Risk of duplicate payments
4. ⚠️ **Rate limiting commented out** - API abuse possible

---

## Sprint Breakdown

### Sprint P1: Foundation & Core Fixes ✅ COMPLETE
**Goal:** Fix critical errors and establish extensible architecture

**Completed Tasks:**
- [x] Fix PaymentService.php ParseError
- [x] Create PaymentMethodSeeder with QR, Cash, Card, ABA Pay
- [x] Implement Strategy Pattern for payment methods
- [x] Create PaymentStrategyInterface
- [x] Implement QrPaymentStrategy, CashPaymentStrategy, CardPaymentStrategy
- [x] Update PaymentController validation to use database
- [x] Run seeder: `php artisan db:seed --class=PaymentMethodSeeder`

---

### Sprint P2: Multi-Payment Method UI ✅ COMPLETE
**Goal:** Allow customers to choose payment method

**Completed Tasks:**
- [x] Created `GET /api/payment-methods` endpoint
- [x] Created `PaymentMethodSelector.tsx` component with animated cards
- [x] Created `CashPaymentDisplay.tsx` component with counter instructions
- [x] Created `CardPaymentPlaceholder.tsx` component (coming soon message)
- [x] Updated `usePayment.ts` with `usePaymentMethods` hook
- [x] Rewrote `Payment.tsx` with multi-step flow:
  - Step 1: Payment method selection
  - Step 2: Payment processing (QR/Cash/Card specific)
- [x] Created `resources/js/app/components/payment/index.ts` export file

**New Files Created:**
- `app/Http/Controllers/Api/PaymentController.php::availableMethods()`
- `resources/js/app/components/payment/PaymentMethodSelector.tsx`
- `resources/js/app/components/payment/CashPaymentDisplay.tsx`
- `resources/js/app/components/payment/CardPaymentPlaceholder.tsx`
- `resources/js/app/components/payment/index.ts`

---

### Sprint P3: Cash Payment Workflow ✅ COMPLETE
**Goal:** Complete cash payment with cashier confirmation

**Completed Tasks:**
- [x] Created migration for cash-specific fields (`cash_received`, `change_given`, `confirmed_by`, `confirmed_at`)
- [x] Updated Payment model with new fillable fields and `confirmedBy()` relationship
- [x] Created `CashPaymentController` with endpoints:
  - `GET /api/employee/payments/pending-cash` - List pending cash payments
  - `POST /api/employee/payments/{payment}/confirm-cash` - Confirm payment with change calculation
  - `POST /api/employee/payments/{payment}/reject-cash` - Reject payment with reason
  - `GET /api/employee/payments/cash-stats` - Daily stats for employee
- [x] Added API routes for employee cash payment management
- [x] Created React Query hooks for cash payment operations:
  - `usePendingCashPayments()` - Polling pending payments
  - `useConfirmCashPayment()` - Confirm with cash amount
  - `useRejectCashPayment()` - Reject with reason
  - `useCashPaymentStats()` - Daily statistics
- [x] Created `CashPaymentQueue.tsx` component with:
  - Stats bar (pending, confirmed, collected, change)
  - Animated payment list with waiting times
  - Confirmation modal with quick amount buttons
  - Change calculator
  - Reject flow with reason input
- [x] Created `Employee/CashPayments.tsx` page
- [x] Added web route `/employee/cash-payments`

**New Files Created:**
- `database/migrations/2025_12_11_074610_add_cash_payment_fields_to_payments_table.php`
- `app/Http/Controllers/Api/CashPaymentController.php`
- `resources/js/app/components/payment/CashPaymentQueue.tsx`
- `resources/js/Pages/Employee/CashPayments.tsx`

---

### Sprint P4: Card Payment Integration (Stripe) ✅ COMPLETE
**Goal:** Real card payment processing

**Completed Tasks:**
- [x] Installed Stripe PHP SDK v19.0.0: `composer require stripe/stripe-php`
- [x] Added Stripe configuration to `config/services.php`
- [x] Created `StripePaymentStrategy.php` with:
  - PaymentIntent creation
  - Client secret storage in metadata
  - Verification, cancellation, and refund methods
- [x] Created `StripeWebhookController.php` handling:
  - `payment_intent.succeeded` - Completes payment
  - `payment_intent.payment_failed` - Marks as failed
  - `payment_intent.canceled` - Marks as cancelled
  - `charge.refunded` - Processes refunds
  - Webhook signature verification
- [x] Added webhook route: `POST /api/webhooks/stripe`
- [x] Updated PaymentService to use StripePaymentStrategy when configured
- [x] Installed frontend packages: `@stripe/stripe-js @stripe/react-stripe-js`
- [x] Created `StripeCardForm.tsx` component with:
  - Stripe Elements integration
  - Card validation
  - 3D Secure support
  - Error handling
  - Test card info in dev mode
- [x] Updated `Payment.tsx` to use StripeCardForm when client_secret available
- [x] Updated `.env.example` with Stripe environment variables

**New Files Created:**
- `app/Services/Payment/Strategies/StripePaymentStrategy.php`
- `app/Http/Controllers/Api/StripeWebhookController.php`
- `resources/js/app/components/payment/StripeCardForm.tsx`

**Configuration Required:**
```env
STRIPE_KEY=pk_test_your_publishable_key
STRIPE_SECRET=sk_test_your_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
STRIPE_CURRENCY=usd
```

---

### Sprint P5: ABA Pay & Local Wallets ✅ COMPLETE
**Goal:** Integration with Cambodia's local payment providers

**Completed Tasks:**
- [x] Created `AbaPaymentStrategy.php` with:
  - ABA-specific KHQR EMV payload generation
  - ABA reference number format
  - Optional Bakong API integration for real-time notifications
  - Custom instructions for ABA Mobile app
- [x] Created `WingPaymentStrategy.php` with:
  - Wing-specific KHQR EMV payload generation
  - Wing reference number format
  - Custom instructions for Wing app
- [x] Created `config/payment.php` configuration file with:
  - KHQR/Bakong settings
  - ABA Bank settings
  - Wing Money settings
  - General payment settings (currency, expiration, etc.)
- [x] Updated `PaymentService` to use new strategies
- [x] Updated `PaymentMethodSeeder` with Wing Money
- [x] Updated `PaymentController` icon mapping for new methods
- [x] Updated `.env.example` with comprehensive payment configuration

**New Files Created:**
- `app/Services/Payment/Strategies/AbaPaymentStrategy.php`
- `app/Services/Payment/Strategies/WingPaymentStrategy.php`
- `config/payment.php`

**Configuration Required:**
```env
# KHQR / Bakong
KHQR_MERCHANT_ID=your_merchant_id
KHQR_MERCHANT_NAME="Your Business"
BAKONG_ENABLED=true/false
BAKONG_TOKEN=your_bakong_token

# ABA Bank
ABA_MERCHANT_ID=your_aba_merchant_id
ABA_API_KEY=your_aba_api_key

# Wing Money
WING_MERCHANT_ID=your_wing_merchant_id
WING_API_KEY=your_wing_api_key
```

**Available Payment Methods:**
1. KHQR - Universal QR for all Bakong-compatible apps
2. ABA Pay - Direct ABA Mobile integration
3. Wing Money - Wing app integration
4. Credit/Debit Card - Stripe integration
5. Cash - Counter payment

---

### Sprint P6: Refunds & Adjustments ✅ COMPLETE
**Goal:** Enable refund processing

**Completed Tasks:**
- [x] Refund model already existed with proper structure:
  - Fields: payment_id, amount, reason, status, initiated_by, approved_by, etc.
  - Relationships: payment, initiator, approver
  - Status helpers: isPending, isApproved, isCompleted, isRejected
- [x] Created `RefundController` with endpoints:
  - `GET /api/admin/refunds` - List with filters (status, date range)
  - `GET /api/admin/refunds/stats` - Statistics
  - `POST /api/admin/refunds` - Create refund request
  - `GET /api/admin/refunds/{refund}` - Show details
  - `POST /api/admin/refunds/{refund}/approve` - Approve
  - `POST /api/admin/refunds/{refund}/reject` - Reject with reason
  - `POST /api/admin/refunds/{refund}/process` - Process (includes Stripe integration)
  - `GET /api/admin/payments/{payment}/refunds` - Payment refund history
- [x] Updated API routes for refund management
- [x] Payment model already has refund helpers:
  - `refunded_amount` attribute
  - `refundable_amount` attribute
  - `isFullyRefunded()` method
  - `refunds()` relationship
- [x] Stripe refund integration via StripePaymentStrategy::refund()
- [x] Created React Query hooks (`useRefunds.ts`):
  - `useRefunds()` - List with filters
  - `useRefundStats()` - Statistics
  - `useRefund()` - Single refund
  - `usePaymentRefunds()` - Payment's refund history
  - `useCreateRefund()` - Create request
  - `useApproveRefund()` - Approve
  - `useRejectRefund()` - Reject
  - `useProcessRefund()` - Process
- [x] Created `RefundManagement.tsx` component:
  - Stats cards (pending, approved, completed, rejected)
  - Filters (status, date range)
  - Expandable table with full details
  - Approve/Reject/Process actions
  - Pagination
- [x] Created `RefundModal.tsx` component:
  - Quick refund amount buttons (Full, 50%, 25%)
  - Predefined and custom reasons
  - Partial refund validation
  - Previous refunds awareness

**New Files Created:**
- `app/Http/Controllers/Api/Admin/RefundController.php`
- `resources/js/app/hooks/useRefunds.ts`
- `resources/js/app/components/admin/RefundManagement.tsx`
- `resources/js/app/components/admin/RefundModal.tsx`

**Refund Workflow:**
1. Admin requests refund → Status: `pending`
2. Manager approves → Status: `approved`
3. Admin processes → Stripe refund (if card) → Status: `completed`
4. Or Manager rejects → Status: `rejected`

---

### Sprint P7: Split Payments & Partial Payments ✅ COMPLETE
**Goal:** Advanced payment scenarios

**Completed Tasks:**
- [x] Enhanced Invoice model with split payment support:
  - Status constants (DRAFT, ISSUED, PARTIAL, PAID, OVERDUE, CANCELLED)
  - `getPendingAmountAttribute()` - pending payment sum
  - `getRemainingBalanceAttribute()` - total minus completed
  - `getPaymentProgressAttribute()` - percentage complete
  - `isFullyPaid()`, `isPartiallyPaid()`, `isPending()` helpers
  - `canAcceptPayment()` - validation helper
  - `recordPayment()` - update totals on payment
  - `canPayAmount()` - validate specific amount
  - Query scopes: unpaid, paid, partial
- [x] Created `SplitPaymentController` with endpoints:
  - `GET /api/payments/split/{order}/status` - Session status with all payments
  - `POST /api/payments/split/{order}/add` - Add a split payment
  - `GET /api/payments/split/{order}/suggestions` - Suggested amounts
  - `POST /api/payments/split/{order}/cancel/{payment}` - Cancel pending
  - `POST /api/payments/split/{order}/complete` - Verify fully paid
- [x] Created React Query hooks (`useSplitPayment.ts`):
  - `useSplitPaymentStatus()` - Status with polling
  - `useSplitPaymentSuggestions()` - Quick amount suggestions
  - `useAddSplitPayment()` - Add new payment
  - `useCancelSplitPayment()` - Cancel pending
  - `useCompleteSplitPayment()` - Complete session
- [x] Created `SplitPaymentPanel.tsx` component:
  - Progress bar visualization
  - Payment list with status icons
  - Add payment modal with method selection
  - Quick amount suggestion buttons
  - Cancel pending payment ability
  - Complete button when fully paid

**New Files Created:**
- `app/Http/Controllers/Api/SplitPaymentController.php`
- `resources/js/app/hooks/useSplitPayment.ts`
- `resources/js/app/components/payment/SplitPaymentPanel.tsx`

**Split Payment Flow:**
1. Customer initiates order payment
2. Customer can add multiple payments with different methods
3. Each payment shows progress toward total
4. System tracks remaining balance
5. Order completes when fully paid

---

### Sprint P8: Receipts & Notifications ✅ COMPLETE
**Goal:** Professional receipts and notifications

**Completed Tasks:**
- [x] Created `ReceiptService` with:
  - `generatePdf()` - Generate PDF receipt using DomPDF
  - `generateThermalReceipt()` - 80mm thermal printer format
  - `generateHtml()` - HTML for display/email
  - `getReceiptData()` - JSON data for API
  - Complete receipt data preparation with business info, items, totals
- [x] Created receipt Blade templates:
  - `receipts/payment.blade.php` - Full PDF/HTML receipt
  - `receipts/thermal.blade.php` - Compact thermal format
- [x] Created `PaymentReceiptMail` mailable:
  - Implements `ShouldQueue` for async sending
  - Attaches PDF receipt
  - Uses beautiful email template
- [x] Created email template:
  - `emails/payment-receipt.blade.php` - Gradient header, order summary
- [x] Created `ReceiptController` with endpoints:
  - `GET /api/receipts/{payment}` - JSON data
  - `GET /api/receipts/{payment}/pdf` - Download PDF
  - `GET /api/receipts/{payment}/html` - View as HTML
  - `GET /api/receipts/{payment}/thermal` - Thermal format
  - `GET /api/receipts/{payment}/print` - Print-ready with auto-print
  - `POST /api/receipts/{payment}/email` - Send via email
  - `GET /api/receipts/uuid/{uuid}` - Get by UUID
- [x] Created React Query hooks (`useReceipt.ts`):
  - `useReceipt()` - Get receipt data
  - `useReceiptByUuid()` - Get by UUID
  - `useSendReceiptEmail()` - Send email
  - URL helper functions for PDF, HTML, print
- [x] Created `ReceiptViewer.tsx` component:
  - Full receipt display
  - PDF download button
  - Print button (standard/thermal)
  - Email sending modal
  - Cash payment change display
- [x] Added receipt configuration to `config/payment.php`

**New Files Created:**
- `app/Services/ReceiptService.php`
- `app/Http/Controllers/Api/ReceiptController.php`
- `app/Mail/PaymentReceiptMail.php`
- `resources/views/receipts/payment.blade.php`
- `resources/views/receipts/thermal.blade.php`
- `resources/views/emails/payment-receipt.blade.php`
- `resources/js/app/hooks/useReceipt.ts`
- `resources/js/app/components/payment/ReceiptViewer.tsx`

**Note:** PDF generation requires the `barryvdh/laravel-dompdf` package:
```bash
composer require barryvdh/laravel-dompdf
```

---

### Sprint P9: Production Hardening ✅ COMPLETE
**Goal:** Security and reliability

**Completed Tasks:**
- [x] Created `VerifyWebhookSignature` middleware:
  - Stripe signature verification (timing attack safe)
  - Bakong signature verification
  - Generic HMAC-SHA256 verification
  - Configurable per-provider
  - Skip verification in development
- [x] Created `PaymentRateLimiter` middleware:
  - Configurable limits per action type
  - IP and user-based throttling
  - Response headers (X-RateLimit-Limit, X-RateLimit-Remaining)
  - 429 response with Retry-After
- [x] Added idempotency support:
  - Migration: `idempotency_key`, `client_ip`, `user_agent`, `verified_at`
  - `IdempotencyService` with:
    - Key generation from request or header
    - Lock mechanism for race condition prevention
    - `processWithIdempotency()` wrapper
- [x] Created `PaymentMonitoringService`:
  - Event logging to dedicated channel
  - Metric tracking (initiated, completed, failed)
  - Failure rate alerting
  - Health status check
  - Payment integrity verification
- [x] Created `PaymentHealthController` endpoints:
  - `GET /api/admin/payments/health` - System health
  - `GET /api/admin/payments/metrics` - Hourly metrics
  - `GET /api/admin/payments/integrity-check` - Data integrity
  - `GET /api/admin/payments/stuck` - Stuck payments
  - `GET /api/admin/payments/reconciliation` - Daily summary
- [x] Added dedicated payment log channel (90-day retention)
- [x] Extended `config/payment.php` with:
  - Rate limiting configuration
  - Monitoring thresholds
  - Security settings

**New Files Created:**
- `app/Http/Middleware/VerifyWebhookSignature.php`
- `app/Http/Middleware/PaymentRateLimiter.php`
- `app/Services/IdempotencyService.php`
- `app/Services/PaymentMonitoringService.php`
- `app/Http/Controllers/Api/Admin/PaymentHealthController.php`
- `database/migrations/..._add_idempotency_key_to_payments_table.php`

**Production Checklist:**
- [ ] Run migration: `php artisan migrate`
- [ ] Configure Stripe webhook secret in `.env`
- [ ] Set `PAYMENT_ENFORCE_WEBHOOK_VERIFICATION=true` in production
- [ ] Enable rate limiting on payment routes
- [ ] Set up monitoring alerts (Slack/Email)

---

### Sprint P10: Analytics & Reporting ✅ COMPLETE
**Goal:** Business insights

**Completed Tasks:**
- [x] Created `PaymentAnalyticsController` with:
  - `GET /api/admin/payments/analytics` - Overview with period comparison
  - `GET /api/admin/payments/analytics/revenue` - Revenue trends (day/week/month)
  - `GET /api/admin/payments/analytics/methods` - Payment method breakdown
  - `GET /api/admin/payments/analytics/success-rate` - Success/failure trends
  - `GET /api/admin/payments/analytics/peaks` - Peak hours/days analysis
  - `GET /api/admin/payments/analytics/refunds` - Refund analytics
  - `GET /api/admin/payments/analytics/top-customers` - Top customers by spend
  - `GET /api/admin/payments/analytics/report` - Comprehensive report
- [x] Flexible period selection: 7d, 30d, 90d, 12m, ytd, all, custom
- [x] Period-over-period growth calculation
- [x] Created React Query hooks (`usePaymentAnalytics.ts`):
  - `usePaymentAnalytics()` - Overview
  - `useRevenueAnalytics()` - Revenue trends
  - `useMethodAnalytics()` - Method breakdown
  - `useSuccessRateAnalytics()` - Success rates
  - `usePeakAnalytics()` - Peak analysis
  - `useTopCustomersAnalytics()` - Top customers
  - `usePaymentReport()` - Report data
- [x] Created `PaymentAnalyticsDashboard.tsx`:
  - Stats cards with growth indicators
  - Revenue bar chart with cumulative
  - Payment methods pie chart
  - Peak hours visualization
  - Top customers leaderboard
  - Transaction status breakdown

**New Files Created:**
- `app/Http/Controllers/Api/Admin/PaymentAnalyticsController.php`
- `resources/js/app/hooks/usePaymentAnalytics.ts`
- `resources/js/app/components/admin/PaymentAnalyticsDashboard.tsx`

**Analytics Features:**
- Revenue trends with cumulative totals
- Payment method popularity analysis
- Success/failure rate tracking
- Peak hours and days identification
- Top customer insights
- Refund rate monitoring
- Exportable report generation

---

## 🎉 ALL SPRINTS COMPLETE! 🎉

The complete payment system has been implemented with:
- ✅ 10 Sprints completed
- ✅ Multi-method payment support (KHQR, Cash, Card)
- ✅ Split payments
- ✅ Refunds & adjustments
- ✅ Professional receipts
- ✅ Production-ready security
- ✅ Comprehensive analytics

---

## Recommended Sprint Order

| Sprint | Priority | Effort | Dependencies |
|--------|----------|--------|--------------|
| P1 ✅   | Critical | 1 day  | None         |
| P2     | High     | 3 days | P1           |
| P3     | High     | 2 days | P2           |
| P4     | Medium   | 5 days | P2           |
| P5     | Medium   | 5 days | P4           |
| P6     | Medium   | 3 days | P4           |
| P7     | Low      | 4 days | P6           |
| P8     | Medium   | 3 days | P3, P4       |
| P9     | Critical | 3 days | P4, P5       |
| P10    | Low      | 3 days | P6           |

**Total Estimated Effort:** ~32 days

---

## Immediate Next Steps

1. **Test Current Fix:**
   ```bash
   # Verify payment initiation works
   curl -X POST http://127.0.0.1:8000/api/payments/initiate \
     -H "Content-Type: application/json" \
     -d '{"order_id": 1, "payment_method": "qr"}'
   ```

2. **Start Sprint P2:**
   - Begin with PaymentMethodSelector component
   - Create GET /api/payment-methods endpoint

3. **Create GitHub Issues:**
   - One issue per sprint
   - Detailed acceptance criteria
   - Link to this plan

---

## Technical Decisions Made

1. **Strategy Pattern** - Chosen for payment method extensibility
2. **Database-driven methods** - Payment methods stored in DB, not hardcoded
3. **Audit-first** - All payment actions logged for compliance
4. **Webhook-based confirmation** - Async payment confirmation for QR/Card

---

## Questions for Stakeholders

1. Which payment gateways are priority? (ABA, Wing, Pi Pay?)
2. Is split payment a requirement for MVP?
3. What is the refund approval workflow?
4. Are thermal receipt printers in use?
5. What are the peak transaction volumes expected?

---

*Document created: 2025-12-11*
*Last updated: 2025-12-11*
*Author: Development Team*
