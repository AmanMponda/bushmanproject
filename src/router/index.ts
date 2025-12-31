import { createRouter, createWebHashHistory } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import { useAppSidebarMenuStore } from '@/stores/app-sidebar-menu';
import { useAppOptionStore } from '@/stores/app-option'; 


import PageComingSoon from "@/views/PageComingSoon.vue"; 

// import Profile from "@/views/Profile.vue"; 
import LoginPage from "@/views/auth/PageLogin.vue"; 
import CompanyDashboard from "@/views/auth/CompanyDashboard.vue"; 
import ComingSoon from "@/views/auth/ComingSoon.vue"; 

// bushman routes
const Dashboard = () => import ('@/views/bushman/dashboard/Dashboard.vue')
const SalesQuotas = () => import ('@/views/bushman/details/QoutaPage.vue')
const Salespipeline = () => import('@/views/bushman/sales/SalesPipeline.vue');
const SalesCalendar = () => import ('@/views/bushman/details/Calendar.vue')
const ManagePriceList = () => import('@/views/bushman/sales/ManagePriceList.vue');
const PriceStructureAddItem = () => import('@/views/bushman/sales/price-structures/PriceStructureAddItem.vue');
const PriceStructureAddPrice = () => import('@/views/bushman/sales/price-structures/PriceStructureAddPrice.vue');
const PriceStructureAddUpgradeFee = () => import('@/views/bushman/sales/price-structures/PriceStructureAddUpgradeFee.vue');
const PriceStructureAddTrophyFee = () => import('@/views/bushman/sales/price-structures/PriceStructureAddTrophyFee.vue');
const PriceStructureAddSafariExtra = () => import('@/views/bushman/sales/price-structures/PriceStructureAddSafariExtra.vue');
const ManageQuotasSettings = () => import('@/views/bushman/module-settings/ManageQuota.vue');
const ManageRegulatoryPackage = () => import('@/views/bushman/module-settings/ManageRegulatoryPackage.vue');
const ManageSalesPackage = () => import('@/views/bushman/module-settings/ManageSalesPackage.vue');
const ManageSalesExtraServices = () => import('@/views/bushman/module-settings/ManageExtras.vue');
const ManageTrophyFees = () => import('@/views/bushman/module-settings/ManageTrophyFees.vue');
// const ManageCompanionHunterCosts = () => import('@/views/bushman/module-settings/ManageCompanionHunterCosts.vue');
const ManageTerms = () => import('@/views/bushman/module-settings/ManageTerms.vue');
const ManageSafariFeeDeposits = () => import('@/views/bushman/module-settings/ManageSafariFeeDeposits.vue');
// const ManageApprovalChain = () => import('@/views/bushman/module-settings/ManageApprovalChain.vue');
const ManageAreaSettings = () => import('@/views/bushman/module-settings/ManageArea.vue');
const ManageHuntingTypes = () => import('@/views/bushman/module-settings/ManageHuntingTypes.vue');
const ManageSpeciesSettings = () => import('@/views/bushman/module-settings/ManageSpecies.vue');
const ManageAccounts = () => import('@/views/bushman/module-settings/ManageAccounts.vue');

const Managesalesinquiry = () => import('@/views/bushman/sales/SalesInquiries.vue');
const Managesalesconfirmation = () => import('@/views/bushman/sales/SalesConfirmationProposals.vue');
const PipelineItemView = () => import('@/views/bushman/sales/sales-pipeline/PipelineItemView.vue');
// const LoginPage = () => import('@/views/auth/PageLogin.vue');
// const CompanyDashboard = () => import('@/views/auth/CompanyDashboard.vue');
// const ComingSoon = () => import('@/views/auth/ComingSoon.vue');
// const Unauthorized = () => import('@/views/auth/Unauthorized.vue');
// const PageComingSoon = () => import('@/views/PageComingSoon.vue');
// const PageError = () => import('@/views/PageError.vue');

