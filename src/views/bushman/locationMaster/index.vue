
<template>
    <div class="d-block d-md-flex align-items-stretch h-100">
        <!-- BEGIN gallery-menu-container -->
        <div class="gallery-menu-container">
            <!-- BEGIN scrollbar -->
            <perfect-scrollbar class="h-100">
                <!-- BEGIN gallery-menu -->
                <div class="gallery-menu">
                    <div class="gallery-menu-header">Menu</div>
                    <div v-for="t in reportTypes" :key="t.name" @click="toggleType(t.name)"
                        class="gallery-menu-item d-flex align-items-center justify-content-between"
                        :class="activeTab == t.name ? 'bg-info border-bottom' : ''"><a 
                            class="gallery-menu-link"><i :class="[t.class,] " style="color: #3c4e71;"></i>{{ t.name }}</a> <span
                            class="badge text-bg-light me-4">{{
                                t.count }}
                            </span>
                    </div>
                </div>

                <!-- END gallery-menu -->
            </perfect-scrollbar>
            <!-- end scrollbar -->
        </div>
        <!-- END gallery-menu-container -->
        <!-- BEGIN gallery-content-container -->
        <div class="gallery-content-container">
            <!-- BEGIN scrollbar -->
            <perfect-scrollbar class="h-100">
                <!-- BEGIN gallery-content -->
                <div class="gallery-content">
                    <!-- BEGIN gallery -->
                    <div class="gallery">
                        <div>
            <ul class="breadcrumb">
                <li class="breadcrumb-item"><a href="#">SETTINGS</a></li>
               <li class="breadcrumb-item"><router-link to="#">LOCATION MASTER</router-link>
                </li>
                <li class="breadcrumb-item active"><router-link to="#">{{activeTab.toUpperCase()}}</router-link>
                </li>
            </ul>
        </div>
                        <!-- BEGIN gallery-image -->
                        <div class="gallery-image">
                            <div class="row g-3 " style="margin-top: -19px;">
                                <div v-if="activeTab === 'Countries'">
                                    <Country class="page-container"></Country>
                                </div>
                                <div v-if="activeTab === 'City'">
                                    <City class="page-container"></City>
                                </div>
                                <div v-if="activeTab === 'Towns'">
                                    <Town class="page-container"></Town>
                                </div>
                                <div v-if="activeTab === 'Branches'">
                                    <branch class="page-container"></branch>
                                </div>
                                <div v-if="activeTab === 'Offices'">
                                    <office class="page-container"></office>
                                </div>
                                <div v-if="activeTab === 'Service Points'">
                                    <ServicePoint class="page-container"></ServicePoint>
                                </div>
                                <div v-if="activeTab === 'Stops'">
                                    <Stop class="page-container"></Stop>
                                </div>
                                <div v-if="activeTab === 'City Links'">
                                    <CityLink class="page-container"></CityLink>
                                </div>
                                 <div v-if="activeTab === 'Route Planning'">
                                    <RoutePlanning class="page-container"></RoutePlanning>
                                </div>
                            </div>
                        </div>
                        <!-- END gallery-image -->
                    </div>
                    <!-- END gallery -->
                </div>
                <!-- END gallery-content -->
            </perfect-scrollbar>
            <!-- END scrollbar -->
        </div>
        <!-- END gallery-content-container -->
    </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { useNotification } from '@/composables/notification'
import { useAppOptionStore } from '@/stores/app-option';
import axios from 'axios';
import { useAuthStore } from "@/stores/auth";
import Country from './country.vue';
import City from './city.vue';
import Town from './town.vue';
import Office from './office.vue';
import Branch from './Branch.vue';
import ServicePoint from './servicePoint.vue';
import Stop from './stops.vue';
import CityLink from './CityLink/index.vue'
import RoutePlanning from './routeplanning/index.vue';

const apiBaseUrl = (import.meta.env.VITE_APP_BASE_URL || '').replace(/\/+$/, '');

const props = defineProps({
  activeTab: {
    type: String,
    required: false,
    default: 'Countries'
  }
})

const authStore = useAuthStore();

const axiosInstance1 = axios.create({
  baseURL: apiBaseUrl,
  headers: {
    "Content-Type": "application/json",
    Authorization: authStore.token ? `Bearer ${authStore.token}` : "",
    "X-User-Id": authStore.user?.id || "",
    "X-Username": authStore.user?.username || "",
  },
});

