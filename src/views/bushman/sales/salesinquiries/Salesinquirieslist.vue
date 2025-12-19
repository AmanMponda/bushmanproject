<template>
  <div class="grid sm:grid-cols-3 gap-6 mb-6">
    <VaSelect
      v-model="seasonValue"
      :options="seasonOptions"
      placeholder="Filter By Season"
      @update:modelValue="getSalesInquiryList"
    />
    <VaDateInput v-model="dateValue" placeholder="Filter By Date" clearable @update:modelValue="getSalesInquiryList" />
    <VaInput v-model="filter" placeholder="Search" clearable @update:modelValue="getSalesInquiryList" />
  </div>
  <div class="table-responsive w-100">
    <VaDataTable
      hoverable
      :loading="loading"
      :items="salesInquiryItems"
      :columns="columns"
      :per-page="perPage"
      :current-page="currentPage"
      :filter="filter"
      class="table-simple w-100"
      @filtered="filtered = $event.items"
    >
      <template #cell(start_date)="{ rowData }">
        {{ formatDate((rowData as any).start_date) }}
      </template>

      <template #cell(end_date)="{ rowData }">
        {{ formatDate((rowData as any).end_date) }}
      </template>

      <template #cell(species_count)="{ rowData }">
        {{ (rowData as any).species_count || 0 }}
      </template>

      <template #cell(status)="{ rowData }">
        {{ (rowData as any).status }}
      </template>

      <template #cell(actions)="{ rowData }">
        <button class="btn btn-sm btn-link p-0 me-2" title="View Details" @click="btnViewClicked(rowData)">
          <i class="material-icons" style="font-size: 18px">visibility</i>
        </button>
        <button class="btn btn-sm btn-link p-0 me-2" title="Edit" @click="btnEditClicked(rowData)">
          <i class="material-icons" style="font-size: 18px">edit</i>
        </button>
        <button class="btn btn-sm btn-link p-0" title="Delete" @click="showDeleteConfirm(rowData)">
          <i class="material-icons" style="font-size: 18px">delete</i>
        </button>
      </template>

      <template #bodyAppend>
        <tr>
          <td colspan="9">
            <div class="flex justify-center mt-4">
              <VaPagination v-model="currentPage" :pages="pages" />
            </div>
          </td>
        </tr>
      </template>
    </VaDataTable>
  </div>

  <!-- Delete Confirmation Modal -->
  <VaModal v-model="showDeleteModal" title="Delete Inquiry" size="small" @ok="confirmDelete" @cancel="cancelDelete">
    <p>
      Are you sure you want to delete the inquiry for "<strong>{{ deleteItemName }}</strong
      >"?
    </p>
    <p class="text-sm text-gray-500 mt-2">This action cannot be undone.</p>
    <template #footer>
      <div class="flex gap-2 justify-end">
        <VaButton preset="secondary" @click="cancelDelete">Cancel</VaButton>
        <VaButton color="danger" :loading="deleting" @click="confirmDelete">Delete</VaButton>
      </div>
    </template>
  </VaModal>
</template>

<script lang="ts">
import { mapActions } from 'pinia'
import { defineComponent, ref } from 'vue'
import { useSalesInquiriesStore } from '../../../../stores/sales-store'
import { useSettingsStore } from '../../../../stores/settings-store'
import { useToast } from '@/composables/useToast'

