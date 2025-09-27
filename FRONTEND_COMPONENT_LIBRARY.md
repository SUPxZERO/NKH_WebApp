# 🎨 NKH Restaurant Management - Component Library Documentation

## 📋 Overview

This document provides a comprehensive guide to the Gen-Z styled component library built for the NKH Restaurant Management System. All components follow modern design principles with glassmorphism, vibrant gradients, and smooth animations.

## 🎯 Design System

### **Color Palette**
```css
/* Primary Gradients */
--gradient-primary: linear-gradient(135deg, #e879f9 0%, #ec4899 100%);
--gradient-secondary: linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%);

/* Neon Accents */
--neon-green: #00ff88;
--neon-pink: #ff6b6b;
--neon-cyan: #4ecdc4;

/* Dark Mode */
--bg-dark: #0a0a0a;
--bg-card-dark: rgba(255, 255, 255, 0.05);

/* Light Mode */
--bg-light: #fdfdfc;
--bg-card-light: rgba(255, 255, 255, 0.7);
```

### **Typography**
- **Font Family**: Inter, Poppins, or system fonts
- **Font Weights**: 400 (regular), 500 (medium), 600 (semibold), 700 (bold)
- **Scale**: 12px, 14px, 16px, 18px, 20px, 24px, 32px, 48px

### **Spacing Scale**
- **Base Unit**: 4px
- **Scale**: 4px, 8px, 12px, 16px, 20px, 24px, 32px, 40px, 48px, 64px

## 🧩 Core Components

### **Button Component**
```typescript
// Location: resources/js/app/components/ui/Button.tsx

interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

// Usage Examples
<Button variant="primary">Primary Action</Button>
<Button variant="secondary" leftIcon={<Plus />}>Add Item</Button>
<Button variant="danger" loading>Deleting...</Button>
```

**Features:**
- ✅ Gradient backgrounds with hover effects
- ✅ Loading states with disabled interaction
- ✅ Icon support (left/right positioning)
- ✅ Multiple sizes and variants
- ✅ Smooth transitions and animations

### **Input Component**
```typescript
// Location: resources/js/app/components/ui/Input.tsx

interface InputProps {
  label?: string;
  hint?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

// Usage Examples
<Input label="Email" type="email" placeholder="Enter your email" />
<Input label="Search" leftIcon={<Search />} />
<Input label="Password" type="password" error="Password is required" />
```

**Features:**
- ✅ Floating labels with smooth animations
- ✅ Icon support (left/right positioning)
- ✅ Error and hint text display
- ✅ Glassmorphism styling with backdrop blur
- ✅ Focus states with gradient borders

### **Card Component**
```typescript
// Location: resources/js/app/components/ui/Card.tsx

interface CardProps {
  hover?: boolean;
}

// Usage Examples
<Card>
  <CardHeader>
    <h3>Card Title</h3>
  </CardHeader>
  <CardContent>
    <p>Card content goes here</p>
  </CardContent>
  <CardFooter>
    <Button>Action</Button>
  </CardFooter>
</Card>
```

**Features:**
- ✅ Glassmorphism with backdrop blur
- ✅ Hover animations (lift effect)
- ✅ Structured layout (Header, Content, Footer)
- ✅ Responsive design
- ✅ Shadow effects with color gradients

### **Modal Component**
```typescript
// Location: resources/js/app/components/ui/Modal.tsx

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  hideClose?: boolean;
}

// Usage Examples
<Modal open={isOpen} onClose={() => setIsOpen(false)} title="Edit Item">
  <form>
    <Input label="Name" />
    <Button type="submit">Save</Button>
  </form>
</Modal>
```

**Features:**
- ✅ Framer Motion animations (slide + fade)
- ✅ Backdrop blur with click-to-close
- ✅ Keyboard navigation (ESC to close)
- ✅ Multiple sizes with responsive behavior
- ✅ Glassmorphism styling

