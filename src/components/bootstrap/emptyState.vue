<script setup>
defineProps({
    title: {
        type: String,
        default: "No data found!",
    },
    subtitle: {
        type: String,
        default: "Try adjusting your filters or refresh the page",
    },
    buttonTitle: {
        type: String,
        text: "Refresh"
    },
    showButton: {
        type: Boolean,
        default: false,
    },
    icon: {
        type: String,
        default: "fa fa-exclamation-triangle", // default icon
    },
    colorClass: {
        type: String,
        default: "text-warning",
    },
});

defineEmits(["click"]);
</script>

<template>
    <div class="text-muted">
        <i :class="['fa', icon, colorClass, 'fa-3x', 'mb-3']"></i>
        <h4 v-if="title">{{ title }}</h4>
        <p v-if="subtitle" class="fst-italic">{{ subtitle }}</p>
        <button v-if="showButton" class="btn btn-outline-primary rounded-pill mt-2" @click="$emit('click')">
            <i class="fa fa-sync-alt me-1"></i> {{ buttonTitle }}
        </button>
    </div>
</template>