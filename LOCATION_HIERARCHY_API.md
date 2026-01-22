# Location Hierarchy & Route Planning API

## Overview

The Location system supports hierarchical organization from **country** to **city** level, designed for comprehensive route planning and geographical management.

## Location Types

```php
COUNTRY    → Top-level (e.g., Tanzania, Kenya)
REGION     → State/Province level (e.g., Arusha Region)
DISTRICT   → District/County level (e.g., Arusha District)
CITY       → City/Town level - Route endpoints (e.g., Arusha City, Dar es Salaam)
GAME       → Game reserves/hunting areas
WAREHOUSE  → Storage locations
MAIN       → Main operational locations
```

## Database Schema

### locations table
```
id                    - Primary key
tenant_id            - Multi-tenancy support
location_id          - Parent location (self-reference for hierarchy)
county_id            - County/province reference
default_item_id      - Default item reference
name                 - Location name
code                 - Unique location code
operation_type       - PHYSICAL_LOCATION | VIRTUAL_LOCATION
type                 - COUNTRY | REGION | DISTRICT | CITY | GAME | WAREHOUSE | MAIN
is_disabled          - Active/inactive flag
descriptions         - Additional details
created_at, updated_at, deleted_at
```

## API Endpoints

### 1. **GET /api/locations** - List Locations
Enhanced with hierarchical filters.

**Query Parameters:**
```
name              - Filter by name (partial match)
code              - Filter by code (exact match)
type              - Filter by type (COUNTRY, REGION, etc.)
operation_type    - Filter by operation type
parent_id         - Get children of specific location
county_id         - Filter by county
is_disabled       - true/false
roots_only        - true to get only top-level locations
cities_only       - true to get only cities (route endpoints)
with_path         - true to include full hierarchical path
per_page          - Pagination size (default: 15)
```

**Example:**
```bash
# Get all active cities with their full paths
GET /api/locations?cities_only=true&is_disabled=false&with_path=true

# Get all locations in a specific region
GET /api/locations?parent_id=5
```

**Response:**
```json
{
  "success": true,
  "data": {
    "data": [
      {
        "id": 10,
        "name": "Arusha City",
        "code": "ARU-CITY",
        "type": "CITY",
        "parent": {
          "id": 5,
          "name": "Arusha Region",
          "type": "REGION"
        },
        "full_path": "Tanzania > Arusha Region > Arusha City"
      }
    ]
  }
}
```

---

