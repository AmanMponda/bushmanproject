<script setup>
import { useAppOptionStore } from '@/stores/app-option';
import { onMounted, onBeforeUnmount } from 'vue';
import { RouterLink } from 'vue-router';

const appOption = useAppOptionStore();

onMounted(() => {
  appOption.appSidebarHide = true;
  appOption.appHeaderHide = true;
  appOption.appContentClass = "p-0";
});

onBeforeUnmount(() => {
  appOption.appSidebarHide = false;
  appOption.appHeaderHide = false;
  appOption.appContentClass = "";
});
</script>
<template>
	<!-- BEGIN error -->
	<div class="error-page">
		<!-- BEGIN error-page-content -->
		<div class="error-page-content">
			<div class="error-img">
				<div class="error-img-code">403</div>
				<img src="/assets/img/page/404.svg" alt="" />
			</div>
			
			<h1>Access Denied!</h1> 
			<h3>You don't have permission to access this page</h3>
			<p class="text-muted mb-2">
				It looks like you're trying to access a resource that requires special permissions.
			</p>
			<p class="text-muted mb-4">
				Please contact your administrator if you believe this is an error.
			</p>
			<RouterLink to="/companies-dashboard" class="btn btn-theme">
				<i class="fa fa-arrow-left me-2"></i>
				Back to Company Dashboard
			</RouterLink>
		</div>
		<!-- END error-page-content -->
	</div>
	<!-- END error -->
</template>