<script setup lang="ts">
import { getCurrentInstance, ref, onMounted, watch, computed, onUnmounted } from 'vue';
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

// --- Inactivity Timeout Logic ---
let inactivityTimer: ReturnType<typeof setTimeout> | null = null;
const INACTIVITY_LIMIT = 15 * 60 * 1000; // 15 minutes in ms

function logoutUser() {
	// Clear auth data and redirect to login
	authStore.user = null;
	authStore.token = null;
	authStore.tokenExpiration = null;
	authStore.companiesIds = null;
	authStore.permissions = [];
	authStore.services = [];
	authStore.clearActiveService();
	authStore.clearAuthData();
	localStorage.removeItem('selectedService');
	router.push('/');
}

function resetInactivityTimer() {
	// Only reset timer if user is authenticated
	if (!authStore.isAuthenticated) return;

	if (inactivityTimer) {
		clearTimeout(inactivityTimer);
	}

	inactivityTimer = setTimeout(() => {
		logoutUser();
	}, INACTIVITY_LIMIT);
}

function handleUserActivity() {
	resetInactivityTimer();
}

function setupInactivityListeners() {
	const events = ['mousemove', 'mousedown', 'keypress', 'touchstart', 'scroll', 'click'];
	events.forEach(event => {
		document.addEventListener(event, handleUserActivity, true);
	});
}

function cleanupInactivityListeners() {
	const events = ['mousemove', 'mousedown', 'keypress', 'touchstart', 'scroll', 'click'];
	events.forEach(event => {
		document.removeEventListener(event, handleUserActivity, true);
	});

	if (inactivityTimer) {
		clearTimeout(inactivityTimer);
		inactivityTimer = null;
	}
}

// Compute background color based on active service
const appBackgroundClass = computed(() => {
	const activeServiceId = menuStore.getActiveService();

	if (activeServiceId === 4) {
		return 'app-bg-abs'; // ABS Analytics - Red
	} else if (activeServiceId === 5) {
		return 'app-bg-default';
	} else {
		return 'app-bg-default'; // Default background
	}
});

// Load user and service data on app initialization
onMounted(() => {
	if (!authStore.user) {
		authStore.loadUser();
	}

	authCheck.value = true;

	// Try to load selected service from localStorage
	const savedService = localStorage.getItem('selectedService');
	if (savedService) {
		try {
			const service = JSON.parse(savedService);
			menuStore.setActiveService(service.service_id);
		} catch (e) {
			console.error('Error parsing saved service:', e);
			localStorage.removeItem('selectedService');
		}
	}

	// Setup inactivity monitoring only if user is authenticated
	if (authStore.isAuthenticated) {
		setupInactivityListeners();
		resetInactivityTimer();
	}
});

// Cleanup on component unmount
onUnmounted(() => {
	cleanupInactivityListeners();
});

// Watch authentication status to start/stop inactivity monitoring
watch(() => authStore.isAuthenticated, (newVal) => {
	if (newVal) {
		// User logged in - start monitoring
		setupInactivityListeners();
		resetInactivityTimer();
	} else {
		// User logged out - stop monitoring
		cleanupInactivityListeners();
		authStore.user = null;
		authStore.token = null;
		authStore.tokenExpiration = null;
		authStore.companiesIds = null;
		authStore.permissions = [];
		authStore.services = [];
		authStore.clearActiveService();
		authStore.clearAuthData();
		router.push('/');
	}
}, { immediate: true });

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
}

.app-bg-abs {
	background: #ffebee;
}

.app-bg-ma-cargo {
	background: #e3f2fd;
}
</style>