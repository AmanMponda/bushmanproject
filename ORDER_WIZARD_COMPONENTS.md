# Building Order Wizard Components: Step-by-Step

## Architecture Overview

```
OrderForm.vue (Main Container)
    ↓
    ├─ Tabs or Steps Navigation
    └─ Dynamic Component Loader
        ├─ OrderBasics.vue (Existing)
        ├─ OrderParties.vue (Build #1)
        ├─ OrderItems.vue (Build #2)
        ├─ OrderLogistics.vue (Build #3)
        ├─ OrderParticipants.vue (Build #4)
        ├─ OrderPaymentTerms.vue (Build #5)
        └─ OrderPreferences.vue (Build #6)
```

---

## Build Plan #1: OrderParties.vue

**Purpose**: Manage who's involved in the order (Customer, Supplier, Agent, etc.)

**Database**: `OrderParty` table
```sql
CREATE TABLE order_parties (
  id INT PRIMARY KEY,
  order_id INT,
  role ENUM('CUSTOMER', 'SUPPLIER', 'AGENT', 'BROKER', 'BILL-TO', 'SHIP-TO'),
  entity_id INT,  -- Company/Contact ID
  entity_name VARCHAR,
  contact_person VARCHAR,
  email VARCHAR,
  phone VARCHAR,
  created_at TIMESTAMP
)
```

**API Endpoint**: 
```
POST /orders/{id}/parties
GET /orders/{id}/parties
PUT /orders/{id}/parties/{party_id}
DELETE /orders/{id}/parties/{party_id}
```

