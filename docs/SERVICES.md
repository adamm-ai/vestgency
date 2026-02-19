# Services & Hooks Documentation

Complete reference for all services and custom React hooks in the At Home platform.

## Overview

| Category | Count | Description |
|----------|-------|-------------|
| Custom Hooks | 12 | React hooks for state & behavior |
| API Services | 5 | Backend communication |
| Security Services | 4 | Auth, CSRF, validation |
| Monitoring | 2 | Error tracking & analytics |
| Real-time | 1 | WebSocket management |

---

## 1. Custom React Hooks

### useWebSocket (`/hooks/useWebSocket.ts`)

**Purpose:** Real-time WebSocket integration

```typescript
const { isConnected, send, reconnect } = useWebSocket({
  url: 'wss://api.example.com',
  events: {
    'notification:new': handleNotification,
    'lead:updated': handleLeadUpdate
  },
  autoConnect: true
});
```

**Returns:**
| Property | Type | Description |
|----------|------|-------------|
| isConnected | `boolean` | Connection status |
| connectionState | `string` | State: connecting/connected/disconnected |
| send | `(event, data) => void` | Send message |
| reconnect | `() => void` | Force reconnection |
| connect | `() => void` | Manual connect |
| disconnect | `() => void` | Manual disconnect |

### useWebSocketEvent (`/hooks/useWebSocket.ts`)

**Purpose:** Subscribe to a single WebSocket event

```typescript
useWebSocketEvent('notification:new', (data) => {
  console.log('New notification:', data);
});
```

### useNotifications (`/hooks/useNotifications.ts`)

**Purpose:** Real-time notifications with API fallback

```typescript
const {
  notifications,
  unreadCount,
  markAsRead,
  markAllAsRead,
  refresh
} = useNotifications();
```

**Returns:**
| Property | Type | Description |
|----------|------|-------------|
| notifications | `Notification[]` | All notifications |
| unreadCount | `number` | Unread count |
| isLoading | `boolean` | Loading state |
| error | `Error | null` | Error state |
| isRealtime | `boolean` | Using WebSocket |
| markAsRead | `(id) => void` | Mark single read |
| markAllAsRead | `() => void` | Mark all read |
| deleteNotification | `(id) => void` | Delete |
| refresh | `() => void` | Force refresh |

### useVirtualList (`/hooks/useVirtualList.ts`)

**Purpose:** Virtual scrolling for large lists

```typescript
const { virtualItems, totalHeight, containerRef } = useVirtualList({
  items: data,
  itemHeight: 50,
  containerHeight: 400,
  overscan: 5
});
```

**Returns:**
| Property | Type | Description |
|----------|------|-------------|
| virtualItems | `VirtualItem[]` | Visible items |
| totalHeight | `number` | Total list height |
| scrollToIndex | `(index) => void` | Scroll to item |
| scrollToOffset | `(offset) => void` | Scroll to position |
| containerRef | `RefObject` | Container ref |

### useDynamicVirtualList (`/hooks/useVirtualList.ts`)

**Purpose:** Virtual list for unknown/dynamic heights

```typescript
const { virtualItems, measureElement } = useDynamicVirtualList({
  items: data,
  estimateHeight: 100,
  containerHeight: 400
});
```

### usePagination (`/hooks/usePagination.ts`)

**Purpose:** Client-side pagination state

```typescript
const {
  state,
  goToPage,
  nextPage,
  prevPage,
  pageRange
} = usePagination({
  totalItems: 100,
  initialPageSize: 10
});
```

**Returns:**
| Property | Type | Description |
|----------|------|-------------|
| state | `{ page, pageSize, totalPages }` | Current state |
| goToPage | `(page) => void` | Go to page |
| nextPage | `() => void` | Next page |
| prevPage | `() => void` | Previous page |
| goToFirst | `() => void` | First page |
| goToLast | `() => void` | Last page |
| hasNextPage | `boolean` | Has next |
| hasPrevPage | `boolean` | Has previous |
| pageRange | `number[]` | Page numbers |
| setPageSize | `(size) => void` | Change size |
| getDataSlice | `(data) => T[]` | Slice data |

### useServerPagination (`/hooks/usePagination.ts`)

**Purpose:** Server-side pagination state

```typescript
const { page, pageSize, offset, getQueryParams } = useServerPagination({
  initialPageSize: 20
});

// Use in API call
const params = getQueryParams(); // { page: 1, limit: 20, offset: 0 }
```

### useInfiniteScroll (`/hooks/useInfiniteScroll.ts`)

**Purpose:** Infinite scroll with Intersection Observer

