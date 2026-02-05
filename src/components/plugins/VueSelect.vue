<script>
import vSelect from 'vue-select';
import 'vue-select/dist/vue-select.css';

export default {
  inheritAttrs: false,
  components: {
    vSelect
  },
  props: {
    closeOnSelect: { type: Boolean, default: true },
    clearSearchOnSelect: { type: Boolean, default: true }
  }
}
</script>

<template>
  <v-select
    v-bind="$attrs"
    :closeOnSelect="closeOnSelect"
    :clearSearchOnSelect="clearSearchOnSelect"
  />
</template>
