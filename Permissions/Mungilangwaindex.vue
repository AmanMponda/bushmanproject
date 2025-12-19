<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { useRouter } from 'vue-router';
import { useAppOptionStore } from '@/stores/app-option';
import axios from 'axios';
import { useServiceStore } from "@/stores/service-permission";
import { useAuthStore } from "@/stores/auth";
import { AUTH_API_URL } from "@/config/config";

const router = useRouter();
const Token = localStorage.getItem('token');

const axiosInstance = axios.create({
  baseURL: AUTH_API_URL,
  headers: {
    'Authorization': `Bearer ${Token}`,
    'Content-Type': 'application/json'
  }
});

const serviceStore = useServiceStore();
const auth = useAuthStore();
const appOption = useAppOptionStore();
const user = ref(JSON.parse(localStorage.getItem("user")));
const local_services = ref(auth.getServices());

// Make permissions reactive
const permissions = ref(JSON.parse(localStorage.getItem('permission') || '[]'));

// Service configuration
const serviceConfig = {
  'Ticketing system': { path: '/abs/home', subsystem: 'abs' },
  'CRM': { path: '/crm/home', subsystem: 'crm' },
  'AUTH': { path: '/auth/home', subsystem: 'auth' }
};

const navigateToService = async (service) => {
  try {
    // First get permissions
    await getServicePermissions(service.service_id);
    
    // Then proceed with navigation
    const config = serviceConfig[service.name];
    if (!config) {
      console.error('Unknown subsystem name:', service.name);
      return;
    }
    
    setSubsystem(config.subsystem);
    router.push(config.path);
  } catch (error) {
    console.error("Navigation error:", error);
  }
};

const setSubsystem = (subsystem) => {
  appOption.setSubsystem(subsystem);
};

const getServicePermissions = async(id) => {
  const param = {
    user_id: user.value.id,
    service_id: id
  };
  
  try {
    const response = await axiosInstance.post('user-permission', param);	
    permissions.value = response.data.data.permissions.map(p => p.permission);	
	  localStorage.setItem('permission', JSON.stringify(permissions.value));
	  auth.setPermissions(localStorage.getItem('permission'))// Update auth store
} catch (error) {
    console.error("Error fetching permissions:", error);
    throw error; // Re-throw to handle in navigateToService
  }
};

// Lifecycle hooks
onMounted(() => {
  appOption.appSidebarHide = true;
});

onBeforeUnmount(() => {
  appOption.appSidebarHide = false;
});
</script>

<template>
  <div class="profile">
    <!-- BEGIN profile-header -->
    <div class="profile-header">
      <div class="profile-header-cover"></div>
      <div class="profile-header-content">
        <div class="profile-header-img">
          <img src="/assets/img/user/Avatars.png" alt="User Avatar" class="ms-100 mh-100 rounded-circle">
        </div>                
      </div>
    </div>
    <!-- END profile-header -->
    
    <!-- BEGIN profile-container -->
    <div class="profile-container">
      <!-- BEGIN profile-sidebar -->
      <div class="profile-sidebar">
        <div class="desktop-sticky-top">
          <h2>{{ user?.username }}</h2>
          <div class="fw-700 mb-3 text-muted mt-n2">{{ user?.email }}</div>
          <p>{{ user?.description || 'No description available.' }}</p>
          <div class="mb-1">
            <i class="fa fa-map-marker-alt fa-fw text-muted"></i> morogoro, TZ
          </div>
          <div class="mb-3">
            <i class="fa fa-link fa-fw text-muted"></i> aboodbus.com
          </div>
          <hr class="mt-4 mb-4">
        </div>
      </div>
      <!-- END profile-sidebar -->
      
      <!-- BEGIN profile-content -->
      <div class="profile-content">
        <div class="row">
          <!-- Dynamic Services -->
          <div v-for="serv in local_services" :key="serv.service_id" class="col-xl-4 col-md-6 p-3">
            <div 
              @click="navigateToService(serv)"
              class="text-decoration-none cursor-pointer"
            >
              <card class="border-0 rounded-4 h-[500px] md:h-700 transition-all hover:shadow-lg hover:-translate-y-1" 
                    :style="{ backgroundColor: serv.color }">
                <card-body class="fs-14px p-30px d-flex flex-column justify-content-center align-items-center">
                  <img src="/assets/img/favicon.png" class="invert-dark mb-4" alt="Service Logo" height="50">
                  <div class="h3 font-monospace mb-2 text-center text-dark">{{ serv.name }}</div>
                  <hr class="my-3 text-primary w-75">
                </card-body>
              </card>
            </div>
          </div>         
          <!-- Static Services -->          
        </div>
      </div>
      <!-- END profile-content -->
    </div>
    <!-- END profile-container -->
  </div>
</template>