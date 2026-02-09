<script setup>
import { ref, onMounted, onBeforeUnmount } from "vue";
import { useAppOptionStore } from "@/stores/app-option";
import { useNotification } from "@/composables/notification";
import { AUTH_API_URL } from '@/config/config.js';
import { useAuthStore } from "@/stores/auth";
import { useRouter } from "vue-router";
import axios from "axios";
import CompanyLogo from '@/components/icons/MacargoLogo.vue';
import DeviceUUID from 'device-uuid';
import MD5 from 'crypto-js/md5';

// Import Initialization
const router = useRouter();
const authStore = useAuthStore();
const appOption = useAppOptionStore();
const { showAlert } = useNotification();

// Form state
const name = ref("");
const error = ref("");
const password = ref("");
const showPassword = ref(false);

// Loading State
const loading_spinner = ref(false);

const deviceId = ref('');

const computeDeviceId = () => {
  const uuid = new DeviceUUID.DeviceUUID().get();
  const fingerprint = JSON.stringify(uuid);
  return MD5(fingerprint).toString();
};

const loadDeviceId = () => {
  try {
    const cached = localStorage.getItem('device_id');
    if (cached) {
      deviceId.value = cached;
      return;
    }
  } catch (e) {
    // ignore storage access errors
  }

  const calculate = () => {
    try {
      const id = computeDeviceId();
      deviceId.value = id;
      localStorage.setItem('device_id', id);
    } catch (e) {
      deviceId.value = '';
    }
  };

  if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
    window.requestIdleCallback(calculate, { timeout: 1000 });
  } else {
    setTimeout(calculate, 0);
  }
};

const axiosInstance = axios.create({
  baseURL: AUTH_API_URL,
  headers: {
    "Content-Type": "application/json"
  },
})

// Toggle password visibility state
const togglePassword = () => {
  showPassword.value = !showPassword.value;
};

const validateForm = () => {
  if (!name.value) {
    showAlert("warning", "Please enter your username.");
    return false;
  }

  if (!password.value) {
    showAlert("warning", "Please enter your password.");
    return false;
  }
  return true;
};

// Submit logic
const submitForm = async () => {
  if (!validateForm()) {
    return;
  }

  if (!deviceId.value) {
    try {
      const id = computeDeviceId();
      deviceId.value = id;
      localStorage.setItem('device_id', id);
    } catch (e) {
      deviceId.value = '';
    }
  }

  loading_spinner.value = true;
  try {
    let param = {
      login: name.value,
      password: password.value,
      device_id: deviceId.value
    }
    const response = await axiosInstance.post(
      `login`, param
    );

    //if (response.data.success === true) {

    authStore.setUser(response.data.user);
    authStore.setToken(response.data.access_token, response.data.expires_in);
    authStore.setCompanies(response.data.companies_ids);
    authStore.setServices(response.data.services);

    setTimeout(() => {
      router.push("/companies-dashboard");
    }, 360);

  } catch (error) {
    console.error('Login error:', error);
    showAlert("error", error.response?.data?.message || error.message || "An error occurred during login.");
  } finally {
    loading_spinner.value = false;
  }
};

// UI config on mount/unmount
onMounted(() => {
  appOption.appSidebarHide = true;
  appOption.appHeaderHide = true;
  appOption.appContentClass = "p-0";

  loadDeviceId();
});

onBeforeUnmount(() => {
  appOption.appSidebarHide = false;
  appOption.appHeaderHide = false;
  appOption.appContentClass = "";
});
</script>

