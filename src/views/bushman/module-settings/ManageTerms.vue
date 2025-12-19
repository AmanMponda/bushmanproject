<template>
  <VaCard class="manage-terms-page">
    <VaCardContent>
      <!-- Header Section -->
      <div class="flex flex-col md:flex-row gap-2 mb-4 justify-between items-center">
        <h2 class="text-xl font-bold text-gray-700">
          <VaIcon name="description" class="mr-2" />
          Terms & Conditions
        </h2>
      </div>

      <VaDivider />

      <!-- Tabs -->
      <VaTabs v-model="activeTab" class="mt-4">
        <template #tabs>
          <VaTab name="terms">Terms</VaTab>
          <VaTab name="term-types">Term Types</VaTab>
        </template>
      </VaTabs>

      <!-- Terms Tab Content -->
      <div v-if="activeTab === 'terms'" class="mt-4">
        <div class="flex flex-col md:flex-row gap-2 mb-4 justify-between items-center">
          <VaSelect
            v-model="selectedTermType"
            :options="termTypeOptions"
            label="Filter by Term Type"
            placeholder="All Term Types"
            clearable
            class="max-w-xs"
            @update:modelValue="fetchTerms"
          />
          <VaButton color="primary" icon="add" round @click="openAddTermModal"> Add New Term </VaButton>
        </div>

        <VaInnerLoading :loading="loadingTerms">
          <div v-if="terms.length === 0 && !loadingTerms" class="text-center py-12">
            <VaIcon name="description" size="4rem" color="#9B9FB5" />
            <p class="text-gray-500 mt-4">No terms found.</p>
            <VaButton class="mt-4" preset="secondary" @click="openAddTermModal">Add your first term</VaButton>
          </div>

          <VaDataTable v-else :items="terms" :columns="termColumns" hoverable striped>
            <template #cell(term_type)="{ rowData }">
              <VaBadge :text="rowData.term_type?.name || 'N/A'" color="info" />
            </template>

            <template #cell(title)="{ rowData }">
              <span class="font-semibold">{{ rowData.title || 'No Title' }}</span>
            </template>

            <template #cell(content)="{ rowData }">
              <span class="text-sm text-gray-600 line-clamp-2">{{ truncateContent(rowData.content) }}</span>
            </template>

            <template #cell(order_position)="{ rowData }">
              <VaBadge :text="String(rowData.order_position || 0)" color="secondary" />
            </template>

            <template #cell(created_at)="{ rowData }">
              <span class="text-sm text-gray-600">{{ formatDate(rowData.created_at) }}</span>
            </template>

            <template #cell(actions)="{ rowData }">
              <div class="flex gap-2">
                <VaButton
                  preset="plain"
                  icon="visibility"
                  color="info"
                  size="small"
                  title="View"
                  @click="viewTerm(rowData)"
                />
                <VaButton
                  preset="plain"
                  icon="edit"
                  color="warning"
                  size="small"
                  title="Edit"
                  @click="openEditTermModal(rowData)"
                />
                <VaButton
                  preset="plain"
                  icon="delete"
                  color="danger"
                  size="small"
                  title="Delete"
                  @click="confirmDeleteTerm(rowData)"
                />
              </div>
            </template>
          </VaDataTable>
        </VaInnerLoading>
      </div>

      <!-- Term Types Tab Content -->
      <div v-if="activeTab === 'term-types'" class="mt-4">
        <div class="flex justify-end mb-4">
          <VaButton color="primary" icon="add" round @click="openAddTermTypeModal"> Add New Term Type </VaButton>
        </div>

        <VaInnerLoading :loading="loadingTermTypes">
          <div v-if="termTypes.length === 0 && !loadingTermTypes" class="text-center py-12">
            <VaIcon name="category" size="4rem" color="#9B9FB5" />
            <p class="text-gray-500 mt-4">No term types found.</p>
            <VaButton class="mt-4" preset="secondary" @click="openAddTermTypeModal">Add your first term type</VaButton>
          </div>

          <VaDataTable v-else :items="termTypes" :columns="termTypeColumns" hoverable striped>
            <template #cell(name)="{ rowData }">
              <span class="font-semibold">{{ rowData.name }}</span>
            </template>

            <template #cell(description)="{ rowData }">
              <span class="text-sm text-gray-600">{{ rowData.description || 'No description' }}</span>
            </template>

            <template #cell(terms_count)="{ rowData }">
              <VaBadge :text="String(rowData.terms?.length || 0)" color="info" />
            </template>

            <template #cell(created_at)="{ rowData }">
              <span class="text-sm text-gray-600">{{ formatDate(rowData.created_at) }}</span>
            </template>

            <template #cell(actions)="{ rowData }">
              <div class="flex gap-2">
                <VaButton
                  preset="plain"
                  icon="edit"
                  color="warning"
                  size="small"
                  title="Edit"
                  @click="openEditTermTypeModal(rowData)"
                />
                <VaButton
                  preset="plain"
                  icon="delete"
                  color="danger"
                  size="small"
                  title="Delete"
                  @click="confirmDeleteTermType(rowData)"
                />
              </div>
            </template>
          </VaDataTable>
        </VaInnerLoading>
      </div>
    </VaCardContent>
  </VaCard>

  <!-- Add/Edit Term Modal -->
  <VaModal
    v-model="showTermFormModal"
    :title="isEditMode ? 'Edit Term' : 'Add New Term'"
    hide-default-actions
    size="large"
  >
    <VaForm ref="termFormRef" name="termFormRef" class="space-y-4">
      <VaSelect
        v-model="termForm.term_type_id"
        :options="termTypeOptions"
        label="Term Type"
        placeholder="Select a term type"
        :rules="[(v: any) => !!v || 'Term type is required']"
        required-mark
        :loading="loadingTermTypes"
      />
      <VaInput v-model="termForm.title" label="Title (Optional)" placeholder="Enter term title" />
      <VaTextarea
        v-model="termForm.content"
        label="Content"
        placeholder="Enter term content"
        :rules="[(v: any) => !!v || 'Content is required']"
        required-mark
        :min-rows="6"
        :max-rows="12"
      />
      <VaInput
        v-model.number="termForm.order_position"
        type="number"
        label="Order Position"
        placeholder="Enter order position"
        min="0"
      />
    </VaForm>
    <template #footer>
      <div class="flex gap-2 justify-end">
        <VaButton preset="secondary" @click="closeTermFormModal">Cancel</VaButton>
        <VaButton color="primary" :loading="savingTerm" @click="saveTermForm">{{
          isEditMode ? 'Update' : 'Save'
        }}</VaButton>
      </div>
    </template>
  </VaModal>

  <!-- View Term Modal -->
  <VaModal v-model="showViewModal" title="View Term" hide-default-actions size="large">
    <div v-if="viewItem" class="space-y-4">
      <div class="bg-gray-50 rounded-lg p-4">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <p class="text-sm text-gray-500">Term Type</p>
            <p class="font-semibold">{{ viewItem.term_type?.name || 'N/A' }}</p>
          </div>
          <div>
            <p class="text-sm text-gray-500">Order Position</p>
            <p class="font-semibold">{{ viewItem.order_position || 0 }}</p>
          </div>
        </div>
      </div>
      <div v-if="viewItem.title">
        <p class="text-sm text-gray-500">Title</p>
        <p class="font-semibold text-lg">{{ viewItem.title }}</p>
      </div>
      <div>
        <p class="text-sm text-gray-500 mb-2">Content</p>
        <div class="bg-white border rounded-lg p-4 max-h-96 overflow-y-auto whitespace-pre-wrap">
          {{ viewItem.content }}
        </div>
      </div>
      <div class="text-sm text-gray-400">
        Created: {{ formatDate(viewItem.created_at) }} | Updated: {{ formatDate(viewItem.updated_at) }}
      </div>
    </div>
    <template #footer>
      <div class="flex gap-2 justify-end">
        <VaButton preset="secondary" @click="showViewModal = false">Close</VaButton>
        <VaButton color="warning" icon="edit" @click="editFromView">Edit</VaButton>
      </div>
    </template>
  </VaModal>

  <!-- Delete Term Confirmation Modal -->
  <VaModal v-model="showDeleteTermModal" hide-default-actions>
    <template #header><h3 class="va-h6">Confirm Delete</h3></template>
    <p>Are you sure you want to delete this term?</p>
    <p v-if="itemToDelete" class="text-sm text-gray-500 mt-2">
      <strong>Type:</strong> {{ itemToDelete.term_type?.name || 'N/A' }} | <strong>Title:</strong>
      {{ itemToDelete.title || 'No Title' }}
    </p>
    <template #footer>
      <div class="flex gap-2 justify-end">
        <VaButton preset="secondary" @click="showDeleteTermModal = false">Cancel</VaButton>
        <VaButton color="danger" :loading="deletingTerm" @click="deleteTermItem">Delete</VaButton>
      </div>
    </template>
  </VaModal>

  <!-- Add/Edit Term Type Modal -->
  <VaModal
    v-model="showTermTypeFormModal"
    :title="isTermTypeEditMode ? 'Edit Term Type' : 'Add New Term Type'"
    hide-default-actions
    size="small"
  >
    <VaForm ref="termTypeFormRef" name="termTypeFormRef" class="space-y-4">
      <VaInput
        v-model="termTypeForm.name"
        label="Name"
        placeholder="e.g., Booking Terms, Payment Terms"
        :rules="[(v: any) => !!v || 'Name is required']"
        required-mark
      />
      <VaTextarea
        v-model="termTypeForm.description"
        label="Description (Optional)"
        placeholder="Enter description"
        :min-rows="3"
        :max-rows="6"
      />
    </VaForm>
    <template #footer>
      <div class="flex gap-2 justify-end">
        <VaButton preset="secondary" @click="closeTermTypeFormModal">Cancel</VaButton>
        <VaButton color="primary" :loading="savingTermType" @click="saveTermTypeForm">{{
          isTermTypeEditMode ? 'Update' : 'Save'
        }}</VaButton>
      </div>
    </template>
  </VaModal>

  <!-- Delete Term Type Confirmation Modal -->
  <VaModal v-model="showDeleteTermTypeModal" hide-default-actions>
    <template #header><h3 class="va-h6">Confirm Delete</h3></template>
    <p>Are you sure you want to delete this term type?</p>
    <p class="text-red-500 text-sm mt-2">
      <VaIcon name="warning" size="small" /> This will also delete all terms associated with this type.
    </p>
    <p v-if="termTypeToDelete" class="text-sm text-gray-500 mt-2">
      <strong>Name:</strong> {{ termTypeToDelete.name
      }}<span v-if="termTypeToDelete.terms?.length"> ({{ termTypeToDelete.terms.length }} terms will be deleted)</span>
    </p>
    <template #footer>
      <div class="flex gap-2 justify-end">
        <VaButton preset="secondary" @click="showDeleteTermTypeModal = false">Cancel</VaButton>
        <VaButton color="danger" :loading="deletingTermType" @click="deleteTermTypeItem">Delete</VaButton>
      </div>
    </template>
  </VaModal>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue'