**Component Code**:
```vue
<template>
  <div class="order-parties-container">
    <h4 class="mb-4">Order Parties</h4>
    
    <div class="parties-list">
      <div 
        v-for="party in parties" 
        :key="party.id"
        class="party-card p-3 mb-3 border rounded"
      >
        <div class="row g-3">
          <!-- Role Selection -->
          <div class="col-md-3">
            <label class="form-label">Role *</label>
            <select v-model="party.role" class="form-select" @change="saveParty(party)">
              <option value="CUSTOMER">Customer</option>
              <option value="SUPPLIER">Supplier</option>
              <option value="AGENT">Agent</option>
              <option value="BROKER">Broker</option>
              <option value="BILL-TO">Bill To</option>
              <option value="SHIP-TO">Ship To</option>
            </select>
          </div>
          
          <!-- Entity Search -->
          <div class="col-md-5">
            <label class="form-label">Entity *</label>
            <input
              type="text"
              v-model="party.entity_name"
              placeholder="Search company or contact..."
              class="form-control"
              @focus="openEntitySearch(party)"
              @input="filterEntities(party)"
            />
            <!-- Search Results Dropdown -->
            <div v-if="party.showResults" class="entity-search-results">
              <div 
                v-for="entity in party.filteredEntities" 
                :key="entity.id"
                class="search-result p-2 cursor-pointer"
                @click="selectEntity(party, entity)"
              >
                <strong>{{ entity.name }}</strong><br>
                <small class="text-muted">{{ entity.type }}</small>
              </div>
            </div>
          </div>
          
          <!-- Contact Person -->
          <div class="col-md-2">
            <label class="form-label">Contact</label>
            <input 
              v-model="party.contact_person" 
              placeholder="Name"
              class="form-control"
              @change="saveParty(party)"
            />
          </div>
          
          <!-- Remove Button -->
          <div class="col-md-2 d-flex align-items-end">
            <button 
              @click="removeParty(party.id)"
              class="btn btn-danger btn-sm w-100"
            >
              <i class="fa fa-trash"></i> Remove
            </button>
          </div>
        </div>
        
        <!-- Contact Details (Collapsible) -->
        <div v-if="party.expandDetails" class="mt-3 pt-3 border-top">
          <div class="row g-3">
            <div class="col-md-6">
              <input 
                v-model="party.email" 
                type="email"
                placeholder="Email"
                class="form-control form-control-sm"
                @change="saveParty(party)"
              />
            </div>
            <div class="col-md-6">
              <input 
                v-model="party.phone" 
                placeholder="Phone"
                class="form-control form-control-sm"
                @change="saveParty(party)"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Add New Party -->
    <button @click="addParty" class="btn btn-primary mt-3">
      <i class="fa fa-plus"></i> Add Party
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useOrderStore } from '@/stores/bushman/order-store'
import axios from 'axios'

const route = useRoute()
const orderStore = useOrderStore()

const parties = ref<any[]>([])
const allEntities = ref<any[]>([])

interface Party {
  id: number | string
  order_id?: number
  role: string
  entity_id: number | null
  entity_name: string
  contact_person?: string
  email?: string
  phone?: string
  expandDetails?: boolean
  showResults?: boolean
  filteredEntities?: any[]
}

// Load parties on mount
onMounted(async () => {
  if (route.params.id) {
    await loadParties()
  } else {
    // For new orders, initialize with empty party rows
    parties.value = [
      createEmptyParty('CUSTOMER'),
      createEmptyParty('SUPPLIER')
    ]
  }
  
  // Load all available entities
  await loadEntities()
})

const loadParties = async () => {
  try {
    const response = await axios.get(
      `/orders/${route.params.id}/parties`
    )
    parties.value = response.data.data || response.data || []
  } catch (error) {
    console.error('Error loading parties:', error)
  }
}

const loadEntities = async () => {
  try {
    // Adjust endpoint based on your backend
    const response = await axios.get('/entities')
    allEntities.value = response.data.data || response.data || []
  } catch (error) {
    console.error('Error loading entities:', error)
  }
}

const createEmptyParty = (role: string): Party => ({
  id: Date.now(),
  role,
  entity_id: null,
  entity_name: '',
  contact_person: '',
  email: '',
  phone: '',
  expandDetails: false,
  showResults: false,
  filteredEntities: []
})

const openEntitySearch = (party: Party) => {
  party.showResults = true
  filterEntities(party)
}

const filterEntities = (party: Party) => {
  if (!party.entity_name || party.entity_name.length < 2) {
    party.filteredEntities = []
    return
  }
  
  const search = party.entity_name.toLowerCase()
  party.filteredEntities = allEntities.value.filter(e =>
    e.name.toLowerCase().includes(search)
  )
}

const selectEntity = (party: Party, entity: any) => {
  party.entity_id = entity.id
  party.entity_name = entity.name
  party.contact_person = entity.primary_contact || ''
  party.email = entity.email || ''
  party.phone = entity.phone || ''
  party.showResults = false
  saveParty(party)
}

const saveParty = async (party: Party) => {
  try {
    if (route.params.id) {
      // Update existing party
      const endpoint = party.id && typeof party.id === 'number'
        ? `/orders/${route.params.id}/parties/${party.id}`
        : `/orders/${route.params.id}/parties`
      
      await axios.post(endpoint, party)
    }
  } catch (error) {
    console.error('Error saving party:', error)
  }
}

const addParty = () => {
  parties.value.push(createEmptyParty('AGENT'))
}

const removeParty = async (partyId: string | number) => {
  try {
    if (route.params.id && typeof partyId === 'number') {
      await axios.delete(`/orders/${route.params.id}/parties/${partyId}`)
    }
    parties.value = parties.value.filter(p => p.id !== partyId)
  } catch (error) {
    console.error('Error removing party:', error)
  }
}
</script>

<style scoped>
.party-card {
  background: #f8f9fa;
  border-left: 4px solid #007bff;
}

.entity-search-results {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 1px solid #ddd;
  border-radius: 4px;
  max-height: 200px;
  overflow-y: auto;
  z-index: 1000;
}

.search-result {
  border-bottom: 1px solid #eee;
  &:hover {
    background: #f0f0f0;
  }
}
</style>
```

---

## Build Plan #2: OrderItems.vue

**Purpose**: Search and select items (products, services) for the order

**Database**: Uses existing `OrderItem` table
```sql
CREATE TABLE order_items (
  id INT PRIMARY KEY,
  order_id INT,
  item_id INT,
  item_name VARCHAR,
  quantity DECIMAL,
  rate DECIMAL,
  discount DECIMAL,
  total DECIMAL,
  created_at TIMESTAMP
)
```

**API Endpoints Needed**:
```
GET /items/search?keyword=&category=
GET /items/{id}
GET /items/{id}/variants
GET /items/{id}/pricing

POST /orders/{id}/items
GET /orders/{id}/items
PUT /orders/{id}/items/{item_id}
DELETE /orders/{id}/items/{item_id}
```