```typescript
const { sentinelRef, isLoading } = useInfiniteScroll({
  loadMore: fetchNextPage,
  hasMore: hasNextPage,
  threshold: 0.5
});

// In JSX
<div ref={sentinelRef} />
```

**Returns:**
| Property | Type | Description |
|----------|------|-------------|
| sentinelRef | `RefObject` | Trigger element ref |
| isLoading | `boolean` | Loading state |
| error | `Error | null` | Error state |
| reset | `() => void` | Reset state |
| retry | `() => void` | Retry load |

### useScrollInfinite (`/hooks/useInfiniteScroll.ts`)

**Purpose:** Scroll position-based infinite scroll

```typescript
const { isLoading, reset } = useScrollInfinite({
  loadMore: fetchNextPage,
  hasMore: hasNextPage,
  scrollThreshold: 200,
  direction: 'down'
});
```

### useBidirectionalInfinite (`/hooks/useInfiniteScroll.ts`)

**Purpose:** Bidirectional infinite scroll (chat-like)

```typescript
const {
  topSentinelRef,
  bottomSentinelRef,
  isLoadingTop,
  isLoadingBottom
} = useBidirectionalInfinite({
  loadMore: fetchNewer,
  loadPrevious: fetchOlder,
  hasMore: hasNewer,
  hasPrevious: hasOlder
});
```

### useReducedMotion (`/hooks/useReducedMotion.ts`)

**Purpose:** Detect user's reduced motion preference

```typescript
const prefersReducedMotion = useReducedMotion();

// Use in animations
const animation = prefersReducedMotion ? {} : { scale: 1.1 };
```

### useAccessibleAnimation (`/hooks/useReducedMotion.ts`)

**Purpose:** Conditional animation props

```typescript
const animationProps = useAccessibleAnimation({
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  transition: { duration: 0.3 }
});

// Returns empty object if reduced motion preferred
<motion.div {...animationProps} />
```

---

## 2. API Service (`/services/api.ts`)

**Purpose:** Central HTTP client for backend communication

### Authentication API

```typescript
// Login
const { token, user } = await authAPI.login(email, password);

// Get current user
const user = await authAPI.getMe();

// Change password
await authAPI.changePassword(currentPassword, newPassword);

// Register (admin only)
const user = await authAPI.register(email, password, fullName, role);

// Logout
authAPI.logout();

// Refresh token
const { token } = await authAPI.refreshToken();
```

### Users API

```typescript
// Get all users
const users = await usersAPI.getAll();

// Get agents only
const agents = await usersAPI.getAgents();

// Get by ID
const user = await usersAPI.getById(id);

// Update user
const user = await usersAPI.update(id, data);

// Delete user
await usersAPI.delete(id);
```

### Leads API

```typescript
// Get leads with filters
const { leads, total } = await leadsAPI.getAll({
  status: 'NEW',
  assignedToId: 'user-id',
  page: 1,
  limit: 20
});

// Get single lead
const lead = await leadsAPI.getById(id);

// Create lead
const lead = await leadsAPI.create({
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@example.com',
  source: 'WEBSITE_FORM',
  urgency: 'HIGH'
});

// Update lead
const lead = await leadsAPI.update(id, { status: 'CONTACTED' });

// Delete lead
await leadsAPI.delete(id);

// Add activity
await leadsAPI.addActivity(id, {
  type: 'note_added',
  title: 'Follow-up call',
  description: 'Client interested in 3BR apartments'
});
```

### Properties API

```typescript
// Get properties with filters
const { properties, total } = await propertiesAPI.getAll({
  category: 'SALE',
  type: 'Villa',
  city: 'Casablanca',
  priceMin: 1000000,
  priceMax: 5000000,
  page: 1,
  limit: 12
});

// Get single property
const property = await propertiesAPI.getById(id);

// Create property
const property = await propertiesAPI.create(data);

// Update property
const property = await propertiesAPI.update(id, data);

// Delete property
await propertiesAPI.delete(id);

// Bulk import
await propertiesAPI.import(properties);
```

### Statistics API

```typescript
// Get CRM stats
const stats = await statsAPI.getCRM();
// Returns: { totalLeads, newLeadsToday, conversionRate, ... }

// Get dashboard stats
const dashboard = await statsAPI.getDashboard();
// Returns: { totalLeads, totalProperties, recentLeads, ... }

// Get agent stats
const agents = await statsAPI.getAgents();
// Returns: [{ agent, leadCount, conversionRate }, ...]
```

### Notifications API

```typescript
// Get all notifications
const notifications = await notificationsAPI.getAll();

// Mark as read
await notificationsAPI.markRead(id);

// Mark all as read
await notificationsAPI.markAllRead();

// Delete notification
await notificationsAPI.delete(id);
```

