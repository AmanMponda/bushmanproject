// Module declarations for specific Vue components to help TypeScript template checking
// This allows using named slots like #header and #footer without compiler errors.

declare module "@/components/plugins/StandardModal.vue" {
  import { DefineComponent } from 'vue'
  const component: DefineComponent<any, any, any>
  export default component
}

// Additional specific component declarations can be added here if needed
