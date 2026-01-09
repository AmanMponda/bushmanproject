<script setup>
import { ref, onMounted, computed } from 'vue';
import StandardDataTable from '@/components/bootstrap/StandardDataTable.vue'

const governmentFeesData = ref(null);
const loading = ref(true);

const columns = [
  { key: 'id', label: '#', sortable: true, visible: true },
  { key: 'english_name', label: 'English Name', sortable: true, visible: true },
  { key: 'swahili_name', label: 'Swahili Name', sortable: true, visible: true },
  { key: 'scientific_name', label: 'Scientific Name', sortable: true, visible: true },
  { key: 'price_tzs', label: 'Price (TZS)', sortable: true, visible: true },
]

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

const mammalsRows = computed(() => {
  if (!governmentFeesData.value) return []
  return governmentFeesData.value.categories?.mammals || []
})

const formatPrice = (price) => {
  return new Intl.NumberFormat('en-US').format(price);
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
          <!-- BEGIN card -->
          <div class="card">
            <div class="card-header bg-theme text-white fw-bold">
              <i class="fas fa-paw fa-fw me-2"></i>
              {{ governmentFeesData.notes.section_title }}
            </div>
            <div class="card-body">
              <StandardDataTable
                :columns="columns"
                :data="mammalsRows"
                :loading="loading"
                :default-page-size="100"
                :disable-pagination="false"
                :show-date-filters="false"
              >
                <template #id="{ row }">
                  <div class="text-center">{{ row.id }}</div>
                </template>
                <template #scientific_name="{ row }">
                  <em>{{ row.scientific_name }}</em>
                </template>
                <template #price_tzs="{ row }">
                  <div class="text-end fw-bold">{{ formatPrice(row.price_tzs) }}</div>
                </template>
              </StandardDataTable>
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
