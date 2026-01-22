<template>
  <div class="upgrade-fee-container h-100">
    <div class="card border-0 shadow-sm rounded-3 h-100">
      <!-- Header -->
      <div class="card-header bg-white border-bottom py-2 px-3 d-flex justify-content-between align-items-center">
        <div>
          <h5 class="mb-0 fw-bold text-dark fs-5">
            <i class="fa fa-layer-group me-2 text-primary"></i>Add Upgrade Fee
          </h5>
        </div>
        <button class="btn btn-light btn-sm text-secondary" @click="cancel">
          <i class="fa fa-times"></i>
        </button>
      </div>

      <!-- Body -->
      <div class="card-body p-3">
        <form @submit.prevent="submit">

          <div class="row g-3">
            <!-- Left Column: Settings -->
            <div class="col-md-7 border-end-md">
              <div class="row g-3">
                <!-- Sales Packages -->
                <div class="col-12">
                  <label class="form-label fw-semibold small mb-1">Sales Package <small
                      class="text-muted">(Optional)</small></label>
                  <v-select v-model="form.sales_package_ids" class="style-chooser" :options="salesPackageOptions"
                    :reduce="(opt) => opt.id"
                    :get-option-label="(opt) => `${opt.name} (${opt.price_structure_detail_count})`" multiple
                    placeholder="Apply to specific packages..." />
                </div>

                <!-- Species -->
                <div class="col-md-6">
                  <label class="form-label fw-semibold small mb-1">Species <span class="text-danger">*</span></label>
                  <div class="input-group input-group-sm">
                    <span class="input-group-text bg-light border-end-0 text-muted"><i class="fa fa-paw"></i></span>
                    <v-select
                      v-model="form.species_id"
                      class="style-chooser flex-grow-1"
                      :options="speciesOptions"
                      :reduce="(opt) => opt.id"
                      :get-option-label="(opt) => opt.name"
                      :class="{ 'is-invalid': formError && !form.species_id }"
                      placeholder="Select species..."
                    />
                  </div>
                </div>

                <!-- Currency -->
                <div class="col-md-6">
                  <label class="form-label fw-semibold small mb-1">Currency <span class="text-danger">*</span></label>
                  <div class="input-group input-group-sm">
                    <span class="input-group-text bg-light border-end-0 text-muted"><i class="fa fa-coins"></i></span>
                    <select v-model="form.currency_id" class="form-control border-start-0 ps-0"
                      :class="{ 'is-invalid': formError && !form.currency_id }">
                      <option :value="null">Select currency...</option>
                      <option v-for="c in currencyOptions" :key="c.value" :value="c.value">
                        {{ c.text }}
                      </option>
                    </select>
                  </div>
                </div>

                <!-- Fee Amount -->
                <div class="col-md-6">
                  <label class="form-label fw-semibold small mb-1">Upgrade Fee Amount <span class="text-danger">*</span></label>
                  <div class="input-group input-group-sm">
                    <span class="input-group-text bg-light border-end-0 text-muted"><i class="fa fa-tag"></i></span>
                    <CurrencyInput
                      v-model="form.fee_amount"
                      class="form-control border-start-0 ps-0 text-end fw-bold text-primary"
                      :class="{ 'is-invalid': formError && (form.fee_amount === null || form.fee_amount === undefined) }"
                      :currency="selectedCurrencyCode"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <!-- Narration -->
                <div class="col-12">
                  <label class="form-label fw-semibold small mb-1">Narration <span class="text-danger">*</span></label>
                  <textarea v-model="form.notes" class="form-control form-control-sm"
                    :class="{ 'is-invalid': formError && !form.notes }" rows="2"
                    placeholder="Internal notes..."></textarea>
                </div>
              </div>
            </div>

            <!-- Right Column: Trophy Rules -->
            <div class="col-md-5 ps-md-4">
              <label class="form-label text-uppercase text-xs fw-bold text-muted mb-2">Trophy Fee Rules</label>

              <div class="trophy-card">
                <label class="form-label fw-semibold small mb-1">
                  <i class="fa fa-trophy text-muted me-1"></i>
                  Trophy Fee <span class="text-danger">*</span>
                </label>
                <v-select
                  v-model="form.trophy_fee_id"
                  class="style-chooser bg-white"
                  :options="filteredTrophyFeeOptions"
                  :reduce="(opt) => opt.id"
                  :get-option-label="(opt) => opt.label"
                  placeholder="Select trophy fee..."
                />

                <div class="d-flex align-items-center justify-content-between mt-3 trophy-toggle-row">
                  <div>
                    <div class="fw-bold fs-sm">Include Trophy Fee</div>
                    <div class="text-muted small-xs">
                      {{ trophyFeeRuleText }}
                    </div>
                  </div>
                  <div class="form-check form-switch m-0">
                    <input
                      id="trophy-fee-toggle"
                      v-model="trophyFeeToggle"
                      class="form-check-input"
                      type="checkbox"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Error Alert -->
          <div v-if="formError" class="alert alert-danger d-flex align-items-center py-2 mt-3 mb-0" role="alert">
            <i class="fa fa-exclamation-circle me-2"></i>
            <div class="small">{{ formError }}</div>
          </div>

          <!-- Footer Actions -->
          <div class="d-flex justify-content-end gap-2 pt-3 mt-3 border-top">
            <button type="button" class="btn btn-light btn-sm border" @click="cancel" :disabled="saving">
              Cancel
            </button>
            <button type="submit" class="btn btn-primary btn-sm px-4 fw-semibold" :disabled="saving || !canSave">
              <span v-if="saving" class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
              <span v-else><i class="fa fa-save me-1"></i></span>
              Save
            </button>
          </div>

        </form>
      </div>
    </div>
  </div>