### Token Management

```typescript
// Get stored token
const token = getStoredToken();

// Get stored user
const user = getStoredUser();

// Set auth data
setAuthData(token, user);

// Clear auth data
clearAuthData();

// Check API availability
const isAvailable = await isAPIAvailable();
```

---

## 3. CRM API Service (`/services/crmApiService.ts`)

**Purpose:** Backend-first CRM with offline support

### Architecture
- **Data Source:** Backend API (single source of truth)
- **Cache:** localStorage (read-only fallback)
- **Sync:** Queue for offline operations
- **Strategy:** Optimistic updates with rollback

### Lead Operations

```typescript
// Get leads
const leads = await crmApiService.getLeads({
  status: 'NEW',
  source: 'CHATBOT'
});

// Get single lead
const lead = await crmApiService.getLeadById(id);

// Create lead (auto-scoring)
const lead = await crmApiService.createLead({
  firstName: 'Ahmed',
  phone: '+212600000000',
  source: 'CHATBOT',
  urgency: 'HIGH'
});

// Update lead (auto-rescore)
const lead = await crmApiService.updateLead(id, {
  status: 'QUALIFIED',
  budgetMin: 2000000
});

// Delete lead
await crmApiService.deleteLead(id);

// Add activity
await crmApiService.addActivityToLead(leadId, {
  type: 'call_made',
  title: 'Follow-up call',
  description: 'Discussed property options'
});

// Add note (convenience)
await crmApiService.addNoteToLead(leadId, 'Client prefers Anfa area');
```

### Lead Scoring

```typescript
// Calculate score (0-100)
const score = crmApiService.calculateLeadScore(lead);

// Score components:
// - Source: 0-25 points (referral=25, chatbot=20, etc.)
// - Urgency: 0-30 points (critical=30, high=25, etc.)
// - Engagement: 0-20 points (chat messages)
// - Qualification: 0-15 points (budget, property interest)
// - Contact: 0-10 points (email=5, phone=5)

// Get urgency from score
const urgency = crmApiService.getUrgencyFromScore(score);
// Returns: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
```

### Statistics & Agents

```typescript
// Get CRM stats
const stats = await crmApiService.getCRMStats();

// Get all agents
const agents = await crmApiService.getAgents();

// Get single agent
const agent = await crmApiService.getAgentById(id);

// Get notifications
const notifications = await crmApiService.getNotifications();
const unread = await crmApiService.getUnreadNotifications();

// Mark notification read
await crmApiService.markNotificationAsRead(id);
await crmApiService.markAllNotificationsAsRead();
```

### Sync Management

```typescript
// Get sync status
const status = crmApiService.getSyncStatus();
// Returns: { pendingOperations, lastSyncTime, isOnline }

// Force sync
await crmApiService.forceSync();

// Process queue manually
await crmApiService.processSyncQueue();

// Initialize service
await initializeCRMApiService();
```

### Caching

- **TTL:** 5 minutes
- **Invalidation:** Automatic on updates
- **Fallback:** Cache used when offline
- **Sync Queue:** Operations queued when offline

---

## 4. Property Service (`/services/propertyService.ts`)

**Purpose:** Property management with RAG fallback

```typescript
// Get properties
const { properties, total } = await propertyService.getProperties({
  category: 'SALE',
  type: 'Villa',
  city: 'Casablanca',
  priceMin: 1000000,
  priceMax: 5000000,
  features: ['Piscine', 'Jardin'],
  sort: 'price_desc',
  page: 1,
  limit: 12
});

// Get single property
const property = await propertyService.getPropertyById(id);

// Get statistics
const stats = await propertyService.getStats();
// Returns: { total, bySale, byRent, byType, byCity }

// Get filter options
const filters = await propertyService.getFilterOptions();
// Returns: { types, cities, features, priceRanges }

// Search properties
const results = await propertyService.searchProperties('villa piscine', 10);

// Get featured
const featured = await propertyService.getFeaturedProperties('SALE', 6);

// Preload data
await propertyService.preloadData();
```

---

## 5. RAG Search Service (`/services/ragSearchService.ts`)

**Purpose:** AI-powered semantic search

```typescript
// Create client
const ragClient = new RAGSearchClient();

// Health check
const health = await ragClient.checkHealth();
// Returns: { status, version, index_loaded, total_properties }

// Semantic search
const results = await ragClient.search('villa avec piscine à anfa', {
  top_k: 12,
  mode: 'hybrid', // 'semantic' | 'hybrid' | 'agent'
  filters: { category: 'SALE' }
});
// Returns: { results, intent, confidence, filters_detected }

// Quick search (autocomplete)
const suggestions = await ragClient.quickSearch('villa', 8);

// Get similar properties
const similar = await ragClient.getSimilar(propertyId, 5);

// Get single property
const property = await ragClient.getProperty(propertyId);
```