### **Loading Components**
```typescript
// Location: resources/js/app/components/ui/Loading.tsx

// Usage Examples
<Spinner className="w-6 h-6" />
<Skeleton className="h-4 w-32" />
<SkeletonText lines={3} />
```

**Features:**
- ✅ Animated spinner with gradient colors
- ✅ Skeleton placeholders for content loading
- ✅ Customizable dimensions and line counts
- ✅ Smooth pulse animations

## 🎭 Advanced Components

### **ImageUploader Component**
```typescript
// Location: resources/js/app/components/ui/ImageUploader.tsx

interface ImageUploaderProps {
  value?: string | null;
  onChange: (file: File | null, preview?: string | null) => void;
  accept?: string;
  maxSize?: number; // in MB
}

// Usage Example
<ImageUploader
  value={imageUrl}
  onChange={(file, preview) => setImage(file)}
  maxSize={5}
/>
```

**Features:**
- ✅ Drag and drop functionality
- ✅ File validation (type and size)
- ✅ Image preview with remove option
- ✅ Progress indicators
- ✅ Error handling and display

### **ThemeSwitcher Component**
```typescript
// Location: resources/js/app/components/ui/ThemeSwitcher.tsx

// Usage Example
<ThemeSwitcher />
```

**Features:**
- ✅ Light/Dark/System theme options
- ✅ Animated indicator with Framer Motion
- ✅ Persistent theme storage
- ✅ System preference detection

### **SuccessAnimation Component**
```typescript
// Location: resources/js/app/components/ui/SuccessAnimation.tsx

interface SuccessAnimationProps {
  show: boolean;
  title?: string;
  message?: string;
  onComplete?: () => void;
}

// Usage Example
<SuccessAnimation
  show={showSuccess}
  title="Order Placed!"
  message="Your order has been successfully submitted."
  onComplete={() => setShowSuccess(false)}
/>
```

**Features:**
- ✅ Full-screen overlay with backdrop blur
- ✅ Animated checkmark with sparkle effects
- ✅ Ripple animation effects
- ✅ Auto-dismiss with callback

## 🏗️ Layout Components

### **AdminLayout**
```typescript
// Location: resources/js/app/layouts/AdminLayout.tsx

// Features:
- Collapsible sidebar with animated icons
- Header with notifications and user menu
- Breadcrumb navigation
- Responsive design for desktop-first usage
```

### **EmployeeLayout**
```typescript
// Location: resources/js/app/layouts/EmployeeLayout.tsx

// Features:
- Simplified header with quick actions
- Touch-optimized for tablet usage
- POS-focused layout structure
```

### **CustomerLayout**
```typescript
// Location: resources/js/app/layouts/CustomerLayout.tsx

// Features:
- Mobile-first responsive design
- Bottom navigation for mobile
- Cart integration in header
- Social media footer
```

## 📊 Specialized Components

### **RevenueLine Chart**
```typescript
// Location: resources/js/app/components/charts/RevenueLine.tsx

interface RevenuePoint {
  label: string;
  value: number;
}

// Usage Example
<RevenueLine data={revenueData} />
```

**Features:**
- ✅ Recharts integration
- ✅ Responsive container
- ✅ Custom styling with gradients
- ✅ Interactive tooltips
- ✅ Dark mode support

### **NotificationCenter**
```typescript
// Location: resources/js/app/components/admin/NotificationCenter.tsx

// Usage Example
<NotificationCenter />
```

**Features:**
- ✅ Real-time notification display
- ✅ Unread count badge
- ✅ Mark as read functionality
- ✅ Categorized notification types
- ✅ Smooth animations

### **OrderingModal**
```typescript
// Location: resources/js/app/components/customer/OrderingModal.tsx

interface OrderingModalProps {
  open: boolean;
  onClose: () => void;
  mode: 'delivery' | 'pickup';
}

// Usage Example
<OrderingModal
  open={showOrdering}
  onClose={() => setShowOrdering(false)}
  mode="delivery"
/>
```

**Features:**
- ✅ Full-screen modal for mobile
- ✅ Menu browsing with categories
- ✅ Cart management
- ✅ Address and time slot selection
- ✅ Real-time total calculation

