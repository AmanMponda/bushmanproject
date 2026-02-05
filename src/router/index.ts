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
const BushmanFleetMaster = () => import('@/views/bushman/assets/FleetMaster.vue')
const BushmanFleetMasterPdf = () => import('@/views/bushman/assets/FleetMasterPdf.vue')
const BushmanLocationHistory = () => import('@/views/bushman/assets/LocationHistory.vue')
const BushmanOdometerReadingHistory = () => import('@/views/bushman/assets/OdometerReadingHistory.vue')
const SalesQuotas = () => import ('@/views/bushman/details/QoutaPage.vue')
const Salespipeline = () => import('@/views/bushman/sales/SalesPipeline.vue');
const SalesCalendar = () => import ('@/views/bushman/details/Calendar.vue')
const ManagePriceList = () => import('@/views/bushman/sales/ManagePriceList.vue');
const SalesRequisitions = () => import('@/views/bushman/sales/Requisitions.vue');
const SalesRequisitionDetails = () => import('@/views/bushman/sales/RequisitionDetails.vue');
const SalesRequisitionPrint = () => import('@/views/bushman/sales/RequisitionPdfView.vue');
const PriceStructureAddItem = () => import('@/views/bushman/sales/price-structures/PriceStructureAddItem.vue');
const PriceStructureAddPrice = () => import('@/views/bushman/sales/price-structures/PriceStructureAddPrice.vue');
const PriceStructureAddSafariExtra = () => import('@/views/bushman/sales/price-structures/PriceStructureAddSafariExtra.vue');
const PriceStructureAddUpgradeFee = () => import('@/views/bushman/sales/price-structures/PriceStructureAddUpgradeFee.vue');
const ManageQuotasSettings = () => import('@/views/bushman/module-settings/ManageQuota.vue');
const ManageRegulatoryPackage = () => import('@/views/bushman/module-settings/ManageRegulatoryPackage.vue');
const ManageSalesPackage = () => import('@/views/bushman/module-settings/ManageSalesPackage.vue');
const ManageSalesExtraServices = () => import('@/views/bushman/module-settings/ManageExtras.vue');
const ManageTrophyFees = () => import('@/views/bushman/module-settings/ManageTrophyFees.vue');
const ManageUpgradeFees = () => import('@/views/bushman/module-settings/ManageUpgradeFees.vue');
const ManageItems = () => import('@/views/bushman/module-settings/ManageItems.vue');
// const ManageCompanionHunterCosts = () => import('@/views/bushman/module-settings/ManageCompanionHunterCosts.vue');
const ManageTerms = () => import('@/views/bushman/module-settings/ManageTerms.vue');
const ManageSafariFeeDeposits = () => import('@/views/bushman/module-settings/ManageSafariFeeDeposits.vue');
const ManageApprovalChain = () => import('@/views/bushman/module-settings/ManageApprovalChain.vue');
const ManageRequisitionTypes = () => import('@/views/bushman/module-settings/ManageRequisitionTypes.vue');
const ManageCostCenters = () => import('@/views/bushman/module-settings/ManageCostCenters.vue');
const ManageAreaSettings = () => import('@/views/bushman/module-settings/ManageArea.vue');
const ManageHuntingTypes = () => import('@/views/bushman/module-settings/ManageHuntingTypes.vue');
const ManageSeasons = () => import('@/views/bushman/module-settings/ManageSeasons.vue');
const ManageSpeciesSettings = () => import('@/views/bushman/module-settings/ManageSpecies.vue');
const ManageAccounts = () => import('@/views/bushman/module-settings/ManageAccounts.vue');
const ManageUsers = () => import('@/views/bushman/module-settings/ManageUsers.vue');
const ManageDocuments = () => import('@/views/bushman/module-settings/ManageDocuments.vue');
const ManageInstallmentSetups = () => import('@/views/bushman/module-settings/ManageInstallmentSetups.vue');
const ManageEntityCategories = () => import('@/views/bushman/module-settings/ManageEntityCategories.vue');
const EntityManagement = () => import('@/views/bushman/module-settings/EntityManagement.vue');
const EntityCreate = () => import('@/views/bushman/module-settings/EntityCreate.vue');
const GovernmentFees = () => import('@/views/GovernmentFees.vue');
const ModuleComingSoon = () => import('@/views/bushman/module-settings/ModuleComingSoon.vue');
const AssetGroups = () => import('@/views/bushman/module-settings/AssetGroups.vue');

