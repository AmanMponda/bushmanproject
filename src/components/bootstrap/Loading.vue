<script setup>
defineProps({
    colorClass: {
        type: String,
        default: "text-primary",
    },
    loaderType: {
        type: String,
        default: "border", // 'border' or 'grow'
    },
    size: {
        type: String,
        default: "md", // 'sm', 'md', 'lg' or a custom value like "50px"
    },
    text: {
        type: String,
        default: "",
    },
});

// map common sizes
const sizeMap = {
    sm: "1.5rem",
    md: "3rem",
    lg: "5rem",
};
</script>

<template>
    <div class="text-center py-5">
        <div class="loader" :class="[
            colorClass,
            loaderType === 'border' ? 'spinner-border' : 'spinner-grow'
        ]" :style="{
            width: sizeMap[size] || size,
            height: sizeMap[size] || size
        }" role="status">
            <span class="visually-hidden">Loading...</span>
        </div>
    <p v-if="text" class="mt-4">{{ text }}</p>
    </div>
</template>

<style scoped>
.loader {
    /* fallback */
    width: 3rem;
    height: 3rem;
}

.text-danger {
    color: #96000C !important;
}
</style>
