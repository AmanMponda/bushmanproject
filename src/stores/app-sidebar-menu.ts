import { defineStore } from "pinia";
import { ref, computed, watch } from "vue";
import { useAuthStore } from "@/stores/auth";

interface MenuItem {
  url?: string;
  icon?: string;
  text?: string;
  is_header?: boolean;
  is_divider?: boolean;
  label?: string;
  children?: MenuItem[];
  permission?: string;
}

interface Service {
  service_id: number;
  name: string;
}

export const useAppSidebarMenuStore = defineStore("appSidebarMenu", () => {
  const authStore = useAuthStore();
  const activeServiceId = ref<number | null>(null);
  const getActiveServiceId = computed(() => activeServiceId.value);

  // Use the auth store's reactive permissions
  const permissions = computed(() => authStore.permissions);

  // Deep filter menu items based on permissions
  const filterMenuByPermission = (items: MenuItem[]): MenuItem[] => {
    return items.filter(item => {
      // Always show headers and dividers
      if (item.is_header || item.is_divider) return true;

      // Show item if it has no permission requirement
      if (!item.permission) return true;

      // Check if user has the required permission
      return permissions.value.includes(item.permission);
    }).map(item => {
      // Recursively filter children if they exist
      if (item.children) {
        const filteredChildren = filterMenuByPermission(item.children);
        // Only keep parent if it has children or has no permission requirement
        return filteredChildren.length > 0 || !item.permission
          ? { ...item, children: filteredChildren }
          : null;
      }
      return item;
    }).filter(Boolean) as MenuItem[];
  };

  // Initialize activeServiceId - will be loaded lazily when needed
  // Avoid synchronous localStorage read at module level for better performance

  const commonMenuItems = computed<MenuItem[]>(() => [

    {
      url: "/companies-dashboard",
      icon: "fa fa-home",
      text: "Apps",
    },
    {
      is_divider: true,
      text: ''
    },
  ]);

  const maCargoMenuItems = computed<MenuItem[]>(() => [
    ...commonMenuItems.value,
    {
      is_header: true,
      text: 'MA Cargo Dashboard'
    },
    {
      url: "/ma-cargo/sales-dashboard",
      icon: "fa fa-line-chart",
      text: "Sales",
      permission: "CAN_VIEW_GENERAL_DASHBOARD"
    },
    {
      url: "/ma-cargo/operation-dashboard",
      icon: "fa fa-cog",
      text: "Operation",
      permission: "CAN_VIEW_OPERATION_DASHBOARD"
    },
    {
      url: "/ma-cargo/procurement-dashboard",
      icon: "fa fa-shopping-cart",
      text: "Procurement",
      permission: "CAN_VIEW_PROCUREMENT_DASHBOARD"
    },
    {
      url: "/ma-cargo/workshop-dashboard",
      icon: "fa fa-cogs",
      text: "Workshop",
      permission: "CAN_VIEW_WORKSHOP_DASHBOARD"
    },
    {
      url: "/ma-cargo/fuel-dashboard",
      icon: "fa-solid fa-gas-pump",
      text: "Fuel",
      permission: "CAN_VIEW_FUEL_DASHBOARD"
    },
    {
      url: "/ma-cargo/store-dashboard",
      icon: "fa fa-industry",
      text: "Store",
      permission: "CAN_VIEW_INVENTORY_DASHBOARD"
    },
    {
      url: "/ma-cargo/account-dashboard",
      icon: "fa fa-calculator",
      text: "Accounts",
      permission: "CAN_VIEW_ACCOUNT_DASHBOARD"
    },
    {
      url: "/ma-cargo/healthy-safety-dashboard",
      icon: "fa fa-heartbeat",
      text: "Healthy & Safety",
      permission: "CAN_VIEW_HEALTHY_SAFETY_DASHBOARD"
    },
    {
      url: "/ma-cargo/insurance-dashboard",
      icon: "fa fa-shield-alt",
      text: "Insurance",
      permission: "CAN_VIEW_INSURANCE_DASHBOARD"
    },
    {
      url: "/ma-cargo/hrm-dashboard",
      icon: "fa fa-users",
      text: "HRM",
      permission: "CAN_VIEW_HRM_DASHBOARD"
    },
    {
      url: "/ma-cargo/administration-dashboard",
      icon: "fas fa-folder-open",
      text: "Administration",
      permission: "CAN_VIEW_ADMINISTRATION_DASHBOARD"
    },
    {
      url: "/ma-cargo/reports",
      icon: "fa fa-chart-bar",
      text: "Reports",
      permission: "CAN_VIEW_REPORTS"
    },
  ]);


  const absMenuItems = computed<MenuItem[]>(() => [
    ...commonMenuItems.value,
    {
      is_header: true,
      text: 'ABS Dashboard'
    },
    {
      url: "/abs-sales",
      icon: "fa fa-line-chart",
      text: "Sales",
      permission: "CAN_VIEW_SALES_DASHBOARD"
    },
    {
      url: "/abs/operation-dashboard",
      icon: "fa fa-cog",
      text: "Operation",
      permission: "CAN_VIEW_OPERATION_DASHBOARD"
    },
    {
      url: "/abs/procurement-dashboard",
      icon: "fa fa-shopping-cart",
      text: "Procurement",
      permission: "CAN_VIEW_PROCUREMENT_DASHBOARD"
    },
    {
      url: "/abs/workshop-dashboard",
      icon: "fa fa-cogs",
      text: "Workshop",
      permission: "CAN_VIEW_WORKSHOP_DASHBOARD"
    },
    {
      url: "/abs/fuel-dashboard",
      icon: "fa-solid fa-gas-pump",
      text: "Fuel",
      permission: "CAN_VIEW_FUEL_DASHBOARD"
    },
    {
      url: "/abs/store-dashboard",
      icon: "fa fa-industry",
      text: "Store",
      permission: "CAN_VIEW_STORE_DASHBOARD"
    },
    {
      url: "/abs/account-dashboard",
      icon: "fa fa-calculator",
      text: "Accounts",
      permission: "CAN_VIEW_ACCOUNT_DASHBOARD"
    },
    {
      url: "/abs/healthy-safety-dashboard",
      icon: "fa fa-heartbeat",
      text: "Healthy & Safety",
      permission: "CAN_VIEW_HEALTHY_SAFETY_DASHBOARD"
    },
    {
      url: "/abs/insurance-dashboard",
      icon: "fa fa-shield-alt",
      text: "Insurance",
      permission: "CAN_VIEW_INSURANCE_DASHBOARD"
    },
    {
      url: "/abs/crm-dashboard",
      icon: "fa fa-headset",
      text: "CRM",
      permission: "CAN_VIEW_CRM_DASHBOARD"
    },
    {
      url: "/abs/hrm-dashboard",
      icon: "fa fa-users",
      text: "HRM",
      permission: "CAN_VIEW_HRM_DASHBOARD"
    },
    {
      url: "/abs/administration-dashboard",
      icon: "fas fa-folder-open",
      text: "Administration",
      permission: "CAN_VIEW_ADMINISTRATION_DASHBOARD"
    },
    {
      url: "/abs/reports",
      icon: "fa fa-chart-bar",
      text: "Reports",
      permission: "CAN_VIEW_REPORTS"
    },
  ]);


  const gHRMMenuItems = computed<MenuItem[]>(() => [
    ...commonMenuItems.value,
    {
      is_header: true,
      text: 'GHRM Dashboard'
    },
    {
      url: "/ghrm/general-dashboard",
      icon: "fa fa-tachometer-alt",
      text: "General Dashboard",
    },
    {
      url: "/ghrm/reports",
      icon: "fa fa-chart-bar",
      text: "Reports",
      permission: "CAN_VIEW_REPORTS"
    },
    // {
    //   url: "/abs/account-dashboard",
    //   icon: "fa fa-calculator",
    //   text: "Account Dashboard",
    //   // permission: "CAN_VIEW_ACCOUNT_DASHBOARD"
    // },
    // {
    //   url: "/abs/store-dashboard",
    //   icon: "fa fa-industry",
    //   text: "Store Dashboard",
    //   // permission: "CAN_VIEW_INVENTORY_DASHBOARD"
    // },
    // {
    //   url: "/abs/hrm-dashboard",
    //   icon: "fa fa-users",
    //   text: "HRM Dashboard",
    //   // permission: "CAN_VIEW_HRM_DASHBOARD"
    // },
    // {
    //   url: "/abs/fuel-dashboard",
    //   icon: "fa-solid fa-gas-pump",
    //   text: "Fuel Dashboard",
    //   // permission: "CAN_VIEW_FUEL_DASHBOARD"
    // },
    {
      url: "/ghrm-reports",
      icon: "fa fa-chart-bar",
      text: "Reports",
    },
  ]);


  const petaMenuItems = computed<MenuItem[]>(() => [
    ...commonMenuItems.value,
    {
      is_header: true,
      text: 'Peta Holding Dashboard'
    },
    {
      url: "/peta/operations-overview",
      icon: "fa fa-tachometer-alt",
      text: "Operations Overview",
      permission: "CAN_VIEW_OPERATION_OVERVIEW"
    },
    {
      url: "/peta/requisitions",
      icon: "fa fa-file-alt",
      text: "Requisitions",
      // permission: "CAN_VIEW_OPERATION_OVERVIEW"
    },
    {
      url: "/peta/reports",
      icon: "fa fa-chart-bar",
      text: "Reports",
      permission: "CAN_VIEW_REPORTS"
    },
    // {
    //   url: "/abs/account-dashboard",
    //   icon: "fa fa-calculator",
    //   text: "Account Dashboard",
    //   // permission: "CAN_VIEW_ACCOUNT_DASHBOARD"
    // },
    // {
    //   url: "/abs/store-dashboard",
    //   icon: "fa fa-industry",
    //   text: "Store Dashboard",
    //   // permission: "CAN_VIEW_INVENTORY_DASHBOARD"
    // },
    // {
    //   url: "/abs/hrm-dashboard",
    //   icon: "fa fa-users",
    //   text: "HRM Dashboard",
    //   // permission: "CAN_VIEW_HRM_DASHBOARD"
    // },
    // {
    //   url: "/abs/fuel-dashboard",
    //   icon: "fa-solid fa-gas-pump",
    //   text: "Fuel Dashboard",
    //   // permission: "CAN_VIEW_FUEL_DASHBOARD"
    // },
  ]);


  const bushmanMenuItems = computed<MenuItem[]>(() => [
    ...commonMenuItems.value,
    {
      text: 'Bushman Menu',
      is_header: true,
    },

    {
      url: '/bushman/dashboard',
      icon: 'fa fa-home',
      text: 'Dashboard',
      permission: 'CAN_VIEW_BUSHMAN_DASHBOARD'
    },
    {
      url: '/sales/quotas',
      icon: 'fa fa-star-half',
      text: 'Sales Quotas',
      permission: 'CAN_VIEW_SALES_QUOTAS'
    },
    {
      url: '/sales/sales-calendar',
      icon: 'fa fa-calendar',
      text: 'Sales Calendar',
      permission: 'CAN_VIEW_CALENDAR'
    },
    {
      url: '/sales/sales-pipeline',
      icon: 'fa fa-project-diagram',
      text: 'Sales Pipeline',
      permission: 'CAN_VIEW_SALES_PIPELINE'
    },
    {
      url: '/sales',
      icon: 'fa fa-shopping-cart',
      text: 'Sales',
      permission: 'CAN_VIEW_SALES',
      children: [
        { url: '/sales/price-list', text: 'Price Lists', permission: 'CAN_VIEW_PRICE_LISTS' },
        { url: '/sales/sales-inquiry', text: 'Sales Quotations', permission: 'CAN_VIEW_SALES_INQUIRY' },
        { url: '/orders', text: 'Orders', permission: 'CAN_VIEW_SALES_CONFIRMATIONS' },
        { url: '/sales/sales-contracts', text: 'Sales Contracts', permission: 'CAN_VIEW_SALES_CONTRACTS' },
      ],

    },
    {
      url: '/operations',
      icon: 'fa fa-tasks',
      text: 'Operations',
      permission: 'CAN_VIEW_OPERATIONS',
      children: [
        { url: '/operations/hunting-license', text: 'Hunting permits', permission: 'CAN_VIEW_HUNTING_LICENSE' },
        { url: '/operations/game', text: 'Hunting Games', permission: 'CAN_VIEW_GAME' },       
        { url: '/operations/game-requitions', text: 'Game requisitions', permission: 'CAN_VIEW_GAME_REQUISITIONS' },
        // { url: '/operations/hunting-license', text: 'Hunting License', permission: 'CAN_VIEW_HUNTING_LICENSE' },
        // { url: '/operations/game', text: 'Game', permission: 'CAN_VIEW_GAME' },
        // { url: '/operations/game-requitions', text: 'Game Requisitions', permission: 'CAN_VIEW_GAME_REQUISITIONS' },
      ],

    },  

    {
      url: '/accounts',
      icon: 'fa fa-dollar-sign',
      text: 'Accounts',
      permission: 'CAN_VIEW_ACCOUNTS',
    },
    {
      url: '/procurement',
      icon: 'fa fa-shopping-bag',
      text: 'Procurement',
      permission: 'CAN_VIEW_PROCUREMENT',
    },
    {
      url: '/hr',
      icon: 'fa fa-users',
      text: 'HR',
      permission: 'CAN_VIEW_HR',
    },
    {
      url: '/reports',
      icon: 'fa fa-chart-bar',
      text: 'Reports',
      permission: 'CAN_VIEW_REPORTS',
    },
    {
      text: 'Settings',
      is_header: true,
    },
    {
      url: '/module-settings',
      icon: 'fa fa-cog',
      text: 'Module Settings',
      permission: 'CAN_VIEW_MODULE_SETTINGS',
      children: [
        {url: '/module-settings/species-settings/species',text: 'Species',permission: 'CAN_VIEW_SPECIES_SETTINGS'},
        { url: '/module-settings/area-settings',text: 'Hunting Areas',permission: 'CAN_VIEW_AREA_SETTINGS'},
        { url: '/module-settings/hunting-types', text: 'Hunting Types', permission: 'CAN_VIEW_HUNTING_TYPES' },
        { url: '/module-settings/qoutas-settings', text: 'Quotas', permission: 'CAN_VIEW_QUOTAS_SETTINGS' },
        { url: '/module-settings/regulatory-package', text: 'Hunting Licences', permission: 'CAN_VIEW_REGULATORY_PACKAGE' },


        { url: '/module-settings/sales-package', text: 'Sales Package', permission: 'CAN_VIEW_SALES_PACKAGE' },
        { url: '/module-settings/trophy-fees', text: 'Trophy Fees', permission: 'CAN_VIEW_TROPHY_FEES' },
        { url: '/module-settings/upgrade-fees', text: 'Upgrade Fees', permission: 'CAN_VIEW_SALES_PACKAGE' },
        { url: '/module-settings/items', text: 'Items', permission: 'CAN_VIEW_MODULE_SETTINGS' },
        { url: '/module-settings/government-fees', text: 'Government Fees', permission: 'CAN_VIEW_MODULE_SETTINGS' },
        { url: '/module-settings/documents', text: 'Documents', permission: 'CAN_VIEW_MODULE_SETTINGS' },
        // { url: '/module-settings/safari-fee-deposits', text: 'Deposits Planning', permission: 'CAN_VIEW_SAFARI_FEE_DEPOSITS' },
        // { url: '/module-settings/sales-extra-services', text: 'Extra Services', permission: 'CAN_VIEW_SALES_EXTRA_SERVICES' },

        //   ],
        // },

        // { url: '/module-settings/terms', text: 'Terms', permission: 'CAN_VIEW_APPROVAL_CHAIN' },

        // { url: '/module-settings/accounts', text: 'Accounts', permission: 'CAN_VIEW_MODULE_SETTINGS' },

        

      ],
    },
    {
      url: '/settings',
      icon: 'fa fa-wrench',
      text: 'Settings',
      permission: 'CAN_VIEW_SETTINGS',
    },
    {
      url: '/preferences',
      icon: 'fa fa-sliders-h',
      text: 'Preferences',
      permission: 'CAN_VIEW_PREFERENCES',
    },




  ]);

  // Get the appropriate menu based on active service AND filter by permissions
  const menuItems = computed<MenuItem[]>(() => {
    let items: MenuItem[];


    switch (activeServiceId.value) {
      case 13: // Bushman
        items = bushmanMenuItems.value;
        break;
      default:
        items = commonMenuItems.value;
        break;
    }


    // Apply permission filtering
    return filterMenuByPermission(items);
  });

  // Watch for permission changes and force menu update
  watch(permissions, () => {
    // This will trigger recomputation of menuItems
    menuItems.value;
  });

  // Action to set the active service
  const setActiveService = (serviceId: number | null) => {
    activeServiceId.value = serviceId;
    if (serviceId !== null) {
      // Save to localStorage when setting
      const savedService = localStorage.getItem('selectedService');
      if (savedService) {
        try {
          const service: Service = JSON.parse(savedService);
          if (service.service_id !== serviceId) {
            // Update if different
            localStorage.setItem('selectedService', JSON.stringify({ service_id: serviceId }));
          }
        } catch (e) {
          // If parsing fails, just set new value
          localStorage.setItem('selectedService', JSON.stringify({ service_id: serviceId }));
        }
      } else {
        localStorage.setItem('selectedService', JSON.stringify({ service_id: serviceId }));
      }
    } else {
      localStorage.removeItem('selectedService');
    }
  };

  // Get the current active service (lazy load from localStorage if not set)
  const getActiveService = () => {
    if (activeServiceId.value === null) {
      // Lazy load from localStorage only when needed
      const savedService = localStorage.getItem('selectedService');
      if (savedService) {
        try {
          const service: Service = JSON.parse(savedService);
          activeServiceId.value = service.service_id;
        } catch (e) {
          // Silently handle error, remove corrupted data
          localStorage.removeItem('selectedService');
        }
      }
    }
    return activeServiceId.value;
  };

  return {
    menuItems,
    setActiveService,
    getActiveService,
    getActiveServiceId,
    permissions
  };
});
