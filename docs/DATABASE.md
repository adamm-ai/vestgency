# Database Schema Documentation

PostgreSQL database schema managed with Prisma ORM.

## Overview

- **Provider:** PostgreSQL
- **ORM:** Prisma 5.10.0
- **Total Models:** 5
- **Total Enums:** 5

---

## Enums

### UserRole
```prisma
enum UserRole {
  ADMIN
  AGENT
}
```

### LeadStatus
```prisma
enum LeadStatus {
  NEW
  CONTACTED
  QUALIFIED
  VISIT_SCHEDULED
  VISIT_COMPLETED
  PROPOSAL_SENT
  NEGOTIATION
  WON
  LOST
}
```

### LeadSource
```prisma
enum LeadSource {
  CHATBOT
  WEBSITE_FORM
  PHONE
  EMAIL
  WALK_IN
  REFERRAL
  SOCIAL_MEDIA
  OTHER
}
```

### LeadUrgency
```prisma
enum LeadUrgency {
  LOW
  MEDIUM
  HIGH
  CRITICAL
}
```

### PropertyCategory
```prisma
enum PropertyCategory {
  RENT
  SALE
}
```

---

## Models

### User

System users (agents and administrators).

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | String | @id @default(uuid()) | Primary key |
| email | String | @unique | User email |
| password | String | - | Bcrypt hashed |
| fullName | String | - | Display name |
| role | UserRole | @default(AGENT) | Access level |
| phone | String? | - | Phone number |
| avatarUrl | String? | - | Profile image |
| isActive | Boolean | @default(true) | Account status |
| lastLogin | DateTime? | - | Last login time |
| createdAt | DateTime | @default(now()) | Created timestamp |
| updatedAt | DateTime | @updatedAt | Updated timestamp |

**Relations:**
- `assignedLeads: Lead[]` - Leads assigned to user
- `createdLeads: Lead[]` - Leads created by user
- `activities: LeadActivity[]` - Activities logged by user
- `notifications: Notification[]` - User notifications

---

### Lead

CRM lead entity for tracking potential customers.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | String | @id @default(uuid()) | Primary key |
| firstName | String | - | First name |
| lastName | String? | - | Last name |
| email | String? | - | Email address |
| phone | String? | - | Phone number |
| city | String? | - | City of interest |
| status | LeadStatus | @default(NEW) | Pipeline status |
| source | LeadSource | @default(OTHER) | Acquisition channel |
| urgency | LeadUrgency | @default(MEDIUM) | Priority level |
| score | Int | @default(50) | 0-100 score |
| transactionType | PropertyCategory? | - | RENT or SALE |
| budgetMin | BigInt? | - | Minimum budget |
| budgetMax | BigInt? | - | Maximum budget |
| notes | Json | @default("[]") | Notes array |
| chatMessages | Json | @default("[]") | Chat history |
| assignedToId | String? | - | FK to User |
| createdById | String? | - | FK to User |
| createdAt | DateTime | @default(now()) | Created timestamp |
| updatedAt | DateTime | @updatedAt | Updated timestamp |

**Indexes:**
- `@@index([status])` - Pipeline queries
- `@@index([assignedToId])` - Agent workload
- `@@index([createdAt(sort: Desc)])` - Timeline

**Relations:**
- `assignedTo: User?` - Assigned agent
- `createdBy: User?` - Creator
- `activities: LeadActivity[]` - Activity log
- `notifications: Notification[]` - Related notifications

---

### LeadActivity

Audit trail for lead interactions.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | String | @id @default(uuid()) | Primary key |
| type | String | - | Activity type |
| title | String | - | Activity title |
| description | String? | - | Details |
| leadId | String | - | FK to Lead |
| createdById | String? | - | FK to User |
| createdAt | DateTime | @default(now()) | Timestamp |

**Indexes:**
- `@@index([leadId])` - Lead activity lookup

**Cascade:** Deleted when parent Lead is deleted.

---

### Notification

System notifications for users.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | String | @id @default(uuid()) | Primary key |
| type | String | - | Notification type |
| title | String | - | Title |
| message | String? | - | Message body |
| isRead | Boolean | @default(false) | Read status |
| userId | String | - | FK to User |
| leadId | String? | - | FK to Lead |
| createdAt | DateTime | @default(now()) | Timestamp |

**Indexes:**
- `@@index([userId])` - User notifications
- `@@index([isRead])` - Unread filter

