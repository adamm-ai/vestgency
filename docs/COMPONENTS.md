# React Components Documentation

Comprehensive guide to all React components in the At Home Real Estate Platform.

## Overview

| Category | Count | Description |
|----------|-------|-------------|
| Layout | 3 | Navigation, footer, mobile nav |
| Hero/Sections | 5 | Landing page sections |
| Property | 5 | Property display components |
| Search/Intelligence | 2 | AI-powered search |
| Admin Portal | 8 | CRM management interface |
| UI/Utility | 6 | Reusable UI components |

---

## 1. Layout Components

### Navbar (`/components/Navbar.tsx`)

**Purpose:** Main navigation with mobile-responsive menu and theme toggle

**Features:**
- Fixed top navigation with scroll-aware transparency
- Mobile full-screen menu overlay with iOS-style animations
- Theme toggle (dark/light mode) with localStorage persistence
- Smooth scroll navigation to page sections
- React.memo optimization

**Usage:**
```tsx
<Navbar />
```

### Footer (`/components/Footer.tsx`)

**Purpose:** Multi-section footer with newsletter, navigation, and contact info

**Props:**
| Prop | Type | Description |
|------|------|-------------|
| onAdminClick | `() => void` | Optional callback for admin link |

**Features:**
- Newsletter subscription form
- Four-column grid layout (collapsible on mobile)
- Social links with spring animations
- Legal links and contact information
- Mobile safe area support

### MobileBottomNav (`/components/MobileBottomNav.tsx`)

**Purpose:** Mobile-only bottom navigation bar

**Features:**
- Five nav items: Home, Biens, Favoris, Services, Contact
- Auto-hide/show based on scroll direction
- Active section detection via scroll position
- Haptic feedback on tap
- Hidden on admin routes

---

## 2. Hero & Landing Sections

### Hero (`/components/Hero.tsx`)

**Purpose:** Full-screen hero with background image and CTAs

**Features:**
- Premium villa background with gradient overlay
- Animated badge, title, subtitle with spring easing
- Two CTA buttons: "Découvrir nos biens", "Estimer mon bien"
- Stats bar: 500+ biens, 15+ années, 98% satisfaits
- Floating accent elements on large screens

### Features (`/components/Features.tsx`)

**Purpose:** Services showcase with highlights grid

**Highlights:**
- 500+ transactions
- Accompagnement 7j/7
- Réseau qualifié
- Garantie satisfaction

### About (`/components/About.tsx`)

**Purpose:** Company information with image gallery

**Stats Displayed:**
- 250+ Properties Sold
- 12y Market Expertise

### Gallery (`/components/Gallery.tsx`)

**Purpose:** Horizontal scrollable image showcase

**Features:**
- Mobile: horizontal scroll with snap-to-center
- Desktop: infinite CSS scroll animation
- Lazy-loaded images
- Hover effects

### Blog (`/components/Blog.tsx`)

**Purpose:** Blog posts carousel/grid

**BlogCard Props:**
- image, title, excerpt, date, category
- Category badges with brand colors
- Lazy image loading

---

## 3. Property Components

### Listings (`/components/Listings.tsx`)

**Purpose:** Main property listings with search, filter, and grid display

**Features:**
- Grid/list view toggle
- Advanced filter panel (price, area, beds, status)
- Sorting (date, price, location, type)
- Pagination with configurable items per page
- Skeleton loader while fetching
- Integration with PropertyModal

**Internal Components:**
- `LazyImage` - Intersection observer-based lazy loading
- `FilterPanel` - Collapsible filter controls
- `SortDropdown` - Sort options

### PropertyCard (`/components/admin/properties/PropertyCard.tsx`)

**Purpose:** Property card for admin portal

**Props:**
| Prop | Type | Required |
|------|------|----------|
| property | `Property & { isActive?: boolean }` | Yes |
| isSelected | `boolean` | No |
| onSelect | `(id: string) => void` | No |
| onView | `(property: Property) => void` | Yes |
| onEdit | `(property: Property) => void` | Yes |
| onDelete | `(id: string) => void` | Yes |
| onToggleActive | `(property: Property) => void` | No |

**Features:**
- Checkbox selection
- Category badge (Location/Vente)
- Status indicator
- Action buttons (View, Edit, Delete, Toggle)

### PropertyModal (`/components/PropertyModal.tsx`)

**Purpose:** Modal with detailed property information

**Props:**
| Prop | Type | Description |
|------|------|-------------|
| property | `Property` | Property to display |
| onClose | `() => void` | Close handler |

**Features:**
- Image carousel with touch swipe
- Keyboard navigation (Escape, Arrow keys)
- Pull-to-dismiss gesture (mobile)
- Image preloading
- Share and like buttons
- Contact/inquiry options

### Villas (`/components/Villas.tsx`)

**Purpose:** Premium villas showcase section

**Features:**
- ListingCard component with villa details
- AI Smart Tags display
- Price display with gradient
- Specs: beds, baths, area

---

## 4. Search & Intelligence Components

