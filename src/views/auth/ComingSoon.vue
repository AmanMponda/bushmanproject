<script setup>
import { useAppOptionStore } from '@/stores/app-option'
import { useRouter } from 'vue-router'
import { onMounted, onBeforeUnmount, ref } from 'vue'
import VueCountdown from '@chenfengyuan/vue-countdown'

const appOption = useAppOptionStore()
const router = useRouter()
const year = ref(new Date().getFullYear())

const submitForm = () => {
	router.push('/companies-dashboard')
}

onMounted(() => {
	appOption.appContentFullHeight = true
	appOption.appSidebarHide = true
	appOption.appHeaderHide = true
	appOption.appContentClass = 'p-0'
})

onBeforeUnmount(() => {
	appOption.appContentFullHeight = false
	appOption.appSidebarHide = false
	appOption.appHeaderHide = false
	appOption.appContentClass = ''
})
</script>

<template>
	<!-- BEGIN coming-soon -->
	<div class="coming-soon">
		<div class="flex-1">
			<!-- BEGIN coming-soon-content -->
			<div class="coming-soon-content">
				<div class="coming-soon-img mb-4"><img src="/assets/img/page/coming-soon.svg" alt="" /></div>
				<div class="coming-soon-timer mb-3">
					<div class="is-countdown text-center">
						<vue-countdown class="countdown-row countdown-show4" :time="2 * 24 * 60 * 60 * 1000"
							:transform="transformSlotProps" v-slot="{ days, hours, minutes, seconds }">
							<span class="countdown-section">
								<span class="countdown-amount d-block">{{ days }}</span>
								<span class="countdown-period d-block">Days</span>
							</span>
							<span class="countdown-section">
								<span class="countdown-amount d-block">{{ hours }}</span>
								<span class="countdown-period d-block">Hours</span>
							</span>
							<span class="countdown-section">
								<span class="countdown-amount d-block">{{ minutes }}</span>
								<span class="countdown-period d-block">Minutes</span>
							</span>
							<span class="countdown-section">
								<span class="countdown-amount d-block">{{ seconds }}</span>
								<span class="countdown-period d-block">Seconds</span>
							</span>
						</vue-countdown>
					</div>
				</div>
				<h2 class="mb-1">Reports are under maintainance!</h2>
				<p class="mb-3">We are working very hard on the new version of our Reports.<br /> It will bring a lot of
					new features. Stay tuned!
				</p>
				<!-- <button class="btn btn-lg btn-outline-info" @click="" title="Redirect"> -->
				<button class="btn btn-lg btn-outline-info" @click="submitForm" title="Redirect">
                    <i class="fa fa-sync-alt"></i> Go Back
                </button>
			</div>
			<!-- END coming-soon-content -->
		</div>
	</div>
	<!-- END coming-soon -->
</template>