const axiosInstance = axios.create({
    baseURL: apiBaseUrl,
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
const countries = ref(0);
const branches = ref(0);
const cities = ref(0);
const towns = ref(0);
const offices = ref(0);
const stopsList = ref(0);
const cityLinks = ref(0);
const servicePoints = ref(0);
const activeTab = ref(props.activeTab || 'Countries')

// Watch for prop changes to update local activeTab
watch(() => props.activeTab, (newVal) => {
  if (newVal) {
    activeTab.value = newVal
    sessionStorage.setItem('ACTIVE_TAB', newVal)
  }
}, { immediate: true })

function getActiveTab() {
  const savedTab = sessionStorage.getItem('ACTIVE_TAB')
  if (savedTab) {
    activeTab.value = savedTab
  }
}

const reportTypes = computed(() => [
    { name: 'Countries', count: countries.value, class: "bi bi-globe-europe-africa me-1 fs-5"},
    { name: 'City', count: cities.value, class: "bi bi-textarea me-1 fs-5 " },
    { name: 'Towns', count: towns.value, class: "bi bi-house-door me-1 fs-5 " },
    { name: 'Branches', count: branches.value, class: "bi bi-buildings me-1 fs-5 " },
    { name: 'Offices', count: offices.value, class: "bi bi-building-fill me-1 fs-5 " },
    { name: 'Service Points', count: servicePoints.value, class: "bi bi-shop-window me-1 fs-5 " },
    { name: 'Stops', count: stopsList.value, class: "bi bi-geo-alt me-1 fs-5" },
    { name: 'City Links', count: cityLinks.value, class: "bi bi-link me-1 fs-5" },
    { name: 'Route Planning', count:routesList.value, class: "bi bi-map me-1 fs-5" },
    
]);

const  routesList = ref(0);
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
  appOption.appSidebarMinified = true;
  appOption.appContentFullHeight = true;
  appOption.appContentClass = 'p-0';
    fetchTypeCounts();
    getActiveTab() ;  
})



onBeforeUnmount(() => {
  appOption.appContentFullHeight = false;
  appOption.appSidebarMinified = false;
  appOption.appContentClass = '';
   sessionStorage.removeItem('ACTIVE_TAB')

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

const fetchTypeCounts = async () => {
    isLoading.value = true;
    try {
        const res = await axiosInstance.get('/locations/type-counts');
        const counts = res.data?.data || {};
        countries.value = counts.COUNTRY || 0;
        cities.value = counts.CITY || 0;
        towns.value = counts.TOWN || 0;
        branches.value = counts.BRANCH || 0;
        offices.value = counts.OFFICE || 0;
        servicePoints.value = counts.SERVICE_CENTER || 0;
        stopsList.value = counts.STOP || 0;
        cityLinks.value = counts.CITY_LINK || 0;
        routesList.value = counts.ROUTE || 0;
    } catch (error) {
        console.error(error);
    } finally {
        isLoading.value = false;
    }
}


// async function fetchTotalData() {
//     isLoading.value = true;
//     try {
//         const res = await axiosInstance.get('/locations/total');
//
//         // console.log(res.data);  
//
//         countries.value = res.data.countries;
//         cities.value = res.data.cities;
//         cityLinks.value = res.data.city_link;
//         stopsList.value = res.data.stops;
//         offices.value = res.data.offices;
//         branches.value=  res.data.branches;
//         servicePoints.value = res.data.service_points;
//         routesList.value = res.data.routes;
//
//
//     } catch (error) {
//         console.error(error);
//         ;
//     } finally {
//         isLoading.value = false;
//     }
// }

</script>

<style scoped>
/* Page container */
.no-underline {
    text-decoration: none;
    color: inherit;
    /* optional: keeps the text color as-is */
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


.page-container {
    height: calc(100vh - 100px);
    overflow-y: scroll;
    overflow-x: hidden;
    padding-right: 5px;
    /* background-color: white; */
    border-radius: 2px;

    /* hide scrollbar for Chrome, Edge, Safari */
    scrollbar-width: none;      /* Firefox */
    -ms-overflow-style: none;   /* IE/Edge */
}

.page-container::-webkit-scrollbar {
    display: none;              /* Chrome/Safari */
}


</style>
