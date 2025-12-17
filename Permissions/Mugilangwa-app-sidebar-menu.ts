import { defineStore } from "pinia";
import { computed, watchEffect } from "vue";
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

export const useAppSidebarMenuStore = defineStore("appSidebarMenu", () => {
  const authStore = useAuthStore();
  
 
  // Use the auth store's reactive permissions instead of localStorage directly
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
    }).filter(Boolean) as MenuItem[]; // Filter out null values from the map
  };
  // Base menu structure (static parts)
  const baseMenuItems = computed<MenuItem[]>(() => [
    {
      is_header: true,
      text: 'Dashboard'
    },
    {
      url: '/dashboard',
      icon: 'fa fa-laptop',
      text: 'Dashboard'
    }
  ]);

  // CRM menu structure
  const crmMenuStructure = computed<MenuItem[]>(() => [
    ...baseMenuItems.value,
    {
      is_header: true,
      text: 'CRM'
    },
    {
      url: '/crm/home',
      icon: 'fa fa-house',
      text: 'Home',
      permission: 'CAN_VIEW_CRM_DASHBOARD'
    },        
    {
      url: '/crm/customer',
      icon: 'fa-solid fa-people-group',
      text: 'Customers',
      permission: 'CAN_VIEW_CUSTOMERS'
    }
  ]);

  // AboodBus menu structure
  const aboodMenuStructure = computed<MenuItem[]>(() => [
    ...baseMenuItems.value,
    {
      is_header: true,
      text: 'AboodBus'
    },
    {
      url: '/abs/home',
      icon: 'fa fa-house',
      text: 'Home',
      permission: 'CAN_VIEW_TICKET_DASHBOARD'
    },
    {
      is_header: true,
      text: 'Operations'
    },
    {
      url: '/abs/master/fleet',
      icon: 'fa fa-truck',
      text: 'Fleet Master',
      permission: 'CAN_VIEW_FLEET'
    },
    {
      url: '/abs/schedule',
      icon: 'fa fa-map',
      text: 'Schedules',
      permission: 'CAN_VIEW_SCHEDULES'
    },
    {
      url: '/booking',
      icon: 'fa fa-ticket',
      text: 'Bookings',
      label: '6',
      permission: 'CAN_VIEW_BOOKINGS',
      children: [              
        { 
          url: '/abs/search-booking', 
          text: 'Search Bookings',
          permission: 'CAN_SEARCH_BOOKINGS'
        },      
        { 
          url: '/abs/book-tickets', 
          text: 'Book Tickets',
          permission: 'CAN_BOOK_TICKETS'
        },
        {
          url: '/abs/bookings',
          text: 'Bookings',
          permission: 'CAN_VIEW_BOOKINGS'
        },
        {
          url: '/abs/amendments/open-tickets',
          text: 'Open Tickets',
          permission: 'CAN_VIEW_OPEN_TICKETS'
        },        
        {
          url: '/abs/amendments/refunds',
          text: 'Refund',
          permission: 'CAN_PROCESS_REFUNDS'
        },
        //  {
        //   url: '/abs/report',
        //   text: 'Report',
        //   permission: 'CAN_VIEW_FLEET'
        // },
        {
          url: '/abs/operation',
          text: 'Operation',
          permission: 'CAN_VIEW_FLEET'
         }
        
      ]



    }
  ]);

  // Dynamic menu selection based on permissions
  const menuItems = computed(() => {
    // First filter both menu structures
    const filteredCrmMenu = filterMenuByPermission(crmMenuStructure.value);
    const filteredAboodMenu = filterMenuByPermission(aboodMenuStructure.value);
    
    // Determine which menu to show based on top-level permissions
    if (permissions.value.includes('CAN_VIEW_TICKET_DASHBOARD')) {
      return filteredAboodMenu;
    }
    
    if (permissions.value.includes('CAN_VIEW_CRM_DASHBOARD')) {
      return filteredCrmMenu;
    }
    
    // Fallback to base menu if no specific permissions
    return filterMenuByPermission(baseMenuItems.value);
  });

  return { 
    menuItems,
    permissions // Expose permissions if needed by components
  };
});