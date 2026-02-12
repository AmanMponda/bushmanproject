<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'

const props = defineProps({
    // Required: v-model binding
    modelValue: {
        type: Boolean,
        required: true
    },

    // Positioning
    position: {
        type: String,
        default: 'right',
        validator: (value) => ['left', 'right', 'top', 'bottom'].includes(value)
    },

    // Dimensions
    width: {
        type: [String, Number],
        default: '300px'
    },
    height: {
        type: [String, Number],
        default: '100%'
    },
    maxWidth: {
        type: String,
        default: '90vw'
    },
    maxHeight: {
        type: String,
        default: '100vh'
    },

    // Header
    title: {
        type: String,
        default: ''
    },
    showHeader: {
        type: Boolean,
        default: true
    },
    showCloseButton: {
        type: Boolean,
        default: true
    },

    // Backdrop
    showBackdrop: {
        type: Boolean,
        default: true
    },
    closeOnBackdropClick: {
        type: Boolean,
        default: true
    },
    backdropClass: {
        type: String,
        default: ''
    },

    // Behavior
    closeOnEsc: {
        type: Boolean,
        default: true
    },
    preventScroll: {
        type: Boolean,
        default: true
    },
    overlay: {
        type: Boolean,
        default: false
    },

    // Animation
    transitionName: {
        type: String,
        default: 'offcanvas-slide'
    },
    transitionDuration: {
        type: Number,
        default: 300
    },

    // Accessibility
    titleId: {
        type: String,
        default: ''
    },
    closeAriaLabel: {
        type: String,
        default: 'Close offcanvas'
    }
})

const emit = defineEmits([
    'update:modelValue',
    'open',
    'opened',
    'close',
    'closed',
    'backdrop-click'
])

const slots = defineSlots()
const offcanvasPanel = ref(null)

// Computed properties
const hasFooterSlot = computed(() => !!slots.footer)
const panelWidth = computed(() => {
    if (typeof props.width === 'number') return `${props.width}px`
    return props.width
})
const panelHeight = computed(() => {
    if (typeof props.height === 'number') return `${props.height}px`
    return props.height
})

// Methods
const open = () => {
    emit('update:modelValue', true)
    emit('open')
}

const close = () => {
    emit('update:modelValue', false)
    emit('close')
}

const handleBackdropClick = () => {
    emit('backdrop-click')
    if (props.closeOnBackdropClick) {
        close()
    }
}

const handleEsc = (event) => {
    if (props.closeOnEsc && props.modelValue) {
        event.stopPropagation()
        close()
    }
}

const onAfterOpen = () => {
    emit('opened')
    // Focus on panel for accessibility
    if (offcanvasPanel.value) {
        offcanvasPanel.value.focus()
    }
}

const onAfterClose = () => {
    emit('closed')
}

// Prevent body scroll when offcanvas is open
const originalOverflow = ref('')
const preventBodyScroll = (prevent) => {
    if (!props.preventScroll) return

    if (prevent) {
        originalOverflow.value = document.body.style.overflow
        document.body.style.overflow = 'hidden'
    } else {
        document.body.style.overflow = originalOverflow.value
    }
}

// Watch for modelValue changes
watch(() => props.modelValue, (newVal) => {
    preventBodyScroll(newVal)
})

// Handle ESC key globally
const handleGlobalEsc = (event) => {
    if (event.key === 'Escape' && props.closeOnEsc && props.modelValue) {
        close()
    }
}

// Lifecycle
onMounted(() => {
    document.addEventListener('keydown', handleGlobalEsc)
})

onUnmounted(() => {
    document.removeEventListener('keydown', handleGlobalEsc)
    // Restore body overflow
    if (props.preventScroll && props.modelValue) {
        preventBodyScroll(false)
    }
})
</script>