// const StoreDashboard = () => import("@/views/MA-Cargo/Store-Management/storeDashboard.vue");
// const OperationDashboard = () => import("@/views/MA-Cargo/Operation-Management/operationDashboard.vue");
// const FuelDashboard = () => import("@/views/MA-Cargo/Fuel-Dashboard/fuelDashboard.vue");
// const Profile = () => import("@/views/Profile.vue");
// const SalesDashboard = () => import("@/views/MA-Cargo/performance_dashboard/Dashboard.vue");
// const GeneralDashboard = () => import("@/views/GHRM/general-dashboard/generalDashboard.vue");
// const AccountDashboard = () => import("@/views/MA-Cargo/account_dashboard/Dashboard.vue");
// const Sales = () => import("@/views/ABS/Sales-Dashboard/sales.vue");
// const ABSOperationDashboard = () => import("@/views/ABS/Operation-Dashboard/absOperationDashboard.vue");
// const ABSFuelDashboard = () => import("@/views/ABS/Fuel-Dashboard/absFuelDashboard.vue");
// const WorkshopDashboard = () => import("@/views/MA-Cargo/Workshop-Dashboard/workshopDashboard.vue");
// const MACargoReports = () => import("@/views/MA-Cargo/Reports/reports.vue");
// const ProcurementDashboard = () => import("@/views/MA-Cargo/Procurement-Dashboard/procurementDashboard.vue");
// const ABSProcurementDashboard = () => import("@/views/ABS/Procurement-Dashboard/absProcurementDashboard.vue");
// const ABSReports = () => import("@/views/ABS/Reports/reports.vue");
// const ABSStoreDashboard = () => import("@/views/ABS/Store-Dashboard/absStoreDashboard.vue");
// const ABSWorkshopDashboard = () => import("@/views/ABS/Workshop-Dashboard/absWorkshopDashboard.vue");
// const HSEDashboard = () => import("@/views/MA-Cargo/HSE-Dashboard/HSEDashboard.vue");
// const AdministrationDashboard = () => import("@/views/MA-Cargo/Administration-Dashboard/administrationDashboard.vue");
// const ABSAdministrationDashboard = () => import("@/views/ABS/Administration-Dashboard/absAdministrationDashboard.vue");
// const gHRMReports = () => import("@/views/GHRM/Reports/reports.vue");
// const ABSHSEDashboard = () => import("@/views/ABS/HSE-Dashboard/absHSEDashboard.vue");
// const ABSAccountDashboard = () => import("@/views/ABS/Account-Dashboard/absAccountDashboard.vue");
// const ABSCRMDashboard = () => import("@/views/ABS/CRM-Dashboard/ABSCRMDashboard.vue");
// const PetaOperationsOverview = () => import("@/views/Peta-Holding/Operations-Overview/operationsOverview.vue");
// const PetaReports = () => import("@/views/Peta-Holding/Reports/reports.vue");

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      name: "login-page",
      component: LoginPage
    },   
    {
      path: "/companies-dashboard",
      name: "companies-dashboard",
      component: CompanyDashboard,
      meta: { requiresAuth: true }
    },
    {
      path: "/coming-soon",
      name: "coming-soon",
      component: ComingSoon
    },

    // bushman routes
    {
      path: "/bushman/dashboard",
      name: "bushman-dashboard",
      component: Dashboard,
      meta: { requiresAuth: true }
    },

    {
      path: "/sales/quotas",
      name: "Qouta-Page",
      component: SalesQuotas,
      meta: { requiresAuth: true }
    },
    {
      path: "/sales/sales-pipeline",
      name: "Sales-pipeline",
      component: Salespipeline,
      meta: { requiresAuth: true }

    },
    {
      path: "/sales/sales-calendar",
      name: "Sales-calendar",
      component: SalesCalendar,
      meta: { requiresAuth: true }
    },
    
    

    {
      path: "/sales/price-list",
      name: "sales-price-list",
      component: ManagePriceList,
      meta: { requiresAuth: true }
    },
    {
      path: "/sales/price-structures/:id/items/create",
      name: "price-structure-item-create",
      component: PriceStructureAddItem,
      meta: { requiresAuth: true }
    },
    {
      path: "/sales/price-structures/:id/observer/create",
      name: "price-structure-observer-create",
      component: PriceStructureAddPrice,
      props: (route) => ({ id: Number(route.params.id), mode: 'observer' }),
      meta: { requiresAuth: true }
    },
    {
      path: "/sales/price-structures/:id/companion/create",
      name: "price-structure-companion-create",
      component: PriceStructureAddPrice,
      props: (route) => ({ id: Number(route.params.id), mode: 'companion' }),
      meta: { requiresAuth: true }
    },
    {
      path: "/sales/price-structures/:id/upgrade-fees/create",
      name: "price-structure-upgrade-fee-create",
      component: PriceStructureAddUpgradeFee,
      meta: { requiresAuth: true }
    },
    {
      path: "/sales/price-structures/:id/trophy-fees/create",
      name: "price-structure-trophy-fee-create",
      component: PriceStructureAddTrophyFee,
      meta: { requiresAuth: true }
    },

    {
      path: "/sales/price-structures/:id/safari-extras/create",
      name: "price-structure-safari-extra-create",
      component: PriceStructureAddSafariExtra,
      meta: { requiresAuth: true }
    },


    {
      path: "/module-settings/qoutas-settings",
      name: "quotas-settings",
      component: ManageQuotasSettings,
      meta: { requiresAuth: true }
    },
    {
      path: "/sales/sales-inquiry",
      name: "sales-inquiry",
      component: Managesalesinquiry,
      meta: { requiresAuth: true }
    },

    {
      path: "/sales/sales-confirmation",
      name: "sales-confirmation",
      component: Managesalesconfirmation,
      meta: { requiresAuth: true }
    },

    {
      path: "/sales/pipeline-item/:id",
      name: "pipeline-item-view",
      component: PipelineItemView,
      meta: { requiresAuth: true }
    },

    {
      path: "/module-settings/regulatory-package",
      name: "regulatory-package",
      component: ManageRegulatoryPackage,
      meta: { requiresAuth: true }
    },
    {
      path: "/module-settings/sales-package",
      name: "sales-package",
      component: ManageSalesPackage,
      meta: { requiresAuth: true }
    },
    {
      path: "/module-settings/sales-extra-services",
      name: "sales-extra-services",
      component: ManageSalesExtraServices,
      meta: { requiresAuth: true }
    },
    {
      path: "/module-settings/trophy-fees",
      name: "trophy-fees",
      component: ManageTrophyFees,
      meta: { requiresAuth: true }
    },
    
    {
      path: "/module-settings/safari-fee-deposits",
      name: "safari-fee-deposits",
      component: ManageSafariFeeDeposits,
      meta: { requiresAuth: true }
    },
    {
      path: "/module-settings/accounts",
      name: "accounts",
      component: ManageAccounts,
      meta: { requiresAuth: true }
    },
    // {
    //   path: "/module-settings/approval-chain",
    //   name: "approval-chain",
    //   component: ManageApprovalChain,
    //   meta: { requiresAuth: true }
    // },
    // {
    //   path: "/module-settings/companion-hunter-costs",
    //   name: "companion-hunter-costs",
    //   component: ManageCompanionHunterCosts,
    //   meta: { requiresAuth: true }
    // },
    {
      path: "/module-settings/terms",
      name: "terms",
      component: ManageTerms,
      meta: { requiresAuth: true }
    },      
    {
      path: "/module-settings/area-settings",
      name: "hunting-area",
      component: ManageAreaSettings,
      meta: { requiresAuth: true }
    },
    {
      path: "/module-settings/hunting-types",
      name: "hunting-types",
      component: ManageHuntingTypes,
      meta: { requiresAuth: true }
    },
    {
      path: "/module-settings/species-settings/species",
      name: "species-settings",
      component: ManageSpeciesSettings,
      meta: { requiresAuth: true }
    },
    {
      path: "/:pathMatch(.*)*",
      redirect: "/"
    }
  ]

});

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore();
  const menuStore = useAppSidebarMenuStore();
  const appOption = useAppOptionStore();

  // Only load user if not already loaded (avoid unnecessary localStorage reads)
  if (!authStore.user && !authStore.token) {
    authStore.loadUser();
  }

  const isAuthenticated = !!authStore.user;

  // Hide sidebar on login and service selection pages
  if (to.path === '/' || to.path === '/companies-dashboard') {
    appOption.appSidebarHide = true;
  } else {
    appOption.appSidebarHide = false;
  }

  // If user is not authenticated and trying to access protected routes
  if (to.meta.requiresAuth && !isAuthenticated) {
    next("/"); // redirect to login
    return;
  }

  // If user is authenticated and on login page, redirect appropriately
  if (to.path === "/" && isAuthenticated) {
    // Check if user has selected a service
    const selectedService = menuStore.getActiveService();
    if (selectedService) {
      // Find an accessible route for the selected service
      const accessibleRoute = findAccessibleRouteForService(selectedService, authStore.permissions);
      next(accessibleRoute);
    } else {
      next("/companies-dashboard");
    }
    return;
  }

  // For authenticated users accessing protected routes
  if (isAuthenticated && to.meta.requiresAuth) {
    // Allow access to service selection page
    if (to.path === "/companies-dashboard") {
      next();
      return;
    }

    // Check if user has selected a service for other protected routes
    const selectedService = menuStore.getActiveService();
    if (!selectedService) {
      // Redirect to service selection if no service is selected
      next("/companies-dashboard");
      return;
    }

    // Check service compatibility
    if (to.meta.serviceId && to.meta.serviceId !== selectedService) {
      next("/unauthorized");
      return;
    }

    // Check route permissions
    if (to.meta.requiredPermission && !authStore.permissions.includes(to.meta.requiredPermission)) {
      next("/unauthorized");
      return;
    }
  }

  next();
});

// Helper function to find accessible route for a service
function findAccessibleRouteForService(serviceId: number, permissions: string[]): string {
  const serviceRoutes = router.getRoutes().filter(route =>
    route.meta.serviceId === serviceId
  );

  // Try to find a route without permission requirement first
  const noPermissionRoute = serviceRoutes.find(route => !route.meta.requiredPermission);
  if (noPermissionRoute) {
    return noPermissionRoute.path;
  }

  // Try to find a route that user has permission for
  const accessibleRoute = serviceRoutes.find(route =>
    permissions.includes(route.meta.requiredPermission as string)
  );

  return accessibleRoute?.path || "/unauthorized";
}

export default router;