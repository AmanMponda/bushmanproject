<script setup>
import 'lity';
import 'lity/dist/lity.min.css';
import { useRouter } from 'vue-router';
import { onMounted, ref, computed, watch } from 'vue';
import { useAuthStore } from "@/stores/auth";
import { useAppSidebarMenuStore } from "@/stores/app-sidebar-menu";
import { useAppOptionStore } from "@/stores/app-option";
import { AUTH_API_URL } from '@/config/config.js';
import { useServiceStore } from "@/stores/service-permission";
import axios from "axios";
import Card from "@/components/bootstrap/Card.vue";
import CardBody from "@/components/bootstrap/CardBody.vue";
import Loading from '@/components/bootstrap/Loading.vue';
import EmptyState from "@/components/bootstrap/emptyState.vue";

// Initialize stores
const authStore = useAuthStore();
const menuStore = useAppSidebarMenuStore();
const appOption = useAppOptionStore();
const serviceStore = useServiceStore();

const services = ref(authStore.services);
const user = ref(authStore.user);
const year = ref(new Date().getFullYear());

// Loading and error states
const loading = ref(false);
const error = ref(null);

// Reactive Variables
const selectedServiceId = ref(null);

// Initialize router
const router = useRouter();

// Get userId from the Store
const userId = computed(() => {
	return authStore.user?.id;
});

const Token = localStorage.getItem('token');



// Make permissions reactive
const permissions = ref(JSON.parse(localStorage.getItem('permission') || '[]'));

// Service configuration with route permissions mapping
const serviceConfig = {
    1: { icon: '/assets/img/abood logo.png' },
    2: { icon: '/assets/img/abood logo.png' },
    3: { icon: '/assets/img/abood logo.png' },      
    6: { icon: '/assets/img/GHRM LOGO.png' },    
    8: { icon: '/assets/img/Peta Holding_Logo-1.png' },
    9: { icon: '/assets/img/abood logo.png' }, 
	11 :{ icon: '/assets/img/ma-cargo-logo-02.png' }, 
    7: { icon: '/assets/img/abood logo.png' },
    12: { icon: '/assets/img/cou.png' },
    13: { icon: '/assets/img/Bushman Logo.png' },
    14: { icon: '/assets/img/Peta Holding_Logo-1.png' },
    15: { icon: '/assets/img/abood logo.png' }
};


// Hardcoded service definitions using the config
const hardcodedServices = Object.entries(serviceConfig).map(([service_id, config]) => ({
	service_id: parseInt(service_id),
	name: config.name,
	icon: config.icon,
	description: config.description
}));

const serviceName = computed(() => {
	return services.value.map(service => service.name);
});

const availableServices = computed(() => {
	const userServices = services.value;

	// Only these should show
	const serviceOrder = [3, 1, 12, 11, 2, 7, 6, 13, 14, 15];

	// Ranking map
	const orderMap = new Map(serviceOrder.map((id, index) => [id, index]));

	return userServices
		// CHUJA: only services in serviceOrder
		.filter(s => serviceOrder.includes(s.service_id))

		// Add icon + db name
		.map(s => ({
			service_id: s.service_id,
			name: s.name,
			icon: serviceConfig[s.service_id]?.icon || null
		}))

		// Sort by the custom order
		.sort((a, b) => {
			return orderMap.get(a.service_id) - orderMap.get(b.service_id);
		});
});




console.log(availableServices.value);

const getServicePermissions = async (id) => {
	try {
		const response = await axios.post(`${AUTH_API_URL}/user-permission`,
			{
				user_id: userId.value,
				service_id: id
			},
			{
				headers: {
					'Authorization': `Bearer ${Token}`,
					'Content-Type': 'application/json'
				}
			}
		);

		if (response.data?.data?.permissions) {
			permissions.value = response.data.data.permissions.map(p => p.permission);
			localStorage.setItem('permission', JSON.stringify(permissions.value));
			authStore.setPermissions(permissions.value);
			return permissions.value;
		} else {
			throw new Error('Invalid response format from permissions API');
		}
	} catch (error) {
		console.error("Error fetching permissions:", error);
		throw error;
	}
};

// Find the best available route based on user permissions
const findAccessibleRoute = (serviceId) => {
	const service = serviceConfig[serviceId];
	if (!service || !service.routes) {
		return "/performance-dashboard"; // Fallback
	}

	// Try to find a route that user has permission for
	for (const route of service.routes) {
		// If route has no permission requirement, use it
		if (!route.permission) {
			return route.path;
		}

		// If user has the required permission, use this route
		if (permissions.value.includes(route.permission)) {
			return route.path;
		}
	}

	// If no accessible route found, redirect to a fallback
	return "/unauthorized"; // Make sure you have this route
};

const selectService = async (service) => {
	loading.value = true;
	error.value = null;
    selectedServiceId.value = service.service_id;

	try {
		// First get permissions
		await getServicePermissions(service.service_id);

		// Store the selected service
		authStore.setActiveService(service);

		// Update the sidebar menu based on the selected service
		menuStore.setActiveService(service.service_id);

		// Show the sidebar
		appOption.appSidebarHide = false;

		// Find the best route based on permissions
		const targetRoute = findAccessibleRoute(service.service_id);

		// Redirect to the appropriate route
		router.push(targetRoute);

	} catch (error) {
		console.error('Failed to select service:', error);
		error.value = 'Failed to load permissions. Please try again.';
		// You might want to use a toast notification here instead
	} finally {
		loading.value = false;
        selectedServiceId.value = null;
	}
};

