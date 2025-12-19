<template>
    <div class="quota-page">
      <!-- Breadcrumb -->
      <div class="d-flex align-items-center mb-3">
        <div>
          <ul class="breadcrumb">
            <li class="breadcrumb-item"><a href="#">Sales</a></li>
            <li class="breadcrumb-item active">Quotas</li>
          </ul>
        </div>
      </div>
  
      <!-- Statistics Cards Section -->
      <div v-if="quotaStats" class="row layout-top-spacing bg-white rounded">
        <div class="col-xl-12 col-lg-12 col-sm-12 layout-spacing">
          <div class="panel br-6 p-0">
            <div class="p-3">
            <h3 class="mb-4">Quota Summary Statistics</h3>
            <div class="stats-cards-grid">
              <!-- Total Quota Card -->
              <div class="stat-card stat-card-primary">
                <div class="stat-card-content">
                  <div class="stat-label">Total Quota Balance</div>
                  <div class="stat-value">{{ quotaStats.total_quota_balance }}</div>
                </div>
                <div class="stat-icon">
                  <i class="fa fa-bar-chart"></i>
                </div>
              </div>
  
              <!-- Available Quota Card -->
              <div class="stat-card stat-card-success">
                <div class="stat-card-content">
                  <div class="stat-label">Available Quota</div>
                  <div class="stat-value">{{ quotaStats.available_quota }}</div>
                </div>
                <div class="stat-icon">
                  <i class="fa fa-check-circle"></i>
                </div>
              </div>
  
              <!-- Confirmed Card -->
              <div class="stat-card stat-card-warning">
                <div class="stat-card-content">
                  <div class="stat-label">Confirmed</div>
                  <div class="stat-value">{{ quotaStats.confirmed }}</div>
                </div>
                <div class="stat-icon">
                  <i class="fa fa-check"></i>
                </div>
              </div>
  
              <!-- Utilisation Card -->
              <div class="stat-card stat-card-info">
                <div class="stat-card-content">
                  <div class="stat-label">Utilisation Rate</div>
                  <div class="stat-value">{{ quotaStats.utilisation_percentage }}%</div>
                </div>
                <div class="stat-icon">
                  <i class="fa fa-trending-up"></i>
                </div>
              </div>
            </div>
            </div>
          </div>
        </div>
      </div>
  
      <!-- Status Breakdown Section -->
      <div v-if="quotaStats" class="row layout-top-spacing bg-white rounded">
        <div class="col-xl-12 col-lg-12 col-sm-12 layout-spacing">
          <div class="panel br-6 p-0">
            <div class="p-3">
            <h4 class="mb-4">Status Breakdown</h4>
            <div class="breakdown-grid">
              <div class="breakdown-card">
                <div class="breakdown-number text-success">{{ quotaStats.confirmed }}</div>
                <div class="breakdown-label">Confirmed</div>
              </div>
              <div class="breakdown-card">
                <div class="breakdown-number text-warning">{{ quotaStats.provisioned }}</div>
                <div class="breakdown-label">Provisioned</div>
              </div>
              <div class="breakdown-card">
                <div class="breakdown-number text-danger">{{ quotaStats.cancelled }}</div>
                <div class="breakdown-label">Cancelled</div>
              </div>
              <div class="breakdown-card">
                <div class="breakdown-number text-info">{{ quotaStats.taken }}</div>
                <div class="breakdown-label">Taken</div>
              </div>
            </div>
            </div>
          </div>
        </div>
      </div>
  
      <!-- Data Table Section -->
      <div class="row layout-top-spacing bg-white rounded">
        <div class="col-xl-12 col-lg-12 col-sm-12 layout-spacing">
          <div class="panel br-6 p-0">
            <!-- Search and Filter Bar -->
            <div class="custom-table p-3">
              <!-- Advanced Filters Panel -->
              <div v-if="showFiltersPanel" class="filters-panel card mb-4">
                <div class="card-body">
                  <div class="row g-3">
                    <div class="col-md-3">
                      <label class="form-label">Area</label>
                      <select v-model="area" class="form-control" @change="getAllSpeces()">
                        <option value="">All Areas</option>
                        <option v-for="opt in areasOptions" :key="opt.value" :value="opt.value">
                          {{ opt.text }}
                        </option>
                      </select>
                    </div>
  
                    <div class="col-md-3">
                      <label class="form-label">Quota Year</label>
                      <select v-model="quota" class="form-control" @change="getAllSpeces()">
                        <option value="">All Years</option>
                        <option v-for="opt in yearOptions" :key="opt.value" :value="opt.value">
                          {{ opt.text }}
                        </option>
                      </select>
                    </div>
  
                    <div class="col-md-3">
                      <label class="form-label">Species</label>
                      <select v-model="species" class="form-control" @change="getAllSpeces()">
                        <option value="">All Species</option>
                        <option v-for="opt in speciesOptions" :key="opt.value" :value="opt.value">
                          {{ opt.text }}
                        </option>
                      </select>
                    </div>
  
                    <div class="col-md-3 d-flex align-items-end">
                      <button class="btn btn-outline-secondary w-100" @click="clearFilters()">
                        <i class="fa fa-times me-1"></i>Clear Filters
                      </button>
                    </div>
                  </div>
                </div>
              </div>
  
              <!-- StandardDataTable Component -->
              <div v-if="!loading && detailedData.length === 0" class="empty-state-message text-center py-5">
                <i class="fa fa-info-circle fa-3x text-muted mb-3"></i>
                <p class="text-muted">{{ showMessage || 'No quota data available for the selected filters' }}</p>
              </div>
  
              <StandardDataTable
                v-else
                :columns="columns"
                :data="detailedData"
                :loading="loading"
                :filters="tableFilters"
                :default-page-size="tableFilters.pageSize"
                :disable-pagination="false"
                :show-date-filters="false"
                :action-buttons="pageActions"
                :selectable="true"
                @update:filters="handleFiltersUpdate"
              >
                <template #id="{ row }">
                  {{ (row as any as SpeciesTableItem).id }}
                </template>
                <template #name="{ row }">
                  {{ (row as any as SpeciesTableItem).name }}
                </template>
                <template #scientific_name="{ row }">
                  {{ (row as any as SpeciesTableItem).scientific_name }}
                </template>
                <template #area="{ row }">
                  {{ (row as any as SpeciesTableItem).area }}
                </template>
                <template #no_of_species="{ row }">
                  <span class="badge" style="background-color: #17a2b8; color: white">{{
                    (row as any as SpeciesTableItem).no_of_species
                  }}</span>
                </template>
                <template #provision_sales="{ row }">
                  <span class="badge badge-warning">{{ (row as any as SpeciesTableItem).provision_sales }}</span>
                </template>
                <template #confirmed="{ row }">
                  <span class="badge badge-success">{{ (row as any as SpeciesTableItem).confirmed }}</span>
                </template>
                <template #cancelled="{ row }">
                  <span class="badge badge-danger">{{ (row as any as SpeciesTableItem).cancelled }}</span>
                </template>
                <template #taken="{ row }">
                  <span class="badge badge-secondary">{{ (row as any as SpeciesTableItem).taken }}</span>
                </template>
              </StandardDataTable>
            </div>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script setup lang="ts">
  // @ts-nocheck - TypeScript can't properly infer slot prop types from StandardDataTable component
  import { ref, reactive, onMounted } from 'vue'
  import { useQuotaStore } from '@/stores/bushman/quota-store'
  import StandardDataTable from '@/components/bootstrap/StandardDataTable.vue'

  interface QuotaStats {
    total_quota_balance: number
    available_quota: number
    confirmed: number
    provisioned: number
    cancelled: number
    taken: number
    total_allocated: number
    utilisation_percentage: number
  }

  interface SpeciesTableItem {
    id: number
    area: string
    name: string
    scientific_name: string
    no_of_species: number
    provision_sales: number
    confirmed: number
    cancelled: number
    taken: number
  }

  interface SelectOption {
    value: any
    text: string
    name?: string
    start_date?: string
    end_date?: string
  }

  interface QuotaResponse {
    id: number
    name: string
    start_date: string
    end_date: string
  }

  // Store
  const quotaStore = useQuotaStore()

  // Reactive state
  const quotaStats = ref<QuotaStats | null>(null)
  const detailedData = ref<SpeciesTableItem[]>([])
  const area = ref<any>(null)
  const quota = ref<any>(null)
  const species = ref<any>(null)
  const searchText = ref<string>('')
  const showFiltersPanel = ref<boolean>(false)
  const areasOptions = ref<SelectOption[]>([])
  const yearOptions = ref<SelectOption[]>([])
  const speciesOptions = ref<SelectOption[]>([])
  const loading = ref<boolean>(false)
  const downloading = ref<boolean>(false)
  const showMessage = ref<string>('')
  const columns = [
    { key: 'id', label: 'ID', visible: true, sortable: true },
    { key: 'name', label: 'Name', visible: true, sortable: true },
    { key: 'scientific_name', label: 'Scientific Name', visible: true, sortable: true },
    { key: 'area', label: 'Area', visible: true, sortable: true },
    { key: 'no_of_species', label: 'No of Species', visible: true, sortable: true },
    { key: 'provision_sales', label: 'Provision Sales', visible: true, sortable: true },
    { key: 'confirmed', label: 'Confirmed', visible: true, sortable: true },
    { key: 'cancelled', label: 'Cancelled', visible: true, sortable: true },
    { key: 'taken', label: 'Taken', visible: true, sortable: true },
  ] as any[]
  const tableFilters = reactive({
    search: '',
    pageSize: 10,
    page: 1,
  })
  const pageActions = ref<any[]>([])

  // Helper method to properly type row data
  const getRowData = (row: any): SpeciesTableItem => {
    return row as SpeciesTableItem
  }

  const handleFiltersUpdate = (filters: any) => {
    Object.assign(tableFilters, filters)
  }
  
  const downloadPDF = async () => {
    if (!quotaStats.value) {
      return
    }
  
    downloading.value = true
    try {
          // Generate PDF from table data using pdfMake (already in your dependencies)
          // @ts-ignore - jspdf types are available but TypeScript has issues with dynamic imports
          const { jsPDF } = await import('jspdf')
          // @ts-ignore - jspdf-autotable types are available but TypeScript has issues with dynamic imports
          const autoTable = (await import('jspdf-autotable')).default
  
          // Create PDF document
          const pdf = new jsPDF()
          const pageWidth = pdf.internal.pageSize.getWidth()
          let yPosition = 15
  
          // Add company logo
          try {
            // Try to add logo image
            const logoUrl = '/assets/img/logo.png'
            pdf.addImage(logoUrl, 'PNG', pageWidth / 2 - 10, yPosition, 20, 20)
            yPosition += 22
          } catch (e) {
            // If logo fails to load, just skip it
            console.warn('Could not load logo image')
          }
  
          // Add company name and subtitle
          pdf.setFontSize(14)
          pdf.setTextColor(80, 80, 80)
          pdf.text('BUSHMAN', pageWidth / 2, yPosition, { align: 'center' })
          yPosition += 5
  
          pdf.setFontSize(10)
          pdf.setTextColor(100, 100, 100)
          pdf.text('SAFARI TRACKERS LTD.', pageWidth / 2, yPosition, { align: 'center' })
          yPosition += 8
  
          // Add report title
          pdf.setFontSize(16)
          pdf.setTextColor(30, 90, 130)
          pdf.setFont('helvetica', 'bold')
          pdf.text('SALES QUOTA', pageWidth / 2, yPosition, { align: 'center' })
          pdf.setFont('helvetica', 'normal')
          yPosition += 8
  
          // Add report metadata
          pdf.setFontSize(9)
          pdf.setTextColor(100, 100, 100)
          pdf.text(
            `Report Generated: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`,
            14,
            yPosition,
          )
          yPosition += 8
  
          // Add statistics section header
          pdf.setFontSize(12)
          pdf.setTextColor(40, 40, 40)
          pdf.text('SUMMARY STATISTICS', 14, yPosition)
          yPosition += 6
  
          // Create statistics table
          const statsTableData = [
            ['Total Quota Balance', quotaStats.value.total_quota_balance],
            ['Available Quota', quotaStats.value.available_quota],
            ['Confirmed', quotaStats.value.confirmed],
            ['Provisioned', quotaStats.value.provisioned],
            ['Cancelled', quotaStats.value.cancelled],
            ['Taken', quotaStats.value.taken],
            ['Total Allocated', quotaStats.value.total_allocated],
            ['Utilisation Rate', `${quotaStats.value.utilisation_percentage}%`],
          ]
  
          autoTable(pdf, {
            head: [['Metric', 'Value']],
            body: statsTableData,
            startY: yPosition,
            headStyles: {
              fillColor: [41, 128, 185], // Professional blue
              textColor: 255,
              fontStyle: 'bold',
              fontSize: 10,
              halign: 'center',
            },
            bodyStyles: {
              textColor: 60,
              fontSize: 9,
            },
            alternateRowStyles: {
              fillColor: [240, 248, 255], // Light blue tint
            },
            margin: { left: 14, right: 14 },
            columnStyles: {
              0: { halign: 'left' },
              1: { halign: 'right' },
            },
          })
  
          // Get the final Y position after stats table
          yPosition = (pdf as any).lastAutoTable.finalY + 12
  
          // Check if we need to add a new page for the data table
          if (yPosition > 220) {
            pdf.addPage()
            yPosition = 15
          }
  
          // Prepare table data
          const tableData = detailedData.value.map((item: any) => [
            item.id,
            item.name,
            item.scientific_name,
            item.area,
            item.no_of_species,
            item.provision_sales,
            item.confirmed,
            item.cancelled,
            item.taken,
          ])
  
          // Add data table section header
          pdf.setFontSize(12)
          pdf.setTextColor(40, 40, 40)
          pdf.text('QUOTA DETAILS', 14, yPosition)
          yPosition += 6
  
          // Add table
          autoTable(pdf, {
            head: [['ID', 'Name', 'Scientific Name', 'Area', 'Species', 'Provision', 'Confirmed', 'Cancelled', 'Taken']],
            body: tableData,
            startY: yPosition,
            headStyles: {
              fillColor: [41, 128, 185], // Professional blue
              textColor: 255,
              fontStyle: 'bold',
              fontSize: 9,
            },
            bodyStyles: {
              textColor: 60,
              fontSize: 8,
            },
            alternateRowStyles: {
              fillColor: [240, 248, 255], // Light blue tint
            },
            margin: { left: 14, right: 14 },
            didDrawPage: (data: any) => {
              // Footer
              const pageSize = pdf.internal.pageSize
              const pageHeight = pageSize.getHeight()
              const pageWidth = pageSize.getWidth()
              const totalPages = pdf.internal.pages.length
  
              // Only show company address on the last page
              if (data.pageNumber === totalPages) {
                // Add footer divider on last page
                pdf.setDrawColor(150, 150, 150)
                pdf.line(14, pageHeight - 35, pageWidth - 14, pageHeight - 35)
  
                // Add company address on last page
                pdf.setFontSize(8)
                pdf.setTextColor(100, 100, 100)
                pdf.text('Bushman Safari Trackers Limited,', 14, pageHeight - 31)
                pdf.text('Plot No. 61-64, Block E, Kihonda Industrial Complex,', 14, pageHeight - 27)
                pdf.text('P.O. Box 678, Morogoro, Tanzania.', 14, pageHeight - 23)
              }
  
              // Page number on all pages
              pdf.setFontSize(9)
              pdf.setTextColor(150, 150, 150)
              pdf.text(`Page ${data.pageNumber}`, pageWidth / 2, pageHeight - 10, { align: 'center' })
            },
          })
  
          // Download PDF
          pdf.save(`quota-report-${new Date().toISOString().split('T')[0]}.pdf`)
  
          console.log('PDF generated and downloaded successfully')
      } catch (error: any) {
        console.error('Error generating PDF:', error)
        alert('Failed to generate PDF: ' + error.message)
      } finally {
        downloading.value = false
      }
    }

    const clearFilters = () => {
      searchText.value = ''
      area.value = null
      quota.value = null
      species.value = null
      getAllSpeces()
    }

    const getAllSpeces = async () => {
      loading.value = true
      showMessage.value = ''
      quotaStats.value = null
      detailedData.value = []

      try {
        const response = await quotaStore.getAllSpeciesPerQuotaPerArea(quota.value, area.value, species.value)
  
        console.log('===== QuotaPage Response =====')
        console.log('Full response:', response)
        console.log('response.data:', response.data)
        console.log('response.data.data:', response.data?.data)
        console.log('response.data.detailed_data:', response.data?.detailed_data)
        console.log('==============================')
  
        // Handle response with or without success property
        const responseData = response.data?.success !== undefined ? response.data : response.data
        const data = response.data?.success ? response.data.data : (response.data?.data || response.data)
        const detailedDataArray = response.data?.detailed_data || responseData?.detailed_data

        if (data && typeof data === 'object' && !Array.isArray(data)) {
          quotaStats.value = {
              total_quota_balance: data.total_quota_balance || 0,
              available_quota: data.available_quota || 0,
              confirmed: data.confirmed || 0,
              provisioned: data.provisioned || 0,
              cancelled: data.cancelled || 0,
              taken: data.taken || 0,
              total_allocated: data.total_allocated || 0,
              utilisation_percentage: data.utilisation_percentage || 0,
            }

            console.log('Quota Stats set:', quotaStats.value)

            // Check if detailed_data exists
            if (detailedDataArray) {
              console.log('detailed_data exists, type:', typeof detailedDataArray)
              console.log('detailed_data is array?', Array.isArray(detailedDataArray))
              console.log('detailed_data length:', detailedDataArray?.length)
              console.log('First item:', detailedDataArray?.[0])
            } else {
              console.warn('NO detailed_data in response!')
            }

            if (detailedDataArray && Array.isArray(detailedDataArray)) {
              detailedData.value = detailedDataArray.map((item: any) => {
                console.log('Item before mapping:', item)
                const mapped = {
                  id: item.id || 0,
                  name: item.name || item.species_name || item.species?.name || 'N/A',
                  area: item.area || item.huntingArea?.name || item.area_name || 'N/A',
                  scientific_name: item.scientific_name || item.species?.scientific_name || 'N/A',
                  no_of_species: item.no_of_species || item.quantity || 0,
                  provision_sales: item.provision_sales || item.provision_quantity || 0,
                  confirmed: item.confirmed || item.confirmed_quantity || 0,
                  cancelled: item.cancelled || item.declined_quantity || item.cancelled_quantity || 0,
                  taken: item.taken || item.completed_quantity || 0,
                }
                console.log('Mapped item:', mapped)
                return mapped
              })

              console.log('Total detailedData items:', detailedData.value.length)
            } else {
              console.warn('No detailed_data array found in response')
            }
          } else {
            showMessage.value = response.data?.message || responseData?.message || 'No data available'
            console.warn('Data is not an object or is an array:', data)
          }
        } catch (error: any) {
          showMessage.value = error.response?.data?.message || error.message || 'Failed to fetch quota data'
          console.error('Error in getAllSpeces:', error)
        } finally {
          loading.value = false
        }
      }
  
    const getQuota = async () => {
      try {
        const response = await quotaStore.getQuotas(null)

          let quotasData: QuotaResponse[] = []
          // Handle different response structures
          if (response.data?.success && Array.isArray(response.data.data)) {
            quotasData = response.data.data
          } else if (response.data?.data && Array.isArray(response.data.data)) {
            quotasData = response.data.data
          } else if (Array.isArray(response.data)) {
            quotasData = response.data
          }

          if (quotasData.length > 0) {
            const currentQuota = quotasData[0]
            quota.value = currentQuota.id

            yearOptions.value = quotasData.map((item: QuotaResponse) => {
              const result = quotaStore.generateQuotaYear(item.start_date, item.end_date)
              return {
                value: item.id,
                text: `${result} - ${item.name}`,
                name: item.name,
                start_date: item.start_date,
                end_date: item.end_date,
              }
            })
          }
        } catch (error: any) {
          console.error('Error fetching quotas:', error)
        }
      }
  
    const getSpeciesItems = async () => {
      try {
        const response = await quotaStore.getSpeciesList()
  
          let speciesData = []
          if (response.data?.success && Array.isArray(response.data.data)) {
            speciesData = response.data.data
          } else if (Array.isArray(response.data)) {
            speciesData = response.data
          } else if (response.data?.data && Array.isArray(response.data.data)) {
            speciesData = response.data.data
          }
  
          speciesOptions.value = [
            {
              value: 'all',
              text: 'All',
            },
          ]
  
          const speciesItems = speciesData.map((item: any) => ({
            value: item.id,
            text: item.name,
          }))
  
          speciesOptions.value = speciesOptions.value.concat(speciesItems)
        } catch (error: any) {
          console.error('Error fetching species list:', error)
        }
      }
  
    const getAreas = async () => {
      try {
        const response = await quotaStore.getAreaList()
  
          let areasData = []
          if (response.data?.success && Array.isArray(response.data.data)) {
            areasData = response.data.data
          } else if (Array.isArray(response.data)) {
            areasData = response.data
          } else if (response.data?.data && Array.isArray(response.data.data)) {
            areasData = response.data.data
          }
  
          areasOptions.value = [
            {
              value: 'all',
              text: 'All',
            },
          ]
  
          const areasOptionsData = areasData.map((item: any) => ({
            value: item.id,
            text: item.name,
          }))
  
          areasOptions.value = areasOptions.value.concat(areasOptionsData)
        } catch (error: any) {
          console.error('Error fetching areas:', error)
        }
      }

    // Initialize component
    onMounted(async () => {
      // Initialize pageActions after component is mounted
      pageActions.value = [
        {
          label: 'Download PDF',
          icon: 'fa fa-download',
          class: 'btn btn-primary',
          method: () => downloadPDF(),
        },
      ]

      // Load dropdowns first
      await Promise.all([getQuota(), getSpeciesItems(), getAreas()])
      
      // Then load the main data after quota is set
      getAllSpeces()
    })
  </script>
  
  <style lang="scss" scoped>
  .quota-page {
    padding: 0;
    min-height: 600px;
    width: 100%;
  }

  // Local layout spacing classes to ensure consistent spacing in production
  .layout-top-spacing {
    margin-top: 20px;
  }

  .layout-spacing {
    padding: 10px 0;
  }

  .panel {
    background: transparent;
    border: none;
    box-shadow: none;
  }

  /* Style for all panels - consistent styling */
  .bg-white.layout-top-spacing .panel {
    background: transparent;
    border: none;
    box-shadow: none;
    border-radius: 0;
  }
  
  .br-6 {
    border-radius: 6px;
  }
  
  .p-4 {
    padding: 2rem;
  }
  
  .p-0 {
    padding: 0;
  }
  
  .p-3 {
    padding: 1rem;
  }
  
  .mb-3 {
    margin-bottom: 1rem;
  }
  
  .mb-4 {
    margin-bottom: 1.5rem;
  }
  
  .mb-8 {
    margin-bottom: 3rem;
  }
  
  .bg-white {
    background: transparent;
  }
  
  .rounded {
    border-radius: 4px;
  }
  
  
  .d-flex {
    display: flex;
  }
  
  .align-items-center {
    align-items: center;
  }
  
  /* Statistics Cards */
  .stats-cards-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 20px;
    margin-bottom: 30px;
  }
  
  .stat-card {
    padding: 20px;
    border-radius: 6px;
    color: white;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .stat-card-primary {
    background: linear-gradient(135deg, #5a4a42 0%, #6b5a52 100%);
  }
  
  .stat-card-success {
    background: linear-gradient(135deg, #28a745 0%, #1e8e3e 100%);
  }
  
  .stat-card-warning {
    background: linear-gradient(135deg, #ffc107 0%, #e0a800 100%);
    color: #333;
  }
  
  .stat-card-info {
    background: linear-gradient(135deg, #17a2b8 0%, #0f7b8f 100%);
  }
  
  .stat-card-content {
    flex: 1;
  }
  
  .stat-label {
    font-size: 12px;
    opacity: 0.85;
    margin-bottom: 8px;
  }
  
  .stat-value {
    font-size: 28px;
    font-weight: 600;
  }
  
  .stat-icon {
    font-size: 32px;
    opacity: 0.3;
    margin-left: 15px;
  }
  
  /* Filters Bar */
  .filters-bar {
    margin: 0 0 0 0;
    padding: 0;
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: nowrap;
    gap: 12px;
  }
  
  .filters-bar .search-input {
    flex: 0 0 auto;
    min-width: 280px;
    max-width: 350px;
    flex-grow: 0;
  }
  
  .input-group {
    display: flex;
    width: 100%;
    height: 36px;
    align-items: stretch;
  }
  
  .input-group .form-control {
    border-radius: 4px 0 0 4px;
    border-right: none;
    padding: 8px 12px;
    font-size: 13px;
    height: 38px;
    line-height: 1.5;
    flex: 1;
    display: flex;
    align-items: center;
    border: 1px solid #d1d5db;
    background: white;
  }
  
  .input-group .btn {
    border-radius: 0 4px 4px 0;
    border-left: none;
    padding: 8px 12px;
    font-size: 13px;
    height: 38px;
    line-height: 1.5;
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 40px;
  }
  
  .soft-divider {
    height: 1px;
    background: linear-gradient(90deg, #e9ecef 0%, #e9ecef 100%);
    margin: 12px 0 12px 0;
  }
  
  /* Filters Panel */
  .filters-panel {
    border: 1px solid #e9ecef;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    margin-bottom: 12px;
  }
  
  .filters-panel .card-body {
    padding: 20px;
  }
  
  .filters-panel .g-3 {
    gap: 20px;
  }
  
  .form-label {
    font-weight: 500;
    margin-bottom: 8px;
    font-size: 12px;
    color: #555;
    display: block;
  }
  
  .form-control {
    padding: 10px 12px;
    border: 1px solid #d1d5db;
    border-radius: 4px;
    font-size: 14px;
    font-family: inherit;
    width: 100%;
  }
  
  .form-control:focus {
    outline: none;
    border-color: #007bff;
    box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.25);
  }
  
  .btn {
    padding: 8px 12px;
    border: 1px solid #d1d5db;
    border-radius: 4px;
    cursor: pointer;
    font-size: 13px;
    font-weight: 500;
    transition: all 0.3s ease;
    background: #f8f9fa;
    color: #333;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    white-space: nowrap;
    height: 38px;
    min-width: auto;
  }
  
  .btn-primary {
    background: #007bff;
    color: white;
    border-color: #007bff;
  }
  
  .btn-primary:hover:not(:disabled) {
    background: #0056b3;
    border-color: #0056b3;
  }
  
  .btn-outline-secondary {
    background: white;
    color: #6c757d;
    border-color: #6c757d;
  }
  
  .btn-outline-secondary:hover:not(:disabled) {
    background: #e2e6ea;
    color: #5a6268;
  }
  
  .btn-outline-info {
    background: white;
    color: #17a2b8;
    border-color: #17a2b8;
  }
  
  .btn-outline-info:hover:not(:disabled) {
    background: #e0f0f5;
    color: #0f7b8f;
  }
  
  .w-100 {
    width: 100%;
  }
  
  .btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  
  .me-1 {
    margin-right: 6px;
  }
  
  /* Status Breakdown */
  .status-breakdown {
    margin: 30px 0;
    padding: 20px 0;
    border-top: 1px solid #e9ecef;
    border-bottom: 1px solid #e9ecef;
  }
  
  .stats-cards-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;
    width: 100%;
    margin: 0;
    padding: 0;
  }
  
  .stat-card {
    padding: 30px 25px;
    border-radius: 6px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    color: white;
    font-weight: 500;
    min-height: 110px;
  }
  
  .stat-card-primary {
    background: #5a4a42;
  }
  
  .stat-card-success {
    background: #28a745;
  }
  
  .stat-card-warning {
    background: #ffc107;
    color: #333;
  }
  
  .stat-card-info {
    background: #17a2b8;
  }
  
  .stat-card-content {
    flex: 1;
  }
  
  .stat-label {
    font-size: 12px;
    opacity: 0.9;
    margin-bottom: 8px;
    text-transform: uppercase;
  }
  
  .stat-value {
    font-size: 32px;
    font-weight: 700;
  }
  
  .stat-icon {
    font-size: 32px;
    opacity: 0.3;
    margin-left: 15px;
  }
  
  .breakdown-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;
    width: 100%;
    margin: 0;
    padding: 0;
  }
  
  .breakdown-card {
    text-align: center;
    padding: 30px 20px;
    background: #f8f9fa;
    border-radius: 6px;
    border: 1px solid #e9ecef;
    min-height: 110px;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }
  
  .breakdown-number {
    font-size: 32px;
    font-weight: 700;
    margin-bottom: 8px;
  }
  
  .breakdown-label {
    font-size: 12px;
    color: #666;
    text-transform: uppercase;
    font-weight: 500;
  }
  
  .text-success {
    color: #28a745;
  }
  
  .text-warning {
    color: #ffc107;
  }
  
  .text-danger {
    color: #dc3545;
  }
  
  .text-info {
    color: #17a2b8;
  }
  
  .table-responsive {
    width: 100%;
    overflow-x: auto;
    margin: 0;
    padding: 0;
    border: none !important;
    box-shadow: none !important;
  }

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
  }

  /* Data Table Section */
  .custom-table {
    padding: 1rem;
  }
  
  .badge {
    display: inline-block;
    padding: 4px 8px;
    border-radius: 12px;
    font-size: 11px;
    font-weight: 500;
  }
  
  .badge-success {
    background-color: #d4edda;
    color: #155724;
  }
  
  .badge-warning {
    background-color: #fff3cd;
    color: #856404;
  }
  
  .badge-danger {
    background-color: #f8d7da;
    color: #721c24;
  }
  
  .badge-secondary {
    background-color: #e2e3e5;
    color: #383d41;
  }
  
  .text-center {
    text-align: center;
  }
  
  .gap-2 {
    gap: 12px;
  }
  
  .gap-3 {
    gap: 16px;
  }
  
  .flex-wrap {
    flex-wrap: wrap;
  }
  
  .d-flex {
    display: flex;
  }
  
  .justify-content-between {
    justify-content: space-between;
  }
  
  .align-items-center {
    align-items: center;
  }
  
  .col-md-3 {
    flex: 0 0 25%;
    padding: 0 15px;
  }
  
  .row.g-3 {
    margin: -10px;
  }
  
  .row.g-3 > [class*='col-'] {
    padding: 10px;
  }
  
  .card {
    background: white;
    border: 1px solid #e9ecef;
  }
  
  .card-body {
    padding: 20px;
  }
  
  .py-8 {
    padding-top: 3rem;
    padding-bottom: 3rem;
  }
  
  .text-lg {
    font-size: 1.1rem;
  }

  .breadcrumb {
    text-transform: uppercase !important;
    font-weight: 600;
    font-size: 0.875rem;
    margin-bottom: 0 !important;

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
  