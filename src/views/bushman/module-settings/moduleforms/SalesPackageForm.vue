<template>
  <div>
    <form @submit.prevent="submit">
      <div class="form-group">
        <label for="package_name">Package Name</label>
        <input type="text" class="form-control" id="package_name" v-model="form.package_name">
      </div>
      <div class="form-group">
        <label for="description">Description</label>
        <textarea class="form-control" id="description" v-model="form.description"></textarea>
      </div>
      
      <!-- Area Selection -->
      <div class="form-group">
        <label for="area">Area</label>
        <select class="form-control" id="area" v-model="form.area">
          <option v-for="option in areasOptions" :key="option.value" :value="option">{{ option.text }}</option>
        </select>
      </div>

      <!-- Licence Selection -->
      <div class="form-group">
        <label for="licence">Licence</label>
        <select class="form-control" id="licence" v-model="form.licence">
          <option v-for="option in regulatoryPackagesOptions" :key="option.value" :value="option">{{ option.text }}</option>
        </select>
      </div>

      <!-- Species Selection -->
      <div class="card mt-3">
        <div class="card-header">
            <h5>Add Species</h5>
        </div>
        <div class="card-body">
            <div class="row">
                <div class="col-md-6">
                    <div class="form-group">
                        <label>Species</label>
                        <select class="form-control" v-model="form.species">
                            <option v-for="option in speciesOptions" :key="option.value" :value="option">{{ option.text }}</option>
                        </select>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="form-group">
                        <label>Quantity</label>
                        <input type="number" class="form-control" v-model.number="form.quantity" min="1">
                    </div>
                </div>
                <div class="col-md-2">
                    <button type="button" class="btn btn-primary mt-4" @click="addNewSpeciesItemToStorage">Add</button>
                </div>
            </div>
            <div class="mt-3">
                <h6>Selected Species</h6>
                <ul class="list-group">
                    <li v-for="(item, index) in speciesObjects" :key="index" class="list-group-item d-flex justify-content-between align-items-center">
                        {{ item.name }} ({{ item.quantity }})
                        <button type="button" class="btn btn-danger btn-sm" @click="deleteFromStorage(index)">Remove</button>
                    </li>
                </ul>
            </div>
        </div>
      </div>

      <button type="submit" class="btn btn-primary mt-3" :disabled="saving">
        <span v-if="saving" class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
        Save
      </button>
      <button type="button" class="btn btn-secondary mt-3 ms-2" @click="goBack">Cancel</button>
    </form>
  </div>
</template>

<script lang="ts">
import { ref, reactive, onMounted, defineComponent, watch } from 'vue';
import handleErrors from '../../../../stores/bushman/errorHandler';
import { useToast } from '@/composables/useToast';
import { useQuotaStore } from '../../../../stores/bushman/quota-store';
import { useSettingsStore } from '../../../../stores/bushman/settings-store';
import { usePriceListStore } from '../../../../stores/bushman/price-list-store';
import { useRegulatoryPackageStore } from '../../../../stores/bushman/regulatory-store';

interface SelectOption {
  value: any;
  text: string;
}

interface FormData {
  package_name: string;
  description: string;
  species: SelectOption | null;
  quantity: number;
  area: SelectOption | null;
  licence: SelectOption | null;
}

