<script setup>
import { ref, onMounted, computed } from 'vue';

const governmentFeesData = ref(null);
const loading = ref(true);
const searchQuery = ref('');
const currentPage = ref(1);
const itemsPerPage = ref(10);

const loadGovernmentFees = async () => {
  try {
    const response = await fetch('/assets/data/government-fees.json');
    governmentFeesData.value = await response.json();
    loading.value = false;
  } catch (error) {
    console.error('Error loading government fees:', error);
    loading.value = false;
  }
};

const filteredMammals = computed(() => {
  if (!governmentFeesData.value) return [];
  
  const mammals = governmentFeesData.value.categories.mammals;
  
  if (!searchQuery.value) return mammals;
  
  const query = searchQuery.value.toLowerCase();
  return mammals.filter(mammal => 
    mammal.english_name.toLowerCase().includes(query) ||
    mammal.swahili_name.toLowerCase().includes(query) ||
    mammal.scientific_name.toLowerCase().includes(query)
  );
});

const paginatedMammals = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value;
  const end = start + itemsPerPage.value;
  return filteredMammals.value.slice(start, end);
});

const totalPages = computed(() => {
  return Math.ceil(filteredMammals.value.length / itemsPerPage.value);
});

const formatPrice = (price) => {
  return new Intl.NumberFormat('en-US').format(price);
};

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++;
  }
};

const prevPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--;
  }
};

const goToPage = (page) => {
  currentPage.value = page;
};

onMounted(() => {
  loadGovernmentFees();
});
</script>