const Managesalesinquiry = () => import('@/views/bushman/sales/SalesInquiries.vue');
const SalesInquiryDetails = () => import('@/views/bushman/sales/salesinquiries/SalesInquiryDetails.vue');
const CreateQuotation = () => import('@/views/bushman/sales/salesinquiries/CreateQuotation.vue');
const Managesalesconfirmation = () => import('@/views/bushman/sales/SalesConfirmationProposals.vue');
const PipelineItemView = () => import('@/views/bushman/sales/sales-pipeline/PipelineItemView.vue');
const OrdersList = () => import('@/views/orders/OrderList.vue');
const OrderForm = () => import('@/views/orders/OrderForm.vue');
const OrderDetails = () => import('@/views/orders/OrderDetails.vue');
const ContractList = () => import('@/views/contracts/ContractList.vue');
const ContractForm = () => import('@/views/contracts/ContractForm.vue');
const ContractDetails = () => import('@/views/contracts/ContractDetails.vue');
const Suppliers = () => import('@/views/bushman/procurement/Suppliers.vue');
const SupplierCreate = () => import('@/views/bushman/procurement/SupplierCreate.vue');
const SupplierView = () => import('@/views/bushman/procurement/SupplierView.vue');
const Clients = () => import('@/views/bushman/sales/Clients.vue');

// Location Master routes
const LocationMasterIndex = () => import('@/views/bushman/locationMaster/index.vue');
const RouteRegister = () => import('@/views/bushman/locationMaster/routeplanning/RouteRegister.vue');

