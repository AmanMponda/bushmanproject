<template>
  <div class="container-fluid py-5">
    <div class="row justify-content-center">
      <div class="col-xl-8 col-lg-10">
        <div class="card border-0 shadow-sm">
          <div class="card-body text-center py-5">
            <!-- Icon -->
            <div class="mb-4">
              <i class="fa fa-tools fa-5x text-theme opacity-50"></i>
            </div>

            <!-- Title -->
            <h2 class="mb-3">
              <i class="fa fa-wrench text-warning me-2"></i>
              Feature Under Development
            </h2>

            <!-- Description -->
            <p class="text-muted fs-5 mb-4">
              This module is currently under development and will be available soon.
            </p>

            <!-- Additional Info -->
            <div class="alert alert-info border-0 d-inline-block mb-4">
              <i class="fa fa-info-circle me-2"></i>
              We're working hard to bring you this feature. Stay tuned for updates!
            </div>

            <!-- Back Button -->
            <div class="mt-4">
              <router-link to="/bushman/dashboard" class="btn btn-theme btn-lg px-5">
                <i class="fa fa-arrow-left me-2"></i>
                Go to Dashboard
              </router-link>
            </div>

            <!-- Progress Indicator (optional) -->
            <div class="mt-5 pt-4 border-top">
              <p class="text-muted small mb-2">Development Progress</p>
              <div class="progress" style="height: 8px; max-width: 400px; margin: 0 auto;">
                <div 
                  class="progress-bar progress-bar-striped progress-bar-animated bg-theme" 
                  role="progressbar" 
                  style="width: 60%" 
                  aria-valuenow="60" 
                  aria-valuemin="0" 
                  aria-valuemax="100"
                ></div>
              </div>
              <p class="text-muted small mt-2">60% Complete</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

// Optional: You can track which feature was accessed
onMounted(() => {
})
</script>

<style scoped>
.btn-theme {
  transition: all 0.3s ease;
}

.btn-theme:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.fa-tools {
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-20px);
  }
}
</style>
