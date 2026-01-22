# Route Management API Documentation

This document describes the complete Route Management system API, which handles city-to-city transportation routes, connections, and multi-stop journey planning.

## Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [City Links API](#city-links-api)
4. [Routes API](#routes-api)
5. [Integration with Location Hierarchy](#integration-with-location-hierarchy)
6. [Common Workflows](#common-workflows)
7. [Data Models](#data-models)

---

## Overview

The Route Management system provides comprehensive APIs for managing transportation routes between cities. It consists of three main components:

- **City Links**: Direct city-to-city connections with distance, duration, and geographic data
- **Routes**: Service routes operating on city links with specific seat types and configurations
- **Sub-Routes**: Multi-stop segments that allow routes to have intermediate stops

### Key Features
- Bidirectional route creation (automatically creates return trips)
- Cross-border route tracking
- Multi-stop journey support
- Distance and duration calculations
- Integration with hierarchical location system
- GIS support for route paths (LINESTRING geometry)

---

## Architecture

### Data Model Hierarchy

```
Location (Cities)
    ↓
CityLink (City-to-City Connections)
    ↓
Route (Service Routes with Seat Types)
    ↓
SubRoute (Intermediate Stops)
```

### Bidirectional Linking

The system supports bidirectional relationships:
- Each `CityLink` can reference its `reverse_route_id`
- Each `Route` can reference its `reverse_route_id`
- This enables round-trip planning and efficient route queries

---

## City Links API

City links represent direct connections between two cities with distance and travel time information.

### Base URL
```
/api/city-links
```

### Endpoints

#### 1. Get All City Links

**GET** `/api/city-links`

Get a paginated list of city links with optional filters.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `origin_city_id` | integer | Filter by origin city |
| `destination_city_id` | integer | Filter by destination city |
| `cross_border` | boolean | Filter cross-border/domestic links |
| `min_distance` | number | Minimum distance in km |
| `max_distance` | number | Maximum distance in km |
| `search` | string | Search by code |
| `has_active_routes` | boolean | Only links with active routes |
| `per_page` | integer | Results per page (default: 15) |

**Example Request:**
```http
GET /api/city-links?origin_city_id=12&cross_border=false&per_page=20
```

**Example Response:**
```json
{
    "success": true,
    "data": {
        "current_page": 1,
        "data": [
            {
                "id": 1,
                "code": "DAR-ARU-001",
                "original_city_id": 12,
                "destination_city_id": 25,
                "reverse_route_id": 2,
                "default_revenue_account_id": 45,
                "is_cross_border": false,
                "distance_km": "637.50",
                "approx_hours": "9.50",
                "path_geometric": null,
                "uuid": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
                "created_at": "2024-01-15T10:30:00Z",
                "updated_at": "2024-01-15T10:30:00Z",
                "original_city": {
                    "id": 12,
                    "name": "Dar es Salaam",
                    "type": "CITY"
                },
                "destination_city": {
                    "id": 25,
                    "name": "Arusha",
                    "type": "CITY"
                },
                "routes": [
                    {
                        "id": 101,
                        "route_code": "DAR-ARU-VIP",
                        "seat_type": "vip",
                        "is_active": true
                    }
                ]
            }
        ],
        "total": 45,
        "per_page": 20
    }
}
```

---

#### 2. Create City Link

**POST** `/api/city-links`

Create a new city-to-city link.

**Request Body:**
```json
{
    "code": "MWZ-DAR-001",
    "original_city_id": 8,
    "destination_city_id": 12,
    "is_cross_border": false,
    "distance_km": 485.2,
    "approx_hours": 7.5,
    "default_revenue_account_id": 45,
    "path_geometric": "LINESTRING(39.2083 -6.7924, 39.2778 -6.8167)"
}
```

**Response:**
```json
{
    "success": true,
    "message": "City link created successfully",
    "data": {
        "id": 50,
        "code": "MWZ-DAR-001",
        "uuid": "generated-uuid-here",
        ...
    }
}
```

---

#### 3. Get City Link Details

**GET** `/api/city-links/{id}`

Get detailed information about a specific city link.

**Response:**
```json
{
    "success": true,
    "data": {
        "id": 1,
        "code": "DAR-ARU-001",
        "formatted_distance": "637.50 km",
        "formatted_duration": "9h 30min",
        "route_description": "Dar es Salaam → Arusha",
        "original_city": {
            "id": 12,
            "name": "Dar es Salaam",
            "geo_locations": [...]
        },
        "destination_city": {
            "id": 25,
            "name": "Arusha",
            "geo_locations": [...]
        },
        "reverse_route": {
            "id": 2,
            "code": "ARU-DAR-001",
            ...
        },
        "routes": [...]
    }
}
```

---

#### 4. Update City Link

**PUT** `/api/city-links/{id}`

Update an existing city link.

**Request Body:**
```json
{
    "distance_km": 640.0,
    "approx_hours": 9.75
}
```

---

#### 5. Delete City Link

**DELETE** `/api/city-links/{id}`

Delete a city link. Will fail if routes exist on this link.

**Response:**
```json
{
    "success": false,
    "message": "Cannot delete city link with existing routes. Delete routes first."
}
```

---

#### 6. Create Bidirectional City Link

**POST** `/api/city-links/bidirectional`

Create city links for both directions in a single operation.

**Request Body:**
```json
{
    "city1_id": 12,
    "city2_id": 25,
    "forward_code": "DAR-ARU-001",
    "reverse_code": "ARU-DAR-001",
    "distance_km": 637.5,
    "approx_hours": 9.5,
    "is_cross_border": false,
    "default_revenue_account_id": 45
}
```

**Response:**
```json
{
    "success": true,
    "message": "Bidirectional city link created successfully",
    "data": {
        "forward_link": {
            "id": 1,
            "code": "DAR-ARU-001",
            "reverse_route_id": 2,
            ...
        },
        "reverse_link": {
            "id": 2,
            "code": "ARU-DAR-001",
            "reverse_route_id": 1,
            ...
        }
    }
}
```

---

#### 7. Get City Connections

**GET** `/api/city-links/cities/{cityId}/connections`

Get all incoming and outgoing connections for a specific city.

**Response:**
```json
{
    "success": true,
    "data": {
        "city": {
            "id": 12,
            "name": "Dar es Salaam"
        },
        "outgoing_connections": [
            {
                "id": 1,
                "destination_city": {
                    "id": 25,
                    "name": "Arusha"
                },
                "distance_km": "637.50",
                "routes": [...]
            }
        ],
        "incoming_connections": [
            {
                "id": 2,
                "original_city": {
                    "id": 25,
                    "name": "Arusha"
                },
                "distance_km": "637.50",
                "routes": [...]
            }
        ],
        "total_connections": 12,
        "connected_cities": [...]
    }
}
```

---

#### 8. Search by Distance

**POST** `/api/city-links/search-distance`

Find city links within a specific distance range.

**Request Body:**
```json
{
    "min_km": 100,
    "max_km": 500
}
```

**Response:**
```json
{
    "success": true,
    "count": 23,
    "filters": {
        "min_km": 100,
        "max_km": 500
    },
    "data": [...]
}
```

---

#### 9. Find Links Between Cities

**POST** `/api/city-links/find-between-cities`

Find all city links between two cities (either direction).

**Request Body:**
```json
{
    "city1_id": 12,
    "city2_id": 25
}
```

---

#### 10. Get Statistics

**GET** `/api/city-links/statistics`

Get aggregate statistics about city links.

**Response:**
```json
{
    "success": true,
    "data": {
        "total_links": 156,
        "cross_border_links": 23,
        "domestic_links": 133,
        "links_with_routes": 98,
        "average_distance_km": 425.67,
        "average_duration_hours": 6.34,
        "longest_link": {
            "id": 45,
            "route_description": "Dar es Salaam → Mbeya",
            "distance_km": "840.50"
        },
        "shortest_link": {
            "id": 12,
            "route_description": "Dodoma → Mpwapwa",
            "distance_km": "95.20"
        }
    }
}
```

---

## Routes API

Routes represent actual transportation services operating on city links with specific seat types and configurations.

### Base URL
```
/api/routes
```

### Seat Types

Available seat types:
- `standard`
- `vip`
- `sleeper`
- `business`
- `economy`

### Endpoints

#### 1. Get All Routes

**GET** `/api/routes`

Get a paginated list of routes with optional filters.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `is_active` | boolean | Filter by active status |
| `seat_type` | string | Filter by seat type |
| `from_city_id` | integer | Filter by origin city |
| `to_city_id` | integer | Filter by destination city |
| `cross_border` | boolean | Only cross-border routes |
| `search` | string | Search by route code |
| `per_page` | integer | Results per page (default: 15) |

**Example Request:**
```http
GET /api/routes?seat_type=vip&is_active=true
```

---

#### 2. Create Route

**POST** `/api/routes`

Create a new route with optional sub-routes.

**Request Body:**
```json
{
    "city_link_id": 1,
    "route_code": "DAR-ARU-VIP-001",
    "seat_type": "vip",
    "default_revenue_account_id": 45,
    "is_active": true,
    "sub_routes": [
        {
            "city_link_id": 5,
            "sequency": 1,
            "is_active": true
        },
        {
            "city_link_id": 8,
            "sequency": 2,
            "is_active": true
        }
    ]
}
```

**Response:**
```json
{
    "success": true,
    "message": "Route created successfully",
    "data": {
        "id": 101,
        "route_code": "DAR-ARU-VIP-001",
        "city_link": {
            "id": 1,
            "original_city": {...},
            "destination_city": {...}
        },
        "sub_routes": [...]
    }
}
```

---

#### 3. Get Route Details

**GET** `/api/routes/{id}`

Get basic route information.

**GET** `/api/routes/{id}/details`

Get comprehensive route details including all stops, distances, and coordinates.

**Response:**
```json
{
    "success": true,
    "data": {
        "route": {
            "id": 101,
            "route_code": "DAR-ARU-VIP-001",
            "seat_type": "vip",
            ...
        },
        "total_distance_km": 750.50,
        "stops": [
            {
                "sequence": 0,
                "city": {
                    "id": 12,
                    "name": "Dar es Salaam",
                    "geo_locations": [...]
                },
                "type": "origin"
            },
            {
                "sequence": 1,
                "city": {
                    "id": 18,
                    "name": "Morogoro"
                },
                "type": "stop"
            },
            {
                "sequence": 2,
                "city": {
                    "id": 25,
                    "name": "Arusha"
                },
                "type": "destination"
            }
        ],
        "is_multi_stop": true,
        "is_cross_border": false
    }
}
```

---

#### 4. Update Route

**PUT** `/api/routes/{id}`

Update route properties (excluding sub-routes).

---

#### 5. Delete Route

**DELETE** `/api/routes/{id}`

Delete a route. Sub-routes will be deleted automatically (CASCADE).

---

#### 6. Find Routes Between Cities

**POST** `/api/routes/find-between-cities`

Search for routes between two specific cities.

**Request Body:**
```json
{
    "origin_city_id": 12,
    "destination_city_id": 25,
    "seat_type": "vip",
    "active_only": true
}
```

**Response:**
```json
{
    "success": true,
    "count": 3,
    "data": [
        {
            "id": 101,
            "route_code": "DAR-ARU-VIP-001",
            "seat_type": "vip",
            "city_link": {...},
            "sub_routes": [...]
        }
    ]
}
```

---

#### 7. Create Bidirectional Route

**POST** `/api/routes/bidirectional`

Create complete bidirectional routes (city links + routes) in one operation.

**Request Body:**
```json
{
    "origin_city_id": 12,
    "destination_city_id": 25,
    "forward_route_code": "DAR-ARU-VIP",
    "reverse_route_code": "ARU-DAR-VIP",
    "seat_type": "vip",
    "distance_km": 637.5,
    "approx_hours": 9.5,
    "is_cross_border": false,
    "default_revenue_account_id": 45
}
```

**Response:**
```json
{
    "success": true,
    "message": "Bidirectional route created successfully",
    "data": {
        "forward_route": {
            "id": 101,
            "route_code": "DAR-ARU-VIP",
            "reverse_route_id": 102,
            ...
        },
        "reverse_route": {
            "id": 102,
            "route_code": "ARU-DAR-VIP",
            "reverse_route_id": 101,
            ...
        }
    }
}
```

---

#### 8. Get Available Seat Types

**GET** `/api/routes/seat-types`

Get list of all available seat types.

**Response:**
```json
{
    "success": true,
    "data": ["standard", "vip", "sleeper", "business", "economy"]
}
```

---

#### 9. Add Sub-Route

**POST** `/api/routes/{routeId}/sub-routes`

Add an intermediate stop to an existing route.

**Request Body:**
```json
{
    "city_link_id": 8,
    "sequency": 3,
    "is_active": true
}
```

**Response:**
```json
{
    "success": true,
    "message": "Sub-route added successfully",
    "data": {
        "id": 205,
        "route_id": 101,
        "city_link_id": 8,
        "sequency": 3,
        "city_link": {
            "original_city": {...},
            "destination_city": {...}
        }
    }
}
```

---

#### 10. Remove Sub-Route

**DELETE** `/api/routes/{routeId}/sub-routes/{subRouteId}`

Remove an intermediate stop from a route.

---

## Integration with Location Hierarchy

The Route Management system integrates seamlessly with the existing Location hierarchy system.

### Location Model Additions

New relationships added to the `Location` model:

```php
// Get all city links originating from this city
$city->cityLinksAsOrigin()

// Get all city links with this city as destination
$city->cityLinksAsDestination()

// Get all routes departing from this city
$city->routesFrom()

// Get all routes arriving at this city
$city->routesTo()

// Get all directly connected cities
$city->getDirectConnections()
```

### Using Existing Location Endpoints

Use these existing endpoints to get cities for route creation:

```http
GET /api/locations?type=CITY&is_disabled=false
GET /api/locations/cities
GET /api/locations/hierarchy
```

---

## Common Workflows

### Workflow 1: Creating a Complete Bidirectional Route

```http
POST /api/routes/bidirectional
Content-Type: application/json

{
    "origin_city_id": 12,
    "destination_city_id": 25,
    "forward_route_code": "DAR-ARU-VIP",
    "reverse_route_code": "ARU-DAR-VIP",
    "seat_type": "vip",
    "distance_km": 637.5,
    "approx_hours": 9.5,
    "is_cross_border": false,
    "default_revenue_account_id": 45
}
```

This single call creates:
- 2 City Links (forward and reverse)
- 2 Routes (forward and reverse)
- All bidirectional references

---

### Workflow 2: Creating a Multi-Stop Route

**Step 1:** Create city links for each segment
```http
POST /api/city-links/bidirectional
{
    "city1_id": 12,
    "city2_id": 18,
    "forward_code": "DAR-MOR",
    "reverse_code": "MOR-DAR",
    "distance_km": 195
}
```

**Step 2:** Create main route with sub-routes
```http
POST /api/routes
{
    "city_link_id": 1,
    "route_code": "DAR-ARU-ECO-MULTI",
    "seat_type": "economy",
    "sub_routes": [
        {"city_link_id": 5, "sequency": 1},
        {"city_link_id": 8, "sequency": 2}
    ]
}
```

---

### Workflow 3: Finding All Routes Between Two Cities

```http
POST /api/routes/find-between-cities
{
    "origin_city_id": 12,
    "destination_city_id": 25,
    "active_only": true
}
```

---

### Workflow 4: Getting City Connection Network

```http
GET /api/city-links/cities/12/connections
```

Returns all cities directly connected to city 12 (both directions).

---

## Data Models

### CityLink Model

| Field | Type | Description |
|-------|------|-------------|
| `id` | bigint | Primary key |
| `code` | varchar(64) | Unique link code |
| `original_city_id` | bigint | Origin city (FK to locations) |
| `destination_city_id` | bigint | Destination city (FK to locations) |
| `reverse_route_id` | bigint | Reference to reverse link |
| `default_revenue_account_id` | bigint | Default accounting account |
| `is_cross_border` | boolean | Cross-border flag |
| `distance_km` | decimal(8,2) | Distance in kilometers |
| `approx_hours` | decimal(5,2) | Approximate travel time |
| `path_geometric` | linestring | GIS route path |
| `uuid` | char(36) | Universal unique identifier |

### Route Model

| Field | Type | Description |
|-------|------|-------------|
| `id` | bigint | Primary key |
| `city_link_id` | bigint | City link (FK) |
| `reverse_route_id` | bigint | Reverse route reference |
| `default_revenue_account_id` | bigint | Default accounting account |
| `route_code` | varchar(64) | Unique route code |
| `seat_type` | varchar(50) | Seat type |
| `is_active` | boolean | Active status |

### SubRoute Model

| Field | Type | Description |
|-------|------|-------------|
| `id` | bigint | Primary key |
| `city_link_id` | bigint | Segment city link (FK) |
| `route_id` | bigint | Parent route (FK, CASCADE DELETE) |
| `sequency` | int | Stop sequence number |
| `is_active` | boolean | Active status |

---

## Error Codes

| Status Code | Meaning |
|-------------|---------|
| 200 | Success |
| 201 | Resource created |
| 404 | Resource not found |
| 422 | Validation error |
| 500 | Server error |

---

## Best Practices

1. **Always create bidirectional routes** for round-trip scenarios
2. **Use unique, descriptive route codes** (e.g., `DAR-ARU-VIP-001`)
3. **Set is_cross_border correctly** for customs and regulatory purposes
4. **Include distance_km and approx_hours** for accurate journey planning
5. **Maintain sequence numbers** when adding sub-routes (use gaps like 10, 20, 30)
6. **Check for existing routes** before creating duplicates
7. **Use active_only=true** in searches for operational planning

---

## Support and Further Information

For integration questions or feature requests, consult:
- Location Hierarchy API: [docs/LOCATION_HIERARCHY_API.md](LOCATION_HIERARCHY_API.md)
- Database Schema: [docs/ROUTE_MANAGEMENT_TABLES.md](ROUTE_MANAGEMENT_TABLES.md)