<template>
    <teleport to="body">
        <transition :name="transitionName" @after-enter="onAfterOpen" @after-leave="onAfterClose">
            <div v-if="modelValue" class="standard-offcanvas" :class="[
                `standard-offcanvas--${position}`,
                { 'standard-offcanvas--overlay': overlay }
            ]" role="dialog" :aria-modal="modelValue" :aria-labelledby="titleId" :aria-hidden="!modelValue">
                <!-- Backdrop -->
                <div v-if="showBackdrop" class="standard-offcanvas__backdrop"
                    :class="{ 'standard-offcanvas__backdrop--clickable': closeOnBackdropClick }"
                    @click="handleBackdropClick" />

                <!-- Offcanvas Panel -->
                <div ref="offcanvasPanel" class="standard-offcanvas__panel" :style="{
                    width: panelWidth,
                    height: panelHeight,
                    maxWidth: maxWidth,
                    maxHeight: maxHeight
                }" @keydown.esc="handleEsc" tabindex="-1">
                    <!-- Header -->
                    <div v-if="showHeader" class="standard-offcanvas__header">
                        <slot name="header">
                            <div class="standard-offcanvas__header-content">
                                <h2 v-if="title" :id="titleId" class="standard-offcanvas__title">
                                    {{ title }}
                                </h2>
                                <div v-if="showCloseButton" class="standard-offcanvas__close">
                                    <button type="button" class="standard-offcanvas__close-button btn-close" @click="close"
                                        aria-label="Close">
                                        <!-- <slot name="close-icon">
                                            <span class="standard-offcanvas__close-icon">×</span>
                                        </slot> -->
                                    </button>
                                </div>
                            </div>
                        </slot>
                    </div>

                    <!-- Body -->
                    <div class="standard-offcanvas__body">
                        <slot></slot>
                    </div>

                    <!-- Footer -->
                    <div v-if="hasFooterSlot" class="standard-offcanvas__footer">
                        <slot name="footer"></slot>
                    </div>
                </div>
            </div>
        </transition>
    </teleport>
</template>

<style scoped>
.standard-offcanvas {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 1050;
    display: flex;
}

.standard-offcanvas--overlay .standard-offcanvas__panel {
    z-index: 1051;
}

.standard-offcanvas__backdrop {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    transition: opacity 0.3s ease;
}

.standard-offcanvas__backdrop--clickable {
    cursor: pointer;
}

.standard-offcanvas__panel {
    position: fixed;
    background-color: white;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    overflow: hidden;
    outline: none;
    z-index: 1050;
    display: flex;
    flex-direction: column;
}

/* Positioning */
.standard-offcanvas--left .standard-offcanvas__panel {
    top: 0;
    left: 0;
    height: 100vh;
}

.standard-offcanvas--right .standard-offcanvas__panel {
    top: 0;
    right: 0;
    height: 100vh;
}

.standard-offcanvas--top .standard-offcanvas__panel {
    top: 0;
    left: 0;
    right: 0;
    width: 100vw;
}

.standard-offcanvas--bottom .standard-offcanvas__panel {
    bottom: 0;
    left: 0;
    right: 0;
    width: 100vw;
}

/* Header */
.standard-offcanvas__header {
    padding: 1rem;
    border-bottom: 1px solid #e5e5e5;
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.standard-offcanvas__header-content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
}

.standard-offcanvas__title {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 500;
}

/* .standard-offcanvas__close-button {
    background: none;
    border: none;
    font-size: 1.5rem;
    line-height: 1;
    cursor: pointer;
    padding: 0.25rem;
    color: #6c757d;
    transition: color 0.2s ease;
} */

/* .standard-offcanvas__close-button:hover {
    color: #343a40;
} */

/* Body & Footer */
.standard-offcanvas__body {
    padding: 1rem;
    flex: 1 1 auto;
    min-height: 0;
    overflow: auto;
}

.standard-offcanvas__footer {
    padding: 1rem;
    border-top: 1px solid #e5e5e5;
    background-color: #f8f9fa;
    flex-shrink: 0;
}

/* Transitions */
.offcanvas-slide-enter-active,
.offcanvas-slide-leave-active {
    transition: transform v-bind(transitionDuration + 'ms') ease;
}

/* Slide from left */
.offcanvas-slide-enter-from.standard-offcanvas--left .standard-offcanvas__panel,
.offcanvas-slide-leave-to.standard-offcanvas--left .standard-offcanvas__panel {
    transform: translateX(-100%);
}

/* Slide from right */
.offcanvas-slide-enter-from.standard-offcanvas--right .standard-offcanvas__panel,
.offcanvas-slide-leave-to.standard-offcanvas--right .standard-offcanvas__panel {
    transform: translateX(100%);
}

/* Slide from top */
.offcanvas-slide-enter-from.standard-offcanvas--top .standard-offcanvas__panel,
.offcanvas-slide-leave-to.standard-offcanvas--top .standard-offcanvas__panel {
    transform: translateY(-100%);
}

/* Slide from bottom */
.offcanvas-slide-enter-from.standard-offcanvas--bottom .standard-offcanvas__panel,
.offcanvas-slide-leave-to.standard-offcanvas--bottom .standard-offcanvas__panel {
    transform: translateY(100%);
}

/* Fade backdrop */
.offcanvas-slide-enter-active .standard-offcanvas__backdrop,
.offcanvas-slide-leave-active .standard-offcanvas__backdrop {
    transition: opacity v-bind(transitionDuration + 'ms') ease;
}

.offcanvas-slide-enter-from .standard-offcanvas__backdrop,
.offcanvas-slide-leave-to .standard-offcanvas__backdrop {
    opacity: 0;
}
</style>