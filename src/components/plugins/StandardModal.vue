<script setup>
import { ref, onMounted, watch, nextTick, onBeforeUnmount } from 'vue';
import { Modal } from 'bootstrap';

const props = defineProps({
    id: { type: String, required: true },
    title: { type: String, default: '' },
    size: { type: String, default: 'md' }, // sm, md, lg, xl
    backdrop: { type: [Boolean, String], default: true }, // true, false, 'static'
    keyboard: { type: Boolean, default: true },
    scrollable: { type: Boolean, default: false },
    centered: { type: Boolean, default: false },
    headerClass: { type: String, default: '' },
    bodyClass: { type: String, default: '' },
    footerClass: { type: String, default: '' },
    showClose: { type: Boolean, default: true },
    showFooter: { type: Boolean, default: false },
    closeOnSave: { type: Boolean, default: true },
    autoFocus: { type: Boolean, default: true },
    focusSelector: { type: String, default: '' },
    // Additional class for the modal content
    modalClass: { type: String, default: '' }
});

const emit = defineEmits(['show', 'hide', 'hidden', 'save', 'close']);

const modalInstance = ref(null);
const modalElement = ref(null);
const isProgrammaticHide = ref(false);
const lastFocusedElement = ref(null);

// Modal sizes mapping
const modalSizes = {
    sm: 'modal-sm',
    md: '',
    lg: 'modal-lg',
    xl: 'modal-xl'
};

// Initialize modal
onMounted(() => {
    initializeModal();
});

// Reinitialize modal when props change
watch(() => [props.backdrop, props.keyboard, props.autoFocus], () => {
    disposeModal();
    initializeModal();
});

onBeforeUnmount(() => {
    disposeModal();
});

const focusableSelector = [
    '[autofocus]',
    'input:not([type="hidden"]):not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    'button:not([disabled]):not(.btn-close)',
    '[tabindex]:not([tabindex="-1"])'
].join(',');

const focusTargetInModal = () => {
    if (!props.autoFocus || !modalElement.value) return;
    
    const runFocus = () => {
        if (!modalElement.value) return;
        
        const preferred = props.focusSelector
            ? modalElement.value.querySelector(props.focusSelector)
            : null;
        const bodyTarget = modalElement.value.querySelector('.modal-body')?.querySelector(focusableSelector);
        const target = preferred || bodyTarget || modalElement.value.querySelector(focusableSelector) || modalElement.value;
        
        if (target?.focus) {
            // Use setTimeout to ensure we run after Bootstrap's focus trap initialization
            setTimeout(() => {
                target.focus({ preventScroll: false });
            }, 0);
        }
    };
    
    // Use nextTick + requestAnimationFrame + small delay for reliability with scrollable modals
    nextTick(() => {
        if (typeof window !== 'undefined' && window.requestAnimationFrame) {
            window.requestAnimationFrame(() => {
                setTimeout(runFocus, 50);
            });
        } else {
            setTimeout(runFocus, 50);
        }
    });
};

const restoreFocus = () => {
    if (typeof document === 'undefined') return;
    const target = lastFocusedElement.value;
    if (target && document.contains(target) && target.focus) {
        target.focus({ preventScroll: true });
    }
    lastFocusedElement.value = null;
};

const handleShowEvent = () => {
    isProgrammaticHide.value = false;
    if (typeof document !== 'undefined') {
        lastFocusedElement.value = document.activeElement;
    }
    emit('show');
};

const handleShownEvent = () => {
    focusTargetInModal();
};

const handleHideEvent = () => {
    if (!isProgrammaticHide.value) {
        emit('hide');
    }
    isProgrammaticHide.value = false;
};

const handleHiddenEvent = () => {
    emit('hidden');
    restoreFocus();
};

const initializeModal = () => {
    nextTick(() => {
        if (modalElement.value) {
            modalInstance.value = new Modal(modalElement.value, {
                backdrop: props.backdrop,
                keyboard: props.keyboard,
                focus: props.autoFocus // Let our custom focus logic handle it when autoFocus is true
            });

            // Add event listeners with flag check
            modalElement.value.addEventListener('show.bs.modal', handleShowEvent);
            modalElement.value.addEventListener('shown.bs.modal', handleShownEvent);
            modalElement.value.addEventListener('hide.bs.modal', handleHideEvent);
            modalElement.value.addEventListener('hidden.bs.modal', handleHiddenEvent);
        }
    });
};

