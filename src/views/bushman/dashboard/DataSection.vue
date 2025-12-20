<template>
  <BootstrapInnerLoading :loading="loadingStats">
    <div class="row g-3">
      <div v-for="metric in dashboardMetrics" :key="metric.id" class="col-12 col-sm-6 col-md-4 col-lg-3 col-xl">
        <DataSectionItem
          :disabled="loadingStats"
          :title="metric.title"
          :value="metric.value"
          :change-text="metric.changeText"
          :up="metric.changeDirection === 'up'"
          :icon-background="metric.iconBackground"
          :icon-color="metric.iconColor"
        >
          <template #icon>
            <i class="bi" :class="`bi-${getIconName(metric.icon)}`" style="font-size: 24px"></i>
          </template>
        </DataSectionItem>
      </div>
    </div>
  </BootstrapInnerLoading>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useColors } from '@/composables/useColors'
import { useStatsStore } from '@/stores/bushman/stats-store'
import DataSectionItem from './DataSectionItem.vue'
import BootstrapInnerLoading from '@/components/bootstrap/InnerLoading.vue'
import type { DashboardMetric } from '../../../interfaces/IQuota'

// Composables
const { getColor } = useColors()
const statsStore = useStatsStore()

// Store state
const loadingStats = computed(() => statsStore.loadingStats)
const quotaStats = computed(() => statsStore.quotaStats)

// Computed
const dashboardMetrics = computed((): DashboardMetric[] => [
  {
    id: 'totalquota',
    title: 'Total Quota Balance',
    value: quotaStats.value?.totalQuota ?? '0',
    icon: 'folder-open',
    changeText: quotaStats.value?.quota ?? '',
    changeDirection: 'up',
    iconBackground: getColor('secondary'),
    iconColor: getColor('on-info'),
  },
  {
    id: 'provisioned',
    title: 'Total Provisioned',
    value: quotaStats.value?.provisioned ?? '0',
    icon: 'hourglass-split',
    changeText: quotaStats.value?.quota ?? '',
    changeDirection: 'up',
    iconBackground: getColor('warning'),
    iconColor: getColor('on-primary'),
  },
  {
    id: 'confirmed',
    title: 'Total Confirmed',
    value: quotaStats.value?.confirmed ?? '0',
    icon: 'check-circle',
    changeText: quotaStats.value?.quota ?? '',
    changeDirection: 'up',
    iconBackground: getColor('success'),
    iconColor: getColor('on-primary'),
  },
  {
    id: 'cancelled',
    title: 'Total Cancelled',
    value: quotaStats.value?.cancelled ?? '0',
    icon: 'x-circle',
    changeText: quotaStats.value?.quota ?? '',
    changeDirection: 'up',
    iconBackground: getColor('danger'),
    iconColor: getColor('on-primary'),
  },
  {
    id: 'taken',
    title: 'Total Taken',
    value: quotaStats.value?.taken ?? '0',
    icon: 'clipboard-check',
    changeText: quotaStats.value?.quota ?? '',
    changeDirection: 'up',
    iconBackground: getColor('primary'),
    iconColor: getColor('on-danger'),
  },
])

// Methods
const getIconName = (icon: string): string => {
  // Convert to Bootstrap Icons
  const iconMap: Record<string, string> = {
    'mso-folder_open': 'folder-open',
    'folder-open': 'folder-open',
    'pets': 'clipboard-check',
    'hourglass-split': 'hourglass-split',
    'check-circle': 'check-circle',
    'x-circle': 'x-circle',
    'clipboard-check': 'clipboard-check',
  }
  return iconMap[icon] || icon
}

// Lifecycle
onMounted(() => {
  statsStore.getStats()
})
</script>

<style scoped>
/* Bootstrap grid handles the responsive layout */
.col-xl {
  flex: 1 0 0%;
}

/* Additional spacing utilities if needed */
.g-3 {
  --bs-gutter-x: 1rem;
  --bs-gutter-y: 1rem;
}
</style>