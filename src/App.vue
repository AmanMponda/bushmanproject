<script setup lang="ts">
import { getCurrentInstance, ref, onMounted, watch, computed } from 'vue';
import { RouterLink, RouterView, useRouter } from 'vue-router';
import { useAppOptionStore } from '@/stores/app-option';
import { useAuthStore } from '@/stores/auth';
import { useAppSidebarMenuStore } from '@/stores/app-sidebar-menu';
import { ProgressFinisher, useProgress } from '@marcoschulte/vue3-progress';
import AppSidebar from '@/components/app/Sidebar.vue';
import AppHeader from '@/components/app/Header.vue';
import AppTopNav from '@/components/app/TopNav.vue';
import AppFooter from '@/components/app/Footer.vue';
import AppThemePanel from '@/components/app/ThemePanel.vue';

const appOption = useAppOptionStore();
const authStore = useAuthStore();
const menuStore = useAppSidebarMenuStore();
const internalInstance = getCurrentInstance();
const router = useRouter();
const authCheck = ref(false);

const progresses = [] as ProgressFinisher[];

// Compute background color based on active service
const appBackgroundClass = computed(() => {
	// Prefer the menu store's active service id; fallback to null
	let activeServiceId = null;
	try {
		activeServiceId = menuStore.getActiveService();
	} catch (e) {
		activeServiceId = null;
	}

	// Normalize to number when possible
	const id = activeServiceId !== null && activeServiceId !== undefined ? Number(activeServiceId) : null;

	if (id === 4) {
		return 'app-bg-abs'; // ABS Analytics - Red
	} else if (activeServiceId === 5) {
		return 'app-bg-default';
		// return 'app-bg-ma-cargo'; // MA Cargo - Default/Blue
	} else {
		return 'app-bg-default'; // Default background
	}
});

// Load user and service data on app initialization
onMounted(() => {
	if (!authStore.user) {
		authStore.loadUser();
	}

	// Only log in development mode
	if (import.meta.env.DEV) {
		console.log(authStore.isAuthenticated);
	}
	authCheck.value = true;

	// Try to load selected service from localStorage using store method
	const activeService = menuStore.getActiveService();
	if (activeService === null) {
		// If no service is set, try to load from localStorage
		const savedService = localStorage.getItem('selectedService');
		if (savedService) {
			try {
				const service = JSON.parse(savedService);
				menuStore.setActiveService(service.service_id);
			} catch (e) {
				// Only log errors in development
				if (import.meta.env.DEV) {
					console.error('Error parsing saved service:', e);
				}
				localStorage.removeItem('selectedService');
				// Only reload in development to avoid infinite loops in production
				if (import.meta.env.DEV) {
					window.location.reload();
				}
			}
		}
	}
});

watch(() => authStore.isAuthenticated,
	(newVal) => {
		if (!newVal) {
			authStore.user = null;
			authStore.token = null;
			authStore.tokenExpiration = null;
			authStore.companiesIds = null;
			authStore.permissions = [];
			authStore.services = [];
			// Clear active service in both auth store and sidebar menu store to avoid stale UI state
			authStore.clearActiveService();
			try {
				// Use an 'any' cast with optional chaining to avoid TypeScript complaining about 'null' not being a number,
				// while still attempting to clear the active service at runtime.
				(menuStore as any).setActiveService?.(null);
			} catch (e) {
				// fallback: if setActiveService expects a number, directly remove saved service and rely on default
				if (import.meta.env.DEV) {
					console.warn('Could not set null active service on menuStore:', e);
				}
			}
			// Remove persisted selected service to ensure a fresh state after re-login
			localStorage.removeItem('selectedService');
			authStore.clearAuthData();
			router.push('/') // redirect to home or login
		}
	}
)

// Watch for active service changes to update background
watch(() => menuStore.getActiveService(), () => {
	// This will trigger recomputation of appBackgroundClass
	appBackgroundClass.value;
});

