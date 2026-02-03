<template>
    <div class="reports-page">
        <div>
            <ul class="breadcrumb">
                <li class="breadcrumb-item"><a href="#">SETTINGS</a></li>
               <li class="breadcrumb-item active"><router-link to="#">LOCATION MASTER</router-link>
                </li>
            </ul>
        </div>

        <!-- MAIN CONTENT -->
        <div class="content-wrapper d-lg-flex">
            <!-- LEFT FILTER PANE -->
            <div class="filter-pane p-3">
                <ul class="nav nav-tabs small mb-3">
                    <li class="nav-item">
                        <button class="nav-link" @click="activeTab = t">Location Master</button>
                    </li>
                </ul>
                <div class="list-group gap-2">
                    <button v-for="t in reportTypes" :key="t.name" @click="toggleType(t.name)"
                        class="list-group-item d-flex align-items-center justify-content-between fs-5"
                        :class="{ active: activeTab === t.name }">
                        <span><i :class="[t.class,]"></i>{{ t.name }}</span> <span class="badge text-bg-light">{{
                            t.count }}</span>
                    </button>
                </div>
            </div>

            <!-- CARDS GRID -->
            <div class="cards-section flex-grow-1 p-3">
                <div class="d-flex align-items-center mb-2">
                    <div class="small text-uppercase text-muted">{{ activeTab }}</div>
                    <div class="ms-auto d-flex align-items-center gap-2">
                        <!-- Clear favorites button (only show on Favorites tab) -->
                        <button v-if="activeTab === 'Favorites' && filteredCards.length > 0"
                            class="btn btn-sm btn-outline-danger" @click="clearAllFavorites"
                            title="Clear all favorites">
                            <i class="bi bi-trash me-1"></i>Clear All
                        </button>
                       
                    </div>
                </div>
                <!-- tabs contents -->
                <div class="row g-3" style=" margin-top: -30px;">
                    <div v-if="activeTab === 'Countries'">
                        <Country></Country>
                    </div>
                    <div v-if="activeTab === 'City'">
                        <City></City>
                    </div>
                    <div v-if="activeTab === 'Branches'">
                        <branch></branch>
                    </div>
                    <div v-if="activeTab === 'Offices'">
                        <office></office>
                    </div>
                    <div v-if="activeTab === 'Service Points'">
                     <ServicePoint></ServicePoint>
                    </div>
                    <div v-if="activeTab === 'Stops'">
                     <Stop></Stop>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useNotification } from '@/composables/notification'
import { useAppOptionStore } from '@/stores/app-option';
import axios from 'axios';
import { useAuthStore } from "@/stores/auth";
import { API_URL4 } from "@/config/config";
import Country from './country.vue';
import City from './city.vue';
import Office from './office.vue';
import Branch from './Branch.vue';
import ServicePoint  from './servicePoint.vue';
import Stop from './stops.vue';


const authStore = useAuthStore();

const axiosInstance = axios.create({
  baseURL: API_URL4,
  headers: {
    "Content-Type": "application/json",
    Authorization: authStore.token ? `Bearer ${authStore.token}` : "",
    "X-User-Id": authStore.user?.id || "",
    "X-Username": authStore.user?.username || "",
  },
});
const isLoading = ref(false);
const appOption = useAppOptionStore();
const { showAlert } = useNotification()
const countries = ref([]);
const branches = ref([]);
const cities = ref([]);
const offices = ref([]);
const servicePoints = ref([]);
const activeTab = ref('Countries')

const reportTypes = computed(() => [
  { name: 'Countries', count: countries.value.length, class: "bi bi-globe-europe-africa me-3 fs-4" },
  { name: 'City', count: cities.value.length, class: "bi bi-textarea me-3 fs-4" },
  { name: 'Branches', count: branches.value.length, class: "bi bi-buildings me-3 fs-4" },
  { name: 'Offices', count: offices.value.length, class: "bi bi-building-fill me-3 fs-4" },
  { name: 'Service Points', count:servicePoints.value.length, class: "bi bi-shop-window me-3 fs-4" },
  { name: 'Stops', count: 0, class: "bi bi-geo-alt me-3 fs-4" },
]);

//
const selectedTypes = ref(new Set())
const query = ref('')
const sortBy = ref('name')
const gridCols = ref(3)

