<script setup>
import { ref, onMounted, watch, nextTick } from 'vue';
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
    // Additional class for the modal content
    modalClass: { type: String, default: '' }
});

const emit = defineEmits(['show', 'hide', 'hidden', 'save', 'close']);

const modalInstance = ref(null);
const modalElement = ref(null);
const isProgrammaticHide = ref(false);

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
watch(() => [props.backdrop, props.keyboard], () => {
    if (modalInstance.value) {
        modalInstance.value.dispose();
    }
    initializeModal();
});

const initializeModal = () => {
    nextTick(() => {
        if (modalElement.value) {
            modalInstance.value = new Modal(modalElement.value, {
                backdrop: props.backdrop,
                keyboard: props.keyboard
            });

            // Add event listeners with flag check
            modalElement.value.addEventListener('show.bs.modal', () => {
                isProgrammaticHide.value = false;
                emit('show');
            });

            modalElement.value.addEventListener('hide.bs.modal', () => {
                if (!isProgrammaticHide.value) {
                    emit('hide');
                }
                isProgrammaticHide.value = false;
            });

            modalElement.value.addEventListener('hidden.bs.modal', () => {
                emit('hidden');
            });
        }
    });
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
</template>

<style scoped>
.modal-header {
    background-color: #f8f9fa;
    border-bottom: 1px solid #dee2e6;
}

.modal-footer {
    border-top: 1px solid #dee2e6;
    background-color: #f8f9fa;
}

/* Smooth transitions */
.modal-content {
    transition: all 0.3s ease;
}

/* Custom backdrop */
.modal-backdrop {
    background-color: rgba(0, 0, 0, 0.5);
}

.modal-blur {
    backdrop-filter: blur(1px);
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