**Component Code**:
```vue
<template>
  <div class="order-items-container">
    <h4 class="mb-4">Order Items</h4>
    
    <!-- Search Bar -->
    <div class="search-section mb-4">
      <div class="row g-3">
        <div class="col-md-6">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search items..."
            class="form-control"
            @input="searchItems"
          />
        </div>
        <div class="col-md-4">
          <select v-model="selectedCategory" class="form-select" @change="searchItems">
            <option value="">All Categories</option>
            <option value="HUNTING">Hunting Services</option>
            <option value="EQUIPMENT">Equipment</option>
            <option value="ACCOMMODATION">Accommodation</option>
            <option value="TRANSPORT">Transport</option>
            <option value="SERVICES">Services</option>
          </select>
        </div>
        <div class="col-md-2">
          <button @click="toggleSearchResults" class="btn btn-outline-primary w-100">
            <i class="fa fa-search"></i> Find
          </button>
        </div>
      </div>
      
      <!-- Search Results -->
      <div v-if="showSearchResults" class="search-results mt-3">
        <div class="row g-2">
          <div 
            v-for="item in searchResults" 
            :key="item.id"
            class="col-md-6 col-lg-4"
          >
            <div class="item-card p-3 border rounded cursor-pointer" @click="selectItemForAdd(item)">
              <div class="item-image mb-2">
                <img v-if="item.image_url" :src="item.image_url" alt="" style="height: 150px; object-fit: cover; width: 100%" />
                <div v-else style="height: 150px; background: #f0f0f0; display: flex; align-items: center; justify-content: center;">
                  <i class="fa fa-image text-muted"></i>
                </div>
              </div>
              <h6 class="mb-1">{{ item.name }}</h6>
              <p class="text-muted small mb-2">{{ item.description }}</p>
              <div class="d-flex justify-content-between">
                <span class="badge bg-primary">{{ item.category }}</span>
                <strong>${{ item.price }}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Selected Items Table -->
    <div class="items-table">
      <table class="table table-bordered">
        <thead class="table-light">
          <tr>
            <th>Item Name</th>
            <th>Category</th>
            <th>Qty</th>
            <th>Rate</th>
            <th>Discount</th>
            <th>Total</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in items" :key="item.id">
            <td><strong>{{ item.item_name }}</strong></td>
            <td><span class="badge bg-info">{{ item.category }}</span></td>
            <td>
              <input 
                v-model.number="item.quantity" 
                type="number" 
                min="1"
                class="form-control form-control-sm"
                style="max-width: 80px"
                @change="calculateTotal(item)"
              />
            </td>
            <td>
              <input 
                v-model.number="item.rate" 
                type="number" 
                class="form-control form-control-sm"
                style="max-width: 100px"
                @change="calculateTotal(item)"
              />
            </td>
            <td>
              <input 
                v-model.number="item.discount" 
                type="number" 
                class="form-control form-control-sm"
                style="max-width: 100px"
                @change="calculateTotal(item)"
              />
            </td>
            <td class="fw-bold">${{ item.total?.toFixed(2) }}</td>
            <td>
              <button @click="removeItem(item.id)" class="btn btn-danger btn-sm">
                <i class="fa fa-trash"></i>
              </button>
            </td>
          </tr>
          <tr class="table-light fw-bold">
            <td colspan="5" class="text-end">Order Total:</td>
            <td colspan="2">${{ calculateGrandTotal()?.toFixed(2) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import axios from 'axios'

const route = useRoute()

const searchQuery = ref('')
const selectedCategory = ref('')
const showSearchResults = ref(false)
const searchResults = ref<any[]>([])
const items = ref<any[]>([])

interface OrderItem {
  id?: string | number
  order_id?: number
  item_id: number
  item_name: string
  category?: string
  quantity: number
  rate: number
  discount: number
  total: number
}

onMounted(async () => {
  if (route.params.id) {
    await loadItems()
  }
})

const searchItems = async () => {
  try {
    const response = await axios.get('/items/search', {
      params: {
        keyword: searchQuery.value,
        category: selectedCategory.value
      }
    })
    searchResults.value = response.data.data || response.data || []
  } catch (error) {
    console.error('Error searching items:', error)
  }
}

const toggleSearchResults = () => {
  showSearchResults.value = !showSearchResults.value
  if (showSearchResults.value) {
    searchItems()
  }
}

const selectItemForAdd = (item: any) => {
  const newItem: OrderItem = {
    id: Date.now(),
    item_id: item.id,
    item_name: item.name,
    category: item.category,
    quantity: 1,
    rate: item.price,
    discount: 0,
    total: item.price
  }
  
  items.value.push(newItem)
  showSearchResults.value = false
}

const calculateTotal = (item: OrderItem) => {
  item.total = (item.quantity * item.rate) - item.discount
}

const calculateGrandTotal = (): number => {
  return items.value.reduce((sum, item) => sum + item.total, 0)
}

const loadItems = async () => {
  try {
    const response = await axios.get(`/orders/${route.params.id}/items`)
    items.value = response.data.data || response.data || []
  } catch (error) {
    console.error('Error loading items:', error)
  }
}

const removeItem = async (itemId: string | number) => {
  try {
    if (route.params.id) {
      await axios.delete(`/orders/${route.params.id}/items/${itemId}`)
    }
    items.value = items.value.filter(i => i.id !== itemId)
  } catch (error) {
    console.error('Error removing item:', error)
  }
}
</script>

<style scoped>
.item-card {
  transition: all 0.2s;
  &:hover {
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    transform: translateY(-2px);
  }
}

.search-results {
  max-height: 600px;
  overflow-y: auto;
}
</style>
```

