<template>
  <div class="form-sticky-footer" :class="{ 'form-sticky-footer--visible': visible }">
    <div class="footer-content">
      <div class="footer-left">
        <slot name="left"></slot>
      </div>
      <div class="footer-center">
        <slot name="center"></slot>
      </div>
      <div class="footer-right">
        <slot name="right">
          <slot></slot>
        </slot>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  visible?: boolean
}

withDefaults(defineProps<Props>(), {
  visible: true
})
</script>

<style scoped>
.form-sticky-footer {
  position: sticky;
  bottom: 0;
  left: 0;
  right: 0;
  background: #fff;
  border-top: 1px solid var(--bs-border-color, #dee2e6);
  box-shadow: 0 -4px 16px rgba(0, 0, 0, 0.08);
  z-index: 100;
  padding: 1rem 1.5rem;
  margin-top: auto;
  transition: transform 0.3s ease, opacity 0.3s ease;
}

.form-sticky-footer:not(.form-sticky-footer--visible) {
  transform: translateY(100%);
  opacity: 0;
  pointer-events: none;
}

.footer-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  max-width: 100%;
}

.footer-left,
.footer-center,
.footer-right {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.footer-left {
  justify-content: flex-start;
}

.footer-center {
  justify-content: center;
  flex: 1;
}

.footer-right {
  justify-content: flex-end;
}

@media (max-width: 768px) {
  .form-sticky-footer {
    padding: 0.75rem 1rem;
  }
  
  .footer-content {
    flex-wrap: wrap;
  }
  
  .footer-center {
    order: 3;
    flex-basis: 100%;
    justify-content: center;
    margin-top: 0.5rem;
  }
}

@media (max-width: 576px) {
  .form-sticky-footer {
    padding: 0.5rem 0.75rem;
  }
  
  .footer-content {
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .footer-left,
  .footer-center,
  .footer-right {
    width: 100%;
    justify-content: center;
  }
}
</style>
