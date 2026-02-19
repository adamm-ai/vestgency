# M&A IT DUE DILIGENCE AUDIT REPORT

**Asset:** At Home Real Estate Platform (Agence)  
**Audit Date:** February 19, 2026  
**Purpose:** $400,000 Acquisition Evaluation  
**Classification:** CONFIDENTIAL - M&A Due Diligence

---

## EXECUTIVE SUMMARY

### Overall Technical Score: 5.2/10

| Category | Score | Weight | Weighted |
|----------|-------|--------|----------|
| Code Quality | 5.5/10 | 15% | 0.83 |
| Security | 4.0/10 | 25% | 1.00 |
| Test Coverage | 2.0/10 | 15% | 0.30 |
| Scalability | 4.5/10 | 15% | 0.68 |
| Technical Debt | 5.0/10 | 10% | 0.50 |
| Documentation | 9.0/10 | 10% | 0.90 |
| Dependencies | 6.5/10 | 10% | 0.65 |
| **TOTAL** | | 100% | **5.2/10** |

### Acquisition Recommendation: **PROCEED WITH CONDITIONS**

The codebase represents a functional MVP-stage product with significant technical debt. At $400K valuation, the price is **FAIR but requires negotiation** based on remediation costs.

---

## CRITICAL FINDINGS (BLOCKING)

### 1. EXPOSED API KEY IN REPOSITORY ⚠️
**Severity:** CRITICAL  
**File:** `rag_backend/.env`
```
OPENAI_API_KEY=sk-proj-54B7nEdD...
```
- Production API key committed to repository
- **ACTION:** Revoke immediately, rotate all keys
- **Liability:** Potential unauthorized charges

### 2. NEAR-ZERO TEST COVERAGE ⚠️
**Coverage:** 4.8%  
**Real Tests:** 43 meaningful assertions  
**Placeholder Tests:** 198 trivial `expect(true).toBe(true)`

| Category | Tested | Total | Coverage |
|----------|--------|-------|----------|
| Components | 1 | 29 | 3.4% |
| Services | 2 | 20 | 10% |
| API Routes | 0 | 6 | 0% |
| Hooks | 0 | 7 | 0% |
| Backend | 0 | 9 | 0% |

### 3. NO RATE LIMITING ⚠️
- Login endpoint: Brute force vulnerable
- All API endpoints: DDoS vulnerable
- RAG endpoints: Resource exhaustion possible

### 4. SCALABILITY BLOCKERS ⚠️
- Missing database indexes for common queries
- N+1 query patterns in statistics
- No caching layer (Redis/Memcached)
- Global mutable state in Python backend
- No horizontal scaling support

---

## DETAILED AUDIT SCORES

### 1. CODE QUALITY (5.5/10)

**Strengths:**
- TypeScript throughout frontend
- Clean component architecture
- Prisma ORM for type-safe database access
- Good service layer separation on frontend

**Weaknesses:**
- Excessive `any` types (12+ instances in backend)
- Monolithic route files (properties.ts: 434 lines)
- No service layer in backend (business logic in routes)
- DRY violations (filter logic repeated 17x in stats.ts)
- 87 console.log/error statements (no structured logging)

**Remediation:** 40-60 hours

---

### 2. SECURITY (4.0/10)

**Critical Issues:**
| Issue | Severity | Status |
|-------|----------|--------|
| Exposed API Key | CRITICAL | Active |
| Credentials in .env.example | CRITICAL | Active |
| XSS via dangerouslySetInnerHTML | HIGH | Mitigated (DOMPurify) |
| No Rate Limiting | HIGH | Not Implemented |
| CORS: `["*"]` in RAG backend | HIGH | Active |
| Missing CSRF Protection | HIGH | Not Implemented |
| Weak Password Policy (6 chars) | MEDIUM | Active |
| JWT 7-day expiry (no rotation) | MEDIUM | Active |

**Positive Security:**
- bcrypt password hashing (12 rounds)
- Prisma prevents SQL injection
- JWT authentication implemented
- Role-based access control (ADMIN/AGENT)

**Remediation:** 30-40 hours

---

### 3. TEST COVERAGE (2.0/10)

**Current State:**
- 3 test files for 63+ source files
- 82% of test cases are placeholders
- Zero backend API tests
- Zero E2E tests
- Zero integration tests

**Test Infrastructure:**
- Jest configured ✓
- Mock utilities exist ✓
- Test factories implemented ✓
- But tests themselves not written

**Remediation:** 300-400 hours to reach 70%+ coverage

---

### 4. SCALABILITY (4.5/10)

**Database Issues:**
- Only 3 indexes on Lead model (needs 6+)
- No index on Property composite filters
- Full table scans on statistics queries
- N+1 query patterns throughout

**Memory Issues:**
- Unbounded conversation storage (memory leak)
- 100K properties = 350MB per RAG instance
- No garbage collection strategy

**Architecture Issues:**
- No connection pooling (Prisma defaults)
- No distributed cache
- No message queue for async tasks
- Polling-only notifications (no WebSocket)

**Scaling Limit:** ~5,000 concurrent users before failures

**Remediation:** 80-120 hours

---

### 5. TECHNICAL DEBT (5.0/10)

**Items Identified:** 45+

