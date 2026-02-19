# Business Logic & Workflows Documentation

Complete reference for CRM workflows, business rules, and system logic.

## Overview

| Domain | Description |
|--------|-------------|
| Lead Pipeline | 9-stage lead lifecycle management |
| Lead Scoring | Automated 0-100 scoring algorithm |
| Property Matching | Intelligent buyer-property matching |
| Notifications | Event-triggered notification system |
| Assignment Rules | Lead distribution logic |
| Activity Tracking | Complete audit trail |
| Offline Sync | Resilient data synchronization |

---

## 1. Lead Pipeline

### Stage Definitions

```
NEW → CONTACTED → QUALIFIED → VISIT_SCHEDULED → VISIT_COMPLETED → PROPOSAL_SENT → NEGOTIATION → WON/LOST
```

| Stage | Description | Next Actions |
|-------|-------------|--------------|
| **NEW** | Lead just created, no contact | Make first contact |
| **CONTACTED** | Initial contact established | Qualify the lead |
| **QUALIFIED** | Meets criteria, interested | Schedule visit |
| **VISIT_SCHEDULED** | Appointment set | Conduct visit |
| **VISIT_COMPLETED** | Visit done | Send proposal |
| **PROPOSAL_SENT** | Offer sent | Negotiate |
| **NEGOTIATION** | Active negotiation | Close or lose |
| **WON** | Deal closed successfully | Terminal state |
| **LOST** | Deal fell through | Terminal state |
| **NURTURING** | Kept warm for future | Re-engage later |

### Transition Rules

**Automatic Actions on Status Change:**
```typescript
// When status changes:
1. Create LeadActivity record
   - type: 'status_changed'
   - title: 'Statut modifié'
   - description: '${oldStatus} → ${newStatus}'
   - createdBy: current user

2. Recalculate lead score

3. Return updated lead with all activities
```

**Access Control:**
- Agents can only update their assigned leads
- Only admins can change `assignedToId`
- Terminal states (WON/LOST) may restrict further edits

---

## 2. Lead Scoring Algorithm

### Scoring Components (Total: 0-100 points)

#### Source Score (0-25 points)

| Source | Points | Rationale |
|--------|--------|-----------|
| REFERRAL | 25 | Highest quality leads |
| WALK_IN | 25 | Direct interest shown |
| CHATBOT | 20 | Engaged with AI |
| PHONE | 20 | Direct contact |
| WEBSITE_FORM | 15 | Standard inquiry |
| EMAIL | 15 | Indirect contact |
| SOCIAL_MEDIA | 10 | Lower intent |
| OTHER | 5 | Unknown source |

#### Urgency Score (0-30 points)

| Urgency | Points |
|---------|--------|
| CRITICAL | 30 |
| HIGH | 25 |
| MEDIUM | 15 |
| LOW | 5 |

#### Engagement Score (0-20 points)

| Chat Messages | Points |
|---------------|--------|
| 10+ messages | 20 |
| 5-9 messages | 15 |
| 3-4 messages | 10 |
| 0-2 messages | 5 |

#### Qualification Score (0-15 points)

| Criterion | Points |
|-----------|--------|
| Property interest specified | +5 |
| Budget range provided | +5 |
| Transaction type selected | +3 |
| Preferred locations specified | +2 |

#### Contact Score (0-10 points)

| Info | Points |
|------|--------|
| Valid email | +5 |
| Valid phone | +5 |

### Score Calculation

```typescript
function calculateLeadScore(lead: Lead): number {
  let score = 0;
  
  // Source (0-25)
  score += SOURCE_SCORES[lead.source] || 5;
  
  // Urgency (0-30)
  score += URGENCY_SCORES[lead.urgency] || 15;
  
  // Engagement (0-20)
  const messages = lead.chatMessages?.length || 0;
  if (messages >= 10) score += 20;
  else if (messages >= 5) score += 15;
  else if (messages >= 3) score += 10;
  else score += 5;
  
  // Qualification (0-15)
  if (lead.propertyInterest) score += 5;
  if (lead.budgetMin || lead.budgetMax) score += 5;
  if (lead.transactionType) score += 3;
  if (lead.preferredLocations?.length) score += 2;
  
  // Contact (0-10)
  if (lead.email) score += 5;
  if (lead.phone) score += 5;
  
  return Math.min(100, score);
}
```

### Score to Urgency Mapping

```typescript
function getUrgencyFromScore(score: number): Urgency {
  if (score >= 80) return 'CRITICAL';
  if (score >= 60) return 'HIGH';
  if (score >= 40) return 'MEDIUM';
  return 'LOW';
}
```

### Recalculation Triggers

Score is recalculated when:
- Lead is created
- Source changes
- Urgency changes
- Chat messages added
- Property interest updated
- Budget information updated
- Contact info added

