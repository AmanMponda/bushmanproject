<script setup>
import { ref, onMounted, computed, watch, nextTick } from 'vue';
import { BASE_URL } from '@/config/config';
import { useNotification } from '@/composables/notification.js';
import { useAuthStore } from "@/stores/auth";
import { useRouter } from 'vue-router';
import axios from 'axios';
import Datepicker from '@/components/plugins/Datepicker.vue';
import StandardVueSelect from '@/components/plugins/StandardVueSelect.vue';
import NormalCard from '@/components/bootstrap/Customized-Cards/NormalCard.vue';
import CardHeader from '@/components/bootstrap/CardHeader.vue';
import CardBody from '@/components/bootstrap/CardBody.vue';
import CardFooter from '@/components/bootstrap/CardFooter.vue';
import Loading from '@/components/bootstrap/Loading.vue';
import StandardOffcanvas from '@/components/plugins/StandardOffcanvas.vue';
import EmptyState from '@/components/bootstrap/emptyState.vue';

// imports Initializations
const { showAlert } = useNotification();
const authStore = useAuthStore();
const router = useRouter();

const userId = computed(() => authStore.user?.id);

// Permissions
const permissions = computed(() => authStore.permissions);
const canCreatePaymentAdvice = computed(() =>
    permissions.value.includes("CAN_CREATE_PAYMENT_ADVICE")
);

// Offcanvas Initalizations
const previewRequisition = ref(false);
const currentItemIndex = ref(null);

// Reactive Variables
const formData = ref({});
const transactionTypes = ref([]);
const statusOptions = ref([]);
const partyRoles = ref([]);
const itemableTypes = ref([]);
const accountableTypes = ref([]);
const currencies = ref([]);
const entities = ref([]);
const employees = ref([]);
const subcontractors = ref([]);
const invoices = ref([]);
const requisitions = ref([]);
const orders = ref([]);
const contracts = ref([]);
const journalVouchers = ref([]);
const selectedRequisition = ref(null);

// Loading States
const isSaving = ref(false);
const isLoading = ref(false);
const isLoadingItems = ref(false);

// Form Data
const paymentForm = ref({
    user_id: userId.value,
    date: '',
    transaction_type: null,
    status: [
        {
            value: 'DRAFT',
            label: 'Draft',
        }
    ],
    currency: null,
    exchange_rate: 1,
    remarks: '',

    // Parties array
    parties: [
        {
            role: null,
            accountable_type: null,
            account_id: '',
            payee_name: '',
            cheque_number: '',
            control_number: '',
            narration: ''
        }
    ],

    // Items array
    items: [
        {
            itemable_type: '',
            itemable: null,
            description: '',
            currency: null,
            search: '',
            amount: 0,
            selected_item: null,
            preview_data: null
        }
    ],
});

// Helper Functions
const goBack = () => {
    router.back();
};

const getToday = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const formatAmount = (amount) => {
    if (amount === null || amount === undefined || isNaN(amount)) {
        return '-';
    }
    return Number(amount).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
};

// Fetch Form Options
const fetchFormData = async () => {
    try {
        const response = await axios.get(`${BASE_URL}/payment-advices/form-data`);
        if (response.data && response.data.success === true) {
            formData.value = response.data.form_data || {};
            transactionTypes.value = response.data.form_data?.transaction_types || [];
            statusOptions.value = response.data.form_data?.status_options || [];
            partyRoles.value = response.data.form_data?.roles || [];
            itemableTypes.value = response.data.form_data?.itemable_types || [];
            accountableTypes.value = response.data.form_data?.accountable_types || [];
        }
    } catch (error) {
        console.error("Error fetching Form Options:", error);
        showAlert("error", error.response?.data?.message || error.message || "Error fetching Form Options");
    }
};

// Fetch Currencies
const fetchCurrencies = async () => {
    try {
        const response = await axios.get(`${BASE_URL}/settings/currencies`);
        currencies.value = response.data.data || [];

        // Set initial values
        // if (currencies.value.length > 0) {
        //     paymentForm.value.currency = currencies.value[0].id;
        //     // Set currency for items
        //     paymentForm.value.items.forEach(item => {
        //         item.currency = currencies.value[0].id;
        //     });
        // }
    } catch (error) {
        console.error("Error fetching currencies:", error);
        showAlert("error", error.response?.data?.message || error.message || "Error fetching currencies");
    }
};

// Fetch Entities
const fetchEntities = async () => {
    try {
        const response = await axios.get(`${BASE_URL}/entities/drop-downs`);
        entities.value = response.data.data?.map(entity => ({
            id: entity.id,
            name: entity.full_name,
        })) || [];
    } catch (error) {
        console.error("Error fetching entities:", error);
        showAlert("error", error.response?.data?.message || error.message || "Error fetching entities");
    }
}

// Add party row
const addParty = () => {
    paymentForm.value.parties.unshift({
        role: '',
        accountable_type: '',
        accountable: '',
        payee_name: '',
        cheque_number: '',
        control_number: '',
        narration: ''
    });
};

// Remove party row
const removeParty = (index) => {
    if (paymentForm.value.parties.length > 1) {
        paymentForm.value.parties.splice(index, 1);
    }
};

