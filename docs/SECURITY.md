# Security Documentation

Security implementation details for the At Home Real Estate Platform.

## Overview

| Layer | Implementation | Status |
|-------|---------------|--------|
| Authentication | JWT + bcrypt | ✓ Implemented |
| Authorization | Role-based (ADMIN/AGENT) | ✓ Implemented |
| Input Validation | Zod + DOMPurify | ✓ Implemented |
| CSRF Protection | Token-based | ✓ Implemented |
| Password Security | bcrypt (12 rounds) | ✓ Implemented |

---

## 1. Authentication

### JWT Configuration

**Location:** `backend/src/middleware/auth.ts`

```typescript
// Token structure
{
  userId: string,
  iat: number,      // Issued at
  exp: number       // Expiration
}

// Configuration
JWT_SECRET: process.env.JWT_SECRET  // Required
JWT_EXPIRES_IN: "7d"                // Default expiry
```

### Password Hashing

**Library:** bcryptjs v2.4.3  
**Salt Rounds:** 12 (industry standard)

```typescript
// Hashing
const hash = await bcrypt.hash(password, 12);

// Verification
const valid = await bcrypt.compare(input, hash);
```

### Authentication Flow

```
1. Client sends credentials
   POST /api/auth/login { email, password }

2. Server validates
   - Find user by email
   - Verify password with bcrypt
   - Check isActive flag

3. Server issues JWT
   jwt.sign({ userId }, JWT_SECRET, { expiresIn })

4. Client stores token
   localStorage['vestate_token']

5. Subsequent requests
   Authorization: Bearer <token>

6. Server validates each request
   - Extract token from header
   - Verify signature
   - Check expiration
   - Load user from database
   - Verify user is active
```

### Security Validations

```typescript
// Startup validation (index.ts)
validateSecurityConfig();
// Throws if JWT_SECRET is not configured

// Request validation (auth.ts)
- TokenExpiredError → 401
- JsonWebTokenError → 401
- Missing token → 401
- Inactive user → 401
```

---

## 2. Authorization

### Role-Based Access Control

**Roles:**
- `ADMIN` - Full system access
- `AGENT` - Limited to own data

### Permission Matrix

| Resource | Action | AGENT | ADMIN |
|----------|--------|-------|-------|
| Leads | View own | ✓ | ✓ |
| Leads | View all | ✗ | ✓ |
| Leads | Create | ✓ | ✓ |
| Leads | Update own | ✓ | ✓ |
| Leads | Reassign | ✗ | ✓ |
| Leads | Delete | ✗ | ✓ |
| Users | View own | ✓ | ✓ |
| Users | View all | ✗ | ✓ |
| Users | Create | ✗ | ✓ |
| Users | Delete | ✗ | ✓ |
| Properties | View | ✓ | ✓ |
| Properties | Create | ✗ | ✓ |
| Properties | Update | ✗ | ✓ |
| Properties | Delete | ✗ | ✓ |

### Middleware Implementation

```typescript
// Authentication required
router.use(authenticate);

// Admin only routes
router.delete('/users/:id', requireAdmin, handler);

// Row-level security
if (req.user?.role !== 'ADMIN') {
  where.assignedToId = req.user?.id;
}
```

---

## 3. Input Validation

### Zod Schemas

**Location:** `src/services/validation/schemas.ts`

```typescript
// Email validation
z.string()
  .email()
  .max(255)
  .transform(v => v.toLowerCase().trim())

// Password validation
z.string()
  .min(8)
  .max(128)
  .regex(/[a-z]/)  // lowercase
  .regex(/[A-Z]/)  // uppercase
  .regex(/[0-9]/)  // digit

// Phone validation
z.string().regex(/^\+?[1-9]\d{6,14}$/)

// URL validation
z.string().url().max(2048)
```

### HTML Sanitization

**Library:** DOMPurify v3.3.1

```typescript
// Strict mode (default)
sanitizeHtml(input)  // Removes ALL HTML

// Rich text mode
sanitizeRichText(input)  // Allows: b, i, em, strong, a, p, br, ul, ol, li
```

### Sanitization Functions

```typescript
sanitizeText(input, maxLength)     // Strip HTML + limit
sanitizeEmail(input)               // Validate + normalize
sanitizePhone(input)               // Format + validate
sanitizeUrl(input)                 // Block dangerous schemes
sanitizePrice(input)               // 0 to 1 billion
sanitizeDate(input)                // ISO 8601, 1900-2100
sanitizeStringArray(input, options) // Unique + limits
sanitizeObject(input)              // Recursive sanitization
```

---

## 4. CSRF Protection

**Location:** `src/services/security/csrf.ts`

### Token Generation

```typescript
// Cryptographically secure (Web Crypto API)
const token = crypto.getRandomValues(new Uint8Array(32));

// Fallback for older browsers
Math.random() based (logged warning)
```

### Token Storage (Priority)

1. Meta tag: `<meta name="csrf-token">`
2. Cookie: `XSRF-TOKEN`
3. SessionStorage: `vestate_csrf_token`

