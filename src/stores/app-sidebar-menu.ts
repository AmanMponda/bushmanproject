import { defineStore } from "pinia";
import { ref, computed, watch } from "vue";
import { useAuthStore } from "@/stores/auth";

interface MenuItem {
  url?: string;
  icon?: string;
  text: string;
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

  // Try to load selected service from localStorage
  const savedService = localStorage.getItem('selectedService');
  if (savedService) {
    try {
      const service: Service = JSON.parse(savedService);
      activeServiceId.value = service.service_id;
    } catch (e) {
      console.error('Error parsing saved service:', e);
      localStorage.removeItem('selectedService');
    }
  }

  const commonMenuItems = computed<MenuItem[]>(() => [
    {
      is_header: true,
      text: 'Company Dashboard'
    },
    {
      url: "/companies-dashboard",
      icon: "fa fa-home",
      text: "Home",
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

  // Get the appropriate menu based on active service AND filter by permissions
  const menuItems = computed<MenuItem[]>(() => {
    let items: MenuItem[];

    switch (activeServiceId.value) {
      case 82: // Peta Holding
        items = petaMenuItems.value;
        break;
      case 62: // GHRM
        items = gHRMMenuItems.value;
        break;
      case 52: // MA Cargo
        items = maCargoMenuItems.value;
        break;
      case 42: // ABS Analytics
        items = absMenuItems.value;
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
  const setActiveService = (serviceId: number) => {
    activeServiceId.value = serviceId;
  };

  // Get the current active service
  const getActiveService = () => {
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