---

## 3. Property Matching

### Match Weight Distribution

| Factor | Weight | Max Points |
|--------|--------|------------|
| Location/City | 30% | 30 |
| Budget Range | 25% | 25 |
| Property Type | 20% | 20 |
| Size/Area | 15% | 15 |
| Features | 10% | 10 |

**Minimum Match Threshold:** 50 points  
**Maximum Matches Returned:** 10 properties

### Location Scoring (0-30 points)

```typescript
function scoreLocation(demand, property): number {
  const demandCity = normalize(demand.criteria.location);
  const propertyCity = normalize(property.city);
  
  if (demandCity === propertyCity) {
    return 30; // Full match
  }
  
  if (matchNeighborhood(demand, property)) {
    return 21; // 70% - Same area
  }
  
  if (!demand.criteria.location) {
    return 15; // 50% - No preference
  }
  
  return 0; // No match
}
```

### Budget Scoring (0-25 points)

```typescript
function scoreBudget(demand, property): number {
  const { budgetMin, budgetMax } = demand.criteria;
  const price = property.priceNumeric;
  
  // Within exact budget
  if (price >= budgetMin && price <= budgetMax) {
    return 25;
  }
  
  // Within ±10% tolerance
  if (price >= budgetMin * 0.9 && price <= budgetMax * 1.1) {
    return 17.5;
  }
  
  // Within ±20% tolerance
  if (price >= budgetMin * 0.8 && price <= budgetMax * 1.2) {
    return 10;
  }
  
  // No budget preference
  if (!budgetMin && !budgetMax) {
    return 12.5;
  }
  
  return 0;
}
```

### Type Scoring (0-20 points)

```typescript
function scoreType(demand, property): number {
  const demandTypes = demand.criteria.propertyTypes;
  
  if (!demandTypes?.length) {
    return 10; // No preference - 50%
  }
  
  if (demandTypes.includes(property.type)) {
    return 20; // Full match
  }
  
  return 0;
}
```

### Size Scoring (0-15 points)

```typescript
function scoreSize(demand, property): number {
  let score = 0;
  const { bedsMin, bedsMax, areaMin, areaMax } = demand.criteria;
  
  // Bedrooms (0-10 points)
  if (property.beds >= bedsMin && property.beds <= bedsMax) {
    score += 10;
  } else if (property.beds >= bedsMin) {
    score += 5; // Over max but meets min
  } else if (property.beds >= bedsMin - 1) {
    score += 3; // Close to min
  }
  
  // Area (0-5 points)
  if (property.areaNumeric >= areaMin && property.areaNumeric <= areaMax) {
    score += 5;
  } else if (property.areaNumeric >= areaMin) {
    score += 2.5;
  } else if (property.areaNumeric >= areaMin * 0.9) {
    score += 2;
  }
  
  return score;
}
```

### Features Scoring (0-10 points)

```typescript
function scoreFeatures(demand, property): number {
  const required = demand.criteria.features || [];
  const available = property.features || [];
  
  if (!required.length) {
    return 5; // No preference - 50%
  }
  
  const matched = required.filter(f => 
    available.includes(f)
  ).length;
  
  const ratio = matched / required.length;
  
  return ratio >= 0.5 ? 10 : ratio * 10;
}
```

### Match Status Flow

```
pending → notified → contacted → successful/rejected
```

---

## 4. Notification System

### Notification Types

| Type | Trigger | Message |
|------|---------|---------|
| `new_lead` | Lead assigned to agent | "{name} vous a été assigné" |
| `lead_assigned` | Lead reassigned | "Lead transféré: {name}" |
| `followup_due` | Follow-up scheduled | "Rappel: {task}" |
| `task_due` | Task deadline | "Tâche due: {task}" |
| `status_changed` | Lead status change | "Statut mis à jour: {status}" |
| `chat_message` | New chat message | "Nouveau message" |

### Automatic Triggers

**On Lead Creation:**
```typescript
if (assignedToId && assignedToId !== createdById) {
  createNotification({
    userId: assignedToId,
    type: 'new_lead',
    title: 'Nouveau lead',
    message: `${firstName} ${lastName} vous a été assigné`,
    leadId: lead.id
  });
}
```

**On Lead Reassignment:**
```typescript
if (newAssigneeId !== currentAssigneeId) {
  createNotification({
    userId: newAssigneeId,
    type: 'lead_assigned',
    title: 'Lead transféré',
    message: `${leadName} vous a été assigné`
  });
}
```

**On Status Change:**
```typescript
// Activity logged automatically
createActivity({
  leadId,
  type: 'status_changed',
  title: 'Statut modifié',
  description: `${oldStatus} → ${newStatus}`
});
```

### Notification Management