// Add item row
const addItem = () => {
    // Clear all items' preview data for fresh start
    paymentForm.value.items.forEach(item => {
        item.selected_item = null;
        item.preview_data = null;
    });
    
    paymentForm.value.items.unshift({
        itemable_type: '',
        itemable: '',
        description: '',
        currency: paymentForm.value.currency,
        amount: 0,
        selected_item: null,
        preview_data: null,
        search: ''
    });
    // Clear requisitions for fresh start
    requisitions.value = [];
};

// Remove item row
const removeItem = (index) => {
    if (paymentForm.value.items.length > 1) {
        paymentForm.value.items.splice(index, 1);
    }
};

// Update item when itemable type changes
const updateItemOptions = (item) => {
    item.itemable = '';
    item.selected_item = null;
    item.preview_data = null;
    item.description = '';
    item.amount = 0;
    // Clear requisitions when type changes
    requisitions.value = [];
};

// Calculate total amount
const totalAmount = computed(() => {
    const amount = paymentForm.value.items.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);
    return amount;
    // return formatAmount(amount);
});

// Calculate total in base currency
const totalBaseAmount = computed(() => {
    const amount = totalAmount.value * paymentForm.value.exchange_rate;
    return amount;
    // return formatAmount(amount);
});

// Filter accountable options based on type
const getAccountableOptions = (type) => {
    switch (type) {
        case 'ENTITY': return entities.value;
        case 'EMPLOYEE': return employees.value;
        case 'SUBCONTRACTOR': return subcontractors.value;
        case 'OTHER': return []; // For OTHER type, we don't have predefined options
        default: return [];
    }
};

// Filter itemable options based on type
const getItemableOptions = (type) => {
    switch (type) {
        case 'INVOICE': return invoices.value;
        case 'REQUISITION': return requisitions.value;
        case 'ORDER': return orders.value;
        case 'CONTRACT': return contracts.value;
        case 'JOURNAL_VOUCHER': return journalVouchers.value;
        default: return [];
    }
};

// Handle Search for items
const handleItemSearch = async (item, searchTerm) => {
    if (!item.itemable_type) {
        showAlert('warning', 'Please select an item type first');
        return;
    }

    if (!searchTerm) {
        showAlert('warning', 'Please enter a search term');
        return;
    }

    switch (item.itemable_type?.value) {
        case 'INVOICE':
            showAlert('info', 'Fetching Invoices...');
            break;
        case 'REQUISITION':
            await fetchRequisitions(searchTerm);
            break;
        case 'ORDER':
            showAlert('info', 'Fetching Orders...');
            break;
        case 'CONTRACT':
            showAlert('info', 'Fetching Contacts...');
            break;
        case 'JOURNAL_VOUCHER':
            showAlert('info', 'Fetching Journal Vouchers...');
            break;
        default:
            break;
    }
};

// Fetch Requisitions
const fetchRequisitions = async (searchTerm) => {
    const params = {
        q: searchTerm || 'APPROVED',
        limit: 500,
    };

    isLoadingItems.value = true;
    try {
        const response = await axios.get(`${BASE_URL}/requisitions/search`, { params });
        if (response.data.success) {
            requisitions.value = response.data.data || [];
            showAlert("success", `Fetched ${response.data.count} requisition${response.data.count !== 1 ? 's' : ''}`);
        }
    } catch (error) {
        console.error("Error fetching requisitions:", error);
        showAlert("error", error.response?.data?.message || error.message || "Error fetching requisitions");
    } finally {
        isLoadingItems.value = false;
    }
};

const requisitionTotal = computed(() => {
    if (!selectedRequisition.value) return 0;

    return selectedRequisition.value.items.reduce((sum, reqItem) => {
        const materialsTotal = reqItem.materials.reduce((mSum, m) => {
            return mSum + (Number(m.quantity) * Number(m.rate));
        }, 0);
        return sum + materialsTotal;
    }, 0);
});

// Offcanvas Functions
const openPreview = async (item, itemIndex) => {
    switch (item.itemable_type?.value) {
        case 'INVOICE':
            showAlert('info', 'Previewing Invoices...');
            break;
        case 'REQUISITION':
            {
                if (!item.search) {
                    showAlert('warning', 'Please enter a search term first');
                    return;
                }

                // Perform fresh search
                await fetchRequisitions(item.search);

                const idToFind = item.selected_item?.id || item.itemable || item.itemable_id;
                // try to find by id (loose equality to allow string/number mismatch)
                let req = idToFind !== undefined && idToFind !== null
                    ? requisitions.value.find(r => r.id == idToFind)
                    : null;

                // If not found but search returned exactly one result, use that
                if (!req && requisitions.value && requisitions.value.length === 1) {
                    req = requisitions.value[0];
                }

                if (req) {
                    item.selected_item = req;
                    item.preview_data = req;
                    currentItemIndex.value = itemIndex;
                    previewRequisition.value = true;
                } else {
                    showAlert('warning', 'Requisition not found. Try re-searching or select the requisition first.');
                }
            }
            break;
        case 'ORDER':
            showAlert('info', 'Previewing Orders...');
            break;
        case 'CONTRACT':
            showAlert('info', 'Previewing Contacts...');
            break;
        case 'JOURNAL_VOUCHER':
            showAlert('info', 'Previewing Journal Vouchers...');
            break;
        default:
            break;
    }
};