const cards = ref([
    { id: 1, title: 'Contact Renewal Reminders', description: 'Lists all date based reminders for contacts.', category: 'Contacts', favorite: false, path: "#" },
    { id: 2, title: 'Contacts List', description: 'List of all basic contacts information.', category: 'Contacts', favorite: false, path: "#" },
    { id: 3, title: 'Cost Comparison by Year in Service', description: 'Analysis of total vehicle costs per meter based on life cycle.', category: 'Vehicles', favorite: false, path: "#" },
    { id: 4, title: 'Cost/Meter Trend', description: 'Total vehicle costs per meter (mile/km/hour) over time.', category: 'Vehicles', favorite: false, path: "#" },
    { id: 5, title: 'Expense Summary', description: 'Aggregate expense costs grouped by expense type or vehicle group.', category: 'Vehicles', favorite: false, path: "#" },
    { id: 6, title: 'Expenses by Vehicle', description: 'Listing of all expense entries by vehicle.', category: 'Vehicles', favorite: false, path: "#" },
    { id: 7, title: 'Faults Summary', description: 'Summarized fault metrics for particular fault codes and vehicles.', category: 'Issues', favorite: false, path: "#" },
    { id: 8, title: 'Fuel Entries by Vehicle', description: 'Listing of fuel entries by vehicle.', category: 'Fuel', favorite: false, path: "#" },
    { id: 9, title: 'Fuel Summary', description: 'Listing of summarized fuel metrics.', category: 'Fuel', favorite: false, path: "#" },
    { id: 10, title: 'Fuel Summary by Location', description: 'Aggregate fuel volumes and pricing by location.', category: 'Fuel', favorite: false, path: "#" },
    { id: 11, title: 'Group Changes', description: 'List of changes applied to asset groups.', category: 'Vehicles', favorite: false, path: "#" },
    { id: 12, title: 'Inspection Failures List', description: 'Inspection items that failed recently.', category: 'Inspections', favorite: false, path: "#" },
    { id: 13, title: 'Office Sales Report', description: 'Comprehensive sales performance analysis by individual Office.', category: 'Sales', favorite: false, path: '/abs/report/office-sales' },
    { id: 14, title: 'Ticketing Amendments', description: 'Analysis of ticketing changes and their impacts.', category: 'Sales', favorite: false, path: '/abs/report/tickets-amendments' }
])

// Local storage functions for favorites
const FAVORITES_STORAGE_KEY = 'abs_reports_favorites'

const loadFavorites = () => {
    try {
        const savedFavorites = localStorage.getItem(FAVORITES_STORAGE_KEY)
        if (savedFavorites) {
            const favoriteIds = JSON.parse(savedFavorites)
            // Update cards with saved favorite status
            cards.value.forEach(card => {
                card.favorite = favoriteIds.includes(card.id)
            })
        }
        updateReportTypeCounts()
    } catch (error) {
        console.error('Error loading favorites:', error)
    }
}

const updateReportTypeCounts = () => {
    // Count reports by category
    const counts = {}
    cards.value.forEach(card => {
        counts[card.category] = (counts[card.category] || 0) + 1
    })

    // Update reportTypes with actual counts
    reportTypes.value.forEach(type => {
        type.count = counts[type.name] || 0
    })
}

const saveFavorites = () => {
    try {
        const favoriteIds = cards.value
            .filter(card => card.favorite)
            .map(card => card.id)
        localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favoriteIds))
        updateReportTypeCounts()
    } catch (error) {
        console.error('Error saving favorites:', error)
    }
}

// Load favorites when component mounts
onMounted(() => {
    fetchCountries();
    fetchCities();
    fetchBranches();
    fetchOffices();
    fetchServicePoints();
})

onBeforeUnmount(() => {
    
});

// Computed properties
const gridClass = computed(() => {
    // Map number to Bootstrap responsive cols
    const n = gridCols.value;
    return {
        'row-cols-1': true,
        'row-cols-md-2': n >= 2,
        'row-cols-lg-3': n >= 3,
        'row-cols-xl-4': n >= 4
    };
})

const filteredCards = computed(() => {
    let list = cards.value.slice();
    // Tab filters
    if (activeTab.value === 'Favorites') list = list.filter(c => c.favorite);
    if (activeTab.value === 'Saved') list = list.filter(c => c.saved);
    if (activeTab.value === 'Shared') list = list.filter(c => c.shared);

    // Type filter (by category)
    if (selectedTypes.value.size > 0) {
        list = list.filter(c => selectedTypes.value.has(c.category));
    }

    // Query
    const q = query.value.trim().toLowerCase();
    if (q) {
        list = list.filter(c => (c.title + " " + c.description + " " + c.category).toLowerCase().includes(q));
    }

    // Sort
    if (sortBy.value === 'name') list.sort((a, b) => a.title.localeCompare(b.title));
    if (sortBy.value === 'category') list.sort((a, b) => a.category.localeCompare(b.category) || a.title.localeCompare(b.title));

    return list;
})

// Methods
const toggleType = (name) => {
    activeTab.value = name;
}

// Toggle favorite and save to localStorage
const toggleFavorite = (card) => {
    card.favorite = !card.favorite
    saveFavorites()
    showAlert(card.favorite ? 'Added to favorites' : 'Removed from favorites', 'success')
}

// Clear all favorites
const clearAllFavorites = () => {
    cards.value.forEach(card => {
        card.favorite = false
    })
    saveFavorites()
    showAlert('All favorites cleared', 'info')
}