</template> >


<script setup lang="ts">
import axios from 'axios'
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { usePriceStructuresStore } from '@/stores/bushman/price-structures-store'
import { useToast } from '@/composables/useToast'
import vSelect from 'vue-select'
import 'vue-select/dist/vue-select.css'
import CurrencyInput from '@/components/CurrencyInput.vue'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const store = usePriceStructuresStore()

const priceStructureId = Number(route.params.id)

const saving = ref(false)
const formError = ref('')

const speciesOptions = ref<any[]>([])
const currencyOptions = ref<any[]>([])
const salesPackageOptions = ref<any[]>([])
const trophyFeeOptions = ref<any[]>([])

const form = ref<any>({
  species_id: null,
  trigger_condition: '',
  fee_amount: 0,
  currency_id: null,
  sales_package_ids: [],
  notes: '',
  trophy_fee_mode: '',
  trophy_fee_id: null
})

const getSpeciesName = (speciesId: number | null) => {
  if (!speciesId) {
    return ''
  }
  const species = speciesOptions.value.find((item: any) => Number(item.id) === Number(speciesId))
  return (species?.name || '').trim().toLowerCase()
}

// Extract the core species keyword for matching (e.g., "buffalo" from "Buffalo African Cape")
const extractCoreSpeciesKeyword = (speciesName: string) => {
  const nameLower = speciesName.trim().toLowerCase()

  // For buffalo variants: "Buffalo African Cape", "Cape Buffalo", etc.
  if (nameLower.includes('buffalo') || nameLower.includes('bufalo')) {
    return 'buffalo'
  }
  // For elephant variants: "Elephant African", "African Elephant", etc.
  if (nameLower.includes('elephant') || nameLower.includes('elefant')) {
    return 'elephant'
  }

  // Return the full name for other species
  return nameLower
}

const normalizeSpeciesName = (name: string) => {
  // Normalize species name for better matching
  const normalized = name.trim().toLowerCase()
  // Handle plural forms
  if (normalized.endsWith('s')) {
    return normalized.slice(0, -1)
  }
  return normalized
}