### Convenience Functions

```typescript
// Main search
const results = await ragSearch(query, options);

// Quick search
const suggestions = await ragQuickSearch(query, limit);

// Similar properties
const similar = await getSimilarProperties(propertyId, topK);

// Preload on app init
await preloadRAGService();
```

---

## 6. Security Services

### CSRF Protection (`/services/security/csrf.ts`)

```typescript
// Initialize on app start
initializeCsrfProtection();

// Get token
const token = getCsrfToken();

// Add to headers
const headers = withCsrfHeader(existingHeaders);
// or
const headers = createCsrfHeaders({ 'Content-Type': 'application/json' });

// Validate token
const isValid = validateCsrfToken(token);

// Clear on logout
clearCsrfToken();
```

**Token Sources (priority):**
1. Meta tag: `<meta name="csrf-token">`
2. Cookie: `XSRF-TOKEN`
3. SessionStorage: `vestate_csrf_token`

### Token Manager (`/services/security/tokenManager.ts`)

```typescript
// Store token (obfuscated)
setToken(jwtToken);

// Retrieve token
const token = getToken();

// Remove token
removeToken();

// Check expiry
const expired = isTokenExpired();
const expiry = getTokenExpiry(); // Date object
const remaining = getTokenTimeRemaining(); // milliseconds

// Should refresh?
const shouldRefresh = shouldRefreshToken(5); // 5 minutes threshold

// Get payload
const payload = getTokenPayload();
// Returns: { userId, iat, exp }

// Token events
const unsubscribe = onTokenEvent((event) => {
  // event: 'set' | 'remove' | 'expire' | 'refresh'
});

// With events
setTokenWithEvent(token);
removeTokenWithEvent();

// Expiry monitoring
startExpiryMonitoring(60000, () => {
  // Called when token expires
});
stopExpiryMonitoring();
```

### Security Headers (`/services/security/headers.ts`)

```typescript
// Apply to fetch options
const init = withSecurityHeaders({ method: 'POST' });

// Create headers object
const headers = createSecureHeaders({
  'Content-Type': 'application/json'
});

// Get preset
const headers = getHeaderPreset('production');
// Presets: 'production', 'development', 'api', 'upload'

// Generate CSP
const csp = generateCspHeader({
  'default-src': ["'self'"],
  'script-src': ["'self'", "'unsafe-inline'"]
});

// Validate response
const issues = validateResponseHeaders(response);
// Returns missing/weak headers

// Sanitize headers
const safe = sanitizeHeaders(headers);
// Removes dangerous headers
```

### Security Index (`/services/security/index.ts`)

```typescript
// Create secure request
const init = createSecureRequest({
  method: 'POST',
  body: JSON.stringify(data)
});

// Initialize all security
const cleanup = initializeSecurity({
  enableCsrf: true,
  enableExpiryMonitoring: true,
  expiryCheckInterval: 60000,
  onTokenExpire: () => redirectToLogin()
});

// Cleanup on unmount
cleanup();

// Or manual cleanup
cleanupSecurity();
```

---

## 7. Validation & Sanitization

### Zod Schemas (`/services/validation/schemas.ts`)

```typescript
// Common schemas
emailSchema.parse('user@example.com');
phoneSchema.parse('+212600000000');
urlSchema.parse('https://example.com');
dateStringSchema.parse('2024-01-15');
priceSchema.parse(1500000);
surfaceSchema.parse(250);

// Enum schemas
leadStatusEnum.parse('NEW');
leadUrgencyEnum.parse('HIGH');
leadSourceEnum.parse('CHATBOT');
propertyCategoryEnum.parse('SALE');

// Form schemas
leadCreateSchema.parse({
  firstName: 'Ahmed',
  email: 'ahmed@example.com',
  source: 'WEBSITE_FORM'
});

contactFormSchema.parse({
  name: 'User',
  email: 'user@example.com',
  message: 'Interested in properties'
});
```

### Sanitization (`/services/validation/sanitize.ts`)

