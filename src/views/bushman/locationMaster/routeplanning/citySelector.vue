<script setup>
import { ref, watch, defineProps, defineEmits } from "vue";
import vSelect from "vue-select";
import draggable from "vuedraggable";

const props = defineProps({
  allCities: { type: Array, required: true },
  selectedCities: { type: Array, default: () => [] } // <-- same as v-model:selectedCities
});

const emit = defineEmits(["update:selectedCities"]);

const selectedCitiesInternal = ref([...props.selectedCities]);

const cityName = (id) => {
  const city = props.allCities.find(c => c.id === id);
  return city ? city.name : "";
};

const removeCity = (index) => {
  selectedCitiesInternal.value.splice(index, 1);
};

// Watch internal array and emit to parent
watch(selectedCitiesInternal, (val) => {
  emit("update:selectedCities", val);
}, { deep: true });
</script>

<template>
  <div class="">
  <div class="border rounded m-2 p-4 ">
    <h5>Select  Two or More Missing Cities </h5>
    <v-select
      :options="allCities"
      label="name"
      :reduce="city => city.id"
      v-model="selectedCitiesInternal"
      placeholder="Select cities"
      multiple
      clearable
    ></v-select>    
   <draggable
  v-model="selectedCitiesInternal"
  handle=".drag-handle"
  item-key="id"
  class="list-group list-group-flush"
>
  <template #item="{ element, index }">
    <div class="list-group-item d-flex align-items-center py-3 px-3">
      <!-- Drag Handle -->
      <span class="drag-handle me-3 text-muted" style="cursor: grab;">
        ☰
      </span>
      
      <!-- Badge -->
      <span class="badge bg-secondary me-3">{{ index + 1 }}</span>
      
      <!-- City Name -->
      <div class="flex-grow-1">
        <h6 class="mb-0 fw-bold">{{ cityName(element) }}</h6>
        <small class="text-muted" v-if="element.country">{{ element.country }}</small>
      </div>
      
      <!-- Remove Button -->
      <button @click="removeCity(index)" class="btn btn-sm btn-outline-danger">
        ✖ Remove
      </button>
    </div>
  </template>
</draggable>



  </div>
  </div>
</template>
