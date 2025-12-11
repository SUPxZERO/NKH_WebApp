---
description: Sprint P14 - Admin Analytics & Reporting Implementation
---

# Sprint P14: Admin Analytics & Reporting Implementation

## Overview
Implement the comprehensive Admin Dashboard and Reporting module. This includes visualizing sales data, order statistics, and revenue trends using charts, and verifying the data accuracy of the underlying API endpoints.

## Current State
- `admin/Dashboard.tsx` exists but needs verification of chart components and data integration.
- Backend controllers (`AdminDashboardController`, `AnalyticsController`) exist but may need logic refinement.
- Routes exist.

## Tasks

### Phase 1: Dashboard Visualization (Priority: HIGH)
**Task 1.1: Verify Charts Integration**
- Ensure `Recharts` or `Chart.js` components are rendering correctly in `Dashboard.tsx`.
- Connect `revenueEndpoint` and `orderStatsEndpoint` to the chart components.
- Fix any hydration or data formatting issues.

**Task 1.2: Key Metrics Cards**
- Implement accurate "Total Revenue", "Active Orders", "New Customers" cards.
- Ensure they pull real-time or cached data efficiently.

### Phase 2: Detailed Reports (Priority: MEDIUM)
**Task 2.1: Sales Report**
- Create `admin/Reports/SalesReport.tsx`.
- Table view of daily sales.
- Filters by date range, category, payment mode.
- Export to PDF/CSV functionality.

**Task 2.2: Inventory Report**
- Create `admin/Reports/InventoryReport.tsx`.
- Visualise low stock items, cost of goods sold (COGS).

### Phase 3: Backend Data Accuracy (Priority: HIGH)
**Task 3.1: Validate Aggregation Queries**
- optimized SQL queries in `AnalyticsController`.
- Ensure timezones are handled correctly in date grouping.

## Implementation Steps
1. Review `AdminDashboardController.php`.
2. Update `Dashboard.tsx` to fully utilize API data.
3. Build Reports pages.

## API Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/dashboard/analytics` | Overview stats |
| GET | `/api/admin/dashboard/revenue/daily` | Revenue chart data |
| GET | `/api/admin/reports/sales` | Detailed sales report |