const closePreview = (item) => {
    switch (item.itemable_type?.value) {
        case 'INVOICE':
            showAlert('info', 'Previewing Invoices...');
            break;
        case 'REQUISITION':
            previewRequisition.value = false;
            currentItemIndex.value = null;
            break;
        case 'ORDER':
            showAlert('info', 'Previewing Orders...');
            break;
        case 'CONTRACT':
            showAlert('info', 'Previewing Contacts...');
            break;
        case 'JOURNAL_VOUCHER':
            showAlert('info', 'Previewing Journal Vouchers...');
            break;
        default:
            break;
    }
};

const getAvailableCount = (item) =>
    getItemableOptions(item.itemable_type?.value).length;

// Auto-fill payee name when accountable is selected
const onAccountableSelected = (party, selectedAccountable) => {
    if (selectedAccountable && !party.payee_name) {
        party.payee_name = selectedAccountable.name ||
            selectedAccountable.full_name ||
            selectedAccountable.company_name ||
            '';
    }
};

// Get placeholder for payee name
const getPayeeNamePlaceholder = (party) => {
    if (party.role?.value === 'PAYEE') return 'Payee name';
    if (party.role?.value === 'PAYER') return 'Payer name';
    if (party.role?.value === 'BENEFICIARY') return 'Beneficiary name';
    if (party.role?.value === 'REPLENISHMENT') return 'Replenishment name';
    return 'Name';
};

const handleAccountableTypeChange = (party, index) => {
    party.payee_name = '';
    party.accountable = '';
};

// Validate form
const validateForm = () => {
    // Validate required fields
    if (!paymentForm.value.currency) {
        showAlert('warning', 'Please select a currency');
        return false;
    }

    // Validate transaction type
    if (!paymentForm.value.transaction_type) {
        showAlert('warning', 'Please select a transaction type');
        return false;
    }

    // Validate at least one payer and one payee for applicable transaction types
    if (paymentForm.value.transaction_type?.value !== 'CASH_REPLENISHMENT') {
        const hasPayer = paymentForm.value.parties.some(p => p.role.value === 'PAYER');
        if (!hasPayer) {
            showAlert('warning', 'At least one PAYER is required');
            return false;
        }

        if (paymentForm.value.transaction_type?.value !== 'STAFF_ADVANCE') {
            const hasPayee = paymentForm.value.parties.some(p => p.role.value === 'PAYEE');
            if (!hasPayee) {
                showAlert('warning', 'At least one PAYEE is required');
                return false;
            }
        }
    }

    // Validate parties
    for (const [index, party] of paymentForm.value.parties.entries()) {
        if (party.accountable_type !== 'OTHER' && !party.accountable) {
            showAlert('warning', `Please select an accountable for party ${index + 1}`);
            return false;
        }
    }

    // Validate items
    for (const [index, item] of paymentForm.value.items.entries()) {
        if (!item.selected_item && !item.itemable) {
            showAlert('warning', `Please select an item for payment item ${index + 1}`);
            return false;
        }
        if (item.amount <= 0) {
            showAlert('warning', `Amount must be greater than 0 for item ${index + 1}`);
            return false;
        }
        if (!item.currency) {
            showAlert('warning', `Please select a currency for item ${index + 1}`);
            return false;
        }
    }
    // Additional validations can be added here
    return true;
};

// Submit form
const submitForm = async () => {
    if (!canCreatePaymentAdvice.value) {
        showAlert('error', 'You do not have permission to create payment advice');
        return;
    }

    // Validate form before submission
    if (!validateForm()) {
        return;
    }

    // Prepare data for submission
    const submitData = {
        user_id: userId.value,
        date: paymentForm.value.date,

        transaction_type: paymentForm.value.transaction_type?.value,
        status: paymentForm.value.status?.value,

        currency_id: paymentForm.value.currency?.id,
        exchange_rate: paymentForm.value.exchange_rate,
        remarks: paymentForm.value.remarks,

        parties: paymentForm.value.parties?.map(p => ({
            role: p.role.value,
            accountable_type: p.accountable_type.value,
            account_id:
                p.accountable_type.value === 'OTHER'
                    ? null
                    : p.accountable.id,
            // other_accountable: p.other_accountable || null,
            payee_name: p.payee_name,
            cheque_number: p.cheque_number,
            control_number: p.control_number,
            narration: p.narration,
        })),

        items: paymentForm.value.items?.map(i => ({
            itemable_type: i.itemable_type.value,
            itemable_id: i.selected_item?.id || (i.itemable?.id || i.itemable),
            currency_id: i.currency?.id || i.currency,
            amount: i.amount,
            description: i.description,
        })),
    };

    try {
        isSaving.value = true;
        const response = await axios.post(`${BASE_URL}/payment-advices/create`, submitData);

        if (response.data.success) {
            showAlert('success', 'Payment advice created successfully');

            // Reset form
            resetForm();

            // Redirect to payment advice list or view
            // setTimeout(() => {
            //     router.push('/accounts/payment-advices');
            // }, 2000);
        } else {
            showAlert('error', response.data.message || 'Failed to create payment advice');
        }
    } catch (error) {
        console.error('Error creating payment advice:', error);
        if (error.response?.data?.errors) {
            const errors = Object.values(error.response.data.errors).flat();
            showAlert('error', errors.join('<br>'));
        } else {
            showAlert('error', error.response?.data?.message || 'Error creating payment advice');
        }
    } finally {
        isSaving.value = false;
    }
};