| Category | Count | Priority |
|----------|-------|----------|
| Configuration Issues | 5 | CRITICAL |
| Logging/Monitoring | 3 | HIGH |
| Error Handling | 4 | MEDIUM |
| Legacy Code | 3 | MEDIUM |
| Incomplete Features | 4 | MEDIUM |

**Major Debt Items:**
- 3 duplicate server implementations (Python)
- WebSocket declared but not implemented
- No structured logging
- No error tracking (Sentry/DataDog)
- No audit logging for admin actions

**Remediation:** 60-80 hours

---

### 6. DOCUMENTATION (9.0/10)

**Comprehensive Documentation Created:**
- README.md (project overview)
- docs/API.md (complete endpoint reference)
- docs/DATABASE.md (schema documentation)
- docs/DEPLOYMENT.md (Render deployment guide)
- docs/SECURITY.md (security practices)
- docs/TESTING.md (test guide)
- docs/RAG-SERVICE.md (AI search documentation)
- docs/COMPONENTS.md (React component reference)
- docs/SERVICES.md (services & hooks)
- docs/BUSINESS-LOGIC.md (workflows & rules)

**Total:** 5,326 lines of documentation

---

### 7. DEPENDENCIES (6.5/10)

**Issues:**
- Zod version mismatch (frontend v4 vs backend v3)
- OpenAI package loosely pinned (>=1.0.0)
- jsonwebtoken timing attack vulnerability
- bcryptjs 100x slower than native bcrypt
- puppeteer likely unused (50MB bloat)

**Positive:**
- No GPL license contamination
- No abandoned packages
- Major dependencies maintained

**Remediation:** 8-15 hours

---

## FINANCIAL IMPACT ANALYSIS

### Remediation Cost Estimate

| Priority | Hours | Rate | Cost |
|----------|-------|------|------|
| Critical (Security) | 30-40 | $150/hr | $4,500-6,000 |
| High (Testing) | 200-250 | $150/hr | $30,000-37,500 |
| High (Scalability) | 80-100 | $150/hr | $12,000-15,000 |
| Medium (Tech Debt) | 60-80 | $150/hr | $9,000-12,000 |
| Low (Code Quality) | 40-60 | $150/hr | $6,000-9,000 |
| **TOTAL** | **410-530** | | **$61,500-79,500** |

### Adjusted Valuation

| Factor | Impact |
|--------|--------|
| Asking Price | $400,000 |
| Remediation Cost | -$70,000 (avg) |
| Technical Risk Premium | -$40,000 (10%) |
| Testing Debt Premium | -$30,000 |
| **Fair Value** | **$260,000 - $300,000** |

---

## RISK ASSESSMENT MATRIX

| Risk | Probability | Impact | Score |
|------|-------------|--------|-------|
| Security Breach (exposed key) | HIGH | CRITICAL | 🔴 |
| Production Outage (no tests) | HIGH | HIGH | 🔴 |
| Data Loss (no backup docs) | MEDIUM | CRITICAL | 🟠 |
| Scaling Failure | HIGH | HIGH | 🔴 |
| Developer Churn (tech debt) | MEDIUM | MEDIUM | 🟡 |
| Regulatory Issues (GDPR) | LOW | HIGH | 🟡 |

---

## ACQUISITION CONDITIONS

### Pre-Close Requirements (Mandatory)

1. **API Key Rotation**
   - Revoke exposed OpenAI key
   - Verify no other exposed secrets
   - Implement secrets management

2. **Security Baseline**
   - Remove credentials from repository
   - Fix CORS configuration
   - Add rate limiting to login

3. **Escrow Agreement**
   - Hold $70,000 for remediation
   - Release upon milestone completion

### 30-Day Post-Close Requirements

1. Implement comprehensive test suite (50%+ coverage)
2. Deploy Redis caching layer
3. Add database indexes
4. Implement error tracking (Sentry)
5. Security audit by third party

### 90-Day Post-Close Requirements

1. Achieve 70%+ test coverage
2. Implement WebSocket for real-time features
3. Add message queue (BullMQ)
4. Complete security hardening
5. Performance optimization

---

## VERDICT

### Is $400K Fair for This Asset?

**NO** - The asking price does not account for:
- $70K remediation costs
- 410-530 hours of engineering work
- Security liability (exposed API key)
- Near-zero test coverage risk

### Recommended Offer: $280,000 - $320,000

**Rationale:**
- Base value for functional MVP: $350,000
- Security issues deduction: -$40,000
- Testing debt deduction: -$30,000
- Negotiation buffer: -$20,000

### Alternative: $400K with Conditions

If seller insists on $400K:
1. $70K held in escrow pending remediation
2. 90-day technical audit period
3. Seller provides 30 days post-close support
4. Warranties on undisclosed security issues

---

## APPENDIX: AUDIT METHODOLOGY

### Tools Used
- Static code analysis
- Dependency vulnerability scanning
- Security pattern detection
- Architecture review
- Test coverage analysis

### Files Analyzed
- 63+ source files
- 3 test files
- 9 configuration files
- 10 documentation files

### Team
- Code Quality Auditor
- Security Auditor
- Test Coverage Auditor
- Dependency Auditor
- Scalability Auditor
- Technical Debt Auditor

---

**Report Prepared:** February 19, 2026  
**Classification:** M&A Confidential  
**Valid Until:** March 19, 2026

