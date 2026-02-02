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
      is_header: true,
      text: 'Company Dashboard'
    },
    {
      url: "/companies-dashboard",
      icon: "fa fa-home",
      text: "Home",
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
      icon: "fa fa-chart-line",
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
      icon: "fa fa-gas-pump",
      text: "Fuel",
      permission: "CAN_VIEW_FUEL_DASHBOARD"
    },
    {
      url: "/ma-cargo/store-dashboard",
      icon: "fa fa-store",
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
      icon: "fa fa-shield-heart",
      text: "Healthy & Safety",
      permission: "CAN_VIEW_HEALTHY_SAFETY_DASHBOARD"
    },
    {
      url: "/ma-cargo/insurance-dashboard",
      icon: "fa fa-shield",
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
      icon: "fa fa-folder-open",
      text: "Administration",
      permission: "CAN_VIEW_ADMINISTRATION_DASHBOARD"
    },
    {
      url: "/ma-cargo/reports",
      icon: "fa fa-file-alt",
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
      url: '/sales',
      icon: 'fa fa-chart-line',
      text: 'Sales',
      permission: 'CAN_VIEW_SALES',
      children: [
        { url: '/sales/quotas', icon: 'fa fa-star-half', text: 'Sales Quotas', permission: 'CAN_VIEW_SALES_QUOTAS' },
        { url: '/sales/sales-calendar', icon: 'fa fa-calendar', text: 'Sales Calendar', permission: 'CAN_VIEW_CALENDAR' },
        { url: '/sales/sales-pipeline', icon: 'fa fa-project-diagram', text: 'Sales Pipeline', permission: 'CAN_VIEW_SALES_PIPELINE' },
        { url: '/sales/price-list', icon: 'fa fa-tags', text: 'Price Lists', permission: 'CAN_VIEW_PRICE_LISTS' },
        { url: '/sales/charter-prices', icon: 'fa fa-dollar-sign', text: 'Charter Prices', permission: 'CAN_VIEW_PRICE_LISTS' },
        { url: '/sales/sales-inquiry', icon: 'fa fa-search-dollar', text: 'Sales Quotations', permission: 'CAN_VIEW_SALES_INQUIRY' },
        { url: '/orders', icon: 'fa fa-shopping-cart', text: 'Sales Orders', permission: 'CAN_VIEW_SALES_CONFIRMATIONS' },
        { url: '/contracts', icon: 'fa fa-file-contract', text: 'Sales Contracts', permission: 'CAN_VIEW_SALES_CONTRACTS' },
      ],
    },
    {
      url: '/operations',
      icon: 'fa fa-cog',
      text: 'Operation',
      permission: 'CAN_VIEW_OPERATIONS',
      children: [
        { url: '/operations/hunting-license', icon: 'fa fa-certificate', text: 'Hunting Permits', permission: 'CAN_VIEW_HUNTING_LICENSE' },
        { url: '/operations/game', icon: 'fa fa-paw', text: 'Hunting Games', permission: 'CAN_VIEW_GAME' },
        { url: '/operations/game-requitions', icon: 'fa fa-clipboard-list', text: 'Game Requisitions', permission: 'CAN_VIEW_GAME_REQUISITIONS' },
      ],
    },
    {
      url: '/procurement',
      icon: 'fa fa-shopping-cart',
      text: 'Procurement',
      permission: 'CAN_VIEW_PROCUREMENT',
      children: [
        { url: '/procurement/suppliers', icon: 'fa fa-truck', text: 'Suppliers', permission: 'CAN_VIEW_PROCUREMENT' },
      ]
    },
    {
      url: '/store',
      icon: 'fa fa-store',
      text: 'Store',
      permission: 'CAN_VIEW_STORE',
    },
    {
      url: '/bushman/assets/fleet-master',
      icon: 'fa fa-boxes-stacked',
      text: 'Assets',
      permission: 'CAN_VIEW_ASSETS',
      children: [
        { url: '/bushman/assets/fleet-master', icon: 'fa fa-truck', text: 'Fleet Master', permission: 'CAN_VIEW_FLEET' },
        { url: '/bushman/assets/location-history', icon: 'fa fa-map-marker-alt', text: 'Location History', permission: 'CAN_VIEW_LOCATION_HISTORY' },
        { url: '/bushman/assets/odometer-reading', icon: 'fa fa-tachometer-alt', text: 'Odometer Reading', permission: 'CAN_VIEW_ODOMETER_READING_HISTORY' },
      ]
    },
    {
      url: '/accounting',
      icon: 'fa fa-calculator',
      text: 'Accounts',
      permission: 'CAN_VIEW_ACCOUNTS',
      children: [
        { url: '/sales/requisitions', icon: 'fa fa-file-alt', text: 'Requisitions', permission: 'CAN_VIEW_SALES' },
        { url: '/accounting/journal-vouchers', icon: 'fa fa-receipt', text: 'Payment Vouchers', permission: 'CAN_VIEW_ACCOUNTS' },
        { url: '/accounting/invoices', icon: 'fa fa-file-invoice', text: 'Invoices', permission: 'CAN_VIEW_ACCOUNTS' },
        { url: '/accounting/chart-of-accounts', text: 'Chart of Accounts', permission: 'CAN_VIEW_ACCOUNTS' },
      ]
    },
    {
      url: '/hr',
      icon: 'fa fa-users',
      text: 'HRM',
      permission: 'CAN_VIEW_HR',
    },
    {
      url: '/administration',
      icon: 'fa fa-folder-open',
      text: 'Administration',
      permission: 'CAN_VIEW_ADMINISTRATION',
      children: [
        { url: '/location-master', icon: 'fa fa-map-marker-alt', text: 'Location Master' },
      ]
    },
    {
      url: '/reports',
      icon: 'fa fa-file-alt',
      text: 'Reports',
      permission: 'CAN_VIEW_REPORTS',
    },
    {
      text: 'Settings',
      is_header: true,
    },
    // {
    //   url: '/module-settings',
    //   icon: 'fa fa-cog',
    //   text: 'Module Settings',
    //   permission: 'CAN_VIEW_MODULE_SETTINGS',
    //   children: [
    //     {url: '/module-settings/species-settings/species',text: 'Species',permission: 'CAN_VIEW_SPECIES_SETTINGS'},
    //     { url: '/module-settings/area-settings',text: 'Hunting Areas',permission: 'CAN_VIEW_AREA_SETTINGS'},
    //     { url: '/module-settings/hunting-types', text: 'Hunting Types', permission: 'CAN_VIEW_HUNTING_TYPES' },
    //     { url: '/module-settings/qoutas-settings', text: 'Quotas', permission: 'CAN_VIEW_QUOTAS_SETTINGS' },
    //     { url: '/module-settings/regulatory-package', text: 'Hunting Licences', permission: 'CAN_VIEW_REGULATORY_PACKAGE' },


    //     { url: '/module-settings/sales-package', text: 'Sales Package', permission: 'CAN_VIEW_SALES_PACKAGE' },
    //     { url: '/module-settings/trophy-fees', text: 'Trophy Fees', permission: 'CAN_VIEW_TROPHY_FEES' },
    //     { url: '/module-settings/upgrade-fees', text: 'Upgrade Fees', permission: 'CAN_VIEW_SALES_PACKAGE' },
    //     { url: '/module-settings/items', text: 'Items', permission: 'CAN_VIEW_MODULE_SETTINGS' },
    //     { url: '/module-settings/government-fees', text: 'Government Fees', permission: 'CAN_VIEW_MODULE_SETTINGS' },
    //     { url: '/module-settings/documents', text: 'Documents', permission: 'CAN_VIEW_MODULE_SETTINGS' },
    //     { url: '/module-settings/installment-setups', text: 'Installment Setups', permission: 'CAN_VIEW_MODULE_SETTINGS' },
    //     { url: '/module-settings/approval-chain', text: 'Approval Chain', permission: 'CAN_VIEW_APPROVAL_CHAIN' },
    //     { url: '/module-settings/requisition-types', text: 'Requisition Types', permission: 'CAN_VIEW_MODULE_SETTINGS' },
    //     { url: '/module-settings/cost-centers', text: 'Cost Centers', permission: 'CAN_VIEW_MODULE_SETTINGS' },
    //     // { url: '/module-settings/safari-fee-deposits', text: 'Deposits Planning', permission: 'CAN_VIEW_SAFARI_FEE_DEPOSITS' },
    //     // { url: '/module-settings/sales-extra-services', text: 'Extra Services', permission: 'CAN_VIEW_SALES_EXTRA_SERVICES' },

    //     //   ],
    //     // },

    //     // { url: '/module-settings/terms', text: 'Terms', permission: 'CAN_VIEW_APPROVAL_CHAIN' },

    //     // { url: '/module-settings/accounts', text: 'Accounts', permission: 'CAN_VIEW_MODULE_SETTINGS' },



    //   ],
    // },
    // ...existing code...
    // {
    //   text: 'Settings',
    //   is_header: true,
    // },
    {
      url: '/settings',
      icon: 'fa fa-cog',
      text: 'Sales & Packages',
      permission: 'CAN_VIEW_SETTINGS',
      children: [
        { url: '/module-settings/species-settings/species', text: 'Species', permission: 'CAN_VIEW_SPECIES_SETTINGS' },
        { url: '/module-settings/area-settings', text: 'Hunting Areas', permission: 'CAN_VIEW_AREA_SETTINGS' },
        { url: '/module-settings/hunting-types', text: 'Hunting Types', permission: 'CAN_VIEW_HUNTING_TYPES' },
        { url: '/module-settings/entities', text: 'Entity Management', permission: 'CAN_VIEW_MODULE_SETTINGS' },
        // { url: '/module-settings/installment-setups', text: 'Installment Setups', permission: 'CAN_VIEW_MODULE_SETTINGS' },
        { url: '/module-settings/sales-package', text: 'Sales Package', permission: 'CAN_VIEW_SALES_PACKAGE' },
      ],
    },
    {
      url: '/settings/licensing',
      icon: 'fa fa-certificate',
      text: 'Fees & permits',
      permission: 'CAN_VIEW_SETTINGS',
      children: [
        { url: '/module-settings/regulatory-package', text: 'Hunting Licences', permission: 'CAN_VIEW_REGULATORY_PACKAGE' },
        { url: '/module-settings/government-fees', text: 'Government Fees', permission: 'CAN_VIEW_MODULE_SETTINGS' },
        { url: '/module-settings/qoutas-settings', text: 'Quotas', permission: 'CAN_VIEW_QUOTAS_SETTINGS' },
        { url: '/module-settings/trophy-fees', text: 'Trophy Fees', permission: 'CAN_VIEW_TROPHY_FEES' },
        { url: '/module-settings/documents', text: 'Documents', permission: 'CAN_VIEW_MODULE_SETTINGS' },
      ],
    },
    {
      url: '/settings/master-data',
      icon: 'fa fa-database',
      text: 'Master Data',
      permission: 'CAN_VIEW_SETTINGS',
      children: [
        // {
        // text: 'Procurement Settings',
        // is_header: false,
        // children: [
        // { url: '/module-settings/supplier-categories', text: 'Supplier Categories', permission: 'CAN_VIEW_MODULE_SETTINGS' },
        //   { url: '/module-settings/purchase-approval-rules', text: 'Purchase Approval Rules', permission: 'CAN_VIEW_MODULE_SETTINGS' },
        //   { url: '/module-settings/reorder-levels', text: 'Reorder Levels', permission: 'CAN_VIEW_MODULE_SETTINGS' },
        //   { url: '/module-settings/procurement-tax-rules', text: 'Procurement Tax Rules', permission: 'CAN_VIEW_MODULE_SETTINGS' },
        // ],
        // },
        {
          text: 'Inventory Settings',
          is_header: false,
          children: [
            { url: '/module-settings/items', text: 'Items', permission: 'CAN_VIEW_MODULE_SETTINGS' },
            { url: '/module-settings/uom', text: 'Unit of Measure (UOM)', permission: 'CAN_VIEW_MODULE_SETTINGS' },
            { url: '/module-settings/warehouses', text: 'Warehouses / Stores', permission: 'CAN_VIEW_MODULE_SETTINGS' },
            { url: '/module-settings/stock-valuation', text: 'Stock Valuation Method', permission: 'CAN_VIEW_MODULE_SETTINGS' },
          ],
        },
        {
          text: 'Asset Management',
          is_header: false,
          children: [
            { url: '/module-settings/asset-categories', text: 'Asset Categories', permission: 'CAN_VIEW_MODULE_SETTINGS' },
            { url: '/module-settings/asset-depreciation', text: 'Asset Depreciation Rules', permission: 'CAN_VIEW_MODULE_SETTINGS' },
            { url: '/module-settings/location-master', text: 'Location Master', permission: 'CAN_VIEW_MODULE_SETTINGS' },
            { url: '/module-settings/vehicle-models', text: 'Vehicle Models', permission: 'CAN_VIEW_MODULE_SETTINGS' },
          ],
        },
        {
          text: 'CRM Settings',
          is_header: false,
          children: [
            { url: '/module-settings/customer-categories', text: 'Customer Categories', permission: 'CAN_VIEW_MODULE_SETTINGS' },
            { url: '/module-settings/customer-types', text: 'Customer Types', permission: 'CAN_VIEW_MODULE_SETTINGS' },
          ],
        },
        {
          text: 'Accounting Settings',
          is_header: false,
          children: [
            { url: '/module-settings/account-dimensions', text: 'Account Dimensions', permission: 'CAN_VIEW_MODULE_SETTINGS' },
            { url: '/accounting/chart-of-accounts', text: 'Chart of Accounts', permission: 'CAN_VIEW_ACCOUNTS' },
            { url: '/module-settings/fiscal-years', text: 'Fiscal Years', permission: 'CAN_VIEW_MODULE_SETTINGS' },
            { url: '/module-settings/accounting-periods', text: 'Accounting Periods', permission: 'CAN_VIEW_MODULE_SETTINGS' },
            { url: '/module-settings/tax-types', text: 'Tax Types', permission: 'CAN_VIEW_MODULE_SETTINGS' },
            { url: '/module-settings/payment-methods', text: 'Payment Methods', permission: 'CAN_VIEW_MODULE_SETTINGS' },
            { url: '/module-settings/currency-setup', text: 'Currency Setup', permission: 'CAN_VIEW_MODULE_SETTINGS' },
            { url: '/module-settings/instalment-rules', text: 'Instalment Rules', permission: 'CAN_VIEW_MODULE_SETTINGS' },
            { url: '/module-settings/revenue-recognition', text: 'Revenue Recognition Rules', permission: 'CAN_VIEW_MODULE_SETTINGS' },
          ],
        },
      ],
    },
    {
      url: '/settings/operations',
      icon: 'fa fa-tasks',
      text: 'Operations Setup',
      permission: 'CAN_VIEW_SETTINGS',
      children: [
        { url: '/module-settings/requisition-types', text: 'Requisition Types', permission: 'CAN_VIEW_MODULE_SETTINGS' },
        { url: '/module-settings/approval-chain', text: 'Approval Chain', permission: 'CAN_VIEW_APPROVAL_CHAIN' },
        { url: '/module-settings/contract-types', text: 'Contract Types', permission: 'CAN_VIEW_MODULE_SETTINGS' },
        { url: '/module-settings/approval-levels', text: 'Approval Levels', permission: 'CAN_VIEW_MODULE_SETTINGS' },
        { url: '/module-settings/escalation-rules', text: 'Escalation Rules', permission: 'CAN_VIEW_MODULE_SETTINGS' },
        { url: '/module-settings/delegation-rules', text: 'Delegation Rules', permission: 'CAN_VIEW_MODULE_SETTINGS' },
      ],
    },
    {
      url: '/settings/system-config',
      icon: 'fa fa-wrench',
      text: 'System Configuration',
      permission: 'CAN_VIEW_SETTINGS',
      children: [
        { url: '/module-settings', text: 'Module Settings', permission: 'CAN_VIEW_MODULE_SETTINGS' },
        { url: '/module-settings/numbering-series', text: 'Numbering Series', permission: 'CAN_VIEW_MODULE_SETTINGS' },
        { url: '/module-settings/date-time-formats', text: 'Date & Time Formats', permission: 'CAN_VIEW_MODULE_SETTINGS' },
        { url: '/module-settings/localization', text: 'Localization', permission: 'CAN_VIEW_MODULE_SETTINGS' },
        { url: '/module-settings/notifications', text: 'Notification Settings', permission: 'CAN_VIEW_MODULE_SETTINGS' },
        { url: '/module-settings/audit-logs', text: 'Audit Logs', permission: 'CAN_VIEW_MODULE_SETTINGS' },
        { url: '/module-settings/user-access', text: 'User & Access Management', permission: 'CAN_VIEW_SETTINGS' },
      ],
    },
    // {
    //   url: '/preferences',
    //   icon: 'fa fa-sliders-h',
    //   text: 'Preferences',
    //   permission: 'CAN_VIEW_PREFERENCES',
    // },
    // // ...existing code...



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