// Reset form
const resetForm = () => {
    paymentForm.value = {
        user_id: userId.value,
        date: getToday(),
        transaction_type: '',
        status: [
            {
                value: 'DRAFT',
                label: 'Draft',
            }
        ],
        currency: currencies.value[0]?.id || '',
        exchange_rate: 1,
        remarks: '',
        parties: [
            {
                role: partyRoles.value.find(r => r.value === 'PAYER') || null,
                accountable_type: accountableTypes.value.find(a => a.value === 'ENTITY') || null,
                accountable: '',
                payee_name: '',
                cheque_number: '',
                control_number: '',
                narration: ''
            },
        ],
        items: [
            {
                itemable_type: itemableTypes.value.find(i => i.value === 'REQUISITION') || null,
                itemable: null,
                selected_item: null,
                preview_data: null,
                search: '',
                description: '',
                currency: currencies.value[0] || null,
                amount: 0
            }
        ],
    };
};

// Watch transaction type to adjust form
watch(() => paymentForm.value.transaction_type?.value, (newType) => {
    // Reset parties based on transaction type
    if (newType === 'CASH_REPLENISHMENT') {
        paymentForm.value.parties = [
            {
                role: partyRoles.value.find(r => r.value === 'REPLENISHMENT'),
                accountable_type: accountableTypes.value.find(a => a.value === 'ENTITY'),
                accountable: '',
                payee_name: '',
                cheque_number: '',
                control_number: '',
                narration: ''
            }
        ];
    } else if (newType === 'STAFF_ADVANCE') {
        paymentForm.value.parties = [
            {
                role: partyRoles.value.find(r => r.value === 'PAYER'),
                accountable_type: accountableTypes.value.find(a => a.value === 'ENTITY'),
                accountable: '',
                payee_name: '',
                cheque_number: '',
                control_number: '',
                narration: ''
            },
            {
                role: partyRoles.value.find(r => r.value === 'PAYEE'),
                accountable_type: accountableTypes.value.find(a => a.value === 'EMPLOYEE'),
                accountable: '',
                payee_name: '',
                cheque_number: '',
                control_number: '',
                narration: ''
            }
        ];
    } else {
        paymentForm.value.parties = [
            {
                role: partyRoles.value.find(r => r.value === 'PAYER'),
                accountable_type: accountableTypes.value.find(a => a.value === 'ENTITY'),
                accountable: '',
                payee_name: '',
                cheque_number: '',
                control_number: '',
                narration: ''
            },
            {
                role: partyRoles.value.find(r => r.value === 'PAYEE'),
                accountable_type: accountableTypes.value.find(a => a.value === 'ENTITY'),
                accountable: '',
                payee_name: '',
                cheque_number: '',
                control_number: '',
                narration: ''
            }
        ];
    }

    // Reset items for certain transaction types
    if (newType === 'STAFF_ADVANCE') {
        paymentForm.value.items = [
            {
                itemable_type: itemableTypes.value.find(i => i.value === 'JOURNAL_VOUCHER'),
                itemable: '',
                selected_item: null,
                preview_data: null,
                description: '',
                currency: paymentForm.value.currency,
                amount: 0
            }
        ];
    }
});

// Watch accountable_type changes
watch(() => paymentForm.value.parties, (newParties) => {
    newParties.forEach(party => {
        if (party.accountable_type.value === 'OTHER') {
            // Clear accountable dropdown for OTHER type
            party.accountable = '';
        }
    });
}, { deep: true });

// Initialize
onMounted(async () => {
    paymentForm.value.date = getToday();

    try {
        isLoading.value = true;
        await Promise.all([
            fetchFormData(),
            fetchEntities(),
            fetchCurrencies(),
        ]);
    } catch (error) {
        console.error("Error initializing form:", error);
        showAlert("error", "Error initializing form");
    } finally {
        isLoading.value = false;
    }
});
</script>

