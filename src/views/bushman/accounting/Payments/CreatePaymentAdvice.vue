<script setup>
import { ref, onMounted, computed, watch } from 'vue';
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

// Reactive Variables
const formData = ref({});
const currencies = ref([]);
const companies = ref([]);
const accounts = ref([]);
const entities = ref([]);
const employees = ref([]);
const subcontractors = ref([]);
const invoices = ref([]);
const requisitions = ref([]);
const orders = ref([]);
const contracts = ref([]);
const journalVouchers = ref([]);

// Loading States
const isSaving = ref(false);
const isLoading = ref(false);

// Form Data
const paymentForm = ref({
    user_id: userId.value,
    date: '',
    transaction_type: '',
    status: 'DRAFT',
    currency_id: '',
    exchange_rate: 1,
    remarks: '',

    // Parties array
    parties: [
        {
            role: 'PAYER',
            accountable_type: 'ENTITY',
            accountable_id: '', // This will store the model ID (Entity ID, Employee ID, etc.)
            account_id: '', // This is for bank/account reference (optional)
            payee_name: '',
            cheque_number: '',
            control_number: '',
            narration: ''
        },
        {
            role: 'PAYEE',
            accountable_type: 'ENTITY',
            accountable_id: '', // This will store the model ID
            account_id: '', // This is for bank/account reference (optional)
            payee_name: '',
            cheque_number: '',
            control_number: '',
            narration: ''
        }
    ],

    // Items array
    items: [
        {
            itemable_type: 'INVOICE',
            itemable_id: '',
            description: '',
            currency_id: '',
            amount: 0
        }
    ],

    // Journal vouchers (optional)
    journal_vouchers: []
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

// Fetch Form Options
const fetchFormData = async () => {
    try {
        const response = await axios.get(`${BASE_URL}/payment-advices/form-data`);
        if (response.data && response.data.success === true) {
            formData.value = response.data.form_data || {};
        }
    } catch (error) {
        console.error("Error fetching Form Options:", error);
        showAlert("error", error.response?.data?.message || error.message || "Error fetching Form Options");
    }
};

// Fetch all required data
const fetchAllData = async () => {
    try {
        const endpoints = [
            `${BASE_URL}/settings/currencies`,
            // `${BASE_URL}/companies`,
            // `${BASE_URL}/accounts`,
            `${BASE_URL}/entities/drop-downs`,
            // `${BASE_URL}/employees`,
            // `${BASE_URL}/subcontractors`,
            // `${BASE_URL}/invoices/unpaid`,
            `${BASE_URL}/requisitions/pending`,
            // `${BASE_URL}/orders/pending`,
            // `${BASE_URL}/contracts/active`,
            // `${BASE_URL}/journal-vouchers/open`
        ];

        const responses = await Promise.all(endpoints.map(url => axios.get(url)));

        currencies.value = responses[0].data.map(currency => ({
            id: currency.id,
            name: currency.name || currency.currency_name || `${currency.symbol} (${currency.code})`,
            symbol: currency.symbol,
            code: currency.code || currency.name
        })) || [];
        // companies.value = responses[1].data || [];
        // accounts.value = responses[2].data || [];
        entities.value = responses[3].data || [];
        // employees.value = responses[4].data || [];
        // subcontractors.value = responses[5].data || [];
        // invoices.value = responses[6].data || [];
        requisitions.value = responses[7].data || [];
        // orders.value = responses[8].data || [];
        // contracts.value = responses[9].data || [];
        // journalVouchers.value = responses[10].data || [];

        // Set initial values
        if (currencies.value.length > 0) {
            paymentForm.value.currency_id = currencies.value[0].id;
            // Set currency for items
            paymentForm.value.items.forEach(item => {
                item.currency_id = currencies.value[0].id;
            });
        }

    } catch (error) {
        console.error("Error fetching data:", error);
        showAlert("error", "Error fetching required data");
    }
};

// Add party row
const addParty = () => {
    paymentForm.value.parties.unshift({
        role: 'PAYEE',
        accountable_type: 'ENTITY',
        accountable_id: '', // Model ID
        account_id: '', // Bank/account reference
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
    paymentForm.value.items.unshift({
        itemable_type: 'INVOICE',
        itemable_id: '',
        description: '',
        currency_id: paymentForm.value.currency_id,
        amount: 0
    });
};

// Remove item row
const removeItem = (index) => {
    if (paymentForm.value.items.length > 1) {
        paymentForm.value.items.splice(index, 1);
    }
};

// Update item when itemable type changes
const updateItemOptions = (item) => {
    item.itemable_id = '';
    item.description = '';
    item.amount = 0;
};

// Calculate total amount
const totalAmount = computed(() => {
    return paymentForm.value.items.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);
});

// Calculate total in base currency
const totalBaseAmount = computed(() => {
    return totalAmount.value * paymentForm.value.exchange_rate;
});

// Filter accounts based on party type
const getFilteredAccounts = (party) => {
    if (party.role === 'PAYER') {
        // For payer, show bank and cash accounts
        return accounts.value.filter(acc =>
            acc.account_type === 'BANK' || acc.account_type === 'CASH'
        );
    }
    return accounts.value;
};

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

// Auto-fill item details when itemable is selected
const onItemableSelected = (item, selectedItem) => {
    if (selectedItem) {
        item.description = selectedItem.description || selectedItem.reference || '';
        item.amount = selectedItem.amount || selectedItem.total_amount || 0;

        // Auto-fill currency if not set
        if (!item.currency_id && selectedItem.currency_id) {
            item.currency_id = selectedItem.currency_id;
        }
    }
};

// Auto-fill payee name when accountable is selected
const onAccountableSelected = (party, selectedAccountable) => {
    if (selectedAccountable && !party.payee_name) {
        party.payee_name = selectedAccountable.name ||
            selectedAccountable.full_name ||
            selectedAccountable.company_name ||
            '';
    }
};

// Handle OTHER accountable type
const handleOtherAccountable = (party) => {
    if (party.accountable_type === 'OTHER') {
        // For OTHER type, allow free text input for accountable_id
        party.accountable_id = party.accountable_id || ''; // Can be string or null
    }
};

// Get placeholder for payee name
const getPayeeNamePlaceholder = (party) => {
    if (party.role === 'PAYEE') return 'Payee name';
    if (party.role === 'PAYER') return 'Payer name';
    if (party.role === 'BENEFICIARY') return 'Beneficiary name';
    if (party.role === 'REPLENISHMENT') return 'Replenishment name';
    return 'Name';
};

const handleAccountableTypeChange = (party, index) => {
    // Clear accountable_id when type changes
    party.accountable_id = '';
    party.payee_name = '';
    party.account_id = '';
};

// Handle when account is selected (for ACCOUNT type)
const onAccountSelected = (party, selectedAccount) => {
    if (selectedAccount && !party.payee_name) {
        party.payee_name = selectedAccount.account_name || selectedAccount.name || '';
    }
};

// Submit form
const submitForm = async () => {
    if (!canCreatePaymentAdvice.value) {
        showAlert('error', 'You do not have permission to create payment advice');
        return;
    }

    // Validate required fields
    if (!paymentForm.value.currency_id) {
        showAlert('error', 'Please select a currency');
        return;
    }

    // Validate transaction type
    if (!paymentForm.value.transaction_type) {
        showAlert('error', 'Please select a transaction type');
        return;
    }

    // Validate at least one payer and one payee for applicable transaction types
    if (paymentForm.value.transaction_type !== 'CASH_REPLENISHMENT') {
        const hasPayer = paymentForm.value.parties.some(p => p.role === 'PAYER');
        if (!hasPayer) {
            showAlert('error', 'At least one PAYER is required');
            return;
        }

        if (paymentForm.value.transaction_type !== 'STAFF_ADVANCE') {
            const hasPayee = paymentForm.value.parties.some(p => p.role === 'PAYEE');
            if (!hasPayee) {
                showAlert('error', 'At least one PAYEE is required');
                return;
            }
        }
    }

    // Validate parties
    for (const [index, party] of paymentForm.value.parties.entries()) {
        if (party.accountable_type !== 'OTHER' && !party.accountable_id) {
            showAlert('error', `Please select an accountable for party ${index + 1}`);
            return;
        }
    }

    // Validate items
    for (const [index, item] of paymentForm.value.items.entries()) {
        if (!item.itemable_id) {
            showAlert('error', `Please select an item for payment item ${index + 1}`);
            return;
        }
        if (item.amount <= 0) {
            showAlert('error', `Amount must be greater than 0 for item ${index + 1}`);
            return;
        }
        if (!item.currency_id) {
            showAlert('error', `Please select a currency for item ${index + 1}`);
            return;
        }
    }

    // Prepare data for submission
    const submitData = {
        ...paymentForm.value,
        user_id: userId.value,
        date: paymentForm.value.date || getToday(),
        // Filter out empty accountable_id for OTHER type
        parties: paymentForm.value.parties.filter(party =>
            party.role &&
            (party.accountable_type === 'OTHER' || party.accountable_id)
        ),
        items: paymentForm.value.items.filter(item =>
            item.itemable_id && item.amount > 0 && item.currency_id
        )
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
        status: 'DRAFT',
        currency_id: currencies.value[0]?.id || '',
        exchange_rate: 1,
        remarks: '',
        parties: [
            {
                role: 'PAYER',
                accountable_type: 'ENTITY',
                accountable_id: '',
                account_id: '',
                payee_name: '',
                cheque_number: '',
                control_number: '',
                narration: ''
            },
            {
                role: 'PAYEE',
                accountable_type: 'ENTITY',
                accountable_id: '',
                account_id: '',
                payee_name: '',
                cheque_number: '',
                control_number: '',
                narration: ''
            }
        ],
        items: [
            {
                itemable_type: 'INVOICE',
                itemable_id: '',
                description: '',
                currency_id: currencies.value[0]?.id || '',
                amount: 0
            }
        ],
        journal_vouchers: []
    };
};

// Watch transaction type to adjust form
watch(() => paymentForm.value.transaction_type, (newType) => {
    // Reset parties based on transaction type
    if (newType === 'CASH_REPLENISHMENT') {
        paymentForm.value.parties = [
            {
                role: 'REPLENISHMENT',
                accountable_type: 'ENTITY',
                accountable_id: '',
                account_id: '',
                payee_name: '',
                cheque_number: '',
                control_number: '',
                narration: ''
            }
        ];
    } else if (newType === 'STAFF_ADVANCE') {
        paymentForm.value.parties = [
            {
                role: 'PAYER',
                accountable_type: 'ENTITY',
                accountable_id: '',
                account_id: '',
                payee_name: '',
                cheque_number: '',
                control_number: '',
                narration: ''
            },
            {
                role: 'PAYEE',
                accountable_type: 'EMPLOYEE',
                accountable_id: '',
                account_id: '',
                payee_name: '',
                cheque_number: '',
                control_number: '',
                narration: ''
            }
        ];
    } else {
        paymentForm.value.parties = [
            {
                role: 'PAYER',
                accountable_type: 'ENTITY',
                accountable_id: '',
                account_id: '',
                payee_name: '',
                cheque_number: '',
                control_number: '',
                narration: ''
            },
            {
                role: 'PAYEE',
                accountable_type: 'ENTITY',
                accountable_id: '',
                account_id: '',
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
                itemable_type: 'JOURNAL_VOUCHER',
                itemable_id: '',
                description: '',
                currency_id: paymentForm.value.currency_id,
                amount: 0
            }
        ];
    }
});

// Watch accountable_type changes
watch(() => paymentForm.value.parties, (newParties) => {
    newParties.forEach(party => {
        if (party.accountable_type === 'OTHER') {
            // Clear accountable_id dropdown for OTHER type
            party.accountable_id = '';
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
            fetchAllData(),
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
                <i class="fas fa-file-invoice-dollar text-primary me-2"></i>
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
                                <i class="fas fa-calendar text-muted me-1"></i>
                                Date
                            </label>
                            <Datepicker v-model="paymentForm.date" :required="true" />
                        </div>

                        <div class="col-md-3">
                            <label class="form-label required">
                                <i class="fas fa-exchange-alt text-muted me-1"></i>
                                Transaction Type
                            </label>
                            <StandardVueSelect v-model="paymentForm.transaction_type"
                                :options="formData.transaction_types || []" placeholder="Select Transaction Type"
                                :required="true" />
                        </div>

                        <div class="col-md-3">
                            <label class="form-label">
                                <i class="fas fa-tag text-muted me-1"></i>
                                Status
                            </label>
                            <StandardVueSelect v-model="paymentForm.status" :options="formData.status_options || []"
                                placeholder="Select Status" />
                        </div>

                        <div class="col-md-3">
                            <label class="form-label required">
                                <i class="fas fa-money-bill-wave text-muted me-1"></i>
                                Currency
                            </label>
                            <StandardVueSelect v-model="paymentForm.currency_id" :options="currencies" labelKey="name"
                                valueKey="id" placeholder="Select Currency" :required="true" />
                        </div>

                        <div class="col-md-3 mt-3">
                            <label class="form-label">
                                <i class="fas fa-percentage text-muted me-1"></i>
                                Exchange Rate
                            </label>
                            <input type="number" v-model="paymentForm.exchange_rate" class="form-control"
                                placeholder="1.000000" step="0.000001" min="0" />
                            <small class="form-text text-muted">Rate for foreign currency</small>
                        </div>

                        <div class="col-md-12 mt-3">
                            <label class="form-label required">
                                <i class="fas fa-sticky-note text-muted me-1"></i>
                                Remarks
                            </label>
                            <textarea v-model="paymentForm.remarks" class="form-control" rows="2"
                                placeholder="Enter remarks or notes..."></textarea>
                        </div>
                    </div>

                    <!-- Parties Section -->
                    <div class="row mb-4">
                        <div class="col-md-12 d-flex justify-content-between align-items-center">
                            <h5 class="text-primary mb-0">
                                <i class="fas fa-users me-2"></i>
                                Parties Involved
                            </h5>
                            <button type="button" @click="addParty" class="btn btn-sm btn-outline-primary">
                                <i class="fas fa-plus me-1"></i> Add Party
                            </button>
                        </div>

                        <div class="col-md-12 mt-3">
                            <div class="table-responsive">
                                <table class="table table-bordered table-hover">
                                    <thead class="table-light">
                                        <tr>
                                            <th width="15%">Role *</th>
                                            <th width="15%">Type *</th>
                                            <th width="25%">Accountable *</th>
                                            <!-- <th width="15%">Bank Account (Optional)</th> -->
                                            <th width="15%">Payee Name</th>
                                            <th width="10%">Cheque No.</th>
                                            <th width="5%">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr v-for="(party, index) in paymentForm.parties" :key="index">
                                            <td>
                                                <StandardVueSelect v-model="party.role" :options="formData.roles || []"
                                                    placeholder="Select Role" :required="true" />
                                            </td>
                                            <td>
                                                <StandardVueSelect v-model="party.accountable_type"
                                                    :options="formData.accountable_types || []"
                                                    placeholder="Select Type" :required="true"
                                                    @change="handleAccountableTypeChange(party, index)" />
                                            </td>
                                            <td>
                                                <!-- For ENTITY, EMPLOYEE, SUBCONTRACTOR: Show dropdown -->
                                                <StandardVueSelect
                                                    v-if="['ENTITY', 'EMPLOYEE', 'SUBCONTRACTOR'].includes(party.accountable_type)"
                                                    v-model="party.accountable_id"
                                                    :options="getAccountableOptions(party.accountable_type)"
                                                    labelKey="name" valueKey="id"
                                                    :placeholder="`Select ${party.accountable_type}`" :required="true"
                                                    @option-selected="(opt) => onAccountableSelected(party, opt)" />

                                                <!-- For OTHER: Show text input -->
                                                <input v-else-if="party.accountable_type === 'OTHER'" type="text"
                                                    v-model="party.accountable_id" class="form-control"
                                                    placeholder="Enter description (e.g., 'Cash Payment', 'Miscellaneous')"
                                                    :required="true" />

                                                <!-- For ACCOUNT: Show accounts dropdown -->
                                                <StandardVueSelect v-else-if="party.accountable_type === 'ACCOUNT'"
                                                    v-model="party.accountable_id" :options="accounts"
                                                    labelKey="account_name" valueKey="id" placeholder="Select Account"
                                                    :required="true"
                                                    @option-selected="(opt) => onAccountSelected(party, opt)" />
                                            </td>
                                            <!-- <td>
                                                <StandardVueSelect v-model="party.account_id"
                                                    :options="getFilteredAccounts(party)" labelKey="account_name"
                                                    valueKey="id" placeholder="Select Bank Account" :clearable="true" />
                                                <small class="form-text text-muted">
                                                    Optional: For bank account reference
                                                </small>
                                            </td> -->
                                            <td>
                                                <input type="text" v-model="party.payee_name" class="form-control"
                                                    :placeholder="getPayeeNamePlaceholder(party)" />
                                            </td>
                                            <td>
                                                <input type="text" v-model="party.cheque_number" class="form-control"
                                                    placeholder="Cheque #" />
                                            </td>
                                            <td class="text-center">
                                                <button v-if="paymentForm.parties.length > 1" type="button"
                                                    @click="removeParty(index)" class="btn btn-sm btn-outline-danger"
                                                    title="Remove party">
                                                    <i class="fas fa-trash"></i>
                                                </button>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    <!-- Items Section -->
                    <div class="row mb-4">
                        <div class="col-md-12 d-flex justify-content-between align-items-center">
                            <h5 class="text-primary mb-0">
                                <i class="fas fa-list-alt me-2"></i>
                                Payment Items
                                <span class="badge bg-primary ms-2">
                                    Total: {{ totalAmount.toFixed(2) }}
                                    (Base: {{ totalBaseAmount.toFixed(2) }})
                                </span>
                            </h5>
                            <button type="button" @click="addItem" class="btn btn-sm btn-outline-primary">
                                <i class="fas fa-plus me-1"></i> Add Item
                            </button>
                        </div>

                        <div class="col-md-12 mt-3">
                            <div class="table-responsive">
                                <table class="table table-bordered table-hover">
                                    <thead class="table-light">
                                        <tr>
                                            <th width="15%">Item Type *</th>
                                            <th width="25%">Item *</th>
                                            <th width="25%">Description</th>
                                            <th width="15%">Currency *</th>
                                            <th width="15%">Amount *</th>
                                            <th width="5%">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr v-for="(item, index) in paymentForm.items" :key="index">
                                            <td>
                                                <StandardVueSelect v-model="item.itemable_type"
                                                    :options="formData.itemable_types || []" placeholder="Select Type"
                                                    :required="true" @change="updateItemOptions(item)" />
                                            </td>
                                            <td>
                                                <StandardVueSelect v-model="item.itemable_id"
                                                    :options="getItemableOptions(item.itemable_type)"
                                                    labelKey="reference" valueKey="id"
                                                    :placeholder="`Select ${item.itemable_type}`" :required="true"
                                                    @option-selected="(opt) => onItemableSelected(item, opt)" />
                                            </td>
                                            <td>
                                                <input type="text" v-model="item.description" class="form-control"
                                                    placeholder="Item description" />
                                            </td>

                                            <td>
                                                <StandardVueSelect v-model="item.currency_id" :options="currencies"
                                                    labelKey="name" valueKey="id" placeholder="Select Currency"
                                                    :required="true" />
                                            </td>
                                            <td>
                                                <input type="number" v-model="item.amount" class="form-control text-end"
                                                    placeholder="0.00" step="0.01" min="0.01" required />
                                            </td>
                                            <td class="text-center">
                                                <button v-if="paymentForm.items.length > 1" type="button"
                                                    @click="removeItem(index)" class="btn btn-sm btn-outline-danger"
                                                    title="Remove item">
                                                    <i class="fas fa-trash"></i>
                                                </button>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    <!-- Summary Section -->
                    <div class="row mb-4">
                        <div class="col-md-12">
                            <div class="card border-primary">
                                <div class="card-header bg-primary bg-opacity-10">
                                    <h6 class="mb-0 text-primary">
                                        <i class="fas fa-calculator me-2"></i>
                                        Payment Summary
                                    </h6>
                                </div>
                                <div class="card-body">
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
                                                <strong>{{ totalAmount.toFixed(2) }}</strong>
                                            </div>
                                        </div>
                                        <div class="col-md-3">
                                            <div class="d-flex justify-content-between mb-2">
                                                <span>Exchange Rate:</span>
                                                <strong>{{ paymentForm.exchange_rate.toFixed(6) }}</strong>
                                            </div>
                                        </div>
                                        <div class="col-md-3">
                                            <div class="d-flex justify-content-between mb-2">
                                                <span>Base Amount:</span>
                                                <strong class="text-success">{{ totalBaseAmount.toFixed(2) }}</strong>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Form Actions -->
                    <CardFooter>
                        <div class="d-flex justify-content-between">
                            <button type="button" @click="goBack" class="btn btn-secondary px-4">
                                <i class="fas fa-times me-2"></i>
                                Cancel
                            </button>
                            <button type="submit" class="btn btn-success px-4"
                                :disabled="isSaving || !canCreatePaymentAdvice">
                                <span v-if="isSaving" class="">
                                    <i class="fas fa-spinner fa-spin me-2"></i>
                                    Saving...
                                </span>
                                <span v-else>
                                    <i class="fas fa-save me-2"></i>
                                    Save Payment Advice
                                </span>
                            </button>
                        </div>
                    </CardFooter>
                </form>
            </div>
        </CardBody>
    </NormalCard>
</template>

<style scoped>
.form-label {
    font-weight: 500;
    margin-bottom: 0.5rem;
}

.table th {
    font-weight: 600;
    font-size: 0.875rem;
}

.table td {
    vertical-align: middle;
}

.text-end {
    text-align: end !important;
}

.badge {
    font-size: 0.75rem;
    font-weight: 500;
}

.card-header h6 {
    font-size: 1rem;
}

/* Style for OTHER type input */
input[type="text"].form-control {
    min-height: 38px;
}

.form-label.required:after {
    content: " *";
    color: #dc3545;
}
</style>