// Watch for route changes to show/hide sidebar appropriately
watch(() => router.currentRoute.value.path, (newPath) => {
	// Show sidebar on all pages except login and service selection
	if (newPath !== '/' && newPath !== '/companies-dashboard') {
		appOption.appSidebarHide = false;
	} else {
		appOption.appSidebarHide = true;
	}
}, { immediate: true });

router.beforeEach(async (to, from) => {
	progresses.push(useProgress().start());
	appOption.appSidebarMobileToggled = false;
	document.body.scrollTop = 0;
	document.documentElement.scrollTop = 0;

	var targetElm = [].slice.call(document.querySelectorAll('.app-sidebar .menu-submenu'));
	targetElm.map(function (elm) {
		elm.style.display = '';
	});

	// Show/hide sidebar based on route
	if (to.path !== '/' && to.path !== '/companies-dashboard') {
		appOption.appSidebarHide = false;
	} else {
		appOption.appSidebarHide = true;
	}
});

router.afterEach(async (to, from) => {
	progresses.pop()?.finish();
});

document.querySelector('body').classList.add('app-init');
</script>

<template>
	<div v-if="authCheck">
		<div class="app" v-bind:class="[
			appBackgroundClass,
			{
				'app-header-menu-search-toggled': appOption.appHeaderSearchToggled,
				'app-sidebar-minified': appOption.appSidebarMinified,
				'app-sidebar-collapsed': appOption.appSidebarCollapsed,
				'app-sidebar-mobile-toggled': appOption.appSidebarMobileToggled,
				'app-sidebar-mobile-closed': appOption.appSidebarMobileClosed,
				'app-content-full-height': appOption.appContentFullHeight,
				'app-content-full-width': appOption.appSidebarHide,
				'app-with-top-nav': appOption.appTopNav,
				'app-without-sidebar': appOption.appSidebarHide,
				'app-without-header': appOption.appHeaderHide,
				'app-boxed-layout': appOption.appBoxedLayout,
				'app-footer-fixed': appOption.appFooterFixed,
				'vh-100': appOption.appVh100
			}
		]">
			<vue3-progress-bar />
			<app-header v-if="!appOption.appHeaderHide" />
			<app-top-nav v-if="appOption.appTopNav" />
			<app-sidebar v-if="!appOption.appSidebarHide" />
			<div class="app-content" v-bind:class="appOption.appContentClass">
				<router-view></router-view>
			</div>
			<app-footer v-if="appOption.appFooter" />
			<app-theme-panel />
		</div>
	</div>
</template>

<style scoped>
.app {
	min-height: 100vh;
	transition: background-color 0.3s ease;
}

.app-bg-default {
	background: #f5f6fa;
	/* Your default template color */
}

.app-bg-abs {
	background: #ffebee;
	/* background: #96000C; */
	/* background: rgba(150, 0, 12, 0.1); */
	/* background: #96000C1A; */
	/* 1A = 10% opacity in HEX */
	/* background: hsla(355, 100%, 29%, 0.1);  */
	/* 10% opacity */
	/* Light red for ABS Analytics */
	/* Or use a stronger red: background: #ffcdd2; */
	/* Very subtle (good for backgrounds) */
	/* background: rgba(150, 0, 12, 0.05); */
	/* 5% opacity */

	/* Light (good for subtle branding) */
	/* background: rgba(150, 0, 12, 0.1); */
	/* 10% opacity */

	/* Medium (more noticeable) */
	/* background: rgba(150, 0, 12, 0.2); */
	/* 20% opacity */

	/* Strong (for emphasis) */
	/* background: rgba(150, 0, 12, 0.3); */
	/* 30% opacity */
	/* background: rgba(150, 0, 12, 0.08); */
	/* Very subtle 8% opacity */
}

.app-bg-ma-cargo {
	background: #e3f2fd;
	/* Light blue for MA Cargo */
	/* Or use your default: background: #f5f6fa; */
}
</style>