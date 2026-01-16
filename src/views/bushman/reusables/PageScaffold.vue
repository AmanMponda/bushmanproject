<script setup lang="ts">
type Props = {
  leftWidth?: string
  rightWidth?: string
  gap?: string
}

withDefaults(defineProps<Props>(), {
  leftWidth: '320px',
  rightWidth: '320px',
  gap: '20px',
})
</script>

<template>
  <div class="page-scaffold">
    <div class="page-scaffold__header">
      <slot name="header" />
    </div>
    <div
      class="page-scaffold__grid"
      :style="{ '--left-width': leftWidth, '--right-width': rightWidth, '--grid-gap': gap }"
    >
      <aside class="page-scaffold__left">
        <slot name="left" />
      </aside>
      <main class="page-scaffold__center">
        <slot name="center" />
      </main>
      <aside class="page-scaffold__right">
        <slot name="right" />
      </aside>
    </div>
  </div>
</template>

<style scoped>
.page-scaffold {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.page-scaffold__grid {
  display: grid;
  grid-template-columns: var(--left-width) 1fr var(--right-width);
  gap: var(--grid-gap);
  align-items: start;
}

.page-scaffold__left,
.page-scaffold__center,
.page-scaffold__right {
  min-width: 0;
}

@media (max-width: 1400px) {
  .page-scaffold__grid {
    grid-template-columns: 300px 1fr;
  }

  .page-scaffold__right {
    display: none;
  }
}

@media (max-width: 1200px) {
  .page-scaffold__grid {
    grid-template-columns: 280px 1fr;
    gap: 16px;
  }
}

@media (max-width: 1000px) {
  .page-scaffold__grid {
    grid-template-columns: 1fr;
  }

  .page-scaffold__center {
    order: -1;
  }
}
</style>
