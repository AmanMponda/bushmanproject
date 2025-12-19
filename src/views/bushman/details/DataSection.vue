<template>
  <BootstrapInnerLoading :loading="loadingStats">
    <div class="metrics-grid">
      <div v-for="metric in dashboardMetrics" :key="metric.id" class="metric-card">
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
            <i class="material-icons" style="font-size: 24px">{{ getIconName(metric.icon) }}</i>
          </template>
        </DataSectionItem>
      </div>
    </div>
  </BootstrapInnerLoading>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { useColors } from '../../../composables/useColors'
import DataSectionItem from './DataSectionItem.vue'
import { mapActions, mapState } from 'pinia'
import { useStatsStore } from '@/stores/bushman/stats-store'
import type { DashboardMetric } from '@/interfaces/IQuota'
import BootstrapInnerLoading from '@/components/bootstrap/InnerLoading.vue'

export default defineComponent({
  name: 'DataSection',
  components: {
    DataSectionItem,
    BootstrapInnerLoading,
  },
  setup() {
    return {}
  },

  data() {
    const { getColor } = useColors()

    return {
      getColor,
    }
  },

  computed: {
    ...mapState(useStatsStore, ['loadingStats', 'quotaStats']),

    dashboardMetrics(): DashboardMetric[] {
      return [
        {
          id: 'totalquota',
          title: 'Total Quota Balance',
          value: this.quotaStats?.totalQuota ?? '0',
          icon: 'mso-folder_open',
          changeText: this.quotaStats?.quota ?? '',
          changeDirection: 'up',
          iconBackground: this.getColor('secondary'),
          iconColor: this.getColor('on-info'),
        },
        {
          id: 'provisioned',
          title: 'Total provisioned ',
          value: this.quotaStats?.provisioned ?? '0',
          icon: 'pets',
          changeText: this.quotaStats?.quota ?? '',
          changeDirection: 'up',
          iconBackground: this.getColor('warning'),
          iconColor: this.getColor('on-primary'),
        },
        {
          id: 'confirmed',
          title: ' Total Confirmed ',
          value: this.quotaStats?.confirmed ?? '0',
          icon: 'pets',
          changeText: this.quotaStats?.quota ?? '',
          changeDirection: 'up',
          iconBackground: this.getColor('success'),
          iconColor: this.getColor('on-primary'),
        },

        {
          id: 'cancelled',
          title: 'Total Cancelled ',
          value: this.quotaStats?.cancelled ?? '0',
          icon: 'pets',
          changeText: this.quotaStats?.quota ?? '',
          changeDirection: 'up',
          iconBackground: this.getColor('danger'),
          iconColor: this.getColor('on-primary'),
        },

        {
          id: 'taken',
          title: 'Total Taken',
          value: this.quotaStats?.taken ?? '0',
          icon: 'pets',
          changeText: this.quotaStats?.quota ?? '',
          changeDirection: 'up',
          iconBackground: this.getColor('primary'),
          iconColor: this.getColor('on-danger'),
        },
      ]
    },
  },
  mounted() {
    this.getStats()
  },
  methods: {
    ...mapActions(useStatsStore, ['getStats']),
    getIconName(icon: string): string {
      // Convert Vuestic icon names to Material Icons
      const iconMap: Record<string, string> = {
        'mso-folder_open': 'folder_open',
        pets: 'pets',
      }
      return iconMap[icon] || icon.replace('mso-', '')
    },
  },
})
</script>

<style lang="scss" scoped>
.metrics-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 20px;
}

.metric-card {
  display: flex;
}

@media (max-width: 1200px) {
  .metrics-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

@media (max-width: 992px) {
  .metrics-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 768px) {
  .metrics-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
  }
}

@media (max-width: 576px) {
  .metrics-grid {
    grid-template-columns: 1fr;
  }
}
</style>