async function fetchCountries() {
    isLoading.value = true;
    try {
        const res = await axiosInstance.get('countries');
        countries.value = res.data.map((d, index) => {
            return {
                sno: index + 1,
                id: d.id,
                name: d.name
            }
        }
        );
    } catch (error) {
        showAlert('error', 'Failed to fetch countries');
    } finally {
        isLoading.value = false;
    }
}

const fetchCities = async () => {
    try {
        const response = await axiosInstance.get('active-cities');
        cities.value = response.data.data || response.data;
    } catch (error) {
        showAlert('error', 'Failed to fetch cities');
    }
};

const fetchBranches = async () => {
    try {
        const response = await axiosInstance.get('branches');
        branches.value = response.data.map((d, index) => {
            return {
                sno: index + 1,
                id: d.id,
                name: d.name,
                city: d.city,
            }
        });
    } catch (error) {
        showAlert('error', 'Failed to fetch branches');
    } finally {
        isLoading.value = false;
    }
};

const fetchOffices = async () => {
    try {
        const response = await axiosInstance.get('offices');
        offices.value = response.data.data.map((d, index) => {
            return {
                sno: index + 1,
                id: d.id,
                branch_id: d.branch_id,
                office: d.name,
                branch: d.branch,
                location: d.location,
                contacts: d.contact,
                address: d.address,
                status: d.status,
                code: d.code
            }
        });
    } catch (error) {
        showAlert('error', 'Failed to fetch offices');
    } finally {
        isLoading.value = false;
    }
};

const fetchServicePoints = async () => {
  isLoading.value = true;
  try {
    const response = await axiosInstance.get('service-points');
    servicePoints.value = response.data.data.map((d, index) => {
    //return {
        sno: index + 1,
        id: d.id,
        office: d.office,
        office_id: d.office_id,
        name: d.name,
        supervisor: d.supervisor,
      }
    });
  } catch (error) {
    showAlert('error', 'Failed to fetch service points');
  } finally {
    isLoading.value = false;
  }
};

</script>

<style scoped>
/* Page container */
.no-underline {
    text-decoration: none;
    color: inherit;
    /* optional: keeps the text color as-is */
}


/* Breadcrumb */
.breadcrumb {
    margin-bottom: 20px;
}

/* Page header */
.page-header {
    margin-bottom: 20px;
    color: #2c3e50;
}

.page-header small {
    color: #6c757d;
    font-weight: normal;
}

/* Content wrapper */
.content-wrapper {

    background: #fff;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    overflow: hidden;
}

/* Left filter panel */
.filter-pane {
    width: 250px;
    min-width: 250px;
    border-right: 1px solid #eef0f2;
    background: #fff;
    overflow-y: auto;
    height: 100%;
}

.filter-pane .list-group-item {
    border: none;
    border-radius: .5rem;
    cursor: pointer;
}

.filter-pane .list-group-item.active {
    background: #e7f5ef;
    color: #0f5132;
}

.filter-pane .list-group-item:hover {
    background: #f8f9fa;
}

/* Cards section */
.cards-section {
    flex: 1;
    overflow-y: auto;
    background: #f8f9fb;
    height: 100%;
}

/* Cards */
.report-card {
    border: 1px solid #e9ecef;
    border-radius: .8rem;
    background: #fff;
    transition: transform .12s ease, box-shadow .12s ease;
    height: 160px;
    cursor: pointer;
}

.report-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 .5rem 1rem rgba(0, 0, 0, .06);
}

.report-card .badge {
    position: absolute;
    right: .9rem;
    bottom: .9rem;
}

.report-card .card-title {
    font-weight: 600;
    color: #2c3e50;
}

/* Navigation tabs */
.nav-tabs .nav-link {
    border: none;
    color: #6c757d;
    font-size: 0.875rem;
    padding: 0.5rem 1rem;
    cursor: pointer;
}

.nav-tabs .nav-link.active {
    background: #e7f5ef;
    color: #0f5132;
    border-bottom: 2px solid #0f5132;
}

.nav-tabs .nav-link:hover {
    background: #f8f9fa;
}

/* Buttons */
.btn-outline-secondary {
    border-color: #dee2e6;
    color: #6c757d;
}

.btn-outline-secondary:hover {
    background-color: #6c757d;
    border-color: #6c757d;
    color: white;
}

/* Badges */
.badge.text-bg-light {
    background-color: #f8f9fa !important;
    color: #6c757d !important;
}

/* Utilities */
.muted {
    color: #6c757d;
}

.reports-page {
    padding: 10px;
}

/* Responsive design */
@media (max-width: 992px) {
    .content-wrapper {
        flex-direction: column;
    }

    .filter-pane {
        width: 100%;
        min-width: 100%;
        border-right: 0;
        border-bottom: 1px solid #eef0f2;
        height: auto;
        max-height: 300px;
    }
}

@media (max-width: 768px) {
    .reports-page {
        padding: 15px;
    }

    .page-header {
        margin-bottom: 20px;
    }
}
</style>