```typescript
// HTML sanitization
const clean = sanitizeHtml('<script>alert("xss")</script>Hello');
// Returns: 'Hello'

const richText = sanitizeRichText('<b>Bold</b><script>bad</script>');
// Returns: '<b>Bold</b>'

// Email sanitization
const email = sanitizeEmail('  USER@Example.COM  ');
// Returns: 'user@example.com'

const result = validateEmail(email);
// Returns: { isValid, normalized, errors }

// Phone sanitization
const phone = sanitizePhone('06 12 34 56 78');
// Returns: '+212612345678'

const formatted = formatPhoneDisplay('+212612345678');
// Returns: '+212 6 12 34 56 78'

// Generic sanitization
const text = sanitizeText('<b>Hello</b> World', 100);
// Returns: 'Hello World' (max 100 chars)

const obj = sanitizeObject({ name: '<script>x</script>John' });
// Returns: { name: 'John' }

const url = sanitizeUrl('javascript:alert(1)');
// Returns: '' (blocked scheme)

const num = sanitizeNumber('123.45', { min: 0, max: 1000 });
// Returns: 123.45

const price = sanitizePrice('1500000');
// Returns: 1500000 (validated 0-1B)

const date = sanitizeDate('2024-01-15');
// Returns: Date object

const arr = sanitizeStringArray(['a', 'b', 'a', ''], { unique: true });
// Returns: ['a', 'b']
```

### Zod Integration

```typescript
// Validate with schema
const result = sanitizeInput(data, schema);
// Returns: { success, data?, errors? }

// Async validation
const result = await sanitizeInputAsync(data, asyncSchema);

// Throw on error
const data = validateOrThrow(input, schema);

// Create reusable validator
const validateLead = createValidator(leadSchema);
const result = validateLead(input);

// Field-level errors
const errors = validateFields(data, schema);
// Returns: { fieldName: 'Error message' }

// Convert to form state
const formErrors = errorsToFormState(zodResult);
```

---

## 8. Monitoring Services

### Error Tracking (`/services/monitoring/errorTracker.ts`)

```typescript
// Capture error with context
captureError(error, {
  component: 'PropertyCard',
  action: 'fetchImage',
  propertyId: '123'
});

// Log message
captureMessage('Payment processed', 'info');

// React error
captureReactError(error);

// Set user context
setUserContext({ id: 'user-id', email: 'user@example.com' });
clearUserContext();

// Initialize
initErrorTracking({
  dsn: 'https://...',
  environment: 'production'
});
```

### Analytics (`/services/monitoring/analytics.ts`)

```typescript
// Track event
trackEvent('Property', 'View', 'villa-123');

// Track page view
trackPageView('/properties/123');

// Track timing
trackTiming('API', 'search', 245);

// Identify user
trackIdentify('user-id', { plan: 'premium' });

// Track interactions
trackClick('property-cta-button');
trackFormSubmit('contact-form');
trackSearch('villa piscine', 12);

// User management
setAnalyticsUser('user-id');
clearAnalyticsUser();

// Configuration
configureAnalytics({
  trackingId: 'GA-XXX',
  debug: false
});
```

---

## 9. Real-time Services

### WebSocket Manager (`/services/realtime/websocket.ts`)

```typescript
const ws = new WebSocketManager();

// Connect
ws.connect('wss://api.example.com/ws');

// Subscribe to events
ws.subscribe('notification:new', (data) => {
  console.log('New notification:', data);
});

ws.subscribe('lead:updated', (data) => {
  console.log('Lead updated:', data);
});

// Send message
ws.send('chat:message', { text: 'Hello' });

// Connection management
ws.disconnect();
ws.reconnect();

// Get connection state
const state = ws.getState();
// 'connecting' | 'connected' | 'disconnected' | 'error'
```

**Features:**
- Auto-reconnection with exponential backoff
- Message queuing when offline
- Heartbeat mechanism
- Max 5 reconnect attempts
- Max 100 queued messages

**Built-in Events:**
- `connection_state` - Connection changes
- `notification:new` - New notification
- `notification:read` - Marked read
- `lead:updated` - Lead changes
- `message:new` - New message

**Helper:**
```typescript
const wsUrl = getWebSocketUrl();
// Auto-determines WS URL from environment
```

---

## Service Architecture

### Design Principles

1. **Backend-First**
   - Backend is single source of truth
   - localStorage for offline cache only
   - Optimistic updates with rollback

2. **Offline Support**
   - Sync queue for offline operations
   - Automatic retry on reconnection
   - Graceful degradation

3. **Caching Strategy**
   - 5-minute TTL default
   - Smart invalidation on updates
   - Fallback when API unavailable

4. **Security Layers**
   - CSRF on state-changing requests
   - Token obfuscation
   - Security headers
   - Input sanitization

5. **Real-Time Integration**
   - WebSocket for live updates
   - API polling fallback
   - Event-driven architecture

6. **Error Handling**
   - Exponential backoff retry
   - User context in reports
   - Graceful error messages