const disposeModal = () => {
    if (modalElement.value) {
        modalElement.value.removeEventListener('show.bs.modal', handleShowEvent);
        modalElement.value.removeEventListener('shown.bs.modal', handleShownEvent);
        modalElement.value.removeEventListener('hide.bs.modal', handleHideEvent);
        modalElement.value.removeEventListener('hidden.bs.modal', handleHiddenEvent);
    }
    if (modalInstance.value) {
        modalInstance.value.dispose();
        modalInstance.value = null;
    }
};

// Methods to control modal
const show = () => {
    if (modalInstance.value) {
        modalInstance.value.show();
    }
};

const hide = () => {
    if (modalInstance.value) {
        isProgrammaticHide.value = true;
        modalInstance.value.hide();
    }
};

const handleSave = () => {
    emit('save');
    if (props.closeOnSave) {
        hide();
    }
};

const handleClose = () => {
    emit('close');
    hide();
};

// Expose methods to parent component
defineExpose({ show, hide });
</script>

<template>
    <teleport to="body">
        <div class="modal fade modal-blur" :id="id" ref="modalElement" tabindex="-1" :aria-labelledby="`${id}Label`" aria-hidden="true"
            :data-bs-backdrop="backdrop" :data-bs-keyboard="keyboard">
            <div class="modal-dialog" :class="[
                modalSizes[size],
                { 'modal-dialog-scrollable': scrollable, 'modal-dialog-centered': centered },
                modalClass
            ]">
                <div class="modal-content">
                    <!-- Header -->
                    <div v-if="title || showClose" class="modal-header" :class="headerClass">
                        <h5 v-if="title" class="modal-title" :id="`${id}Label`">
                            <slot name="header">{{ title }}</slot>
                        </h5>
                        <button v-if="showClose" type="button" class="btn-close" aria-label="Close"
                            @click="handleClose"></button>
                    </div>

                    <!-- Body -->
                    <div class="modal-body" :class="bodyClass">
                        <slot></slot>
                    </div>

                    <!-- Footer -->
                    <div v-if="showFooter || $slots.footer" class="modal-footer" :class="footerClass">
                        <slot name="footer">
                            <button type="button" class="btn btn-secondary" @click="handleClose">
                                Close
                            </button>
                            <button type="button" class="btn btn-primary" @click="handleSave">
                                Save
                            </button>
                        </slot>
                    </div>
                </div>
            </div>
        </div>
    </teleport>
</template>

<style scoped>
.modal-header {
    /* background-color: #f8f9fa; */
    border-bottom: 1px solid #dee2e6;
}

.modal-footer {
    border-top: 1px solid #dee2e6;
   /* background-color: #f8f9fa; */
}

/* Smooth transitions */
.modal-content {
    transition: all 0.3s ease;
}

/* Custom modal styles */
.custom-modal .modal-content {
    border-radius: 0.5rem;
    box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);
}

.custom-modal .modal-header {
    border-top-left-radius: 0.5rem;
    border-top-right-radius: 0.5rem;
}

.custom-modal .modal-footer {
    border-bottom-left-radius: 0.5rem;
    border-bottom-right-radius: 0.5rem;
}
</style>

<!-- Global styles for backdrop (not scoped) -->
<style>
/* Standard Bootstrap Modal Backdrop overrides */
.modal-backdrop {
    background-color: rgba(0, 0, 0, 0.6) !important;
    backdrop-filter: blur(6px);
    -webkit-backdrop-filter: blur(6px);
    z-index: 1050;
}

.modal-backdrop.show {
    opacity: 0.6 !important;
}

/* Fix modal container */
.modal.show {
    display: block; /* Ensure modal container is displayed */
    background-color: transparent !important; /* Let backdrop handle the dimming */
    z-index: 1055;
}

/* Ensure modal content is fully visible */
.modal-content {
    background-color: #fff;
    opacity: 1;
}

/* Fix for modal-blur class - remove blur from the modal element itself */
.modal.modal-blur {
    backdrop-filter: none !important;
    -webkit-backdrop-filter: none !important;
}
</style>