// Accounting routes
const JournalVoucherList = () => import('@/views/bushman/accounting/JournalVoucherList.vue');
const JournalVoucherForm = () => import('@/views/bushman/accounting/JournalVoucherForm.vue');
const InvoiceList = () => import('@/views/bushman/accounting/InvoiceList.vue');
const InvoiceForm = () => import('@/views/bushman/accounting/InvoiceForm.vue');
const ChartOfAccounts = () => import('@/views/bushman/accounting/ChartOfAccounts.vue');

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
      path: "/bushman/assets/fleet-master",
      name: "bushman-fleet-master",
      component: BushmanFleetMaster,
      meta: { requiresAuth: true }
    },
    {
      path: "/bushman/assets/fleet-master/print",
      name: "bushman-fleet-master-print",
      component: BushmanFleetMasterPdf,
      meta: { requiresAuth: true }
    },
    // Dynamic details route - supports deep-linking to either registration or numeric id
    {
      path: "/bushman/assets/fleet-master/:id",
      name: "bushman-fleet-master-details",
      component: BushmanFleetMaster,
      meta: { requiresAuth: true }
    },
    {
      path: "/bushman/assets/location-history",
      name: "bushman-location-history",
      component: BushmanLocationHistory,
      meta: { requiresAuth: true }
    },
    {
      path: "/bushman/assets/odometer-reading",
      name: "bushman-odometer-reading",
      component: BushmanOdometerReadingHistory,
      meta: { requiresAuth: true }
    },

    {
      path: "/sales/quotas",
      name: "Qouta-Page",
      component: SalesQuotas,
      meta: { requiresAuth: true }
    },
    // {
    //   path: "/sales/clients",
    //   name: "sales-clients",
    //   component: SalesClients,
    //   meta: { requiresAuth: true }
    // },
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
      path: "/sales/charter-prices",
      name: "sales-charter-prices",
      component: () => import('@/views/bushman/sales/CharterPrices.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: "/sales/requisitions",
      name: "sales-requisitions",
      component: SalesRequisitions,
      meta: { requiresAuth: true }
    },
    {
      path: "/sales/requisitions/:id",
      name: "sales-requisition-details",
      component: SalesRequisitionDetails,
      meta: { requiresAuth: true },
      props: (route) => ({ id: Number(route.params.id) })
    },
    {
      path: "/sales/requisitions/:id/print",
      name: "sales-requisition-print",
      component: SalesRequisitionPrint,
      meta: { requiresAuth: true }
    },
    {
      path: "/sales/requisitions/:id/edit",
      name: "sales-requisition-edit",
      component: () => import('@/views/bushman/sales/RequisitionEdit.vue'),
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
      path: "/sales/price-structures/:id/safari-extras/create",
      name: "price-structure-safari-extra-create",
      component: PriceStructureAddSafariExtra,
      meta: { requiresAuth: true }
    },
    {
      path: "/sales/price-structures/:id/upgrade-fees/create",
      name: "price-structure-upgrade-fee-create",
      component: PriceStructureAddUpgradeFee,
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
      path: "/sales/clients",
      name: "sales-clients",
      component: Clients,
      meta: { requiresAuth: true }
    },

    {
      path: "/sales/enquiries/:id",
      name: "sales-enquiry-details",
      component: SalesInquiryDetails,
      meta: { requiresAuth: true },
      props: (route) => ({ itemId: Number(route.params.id) })
    },

    {
      path: "/sales/enquiries/:id/create-quotation",
      name: "create-quotation",
      component: CreateQuotation,
      meta: { requiresAuth: true }
    },

    {
      path: "/sales/enquiries/:id/quotation/:pricingId",
      name: "edit-quotation",
      component: CreateQuotation,
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
      path: "/orders",
      name: "orders",
      component: OrdersList,
      meta: { requiresAuth: true }
    },
    {
      path: "/orders/create",
      name: "orders-create",
      component: OrderForm,
      meta: { requiresAuth: true }
    },
    {
      path: "/orders/:id",
      name: "orders-view",
      component: OrderDetails,
      meta: { requiresAuth: true },
      props: (route) => ({ id: Number(route.params.id) })
    },
    {
      path: "/orders/:id/edit",
      name: "orders-edit",
      component: OrderForm,
      meta: { requiresAuth: true },
      props: (route) => ({ id: Number(route.params.id) })
    },
    {
      path: "/procurement/suppliers",
      name: "procurement-suppliers",
      component: Suppliers,
      meta: { requiresAuth: true }
    },
    {
      path: "/procurement/suppliers/create",
      name: "procurement-suppliers-create",
      component: SupplierCreate,
      meta: { requiresAuth: true }
    },
    {
      path: "/procurement/suppliers/view/:id",
      name: "procurement-suppliers-view",
      component: SupplierView,
      meta: { requiresAuth: true },
      props: (route) => ({ id: Number(route.params.id) })
    },
    {
      path: "/procurement/suppliers/edit/:id",
      name: "procurement-suppliers-edit",
      component: SupplierCreate,
      meta: { requiresAuth: true },
      props: (route) => ({ id: Number(route.params.id) })
    },
    // {
    //   path: "/procurement/suppliers/print",
    //   name: "procurement-suppliers-print",
    //   component: SupplierPdf,
    //   meta: { requiresAuth: true }
    // },

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
    // {
    //   path: "/module-settings/upgrade-fees",
    //   name: "upgrade-fees",
    //   component: ManageUpgradeFees,
    //   meta: { requiresAuth: true }
    // },
    {
      path: "/module-settings/items",
      name: "items",
      component: ManageItems,
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
    {
      path: "/module-settings/users",
      name: "users-settings",
      component: ManageUsers,
      meta: { requiresAuth: true }
    },
    {
      path: "/module-settings/approval-chain",
      name: "approval-chain",
      component: ManageApprovalChain,
      meta: { requiresAuth: true }
    },
    {
      path: "/module-settings/requisition-types",
      name: "requisition-types",
      component: ManageRequisitionTypes,
      meta: { requiresAuth: true }
    },
    {
      path: "/module-settings/cost-centers",
      name: "cost-centers",
      component: ManageCostCenters,
      meta: { requiresAuth: true }
    },
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
      path: "/module-settings/seasons",
      name: "seasons",
      component: ManageSeasons,
      meta: { requiresAuth: true }
    },
    {
      path: "/module-settings/species-settings/species",
      name: "species-settings",
      component: ManageSpeciesSettings,
      meta: { requiresAuth: true }
    },
    {
      path: "/module-settings/government-fees",
      name: "government-fees",
      component: GovernmentFees,
      meta: { requiresAuth: true }
    },
    {
      path: "/module-settings/documents",
      name: "documents-settings",
      component: ManageDocuments,
      meta: { requiresAuth: true }
    },
    {
      path: "/module-settings/installment-setups",
      name: "installment-setups",
      component: ManageInstallmentSetups,
      meta: { requiresAuth: true }
    },
    {
      path: "/module-settings/entity-categories",
      name: "entity-categories",
      component: ManageEntityCategories,
      meta: { requiresAuth: true }
    },
    {
      path: "/module-settings/entities",
      name: "module-settings-entities",
      component: EntityManagement,
      meta: { requiresAuth: true }
    },
    {
      path: "/module-settings/entities/create",
      name: "entity-create",
      component: EntityCreate,
      meta: { requiresAuth: true }
    },
    {
      path: "/module-settings/entities/:id/edit",
      name: "entity-edit",
      component: EntityCreate,
      meta: { requiresAuth: true }
    },

    // Asset Management Routes
    {
      path: "/module-settings/asset-groups",
      name: "asset-groups",
      component: AssetGroups,
      meta: { requiresAuth: true }
    },
    {
      path: "/module-settings/asset-categories",
      name: "asset-categories",
      component: AssetGroups,
      meta: { requiresAuth: true }
    },
    {
      path: "/module-settings/asset-depreciation",
      name: "asset-depreciation",
      component: ModuleComingSoon,
      meta: { requiresAuth: true }
    },
    {
      path: "/module-settings/location-master",
      name: "module-location-master",
      component: ModuleComingSoon,
      meta: { requiresAuth: true }
    },
    {
      path: "/module-settings/vehicle-models",
      name: "vehicle-models",
      component: () => import('@/views/bushman/module-settings/VehicleModels.vue'),
      meta: { requiresAuth: true }
    },

    // Procurement Settings Routes
    {
      path: "/module-settings/supplier-categories",
      name: "supplier-categories",
      component: ModuleComingSoon,
      meta: { requiresAuth: true }
    },
    {
      path: "/module-settings/purchase-approval-rules",
      name: "purchase-approval-rules",
      component: ModuleComingSoon,
      meta: { requiresAuth: true }
    },
    {
      path: "/module-settings/reorder-levels",
      name: "reorder-levels",
      component: ModuleComingSoon,
      meta: { requiresAuth: true }
    },
    {
      path: "/module-settings/procurement-tax-rules",
      name: "procurement-tax-rules",
      component: ModuleComingSoon,
      meta: { requiresAuth: true }
    },

    // Inventory Settings Routes
    {
      path: "/module-settings/uom",
      name: "uom",
      component: ModuleComingSoon,
      meta: { requiresAuth: true }
    },
    {
      path: "/module-settings/warehouses",
      name: "warehouses",
      component: ModuleComingSoon,
      meta: { requiresAuth: true }
    },
    {
      path: "/module-settings/stock-valuation",
      name: "stock-valuation",
      component: ModuleComingSoon,
      meta: { requiresAuth: true }
    },

    // CRM Settings Routes
    {
      path: "/module-settings/customer-categories",
      name: "customer-categories",
      component: ModuleComingSoon,
      meta: { requiresAuth: true }
    },
    {
      path: "/module-settings/customer-types",
      name: "customer-types",
      component: ModuleComingSoon,
      meta: { requiresAuth: true }
    },

    // Accounting Settings Routes
    {
      path: "/module-settings/account-dimensions",
      name: "account-dimensions",
      component: ModuleComingSoon,
      meta: { requiresAuth: true }
    },
    {
      path: "/module-settings/fiscal-years",
      name: "fiscal-years",
      component: ModuleComingSoon,
      meta: { requiresAuth: true }
    },
    {
      path: "/module-settings/accounting-periods",
      name: "accounting-periods",
      component: ModuleComingSoon,
      meta: { requiresAuth: true }
    },
    {
      path: "/module-settings/tax-types",
      name: "tax-types",
      component: ModuleComingSoon,
      meta: { requiresAuth: true }
    },
    {
      path: "/module-settings/payment-methods",
      name: "payment-methods",
      component: ModuleComingSoon,
      meta: { requiresAuth: true }
    },
    {
      path: "/module-settings/currency-setup",
      name: "currency-setup",
      component: ModuleComingSoon,
      meta: { requiresAuth: true }
    },
    {
      path: "/module-settings/instalment-rules",
      name: "instalment-rules",
      component: ModuleComingSoon,
      meta: { requiresAuth: true }
    },
    {
      path: "/module-settings/revenue-recognition",
      name: "revenue-recognition",
      component: ModuleComingSoon,
      meta: { requiresAuth: true }
    },

    // Operations Setup Routes
    {
      path: "/module-settings/contract-types",
      name: "contract-types",
      component: ModuleComingSoon,
      meta: { requiresAuth: true }
    },
    {
      path: "/module-settings/approval-levels",
      name: "approval-levels",
      component: ModuleComingSoon,
      meta: { requiresAuth: true }
    },
    {
      path: "/module-settings/escalation-rules",
      name: "escalation-rules",
      component: ModuleComingSoon,
      meta: { requiresAuth: true }
    },
    {
      path: "/module-settings/delegation-rules",
      name: "delegation-rules",
      component: ModuleComingSoon,
      meta: { requiresAuth: true }
    },

    // System Configuration Routes
    {
      path: "/module-settings/numbering-series",
      name: "numbering-series",
      component: ModuleComingSoon,
      meta: { requiresAuth: true }
    },
    {
      path: "/module-settings/date-time-formats",
      name: "date-time-formats",
      component: ModuleComingSoon,
      meta: { requiresAuth: true }
    },
    {
      path: "/module-settings/localization",
      name: "localization",
      component: ModuleComingSoon,
      meta: { requiresAuth: true }
    },
    {
      path: "/module-settings/notifications",
      name: "notifications",
      component: ModuleComingSoon,
      meta: { requiresAuth: true }
    },
    {
      path: "/module-settings/audit-logs",
      name: "audit-logs",
      component: ModuleComingSoon,
      meta: { requiresAuth: true }
    },
    {
      path: "/module-settings/user-access",
      name: "user-access",
      component: ModuleComingSoon,
      meta: { requiresAuth: true }
    },
    {
      path: "/module-settings",
      name: "module-settings-main",
      component: ModuleComingSoon,
      meta: { requiresAuth: true }
    },

    // Operations routes (placeholders)
    {
      path: "/operations/hunting-license",
      name: "hunting-license",
      component: ComingSoon,
      meta: { requiresAuth: true }
    },
    {
      path: "/operations/game",
      name: "game",
      component: ComingSoon,
      meta: { requiresAuth: true }
    },
    {
      path: "/operations/game-requitions",
      name: "game-requisitions",
      component: ComingSoon,
      meta: { requiresAuth: true }
    },

    // Contract routes
    {
      path: "/contracts",
      name: "contracts-list",
      component: ContractList,
      meta: { requiresAuth: true }
    },
    {
      path: "/contracts/create",
      name: "contracts-create",
      component: ContractForm,
      meta: { requiresAuth: true }
    },
    {
      path: "/contracts/:id",
      name: "contracts-view",
      component: ContractDetails,
      meta: { requiresAuth: true },
      props: (route) => ({ id: Number(route.params.id) })
    },
    {
      path: "/contracts/:id/edit",
      name: "contracts-edit",
      component: ContractForm,
      meta: { requiresAuth: true },
      props: (route) => ({ id: Number(route.params.id) })
    },

    // Accounting routes - Journal Vouchers
    {
      path: "/accounting/journal-vouchers",
      name: "journal-vouchers",
      component: JournalVoucherList,
      meta: { requiresAuth: true }
    },
    {
      path: "/accounting/journal-vouchers/create",
      name: "journal-voucher-create",
      component: JournalVoucherForm,
      meta: { requiresAuth: true }
    },
    {
      path: "/accounting/journal-vouchers/:id",
      name: "journal-voucher-view",
      component: JournalVoucherForm,
      meta: { requiresAuth: true },
      props: (route) => ({ id: Number(route.params.id) })
    },

    // Accounting routes - Invoices
    {
      path: "/accounting/invoices",
      name: "invoices",
      component: InvoiceList,
      meta: { requiresAuth: true }
    },
    {
      path: "/accounting/invoices/create",
      name: "invoice-create",
      component: InvoiceForm,
      meta: { requiresAuth: true }
    },
    {
      path: "/accounting/invoices/:id",
      name: "invoice-view",
      component: InvoiceForm,
      meta: { requiresAuth: true },
      props: (route) => ({ id: Number(route.params.id) })
    },

    // Location Master routes
    {
      path: "/location-master",
      name: "location-master",
      component: LocationMasterIndex,
      meta: { requiresAuth: true },
      props: { activeTab: 'Countries' }
    },
    {
      path: "/location-master/countries",
      name: "location-master-countries",
      component: LocationMasterIndex,
      meta: { requiresAuth: true },
      props: { activeTab: 'Countries' }
    },
    {
      path: "/location-master/cities",
      name: "location-master-cities",
      component: LocationMasterIndex,
      meta: { requiresAuth: true },
      props: { activeTab: 'City' }
    },
    {
      path: "/location-master/branches",
      name: "location-master-branches",
      component: LocationMasterIndex,
      meta: { requiresAuth: true },
      props: { activeTab: 'Branches' }
    },
    {
      path: "/location-master/offices",
      name: "location-master-offices",
      component: LocationMasterIndex,
      meta: { requiresAuth: true },
      props: { activeTab: 'Offices' }
    },
    {
      path: "/location-master/service-points",
      name: "location-master-service-points",
      component: LocationMasterIndex,
      meta: { requiresAuth: true },
      props: { activeTab: 'Service Points' }
    },
    {
      path: "/location-master/stops",
      name: "location-master-stops",
      component: LocationMasterIndex,
      meta: { requiresAuth: true },
      props: { activeTab: 'Stops' }
    },
    {
      path: "/location-master/city-links",
      name: "location-master-city-links",
      component: LocationMasterIndex,
      meta: { requiresAuth: true },
      props: { activeTab: 'City Links' }
    },
    {
      path: "/location-master/route-planning",
      name: "location-master-route-planning",
      component: LocationMasterIndex,
      meta: { requiresAuth: true },
      props: { activeTab: 'Route Planning' }
    },
    {
      path: "/abs/route-master/create",
      name: "route-master-create",
      component: RouteRegister,
      meta: { requiresAuth: true }
    },
    // Accounting routes - Chart of Accounts
    {
      path: "/accounting/chart-of-accounts",
      name: "chart-of-accounts",
      component: ChartOfAccounts,
      meta: { requiresAuth: true }
    },

    // Other main sections (placeholders)
    {
      path: "/accounts",
      redirect: "/accounting/journal-vouchers",
      meta: { requiresAuth: true }
    },
    {
      path: "/procurement",
      name: "procurement-main",
      component: ComingSoon,
      meta: { requiresAuth: true }
    },
    {
      path: "/hr",
      name: "hr-main",
      component: ComingSoon,
      meta: { requiresAuth: true }
    },
    {
      path: "/reports",
      name: "reports-main",
      component: ComingSoon,
      meta: { requiresAuth: true }
    },
    {
      path: "/settings",
      name: "settings-main",
      component: ComingSoon,
      meta: { requiresAuth: true }
    },
    {
      path: "/preferences",
      name: "preferences-main",
      component: ComingSoon,
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