- **Retrieval:** Most recent 50 notifications
- **Mark Read:** Single or all
- **Delete:** Individual deletion
- **Unread Count:** Tracked separately

---

## 5. Assignment Rules

### Auto-Assignment

```typescript
// Agent creating lead → auto-assign to self
if (!assignedToId && user.role === 'AGENT') {
  assignedToId = user.id;
}
```

### Access Control

| Action | Agent | Admin |
|--------|-------|-------|
| View own leads | ✓ | ✓ |
| View all leads | ✗ | ✓ |
| Create lead | ✓ (auto-assign) | ✓ |
| Update own lead | ✓ | ✓ |
| Update any lead | ✗ | ✓ |
| Reassign lead | ✗ | ✓ |
| Delete lead | ✗ | ✓ |

### Agent Capacity

- `maxLeads` field in agent profile (default: 100)
- Current leads tracked via `_count.assignedLeads`
- No hard limit enforcement (advisory)

### Lead Transfer on User Deletion

```typescript
// When user deleted:
await prisma.lead.updateMany({
  where: { assignedToId: deletedUserId },
  data: { assignedToId: null }
});
```

---

## 6. Activity Tracking

### Activity Types

| Type | Description | Auto/Manual |
|------|-------------|-------------|
| `lead_created` | Lead creation | Auto |
| `status_changed` | Status update | Auto |
| `note_added` | Note/comment | Manual |
| `call_made` | Phone call | Manual |
| `email_sent` | Email sent | Manual |
| `visit_scheduled` | Visit booked | Manual |
| `visit_completed` | Visit done | Manual |
| `property_viewed` | Property interest | Manual |
| `chat_message` | Chat interaction | Auto |

### Activity Data Structure

```typescript
interface LeadActivity {
  id: string;
  type: ActivityType;
  title: string;
  description: string;
  createdAt: Date;
  createdBy: {
    id: string;
    fullName: string;
  };
  leadId: string;
}
```

### Activity Creation

```typescript
// Automatic on lead creation
createActivity({
  leadId,
  type: 'lead_created',
  title: 'Lead créé',
  description: `Source: ${source}`
});

// Automatic on status change
createActivity({
  leadId,
  type: 'status_changed',
  title: 'Statut modifié',
  description: `${oldStatus} → ${newStatus}`
});

// Manual note
createActivity({
  leadId,
  type: 'note_added',
  title: 'Note ajoutée',
  description: noteContent
});
```

### Activity Retrieval

- Lead detail: Last 5 activities (ordered by date desc)
- Dashboard: Last 10 activities across all leads
- Includes `createdBy` user info

---

## 7. Offline Sync System

### Architecture

```
┌─────────────────────────────────────────────────┐
│                  React App                       │
├─────────────────────────────────────────────────┤
│                                                  │
│   ┌──────────────┐    ┌──────────────────────┐  │
│   │  CRM Service │───▶│   Sync Queue         │  │
│   │              │    │   (localStorage)      │  │
│   └──────┬───────┘    └──────────┬───────────┘  │
│          │                       │              │
│          ▼                       ▼              │
│   ┌──────────────┐    ┌──────────────────────┐  │
│   │  API Client  │◀───│   Queue Processor    │  │
│   │              │    │   (on reconnect)     │  │
│   └──────┬───────┘    └──────────────────────┘  │
│          │                                      │
└──────────┼──────────────────────────────────────┘
           │
           ▼
    ┌─────────────┐
    │  Backend    │
    │  API        │
    └─────────────┘
```

### Sync Queue Structure

```typescript
interface SyncOperation {
  id: string;
  type: 'create' | 'update' | 'delete';
  entity: 'lead' | 'activity';
  payload: any;
  timestamp: Date;
  retries: number;
}
```

### Queue Processing

```typescript
async function processSyncQueue() {
  const queue = getQueue();
  
  for (const operation of queue) {
    try {
      await executeOperation(operation);
      removeFromQueue(operation.id);
      invalidateCache(operation.entity);
    } catch (error) {
      operation.retries++;
      if (operation.retries >= 3) {
        removeFromQueue(operation.id);
        logError('Sync failed', operation);
      }
    }
  }
}
```

### Retry Logic

- **Max attempts:** 3
- **Backoff:** Exponential (1s → 2s → 4s)
- **On failure:** Log and remove after 3 attempts

### Optimistic Updates

```typescript
// Offline create
async function createLead(data) {
  if (!isOnline) {
    const tempId = `temp_${Date.now()}`;
    const tempLead = { ...data, id: tempId, _pendingSync: true };
    
    addToQueue({
      type: 'create',
      entity: 'lead',
      payload: data
    });
    
    return tempLead;
  }
  
  return await api.createLead(data);
}
```

### Cache Strategy