export default defineComponent({
  props: {
    editMode: {
      type: Boolean,
      default: false,
    },
    editItem: {
      type: Object,
      default: null,
    },
  },
  emits: ['saved', 'goBack'],
  setup(props, { emit }) {
    const { init } = useToast();
    const quotaStore = useQuotaStore();
    const settingsStore = useSettingsStore();
    const priceListStore = usePriceListStore();
    const regulatoryPackageStore = useRegulatoryPackageStore();

    const saving = ref(false);
    const form = reactive<FormData>({
      package_name: '',
      description: '',
      species: null,
      quantity: 1,
      area: null,
      licence: null,
    });

    const areasOptions = ref<SelectOption[]>([]);
    const regulatoryPackagesOptions = ref<SelectOption[]>([]);
    const speciesOptions = ref<SelectOption[]>([]);
    const speciesObjects = ref<Array<{ id: any; name: string; quantity: number }>>([]);

    watch(() => props.editItem, (newItem) => {
        if (newItem && props.editMode) {
            form.package_name = newItem.name;
            form.description = newItem.description;
            form.area = { value: newItem.area.id, text: newItem.area.name };
            form.licence = { value: newItem.regulatory_package.id, text: newItem.regulatory_package.name };
            speciesObjects.value = newItem.species.map((s: any) => ({
                id: s.species.id,
                name: s.species.name,
                quantity: s.quantity
            }));
        }
    }, { immediate: true });

    async function getAreas() {
      try {
        const response = await quotaStore.getAreaList();
        areasOptions.value = response.data.map((item: any) => ({
          value: item.id,
          text: item.name,
        }));
      } catch (error) {
        console.error(error);
      }
    }

    async function getLicencePackages() {
      try {
        const response = await regulatoryPackageStore.getRegulatoryPackages();
        regulatoryPackagesOptions.value = response.data.map((item: any) => ({
          value: item.id,
          text: item.name,
        }));
      } catch (error) {
        console.error(error);
      }
    }
    
    async function getSpeciesBasedOnAreaAndLicence() {
        if (!form.area || !form.licence) {
            speciesOptions.value = [];
            return;
        }
        const payload = {
            areaId: form.area?.value,
            licenceId: form.licence?.value,
        };
        try {
            const response = await settingsStore.getHuntingLicenseAreaSpecies(payload);
            speciesOptions.value = response.data.map((item: any) => ({
                value: item.id,
                text: item.name,
            }));
        } catch (error: any) {
            const errors = handleErrors(error.response);
            init({ message: errors.join(', ') || 'Failed to get species.', color: 'danger' });
        }
    }

    watch(() => [form.area, form.licence], getSpeciesBasedOnAreaAndLicence);


    function addNewSpeciesItemToStorage() {
      if (!form.species || form.quantity <= 0) {
        init({ message: 'Please select a species and a quantity greater than 0.', color: 'warning' });
        return;
      }

      if (!form.species) return;
      
      const exists = speciesObjects.value.some(
        (s) => s.id === form.species!.value
      );
      if (exists) {
          init({ message: 'Species already added.', color: 'warning' });
          return;
      }

      speciesObjects.value.push({
        id: form.species.value,
        name: form.species.text,
        quantity: form.quantity,
      });
      form.species = null;
      form.quantity = 1;
    }

    function deleteFromStorage(index: number) {
      speciesObjects.value.splice(index, 1);
    }
    
    async function submit() {
      saving.value = true;
      if (speciesObjects.value.length === 0) {
        init({ message: 'Please add at least one species.', color: 'warning' });
        saving.value = false;
        return;
      }

      if (!form.area || !form.licence) {
        init({ message: 'Please select both area and licence.', color: 'warning' });
        return;
      }

      const requestdata = {
        name: form.package_name,
        description: form.description,
        areaId: form.area.value,
        licenceId: form.licence.value,
        speciesObjectList: speciesObjects.value.map((s: any) => ({ species_id: s.id, quantity: s.quantity })),
      };

      try {
        let response;
        if(props.editMode) {
            response = await priceListStore.updateSalesPackage(props.editItem.id, requestdata);
        } else {
            response = await priceListStore.createSalesPackage(requestdata);
        }
        
        if (response.status === 201 || response.status === 200) {
          init({ message: `Package ${props.editMode ? 'updated' : 'created'} successfully.`, color: 'success' });
          emit('saved');
        }
      } catch (error: any) {
        const errors = handleErrors(error.response);
        init({ message: errors.join(', ') || `Failed to ${props.editMode ? 'update' : 'create'} package.`, color: 'danger' });
      } finally {
        saving.value = false;
      }
    }

    function goBack() {
      emit('goBack');
    }

    onMounted(() => {
      getAreas();
      getLicencePackages();
      if(props.editMode && props.editItem) {
        getSpeciesBasedOnAreaAndLicence();
      }
    });

    return {
      form,
      saving,
      submit,
      goBack,
      areasOptions,
      regulatoryPackagesOptions,
      speciesOptions,
      speciesObjects,
      addNewSpeciesItemToStorage,
      deleteFromStorage
    };
  },
});
</script>