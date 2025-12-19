export interface QuotaStats {
    confirmed: any
    pending: any
    cancelled: any
    taken: any
    provisioned: any
    totalQuota: any
    quota: any
  }
  
  export interface DashboardMetric {
    id: string
    title: string
    value: string
    icon: string
    changeText: string
    changeDirection: 'up' | 'down'
    iconBackground: string
    iconColor: string
  }
  