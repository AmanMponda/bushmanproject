<template>
  <VaCard class="manage-safari-fee-deposits-page">
    <VaCardContent>
      <!-- Header Section -->
      <div class="flex flex-col md:flex-row gap-2 mb-4 justify-between items-center">
        <h2 class="text-xl font-bold text-gray-700">
          <VaIcon name="payments" class="mr-2" />
          Safari Fee Deposits
        </h2>
        <VaButton color="primary" icon="add" round @click="openAddModal"> Add New Deposit </VaButton>
      </div>

      <VaDivider />

      <!-- Data Table -->
      <VaInnerLoading :loading="loading">
        <div v-if="items.length === 0 && !loading" class="text-center py-12">
          <VaIcon name="payments" size="4rem" color="#9B9FB5" />
          <p class="text-gray-500 mt-4">No safari fee deposits found.</p>
          <VaButton class="mt-4" preset="secondary" @click="openAddModal">Add your first deposit</VaButton>
        </div>

        <VaDataTable v-else :items="items" :columns="columns" hoverable striped>
          <template #cell(safari_duration)="{ rowData }">
            <div class="flex items-center gap-2">
              <VaIcon name="calendar_today" size="small" color="primary" />
              <span class="font-semibold">{{ rowData.safari_duration }}</span>
            </div>
          </template>

          <template #cell(trophy_fee_deposit)="{ rowData }">
            <VaBadge :text="'$' + formatNumber(rowData.trophy_fee_deposit)" color="success" />
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
                @click="openEditModal(rowData)"
              />
              <VaButton
                preset="plain"
                icon="delete"
                color="danger"
                size="small"
                title="Delete"
                @click="confirmDelete(rowData)"
              />
            </div>
          </template>
        </VaDataTable>
      </VaInnerLoading>
    </VaCardContent>
  </VaCard>

  <!-- Add/Edit Modal -->
  <VaModal v-model="showFormModal" :title="isEditMode ? 'Edit Deposit' : 'Add New Deposit'" hide-default-actions>
    <VaForm ref="formRef" name="formRef" class="space-y-4">
      <VaInput
        v-model="form.safari_duration"
        label="Safari Duration"
        placeholder="e.g., 10 Days, 14 Days, 21 Days"
        :rules="[(v: any) => !!v || 'Safari duration is required']"
        required-mark
      >
        <template #prepend>
          <VaIcon name="calendar_today" />
        </template>
      </VaInput>

      <VaInput
        v-model.number="form.trophy_fee_deposit"
        type="number"
        label="Trophy Fee Deposit (USD)"
        placeholder="0.00"
        step="0.01"
        min="0"
        :rules="[(v: any) => Number(v) > 0 || 'Deposit amount must be greater than 0']"
        required-mark
      >
        <template #prepend>
          <VaIcon name="attach_money" />
        </template>
      </VaInput>
    </VaForm>
    <template #footer>
      <div class="flex gap-2 justify-end">
        <VaButton preset="secondary" @click="closeFormModal">Cancel</VaButton>
        <VaButton color="primary" :loading="saving" @click="saveForm">{{ isEditMode ? 'Update' : 'Save' }}</VaButton>
      </div>
    </template>
  </VaModal>

  <!-- Delete Confirmation Modal -->
  <VaModal v-model="showDeleteModal" hide-default-actions>
    <template #header><h3 class="va-h6">Confirm Delete</h3></template>
    <p>Are you sure you want to delete this safari fee deposit?</p>
    <p v-if="itemToDelete" class="text-sm text-gray-500 mt-2">
      <strong>Duration:</strong> {{ itemToDelete.safari_duration }} | <strong>Deposit:</strong> ${{
        formatNumber(itemToDelete.trophy_fee_deposit)
      }}
    </p>
    <template #footer>
      <div class="flex gap-2 justify-end">
        <VaButton preset="secondary" @click="showDeleteModal = false">Cancel</VaButton>
        <VaButton color="danger" :loading="deleting" @click="deleteItem">Delete</VaButton>
      </div>
    </template>
  </VaModal>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue'
import { mapActions } from 'pinia'
import { useToast } from '@/composables/useToast'
import { useForm } from '@/composables/useForm'
import { useSettingsStore } from '../../../stores/bushman/settings-store'
import handleErrors from '../../../stores/bushman/errorHandler'

