<!-- 
  FormPageLayout Usage Examples
  
  This file demonstrates how to use the FormPageLayout component
  for creating consistent page layouts across the application.
-->

<script setup lang="ts">
import { ref } from 'vue'
import { FormPageLayout, FormLeftPanel, FormPanelContent } from '@/components/forms'

// Example form state
const form = ref({
  name: '',
  type: null,
  date: ''
})

const activeTab = ref('details')

// Example tabs
const tabs = [
  { key: 'details', label: 'Details', icon: '📝', count: 0 },
  { key: 'items', label: 'Items', icon: '📦', count: 3 },
  { key: 'preview', label: 'Preview', icon: '👁️', count: 0 }
]

// Example steps for progress indicator
const steps = ref([
  { label: 'Basic Info', completed: true },
  { label: 'Add Items', completed: false, active: true },
  { label: 'Review', completed: false }
])
</script>

<template>
  <!-- 
    EXAMPLE 1: Two-Column Layout (Default)
    - Left sidebar with form fields
    - Main content area with tabs
  -->
  <FormPageLayout
    title="Create New Record"
    subtitle="Fill in the details to create a new record"
    icon="fa fa-plus-circle"
    :breadcrumbs="['HOME', 'RECORDS', 'CREATE']"
    layout="two-column"
    left-width="340px"
    left-title="Record Details"
    left-description="Basic information"
    left-icon="fa fa-info-circle"
    center-title="Content & Items"
    center-description="Add items and configure settings"
    center-icon="fa fa-list-alt"
  >
    <!-- Header Actions -->
    <template #header-actions>
      <button class="btn ghost" type="button">
        <i class="fa fa-arrow-left me-2"></i> Back
      </button>
      <button class="btn secondary" type="button">
        <i class="fa fa-save me-2"></i> Save Draft
      </button>
      <button class="btn primary" type="button">
        <i class="fa fa-check me-2"></i> Submit
      </button>
    </template>

    <!-- Left Panel Content -->
    <template #left>
      <FormLeftPanel>
        <div class="form-section">
          <div class="section-title">
            <span class="section-icon"><i class="fa fa-tag"></i></span>
            Identification
          </div>
          
          <label class="field">
            <span class="lbl">Name <span class="req">*</span></span>
            <div class="input-wrapper">
              <span class="input-icon"><i class="fa fa-user"></i></span>
              <input v-model="form.name" placeholder="Enter name..." />
            </div>
          </label>
          
          <label class="field">
            <span class="lbl">Type</span>
            <div class="input-wrapper">
              <span class="input-icon"><i class="fa fa-list"></i></span>
              <select v-model="form.type">
                <option :value="null">Select type...</option>
                <option value="type1">Type 1</option>
                <option value="type2">Type 2</option>
              </select>
            </div>
          </label>
        </div>
      </FormLeftPanel>
    </template>

    <!-- Center Panel Content -->
    <template #center>
      <FormPanelContent
        :tabs="tabs"
        v-model:active-tab="activeTab"
      >
        <div v-if="activeTab === 'details'" class="p-4">
          <h4>Details Content</h4>
          <p>Your details form fields go here...</p>
        </div>
        
        <div v-if="activeTab === 'items'" class="p-4">
          <h4>Items Content</h4>
          <p>Your items list goes here...</p>
        </div>
        
        <div v-if="activeTab === 'preview'" class="p-4">
          <h4>Preview Content</h4>
          <p>Preview of the record...</p>
        </div>
      </FormPanelContent>
    </template>

    <!-- Sticky Footer -->
    <template #footer>
      <div class="d-flex justify-content-between align-items-center">
        <div class="total-display">
          <span class="text-muted">Grand Total:</span>
          <strong class="ms-2 fs-4 text-success">$1,500.00</strong>
        </div>
        <div class="d-flex gap-2">
          <button class="btn btn-outline-secondary">Cancel</button>
          <button class="btn btn-primary">Save & Continue</button>
        </div>
      </div>
    </template>
  </FormPageLayout>

  <!-- 
    EXAMPLE 2: With Progress Steps
    - Shows progress indicator at the top
  -->
  <FormPageLayout
    title="Wizard Form"
    subtitle="Complete each step to finish the process"
    :breadcrumbs="['HOME', 'WIZARD']"
    :show-progress="true"
    :steps="steps"
    layout="single"
    center-title="Step 2: Add Items"
    center-icon="fa fa-list"
  >
    <template #header-actions>
      <button class="btn ghost">Previous</button>
      <button class="btn primary">Next Step</button>
    </template>

    <template #center>
      <div class="p-4">
        <p>Wizard step content goes here...</p>
      </div>
    </template>
  </FormPageLayout>

  <!-- 
    EXAMPLE 3: Three-Column Layout
    - Left sidebar, main content, and right sidebar
  -->
  <FormPageLayout
    title="Advanced Form"
    subtitle="Three-column layout example"
    :breadcrumbs="['HOME', 'ADVANCED']"
    layout="three-column"
    left-width="280px"
    right-width="260px"
    left-title="Filters"
    left-icon="fa fa-filter"
    center-title="Main Content"
    center-icon="fa fa-table"
    right-title="Summary"
    right-icon="fa fa-calculator"
  >
    <template #left>
      <div class="p-3">
        <p>Filter options...</p>
      </div>
    </template>

    <template #center>
      <div class="p-4">
        <p>Main content area...</p>
      </div>
    </template>

    <template #right>
      <div class="p-3">
        <p>Summary info...</p>
      </div>
    </template>
  </FormPageLayout>
</template>

<style scoped>
/* Button styles for examples */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  border: 1px solid #2563eb;
  background: #fff;
  border-radius: 10px;
  padding: 10px 16px;
  cursor: pointer;
  font-weight: 600;
  font-size: 13px;
  color: #2563eb;
  transition: all 0.2s ease;
}

.btn.primary {
  background: #2563eb;
  color: white;
}

.btn.secondary {
  background: #dbeafe;
  color: #1e40af;
}

.btn.ghost {
  background: #fff;
  border-color: #2563eb;
}

.btn:hover {
  transform: translateY(-1px);
}
</style>
