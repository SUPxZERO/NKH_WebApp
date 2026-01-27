---
name: NKH WebApp Development
description: Specialized skill for developing features in the NKH WebApp (Laravel/Inertia/React).
---

# NKH WebApp Development Guide

This skill encapsulates the standards, workflows, and best practices for the NKH WebApp.

## Project Architecture
- **Tech Stack**:
    - Backend: Laravel 11 (PHP 8.2+)
    - Frontend: React 18+ via Inertia.js 2.0
    - Styling: TailwindCSS 3.x (with shadcn/ui components)
    - Language: TypeScript (.tsx) & PHP
- **Design Pattern**:
    - **Service Layer**: Business logic lives in `app/Services`. Follow Single Responsibility Principle (e.g., `OrderPlacementService`, not just `OrderService`).
    - **Thin Controllers**: Controllers should only handle request validation/parsing and response formatting. Delegate work to Services.

## Development Workflows

### 1. New Feature Implementation
Follow this order:
1.  **Database**: Create migrations and update Models (`app/Models`).
2.  **Logic**: Implement business logic in specific Service classes (`app/Services`).
3.  **API/Route**: Expose functionality via Controllers (`app/Http/Controllers`) and Routes (`routes/web.php` or `routes/api.php`).
4.  **Frontend**:
    - Define Types in `resources/js/types`.
    - Build Components (`resources/js/Components`).
    - Construct Pages (`resources/js/Pages`).

### 2. "Human Feel" UI Guidelines
The user prioritizes a "Human", "Premium", and "Intentional" aesthetic over generic AI designs.
- **Visuals**:
    - Use refined, subtle gradients (e.g., Violet/Slate/Zinc) rather than primary defaults.
    - Avoid excessive "glow" effects or high-contrast neon unless specific.
    - Use glassmorphism and subtle borders for depth.
- **Typography**:
    - Use clear hierarchies.
- **Components**:
    - Reuse existing UI components in `resources/js/Components`.

## Common Commands
- **New Migration**: `php artisan make:migration create_table_name`
- **New Service**: Manually create in `app/Services`.
- **Run Server**: `php artisan serve` & `npm run dev`.
- **Clear Cache**: `php artisan optimize:clear`.

## Troubleshooting
- **Inertia Reloads**: Ensure `PreserveScroll` and `PreserveState` are used correctly for partial reloads.
- **TypeScript Errors**: Run `tsc --noEmit` to verify type safety.