export default defineComponent({
  name: 'ManageSafariFeeDeposits',
  setup() {
    const formRef = ref()
    const { validate } = useForm()
    return { formRef, validate }
  },
  data() {
    return {
      columns: [
        { key: 'id', label: 'ID', sortable: true, width: 80 },
        { key: 'safari_duration', label: 'Safari Duration', sortable: true },
        { key: 'trophy_fee_deposit', label: 'Trophy Fee Deposit', sortable: true },
        { key: 'created_at', label: 'Created', sortable: true },
        { key: 'actions', label: 'Actions', width: 100 },
      ],
      toast: useToast(),
      loading: false,
      saving: false,
      deleting: false,
      showFormModal: false,
      showDeleteModal: false,
      isEditMode: false,
      editItemId: null as number | null,
      itemToDelete: null as any,
      items: [] as any[],
      form: {
        safari_duration: '',
        trophy_fee_deposit: null as number | null,
      },
    }
  },
  mounted() {
    this.fetchItems()
  },
  methods: {
    ...mapActions(useSettingsStore, [
      'getSafariFeeDeposits',
      'createSafariFeeDeposit',
      'updateSafariFeeDeposit',
      'deleteSafariFeeDeposit',
    ]),

    formatDate(dateStr: string): string {
      if (!dateStr) return 'N/A'
      return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
    },

    formatNumber(value: number): string {
      if (!value && value !== 0) return '0.00'
      return parseFloat(String(value)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    },

    async fetchItems() {
      this.loading = true
      try {
        const response = await this.getSafariFeeDeposits()
        if (response.status === 200) {
          this.items = response.data.data || response.data
        }
      } catch (error) {
        console.error('Error loading safari fee deposits:', error)
        this.toast?.init({ message: 'Failed to load safari fee deposits', color: 'danger' })
      } finally {
        this.loading = false
      }
    },

    openAddModal() {
      this.isEditMode = false
      this.editItemId = null
      this.form = { safari_duration: '', trophy_fee_deposit: null }
      this.showFormModal = true
    },

    openEditModal(item: any) {
      this.isEditMode = true
      this.editItemId = item.id
      this.form = {
        safari_duration: item.safari_duration || '',
        trophy_fee_deposit: parseFloat(item.trophy_fee_deposit) || null,
      }
      this.showFormModal = true
    },

    closeFormModal() {
      this.showFormModal = false
      this.form = { safari_duration: '', trophy_fee_deposit: null }
    },

    async saveForm() {
      const isValid = await this.validate()
      if (!isValid) return

      this.saving = true
      const payload = {
        safari_duration: this.form.safari_duration,
        trophy_fee_deposit: this.form.trophy_fee_deposit!,
      }

      try {
        if (this.isEditMode && this.editItemId) {
          const response = await this.updateSafariFeeDeposit(this.editItemId, payload)
          if (response.status === 200) {
            this.toast?.init({ message: 'Deposit updated successfully', color: 'success' })
            this.closeFormModal()
            this.fetchItems()
          }
        } else {
          const response = await this.createSafariFeeDeposit(payload)
          if (response.status === 201) {
            this.toast?.init({ message: 'Deposit created successfully', color: 'success' })
            this.closeFormModal()
            this.fetchItems()
          }
        }
      } catch (error: any) {
        const errors = handleErrors(error.response)
        this.toast?.init({ message: errors.join(', ') || 'Failed to save', color: 'danger' })
      } finally {
        this.saving = false
      }
    },

    confirmDelete(item: any) {
      this.itemToDelete = item
      this.showDeleteModal = true
    },

    async deleteItem() {
      if (!this.itemToDelete) return
      this.deleting = true
      try {
        const response = await this.deleteSafariFeeDeposit(this.itemToDelete.id)
        if (response.status === 200 || response.status === 204) {
          this.toast?.init({ message: 'Deposit deleted successfully', color: 'success' })
          this.showDeleteModal = false
          this.itemToDelete = null
          this.fetchItems()
        }
      } catch (error: any) {
        const errors = handleErrors(error.response)
        this.toast?.init({ message: errors.join(', ') || 'Failed to delete', color: 'danger' })
      } finally {
        this.deleting = false
      }
    },
  },
})
</script>

<style lang="scss" scoped>
.manage-safari-fee-deposits-page {
  min-height: 400px;
}
</style>