const matchesSpecies = (fee: any, speciesId: number | null) => {
  if (!speciesId) {
    return true
  }

  const speciesName = getSpeciesName(speciesId)
  const coreKeyword = extractCoreSpeciesKeyword(speciesName)

  // Priority species that ONLY use name matching (buffalo, elephant) - NO ID matching
  const nameOnlyMatchSpecies = ['buffalo', 'elephant']
  const isNameOnlySpecies = nameOnlyMatchSpecies.includes(coreKeyword)

  if (isNameOnlySpecies) {
    // For buffalo and elephant, ONLY use partial name matching (ignore species_id completely)
    const feeSpeciesName = (fee?.species_name || fee?.species?.name || '').trim().toLowerCase()
    const feeName = (fee?.name || fee?.label || '').trim().toLowerCase()

    /*
    console.log(`[Name-only matching] Checking "${fee.name}" for species "${speciesName}" (core: "${coreKeyword}"):`, {
      feeSpeciesName,
      feeName,
      coreKeyword,
      speciesNameContains: feeSpeciesName && feeSpeciesName.includes(coreKeyword),
      feeNameContains: feeName && feeName.includes(coreKeyword)
    })
    */

    // Check if species_name contains the core keyword (handles "1st buffalo", "buffalo", etc.)
    if (feeSpeciesName && feeSpeciesName.includes(coreKeyword)) {
      // console.log(`✓ Matched by species_name containing "${coreKeyword}": ${fee.name}`)
      return true
    }
    // Check if fee name/label contains the core keyword
    if (feeName && feeName.includes(coreKeyword)) {
      // console.log(`✓ Matched by fee name containing "${coreKeyword}": ${fee.name}`)
      return true
    }

    // No match for buffalo/elephant - return false (don't fall through to ID matching)
    // console.log(`✗ No name match for "${fee.name}" with species "${speciesName}" (core: "${coreKeyword}")`)
    return false
  }

  const feeSpeciesNamePartial = (fee?.species_name || fee?.species?.name || '').trim().toLowerCase()
  const feeNamePartial = (fee?.name || fee?.label || '').trim().toLowerCase()
  if (feeSpeciesNamePartial && feeSpeciesNamePartial.includes(coreKeyword)) {
    return true
  }
  if (feeNamePartial && feeNamePartial.includes(coreKeyword)) {
    return true
  }

  // For all other species, use species_id matching first
  const feeSpeciesId = fee?.species_id ?? fee?.species?.id ?? fee?.speciesId ?? null
  if (feeSpeciesId && Number(feeSpeciesId) === Number(speciesId)) {
    // console.log(`✓ Matched by species_id: ${fee.name}`)
    return true
  }

  // Fallback to name matching for other species (strict)
  if (!speciesName) {
    return false
  }
  const normalizedSpeciesName = normalizeSpeciesName(speciesName)
  const feeSpeciesName = (fee?.species_name || fee?.species?.name || '').trim().toLowerCase()
  if (feeSpeciesName) {
    const normalizedFeeName = normalizeSpeciesName(feeSpeciesName)
    if (normalizedFeeName === normalizedSpeciesName) {
      return true
    }
    if (feeSpeciesName.includes(coreKeyword)) {
      return true
    }
  }
  const feeName = (fee?.name || '').trim().toLowerCase()
  if (feeName) {
    // Whole-word match to avoid accidental partial matches
    const escaped = normalizedSpeciesName.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')
    const re = new RegExp(`\\b${escaped}\\b`)
    if (re.test(feeName)) {
      return true
    }
    if (feeName.includes(coreKeyword)) {
      return true
    }
  }
  return false
}

const filteredTrophyFeeOptions = computed(() => {
  const speciesId = form.value.species_id
  if (!speciesId) {
    return trophyFeeOptions.value
  }

  const filtered = trophyFeeOptions.value.filter((fee: any) => matchesSpecies(fee, speciesId))

  const selectedSpeciesName = getSpeciesName(speciesId)
  console.log(`Filtering trophy fees for species ID ${speciesId} (${selectedSpeciesName}):`, {
    totalFees: trophyFeeOptions.value.length,
    filteredFees: filtered.length,
    filtered: filtered.map(f => ({ id: f.id, name: f.name, species_id: f.species_id, species_name: f.species_name }))
  })

  return filtered.length > 0 ? filtered : trophyFeeOptions.value
})

const canSave = computed(() => {
  const f = form.value
  const baseValid = !!f.species_id && !!f.trophy_fee_mode &&
    f.fee_amount !== null && f.fee_amount !== undefined &&
    !isNaN(Number(f.fee_amount)) && Number(f.fee_amount) >= 0 &&
    !!f.currency_id && !!f.notes
  const trophyFeeValid = !!f.trophy_fee_id
  return baseValid && trophyFeeValid
})