## 🎨 Styling Guidelines

### **Glassmorphism Implementation**
```css
.glass-card {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 16px;
}
```

### **Gradient Buttons**
```css
.gradient-button {
  background: linear-gradient(135deg, #e879f9 0%, #ec4899 100%);
  box-shadow: 0 8px 20px -6px rgba(236, 72, 153, 0.5);
  transition: all 0.2s ease;
}

.gradient-button:hover {
  filter: brightness(1.1);
  transform: translateY(-1px);
}
```

### **Animation Patterns**
```css
/* Hover lift effect */
.hover-lift {
  transition: transform 0.3s ease;
}

.hover-lift:hover {
  transform: translateY(-2px);
}

/* Pulse animation for loading */
.pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
```

## 🔧 Utility Functions

### **Class Name Utility**
```typescript
// Location: resources/js/app/utils/cn.ts

export function cn(...classes: Array<string | undefined | null | false>) {
  return classes.filter(Boolean).join(' ');
}

// Usage
<div className={cn('base-class', isActive && 'active-class', className)} />
```

### **Toast Utilities**
```typescript
// Location: resources/js/app/utils/toast.ts

export function toastSuccess(message: string, opts?: ToastOptions);
export function toastError(message: string, opts?: ToastOptions);
export function toastLoading<T>(promise: Promise<T>, messages: {...});

// Usage
toastSuccess('Item saved successfully!');
toastLoading(saveItem(), {
  loading: 'Saving...',
  success: 'Saved!',
  error: 'Failed to save'
});
```

## 📱 Responsive Design

### **Breakpoints**
```typescript
// Tailwind CSS breakpoints used throughout
sm: '640px',   // Mobile landscape
md: '768px',   // Tablet
lg: '1024px',  // Desktop
xl: '1280px',  // Large desktop
2xl: '1536px'  // Extra large
```

### **Mobile-First Approach**
- All components start with mobile styles
- Progressive enhancement for larger screens
- Touch-friendly interactions (44px minimum)
- Optimized for thumb navigation

## 🎯 Best Practices

### **Component Development**
1. **Single Responsibility**: Each component has one clear purpose
2. **Composition**: Use compound components (Card + CardHeader + CardContent)
3. **Accessibility**: Include ARIA labels and keyboard navigation
4. **Performance**: Use React.memo for expensive components
5. **TypeScript**: Strict typing for all props and state

### **Styling Guidelines**
1. **Consistent Spacing**: Use Tailwind spacing scale
2. **Color Harmony**: Stick to defined color palette
3. **Animation Timing**: Use consistent duration (200ms for micro, 300ms for transitions)
4. **Z-Index Scale**: Defined layers (10, 20, 30, 40, 50, 60)
5. **Border Radius**: Consistent rounding (8px, 12px, 16px, 24px)

### **State Management**
1. **Local State**: useState for component-specific state
2. **Global State**: Zustand for app-wide state (theme, cart)
3. **Server State**: React Query for API data
4. **Form State**: Controlled components with validation

## 🚀 Performance Optimizations

### **Code Splitting**
```typescript
// Lazy load heavy components
const AdminDashboard = lazy(() => import('./pages/admin/Dashboard'));
const OrderingModal = lazy(() => import('./components/customer/OrderingModal'));
```

### **Image Optimization**
- WebP format with fallbacks
- Lazy loading with intersection observer
- Responsive images with srcset
- Placeholder blur effects

### **Bundle Optimization**
- Tree shaking for unused code
- Dynamic imports for route-based splitting
- Vendor chunk separation
- Asset compression and minification

---

## 🎉 Component Library Complete!

This component library provides a solid foundation for building modern, Gen-Z styled interfaces with:

- **Consistent Design System**
- **Reusable Components**
- **Accessibility Features**
- **Performance Optimizations**
- **Mobile-First Responsive Design**
- **Smooth Animations**
- **Type Safety**

All components are production-ready and follow modern React best practices!
