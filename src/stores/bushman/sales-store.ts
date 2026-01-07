import { defineStore } from 'pinia'
import axios from 'axios'
import { format } from 'date-fns'
import { formatDateTime } from './utils'

export const useSalesInquiriesStore = defineStore('sales_inquiries', {
  state: () => {
    return {
      salesInquiries: [] as any,
      results: [] as any,
      loadingresults: false,
      priceBreakDown: null as any,
      addCompanions: false,
      observers: [] as any,
      showObserversModal: false,
      showCompanionsModal: false,
      companions: [] as any,
      savingSafariExtras: false,
      clientSafariExtras: [] as any,
      showSafariExtrasModal: false,
      showAccommodationModal: false,
      accommodations: [] as any,
      // charterPrices: [] as any,
      chartersPrices: [] as any,
      showChartersPriceModal: false,
      savingCharterPrices: false,
      loadingCharterPrices: false,
    }
  },

  actions: {
    async getSalesInquiries(seasonId: any, preferredDate: any) {
      const formattedDate = preferredDate ? format(new Date(preferredDate), 'yyyy-MM-dd') : ''

      const url =
        import.meta.env.VITE_APP_BASE_URL +
        import.meta.env.VITE_APP_SALES_INQUIRIES_URL +
        '?season_id=' +
        seasonId +
        '&preferred_date=' +
        formattedDate

      const config = {
        method: 'get',
        maxBodyLength: Infinity,
        url: url,
        headers: {
          'Content-Type': 'application/json',
        },
      }
      const response = await axios.request(config)
      return response
    },

    async createSalesInquiry(payload: any) {
      const url = import.meta.env.VITE_APP_BASE_URL + import.meta.env.VITE_APP_SALES_INQUIRIES_URL

      // The payload is already properly formatted from the component
      // Just send it directly to the backend
      const config = {
        method: 'post',
        maxBodyLength: Infinity,
        url: url,
        headers: {
          'Content-Type': 'application/json',
        },
        data: JSON.stringify(payload),
      }

      const response = await axios.request(config)
      return response
    },

    async updateSalesInquiry(id: number, payload: any) {
      const url = `${import.meta.env.VITE_APP_BASE_URL}${import.meta.env.VITE_APP_SALES_INQUIRIES_URL}${id}/`

      const config = {
        method: 'put', // or 'patch' depending on your API
        maxBodyLength: Infinity,
        url: url,
        headers: {
          'Content-Type': 'application/json',
        },
        data: JSON.stringify(payload),
      }

      try {
        const response = await axios.request(config)
        return response
      } catch (error) {
        console.error('Error updating sales inquiry:', error)
        throw error
      }
    },

    async deleteSalesInquiry(id: number) {
      const url = `${import.meta.env.VITE_APP_BASE_URL}${import.meta.env.VITE_APP_SALES_INQUIRIES_URL}${id}/`

      const config = {
        method: 'delete',
        maxBodyLength: Infinity,
        url: url,
        headers: {
          'Content-Type': 'application/json',
        },
      }

      try {
        const response = await axios.request(config)
        return response
      } catch (error) {
        console.error('Error deleting sales inquiry:', error)
        throw error
      }
    },

    // In your useSalesInquiriesStore
    // In your store's getallSalesConfirmation method:

    async getallSalesConfirmation() {
      this.loadingresults = true
      const url = import.meta.env.VITE_APP_BASE_URL + import.meta.env.VITE_APP_SALES_CONFIRMATION_VSET_URL

      const config = {
        method: 'get',
        maxBodyLength: Infinity,
        url: url,
        headers: {
          'Content-Type': 'application/json',
        },
      }

      try {
        const response = await axios.request(config)

        // Handle both response formats
        let data = []

        if (response.data && response.data.data) {
          // If data is nested under 'data' key
          data = response.data.data
        } else if (Array.isArray(response.data)) {
          // If response.data is directly the array
          data = response.data
        }

        if (data && Array.isArray(data) && data.length > 0) {
          this.loadingresults = false
          this.results = data.map((item: any, index: number) => {

            // Format dates
            const formatDateTime = (dateString: any) => {
              if (!dateString || dateString === 'N/A') return 'N/A'
              try {
                const date = new Date(dateString)
                return date.toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })
              } catch {
                return dateString
              }
            }

            return {
              // Client Information
              client: item?.sales_inquiry?.entity?.full_name || item?.client_name || 'Client ' + (index + 1),

              code: item?.sales_inquiry?.code || item?.sales_inquiry_code || `SC-${item?.id || index + 1}`,

              // Area Information
              area: item?.sales_inquiry?.area?.[0]?.area?.name || item?.area_name || 'Unknown Area',

              // Itinerary Information
              airport: item?.itinerary?.airport_name || item?.airport_name || 'N/A',

              arrival: formatDateTime(item?.itinerary?.arrival || item?.arrival),

              charter_in: formatDateTime(item?.itinerary?.charter_in || item?.charter_in),

              charter_out: formatDateTime(item?.itinerary?.charter_out || item?.charter_out),

              // Status Information
              status: item?.status?.status || item?.status || 'pending',

              // Additional Information
              pdf: item?.pdf || item?.document_url || null,

              id: item?.id || index + 1,
              created_date: item?.created_date || item?.created_at,
              updated_at: item?.updated_at,

              // Store the full object for details view
              selfitem: item,
            }
          })

          return response
        } else {
          console.warn('No data or empty array received from API')

          this.loadingresults = false
          this.results = []
          return response
        }
      } catch (error: any) {
        console.error('Error fetching sales confirmations:', error)

        this.loadingresults = false
        this.results = []

        throw error
      }
    },

    /**
     * Fetch all sales confirmation proposals
     * This is the correct endpoint for getting proposals to create contracts
     */
    async getSalesConfirmationProposals() {
      this.loadingresults = true
      const url = import.meta.env.VITE_APP_BASE_URL + import.meta.env.VITE_APP_SALES_CONFIRMATION_PROPOSALS_URL

      const config = {
        method: 'get',
        maxBodyLength: Infinity,
        url: url,
        headers: {
          'Content-Type': 'application/json',
        },
      }

      try {
        const response = await axios.request(config)

        // Handle both response formats
        let data = []

        if (response.data && response.data.data) {
          // If data is nested under 'data' key
          data = response.data.data
        } else if (Array.isArray(response.data)) {
          // If response.data is directly the array
          data = response.data
        }
        this.loadingresults = false

        if (data && Array.isArray(data)) {
          return { status: 200, data: data }
        } else {
          console.warn('No proposals data received from API')
          return { status: 200, data: [] }
        }
      } catch (error: any) {
        console.error('Error fetching sales confirmation proposals:', error)
        this.loadingresults = false
        throw error
      }
    },

    async createSalesConfirmationFinalization(payload: any) {
      const url = import.meta.env.VITE_APP_BASE_URL + import.meta.env.VITE_APP_SALES_CONFIRMATION_VSET_URL
      const data = JSON.stringify({
        sales_inquiry_id: payload.salesInquiryId,
        package_id: payload.packageId,
        airport_name: payload.airportName,
        charter_in: payload.charterIn,
        charter_out: payload.charterOut,
        arrival: payload.arrival,
        installments: payload.installments,
        regulatory_package_id: payload.regulatoryPackageId,
      })

      const config = {
        method: 'post',
        maxBodyLength: Infinity,
        url: url,
        headers: {
          'Content-Type': 'application/json',
        },
        data: data,
      }

      const response = await axios.request(config)
      return response
    },

    async getSalesPriceBreakdown(payload: any) {
      //     # http://localhost:8000/api/v1.0/sales-confirmation/total-sales-amount/?package_id=1&sales_inquiry_id=1
      // VITE_APP_SALESPRICE_BREAK_DOWN_URL=sales-confirmation/total-sales-amount/
      const url =
        import.meta.env.VITE_APP_BASE_URL +
        import.meta.env.VITE_APP_SALESPRICE_BREAK_DOWN_URL +
        '?package_id=' +
        payload.packageId +
        '&sales_inquiry_id=' +
        payload.salesInquiryId
      const config = {
        method: 'get',
        maxBodyLength: Infinity,
        url: url,
        headers: {
          'Content-Type': 'application/json',
        },
      }

      try {
        const response = await axios.request(config)
        this.priceBreakDown = response.data
        return response
      } catch (error) {
        console.error(error)
        return error
      }
    },

    async updatesalesConfirmationStatus(payload: any) {
      const url = import.meta.env.VITE_APP_BASE_URL + import.meta.env.VITE_APP_SALES_CONFIRMATION_STATUS_VSET_URL
      const data = new FormData()

      data.append('doc_type_id', payload.docTypeId)
      data.append('entity_id', payload.entityId)
      // data.append('documents', JSON.stringify(payload.documents))
      data.append('contract_doc', payload.contractDoc)
      data.append('payment_doc', payload.paymentDoc)
      data.append('sales_confirmation_proposal_id', payload.salesConfirmationProposalId)
      data.append('status_id', payload.statusId)
      data.append('area_id', payload.areaId)
      data.append('quota_id', payload.quotaId)

      const config = {
        method: 'patch',
        maxBodyLength: Infinity,
        url: url,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        data: data,
      }

      const response = await axios.request(config)
      return response
    },

    // # http://localhost:8000/api/v1.0/sales-confirmation/sales-confirmation-proposal-observers-vset/?entity_id=44&sales_confirmation_id=27
    // VITE_APP_SALES_CONFIRMATION_PROPOSAL_OBSERVERS_VSET_URL=sales-confirmation/sales-confirmation-proposal-observers-vset/
    async createSalesConfirmationProposalObservers(payload: any) {
      const url =
        import.meta.env.VITE_APP_BASE_URL + import.meta.env.VITE_APP_SALES_CONFIRMATION_PROPOSAL_OBSERVERS_VSET_URL
      // [
      //   {
      //     contact_type: 'email',
      //     contact: 'john.doe@example.com',
      //   },
      //   {
      //     contact_type: 'phone',
      //     contact: '+1234567890',
      //   },
      // ],
      const request_data = {
        full_name: payload.fullName,
        nationality_id: payload.nationalityId,
        country_id: payload.countryId,
        identity_number: payload.identityNumber,
        sales_inquiry_id: payload.salesInquiryId,
        contacts: payload.contacts,
        charter_in: payload.charter_in,
        charter_out: payload.charter_out,
        arrival_airport: payload.arrival_airport,
      }

      const json_data = JSON.stringify(request_data)
      const config = {
        method: 'post',
        maxBodyLength: Infinity,
        url: url,
        headers: {
          'Content-Type': 'application/json',
        },
        data: json_data,
      }

      const response = await axios.request(config)

      if (response.status === 201) {
        this.addCompanions = true
        this.showObserversModal = false
      }
      return response
    },
    async getObservers(salesInquiryId: any) {
      const url =
        import.meta.env.VITE_APP_BASE_URL +
        import.meta.env.VITE_APP_SALES_CONFIRMATION_PROPOSAL_OBSERVERS_VSET_URL +
        '?sales_inquiry_id=' +
        salesInquiryId

      const config = {
        method: 'get',
        maxBodyLength: Infinity,
        url: url,
        headers: {
          'Content-Type': 'application/json',
        },
      }
      try {
        const response = await axios.request(config)
        if (response.status === 200) {
          this.observers = response.data.map((item: any) => {
            return {
              id: item.id,
              full_name: item.observer.full_name,
              nationality: item.observer.nationality.name,
            }
          })
          return response
        } else {
          return response
        }
      } catch (error) {
        console.error(error)
        return error
      }
    },

    // # http://localhost:8000/api/v1.0/sales-confirmation/sales-confirmation-companion-vset/?entity_id=42&sales_confirmation_id=27
    // VITE_APP_SALES_CONFIRMATION_COMPANION_VSET_URL=sales-confirmation/sales-confirmation-companion-vset/
    async createSalesConfirmationCompanion(payload: any) {
      const url = import.meta.env.VITE_APP_BASE_URL + import.meta.env.VITE_APP_SALES_CONFIRMATION_COMPANION_VSET_URL
      const request_data = {
        full_name: payload.fullName,
        nationality_id: payload.nationalityId,
        country_id: payload.countryId,
        identity_number: payload.identityNumber,
        sales_inquiry_id: payload.salesInquiryId,
        regulatory_package_id: payload.regulatoryPackageId,
        contacts: payload.contacts,
        charter_in: payload.charter_in,
        arrival_airport: payload.arrival_airport,

        charter_out: payload.charter_out,
      }

      const json_data = JSON.stringify(request_data)
      const config = {
        method: 'post',
        maxBodyLength: Infinity,
        url: url,
        headers: {
          'Content-Type': 'application/json',
        },
        data: json_data,
      }

      const response = await axios.request(config)

      if (response.status === 201) {
        this.addCompanions = true
        this.showCompanionsModal = false
      }
      return response
    },

    async getCompanions(proposalIdOrPayload: any, usedOptionsList: boolean = false) {
      let url = import.meta.env.VITE_APP_BASE_URL + import.meta.env.VITE_APP_SALES_CONFIRMATION_COMPANION_VSET_URL

      // Build query parameters based on input type
      const queryParams: string[] = []

      if (typeof proposalIdOrPayload === 'object') {
        // If passed an object with entity_id and sales_confirmation_id
        if (proposalIdOrPayload.entity_id) {
          queryParams.push('entity_id=' + proposalIdOrPayload.entity_id)
        }
        if (proposalIdOrPayload.sales_confirmation_id) {
          queryParams.push('sales_confirmation_id=' + proposalIdOrPayload.sales_confirmation_id)
        }
      } else {
        // Legacy support: if passed a single ID, assume it's sales_confirmation_id
        queryParams.push('sales_confirmation_id=' + proposalIdOrPayload)
      }

      if (queryParams.length > 0) {
        url += '?' + queryParams.join('&')
      }

      const config = {
        method: 'get',
        maxBodyLength: Infinity,
        url: url,
        headers: {
          'Content-Type': 'application/json',
        },
      }
      try {
        const response = await axios.request(config)
        // Companions response received (debug logs removed)
        // Handle multiple response formats
        let companionsData = []
        if (response.data.value && Array.isArray(response.data.value)) {
          // If wrapped in {value: [...], Count: N} format
          companionsData = response.data.value
        } else if (response.data.data && Array.isArray(response.data.data)) {
          // If wrapped in {data: [...], success: true} format
          companionsData = response.data.data
        } else if (Array.isArray(response.data)) {
          // If direct array format
          companionsData = response.data
        }

        // Extracted companions data (debug logs removed)
        if (usedOptionsList === false) {
          if (response.status === 200) {
            this.companions = companionsData.map((item: any) => {
              return {
                id: item.id,
                full_name: item.companion?.full_name || item.full_name,
                nationality: item.companion?.nationality?.name || item.nationality,
              }
            })
            return response
          } else {
            return response
          }
        } else {
          this.companions = companionsData.map((item: any) => {
            return {
              text: item.companion?.full_name || item.full_name || 'Unknown',
              value: item.companion?.id || item.id,
            }
          })
          return response
        }
      } catch (error: any) {
        console.error('Error fetching companions:', error)
        this.companions = []
        return error
      }
    },

    async createsafariExtras(payload: any) {
      this.savingSafariExtras = true
      const url = import.meta.env.VITE_APP_BASE_URL + import.meta.env.VITE_APP_CLIENT_SAFARI_EXTRAS_VSET_URL
      const data = JSON.stringify({
        safary_extras: payload,
      })

      const config = {
        method: 'post',
        maxBodyLength: Infinity,
        url: url,
        data: data,
        headers: {
          'Content-Type': 'application/json',
        },
      }
      const response = await axios.request(config)
      if (response.status === 201) {
        this.showSafariExtrasModal = false
        this.savingSafariExtras = false
        return response
      } else {
        this.savingSafariExtras = false
        return response
      }
      return response
    },

    async getClienSafariExtras(salesInquiryId: any) {
      const url =
        import.meta.env.VITE_APP_BASE_URL +
        import.meta.env.VITE_APP_CLIENT_SAFARI_EXTRAS_VSET_URL +
        '?sales_inquiry_id=' +
        salesInquiryId
      const config = {
        method: 'get',
        maxBodyLength: Infinity,
        url: url,
        headers: {
          'Content-Type': 'application/json',
        },
      }
      this.clientSafariExtras = []

      const response = await axios.request(config)

      if (response.status === 200) {
        this.clientSafariExtras = response?.data?.map((item: any) => {
          return {
            name: item.safari_extras.name,
            amount: `${item.safari_extras.currency.symbol} ${item.safari_extras.amount}`,
          }
        })
      }
      return response
    },

    async getAccommodation(salesInquiryId: any) {
      const url =
        import.meta.env.VITE_APP_BASE_URL +
        import.meta.env.VITE_APP_SALES_CONFIRMATION_ACCOMMODATION_VSET_URL +
        '?sales_inquiry_id=' +
        salesInquiryId
      const config = {
        method: 'get',
        maxBodyLength: Infinity,
        url: url,
        headers: {
          'Content-Type': 'application/json',
        },
      }
      const response = await axios.request(config)
      if (response.status === 200) {
        this.accommodations = response.data.map((item: any) => {
          return {
            id: item.id,
            name: item.entity.full_name,
            type_name: item.type.name,
            check_in: formatDateTime(item.check_in),
            check_out: formatDateTime(item.check_out),
          }
        })
      }
      return response
    },

    async createAccommodation(payload: any) {
      const url = import.meta.env.VITE_APP_BASE_URL + import.meta.env.VITE_APP_SALES_CONFIRMATION_ACCOMMODATION_VSET_URL
      const data = JSON.stringify(payload)

      const config = {
        method: 'post',
        maxBodyLength: Infinity,
        url: url,
        headers: {
          'Content-Type': 'application/json',
        },
        data: data,
      }

      const response = await axios.request(config)
      if (response.status === 201) {
        this.showAccommodationModal = false
        this.getAccommodation(payload.sales_inquiry_id)
        return response
      } else {
        return response
      }
    },

    // VITE_APP_SALES_CHARTERS_PRICE_VSET_URL
    async getChartersPrice(salesInquiryId: any) {
      const url =
        import.meta.env.VITE_APP_BASE_URL +
        import.meta.env.VITE_APP_SALES_CHARTERS_PRICE_VSET_URL +
        '?sales_inquiry_id=' +
        salesInquiryId

      const config = {
        method: 'get',
        maxBodyLength: Infinity,

        url: url,
        headers: {
          'Content-Type': 'application/json',
        },
      }
      const response = await axios.request(config)
      if (response.status === 200) {
        this.chartersPrices = response.data.map((item: any) => {
          return {
            id: item.id,
            name: item.charters_price_list.name,
            amount: `${item?.charters_price_list?.currency?.symbol} ${item?.charters_price_list?.amount}`,
          }
        })
      }
    },
    // create
    async createChartersPrice(payload: any) {
      const url = import.meta.env.VITE_APP_BASE_URL + import.meta.env.VITE_APP_SALES_CHARTERS_PRICE_VSET_URL
      const data = JSON.stringify(payload)

      const config = {
        method: 'post',
        maxBodyLength: Infinity,
        url: url,
        headers: {
          'Content-Type': 'application/json',
        },
        data: data,
      }

      const response = await axios.request(config)
      if (response.status === 201) {
        this.showChartersPriceModal = false
        this.getChartersPrice(payload.sales_inquiry_id)
        return response
      } else {
        return response
      }
    },

    // ============ Pricing/Quotation Methods ============

    /**
     * Add pricing to an enquiry
     */
    async addPricing(enquiryId: number, payload: any) {
      const url = `${import.meta.env.VITE_APP_BASE_URL}sales-enquiries/${enquiryId}/pricing`
      const config = {
        method: 'post',
        maxBodyLength: Infinity,
        url: url,
        headers: {
          'Content-Type': 'application/json',
        },
        data: JSON.stringify(payload),
      }
      const response = await axios.request(config)
      return response
    },

    /**
     * Update pricing
     */
    async updatePricing(pricingId: number, payload: any) {
      const url = `${import.meta.env.VITE_APP_BASE_URL}sales-enquiries/pricing/${pricingId}`
      const config = {
        method: 'put',
        maxBodyLength: Infinity,
        url: url,
        headers: {
          'Content-Type': 'application/json',
        },
        data: JSON.stringify(payload),
      }
      const response = await axios.request(config)
      return response
    },

    /**
     * Delete pricing
     */
    async deletePricing(pricingId: number) {
      const url = `${import.meta.env.VITE_APP_BASE_URL}sales-enquiries/pricing/${pricingId}`
      const config = {
        method: 'delete',
        maxBodyLength: Infinity,
        url: url,
        headers: {
          'Content-Type': 'application/json',
        },
      }
      const response = await axios.request(config)
      return response
    },

    /**
     * Lock pricing (change status to LOCKED)
     */
    async lockPricing(pricingId: number) {
      const url = `${import.meta.env.VITE_APP_BASE_URL}sales-enquiries/pricing/${pricingId}/lock`
      const config = {
        method: 'patch',
        maxBodyLength: Infinity,
        url: url,
        headers: {
          'Content-Type': 'application/json',
        },
      }
      const response = await axios.request(config)
      return response
    },

    // ============ Pricing Item Methods ============

    /**
     * Add pricing item
     */
    async addPricingItem(pricingId: number, payload: any) {
      const url = `${import.meta.env.VITE_APP_BASE_URL}sales-enquiries/pricing/${pricingId}/items`
      const config = {
        method: 'post',
        maxBodyLength: Infinity,
        url: url,
        headers: {
          'Content-Type': 'application/json',
        },
        data: JSON.stringify(payload),
      }
      const response = await axios.request(config)
      return response
    },

    /**
     * Update pricing item
     */
    async updatePricingItem(itemId: number, payload: any) {
      const url = `${import.meta.env.VITE_APP_BASE_URL}sales-enquiries/pricing-items/${itemId}`
      const config = {
        method: 'put',
        maxBodyLength: Infinity,
        url: url,
        headers: {
          'Content-Type': 'application/json',
        },
        data: JSON.stringify(payload),
      }
      const response = await axios.request(config)
      return response
    },

    /**
     * Delete pricing item
     */
    async deletePricingItem(itemId: number) {
      const url = `${import.meta.env.VITE_APP_BASE_URL}sales-enquiries/pricing-items/${itemId}`
      const config = {
        method: 'delete',
        maxBodyLength: Infinity,
        url: url,
        headers: {
          'Content-Type': 'application/json',
        },
      }
      const response = await axios.request(config)
      return response
    },

    /**
     * Get pricings for an enquiry
     */
    async getEnquiryPricings(enquiryId: number) {
      const url = `${import.meta.env.VITE_APP_BASE_URL}sales-enquiries/${enquiryId}/pricing`
      const config = {
        method: 'get',
        maxBodyLength: Infinity,
        url: url,
        headers: {
          'Content-Type': 'application/json',
        },
      }
      const response = await axios.request(config)
      return response
    },

    /**
     * Preview price structure items (species, extras, trophy fees, etc.)
     */
    async previewPriceItems(priceStructureDetailId: number) {
      const url = `${import.meta.env.VITE_APP_BASE_URL}sales-enquiries/preview-price-items/${priceStructureDetailId}`
      const config = {
        method: 'get',
        maxBodyLength: Infinity,
        url: url,
        headers: {
          'Content-Type': 'application/json',
        },
      }
      const response = await axios.request(config)
      return response
    },
  },
})