const isTrophyInclusive = computed(() => form.value.trophy_fee_mode === 'inclusive')
const isTrophyExclusive = computed(() => form.value.trophy_fee_mode === 'exclusive')
const trophyFeeToggle = computed({
  get: () => isTrophyInclusive.value,
  set: (value: boolean) => {
    setTrophyFeeMode(value ? 'inclusive' : 'exclusive')
  }
})
const selectedTrophyFee = computed(() => {
  return trophyFeeOptions.value.find((fee: any) => Number(fee.id) === Number(form.value.trophy_fee_id)) || null
})
const trophyFeeAmountText = computed(() => {
  const fee = selectedTrophyFee.value
  if (!fee) return ''
  return fee.amount_display || fee.formatted_amount || fee.amount || ''
})
const trophyFeeRuleText = computed(() => {
  const amountText = trophyFeeAmountText.value ? `Trophy fee of ${trophyFeeAmountText.value}` : 'Trophy fee'
  return isTrophyInclusive.value ? `${amountText} included.` : `${amountText} excluded.`
})
const mapTrophyFees = (fees: any[]) => {
  return fees.map((fee: any) => {
    const extractedSpeciesId = fee.species_id || fee.species?.id || fee.speciesId || fee.item?.species?.id || null
    const extractedSpeciesName = fee.species_name || fee.species?.name || fee.speciesName || fee.item?.species?.name || null
    const feeName = fee.name || fee.fee_name || fee.item_name || fee.item?.name || fee.trophy_fee_item?.name || null
    const amountDisplay = fee.formatted_amount || fee.amount || ''

    let inferredSpeciesName = extractedSpeciesName
    if (!inferredSpeciesName && feeName) {
      const nameLower = feeName.toLowerCase()
      if (nameLower.includes('buffalo') || nameLower.includes('bufalo')) {
        inferredSpeciesName = 'Buffalo'
      } else if (nameLower.includes('elephant') || nameLower.includes('elefant')) {
        inferredSpeciesName = 'Elephant'
      }
    }

    return {
      id: fee.id,
      species_id: extractedSpeciesId,
      species_name: inferredSpeciesName,
      name: feeName,
      amount_display: amountDisplay,
      label: feeName ? `${feeName} (${amountDisplay})` : (amountDisplay || String(fee.id))
    }
  })
}

const normalizeList = (value: any) => {
  if (Array.isArray(value)) return value
  if (Array.isArray(value?.data)) return value.data
  return []
}
const selectedCurrencyCode = computed(() => {
  const selected = currencyOptions.value.find((c: any) => Number(c.value) === Number(form.value.currency_id))
  const code = selected?.code
  return typeof code === 'string' && /^[A-Z]{3}$/.test(code) ? code : 'USD'
})

const syncTrophyFeeForSpecies = (speciesId: number | null) => {
  if (!speciesId) {
    form.value.trophy_fee_id = null
    return
  }
  const matches = trophyFeeOptions.value.filter((fee: any) => matchesSpecies(fee, speciesId))
  if (matches.length === 0) {
    return
  }
  if (matches.length === 1) {
    form.value.trophy_fee_id = matches[0].id
    return
  }
  if (!matches.some((fee: any) => Number(fee.id) === Number(form.value.trophy_fee_id))) {
    form.value.trophy_fee_id = null
  }
}

