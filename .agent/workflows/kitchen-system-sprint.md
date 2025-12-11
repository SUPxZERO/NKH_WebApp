---
description: Sprint P12 - Implementation of Kitchen Display System (KDS)
---

# Sprint P12: Kitchen Display System (KDS) Implementation

## Overview
Implement the backend API and real-time features for the Kitchen Display System. The frontend component `KitchenDisplay.tsx` exists but lacks the corresponding API endpoints to fetch orders and update statuses.

## Current State
- `KitchenDisplay.tsx` exists but calls non-existent endpoints (`/api/kitchen/orders`).
- No dedicated `KitchenController` handles KDS logic.
- Real-time updates use polling instead of efficient websockets.

## Tasks

### Phase 1: Backend API Implementation (Priority: CRITICAL)
**Task 1.1: Create Kitchen Controller**
- Create `app/Http/Controllers/Api/KitchenController.php`.
- Implement `index()` method to fetch active kitchen orders (pending, preparing).
- Implement `updateStatus()` method to handle transitions (received -> preparing -> ready -> completed).
- Ensure specific response format expected by `KitchenDisplay.tsx`.
- // turbo

**Task 1.2: Define API Routes**
- Add `kitchen` prefix routes in `routes/api.php`.
- Ensure routes are protected by auth/middleware if necessary (or open for local dev).
- Connect routes to `KitchenController`.

### Phase 2: Real-time Integration (Priority: HIGH)
**Task 2.1: Implement Events**
- Create `kitchen.order.created` event.
- Create `kitchen.order.updated` event.
- Broadcast these events on status changes.

**Task 2.2: Frontend Real-time Hook**
- Update `KitchenDisplay.tsx` to use `useOrderUpdates` or custom listener.
- replace polling with websocket events for immediate updates.

### Phase 3: Frontend Refinement (Priority: MEDIUM)
**Task 3.1: Verify Data Mapping**
- Ensure `KitchenOrder` interface matches API response exactly.
- Fix any TypeScript errors.

**Task 3.2: Sound & Notifications**
- Verify audio playback on new orders.
- Add toast notifications for updates.

## Implementation Steps
1. Create `KitchenController.php`.
2. Update `routes/api.php`.
3. Test `KitchenDisplay.tsx` loading data.
4. Implement real-time events.

## API Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/kitchen/orders` | Get active orders for KDS |
| PUT | `/api/kitchen/orders/{id}/status` | Update order item/order status |