<template>
  <!-- BEGIN container -->
  <div class="container">
    <!-- BEGIN row -->
    <div class="row justify-content-center">
      <!-- BEGIN col-12 -->
      <div class="col-xl-12">
        <div class="mb-4">
          <h1 class="page-header">
            <i class="fas fa-balance-scale fa-fw me-2"></i>
            Government Fees
          </h1>
          <p class="text-muted mb-0">
            Tourist Hunting Fees - Government Notice No. 780
          </p>
        </div>

        <div v-if="loading" class="text-center py-5">
          <div class="spinner-border text-theme" role="status">
            <span class="visually-hidden">Loading...</span>
          </div>
        </div>

        <div v-else-if="governmentFeesData">
          <!-- Statistics Cards Header -->
          <div class="row mb-4">
            <div class="col-md-4">
              <div class="card bg-primary text-white border-0 shadow-sm stats-card">
                <div class="card-body d-flex align-items-center justify-content-between">
                  <div>
                    <h6 class="mb-1 fw-normal opacity-75">Total Species</h6>
                    <h2 class="mb-0 fw-bold">{{ governmentFeesData.categories.mammals.length }}</h2>
                  </div>
                  <div class="stats-icon">
                    <i class="fas fa-list fa-3x opacity-50"></i>
                  </div>
                </div>
              </div>
            </div>
            <div class="col-md-4">
              <div class="card bg-success text-white border-0 shadow-sm stats-card">
                <div class="card-body d-flex align-items-center justify-content-between">
                  <div>
                    <h6 class="mb-1 fw-normal opacity-75">Lowest Fee(TZS)</h6>
                    <h2 class="mb-0 fw-bold">{{ formatPrice(Math.min(...governmentFeesData.categories.mammals.map(m => m.price_tzs))) }}</h2>
                  </div>
                  <div class="stats-icon">
                    <i class="fas fa-arrow-down fa-3x opacity-50"></i>
                  </div>
                </div>
              </div>
            </div>
            <div class="col-md-4">
              <div class="card bg-danger text-white border-0 shadow-sm stats-card">
                <div class="card-body d-flex align-items-center justify-content-between">
                  <div>
                    <h6 class="mb-1 fw-normal opacity-75">Highest Fee(TZS)</h6>
                    <h2 class="mb-0 fw-bold">{{ formatPrice(Math.max(...governmentFeesData.categories.mammals.map(m => m.price_tzs))) }}</h2>
                  </div>
                  <div class="stats-icon">
                    <i class="fas fa-arrow-up fa-3x opacity-50"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <!-- BEGIN card -->
          <div class="card">
            <div class="card-header bg-theme text-white fw-bold">
              <i class="fas fa-paw fa-fw me-2"></i>
              {{ governmentFeesData.notes.section_title }}
            </div>
            <div class="card-body">
              <!-- Search Bar -->
              <div class="row mb-3">
                <div class="col-md-6">
                  <div class="input-group">
                    <span class="input-group-text">
                      <i class="fas fa-search"></i>
                    </span>
                    <input 
                      v-model="searchQuery" 
                      type="text" 
                      class="form-control" 
                      placeholder="Search by English, Swahili, or Scientific name..."
                      @input="currentPage = 1"
                    >
                  </div>
                </div>
                <div class="col-md-6 text-end">
                  <div class="badge bg-info fs-14px px-3 py-2">
                    <i class="fas fa-info-circle me-1"></i>
                    Currency: {{ governmentFeesData.notes.currency }}
                  </div>
                </div>
              </div>

              <!-- Data Table -->
              <div class="table-responsive">
                <table class="table table-striped table-hover">
                  <thead class="table-dark">
                    <tr>
                      <th width="5%" class="text-center">#</th>
                      <th width="25%">English Name</th>
                      <th width="20%">Swahili Name</th>
                      <th width="30%">Scientific Name</th>
                      <th width="20%" class="text-end">Price (TZS)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="mammal in paginatedMammals" :key="mammal.id">
                      <td class="text-center">{{ mammal.id }}</td>
                      <td>{{ mammal.english_name }}</td>
                      <td>{{ mammal.swahili_name }}</td>
                      <td><em>{{ mammal.scientific_name }}</em></td>
                      <td class="text-end fw-bold">{{ formatPrice(mammal.price_tzs) }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <!-- Pagination -->
              <div class="row align-items-center mt-3">
                <div class="col-md-6">
                  <div class="text-muted">
                    Showing {{ (currentPage - 1) * itemsPerPage + 1 }} to 
                    {{ Math.min(currentPage * itemsPerPage, filteredMammals.length) }} 
                    of {{ filteredMammals.length }} entries
                  </div>
                </div>
                <div class="col-md-6">
                  <nav aria-label="Page navigation">
                    <ul class="pagination justify-content-end mb-0">
                      <li class="page-item" :class="{ disabled: currentPage === 1 }">
                        <a class="page-link" href="#" @click.prevent="prevPage">
                          <i class="fas fa-chevron-left"></i>
                        </a>
                      </li>
                      <li 
                        v-for="page in totalPages" 
                        :key="page"
                        class="page-item" 
                        :class="{ active: currentPage === page }"
                      >
                        <a class="page-link" href="#" @click.prevent="goToPage(page)">
                          {{ page }}
                        </a>
                      </li>
                      <li class="page-item" :class="{ disabled: currentPage === totalPages }">
                        <a class="page-link" href="#" @click.prevent="nextPage">
                          <i class="fas fa-chevron-right"></i>
                        </a>
                      </li>
                    </ul>
                  </nav>
                </div>
              </div>
            </div>
            <div class="card-footer text-muted">
              <small>
                <i class="fas fa-file-alt me-1"></i>
                {{ governmentFeesData.notes.title_translation }}
              </small>
            </div>
          </div>
          <!-- END card -->
        </div>

        <div v-else class="alert alert-danger">
          <i class="fas fa-exclamation-triangle me-2"></i>
          Failed to load government fees data.
        </div>
      </div>
      <!-- END col-12 -->
    </div>
    <!-- END row -->
  </div>
  <!-- END container -->
</template>

<style scoped>
.table th {
  font-weight: 600;
  text-transform: uppercase;
  font-size: 0.85rem;
}

.table td {
  vertical-align: middle;
}

.page-header {
  margin-bottom: 1rem;
}

.stats-card {
  transition: transform 0.2s;
}

.stats-card:hover {
  transform: translateY(-2px);
}

.stats-card .card-body {
  padding: 1.5rem;
}

.stats-icon {
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
