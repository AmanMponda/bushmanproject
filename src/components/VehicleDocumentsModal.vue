<template>
  <div v-if="visible" class="modal-overlay">
    <div class="modal-dialog modal-lg" @click.stop>
      <div class="card">
        <div class="card-header d-flex justify-content-between align-items-center">
          <h5 class="mb-0">Upload Document</h5>
          <button class="btn btn-light btn-sm" @click="close"><i class="fa fa-times"></i></button>
        </div>
        <div class="card-body">
          <form @submit.prevent="submit">
            <div class="row g-3">
              <div class="col-md-6">
                <label class="form-label">Document Name</label>
                <input v-model="name" type="text" class="form-control" required />
              </div>
              <div class="col-md-6">
                <label class="form-label">Expiring Mode</label>
                <select v-model="expiringMode" class="form-select">
                  <option value="NEVER">NEVER</option>
                  <option value="DATE_RANGE">DATE_RANGE</option>
                </select>
              </div>

              <div v-if="expiringMode === 'DATE_RANGE'" class="col-md-6">
                <label class="form-label">Start Date</label>
                <input v-model="startDate" type="date" class="form-control" />
              </div>
              <div v-if="expiringMode === 'DATE_RANGE'" class="col-md-6">
                <label class="form-label">End Date</label>
                <input v-model="endDate" type="date" class="form-control" />
              </div>

              <div class="col-12">
                <label class="form-label">File</label>
                <input type="file" class="form-control" @click.stop @change="onFileChange" required />
              </div>

              <div class="col-12 text-end">
                <button type="button" class="btn btn-secondary me-2" @click="close">Cancel</button>
                <button type="submit" class="btn btn-primary" :disabled="uploading">
                  <i class="fa fa-upload me-1"></i>
                  <span v-if="uploading">Uploading...</span>
                  <span v-else>Upload</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useDocumentsStore } from '@/stores/bushman/documents-store'
const props = defineProps<{ visible: boolean; vehicleId: number | string | null }>()
const emit = defineEmits<{
  (e: 'close'): void
  (e: 'uploaded'): void
}>()

const name = ref('')
const expiringMode = ref<'NEVER' | 'DATE_RANGE'>('NEVER')
const startDate = ref('')
const endDate = ref('')
const file = ref<File | null>(null)
const uploading = ref(false)

const documentsStore = useDocumentsStore()

import { onMounted, onBeforeUnmount } from 'vue'

onMounted(() => console.debug('[VehicleDocumentsModal] mounted visible=', props.visible))
onBeforeUnmount(() => console.debug('[VehicleDocumentsModal] unmounted'))

function onFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  file.value = input.files?.[0] ?? null
}

async function submit() {
  if (!props.vehicleId) return alert('Vehicle not selected')
  if (!name.value || !file.value) return alert('Please provide name and file')

  uploading.value = true
  try {
    // Use the existing API; include expiring fields if provided
    const payload: any = {
      name: name.value,
      code: `vehicle-${props.vehicleId}`,
      file: file.value
    }
    if (expiringMode.value) payload.expiring_mode = expiringMode.value
    if (startDate.value) payload.expiring_start = startDate.value
    if (endDate.value) payload.expiring_end = endDate.value

    await documentsStore.createDocument(payload)
    emit('uploaded')
    close()
  } catch (err) {
    console.error('Upload failed', err)
    alert('Upload failed')
  } finally {
    uploading.value = false
  }
}

function close() { console.debug('[VehicleDocumentsModal] close() called'); emit('close') }

function onOverlayClick(e: Event) {
  // Debug: log what was clicked when overlay self-click triggers
  console.debug('[VehicleDocumentsModal] overlay clicked, target:', (e as any).target)
  close()
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  z-index: 1050;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}
.modal-dialog { width: 720px; max-width: 100%; z-index: 1060; pointer-events: auto; }
</style>