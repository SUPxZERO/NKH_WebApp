# 🍽️ NKH Restaurant Management System - Master Frontend UI/UX & API Development Prompt

## 🎯 Project Overview
Create a **modern, Gen-Z styled, fancy restaurant management system** with three distinct user interfaces and comprehensive API integration. The system should be **visually stunning, intuitive, and mobile-responsive** with smooth animations and contemporary design patterns.

## 🏗️ Tech Stack Foundation
- **Backend**: Laravel 11 with Sanctum authentication
- **Frontend**: React 18 + TypeScript + Inertia.js
- **Styling**: Tailwind CSS with custom components
- **Icons**: Heroicons, Lucide React, or React Icons
- **Animations**: Framer Motion or React Spring
- **State Management**: React Query + Zustand
- **UI Components**: Headless UI + Custom components

## 🎨 Design Philosophy - Gen-Z Aesthetic

### Visual Identity
- **Color Palette**: 
  - Primary: Vibrant gradients (purple-to-pink, blue-to-cyan)
  - Secondary: Neon accents (#00ff88, #ff6b6b, #4ecdc4)
  - Dark mode: Deep blacks (#0a0a0a) with neon highlights
  - Light mode: Clean whites with soft shadows
- **Typography**: Modern sans-serif (Inter, Poppins, or Outfit)
- **Glassmorphism**: Frosted glass effects with backdrop blur
- **Neumorphism**: Subtle 3D elements for interactive components
- **Micro-interactions**: Hover effects, loading states, success animations

### UI Patterns
- **Cards**: Rounded corners (12px+), subtle shadows, hover transformations
- **Buttons**: Gradient backgrounds, smooth transitions, icon integration
- **Forms**: Floating labels, animated validation, progress indicators
- **Navigation**: Sidebar with animated icons, breadcrumbs, smooth transitions
- **Data Tables**: Sortable, filterable, with skeleton loading states
- **Modals**: Centered overlays with backdrop blur and slide animations

## 🏢 Three-Tier Architecture

### 1. 👑 ADMIN DASHBOARD (`/admin`)
**Target Users**: Restaurant owners, managers
**Design Theme**: Professional yet modern, data-rich interface

#### Core Features:
- **📊 Dashboard**
  - Revenue analytics with interactive charts (Chart.js/Recharts)
  - Real-time order tracking with live updates
  - Employee performance metrics
  - Customer satisfaction scores
  - Expense vs revenue comparison
  - Daily/weekly/monthly reports with export functionality

- **🙋‍♀️ Customer Requests Management**
  - Real-time notification system
  - Request categorization (complaints, suggestions, reservations)
  - Response tracking and status updates
  - Customer communication history
  - Priority-based queue system

- **👥 Employee Management**
  - Employee profiles with photo upload
  - Role assignment and permissions
  - Attendance tracking with clock-in/out
  - Payroll management and salary calculations
  - Performance reviews and ratings
  - Shift scheduling with drag-and-drop calendar

- **👤 Customer Management**
  - Customer profiles and order history
  - Loyalty points tracking and rewards
  - Customer segmentation and analytics
  - Communication preferences
  - Feedback and review management

- **🏷️ Categories & Sub-Categories**
  - Hierarchical category management
  - Drag-and-drop reordering
  - Multi-language support
  - Image upload for categories
  - Active/inactive status toggle

- **💰 Expense Management**
  - Expense categorization and tracking
  - Receipt upload and OCR processing
  - Budget planning and alerts
  - Vendor management
  - Monthly/quarterly expense reports

- **📋 Order Management**
  - Order queue with real-time updates
  - Order status tracking (pending, preparing, ready, delivered)
  - Kitchen display system integration
  - Order modification and cancellation
  - Delivery tracking and assignment

- **🧾 Invoice Management**
  - Invoice generation and customization
  - Payment status tracking
  - Tax calculation and reporting
  - Invoice templates and branding
  - Automated invoice sending

- **🪑 Table & Floor Management**
  - Interactive floor plan with drag-and-drop
  - Table status visualization (occupied, reserved, available)
  - Reservation management with time slots
  - Table capacity and layout optimization
  - QR code generation for contactless ordering

#### Admin UI Components:
```typescript
// Example component structure
interface AdminDashboardProps {
  revenueData: ChartData;
  orderStats: OrderStatistics;
  employeeMetrics: EmployeePerformance[];
}

// Key components to build:
- AdminSidebar with animated icons
- DashboardCards with hover effects
- DataTable with sorting/filtering
- ModalManager for CRUD operations
- NotificationCenter with real-time updates
- ChartComponents with interactive tooltips
```

### 2. 👨‍💼 EMPLOYEE INTERFACE (`/employee`)
**Target Users**: Waiters, kitchen staff, cashiers
**Design Theme**: Streamlined, touch-friendly, efficiency-focused

#### Core Features:
- **📱 POS Order System**
  - Touch-optimized interface for tablets
  - Menu browsing with category filters
  - Table and floor selection with visual layout
  - Order customization (size, extras, special requests)
  - Split bill functionality
  - Multiple payment method support
  - Receipt printing and email options
  - Order modification and cancellation

- **🍽️ Menu Management**
  - Real-time menu availability updates
  - Item popularity indicators
  - Special offers and promotions display
  - Ingredient availability alerts
  - Quick add frequently ordered items

- **📊 Order Tracking**
  - Kitchen order queue display
  - Order preparation status updates
  - Delivery assignment and tracking
  - Customer notification system
  - Order history and analytics

#### Employee UI Components:
```typescript
// POS-specific components
interface POSOrderProps {
  menuItems: MenuItem[];
  tables: Table[];
  floors: Floor[];
  currentOrder: Order;
}

// Key components:
- TouchFriendlyMenu with large buttons
- TableSelector with visual floor plan
- OrderSummary with modification options
- PaymentProcessor with multiple methods
- ReceiptGenerator with print options
```

### 3. 🛍️ CUSTOMER INTERFACE (`/`)
**Target Users**: Restaurant customers
**Design Theme**: Instagram-worthy, mobile-first, engaging

#### Core Features:
- **🏠 Customer Dashboard**
  - Personalized welcome with user avatar
  - Order history with reorder functionality
  - Loyalty points and rewards display
  - Favorite items and recommendations
  - Special offers and promotions
  - Upcoming reservations

- **🍕 Online Ordering System**
  - **Two Main Ordering Modes** (as popup panels):
    
    **🚚 DELIVERY MODE**:
    - Interactive menu with high-quality food images
    - Customization options (size, toppings, special requests)
    - Shopping cart with real-time total calculation
    - Delivery time slot selection with calendar picker
    - Address management with map integration
    - GPS location detection and validation
    - Delivery fee calculation based on distance
    - Additional delivery instructions field
    - Real-time order tracking with map
    - Estimated delivery time with live updates

    **🏃‍♂️ PICKUP MODE**:
    - Same menu interface as delivery
    - Pickup time slot selection
    - Restaurant location display with directions
    - Order preparation time estimates
    - Pickup confirmation and QR code
    - Notification system for order ready alerts

#### Customer UI Components:
```typescript
// Customer-specific interfaces
interface OrderingModalProps {
  mode: 'delivery' | 'pickup';
  menuItems: MenuItem[];
  userAddresses: CustomerAddress[];
  timeSlots: TimeSlot[];
}

// Key components:
- HeroSection with food carousel
- MenuGrid with filter and search
- OrderingModal with mode selection
- AddressManager with map integration
- TimeSlotPicker with availability
- OrderTracker with real-time updates
- LoyaltyPointsDisplay with animations
```

## 🔗 API Integration Strategy

### Authentication & Authorization
```typescript
// API client setup with Sanctum
const apiClient = axios.create({
  baseURL: '/api',
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
});

// Role-based route protection
interface UserRole {
  admin: AdminRoutes;
  employee: EmployeeRoutes;
  customer: CustomerRoutes;
}
```

### Real-time Features
- **WebSocket Integration**: Laravel Broadcasting with Pusher
- **Live Order Updates**: Real-time status changes
- **Notification System**: Toast notifications for all user types
- **Kitchen Display**: Live order queue updates

### API Endpoints Mapping:

#### Admin APIs:
```typescript
// Dashboard analytics
GET /api/admin/dashboard/analytics
GET /api/admin/dashboard/orders/stats
GET /api/admin/dashboard/revenue/{period}

// Management endpoints
GET|POST|PUT|DELETE /api/admin/employees
GET|POST|PUT|DELETE /api/admin/customers
GET|POST|PUT|DELETE /api/admin/categories
GET|POST|PUT|DELETE /api/admin/expenses
GET|POST|PUT|DELETE /api/admin/tables
GET|POST|PUT|DELETE /api/admin/floors

// Customer requests
GET /api/admin/customer-requests
PATCH /api/admin/customer-requests/{id}/status
```

#### Employee APIs:
```typescript
// POS operations
GET /api/employee/menu
POST /api/employee/orders
PUT /api/employee/orders/{id}/items
POST /api/employee/orders/{id}/submit

// Table management
GET /api/employee/tables/available
PATCH /api/employee/tables/{id}/status
```

#### Customer APIs:
```typescript
// Public menu access
GET /api/menu
GET /api/categories

// Customer operations
GET /api/customer/profile
GET /api/customer/orders
POST /api/online-orders
GET /api/customer/addresses
GET /api/time-slots
```

## 🎭 Component Library Structure

### Shared Components:
```typescript
// Base components
- Button (variants: primary, secondary, danger, ghost)
- Input (variants: text, email, password, number)
- Select (with search and multi-select)
- Modal (with different sizes and animations)
- Card (with hover effects and loading states)
- Table (with sorting, filtering, pagination)
- Toast (success, error, warning, info)
- Loading (skeleton, spinner, progress)

// Complex components
- ImageUploader (with drag-and-drop and preview)
- DateTimePicker (with calendar and time slots)
- MapSelector (for addresses and locations)
- ChartComponents (line, bar, pie, donut)
- FileUploader (with progress and validation)
```

### Layout Components:
```typescript
// Admin layout
- AdminSidebar (collapsible with icons)
- AdminHeader (with notifications and user menu)
- AdminBreadcrumbs (with navigation history)

// Employee layout
- EmployeeHeader (simplified with quick actions)
- POSLayout (optimized for touch interfaces)

// Customer layout
- CustomerHeader (with cart and user menu)
- CustomerFooter (with social links and info)
- MobileNavigation (bottom navigation for mobile)
```

## 📱 Responsive Design Requirements

### Breakpoints:
- **Mobile**: 320px - 768px (primary focus for customers)
- **Tablet**: 768px - 1024px (optimized for employee POS)
- **Desktop**: 1024px+ (admin dashboard primary)

### Mobile-First Features:
- Touch-optimized buttons (minimum 44px)
- Swipe gestures for navigation
- Pull-to-refresh functionality
- Offline mode with service workers
- Progressive Web App (PWA) capabilities

## 🚀 Performance Optimization

### Code Splitting:
```typescript
// Route-based splitting
const AdminDashboard = lazy(() => import('./pages/admin/Dashboard'));
const EmployeePOS = lazy(() => import('./pages/employee/POS'));
const CustomerMenu = lazy(() => import('./pages/customer/Menu'));
```

### Image Optimization:
- WebP format with fallbacks
- Lazy loading with intersection observer
- Responsive images with srcset
- Image compression and CDN integration

### Caching Strategy:
- React Query for API caching
- Service worker for offline functionality
- Local storage for user preferences
- Session storage for temporary data

## 🔒 Security Considerations

### Frontend Security:
- Input validation and sanitization
- XSS protection with DOMPurify
- CSRF token handling
- Secure cookie configuration
- Rate limiting on API calls

### Authentication Flow:
```typescript
// Sanctum token management
const authStore = {
  token: localStorage.getItem('auth_token'),
  user: JSON.parse(localStorage.getItem('user') || '{}'),
  login: async (credentials) => { /* implementation */ },
  logout: async () => { /* implementation */ },
  refreshToken: async () => { /* implementation */ },
};
```

## 🧪 Testing Strategy

### Unit Testing:
- Jest for component testing
- React Testing Library for user interactions
- MSW for API mocking

### E2E Testing:
- Cypress for critical user flows
- Playwright for cross-browser testing

### Performance Testing:
- Lighthouse CI integration
- Bundle size monitoring
- Core Web Vitals tracking

## 📦 Deployment & DevOps

### Build Process:
```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "test": "jest",
    "e2e": "cypress run",
    "lint": "eslint . --ext ts,tsx",
    "type-check": "tsc --noEmit"
  }
}
```

### Environment Configuration:
```typescript
// Environment variables
interface AppConfig {
  API_BASE_URL: string;
  PUSHER_KEY: string;
  GOOGLE_MAPS_API_KEY: string;
  STRIPE_PUBLISHABLE_KEY: string;
  APP_ENV: 'development' | 'staging' | 'production';
}
```

## 🎉 Success Metrics

### User Experience:
- Page load time < 2 seconds
- First Contentful Paint < 1.5 seconds
- Cumulative Layout Shift < 0.1
- Mobile usability score > 95%

### Business Metrics:
- Order completion rate > 90%
- User engagement time
- Customer satisfaction scores
- Employee efficiency metrics

## 🚀 Implementation Roadmap

### Phase 1: Foundation (Week 1-2)
- [ ] Set up project structure and build tools
- [ ] Create design system and component library
- [ ] Implement authentication system
- [ ] Build basic layouts for all three interfaces

### Phase 2: Core Features (Week 3-4)
- [ ] Admin dashboard with analytics
- [ ] Employee POS system
- [ ] Customer menu and ordering
- [ ] API integration and state management

### Phase 3: Advanced Features (Week 5-6)
- [ ] Real-time updates and notifications
- [ ] Payment processing integration
- [ ] Mobile optimization and PWA features
- [ ] Testing and performance optimization

### Phase 4: Polish & Deploy (Week 7-8)
- [ ] UI/UX refinements and animations
- [ ] Security auditing and optimization
- [ ] Documentation and training materials
- [ ] Production deployment and monitoring

---

## 💡 Development Tips

1. **Start with Mobile**: Design mobile-first, then scale up
2. **Component Reusability**: Build once, use everywhere
3. **Performance First**: Optimize from day one
4. **User Feedback**: Implement analytics and feedback loops
5. **Accessibility**: Follow WCAG guidelines
6. **Documentation**: Document components and APIs thoroughly

This master prompt provides a comprehensive blueprint for creating a modern, Gen-Z styled restaurant management system that's both functional and visually stunning. Focus on creating smooth user experiences with delightful micro-interactions while maintaining the professional functionality required for restaurant operations.
