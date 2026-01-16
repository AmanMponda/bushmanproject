<template>
  <div class="form-left-panel">
    <div class="form">
      <slot></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
// This is a wrapper component for the left panel form styling
</script>

<style scoped>
.form-left-panel {
  height: 100%;
}

.form {
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  background: #fafbfc;
}

/* Form Section Styling */
:deep(.form-section) {
  background: #ffffff;
  border-radius: 12px;
  padding: 12px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
  margin-bottom: 10px;
}

:deep(.form-section:last-child) {
  margin-bottom: 0;
}

:deep(.section-title) {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  font-weight: 700;
  color: #1e40af;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 10px;
  padding-bottom: 8px;
  border-bottom: 2px solid #dbeafe;
}

:deep(.section-icon) {
  font-size: 14px;
}

/* Field Styling */
:deep(.field) {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 10px;
}

:deep(.field:last-child) {
  margin-bottom: 0;
}

:deep(.lbl) {
  font-size: 12px;
  color: #0f172a;
  font-weight: 600;
}

:deep(.req) {
  color: #dc2626;
}

:deep(.input-wrapper) {
  position: relative;
  display: flex;
  align-items: center;
}

:deep(.input-icon) {
  position: absolute;
  left: 10px;
  font-size: 13px;
  pointer-events: none;
  z-index: 1;
}

:deep(.input-wrapper input),
:deep(.input-wrapper select),
:deep(.input-wrapper textarea) {
  width: 100%;
  border: 2px solid #e2e8f0;
  border-radius: 10px;
  padding: 8px 10px;
  padding-left: 32px;
  font-size: 13px;
  background: #ffffff;
  color: #0f172a;
  transition: all 0.2s ease;
  outline: none;
}

:deep(.input-wrapper input:focus),
:deep(.input-wrapper select:focus),
:deep(.input-wrapper textarea:focus) {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px #dbeafe;
  background: #ffffff;
}

:deep(.input-wrapper.no-icon input),
:deep(.input-wrapper.no-icon select) {
  padding-left: 10px;
}

/* Date Row */
:deep(.date-row) {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
}

:deep(.date-row .field) {
  min-width: 100%;
  margin-bottom: 14px;
}

/* Two Column Row */
:deep(.two-col-row) {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

/* Toggle Row */
:deep(.toggle-row) {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px;
  background: #f8fafc;
  border-radius: 10px;
  border: 2px solid #e2e8f0;
}

:deep(.toggle-info) {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

:deep(.toggle-hint) {
  font-size: 11px;
  color: #475569;
}

/* Switch */
:deep(.switch) {
  position: relative;
  display: inline-block;
  width: 48px;
  height: 26px;
}

:deep(.switch input) {
  opacity: 0;
  width: 0;
  height: 0;
}

:deep(.slider) {
  position: absolute;
  cursor: pointer;
  inset: 0;
  background-color: #e2e8f0;
  border-radius: 26px;
  transition: 0.3s;
}

:deep(.slider:before) {
  position: absolute;
  content: "";
  height: 20px;
  width: 20px;
  left: 3px;
  top: 3px;
  background-color: white;
  border-radius: 50%;
  transition: 0.3s;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

:deep(.switch input:checked + .slider) {
  background: #2563eb;
}

:deep(.switch input:checked + .slider:before) {
  transform: translateX(22px);
}

/* Summary Section */
:deep(.summary-section) {
  background: linear-gradient(135deg, #1e40af 0%, #2563eb 100%);
  color: white;
}

:deep(.summary-section .section-title) {
  color: rgba(255, 255, 255, 0.9);
  border-bottom-color: rgba(255, 255, 255, 0.2);
}

:deep(.summary-row) {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

:deep(.summary-row:last-child) {
  border-bottom: none;
}

:deep(.summary-row.total) {
  padding-top: 12px;
  margin-top: 8px;
  border-top: 2px solid rgba(255, 255, 255, 0.3);
  border-bottom: none;
}

:deep(.summary-label) {
  font-size: 13px;
  font-weight: 500;
  opacity: 0.9;
}

:deep(.summary-value) {
  font-size: 14px;
  font-weight: 700;
}

:deep(.summary-row.total .summary-value) {
  font-size: 20px;
}
</style>
