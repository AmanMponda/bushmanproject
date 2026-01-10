<script setup>
import { ref, onMounted, computed } from 'vue';
import StandardDataTable from '@/components/bootstrap/StandardDataTable.vue'

const governmentFeesData = ref(null);
const tawaFeesData = ref(null);
const mammalsData = ref(null);
const birdsData = ref(null);
const reptilesData = ref(null);
const loading = ref(true);
const activeTab = ref('mammals'); // 'mammals', 'birds', 'reptiles', or 'tawa'
const activeTawaSection = ref('hunting_blocks'); // Sub-section for TAWA

const columns = [
  { key: 'id', label: '#', sortable: true, visible: true, class: 'text-center' },
  { key: 'english_name', label: 'English Name', sortable: true, visible: true },
  { key: 'swahili_name', label: 'Swahili Name', sortable: true, visible: true },
  { key: 'price_tzs', label: 'Price (TZS)', sortable: true, visible: true, class: 'text-start' },
]

const birdColumns = [
  { key: 'id', label: '#', sortable: true, visible: true, class: 'text-center' },
  { key: 'common_name', label: 'English Name', sortable: true, visible: true },
  { key: 'local_name', label: 'Swahili Name', sortable: true, visible: true },
  { key: 'population', label: 'Price(TZS)', sortable: true, visible: true, class: 'text-start' },
]

const reptileColumns = [
  { key: 'id', label: '#', sortable: true, visible: true, class: 'text-center' },
  { key: 'common_name', label: 'English Name', sortable: true, visible: true },
  { key: 'local_name', label: 'Swahili Name', sortable: true, visible: true },
  { key: 'population', label: 'Price(TZS)', sortable: true, visible: true, class: 'text-start' },
]

const huntingBlockColumns = [
  { key: 'code', label: 'Code', sortable: true, visible: true },
  { key: 'name', label: 'Name', sortable: true, visible: true },
  { key: 'basis', label: 'Basis', sortable: true, visible: true },
  { key: 'amount_display', label: 'Amount (TZS)', sortable: true, visible: true, class: 'text-start' },
]

const licenceFeeColumns = [
  { key: 'code', label: 'No.', sortable: true, visible: true },
  { key: 'category', label: 'Safari Package', sortable: true, visible: true },
  { key: 'duration_days', label: 'Number of Days', sortable: true, visible: true, class: 'text-center' },
  { key: 'amount_tzs', label: 'Fee (TZS)', sortable: true, visible: true, class: 'text-start' },
]


const professionalHunterColumns = [
  { key: 'code', label: 'Code', sortable: true, visible: true },
  { key: 'name', label: 'Name', sortable: true, visible: true },
  { key: 'resident_tzs', label: 'Resident (TZS)', sortable: true, visible: true, class: 'text-start' },
  { key: 'non_resident_tzs', label: 'Non-Resident (TZS)', sortable: true, visible: true, class: 'text-start' },
]

const interCompanyColumns = [
  { key: 'code', label: 'Code', sortable: true, visible: true },
  { key: 'safari_category', label: 'Safari Category', sortable: true, visible: true },
  { key: 'basis', label: 'Basis', sortable: true, visible: true },
  { key: 'amount_tzs', label: 'Amount (TZS)', sortable: true, visible: true, class: 'text-start' },
]