onMounted(async () => {
  try {
    const metadataUrl = `${import.meta.env.VITE_APP_BASE_URL}settings/upgrade-fees/creation-metadata`
    const metadataResp = await axios.get(metadataUrl, { params: { price_structure_id: priceStructureId } })
    const metadata = metadataResp?.data?.data || {}

    // Species - now simplified with only id and name
    const speciesList = Array.isArray(metadata.species) ? metadata.species : []
    speciesOptions.value = speciesList.map((item: any) => ({ id: item.id, name: item.name }))

    // Sales Packages - new field
    const packagesList = Array.isArray(metadata.sales_packages) ? metadata.sales_packages : []
    salesPackageOptions.value = packagesList.map((item: any) => {
      const directDetails = Array.isArray(item.price_structure_details)
        ? item.price_structure_details
        : Array.isArray(item.price_structure_details?.data)
          ? item.price_structure_details.data
          : []
      const detailIds = [
        ...(Array.isArray(item.price_structure_detail_ids) ? item.price_structure_detail_ids : []),
        ...directDetails.map((detail: any) => detail?.id).filter((id: any) => id),
      ]
      return {
        id: item.id,
        name: item.name || item.description || `Package ${item.id}`,
        price_structure_detail_count: item.price_structure_detail_count || detailIds.length || 0,
        price_structure_detail_ids: Array.from(new Set(detailIds))
      }
    })

    // Currencies
    const currencyList = Array.isArray(metadata.currencies) ? metadata.currencies : []
    currencyOptions.value = currencyList.map((item: any) => {
      const labelParts = []
      if (item.code) labelParts.push(item.code)
      if (item.name) labelParts.push(item.name)
      const text = labelParts.length > 0 ? labelParts.join(' - ') : (item.symbol || String(item.id))
      const code = typeof item.code === 'string' && /^[A-Z]{3}$/.test(item.code) ? item.code : null
      return { value: item.id, text, code }
    })

    // Prefill default currency (id = 1), fallback to first
    const defaultCurrency = currencyOptions.value.find((c: any) => Number(c.value) === 1)
    form.value.currency_id = defaultCurrency?.value ?? currencyOptions.value?.[0]?.value ?? null

    const structureResp = await store.get(priceStructureId)
    const structure = structureResp?.data?.data || structureResp?.data || store.current || null
    const trophies = normalizeList(structure?.trophy_fees)
    const fallbackTrophies = normalizeList(metadata?.trophy_fees)
    let trophySource = trophies.length > 0 ? trophies : fallbackTrophies

    if (trophySource.length === 0) {
      const locationId = structure?.location_id || structure?.location?.id || structure?.area?.location_id || structure?.area?.location?.id || null
      if (locationId) {
        try {
          const trophyFeesUrl = import.meta.env.VITE_APP_BASE_URL + 'settings/trophy-fees/pricing'
          const trophyFeesResponse = await axios.get(trophyFeesUrl, { params: { location_id: locationId } })
          trophySource = normalizeList(trophyFeesResponse.data)
        } catch (err) {
          console.warn('Failed to load trophy fees from pricing endpoint:', err)
        }
      }
    }

    trophyFeeOptions.value = mapTrophyFees(Array.isArray(trophySource) ? trophySource : [])

    console.log('Trophy fees loaded:', trophyFeeOptions.value)
    console.log('Species options:', speciesOptions.value)

    syncTrophyFeeForSpecies(form.value.species_id)

  } catch (err) {
    console.error('Error loading upgrade fee form data:', err)
    toast.init({ message: 'Failed to load form data', color: 'danger' })
  }
})

// React to species selection changes and to changes in the available trophy fees
watch(() => form.value.species_id, (speciesId) => {
  // Keep trophy_fee_id in sync whenever species selection changes
  syncTrophyFeeForSpecies(speciesId)
}, { immediate: true })

// Also watch the filtered list so when trophy fees are loaded/changed we auto-select if only one match
watch(() => filteredTrophyFeeOptions.value, (list) => {
  if (!form.value.species_id) return
  syncTrophyFeeForSpecies(form.value.species_id)
}, { immediate: true })

const setTrophyFeeMode = (mode: 'inclusive' | 'exclusive') => {
  if (form.value.trophy_fee_mode !== mode) {
    form.value.trophy_fee_mode = mode
  }
  const amountText = trophyFeeAmountText.value ? `Trophy fee of ${trophyFeeAmountText.value}` : 'Trophy fee'
  form.value.trigger_condition = mode === 'inclusive'
    ? `${amountText} included`
    : `${amountText} excluded`
}

const cancel = () => {
  router.push({ name: 'sales-price-list', query: { structureId: String(priceStructureId), view: 'upgrade-fees' } })
}

const selectedDetailIds = computed(() => {
  const selectedIds = new Set(form.value.sales_package_ids || [])
  const detailIds: number[] = []
    ; (salesPackageOptions.value || []).forEach((pkg: any) => {
      if (selectedIds.has(pkg.id) && Array.isArray(pkg.price_structure_detail_ids)) {
        detailIds.push(...pkg.price_structure_detail_ids)
      }
    })
  return Array.from(new Set(detailIds))
})