import { mapActions } from 'pinia'
import { useToast } from '@/composables/useToast'
import { useForm } from '@/composables/useForm'
import { useSettingsStore } from '../../../stores/bushman/settings-store.ts'
import handleErrors from '../../../stores/bushman/errorHandler.ts'

export default defineComponent({
  name: 'ManageTerms',
  setup() {
    const termFormRef = ref()
    const termTypeFormRef = ref()
    const { validate: validateTermForm } = useForm()
    const { validate: validateTermTypeForm } = useForm()
    return { termFormRef, termTypeFormRef, validateTermForm, validateTermTypeForm }
  },
  data() {
    return {
      activeTab: 'terms',
      termColumns: [
        { key: 'id', label: 'ID', sortable: true },
        { key: 'term_type', label: 'Term Type', sortable: false },
        { key: 'title', label: 'Title', sortable: true },
        { key: 'content', label: 'Content', sortable: false },
        { key: 'order_position', label: 'Order', sortable: true },
        { key: 'created_at', label: 'Created', sortable: true },
        { key: 'actions', label: 'Actions', width: 120 },
      ],
      termTypeColumns: [
        { key: 'id', label: 'ID', sortable: true },
        { key: 'name', label: 'Name', sortable: true },
        { key: 'description', label: 'Description', sortable: false },
        { key: 'terms_count', label: 'Terms Count', sortable: false },
        { key: 'created_at', label: 'Created', sortable: true },
        { key: 'actions', label: 'Actions', width: 100 },
      ],
      toast: useToast(),
      loadingTerms: false,
      savingTerm: false,
      deletingTerm: false,
      showTermFormModal: false,
      showViewModal: false,
      showDeleteTermModal: false,
      isEditMode: false,
      editItemId: null as number | null,
      itemToDelete: null as any,
      viewItem: null as any,
      selectedTermType: null as any,
      terms: [] as any[],
      termForm: { term_type_id: null as any, title: '', content: '', order_position: 0 },
      loadingTermTypes: false,
      savingTermType: false,
      deletingTermType: false,
      showTermTypeFormModal: false,
      showDeleteTermTypeModal: false,
      isTermTypeEditMode: false,
      editTermTypeId: null as number | null,
      termTypeToDelete: null as any,
      termTypes: [] as any[],
      termTypeOptions: [] as any[],
      termTypeForm: { name: '', description: '' },
    }
  },
  mounted() {
    this.fetchTermTypes()
    this.fetchTerms()
  },
  methods: {
    ...mapActions(useSettingsStore, [
      'getTermTypes',
      'getTerms',
      'createTerm',
      'updateTerm',
      'deleteTerm',
      'createTermType',
      'updateTermType',
      'deleteTermType',
    ]),
    formatDate(dateStr: string): string {
      if (!dateStr) return 'N/A'
      return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
    },
    truncateContent(content: string): string {
      if (!content) return ''
      return content.length > 100 ? content.substring(0, 100) + '...' : content
    },
    async fetchTermTypes() {
      this.loadingTermTypes = true
      try {
        const response = await this.getTermTypes()
        if (response.status === 200) {
          this.termTypes = response.data
          this.termTypeOptions = response.data.map((item: any) => ({ value: item.id, text: item.name }))
        }
      } catch (error) {
        console.error('Error loading term types:', error)
      } finally {
        this.loadingTermTypes = false
      }
    },
    openAddTermTypeModal() {
      this.isTermTypeEditMode = false
      this.editTermTypeId = null
      this.termTypeForm = { name: '', description: '' }
      this.showTermTypeFormModal = true
    },
    openEditTermTypeModal(item: any) {
      this.isTermTypeEditMode = true
      this.editTermTypeId = item.id
      this.termTypeForm = { name: item.name || '', description: item.description || '' }
      this.showTermTypeFormModal = true
    },
    closeTermTypeFormModal() {
      this.showTermTypeFormModal = false
      this.termTypeForm = { name: '', description: '' }
    },
    async saveTermTypeForm() {
      const isValid = await this.validateTermTypeForm()
      if (!isValid) return
      this.savingTermType = true
      const payload = { name: this.termTypeForm.name, description: this.termTypeForm.description || null }
      try {
        if (this.isTermTypeEditMode && this.editTermTypeId) {
          const response = await this.updateTermType(this.editTermTypeId, payload)
          if (response.status === 200) {
            this.toast?.init({ message: 'Term type updated successfully', color: 'success' })
            this.closeTermTypeFormModal()
            this.fetchTermTypes()
          }
        } else {
          const response = await this.createTermType(payload)
          if (response.status === 201) {
            this.toast?.init({ message: 'Term type created successfully', color: 'success' })
            this.closeTermTypeFormModal()
            this.fetchTermTypes()
          }
        }
      } catch (error: any) {
        const errors = handleErrors(error.response)
        this.toast?.init({ message: errors.join(', ') || 'Failed to save', color: 'danger' })
      } finally {
        this.savingTermType = false
      }
    },
    confirmDeleteTermType(item: any) {
      this.termTypeToDelete = item
      this.showDeleteTermTypeModal = true
    },
    async deleteTermTypeItem() {
      if (!this.termTypeToDelete) return
      this.deletingTermType = true
      try {
        const response = await this.deleteTermType(this.termTypeToDelete.id)
        if (response.status === 200 || response.status === 204) {
          this.toast?.init({ message: 'Term type deleted successfully', color: 'success' })
          this.showDeleteTermTypeModal = false
          this.termTypeToDelete = null
          this.fetchTermTypes()
          this.fetchTerms()
        }
      } catch (error: any) {
        const errors = handleErrors(error.response)
        this.toast?.init({ message: errors.join(', ') || 'Failed to delete', color: 'danger' })
      } finally {
        this.deletingTermType = false
      }
    },
    async fetchTerms() {
      this.loadingTerms = true
      try {
        const termTypeId = this.selectedTermType?.value || null
        const response = await this.getTerms(termTypeId)
        if (response.status === 200) {
          this.terms = response.data
        }
      } catch (error) {
        this.toast?.init({ message: 'Failed to load terms', color: 'danger' })
      } finally {
        this.loadingTerms = false
      }
    },
    openAddTermModal() {
      this.isEditMode = false
      this.editItemId = null
      this.termForm = { term_type_id: null, title: '', content: '', order_position: 0 }
      this.showTermFormModal = true
    },
    openEditTermModal(item: any) {
      this.isEditMode = true
      this.editItemId = item.id
      this.termForm = {
        term_type_id: item.term_type_id ? { value: item.term_type_id, text: item.term_type?.name || '' } : null,
        title: item.title || '',
        content: item.content || '',
        order_position: item.order_position || 0,
      }
      this.showTermFormModal = true
    },
    closeTermFormModal() {
      this.showTermFormModal = false
      this.termForm = { term_type_id: null, title: '', content: '', order_position: 0 }
    },
    viewTerm(item: any) {
      this.viewItem = item
      this.showViewModal = true
    },
    editFromView() {
      this.showViewModal = false
      this.openEditTermModal(this.viewItem)
    },
    async saveTermForm() {
      const isValid = await this.validateTermForm()
      if (!isValid) return
      this.savingTerm = true
      const payload = {
        term_type_id: this.termForm.term_type_id?.value || this.termForm.term_type_id,
        title: this.termForm.title || null,
        content: this.termForm.content,
        order_position: this.termForm.order_position || 0,
      }
      try {
        if (this.isEditMode && this.editItemId) {
          const response = await this.updateTerm(this.editItemId, payload)
          if (response.status === 200) {
            this.toast?.init({ message: 'Term updated successfully', color: 'success' })
            this.closeTermFormModal()
            this.fetchTerms()
          }
        } else {
          const response = await this.createTerm(payload)
          if (response.status === 201) {
            this.toast?.init({ message: 'Term created successfully', color: 'success' })
            this.closeTermFormModal()
            this.fetchTerms()
          }
        }
      } catch (error: any) {
        const errors = handleErrors(error.response)
        this.toast?.init({ message: errors.join(', ') || 'Failed to save', color: 'danger' })
      } finally {
        this.savingTerm = false
      }
    },
    confirmDeleteTerm(item: any) {
      this.itemToDelete = item
      this.showDeleteTermModal = true
    },
    async deleteTermItem() {
      if (!this.itemToDelete) return
      this.deletingTerm = true
      try {
        const response = await this.deleteTerm(this.itemToDelete.id)
        if (response.status === 200 || response.status === 204) {
          this.toast?.init({ message: 'Term deleted successfully', color: 'success' })
          this.showDeleteTermModal = false
          this.itemToDelete = null
          this.fetchTerms()
        }
      } catch (error: any) {
        const errors = handleErrors(error.response)
        this.toast?.init({ message: errors.join(', ') || 'Failed to delete', color: 'danger' })
      } finally {
        this.deletingTerm = false
      }
    },
  },
})
</script>

<style lang="scss" scoped>
.manage-terms-page {
  min-height: 400px;
}
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