### IntelligentSearch (`/components/IntelligentSearch.tsx`)

**Purpose:** AI-powered search with RAG integration

**Props:**
| Prop | Type | Description |
|------|------|-------------|
| onSearch | `(query, ragResponse?) => void` | Search callback |
| onQuickSelect | `(result) => void` | Quick select callback |
| category | `ListingCategory` | Filter category |
| placeholder | `string` | Input placeholder |
| className | `string` | CSS classes |

**Features:**
- RAG service health check
- Autocomplete suggestions
- Intent detection and labeling
- Popular searches quick actions
- Fallback to local search if RAG unavailable

### Chatbot (`/components/Chatbot.tsx`)

**Purpose:** NOUR - AI Real Estate Assistant with CRM integration

**Features:**
- Floating trigger button (glass pill style)
- Full-screen modal (mobile) / side panel (desktop)
- Message history with streaming
- Property card suggestions
- Quick action buttons
- Expandable window on desktop

**CRM Integration:**
- Extracts contact info from messages
- Detects demand intent (search, sale, rental management)
- Creates leads and demands automatically
- Tracks property interest
- Updates engagement scores
- AI urgency detection

**Property Card Component (internal):**
- Horizontal card with image, price, location, specs
- Click to navigate to property

---

## 5. Contact & Forms

### Contact (`/components/Contact.tsx`)

**Purpose:** Contact form with project type selection

**Project Types:**
- Achat, Location, Vente, Estimation, Gestion locative

**Features:**
- Dynamic form fields based on project type
- Property details for sellers (type, price, surface, beds)
- CRM lead and demand creation on submission
- Success/error notifications
- Responsive form layout

---

## 6. Admin Portal Components

### AdminLogin (`/components/admin/auth/AdminLogin.tsx`)

**Props:**
| Prop | Type | Description |
|------|------|-------------|
| onLogin | `(user, rememberMe) => void` | Login callback |
| onClose | `() => void` | Close handler |

**Features:**
- Email/password input
- Show password toggle
- Remember me checkbox
- Rate limiting (5 attempts, 60s cooldown)
- Countdown timer display

### PropertyManagement (`/components/admin/properties/PropertyManagement.tsx`)

**Props:**
| Prop | Type | Description |
|------|------|-------------|
| onPropertySelect | `(property) => void` | Selection callback |

**Features:**
- List/Grid view toggle
- Advanced filter panel
- Search and sort options
- Pagination (20 items/page default)
- Bulk actions (select, delete, export)
- Property add/edit modal
- CSV export functionality

### UsersManagement (`/components/admin/users/UsersManagement.tsx`)

**Props:**
| Prop | Type | Description |
|------|------|-------------|
| leads | `CRM.Lead[]` | Lead list |
| refreshCRM | `() => void` | Refresh callback |

**Features:**
- Agent list with search
- Add/Edit/Delete agent modals
- Agent form: name, email, phone, role, maxLeads
- Role selection (admin/agent)

### AnalyticsDashboard (`/components/admin/analytics/AnalyticsDashboard.tsx`)

**Props:**
| Prop | Type | Description |
|------|------|-------------|
| leads | `CRM.Lead[]` | Lead data |
| crmStats | `CRM.CRMStats | null` | Statistics |

**Features:**
- Monthly lead trends
- Lead source distribution
- Lead status distribution
- Conversion funnel visualization
- Export report to CSV
- Animated bar charts

### AdminCard (`/components/admin/shared/AdminCard.tsx`)

**Props:**
| Prop | Type | Default |
|------|------|---------|
| title | `string` | - |
| subtitle | `string` | - |
| icon | `ReactNode` | - |
| iconBg | `string` | - |
| iconColor | `string` | - |
| actions | `ReactNode` | - |
| footer | `ReactNode` | - |
| variant | `'default' | 'stat' | 'highlight' | 'outlined'` | 'default' |
| onClick | `() => void` | - |
| disableHover | `boolean` | false |
| padding | `'none' | 'sm' | 'md' | 'lg'` | 'md' |
| isLoading | `boolean` | false |

### AdminModal (`/components/admin/shared/AdminModal.tsx`)

**Props:**
| Prop | Type | Default |
|------|------|---------|
| isOpen | `boolean` | Required |
| onClose | `() => void` | Required |
| title | `string` | Required |
| subtitle | `string` | - |
| size | `'sm' | 'md' | 'lg' | 'xl' | 'full'` | 'md' |
| showCloseButton | `boolean` | true |
| closeOnOverlayClick | `boolean` | true |
| closeOnEscape | `boolean` | true |
| footer | `ReactNode` | - |
| icon | `ReactNode` | - |

**Features:**
- Multiple size options
- Overlay with blur backdrop
- Spring animation
- Escape key handling

**AdminConfirmModal:**
- Specialized confirmation modal
- Variants: danger, warning, info

### AdminTable (`/components/admin/shared/AdminTable.tsx`)