onMounted(() => {
	appOption.appSidebarHide = true;

	// If there's selected service in store, clear it
	if (authStore.getActiveService()) {
		authStore.clearActiveService();
	}

	// If user has only one service, automatically select it
	if (availableServices.value.length === 1) {
		selectService(availableServices.value[0]);
	}
});
</script>

<template>
	<!-- BEGIN profile -->
	<div class="profile">
		<!-- BEGIN profile-header -->
		<div class="profile-header">
			<div class="profile-header-cover"></div>

			<div class="profile-header-content">
				<div class="profile-header-img">
					<img src="/assets/img/user/default-user-profile.jpg" alt="">
				</div>
				<ul class="profile-header-tab nav nav-tabs nav-tabs-v2">
					<!-- <li class="nav-item">
						<a href="#profile-post" class="nav-link active" data-bs-toggle="tab">
							<div class="nav-field">Posts</div>
							<div class="nav-value">382</div>
						</a>
					</li>
					<li class="nav-item">
						<a href="#profile-followers" class="nav-link" data-bs-toggle="tab">
							<div class="nav-field">Followers</div>
							<div class="nav-value">1.3m</div>
						</a>
					</li>
					<li class="nav-item">
						<a href="#profile-media" class="nav-link" data-bs-toggle="tab">
							<div class="nav-field">Photos</div>
							<div class="nav-value">1,397</div>
						</a>
					</li>
					<li class="nav-item">
						<a href="#profile-video" class="nav-link" data-bs-toggle="tab">
							<div class="nav-field">Videos</div>
							<div class="nav-value">120</div>
						</a>
					</li>
					<li class="nav-item">
						<a href="#profile-followers" class="nav-link" data-bs-toggle="tab">
							<div class="nav-field">Following</div>
							<div class="nav-value">2,592</div>
						</a>
					</li> -->
				</ul>
			</div>
		</div>
		<!-- END profile-header -->

		<!-- BEGIN profile-container -->
		<div class="profile-container">
			<!-- BEGIN profile-sidebar -->
			<div class="profile-sidebar">
				<div class="desktop-sticky-top">
					<!-- profile info -->
					<h4>{{ user.username }}</h4>
					<div class="fw-500 mb-3 text-muted mt-n2">
						<i class="fas fa-envelope-open"></i>
						{{ user.email }}
						<br>
						<i class="fas fa-phone"></i>
						{{ user.phone_number }}
					</div>
					<p>
						Welcome to ABOODAPPS DASHBOARD. Here you will get overview, performance  and insight
						of each app
					</p>
					<div class="mb-1">
						<i class="fa fa-map-marker-alt fa-fw text-muted"></i> Morogoro, Tanzania
					</div>
					<div class="mb-3">
						<i class="fa fa-link fa-fw text-muted"></i> Abood Group Of Companies
					</div>

					<hr class="mt-4 mb-4">
				</div>
			</div>
			<!-- END profile-sidebar -->

			<!-- BEGIN profile-content -->
			<div class="profile-content">
				<div class="row">
					<div class="col-xl-12 col-lg-12 col-md-12 col-sm-12">
						<div class="tab-content p-0">
							<div class="tab-pane fade show active" id="profile-post">
								<div class="container-fluid">

									<!-- Loading State -->
									<!-- <div v-if="loading" class="text-center py-5">
										<Loading :colorClass="'text-primary'" :loaderType="'border'" :size="'md'" />
									</div> -->

									<!-- Error State -->
									<div v-if="error" class="alert alert-danger text-center">
										{{ error }}
									</div>

									<!-- Fallback if no services -->
									<div v-else-if="availableServices.length === 0" class="text-center py-5">
										<i class="fa fa-exclamation-triangle fa-3x text-warning mb-3"></i>
										<h4>No Services Available</h4>
										<p class="text-muted">You don't have access to any of Available Analytics
											Systems.</p>
									</div>

									<div v-else>							

										<!-- Services Grid -->
										<div class="row g-4">
											<div v-for="service in availableServices" :key="service.service_id"
												class="col-xl-4 col-lg-6 col-md-12 col-sm-12">
												<Card @click="selectService(service)" class="h-100 service-card" hoverable>
													<CardBody class="d-flex flex-column justify-content-center align-items-center text-center p-4">
														<div class="service-icon mb-3">
															<img :src="service.icon" :alt="service.name + ' Logo'"
																class="service-logo"
																style="height: 60px; max-width: 180px; object-fit: contain;">
														</div>
														<h3 class="service-name text-muted mb-3 fs-4">
															{{ service.name }}
															<!-- {{ serviceName }} -->
														</h3>														
														<div class="w-100 d-flex justify-content-center align-items-center mt-auto">														
															<button 
																class="btn btn-outline-info d-flex align-items-center justify-content-center gap-2"
																:disabled="loading"
																:aria-label="`View ${service.name} `">
																<template v-if="loading && selectedServiceId === service.service_id">
																	<span
																		class="spinner-border spinner-border-sm text-primary"
																		role="status" aria-hidden="true">
																	</span>
																	Loading...
																</template>
																<template v-else>
																	<i class="fas fa-arrow-circle-right me-2"></i>
																	 Access Module 
																</template>
															</button>
														</div>
													</CardBody>
												</Card>
											</div>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
			<!-- END profile-content -->
		</div>
		<!-- END profile-container -->
	</div>
	<!-- END profile -->
</template>

<style scoped>
.service-card {
	transition: transform 0.2s ease, box-shadow 0.2s ease;
	cursor: pointer;
}

.service-card:hover {
	transform: translateY(-5px);
	box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);
}

.service-icon {
	color: #5b7cfd;
}

.service-name {
	color: #333;
	font-weight: 600;
}
</style>