### 2. **GET /api/locations/{id}** - Get Single Location
Returns location with ancestors, children, and full path.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 10,
    "name": "Arusha City",
    "type": "CITY",
    "parent": {...},
    "children": [...],
    "ancestors": [
      {"id": 1, "name": "Tanzania", "type": "COUNTRY"},
      {"id": 5, "name": "Arusha Region", "type": "REGION"}
    ],
    "full_path": "Tanzania > Arusha Region > Arusha City",
    "geo_locations": [...],
    "hunting_areas": [...]
  }
}
```

---

### 3. **POST /api/locations** - Create Location
Create a location with hierarchical relationships.

**Request Body:**
```json
{
  "name": "Dodoma City",
  "code": "DOD-CITY",
  "type": "CITY",
  "location_id": 3,
  "operation_type": "PHYSICAL_LOCATION",
  "descriptions": "Capital city of Tanzania",
  "geo_locations": [
    {
      "coordinates_type": "POINT",
      "coordinates": "{\"lat\": -6.1630, \"lng\": 35.7516}"
    }
  ]
}
```

**Response:** Returns created location with full_path.

---

### 4. **PUT /api/locations/{id}** - Update Location
Update location properties including hierarchical relationships.

---

### 5. **DELETE /api/locations/{id}** - Delete Location
Soft deletes location and all related data.

---

## Hierarchical & Route Planning Endpoints

### 6. **GET /api/locations/hierarchy** - Get Location Tree
Returns hierarchical tree structure for UI rendering.

**Query Parameters:**
```
root_id    - Start from specific location (optional)
max_depth  - Maximum tree depth (default: 10)
```

**Example:**
```bash
GET /api/locations/hierarchy?root_id=1&max_depth=4
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Tanzania",
    "type": "COUNTRY",
    "is_city": false,
    "children": [
      {
        "id": 5,
        "name": "Arusha Region",
        "type": "REGION",
        "children": [
          {
            "id": 10,
            "name": "Arusha City",
            "type": "CITY",
            "is_city": true
          }
        ]
      }
    ]
  }
}
```

---

### 7. **GET /api/locations/cities** - Get All Cities
Returns all cities (route endpoints) for route planning.

**Query Parameters:**
```
parent_id         - Get cities in specific region
country_id        - Get cities in specific country (any depth)
with_coordinates  - Include geo-coordinates (default: true)
```

**Example:**
```bash
GET /api/locations/cities?country_id=1&with_coordinates=true
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 10,
      "name": "Arusha City",
      "code": "ARU-CITY",
      "type": "CITY",
      "full_path": "Tanzania > Arusha Region > Arusha City",
      "parent": {
        "id": 5,
        "name": "Arusha Region",
        "type": "REGION"
      },
      "coordinates": [
        {
          "type": "POINT",
          "coordinates": {"lat": -3.3869, "lng": 36.6830}
        }
      ]
    }
  ],
  "count": 25
}
```

---

### 8. **GET /api/locations/{id}/children** - Get Children
Get immediate children of a location.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 10,
      "name": "Arusha City",
      "type": "CITY",
      "has_children": false,
      "is_city": true
    }
  ],
  "parent": {
    "id": 5,
    "name": "Arusha Region",
    "type": "REGION"
  }
}
```

---

### 9. **GET /api/locations/{id}/ancestors** - Get Breadcrumb Path
Get all ancestor locations (useful for breadcrumbs).

**Response:**
```json
{
  "success": true,
  "data": {
    "location": {
      "id": 10,
      "name": "Arusha City",
      "type": "CITY"
    },
    "ancestors": [
      {"id": 1, "name": "Tanzania", "type": "COUNTRY"},
      {"id": 5, "name": "Arusha Region", "type": "REGION"}
    ],
    "full_path": "Tanzania > Arusha Region > Arusha City"
  }
}
```

---

### 10. **POST /api/locations/calculate-distance** - Calculate Distance
Calculate distance between two cities using Haversine formula.

**Request Body:**
```json
{
  "from_city_id": 10,
  "to_city_id": 15
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "from": {
      "id": 10,
      "name": "Arusha City",
      "coordinates": {"lat": -3.3869, "lng": 36.6830}
    },
    "to": {
      "id": 15,
      "name": "Dar es Salaam",
      "coordinates": {"lat": -6.7924, "lng": 39.2083}
    },
    "distance_km": 567.42,
    "approx_hours": 9.46
  }
}
```

---

## Model Methods (Location.php)

### Relationships
```php
parent()           - Get parent location
children()         - Get child locations
county()           - Get county reference
huntingAreas()     - Get hunting areas
geoLocations()     - Get geo-coordinates
```

### Helper Methods
```php
ancestors()        - Get all ancestors (city → region → country)
descendants()      - Get all descendants recursively
getFullPath()      - Get hierarchical path string
isCity()           - Check if location is a city
isCountry()        - Check if location is a country
getCities()        - Get all cities in hierarchy
```

### Scopes
```php
active()           - Where is_disabled = false
ofType($type)      - Filter by type
roots()            - Get root locations (no parent)
leaves()           - Get leaf locations (cities)
```

---

## Usage Examples

### Example 1: Create Country → Region → City Hierarchy