**Cascade:** Deleted when parent User is deleted; leadId set to NULL when Lead deleted.

---

### Property

Real estate property listings.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | String | @id @default(uuid()) | Primary key |
| externalId | String? | @unique | External listing ID |
| name | String | - | Property title |
| type | String | @default("Appartement") | Property type |
| category | PropertyCategory | - | RENT or SALE |
| price | String | @default("Prix sur demande") | Display price |
| priceNumeric | BigInt | @default(0) | Numeric price |
| location | String | @default("Casablanca") | Neighborhood |
| city | String | @default("Casablanca") | City |
| beds | Int | @default(0) | Bedrooms |
| baths | Int | @default(0) | Bathrooms |
| area | String | @default("") | Area display |
| areaNumeric | Int | @default(0) | Area in m² |
| image | String? | - | Main image URL |
| images | Json | @default("[]") | Image array |
| features | Json | @default("[]") | Amenities |
| smartTags | Json | @default("[]") | AI tags |
| description | String? | @db.Text | Long description |
| url | String? | - | Source URL |
| source | String | @default("mubawab") | Data source |
| datePublished | DateTime? | - | Original publish |
| dateScraped | DateTime? | - | Import date |
| isActive | Boolean | @default(true) | Active status |
| isFeatured | Boolean | @default(false) | Featured flag |
| viewCount | Int | @default(0) | View counter |
| createdAt | DateTime | @default(now()) | Created |
| updatedAt | DateTime | @updatedAt | Updated |

**Indexes:**
- `@@index([category])` - RENT/SALE filter
- `@@index([city])` - Location search
- `@@index([type])` - Type filter
- `@@index([priceNumeric])` - Price range
- `@@index([isActive])` - Active listings
- `@@index([isFeatured])` - Featured display

---

## Relationships Diagram

```
┌─────────┐       ┌─────────────┐       ┌──────────────┐
│  User   │──1:N──│    Lead     │──1:N──│ LeadActivity │
│         │       │             │       │              │
│ -email  │       │ -firstName  │       │ -type        │
│ -role   │       │ -status     │       │ -title       │
│ -isActive│      │ -score      │       │ -description │
└────┬────┘       └──────┬──────┘       └──────────────┘
     │                   │
     │                   │
     └───────1:N─────────┘
              │
     ┌────────▼────────┐
     │  Notification   │
     │                 │
     │ -type           │
     │ -isRead         │
     └─────────────────┘

┌─────────────┐
│  Property   │ (Standalone)
│             │
│ -name       │
│ -category   │
│ -price      │
│ -location   │
└─────────────┘
```

---

## Data Types

| Type | PostgreSQL | Notes |
|------|------------|-------|
| String | VARCHAR | Default length |
| String? | VARCHAR NULL | Optional |
| Int | INTEGER | Standard integer |
| BigInt | BIGINT | Large numbers (prices) |
| Boolean | BOOLEAN | true/false |
| DateTime | TIMESTAMP | With timezone |
| Json | JSONB | Flexible storage |
| @db.Text | TEXT | Long text |

---

## Migrations

### Commands

```bash
# Push schema changes to database
npx prisma db push

# Generate Prisma client
npx prisma generate

# Create migration file
npx prisma migrate dev --name <migration_name>

# Apply migrations (production)
npx prisma migrate deploy

# Reset database (development)
npx prisma migrate reset
```

### Current Approach

The project uses `prisma db push` for schema synchronization without migration history. For production, consider:
1. Enable migrations for version control
2. Create baseline migration
3. Use `prisma migrate deploy` in production

---

## Seeding

```bash
npm run db:seed
```

Seeds:
1. Admin user (from environment variables)
2. Demo agent (optional)
3. Sample leads
4. Properties from `data/properties.json`

---

## Performance Considerations

### Index Usage

| Query Pattern | Index Used |
|---------------|------------|
| Leads by status | `leads_status_idx` |
| Agent's leads | `leads_assignedToId_idx` |
| Recent leads | `leads_createdAt_idx` |
| Properties by category | `properties_category_idx` |
| Properties by city | `properties_city_idx` |
| Price range filter | `properties_priceNumeric_idx` |
| Featured properties | `properties_isFeatured_idx` |

### Optimization Tips

1. Use pagination for large result sets (max 100 items)
2. Select specific fields instead of full objects
3. Use `include` sparingly for nested relations
4. Add indexes for new query patterns
5. Monitor slow queries in production