### Validation

```typescript
// Constant-time comparison (prevents timing attacks)
function constantTimeCompare(a, b) {
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}
```

### Usage

```typescript
// Initialize on app start
initializeCsrfProtection();

// Include in requests
headers: { 'X-CSRF-Token': getCsrfToken() }

// Clear on logout
clearCsrfToken();
```

---

## 5. Security Headers

**Location:** `src/services/security/headers.ts`

### Client-Side Headers

```typescript
'X-Content-Type-Options': 'nosniff'
'X-Frame-Options': 'DENY'
'X-XSS-Protection': '1; mode=block'
'Referrer-Policy': 'strict-origin-when-cross-origin'
'X-Requested-With': 'XMLHttpRequest'
```

### Recommended Server Headers

```typescript
'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload'
'X-Permitted-Cross-Domain-Policies': 'none'
'X-DNS-Prefetch-Control': 'off'
'X-Download-Options': 'noopen'
'Cross-Origin-Opener-Policy': 'same-origin'
'Cross-Origin-Embedder-Policy': 'require-corp'
'Cross-Origin-Resource-Policy': 'same-origin'
```

### Content Security Policy

```typescript
{
  'default-src': ["'self'"],
  'script-src': ["'self'"],
  'style-src': ["'self'", "'unsafe-inline'", 'fonts.googleapis.com'],
  'font-src': ["'self'", 'fonts.gstatic.com'],
  'img-src': ["'self'", 'data:', 'https:', 'blob:'],
  'connect-src': ["'self'", 'api-url', 'wss:'],
  'frame-src': ["'none'"],
  'object-src': ["'none'"],
  'form-action': ["'self'"],
  'frame-ancestors': ["'none'"]
}
```

---

## 6. Token Manager

**Location:** `src/services/security/tokenManager.ts`

### Features

1. **Token Obfuscation**
   - XOR with browser fingerprint
   - Base64 encoding
   - Not encryption, casual inspection prevention

2. **Session Fingerprinting**
   - userAgent, language, screen, timezone
   - Detects token reuse across browsers
   - Warning logged on mismatch

3. **Memory Caching**
   - In-memory token cache
   - Reduces localStorage reads
   - Validated against storage

4. **Expiry Management**
   - Auto-detect from JWT `exp` claim
   - Periodic monitoring (60s default)
   - Event emission on expiry
   - Automatic cleanup

### API

```typescript
setToken(token)           // Store with obfuscation
getToken()                // Retrieve with validation
removeToken()             // Clear all storage
isTokenExpired()          // Check expiry
shouldRefreshToken(5)     // Refresh threshold (minutes)
startExpiryMonitoring()   // Auto-refresh detection
getTokenPayload()         // Decode JWT (client-side)
```

---

## 7. Environment Security

### Required Variables

```env
# Backend - REQUIRED
JWT_SECRET=<min 32 characters>
DATABASE_URL=<postgresql connection string>
ADMIN_EMAIL=<admin email>
ADMIN_PASSWORD=<secure password>

# RAG Backend - REQUIRED  
OPENAI_API_KEY=<your api key>
```

### Security Rules

1. **Never commit secrets** - Use .env files (gitignored)
2. **Use Render secrets** - Dashboard for production
3. **Rotate keys regularly** - Especially after exposure
4. **Validate at startup** - Fail fast if missing

---

## 8. Security Checklist

### Development

- [ ] .env files in .gitignore
- [ ] No hardcoded credentials
- [ ] Input validation on all forms
- [ ] HTTPS for external APIs

### Pre-Production

- [ ] Strong JWT_SECRET (32+ chars)
- [ ] Unique admin credentials
- [ ] API keys from secrets manager
- [ ] CORS properly configured
- [ ] Rate limiting configured

### Production

- [ ] HTTPS enforced
- [ ] Security headers enabled
- [ ] Database encrypted at rest
- [ ] Audit logging enabled
- [ ] Monitoring/alerting active

---

## 9. Incident Response

### Compromised JWT Secret

1. Generate new JWT_SECRET
2. Deploy immediately
3. All users must re-login
4. Review access logs

### Exposed API Key

1. Revoke key immediately
2. Generate new key
3. Update in secrets manager
4. Deploy with new key
5. Review API usage logs

### Database Breach

1. Rotate all passwords
2. Invalidate all sessions
3. Review access patterns
4. Notify affected users
5. Enable additional monitoring

---

## 10. Future Improvements

### High Priority

1. **Server-side security headers** - Implement via middleware
2. **Rate limiting** - Protect login, API endpoints
3. **2FA/MFA** - Add for admin accounts
4. **Refresh token rotation** - Short access, long refresh

### Medium Priority

5. **Session store** - Move to Redis
6. **Audit logging** - Track all sensitive operations
7. **Password policies** - Enforce complexity, history
8. **Account lockout** - After failed attempts

### Low Priority

9. **CSP nonces** - Remove unsafe-inline
10. **Subresource integrity** - For CDN assets
11. **Certificate pinning** - For mobile apps
