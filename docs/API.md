# API Reference

Complete API documentation for the At Home Real Estate Platform.

## Base URLs

| Environment | URL |
|-------------|-----|
| Development | `http://localhost:3001` |
| Production | `https://athome-api.onrender.com` |

## Authentication

All protected endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <token>
```

---

## Auth Endpoints

### POST /api/auth/login

Authenticate user and receive JWT token.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "fullName": "Agent Name",
    "role": "AGENT",
    "avatarUrl": null,
    "lastLogin": "2024-01-15T10:30:00Z"
  }
}
```

**Errors:**
- `401` - Invalid credentials or inactive account

---

### POST /api/auth/register

Create new user account. **Admin only.**

**Request:**
```json
{
  "email": "newuser@example.com",
  "password": "securePassword123",
  "fullName": "New Agent",
  "role": "AGENT"
}
```

**Response (201):**
```json
{
  "user": {
    "id": "uuid",
    "email": "newuser@example.com",
    "fullName": "New Agent",
    "role": "AGENT",
    "isActive": true,
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

---

### GET /api/auth/me

Get current authenticated user.

**Response (200):**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "fullName": "Agent Name",
    "role": "AGENT",
    "phone": "+212600000000",
    "avatarUrl": null,
    "isActive": true,
    "lastLogin": "2024-01-15T10:30:00Z",
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

---

### PUT /api/auth/password

Change password for authenticated user.

**Request:**
```json
{
  "currentPassword": "oldPassword123",
  "newPassword": "newSecurePassword456"
}
```

**Response (200):**
```json
{
  "message": "Mot de passe modifié avec succès"
}
```

---

### POST /api/auth/refresh

Refresh JWT token.

**Response (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

---

## Users Endpoints

### GET /api/users

List all users. **Admin only.**

**Response (200):**
```json
{
  "users": [
    {
      "id": "uuid",
      "email": "agent@example.com",
      "fullName": "Agent Name",
      "role": "AGENT",
      "phone": "+212600000000",
      "avatarUrl": null,
      "isActive": true,
      "lastLogin": "2024-01-15T10:30:00Z",
      "createdAt": "2024-01-01T00:00:00Z",
      "leadsCount": 15
    }
  ]
}
```

---

### GET /api/users/agents

List all active agents (for lead assignment dropdowns).

**Response (200):**
```json
{
  "agents": [
    {
      "id": "uuid",
      "fullName": "Agent Name",
      "email": "agent@example.com",
      "role": "AGENT",
      "avatarUrl": null
    }
  ]
}
```

---

### GET /api/users/:id

Get user by ID.

**Access:** Agents can only view themselves; admins can view anyone.

**Response (200):**
```json
{
  "user": {
    "id": "uuid",
    "email": "agent@example.com",
    "fullName": "Agent Name",
    "role": "AGENT",
    "phone": "+212600000000",
    "avatarUrl": null,
    "isActive": true,
    "lastLogin": "2024-01-15T10:30:00Z",
    "createdAt": "2024-01-01T00:00:00Z",
    "leadsCount": 15
  }
}
```

---

### PUT /api/users/:id

Update user.

**Access:** Agents can only update themselves (limited fields); admins can update anyone.

**Request:**
```json
{
  "fullName": "Updated Name",
  "phone": "+212600000001",
  "avatarUrl": "https://example.com/avatar.jpg",
  "role": "ADMIN",
  "isActive": true,
  "password": "newPassword123"
}
```

---

### DELETE /api/users/:id

Delete user. **Admin only.**

**Side Effects:** All leads assigned to the user are unassigned.

**Response (200):**
```json
{
  "message": "Utilisateur supprimé"
}
```

---

## Leads Endpoints

### GET /api/leads

List leads with optional filters.

**Access:** Agents see only their assigned leads; admins see all.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| status | string | Filter by status (NEW, CONTACTED, etc.) |
| source | string | Filter by source (CHATBOT, WEBSITE_FORM, etc.) |
| assignedTo | string | Filter by assigned agent ID |

**Response (200):**
```json
{
  "leads": [
    {
      "id": "uuid",
      "firstName": "Mohammed",
      "lastName": "El Amrani",
      "email": "mohammed@example.com",
      "phone": "+212612345678",
      "city": "Casablanca",
      "status": "NEW",
      "source": "CHATBOT",
      "urgency": "HIGH",
      "score": 75,
      "transactionType": "SALE",
      "budgetMin": 2000000,
      "budgetMax": 4000000,
      "notes": [],
      "chatMessages": [],
      "assignedTo": {
        "id": "uuid",
        "fullName": "Agent Name",
        "email": "agent@example.com",
        "avatarUrl": null
      },
      "createdBy": {
        "id": "uuid",
        "fullName": "Admin Name"
      },
      "activities": []
    }
  ]
}
```

---

### GET /api/leads/:id

Get lead details with full activity history.

**Response (200):** Same as list item but includes all activities.

---

### POST /api/leads

Create new lead.

**Request:**
```json
{
  "firstName": "Mohammed",
  "lastName": "El Amrani",
  "email": "mohammed@example.com",
  "phone": "+212612345678",
  "city": "Casablanca",
  "source": "CHATBOT",
  "urgency": "HIGH",
  "transactionType": "SALE",
  "budgetMin": 2000000,
  "budgetMax": 4000000,
  "assignedToId": "agent-uuid",
  "notes": [],
  "chatMessages": []
}
```

**Side Effects:**
- Auto-assigns to creator if agent and no assignment specified
- Creates "lead_created" activity
- Sends notification to assigned agent
- Calculates lead score automatically

---

### PUT /api/leads/:id

Update lead.

**Access:** Agents can only update their assigned leads; admins can update any.

**Request:** Any subset of lead fields.

**Side Effects:**
- Recalculates score
- Creates activity if status changes
- Only admins can reassign leads

---

### DELETE /api/leads/:id

Delete lead. **Admin only.**

---

### POST /api/leads/:id/activity

Add activity to lead.

**Request:**
```json
{
  "type": "call",
  "title": "Initial Contact Call",
  "description": "Discussed property requirements"
}
```

---

## Properties Endpoints

### GET /api/properties

List properties with filters and pagination.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| category | string | SALE or RENT |
| type | string | Property type (Villa, Appartement, etc.) |
| city | string | City name |
| minPrice | number | Minimum price |
| maxPrice | number | Maximum price |
| minArea | number | Minimum area (m²) |
| maxArea | number | Maximum area (m²) |
| beds | number | Minimum bedrooms |
| featured | boolean | Featured only |
| search | string | Text search |
| limit | number | Results per page (max 100) |
| offset | number | Pagination offset |
| sort | string | Sort field |
| order | string | asc or desc |

**Response (200):**
```json
{
  "properties": [...],
  "pagination": {
    "total": 180,
    "limit": 50,
    "offset": 0,
    "hasMore": true
  }
}
```

---

### GET /api/properties/featured

Get featured properties.

**Query:** `limit` (default: 6, max: 20)

---

### GET /api/properties/stats

Get property statistics.

**Response (200):**
```json
{
  "total": 180,
  "byCategory": {
    "SALE": 120,
    "RENT": 60
  },
  "byCity": [
    { "city": "Casablanca", "count": 85 }
  ],
  "byType": [
    { "type": "Appartement", "count": 75 }
  ]
}
```

---

### GET /api/properties/search

Text search properties.

**Query:** `q` (required), `category`, `type`, `city`, `limit`

---

### GET /api/properties/:id

Get property details.

**Side Effects:** Increments viewCount.

---

### POST /api/properties

Create property. **Admin only.**

---

### PUT /api/properties/:id

Update property. **Admin only.**

---

### DELETE /api/properties/:id

Delete property. **Admin only.**

---

### POST /api/properties/bulk-update

Bulk update properties. **Admin only.**

**Request:**
```json
{
  "ids": ["uuid1", "uuid2"],
  "updates": {
    "isFeatured": true
  }
}
```

---

### POST /api/properties/import

Import properties from JSON. **Admin only.**

**Request:**
```json
{
  "properties": [...],
  "clearExisting": false
}
```

---

## Stats Endpoints

### GET /api/stats/crm

Get CRM statistics.

**Access:** Agents see their own leads; admins see all.

**Response (200):**
```json
{
  "totalLeads": 150,
  "newLeadsToday": 5,
  "newLeadsWeek": 25,
  "newLeadsMonth": 80,
  "leadsWon": 45,
  "leadsLost": 20,
  "conversionRate": 30,
  "avgScore": 62,
  "leadsByStatus": {...},
  "leadsBySource": {...},
  "leadsByUrgency": {...}
}
```

---

### GET /api/stats/dashboard

Get dashboard overview.

---

### GET /api/stats/agents

Get agent performance metrics. **Admin only.**

---

## Notifications Endpoints

### GET /api/notifications

Get user's notifications (latest 50).

**Response (200):**
```json
{
  "notifications": [...],
  "unreadCount": 3
}
```

---

### PUT /api/notifications/:id/read

Mark notification as read.

---

### PUT /api/notifications/read-all

Mark all notifications as read.

---

### DELETE /api/notifications/:id

Delete notification.

---

## Error Responses

All errors follow this format:

```json
{
  "error": "Error message description"
}
```

**Common Status Codes:**
- `400` - Bad Request (validation error)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Server Error

---

## Rate Limits

Currently no rate limiting implemented. Recommended for production:
- Login: 5 requests/minute
- API: 100 requests/minute
