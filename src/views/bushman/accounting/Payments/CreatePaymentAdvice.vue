<script setup>
import { ref, onMounted, computed } from 'vue';
import { BASE_URL } from '@/config/config';
import { useNotification } from '@/composables/notification.js';
import { useRouter } from 'vue-router';
import axios from 'axios';
import Datepicker from '@/components/plugins/Datepicker.vue';
import StandardVueSelect from '@/components/plugins/StandardVueSelect.vue';
import NormalCard from '@/components/bootstrap/Customized-Cards/NormalCard.vue';
import CardHeader from '@/components/bootstrap/CardHeader.vue';
import CardBody from '@/components/bootstrap/CardBody.vue';

// imports Initializations
const { showAlert } = useNotification();
const router = useRouter();

// Reactive Variables
const formData = ref({});

// Loading States
const isSaving = ref(false);
const isLoadingFormData = ref(false);

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
    isLoadingFormData.value = true;

    try {
        const response = await axios.get(`${BASE_URL}/payment-advices/form-data`);
        if (response.data && response.data.success === true) {
            formData.value = response.data.form_data || {};
        }
    } catch (error) {
        console.error("Error fetching Form Options:", error);
        showAlert("error", error.response?.data?.message || error.message || "Error fetching Form Options");        
    } finally {
        isLoadingFormData.value = false;
    }
};

onMounted(async () => {
    await fetchFormData();
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
    </div>
</template>