const loadGovernmentFees = async () => {
  try {
    const response = await fetch('/assets/data/government-fees.json');
    governmentFeesData.value = await response.json();
    
    // Load birds data
    const birdsResponse = await fetch('/assets/data/birds.json');
    birdsData.value = await birdsResponse.json();

    // Load reptiles data
    const reptilesResponse = await fetch('/assets/data/reptiles.json');
    reptilesData.value = await reptilesResponse.json();

    const tawaResponse = await fetch('/assets/data/tawa_trophy_hunting_fees.json');
    tawaFeesData.value = await tawaResponse.json();
    
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

const birdsRows = computed(() => {
  return birdsData.value || []
})

const reptilesRows = computed(() => {
  return reptilesData.value || []
})

const huntingBlockRows = computed(() => {
  return (tawaFeesData.value?.hunting_block_fees || []).map((item) => ({
    ...item,
    amount_display: item.amount_tzs ?? item.amount,
  }))
})

const licenceFeeRows = computed(() => {
  return tawaFeesData.value?.trophy_hunting_licence_fees || []
})

const professionalHunterRows = computed(() => {
  return tawaFeesData.value?.professional_hunter_fees || []
})

const interCompanyRows = computed(() => {
  return tawaFeesData.value?.inter_company_license_fees || []
})

const tawaNotes = computed(() => {
  return tawaFeesData.value?.notes || {}
})

const formatPrice = (price) => {
  return new Intl.NumberFormat('en-US').format(price);
};

const formatAmount = (value) => {
  if (typeof value === 'number') return formatPrice(value);
  return value ?? '';
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
          <div class="d-flex justify-content-between align-items-center mb-3">
            <div>
              <h1 class="page-header mb-2">
                <i class="fas fa-balance-scale fa-fw me-2"></i>
                Government Fees
              </h1>
              <p class="text-muted mb-0">
                Tourist Hunting Fees - Government Notice No. 780
              </p>
            </div>
            <div class="btn-group" role="group">
              <button 
                type="button" 
                class="btn"
                :class="activeTab === 'mammals' ? 'btn-theme' : 'btn-outline-theme'"
                @click="activeTab = 'mammals'"
              >
                <i class="fas fa-paw fa-fw me-1"></i>
                Mammals
              </button>
              <button 
                type="button" 
                class="btn"
                :class="activeTab === 'birds' ? 'btn-success' : 'btn-outline-success'"
                @click="activeTab = 'birds'"
              >
                <i class="fas fa-dove fa-fw me-1"></i>
                Birds
              </button>
              <button 
                type="button" 
                class="btn"
                :class="activeTab === 'reptiles' ? 'btn-info' : 'btn-outline-info'"
                @click="activeTab = 'reptiles'"
              >
                <i class="fas fa-fan fa-fw me-1"></i>
                Reptiles
              </button>
              <button 
                type="button" 
                class="btn"
                :class="activeTab === 'tawa' ? 'btn-warning' : 'btn-outline-warning'"
                @click="activeTab = 'tawa'"
              >
                <i class="fas fa-map-signs fa-fw me-1"></i>
                TAWA Trophy Hunting Fees
              </button>
            </div>
          </div>
        </div>

        <div v-if="loading" class="text-center py-5">
          <div class="spinner-border text-theme" role="status">
            <span class="visually-hidden">Loading...</span>
          </div>
        </div>

        <div v-else-if="governmentFeesData">
          <!-- BEGIN Mammals card -->
          <div v-if="activeTab === 'mammals'" class="card">
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
                <template #price_tzs="{ row }">
                  <div class="text-start fw-bold">{{ formatPrice(row.price_tzs) }}</div>
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
          <!-- END Mammals card -->

          <!-- BEGIN Birds card -->
          <div v-if="activeTab === 'birds'" class="card">
            <div class="card-header bg-success text-white fw-bold">
              <i class="fas fa-dove fa-fw me-2"></i>
              Birds Fees
            </div>
            <div class="card-body">
              <StandardDataTable
                :columns="birdColumns"
                :data="birdsRows"
                :loading="loading"
                :default-page-size="100"
                :disable-pagination="false"
                :show-date-filters="false"
              >
                <template #id="{ row }">
                  <div class="text-center">{{ row.id }}</div>
                </template>
                <template #population="{ row }">
                  <div class="text-start fw-bold">{{ formatPrice(row.population) }}</div>
                </template>
              </StandardDataTable>
            </div> 
          </div>
          <!-- END Birds card -->

          <!-- BEGIN Reptiles card -->
          <div v-if="activeTab === 'reptiles'" class="card">
            <div class="card-header bg-info text-white fw-bold">
              <i class="fas fa-fan fa-fw me-2"></i>
              Reptiles Fees
            </div>
            <div class="card-body">
              <StandardDataTable
                :columns="reptileColumns"
                :data="reptilesRows"
                :loading="loading"
                :default-page-size="100"
                :disable-pagination="false"
                :show-date-filters="false"
              >
                <template #id="{ row }">
                  <div class="text-center">{{ row.id }}</div>
                </template>
                <template #population="{ row }">
                  <div class="text-start fw-bold">{{ formatPrice(row.population) }}</div>
                </template>
              </StandardDataTable>
            </div> 
          </div>
          <!-- END Reptiles card -->

          <!-- BEGIN TAWA trophy hunting -->
          <div v-if="activeTab === 'tawa'">
            <!-- TAWA Header Card -->
            <div class="card mb-4">
              <div class="card-header bg-warning text-dark fw-bold d-flex justify-content-between align-items-center">
                <div>
                  <i class="fas fa-map-signs fa-fw me-2"></i>
                  {{ tawaFeesData?.authority }} - {{ tawaFeesData?.regime }}
                </div>
                <span class="badge bg-dark">{{ tawaFeesData?.effective_date }}</span>
              </div>
            </div>

            <!-- TAWA Sub-navigation -->
            <div class="card mb-4">
              <div class="card-body p-2">
                <div class="d-flex flex-wrap gap-2">
                  <button 
                    class="btn btn-sm"
                    :class="activeTawaSection === 'hunting_blocks' ? 'btn-warning' : 'btn-outline-secondary'"
                    @click="activeTawaSection = 'hunting_blocks'"
                  >
                    <i class="fas fa-map-marker-alt me-1"></i> Hunting Blocks
                  </button>
                  <button 
                    class="btn btn-sm"
                    :class="activeTawaSection === 'licence_fees' ? 'btn-warning' : 'btn-outline-secondary'"
                    @click="activeTawaSection = 'licence_fees'"
                  >
                    <i class="fas fa-certificate me-1"></i> Licence Fees
                  </button>
                  <button 
                    class="btn btn-sm"
                    :class="activeTawaSection === 'professional' ? 'btn-warning' : 'btn-outline-secondary'"
                    @click="activeTawaSection = 'professional'"
                  >
                    <i class="fas fa-user-tie me-1"></i> Professional Hunter
                  </button>
                  <button 
                    class="btn btn-sm"
                    :class="activeTawaSection === 'inter_company' ? 'btn-warning' : 'btn-outline-secondary'"
                    @click="activeTawaSection = 'inter_company'"
                  >
                    <i class="fas fa-handshake me-1"></i> Inter-Company License
                  </button>
                </div>
              </div>
            </div>

            <!-- Hunting Block Fees -->
            <div v-if="activeTawaSection === 'hunting_blocks'" class="card">
              <div class="card-header bg-secondary text-white fw-bold">
                <i class="fas fa-map-marker-alt fa-fw me-2"></i>
                Hunting Block Fees
              </div>
              <div class="card-body">
                <StandardDataTable
                  :columns="huntingBlockColumns"
                  :data="huntingBlockRows"
                  :loading="loading"
                  :default-page-size="100"
                  :disable-pagination="false"
                  :show-date-filters="false"
                >
                  <template #amount_display="{ row }">
                    <div class="text-start fw-bold">{{ formatAmount(row.amount_display) }}</div>
                  </template>
                </StandardDataTable>
              </div>
            </div>

            <!-- Trophy Hunting Licence Fees -->
            <div v-if="activeTawaSection === 'licence_fees'" class="card">
              <div class="card-header bg-secondary text-white fw-bold">
                <i class="fas fa-certificate fa-fw me-2"></i>
                Trophy Hunting Licence Fees
              </div>
              <div class="card-body">
                <StandardDataTable
                  :columns="licenceFeeColumns"
                  :data="licenceFeeRows"
                  :loading="loading"
                  :default-page-size="100"
                  :disable-pagination="false"
                  :show-date-filters="false"
                >
                  <template #duration_days="{ row }">
                    <div class="text-center">{{ row.duration_days || '-' }}</div>
                  </template>
                  <template #amount_tzs="{ row }">
                    <div class="text-start fw-bold">{{ formatPrice(row.amount_tzs) }}</div>
                  </template>
                  <template #category="{ row }">
                    <div>
                      {{ row.category }}
                      <div v-if="row.basis" class="small text-muted">{{ row.basis }}</div>
                    </div>
                  </template>
                </StandardDataTable>
              </div>
            </div>

            <!-- Professional Hunter Fees -->
            <div v-if="activeTawaSection === 'professional'" class="card">
              <div class="card-header bg-secondary text-white fw-bold">
                <i class="fas fa-user-tie fa-fw me-2"></i>
                Professional Hunter Fees
              </div>
              <div class="card-body">
                <StandardDataTable
                  :columns="professionalHunterColumns"
                  :data="professionalHunterRows"
                  :loading="loading"
                  :default-page-size="100"
                  :disable-pagination="false"
                  :show-date-filters="false"
                >
                  <template #resident_tzs="{ row }">
                    <div class="text-start fw-bold">{{ formatPrice(row.resident_tzs) }}</div>
                  </template>
                  <template #non_resident_tzs="{ row }">
                    <div class="text-start fw-bold">{{ formatPrice(row.non_resident_tzs) }}</div>
                  </template>
                </StandardDataTable>
              </div>
            </div>

            <!-- Inter-Company License Fees -->
            <div v-if="activeTawaSection === 'inter_company'" class="card">
              <div class="card-header bg-secondary text-white fw-bold">
                <i class="fas fa-handshake fa-fw me-2"></i>
                Inter-Company License Fees
              </div>
              <div class="card-body">
                <StandardDataTable
                  :columns="interCompanyColumns"
                  :data="interCompanyRows"
                  :loading="loading"
                  :default-page-size="100"
                  :disable-pagination="false"
                  :show-date-filters="false"
                >
                  <template #amount_tzs="{ row }">
                    <div class="text-start fw-bold">{{ formatPrice(row.amount_tzs) }}</div>
                  </template>
                </StandardDataTable>
                <div v-if="tawaNotes.E || tawaNotes.F" class="mt-3 small text-muted">
                  <div v-if="tawaNotes.E">{{ tawaNotes.E }}</div>
                  <div v-if="tawaNotes.F">{{ tawaNotes.F }}</div>
                </div>
              </div>
            </div>

          </div>
          <!-- END TAWA trophy hunting -->
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
