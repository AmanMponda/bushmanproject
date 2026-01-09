<template>
  <div class="documents-page">
    <div class="d-flex align-items-center mb-3">
      <div>
        <ul class="breadcrumb">
          <li class="breadcrumb-item"><a href="#">Module Settings</a></li>
          <li class="breadcrumb-item active">Documents</li>
        </ul>
      </div>
    </div>

    <template v-if="showList">
      <div class="row layout-top-spacing bg-white rounded">
        <div class="col-xl-12 col-lg-12 col-sm-12 layout-spacing">
          <div class="panel br-6 p-0">
            <div class="custom-table p-3">
              <StandardDataTable
                :columns="columns"
                :data="items"
                :loading="loading"
                :disable-search="false"
                :disable-pagination="false"
                :action-buttons="pageActions"
              >
                <template #id="{ row }">
                  <span class="text-muted">#{{ row.id }}</span>
                </template>
                <template #name="{ row }">
                  <div class="fw-semibold">{{ row.name || 'N/A' }}</div>
                  <div v-if="row.description" class="text-muted small">{{ row.description }}</div>
                </template>
                <template #mime_type="{ row }">
                  <span class="badge bg-secondary">{{ row.mime_type || 'N/A' }}</span>
                </template>
                <template #file_size="{ row }">
                  <span class="text-muted">{{ formatFileSize(row.file_size) }}</span>
                </template>
                <template #actions="{ row }">
                  <div class="d-flex gap-1">
                    <button class="btn btn-outline-primary btn-sm" title="Download" @click="downloadDocument(row)">
                      <i class="fa fa-download"></i>
                    </button>
                    <button class="btn btn-outline-secondary btn-sm" title="Edit" @click="openEditForm(row)">
                      <i class="fa fa-edit"></i>
                    </button>
                    <button class="btn btn-danger btn-sm" title="Delete" @click="confirmDelete(row)" :disabled="deletingId === row.id">
                      <span v-if="deletingId === row.id" class="spinner-border spinner-border-sm"></span>
                      <i v-else class="fa fa-trash"></i>
                    </button>
                  </div>
                </template>
              </StandardDataTable>
            </div>
          </div>
        </div>
      </div>
    </template>

    <template v-else>
      <div class="card">
        <div class="card-header bg-white d-flex align-items-center justify-content-between">
          <h5 class="mb-0">{{ form.id ? 'Edit Document' : 'Add Document' }}</h5>
          <button class="btn btn-outline-secondary btn-sm" @click="closeForm">Back</button>
        </div>
        <div class="card-body">
          <form @submit.prevent="submitForm" class="row g-3">
            <div class="col-md-6">
              <label class="form-label">Name <span class="text-danger">*</span></label>
              <input v-model="form.name" type="text" class="form-control" required />
            </div>
            <div class="col-md-6">
              <label class="form-label">Code <span class="text-danger">*</span></label>
              <input v-model="form.code" type="text" class="form-control" required />
            </div>
            <div class="col-12">
              <label class="form-label">Description</label>
              <textarea v-model="form.description" class="form-control" rows="2"></textarea>
            </div>
            <div class="col-12">
              <label class="form-label">{{ form.id ? 'Replace File (optional)' : 'File *' }}</label>
              <input type="file" class="form-control" @change="onFileChange" :required="!form.id" />
              <div v-if="selectedFileName" class="text-muted small mt-1">Selected: {{ selectedFileName }}</div>
            </div>
            <div class="col-12 d-flex gap-2">
              <button type="submit" class="btn btn-primary" :disabled="saving">
                <span v-if="saving" class="spinner-border spinner-border-sm me-1"></span>
                {{ form.id ? 'Update' : 'Save' }}
              </button>
              <button type="button" class="btn btn-secondary" @click="closeForm">Cancel</button>
            </div>
          </form>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
// @ts-nocheck - StandardDataTable component doesn't provide TypeScript types for row parameter
import { ref, reactive, computed, onMounted } from 'vue'
import Swal from 'sweetalert2'
import StandardDataTable from '@/components/bootstrap/StandardDataTable.vue'
import { useDocumentsStore } from '@/stores/bushman/documents-store'
import { useToast } from '@/composables/useToast'
import handleErrors from '@/stores/bushman/errorHandler'

const documentsStore = useDocumentsStore()
const toast = useToast()

const loading = ref(false)
const saving = ref(false)
const showList = ref(true)
const deletingId = ref<number | string | null>(null)
const items = ref<any[]>([])
const selectedFile = ref<File | null>(null)

const form = reactive({
  id: null as number | string | null,
  name: '',
  code: '',
  description: '',
})

const columns = [
  { key: 'id', label: 'ID', sortable: true, visible: true },
  { key: 'name', label: 'Name', sortable: true, visible: true },
  { key: 'code', label: 'Code', sortable: true, visible: true },
  { key: 'mime_type', label: 'Type', sortable: true, visible: true },
  { key: 'file_size', label: 'Size', sortable: true, visible: true },
  { key: 'actions', label: 'Actions', sortable: false, visible: true },
]

const pageActions = computed(() => [
  {
    label: 'Add Document',
    icon: 'fa fa-plus',
    class: 'btn btn-primary',
    method: () => openCreateForm(),
  },
])