export default defineComponent({
  name: 'SalesInquiriesList',
  emits: ['download-btn-pressed', 'view-btn-pressed', 'edit-btn-pressed', 'delete-btn-pressed'],
  setup() {
    const { init: notify } = useToast()
    return { notify }
  },
  data() {
    return {
      loading: ref(false),
      deleting: false,
      showDeleteModal: false,
      deleteItemId: null as number | null,
      deleteItemName: '',
      columns: [
        { key: 'name', label: 'Client Name', sortable: true },
        { key: 'area', label: 'Area', sortable: true },
        { key: 'hunting_type', label: 'Hunting Type', sortable: true },
        { key: 'start_date', label: 'Start Date', sortable: true },
        { key: 'end_date', label: 'End Date', sortable: true },
        { key: 'season', label: 'Season', sortable: true },
        { key: 'species_count', label: 'Species', width: 80 },
        { key: 'status', label: 'Status', width: 100 },
        { key: 'actions', label: 'Actions', width: 150 },
      ] as any,
      salesInquiryItems: [],
      perPage: 10,
      currentPage: 1,
      filter: '',
      filtered: [],
      seasonValue: null as any,
      seasonOptions: [] as any,
      dateValue: null as any,
      mothValue: null as any,
    }
  },
  computed: {
    pages() {
      return this.perPage && this.perPage !== 0 ? Math.ceil(this.filtered.length / this.perPage) : this.filtered.length
    },
  },
  mounted() {
    this.getSalesInquiryList()
    this.getSeasonOptions()
  },

  methods: {
    // getSalesInquiries()
    ...mapActions(useSalesInquiriesStore, ['getSalesInquiries', 'deleteSalesInquiry']),
    ...mapActions(useSettingsStore, ['getSeasons']),

    formatDate(dateString: string): string {
      if (!dateString || dateString === 'N/A') return 'N/A'
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return 'N/A'
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    },

    async getSalesInquiryList() {
      this.loading = true

      try {
        const response: any = await this.getSalesInquiries(
          // seasonId: number, preferredDate: string
          this.seasonValue?.value ?? '',
          this.dateValue ?? '',
        )
        if (response.status === 200) {
          this.loading = false
          // Handle paginated response - data is inside response.data.data
          const dataArray = Array.isArray(response.data) ? response.data : response.data.data || []
          this.salesInquiryItems = dataArray.map((item: any) => {
            // Get species count from inquiry_species or species array
            const speciesCount = item?.inquiry_species?.length || item?.species?.length || 0

            // Get reference price list data
            const refPriceList = item?.reference_price_list
            const priceListData = item?.price_lists?.[0]?.price_list?.price_list_type

            // Get price and currency
            const amount = refPriceList?.amount || priceListData?.amount || '0.00'
            const currencySymbol = priceListData?.currency?.symbol || '$'

            // Get area name
            const areaName =
              refPriceList?.area_name || item?.inquiry_areas?.[0]?.area_name || item?.areas?.[0]?.area?.name || 'N/A'

            // Get hunting type
            const huntingType = refPriceList?.hunting_type_name || priceListData?.hunting_type?.name || 'N/A'

            return {
              id: item.id,
              selfitem: item,
              code: item?.code || '',
              name: item?.entity?.full_name || 'N/A',
              area: areaName,
              hunting_type: huntingType,
              price: `${currencySymbol}${parseFloat(amount).toFixed(2)}`,
              start_date: item?.formatted_preferences?.start_date || 'N/A',
              end_date: item?.formatted_preferences?.end_date || 'N/A',
              season: item?.season?.name || 'N/A',
              species_count: speciesCount,
              status: item?.status || 'PENDING',
              country: item?.entity?.country?.name || item?.entity?.country_name || 'N/A',
              nationality: item?.entity?.nationality?.name || item?.entity?.nationality_name || 'N/A',
              contacts: item?.entity?.contacts || [],
              preference: {
                no_of_hunters: item?.formatted_preferences?.no_of_hunters || 0,
                no_of_observers: item?.formatted_preferences?.no_of_observers || 0,
                no_of_days: item?.formatted_preferences?.no_of_days || 0,
                no_of_companions: item?.formatted_preferences?.no_of_companions || 0,
                special_requests: item?.formatted_preferences?.special_requests || '',
                start_date: item?.formatted_preferences?.start_date || '',
                end_date: item?.formatted_preferences?.end_date || '',
                budget_estimation: item?.formatted_preferences?.budget_estimation || '',
                preferred_date: item?.formatted_preferences?.preferred_date || '',
              },
              reference_price_list: refPriceList,
              inquiry_species: item?.inquiry_species || [],
              inquiry_areas: item?.inquiry_areas || [],
            }
          })

          this.filtered = this.salesInquiryItems

          // Add more fields here
        }
      } catch (error) {
        this.loading = false
        console.log(error)
        // this.$toast.error(error.message)
      }
    },

    async getSeasonOptions() {
      const response: any = await this.getSeasons()
      if (response.status === 200) {
        this.seasonOptions = response.data.map((item: any) => ({
          value: item.id,
          text: item.name,
        }))
      }
    },

    btnDownloadClicked(rowData: any) {
      console.log(rowData)
      this.$emit('download-btn-pressed', rowData)
    },

    downloadPdf(rowData: any) {
      const inquiryId = rowData.id
      const pdfUrl = `${import.meta.env.VITE_APP_BASE_URL}sales/sales-inquiries-pdf/${inquiryId}`
      window.open(pdfUrl, '_blank')
    },

    async downloadInquiryPdf(rowData: any) {
      const inquiryId = rowData.id
      try {
        const response = await fetch(`${import.meta.env.VITE_APP_BASE_URL}sales/sales-inquiries/${inquiryId}/pdf`, {
          headers: { 'Content-Type': 'application/json' },
        })
        const data = await response.json()

        if (data.success && data.pdf) {
          // Decode base64 PDF and download
          const byteCharacters = atob(data.pdf)
          const byteNumbers = new Array(byteCharacters.length)
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i)
          }
          const byteArray = new Uint8Array(byteNumbers)
          const blob = new Blob([byteArray], { type: 'application/pdf' })

          // Create download link
          const url = window.URL.createObjectURL(blob)
          const link = document.createElement('a')
          link.href = url
          link.download = `inquiry-${rowData.code || inquiryId}.pdf`
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          window.URL.revokeObjectURL(url)

          this.notify({
            message: 'PDF downloaded successfully',
            color: 'success',
          })
        } else {
          this.notify({
            message: 'Failed to generate PDF',
            color: 'danger',
          })
        }
      } catch (error) {
        console.error('Error downloading PDF:', error)
        this.notify({
          message: 'Error downloading PDF',
          color: 'danger',
        })
      }
    },

    btnViewClicked(rowData: any) {
      console.log(rowData)
      this.$emit('view-btn-pressed', rowData)
    },
    btnEditClicked(rowData: any) {
      console.log(rowData)
      this.$emit('edit-btn-pressed', rowData)
    },

    showDeleteConfirm(rowData: any) {
      this.deleteItemId = rowData.id
      this.deleteItemName = rowData.name
      this.showDeleteModal = true
    },

    cancelDelete() {
      this.showDeleteModal = false
      this.deleteItemId = null
      this.deleteItemName = ''
    },

    async confirmDelete() {
      if (!this.deleteItemId) return

      this.deleting = true
      try {
        const response: any = await this.deleteSalesInquiry(this.deleteItemId)
        if (response.status === 200 || response.status === 204) {
          this.notify({
            message: 'Inquiry deleted successfully',
            color: 'success',
          })
          // Refresh the list
          this.getSalesInquiryList()
        }
      } catch (error: any) {
        console.error('Error deleting inquiry:', error)
        this.notify({
          message: error.response?.data?.message || 'Failed to delete inquiry',
          color: 'danger',
        })
      } finally {
        this.deleting = false
        this.showDeleteModal = false
        this.deleteItemId = null
        this.deleteItemName = ''
      }
    },
  },
})
</script>

<style lang="scss" scoped>
:deep(.table-simple) {
  width: 100%;
  margin: 0;

  .va-table {
    width: 100%;
    border-collapse: collapse;
    margin: 0;
  }

  th,
  td {
    padding: 0.5rem;
    border-bottom: 1px solid #dee2e6;
    text-align: left;
    background: transparent;
  }

  th {
    font-weight: 600;
    border-bottom: 2px solid #dee2e6;
    background: transparent;
  }

  tbody tr {
    background: transparent;

    &:hover {
      background-color: #f8f9fa;
    }
  }

  // Remove all colors, badges, and icons
  .va-badge,
  .badge {
    background: transparent !important;
    color: inherit !important;
    padding: 0;
    border: none;
    font-weight: normal;
  }

  // Remove icon colors
  .va-icon,
  i.material-icons {
    color: inherit;
  }

  // Remove text colors
  .text-success,
  .text-green-600,
  .text-primary,
  .text-warning,
  .text-danger,
  .text-gray-900,
  .text-gray-700 {
    color: inherit !important;
  }

  // Remove font weights
  .font-semibold,
  .font-bold {
    font-weight: normal;
  }
}
</style>