- **TTL:** 5 minutes
- **Prefix:** `crmapi_cache_`
- **Invalidation:** Pattern-based
- **Fallback:** Cache when offline

---

## 8. Role-Based Access Control

### Permission Matrix

| Resource | Action | Agent | Admin |
|----------|--------|-------|-------|
| **Leads** | View own | ✓ | ✓ |
| | View all | ✗ | ✓ |
| | Create | ✓ | ✓ |
| | Update own | ✓ | ✓ |
| | Update any | ✗ | ✓ |
| | Delete | ✗ | ✓ |
| | Reassign | ✗ | ✓ |
| **Properties** | View | ✓ | ✓ |
| | Create | ✗ | ✓ |
| | Update | ✗ | ✓ |
| | Delete | ✗ | ✓ |
| **Users** | View own | ✓ | ✓ |
| | View all | ✗ | ✓ |
| | Create | ✗ | ✓ |
| | Delete | ✗ | ✓ |
| **Stats** | Own stats | ✓ | ✓ |
| | All stats | ✗ | ✓ |

### Middleware Implementation

```typescript
// Authentication required
router.use(authenticate);

// Role check
router.delete('/leads/:id', requireAdmin, deleteLeadHandler);

// Row-level security
const where = {
  ...(user.role !== 'ADMIN' && { assignedToId: user.id })
};
```

---

## 9. Data Validation

### Lead Validation

```typescript
const leadSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().regex(/^\+?[1-9]\d{6,14}$/).optional(),
  city: z.string().optional(),
  source: z.enum([
    'CHATBOT', 'WEBSITE_FORM', 'PHONE', 'EMAIL',
    'WALK_IN', 'REFERRAL', 'SOCIAL_MEDIA', 'OTHER'
  ]).default('OTHER'),
  urgency: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).default('MEDIUM'),
  transactionType: z.enum(['RENT', 'SALE']).optional(),
  budgetMin: z.number().min(0).optional(),
  budgetMax: z.number().min(0).optional(),
  assignedToId: z.string().uuid().optional()
});
```

### Property Validation

```typescript
const propertySchema = z.object({
  name: z.string().min(1),
  category: z.enum(['SALE', 'RENT']),
  type: z.string().default('Appartement'),
  price: z.string().optional(),
  priceNumeric: z.number().min(0).max(1_000_000_000),
  location: z.string().default('Casablanca'),
  city: z.string().default('Casablanca'),
  beds: z.number().min(0).max(50),
  baths: z.number().min(0).max(20),
  area: z.string().optional(),
  areaNumeric: z.number().min(0).max(100_000),
  features: z.array(z.string()).optional(),
  smartTags: z.array(z.string()).optional(),
  description: z.string().max(5000).optional()
});
```

---

## 10. Statistics & Reporting

### CRM Statistics

```typescript
interface CRMStats {
  // Volume metrics
  totalLeads: number;
  newLeadsToday: number;
  newLeadsWeek: number;
  newLeadsMonth: number;
  
  // Conversion metrics
  leadsWon: number;
  leadsLost: number;
  conversionRate: number; // percentage
  
  // Quality metrics
  avgScore: number;
  
  // Distributions
  byStatus: Record<LeadStatus, number>;
  bySource: Record<LeadSource, number>;
  byUrgency: Record<LeadUrgency, number>;
}
```

### Dashboard Statistics

```typescript
interface DashboardStats {
  totalLeads: number;
  totalProperties: number;
  totalUsers: number;      // Admin only
  recentLeads: Lead[];     // Last 5
  recentActivities: Activity[]; // Last 10
}
```

### Agent Performance

```typescript
interface AgentStats {
  agent: {
    id: string;
    fullName: string;
    email: string;
    avatar?: string;
  };
  leadCount: number;
  leadsWon: number;
  leadsLost: number;
  conversionRate: number;
  avgScore: number;
}
```

---

## Key Business Rules Summary

1. **Lead Scoring:** Multi-factor algorithm (source 25, urgency 30, engagement 20, qualification 15, contact 10)

2. **Pipeline Stages:** 9 stages from NEW to WON/LOST with automatic activity tracking

3. **Access Control:** Agents see only assigned leads; admins have full access

4. **Auto-Assignment:** Agent-created leads auto-assign to creator

5. **Property Matching:** Weighted scoring (location 30%, budget 25%, type 20%, size 15%, features 10%)

6. **Notification Triggers:** Auto on assignment, status change, activity creation

7. **Activity Audit Trail:** Every action logged with timestamp and user

8. **Offline Support:** Sync queue with exponential backoff retry (max 3 attempts)

9. **Cache Strategy:** 5-minute TTL with pattern-based invalidation

10. **Score Recalculation:** Triggered on key field updates (source, urgency, engagement, budget)