const selectedFileName = computed(() => selectedFile.value?.name || '')

function normalizeDocument(item: any) {
  return {
    id: item.id ?? item.document_id ?? item.pk,
    name: item.name ?? item.title ?? 'N/A',
    code: item.code ?? item.document_code ?? '',
    description: item.description ?? '',
    mime_type: item.mime_type ?? item.content_type ?? item.file_type ?? '',
    file_size: item.file_size ?? item.size ?? item.file_length ?? null,
  }
}

function formatFileSize(bytes: number | null) {
  if (!bytes && bytes !== 0) return 'N/A'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

async function fetchDocuments() {
  loading.value = true
  try {
    const response = await documentsStore.listDocuments()
    const list = Array.isArray(response.data)
      ? response.data
      : Array.isArray(response.data?.data)
        ? response.data.data
        : response.data?.results || []
    items.value = list.map(normalizeDocument)
  } catch (error) {
    toast.init({ message: 'Failed to load documents', color: 'danger' })
  } finally {
    loading.value = false
  }
}

function openCreateForm() {
  form.id = null
  form.name = ''
  form.code = ''
  form.description = ''
  selectedFile.value = null
  showList.value = false
}

function openEditForm(row: any) {
  form.id = row.id
  form.name = row.name || ''
  form.code = row.code || ''
  form.description = row.description || ''
  selectedFile.value = null
  showList.value = false
}

function closeForm() {
  showList.value = true
}

function onFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  selectedFile.value = input?.files?.[0] || null
}

async function submitForm() {
  if (!form.name || !form.code) {
    toast.init({ message: 'Name and code are required', color: 'warning' })
    return
  }

  if (!form.id && !selectedFile.value) {
    toast.init({ message: 'File is required for new documents', color: 'warning' })
    return
  }

  saving.value = true
  try {
    if (form.id) {
      const response = await documentsStore.updateDocument(form.id, {
        name: form.name.trim(),
        code: form.code.trim(),
        description: form.description?.trim() || '',
        file: selectedFile.value,
      })
      if (response.status === 200) {
        toast.init({ message: 'Document updated successfully', color: 'success' })
      }
    } else {
      const response = await documentsStore.createDocument({
        name: form.name.trim(),
        code: form.code.trim(),
        description: form.description?.trim() || '',
        file: selectedFile.value || undefined,
      })
      if (response.status === 201 || response.status === 200) {
        toast.init({ message: 'Document created successfully', color: 'success' })
      }
    }
    await fetchDocuments()
    closeForm()
  } catch (error: any) {
    const errors = handleErrors(error)
    toast.init({ message: errors.join('\n') || 'Failed to save document', color: 'danger' })
  } finally {
    saving.value = false
  }
}

async function confirmDelete(row: any) {
  const result = await Swal.fire({
    title: 'Delete document',
    text: `Delete "${row.name || row.code || row.id}"? This cannot be undone.`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Delete',
    cancelButtonText: 'Cancel',
    customClass: { confirmButton: 'btn btn-danger', cancelButton: 'btn btn-secondary' },
    buttonsStyling: false,
  })

  if (!result.isConfirmed) return

  deletingId.value = row.id
  try {
    const response = await documentsStore.deleteDocument(row.id)
    if (response.status === 204 || response.status === 200) {
      toast.init({ message: 'Document deleted', color: 'success' })
      items.value = items.value.filter((item: any) => item.id !== row.id)
    }
  } catch (error: any) {
    const errors = handleErrors(error)
    toast.init({ message: errors.join('\n') || 'Failed to delete document', color: 'danger' })
  } finally {
    deletingId.value = null
  }
}

function getFilenameFromHeader(headerValue: string | undefined, fallback: string) {
  if (!headerValue) return fallback
  const match = headerValue.match(/filename="?([^"]+)"?/)
  return match?.[1] || fallback
}

async function downloadDocument(row: any) {
  try {
    const response = await documentsStore.downloadDocument(row.id)
    const blob = new Blob([response.data], { type: row.mime_type || response.headers['content-type'] })
    const url = window.URL.createObjectURL(blob)
    const fallbackName = row.name ? `${row.name}` : `document-${row.id}`
    const filename = getFilenameFromHeader(response.headers['content-disposition'], fallbackName)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', filename)
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
  } catch (error) {
    toast.init({ message: 'Failed to download document', color: 'danger' })
  }
}

onMounted(() => {
  fetchDocuments()
})
</script>

<style lang="scss" scoped>
.documents-page {
  padding: 0;
}

.breadcrumb {
  text-transform: uppercase !important;
  font-weight: 600;
  font-size: 0.875rem;
  margin-bottom: 0 !important;
  padding: 0.5rem 0.75rem;
  background: transparent;

  .breadcrumb-item {
    text-transform: uppercase !important;

    &::before {
      content: ' / ' !important;
      color: #9ca3af !important;
      padding: 0 0.5rem;
    }

    &:first-child::before {
      display: none !important;
    }

    a {
      text-transform: uppercase !important;
      color: #374151 !important;
      font-weight: 600;
      text-decoration: none !important;

      &:hover {
        color: #1f2937 !important;
        text-decoration: none !important;
      }
    }

    &.active {
      color: #9ca3af !important;
      font-weight: 400;
      text-transform: uppercase !important;
    }
  }
}
</style>