<template>
    <div class="d-flex justify-content-between align-items-center ">
        <div class="header-content">
            <nav aria-label="breadcrumb">
                <ol class="breadcrumb ">
                    <li class="breadcrumb-item">
                        <router-link to="#" class="text-decoration-none">ACCOUNTS</router-link>
                    </li>
                    <li class="breadcrumb-item"><router-link to="#">PAYMENT ADVICE</router-link></li>
                    <li class="breadcrumb-item active">CREATE</li>
                </ol>
            </nav>
        </div>
        <button @click="goBack" class="btn btn-secondary px-3 mb-2">
            <i class="fas fa-arrow-left me-2"></i>Back
        </button>
    </div>

    <NormalCard>
        <CardHeader>
            <h4 class="text-primary mb-0">
                <i class="fas fa-file-invoice-dollar text-primary me-1"></i>
                Create Payment Advice
            </h4>
        </CardHeader>

        <CardBody>
            <div v-if="isLoading" class="text-center py-5">
                <Loading :colorClass="'text-primary'" :loaderType="'border'" :size="'md'" :text="'Loading data...'" />
            </div>

            <div v-else>
                <form @submit.prevent="submitForm">
                    <!-- Main Details Section -->
                    <div class="row mb-4">
                        <!-- <div class="col-md-12">
                            <h5 class="text-primary mb-3">
                                <i class="fas fa-info-circle me-2"></i>
                                Main Details
                            </h5>
                        </div> -->

                        <div class="col-md-3">
                            <label class="form-label required">
                                <i class="fas fa-calendar-day text-primary me-1"></i>
                                Date
                            </label>
                            <Datepicker v-model="paymentForm.date" :required="true" />
                        </div>

                        <div class="col-md-3">
                            <label class="form-label required">
                                <i class="fas fa-exchange-alt text-purple me-1"></i>
                                Transaction Type
                            </label>
                            <StandardVueSelect v-model="paymentForm.transaction_type" :options="transactionTypes || []"
                                placeholder="Select Transaction Type" :required="true" />
                        </div>

                        <div class="col-md-3">
                            <label class="form-label">
                                <i class="fas fa-tag text-warning me-1"></i>
                                Status
                            </label>
                            <StandardVueSelect v-model="paymentForm.status" :options="statusOptions || []"
                                placeholder="Select Status" />
                        </div>

                        <div class="col-md-3">
                            <label class="form-label required">
                                <i class="fas fa-money-bill-wave text-success me-1"></i>
                                Currency
                            </label>
                            <StandardVueSelect v-model="paymentForm.currency" :options="currencies" label="name"
                                placeholder="Select Currency" :required="true" />
                        </div>

                        <div class="col-md-3 mt-3">
                            <label class="form-label">
                                <i class="fas fa-percentage text-danger me-1"></i>
                                Exchange Rate
                            </label>
                            <input type="number" v-model="paymentForm.exchange_rate" class="form-control"
                                placeholder="1.000000" step="0.000001" min="0" />
                            <small class="form-text text-muted">Rate for foreign currency</small>
                        </div>

                        <div class="col-md-9 mt-3">
                            <label class="form-label required">
                                <i class="fas fa-sticky-note text-muted me-1"></i>
                                Remarks
                            </label>
                            <textarea v-model="paymentForm.remarks" class="form-control" rows="2"
                                placeholder="Enter remarks or notes..."></textarea>
                        </div>
                    </div>

                    <!-- Parties Section -->
                    <div class="row mb-2">
                        <div class="col-md-12 d-flex justify-content-between align-items-center mb-2">
                            <h5 class="text-primary mb-0">
                                <i class="fas fa-users me-1"></i>
                                Parties Involved
                            </h5>
                            <button type="button" @click="addParty" class="btn btn-sm btn-outline-primary">
                                <i class="fas fa-user-plus me-1"></i> Add Party
                            </button>
                        </div>

                        <div class="col-md-12">
                            <div v-for="(party, index) in paymentForm.parties" :key="index"
                                class="card mb-3 border-left-info">
                                <CardHeader
                                    class="card-header bg-light d-flex justify-content-between align-items-center">
                                    <div>
                                        <span class="text-muted">
                                            <i class="fas fa-user me-1"></i>
                                            Party #{{ index + 1 }}
                                        </span>
                                    </div>

                                    <button v-if="paymentForm.parties.length > 1" type="button"
                                        @click="removeParty(index)" class="btn btn-sm btn-outline-danger"
                                        title="Remove party">
                                        <i class="fas fa-trash me-1"></i> Remove
                                    </button>
                                </CardHeader>
                                <CardBody>
                                    <div class="row mb-0">
                                        <!-- Role -->
                                        <div class="col-md-4 mb-2">
                                            <label class="form-label required">
                                                <i class="fas fa-id-badge text-muted me-1"></i>
                                                Role
                                            </label>
                                            <StandardVueSelect v-model="party.role" :options="partyRoles || []"
                                                placeholder="Select Role" :required="true" label="label" />
                                        </div>

                                        <!-- Type -->
                                        <div class="col-md-4 mb-2">
                                            <label class="form-label required">
                                                <i class="fas fa-cube text-lime me-1"></i>
                                                Type
                                            </label>
                                            <StandardVueSelect v-model="party.accountable_type"
                                                :options="accountableTypes || []" placeholder="Select Type"
                                                label="label" :required="true"
                                                @change="handleAccountableTypeChange(party, index)" />
                                        </div>

                                        <!-- Accountable -->
                                        <div class="col-md-4 mb-2">
                                            <label class="form-label required">
                                                <i class="fas fa-user text-muted me-1"></i>
                                                Accountable
                                            </label>
                                            <!-- For ENTITY, EMPLOYEE, SUBCONTRACTOR: Show dropdown -->
                                            <StandardVueSelect
                                                v-if="['ENTITY', 'EMPLOYEE', 'SUBCONTRACTOR'].includes(party.accountable_type?.value)"
                                                v-model="party.accountable"
                                                :options="getAccountableOptions(party.accountable_type?.value)"
                                                label="name" :placeholder="`Select ${party.accountable_type?.label}`"
                                                :required="true"
                                                @option-selected="(opt) => onAccountableSelected(party, opt)" />

                                            <!-- For OTHER: Show text input -->
                                            <input v-else-if="party.accountable_type?.value === 'OTHER'" type="text"
                                                v-model="party.accountable" class="form-control"
                                                placeholder="Enter description (e.g., 'Cash Payment', 'Miscellaneous')"
                                                :required="true" />
                                        </div>

                                        <!-- Payee Name -->
                                        <div class="col-md-4 mb-2">
                                            <label class="form-label">
                                                <i class="fas fa-user-tie text-muted me-1"></i>
                                                {{ getPayeeNamePlaceholder(party) }}
                                            </label>
                                            <input type="text" v-model="party.payee_name" class="form-control"
                                                :placeholder="getPayeeNamePlaceholder(party)" />
                                        </div>

                                        <!-- Cheque Number -->
                                        <div class="col-md-4 mb-2">
                                            <label class="form-label">
                                                <i class="fas fa-file-check text-muted me-1"></i>
                                                Cheque
                                                <i class="fas fa-hashtag text-indigo me-1"></i>
                                            </label>
                                            <input type="text" v-model="party.cheque_number" class="form-control"
                                                placeholder="Enter cheque number" />
                                        </div>

                                        <!-- Control Number -->
                                        <div class="col-md-4 mb-2">
                                            <label class="form-label">
                                                <i class="fas fa-barcode text-muted me-1"></i>
                                                Control Number
                                            </label>
                                            <input type="text" v-model="party.control_number" class="form-control"
                                                placeholder="Enter control number" />
                                        </div>

                                        <!-- Narration -->
                                        <div class="col-md-12 mb-0">
                                            <label class="form-label">
                                                <i class="fas fa-align-left text-muted me-1"></i>
                                                Narration
                                            </label>
                                            <textarea v-model="party.narration" class="form-control" rows="2"
                                                placeholder="Enter any additional notes or remarks...">
                                            </textarea>
                                        </div>

                                        <!-- Party Summary -->
                                        <!-- <div class="col-md-12">
                                            <div class="alert alert-info mb-0">
                                                <small>
                                                    <strong>Summary:</strong>
                                                    {{ party.role.value || 'No role' }} |
                                                    {{ party.accountable_type || 'No type' }} |
                                                    <strong>
                                                        {{ party.payee_name || party.accountable || 'Not selected' }}
                                                    </strong>
                                                </small>
                                            </div>
                                        </div> -->
                                    </div>
                                </CardBody>
                            </div>
                        </div>
                    </div>

                    <!-- Items Section -->
                    <div class="row mb-2">
                        <div class="col-md-12 d-flex justify-content-between align-items-center mb-2">
                            <h5 class="text-primary mb-0">
                                <i class="fas fa-list-alt me-1"></i>
                                Payment Items
                                <span class="badge bg-primary ms-2">
                                    Total: {{ formatAmount(totalAmount) }}
                                    (Base: {{ formatAmount(totalBaseAmount) }})
                                </span>
                            </h5>
                            <button type="button" @click="addItem" class="btn btn-sm btn-outline-primary">
                                <i class="fas fa-plus me-1"></i> Add Item
                            </button>
                        </div>

                        <div class="col-md-12">
                            <div v-for="(item, index) in paymentForm.items" :key="index"
                                class="card mb-3 border-left-primary">
                                <CardHeader
                                    class="card-header bg-light d-flex justify-content-between align-items-center">
                                    <span class="text-muted">Item #{{ index + 1 }}</span>
                                    <button v-if="paymentForm.items.length > 1" type="button" @click="removeItem(index)"
                                        class="btn btn-sm btn-outline-danger" title="Remove item">
                                        <i class="fas fa-trash me-1"></i> Remove
                                    </button>
                                </CardHeader>
                                <CardBody class="mb-0">
                                    <div class="row">
                                        <div class="row">

                                            <!-- Item Type -->
                                            <div :class="[
                                                'mb-2',
                                                getAvailableCount(item) >= 1 ? 'col-md-5' : 'col-md-6'
                                            ]">
                                                <label class="form-label required">
                                                    <i class="fas fa-cube text-muted me-1"></i>
                                                    Item Type
                                                </label>
                                                <StandardVueSelect v-model="item.itemable_type"
                                                    :options="itemableTypes || []" placeholder="Select Type"
                                                    :required="true" @change="updateItemOptions(item)" />
                                            </div>

                                            <!-- Item Search -->
                                            <div :class="[
                                                'mb-2',
                                                getAvailableCount(item) >= 1 ? 'col-md-5' : 'col-md-6'
                                            ]">
                                                <label class="form-label required">
                                                    <i class="fas fa-search text-info me-1"></i>
                                                    Search {{ item.itemable_type?.label || 'Item' }}
                                                </label>

                                                <div class="input-group">
                                                    <input type="text" class="form-control" v-model="item.search"
                                                        :placeholder="`Enter ${item.itemable_type?.label || 'Item'} ID...`"
                                                        @keydown.enter="handleItemSearch(item, item.search)" />

                                                    <button class="btn btn-outline-secondary" type="button"
                                                        @click="handleItemSearch(item, item.search)"
                                                        :disabled="isLoadingItems">
                                                        <span v-if="isLoadingItems">
                                                            <i class="fas fa-spinner fa-spin"></i>
                                                        </span>
                                                        <span v-else>
                                                            <i class="fas fa-search"></i>
                                                        </span>
                                                    </button>
                                                </div>

                                                <small class="form-text text-muted d-block mt-1">
                                                    Available items: {{ getAvailableCount(item) }}
                                                </small>
                                            </div>

                                            <!-- Preview Button -->
                                            <div v-if="getAvailableCount(item) >= 1"
                                                class="col-md-2 mb-auto mt-auto d-flex align-items-end">
                                                <button type="button" class="btn btn-outline-primary w-100"
                                                    @click="openPreview(item, index)">
                                                    <i class="fas fa-eye me-1"></i>
                                                    Preview
                                                </button>
                                            </div>
                                        </div>

                                        <!-- Description -->
                                        <div class="col-md-4 mb-2">
                                            <label class="form-label">
                                                <i class="fas fa-align-left text-muted me-1"></i>
                                                Description
                                            </label>
                                            <input type="text" v-model="item.description" class="form-control"
                                                placeholder="Item description" />
                                        </div>

                                        <!-- Currency -->
                                        <div class="col-md-4 mb-2">
                                            <label class="form-label required">
                                                <i class="fas fa-money-bill-wave text-success me-1"></i>
                                                Currency
                                            </label>
                                            <StandardVueSelect v-model="item.currency" :options="currencies"
                                                label="name" placeholder="Select Currency" :required="true" />
                                        </div>

                                        <!-- Amount -->
                                        <div class="col-md-4 mb-2">
                                            <label class="form-label required">
                                                <i class="fas fa-calculator text-danger me-1"></i>
                                                Amount
                                            </label>
                                            <input type="number" v-model="item.amount" class="form-control"
                                                placeholder="0.00" step="0.01" min="0.01" required />
                                        </div>

                                        <!-- Selected Item Display -->
                                        <div class="col-md-12 mb-2">
                                            <label class="form-label required">
                                                <i class="fas fa-check-circle text-success me-1"></i>
                                                Selected {{ item.itemable_type?.label || 'Item' }}
                                            </label>
                                            <div class="form-control-static p-2 bg-light rounded border"
                                                style="min-height: 38px;">
                                                <span v-if="item.selected_item">
                                                    <strong>{{ item.selected_item?.name || item.selected_item?.requisition_reference || 'Selected' }}</strong>
                                                    <small class="text-muted d-block">ID: {{ item.selected_item?.id }}</small>
                                                </span>
                                                <span v-else-if="item.itemable">
                                                    <strong>{{ getItemableOptions(item.itemable_type).find(o => o.id === item.itemable)?.name || 'Loading...' }}</strong>
                                                    <small class="text-muted d-block">ID: {{ item.itemable }}</small>
                                                </span>
                                                <span v-else class="text-muted fst-italic">
                                                    <i class="fas fa-exclamation-triangle text-warning me-1"></i>
                                                    No {{ item.itemable_type?.label || 'Item' }} selected
                                                </span>
                                            </div>
                                        </div>

                                        <!-- Item Summary -->
                                        <div class="col-md-12">
                                            <div class="alert alert-info mb-0">
                                                <small>
                                                    <strong>Summary:</strong>
                                                    Amount in {{currencies.find(c => c.id === item.currency?.id)?.name
                                                        || 'currency'}}:
                                                    <strong class="text-success">
                                                        {{ formatAmount(item.amount) }}
                                                    </strong>
                                                </small>
                                            </div>
                                        </div>
                                    </div>
                                </CardBody>
                            </div>
                        </div>
                    </div>

                    <!-- Summary Section -->
                    <div class="row mb-4">
                        <div class="col-md-12">
                            <Card class="card border-primary">
                                <CardHeader class="bg-primary bg-opacity-10">
                                    <h6 class="mb-0 text-primary">
                                        <i class="fas fa-calculator me-1"></i>
                                        Payment Summary
                                    </h6>
                                </CardHeader>
                                <CardBody>
                                    <div class="row">
                                        <div class="col-md-3">
                                            <div class="d-flex justify-content-between mb-2">
                                                <span>Total Items:</span>
                                                <strong>{{ paymentForm.items.length }}</strong>
                                            </div>
                                        </div>
                                        <div class="col-md-3">
                                            <div class="d-flex justify-content-between mb-2">
                                                <span>Total Amount:</span>
                                                <strong>{{ formatAmount(totalAmount) }}</strong>
                                            </div>
                                        </div>
                                        <div class="col-md-3">
                                            <div class="d-flex justify-content-between mb-2">
                                                <span>Exchange Rate:</span>
                                                <strong>{{ formatAmount(paymentForm.exchange_rate) }}</strong>
                                            </div>
                                        </div>
                                        <div class="col-md-3">
                                            <div class="d-flex justify-content-between mb-2">
                                                <span>Base Amount:</span>
                                                <strong class="text-success">
                                                    {{ formatAmount(totalBaseAmount) }}
                                                </strong>
                                            </div>
                                        </div>
                                    </div>
                                </CardBody>
                            </Card>
                        </div>
                    </div>
                </form>

                <!-- Form Actions -->
                <CardFooter class="sticky-xl-bottom">
                    <div class="d-flex justify-content-between">
                        <button type="button" @click="goBack" class="btn btn-danger px-4 me-2">
                            <i class="fas fa-times me-1"></i>
                            Cancel
                        </button>
                        <button type="submit" class="btn btn-success px-4" @click="submitForm"
                            :disabled="isSaving || !canCreatePaymentAdvice">
                            <span v-if="isSaving" class="">
                                <i class="fas fa-spinner fa-spin me-1"></i>
                                Saving...
                            </span>
                            <span v-else>
                                <i class="fas fa-save me-1"></i>
                                Save Payment Advice
                            </span>
                        </button>
                    </div>
                </CardFooter>
            </div>
        </CardBody>
    </NormalCard>

    <!-- BEGIN Offcanvas -->
    <StandardOffcanvas v-model="previewRequisition" position="right" width="420px" title="Requisition Preview">
        <div v-if="paymentForm.items[currentItemIndex]?.preview_data" class="row g-3">

            <!-- Header Info -->
            <div class="col-12">
                <div class="border rounded p-3 bg-light">
                    <div class="fw-bold text-primary mb-1">
                        {{ paymentForm.items[currentItemIndex].preview_data?.requisition_type?.name }}
                    </div>

                    <small class="text-muted d-block">
                        Requisition ID: #{{ paymentForm.items[currentItemIndex].preview_data?.id }}
                    </small>

                    <span class="badge bg-warning text-dark mt-2">
                        {{ paymentForm.items[currentItemIndex].preview_data?.status_label }}
                    </span>
                </div>
            </div>

            <!-- Meta -->
            <div class="col-12">
                <ul class="list-group list-group-flush">
                    <li class="list-group-item px-0">
                        <strong>Requested By:</strong>
                        {{ paymentForm.items[currentItemIndex].preview_data?.user?.first_name }}
                        {{ paymentForm.items[currentItemIndex].preview_data?.user?.last_name }}
                    </li>

                    <li class="list-group-item px-0">
                        <strong>Required Date:</strong>
                        {{ new Date(paymentForm.items[currentItemIndex].preview_data?.required_date).toLocaleDateString() }}
                    </li>

                    <li class="list-group-item px-0">
                        <strong>Fund Direction:</strong>
                        <span class="badge bg-info">
                            {{ paymentForm.items[currentItemIndex].preview_data?.fund_direction }}
                        </span>
                    </li>
                </ul>
            </div>

            <!-- Items -->
            <div class="col-12">
                <h6 class="text-primary">
                    <i class="fas fa-boxes me-1"></i>
                    Items
                </h6>

                <div v-for="(reqItem, i) in paymentForm.items[currentItemIndex].preview_data?.items" :key="i" class="border rounded p-2 mb-2">
                    <div v-for="(mat, m) in reqItem.materials" :key="m" class="mb-2">
                        <div class="fw-semibold">
                            {{ mat.item?.name }}
                        </div>

                        <small class="text-muted d-block">
                            {{ mat.quantity }} × {{ formatAmount(mat.rate) }}
                            {{ reqItem.currency?.symbol }}
                        </small>

                        <div class="text-success fw-bold">
                            {{ formatAmount(mat.quantity * mat.rate) }}
                            {{ reqItem.currency?.symbol }}
                        </div>
                    </div>
                </div>
            </div>

            <!-- Total -->
            <div class="col-12">
                <div class="alert alert-success mb-0">
                    <div class="d-flex justify-content-between">
                        <span><strong>Total Amount</strong></span>
                        <strong>{{ formatAmount(paymentForm.items[currentItemIndex].preview_data?.items?.reduce((sum, reqItem) => {
                            const materialsTotal = reqItem.materials.reduce((mSum, m) => {
                                return mSum + (Number(m.quantity) * Number(m.rate));
                            }, 0);
                            return sum + materialsTotal;
                        }, 0) || 0) }}</strong>
                    </div>
                </div>
            </div>

        </div>

        <div v-else class="text-muted text-center p-3">
            <EmptyState :title="'No requisition selected!'"
                :subtitle="'Try to re-search Requisition or re-select Requisition.'"
                :icon="'fa-solid fa-exclamation-triangle'" :colorClass="'text-warning'" :showButton="false" />
        </div>

        <template #footer>
            <button class="btn btn-outline-danger w-100" @click="previewRequisition = false">
                <i class="fas fa-times me-1"></i> Close
            </button>
        </template>
    </StandardOffcanvas>

</template>

<style scoped>
.form-label {
    font-weight: 500;
    margin-bottom: 0.5rem;
}

/* Style for OTHER type input */
input[type="text"].form-control {
    min-height: 38px;
}

.form-label.required:after {
    content: " *";
    color: #dc3545;
}

/* Item Card Styles */
.card.border-left-primary {
    border-left: 4px solid #0d6efd !important;
    box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
}

.card.border-left-primary:hover {
    box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);
}

.card.border-left-info {
    border-left: 4px solid #0dcaf0 !important;
    box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
}

.card.border-left-info:hover {
    box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);
}

.form-control-static {
    display: block;
    padding: 0.5rem 0.75rem;
    color: #212529;
}
</style>