---

## Build Plan #3: OrderParticipants.vue

**Purpose**: Manage hunt participants (hunters, observers, guides, companions)

**Simple Version** (What Exists in SalesInquiry):
```vue
<template>
  <div class="participants-container">
    <h4 class="mb-4">Participants</h4>
    
    <div class="row g-4">
      <!-- Hunters -->
      <div class="col-md-6">
        <div class="card">
          <div class="card-body">
            <h6 class="card-title">
              <i class="fa fa-crosshairs"></i> Hunters
            </h6>
            <div class="input-group">
              <button class="btn btn-outline-secondary" @click="decreaseCount('hunters')">-</button>
              <input 
                v-model.number="participants.hunters" 
                type="number"
                class="form-control text-center"
                readonly
              />
              <button class="btn btn-outline-secondary" @click="increaseCount('hunters')">+</button>
            </div>
            <small class="text-muted d-block mt-2">Primary hunt participants</small>
          </div>
        </div>
      </div>
      
      <!-- Observers -->
      <div class="col-md-6">
        <div class="card">
          <div class="card-body">
            <h6 class="card-title">
              <i class="fa fa-eye"></i> Observers
            </h6>
            <div class="input-group">
              <button class="btn btn-outline-secondary" @click="decreaseCount('observers')">-</button>
              <input 
                v-model.number="participants.observers" 
                type="number"
                class="form-control text-center"
                readonly
              />
              <button class="btn btn-outline-secondary" @click="increaseCount('observers')">+</button>
            </div>
            <small class="text-muted d-block mt-2">Companions watching hunt</small>
          </div>
        </div>
      </div>
      
      <!-- Guides (Auto-calculated) -->
      <div class="col-md-6">
        <div class="card bg-light">
          <div class="card-body">
            <h6 class="card-title">
              <i class="fa fa-map"></i> Guides
            </h6>
            <input 
              :value="autoCalculatedGuides" 
              type="number"
              class="form-control text-center"
              readonly
              disabled
            />
            <small class="text-muted d-block mt-2">Auto-calculated (1 per 2 hunters)</small>
          </div>
        </div>
      </div>
      
      <!-- Companions -->
      <div class="col-md-6">
        <div class="card">
          <div class="card-body">
            <h6 class="card-title">
              <i class="fa fa-people-group"></i> Companions
            </h6>
            <div class="input-group">
              <button class="btn btn-outline-secondary" @click="decreaseCount('companions')">-</button>
              <input 
                v-model.number="participants.companions" 
                type="number"
                class="form-control text-center"
              />
              <button class="btn btn-outline-secondary" @click="increaseCount('companions')">+</button>
            </div>
            <small class="text-muted d-block mt-2">Additional non-hunting participants</small>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Total Summary -->
    <div class="alert alert-info mt-4">
      <strong>Total Participants:</strong> {{ totalParticipants }} people
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

const participants = ref({
  hunters: 2,
  observers: 1,
  companions: 0
})

const autoCalculatedGuides = computed(() => {
  return Math.ceil(participants.value.hunters / 2)
})

const totalParticipants = computed(() => {
  return (
    participants.value.hunters +
    participants.value.observers +
    participants.value.companions +
    autoCalculatedGuides.value
  )
})

const increaseCount = (type: string) => {
  if (type in participants.value) {
    (participants.value as any)[type]++
  }
}

const decreaseCount = (type: string) => {
  if (type in participants.value && (participants.value as any)[type] > 0) {
    (participants.value as any)[type]--
  }
}
</script>
```

---

## Next Steps

1. **Create these components** in `src/views/orders/` folder
2. **Update OrderForm.vue** to use tabs or steps to organize them
3. **Build matching backend** endpoints
4. **Test end-to-end** wizard workflow

Each component is self-contained and can be built independently!

