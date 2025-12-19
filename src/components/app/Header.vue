<script setup lang="ts">
import { slideToggle } from "@/composables/slideToggle.js";
import { useAppOptionStore } from "@/stores/app-option";
import { RouterLink, useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import { useAppSidebarMenuStore } from "@/stores/app-sidebar-menu";
import { ref, onMounted, watch } from 'vue';

const router = useRouter();
const authStore = useAuthStore();
const menuStore = useAppSidebarMenuStore();
const appOption = useAppOptionStore();

const currentLogo = ref('/assets/img/abood_group.png'); // Default logo

// Function to update logo based on selected service
const updateLogo = () => {
  const selectedService = menuStore.getActiveService();

  if (selectedService !== null && [3,2,15,1,7].includes(selectedService)) {
    currentLogo.value = '/assets/img/abood logo.png';
  } else if (selectedService === 5) {
    currentLogo.value = '/assets/img/ma-cargo-logo-02.png';
  } else if (selectedService === 6) {
    currentLogo.value = '/assets/img/GHRM LOGO.png';
  } else if (selectedService === 14) {
    currentLogo.value = '/assets/img/Peta Holding_Logo-1.png';
  } else if (selectedService === 13) {
    currentLogo.value = '/assets/img/Bushman Logo.png';
  } else if (selectedService === 10) {
    currentLogo.value = '/assets/img/Apel_Logo.png';
  } else if (selectedService === 12) {
    currentLogo.value = '/assets/img/cou.png';
  } 
    else {
    currentLogo.value = '/assets/img/abood_group.png'; // Default logo
  }
};

// Watch for route changes to update logo
watch(() => router.currentRoute.value.path, () => {
  updateLogo();
});

onMounted(() => {
  // If there's selected service in store, clear it
  // if (authStore.getActiveService()) {
  //   authStore.clearActiveService();
  // }

  updateLogo();
});

async function handleLogout() {
  try {
    await authStore.logout();
    // Use window.location for a full page refresh to ensure clean state
    window.location.href = "/";
  } catch (error) {
    console.error("Logout API error:", error);
    // Even if the API call fails, we should clear local storage and redirect
    authStore.user = null;
    authStore.token = null;
    authStore.tokenExpiration = null;
    authStore.companiesIds = null;
    authStore.permissions = [];
    authStore.services = [];
    authStore.clearActiveService();
    authStore.clearAuthData();

    // Redirect to login page
    window.location.href = "/";
  }
}

const notificationData = [
  {
    icon: "far fa-user-circle fa-lg fa-fw text-body text-opacity-25",
    title: "3 new customer account is created",
    time: "2 minutes ago",
  },
];

function toggleAppSidebarMinify() {
  if (!(appOption.appTopNav && appOption.appSidebarHide)) {
    appOption.appSidebarMinified = !appOption.appSidebarMinified;
  }
}
function toggleAppSidebarMobileToggled() {
  if (appOption.appTopNav && appOption.appSidebarHide) {
    slideToggle(document.querySelector(".app-top-nav"));
    window.scrollTo(0, 0);
  } else {
    appOption.appSidebarMobileToggled = !appOption.appSidebarMobileToggled;
  }
}
function toggleAppHeaderSearch(event) {
  event.preventDefault();
  appOption.appHeaderSearchToggled = !appOption.appHeaderSearchToggled;
}
function checkForm(event) {
  event.preventDefault();
  router.push({ path: "/extra/search" });
}
</script>

<template>
  <div id="header" class="app-header">
    <!-- BEGIN mobile-toggler -->
    <div class="mobile-toggler">
      <button type="button" class="menu-toggler" v-on:click="toggleAppSidebarMobileToggled">
        <span class="bar"></span>
        <span class="bar"></span>
      </button>
    </div>
    <!-- END mobile-toggler -->

    <!-- BEGIN brand -->
    <div class="brand">
      <div class="desktop-toggler">
        <button type="button" class="menu-toggler" v-on:click="toggleAppSidebarMinify">
          <span class="bar"></span>
          <span class="bar"></span>
        </button>
      </div>

      <RouterLink to="/companies-dashboard" class="brand-logo d-flex align-items-center">
        <img :src="currentLogo" alt="Company Logo"  class="brand-logo-image me-2"
          >
        <!-- <span class="brand-text ms-2 d-none d-md-inline">ERP ANALYSIS</span> -->
      </RouterLink>
    </div>
    <!-- END brand -->

    <!-- BEGIN menu -->
    <div class="menu">
      <form class="menu-search" name="header_search_form" v-on:submit="checkForm">
        <!-- Search form content -->
      </form>
      <div class="menu-item dropdown">
        <!-- Notifications dropdown -->
      </div>
      <div class="menu-item dropdown">
        <a href="#" data-bs-toggle="dropdown" data-display="static" class="menu-link">
          <div class="menu-img online">
            <img src="/assets/img/user/default-user-profile.jpg" alt="" class="ms-100 mh-100 rounded-circle" />
          </div>
          <div class="menu-text">{{ authStore.user?.username || "Guest" }}</div>
        </a>
        <div class="dropdown-menu dropdown-menu-end me-lg-3">
          <a href="#" class="dropdown-item d-flex align-items-center" @click.prevent="handleLogout">
            Log Out
            <i class="fa fa-toggle-off fa-fw ms-auto text-gray-400 fs-16px"></i>
          </a>
        </div>
      </div>
    </div>
    <!-- END menu -->
  </div>
</template>

<style scoped>
.brand-logo-image {
  object-fit: contain;
  transition: all 0.3s ease;
  height: 80px; 
  max-width: 180px;
}

.brand-logo:hover .brand-logo-image {
  transform: scale(1.05);
}

.brand-text {
  font-weight: 600;
  color: #333;
}

@media (max-width: 768px) {
  .brand-logo-image {
    height: 35px !important;
    max-width: 150px !important;
  }
}
</style>