const submit = async () => {
  formError.value = ''
  if (!canSave.value) {
    if (!form.value.trophy_fee_id) {
      formError.value = 'Please select the trophy fee'
    } else if (!form.value.notes) {
      formError.value = 'Please add notes'
    } else {
      formError.value = 'Please fill required fields (Species, Trophy Fee Rule, Fee Amount, Currency, Notes)'
    }
    toast.init({ message: formError.value, color: 'warning' })
    return
  }

  const packageIds = Array.isArray(form.value.sales_package_ids) ? form.value.sales_package_ids : []
  if (packageIds.length > 0 && selectedDetailIds.value.length === 0) {
    formError.value = 'Selected packages do not have price structure details'
    toast.init({ message: formError.value, color: 'warning' })
    return
  }

  saving.value = true

  const payload: any = {
    species_id: form.value.species_id,
    trigger_condition: form.value.trigger_condition,
    fee_amount: Number(form.value.fee_amount),
    currency_id: form.value.currency_id,
    notes: form.value.notes || '',
    price_structure_id: priceStructureId,

  }
  if (form.value.trophy_fee_mode) {
    payload.trophy_fee_inclusive = form.value.trophy_fee_mode === 'inclusive'
  }
  if (form.value.trophy_fee_id) {
    payload.trophy_fee_id = form.value.trophy_fee_id
  }
  if (selectedDetailIds.value.length > 0) {
    payload.price_structure_detail_ids = selectedDetailIds.value
  }

  try {
    const token = localStorage.getItem('token')
    const url = import.meta.env.VITE_APP_BASE_URL + `settings/upgrade-fees`
    const response = await axios.post(url, payload, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
      }
    })

    // Handle bulk creation response
    const result = response.data
    const data = Array.isArray(result?.data) ? result.data : Array.isArray(result) ? result : []
    const count = result?.count || (data.length > 0 ? data.length : 1)
    toast.init({
      message: `${count} upgrade fee${count > 1 ? 's' : ''} created successfully`,
      color: 'success'
    })

    router.push({ name: 'sales-price-list', query: { structureId: String(priceStructureId), view: 'upgrade-fees' } })
  } catch (err: any) {
    console.error('Failed to create upgrade fee:', err)
    formError.value = err?.response?.data?.message || err?.message || 'Failed to create upgrade fee'
    toast.init({ message: formError.value, color: 'danger' })
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
/* Container & General */
.upgrade-fee-container {
  /* Removed max-width for full width */
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  height: 100%;
}

.text-xs {
  font-size: 0.7rem;
  letter-spacing: 0.5px;
}

.fs-xs {
  font-size: 0.75rem;
}

.fs-sm {
  font-size: 0.85rem;
}

.small-xs {
  font-size: 0.7rem;
}

/* Trophy Option Cards (Compact) */
.trophy-option-compact {
  cursor: pointer;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 0.75rem 1rem;
  background-color: #fff;
  transition: all 0.2s ease;
}

.trophy-option-compact:hover {
  background-color: #f8f9fa;
  border-color: #dee2e6;
}

.trophy-option-compact.selected {
  border-color: #3b82f6;
  background-color: #eff6ff;
  box-shadow: 0 2px 4px rgba(59, 130, 246, 0.1);
}

.icon-circle-sm {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
}

.trophy-toggle-card {
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 0.75rem 1rem;
  background-color: #fff;
}

.trophy-card {
  border: 1px solid #e9ecef;
  border-radius: 10px;
  padding: 0.9rem;
  background: #fbfdff;
  box-shadow: 0 2px 6px rgba(15, 23, 42, 0.04);
}

.trophy-toggle-row {
  border-top: 1px dashed #e5e7eb;
  padding-top: 0.6rem;
}

/* Fallback colors */
.bg-success-subtle {
  background-color: #d1e7dd;
}

.text-success {
  color: #198754;
}

.bg-warning-subtle {
  background-color: #fff3cd;
}

.text-warning {
  color: #ffc107;
}

/* V-Select Compact Overrides */
.style-chooser :deep(.vs__dropdown-toggle) {
  border: 1px solid #ced4da;
  border-radius: 0.25rem;
  /* smaller radius */
  padding: 0.15rem 0.25rem;
  background: #fff;
}

.style-chooser :deep(.vs__search::placeholder) {
  color: #6c757d;
  font-size: 0.85rem;
}

.style-chooser :deep(.vs__selected) {
  font-size: 0.85rem;
  margin: 2px;
}

/* Input Group Polishing */
.input-group-text {
  border-color: #ced4da;
  background-color: #f8f9fa;
  padding: 0.25rem 0.5rem;
  /* Compact padding */
  font-size: 0.875rem;
}

.form-control,
.form-select {
  padding: 0.35rem 0.5rem;
  /* Compact inputs */
  font-size: 0.875rem;
}

.form-control:focus,
.form-select:focus {
  border-color: #86b7fe;
  box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.25);
  z-index: 2;
}

/* Animations */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(5px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in {
  animation: fadeIn 0.3s ease-out;
}

/* Responsive adjustments */
@media (min-width: 768px) {
  .border-end-md {
    border-right: 1px solid #e9ecef;
  }
}
</style>