<template>
  <div class="login-container d-flex align-items-center justify-content-center p-3" style="
      background: linear-gradient(135deg, #f6f9fc 0%, #eef2f6 100%); min-height: 100vh;">
    <div class="container">
      <div class="row justify-content-center">
        <div class="col-md-5">
          <form @submit.prevent="submitForm"
            class="auth-form rounded-3 shadow-sm p-4 position-relative overflow-hidden">
            <!-- Top accent bar -->
            <div class="position-absolute top-0 start-0 w-100" style="height: 4px; background: linear-gradient(135deg,
            #ff0000 0%,      /* Red */
            #0055ff 30%,     /* Blue */
            #00c8d7 60%,     /* Blue-bahari */
            #ffdd00 100%)">
            </div>

            <!-- Form header -->
            <div class="auth-header text-center mb-4">
              <div class="logo-container">
                <img src="/assets/img/Bushman Logo.png" alt="Abood Group Logo" class="login-logo" />
              </div>
              <!-- <p class="auth-subtitle text-muted mb-2">
                For your protection, please verify your identity.
              </p> -->
            </div>

            <!-- Username -->
            <div class="mb-3 input-container">
              <label class="form-label fw-medium text-dark mb-1">Username</label>
              <div class="input-group border rounded-2 hover-effect">
                <span class="input-group-text bg-transparent border-0 text-muted pe-1">
                  <i class="fas fa-user"></i>
                </span>
                <input type="text" class="form-control username border-0 ps-1" v-model="name"
                  placeholder="Enter your username" autocomplete="username" />
              </div>
            </div>

            <!-- Password -->
            <div class="mb-3 input-container">
              <label class="form-label fw-medium text-dark mb-1">Password</label>
              <div class="input-group border rounded-2 hover-effect">
                <span class="input-group-text bg-transparent border-0 text-muted pe-1">
                  <i class="bi bi-lock-fill"></i>
                </span>
                <input :type="showPassword ? 'text' : 'password'" class="form-control password-field border-0 ps-1"
                  v-model="password" placeholder="Enter your password" autocomplete="current-password" />
                <button @click="togglePassword" class="btn btn-outline-secondary border-0 toggle-password"
                  type="button">
                  <i :class="showPassword ? 'bi bi-eye-slash-fill' : 'bi bi-eye-fill'"></i>
                </button>
              </div>
            </div>

            <!-- Submit -->
            <button type="submit" class="btn btn-info w-100 py-2 fw-semibold mt-2" :disabled="loading_spinner">
              <span v-if="loading_spinner" class="spinner-border spinner-border-sm me-2"></span>
              <span v-else><i class="bi bi-box-arrow-in-right me-2"></i></span>
              Sign In
            </button>
          </form>
        </div>
      </div>
    </div>
  </div>

</template>

<style scoped>
.login-container {
  background: linear-gradient(135deg, #f6f9fc 0%, #eef2f6 100%);
  min-height: 100vh;
}

.logo-container {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 10px;
  /* Reduce extra spacing */
  max-height: 100px;
  /* Control height of the container */
}

.login-logo {
  margin-top: 12px;
  max-height: 400px;
  /* Keeps it proportional */
  max-width: 50%;
  /* Allows responsive scaling */
  width: auto;
  /* Maintain aspect ratio */
  height: auto;
  /* Prevent distortion */
  object-fit: contain;
  transition: transform 0.3s ease;
}

.login-logo:hover {
  transform: scale(1.05);
}

.password-field {
  background: transparent;
  height: 3.5em;
}

.username {
  background: transparent;
  height: 3em;
}

.auth-header {
  margin-bottom: 1.5rem !important;
}

.auth-subtitle {
  font-size: 0.9rem;
}

.footer-copyright-text {
  font-size: 0.9rem;
  color: #6c757d;
}

.logo-container:hover img {
  transform: scale(1.05);
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.auth-form {
  animation: fadeIn 0.4s ease-out forwards;
}

/* New hover effects */
.hover-effect {
  transition: all 0.3s ease;
  border-color: #ced4da !important;
}

.hover-effect:hover,
.hover-effect:focus-within {
  border-color: #43ccee !important;
  box-shadow: 0 0 0 0.2rem rgba(67, 204, 238, 0.25);
}

.input-container:hover .form-label {
  color: #43ccee;
}

.input-group-text {
  transition: color 0.3s ease;
}

.hover-effect:hover .input-group-text,
.hover-effect:focus-within .input-group-text {
  color: #43ccee !important;
}

/* Focus styles */
.form-control:focus {
  box-shadow: none !important;
}

.password-field {
  background: transparent;
  height: 3.5em;
}
</style>
