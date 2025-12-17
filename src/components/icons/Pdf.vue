<template>
  <div
    class="cursor-pointer w-50px h-50px bg-opacity-30 rounded-circle d-flex align-items-center justify-content-center"
    @click="$emit('click')">
    <i class="fa fa-file-pdf fa-lg fs-4" :class="colorClass"></i>
  </div>
</template>

<script setup>
defineProps({
  colorClass: {
    type: String,
    default: "text-primary",
  },
});

defineEmits(["click"]);
</script>

<style scoped>
.cursor-pointer {
  cursor: pointer;
}

.text-danger {
  color: #96000C !important;
}

.text-purple {
    color: #003366 !important;
}
</style>