**Props:**
| Prop | Type | Description |
|------|------|-------------|
| data | `T[]` | Table data |
| columns | `AdminTableColumn<T>[]` | Column definitions |
| keyExtractor | `(item) => string` | Key function |
| onRowClick | `(item) => void` | Row click handler |
| isLoading | `boolean` | Loading state |
| emptyMessage | `string` | Empty state message |
| pagination | `AdminTablePagination` | Pagination config |
| selectable | `boolean` | Enable selection |
| selectedIds | `string[]` | Selected items |
| onSelectionChange | `(ids) => void` | Selection callback |
| compact | `boolean` | Compact mode |
| striped | `boolean` | Striped rows |
| hoverable | `boolean` | Hover effect |

---

## 7. UI & Utility Components

### SkeletonLoader (`/components/SkeletonLoader.tsx`)

**Exports:**
| Component | Description |
|-----------|-------------|
| Skeleton | Base skeleton with variants |
| PropertyCardSkeleton | Property card loading state |
| ListingsGridSkeleton | Grid of property skeletons |
| FilterButtonsSkeleton | Filter controls loading |

**Base Props:**
- variant: shape type
- width/height: dimensions
- animation: 'pulse' | 'wave' | 'none'

### Pagination (`/components/ui/Pagination.tsx`)

**Props:**
| Prop | Type | Default |
|------|------|---------|
| currentPage | `number` | Required |
| totalPages | `number` | Required |
| onPageChange | `(page) => void` | Required |
| pageSize | `number` | 10 |
| pageSizeOptions | `number[]` | [10, 25, 50] |
| onPageSizeChange | `(size) => void` | - |
| totalItems | `number` | - |
| showPageSizeSelector | `boolean` | false |
| showItemCount | `boolean` | false |
| showFirstLast | `boolean` | true |
| maxVisiblePages | `number` | 5 |
| size | `'sm' | 'md' | 'lg'` | 'md' |
| variant | `'default' | 'minimal' | 'rounded'` | 'default' |

**CompactPagination:**
- Minimal variant with prev/next and page indicator

### VirtualList (`/components/ui/VirtualList.tsx`)

**Props:**
| Prop | Type | Description |
|------|------|-------------|
| items | `T[]` | Data array |
| itemHeight | `number | (index, item) => number` | Row height |
| height | `number | string` | Container height |
| width | `number | string` | Container width |
| overscan | `number` | Buffer rows |
| renderItem | `(item, index, style) => ReactNode` | Renderer |
| getItemKey | `(index, item) => string | number` | Key function |
| emptyMessage | `ReactNode` | Empty state |
| isLoading | `boolean` | Loading state |
| onScroll | `(offset) => void` | Scroll callback |
| onEndReached | `() => void` | Infinite scroll |
| endReachedThreshold | `number` | Trigger threshold |
| initialScrollIndex | `number` | Initial position |

### ErrorBoundary (`/components/ErrorBoundary.tsx`)

**Props:**
| Prop | Type | Description |
|------|------|-------------|
| children | `ReactNode` | Child components |
| fallback | `ReactNode` | Custom fallback UI |

**Features:**
- Catches React errors
- Displays error message
- Retry button
- Error logging

---

## 8. Performance Patterns

### Memo Optimization
Most components use `React.memo` to prevent unnecessary re-renders.

### Lazy Loading
- `LazyImage`: Intersection Observer-based image loading
- `VirtualList`: Efficient rendering of large lists

### Debounced Input
- `useDebounce` hook for search inputs
- Prevents excessive API calls

### Direct DOM Manipulation
- `MobileBottomNav` uses refs to avoid state updates
- Better performance for scroll-based UI

---

## 9. Styling Approach

### Design System
- Glassmorphic/iOS design language
- Tailwind CSS with custom brand colors
- Spring easing: `cubic-bezier(0.34, 1.56, 0.64, 1)`
- Mobile-first responsive design
- Dark mode via CSS class toggle

### Touch Targets
- Minimum 44x44px for interactive elements
- Safe area inset support for notch devices

### Animations
- Framer Motion for complex animations
- CSS transitions for simple effects
- Hardware acceleration with `will-change`
- Reduced motion support via `useReducedMotion`

---

## 10. Accessibility

- ARIA labels and roles throughout
- Semantic HTML structure
- Keyboard navigation support
- Focus management in modals
- Color contrast compliance
- Screen reader compatibility

---

## Component Dependencies

```
App
├── Navbar
├── Hero
├── Features
├── Villas
│   └── ListingCard
├── Listings
│   ├── LazyImage
│   ├── FilterPanel
│   └── PropertyModal
├── IntelligentSearch
├── Gallery
├── About
├── Blog
│   └── BlogCard
├── Contact
├── Chatbot
│   └── PropertyCard
├── MobileBottomNav
├── Footer
└── AdminPortal (when authenticated)
    ├── AdminLogin
    ├── PropertyManagement
    │   ├── PropertyCard
    │   ├── AdminTable
    │   └── AdminModal
    ├── UsersManagement
    │   └── AdminModal
    └── AnalyticsDashboard
        └── AdminCard
```

