<template>
  <div class="modal fade" :class="{ show: showModal, 'd-block': showModal }" tabindex="-1" v-if="showModal">
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">
            {{ node.id ? 'Edit Location' : 'Add Location' }}
            <span v-if="node.parent_name" class="text-muted small">
              (under {{ node.parent_name }})
            </span>
          </h5>
          <button type="button" class="btn-close" @click="$emit('close')"></button>
        </div>                
        <div class="modal-body">
          <form @submit.prevent="$emit('save', node)">
            <div class="mb-3">
              <label class="form-label">Name *</label>
              <input 
                v-model="node.name" 
                type="text" 
                class="form-control" 
                required 
                placeholder="Enter location name"
              />
            </div>
            
            <div class="mb-3">
              <label class="form-label">Type *</label>
              <select v-model="node.type" class="form-select" required>
                <option value="">Select type...</option>
                <option v-for="type in locationTypes" :key="type.value" :value="type.value">
                  {{ type.label }}
                </option>
              </select>
              <small class="form-text text-muted">
                {{ typeDescription }}
              </small>
            </div>
            
            <div class="mb-3">
              <label class="form-label">Code (Optional)</label>
              <input 
                v-model="node.code" 
                type="text" 
                class="form-control" 
                placeholder="Unique code"
              />
            </div>            
            <!-- <div class="mb-3">
              <label class="form-label">Operation Type</label>
              <select v-model="node.operation_type" class="form-select">
                <option value="PHYSICAL_LOCATION">Physical Location</option>
                <option value="LOGICAL_ZONE">Logical Zone</option>
                <option value="VIRTUAL">Virtual</option>
              </select>
            </div> -->            
            <div class="alert alert-info small">
              <i class="fa fa-info-circle me-2"></i>
              This location will be created under: 
              <strong>{{ node.parent_name || 'Root (Country Level)' }}</strong>
            </div>
          </form>
        </div>
        
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" @click="$emit('close')">
            Cancel
          </button>
          <button type="button" class="btn btn-primary" @click="$emit('save', node)">
            {{ node.id ? 'Update' : 'Create' }}
          </button>
        </div>
      </div>
     </div>
   </div>  
  <div class="modal-backdrop fade show" v-if="showModal"></div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  node: Object,
  showModal: Boolean
})

defineEmits(['save', 'close'])

const locationTypes = [
  { value: 'COUNTRY', label: 'Country' },
  { value: 'REGION', label: 'Region/Province' },
  { value: 'DISTRICT', label: 'District' },
  { value: 'CITY', label: 'City' },
  { value: 'TOWN', label: 'Town' },
  { value: 'WARD', label: 'Ward' },
  { value: 'BRANCH', label: 'Branch' },
  { value: 'OFFICE', label: 'Office' },
  { value: 'STATION', label: 'Station' },
  { value: 'WAREHOUSE', label: 'Warehouse' },
  { value: 'ZONE', label: 'Zone' },
  { value: 'SERVICE_POINT', label: 'Service Point' },
  { value: 'STOP', label: 'Stop' }
]

const typeDescription = computed(() => {
  const descriptions = {
    COUNTRY: 'Highest level - e.g., Tanzania, Kenya',
    REGION: 'Regional/Provincial level',
    CITY: 'Major urban area',
    BRANCH: 'Business branch location',
    OFFICE: 'Office building',
    STOP: 'Transport stop point'
  }
  return descriptions[props.node.type] || ''
})
</script>

<style scoped>
.modal {
  background-color: rgba(0, 0, 0, 0.5);
}
</style>