```php
// 1. Create Country
$country = Location::create([
    'name' => 'Tanzania',
    'code' => 'TZ',
    'type' => Location::TYPE_COUNTRY,
    'operation_type' => Location::OPERATION_PHYSICAL,
]);

// 2. Create Region
$region = Location::create([
    'name' => 'Arusha Region',
    'code' => 'ARU-REG',
    'type' => Location::TYPE_REGION,
    'location_id' => $country->id,
]);

// 3. Create City with coordinates
$city = Location::create([
    'name' => 'Arusha City',
    'code' => 'ARU-CITY',
    'type' => Location::TYPE_CITY,
    'location_id' => $region->id,
]);

GeoLocation::create([
    'location_id' => $city->id,
    'coordinates_type' => 'POINT',
    'coordinates' => json_encode(['lat' => -3.3869, 'lng' => 36.6830]),
]);
```

### Example 2: Get All Cities for Route Planning

```php
$cities = Location::with(['geoLocations', 'parent'])
    ->whereIn('type', [Location::TYPE_CITY, Location::TYPE_MAIN])
    ->active()
    ->get()
    ->map(function($city) {
        return [
            'id' => $city->id,
            'name' => $city->name,
            'full_path' => $city->getFullPath(),
            'coordinates' => $city->geoLocations->first(),
        ];
    });
```

### Example 3: Find Route Between Cities

```php
$fromCity = Location::find(10); // Arusha
$toCity = Location::find(15);   // Dar es Salaam

// Check if cross-border
$isCrossBorder = $fromCity->ancestors()
    ->pluck('id')
    ->intersect($toCity->ancestors()->pluck('id'))
    ->isEmpty();

// Calculate distance (use calculate-distance endpoint)
```

---

## Geo-Coordinates Format

### POINT (City/Town)
```json
{
  "coordinates_type": "POINT",
  "coordinates": "{\"lat\": -3.3869, \"lng\": 36.6830}"
}
```

### POLYGON (Region/District Boundary)
```json
{
  "coordinates_type": "POLYGON",
  "coordinates": "{\"coordinates\": [[lng1,lat1], [lng2,lat2], ...]}"
}
```

### LINESTRING (Route Path)
```json
{
  "coordinates_type": "LINESTRING",
  "coordinates": "{\"coordinates\": [[lng1,lat1], [lng2,lat2], ...]}"
}
```

---

## Integration with Route Tables

The location hierarchy integrates with your route planning tables:

```sql
-- city_links table references locations
CREATE TABLE city_links (
  original_city_id → references locations(id)
  destination_city_id → references locations(id)
  ...
);

-- routes table uses city_links
CREATE TABLE routes (
  city_link_id → references city_links(id)
  ...
);
```

**Workflow:**
1. Create location hierarchy (Country → Region → City)
2. Add geo-coordinates to cities
3. Create city_links between cities
4. Create routes on city_links
5. Use `calculate-distance` API for distance calculations

---

## Testing

```bash
# Get all countries
curl -X GET "http://localhost/api/locations?type=COUNTRY"

# Get hierarchy tree
curl -X GET "http://localhost/api/locations/hierarchy"

# Get all cities
curl -X GET "http://localhost/api/locations/cities"

# Calculate distance
curl -X POST "http://localhost/api/locations/calculate-distance" \
  -H "Content-Type: application/json" \
  -d '{"from_city_id": 10, "to_city_id": 15}'
```

---

## Performance Considerations

- **Indexing**: `location_id` and `county_id` are indexed
- **Eager Loading**: Use `with()` to avoid N+1 queries
- **Caching**: Consider caching location trees and city lists
- **Pagination**: Always paginate large result sets

---

## Future Enhancements

- [ ] Add route optimization algorithms
- [ ] Support for multiple coordinate systems (UTM, WGS84, etc.)
- [ ] Distance matrix for all city pairs
- [ ] Integration with mapping services (Google Maps, Mapbox)
- [ ] Multi-modal transport support (road, air, rail)
