<template>
    <div>
        <!-- Breadcrumb -->
        <div class="d-flex justify-content-between align-items-center">
            <div>
                <ul class="breadcrumb">
                    <li class="breadcrumb-item"><a href="#">origin</a></li>                   
                    <li class="breadcrumb-item active"> origin 3</li>
                </ul>
            </div>

            <button @click="$tab_3r.back()" class="btn btn-outline-secondary text-nowrap btn-sm px-3 rounded-pill">
                <i class="fa fa-arrow-left me-1"></i> Back
            </button>
        </div>

        <div class="row gx-4 ">
            <div class="col-lg-12">
                <div class="card">
                    <!-- HEADER -->
                    <div class="card-header d-flex align-items-center bg-white fw-400">
                        <div class="d-flex align-items-center">
                            <div class="vehicle-icon me-2">
                                <i class="fa fa-bus fa-3x text-primary"></i>
                            </div>
                            <div>
                                <h4 class="mb-0">
                                    page header
                                </h4>
                                <small class="text-muted">
                                      small description
                                </small>
                            </div>
                        </div>

                        <div class="ms-auto d-flex align-items-center gap-2">
                            <button class="btn btn-outline-secondary"
                                :disabled="loading">
                                <i class="fa fa-sync-alt me-1" :class="{ 'fa-spin': loading }"></i>
                                Refresh
                            </button>

                            <button 
                                class="btn btn-primary"  @click="buttonMethod">
                                action button                               
                            </button>

                            
                        </div>
                    </div>

                    <!-- TABS -->
                    <div class="card-header p-0 border-bottom bg-white">
                        <ul class="nav nav-tabs w-100 overflow-auto flex-nowrap mt-2">
                            <li v-for="tab in tabs" class="nav-item flex-fill text-center">
                                <a :href="'#' + tab.key" class="nav-link" :class="{ active: activeTab === tab.key }"
                                    @click="onTabClick(tab)" data-bs-toggle="tab">
                                    <i :class="tab.icon"></i> {{ tab.label }}
                                </a>
                            </li>
                        </ul>

                    </div>

                    <!-- TAB CONTENT -->
                    <div class="tab-content p-4">
                        <div class="tab-pane fade show active" id="tab_1">                            
                             <div class="d-flex flex-column justify-content-center align-items-center text-center"
                                style="height: 300px;">
                                <!-- Image / Icon -->
                                <img src="https://cdn-icons-png.flaticon.com/512/2910/2910762.png" alt="Coming Soon"
                                    style="width: 100px; height: 100px; object-fit: contain;" class="mb-3">

                                <!-- Main Text -->
                                <h2 class="fw-bold"> tab 1 Coming Soon </h2>

                                <!-- Subtext -->
                                <p class="text-muted">This section is still under progress.</p>
                            </div>
                        </div>
                        <div class="tab-pane fade" id="tab_2">
                            <div class="d-flex flex-column justify-content-center align-items-center text-center"
                                style="height: 300px;">
                                <!-- Image / Icon -->
                                <img src="https://cdn-icons-png.flaticon.com/512/2910/2910762.png" alt="Coming Soon"
                                    style="width: 100px; height: 100px; object-fit: contain;" class="mb-3">

                                <!-- Main Text -->
                                <h2 class="fw-bold"> tab 2Coming Soon</h2>

                                <!-- Subtext -->
                                <p class="text-muted">This section is still under progress.</p>
                            </div>

                        </div>
                        <div class="tab-pane fade" id="tab_3">
                            <div class="d-flex flex-column justify-content-center align-items-center text-center"
                                style="height: 300px;">
                                <!-- Image / Icon -->
                                <img src="https://cdn-icons-png.flaticon.com/512/2910/2910762.png" alt="Coming Soon"
                                    style="width: 100px; height: 100px; object-fit: contain;" class="mb-3">

                                <!-- Main Text -->
                                <h2 class="fw-bold"> tab 3 Coming Soon</h2>

                                <!-- Subtext -->
                                <p class="text-muted">This section is still under progress.</p>
                            </div>

                        </div>
                        <div class="tab-pane fade" id="tab_4">
                            <div class="d-flex flex-column justify-content-center align-items-center text-center"
                                style="height: 300px;">
                                <!-- Image / Icon -->
                                <img src="https://cdn-icons-png.flaticon.com/512/2910/2910762.png" alt="Coming Soon"
                                    style="width: 100px; height: 100px; object-fit: contain;" class="mb-3">

                                <!-- Main Text -->
                                <h2 class="fw-bold"> tab 4 Coming Soon</h2>

                                <!-- Subtext -->
                                <p class="text-muted">This section is still under progress.</p>
                            </div>

                        </div>
                       
                    </div>
                </div>
            </div>
        </div>
    </div>    
</template>

<script setup>
import { ref,onMounted } from 'vue';

const activeTab =ref("tab_1");
const tabs = ref([
    {
        key: "tab_1",
        label: "Tab 1",
        icon: "fa fa-home",        
        action: () => functionName(),
    },
    {
        key: "tab_2",
        label: "Tab_2",
        icon: "fa fa-cogs",
        
        // action: () => fetchBusSeatMap(vehicle.value.id),

    },
    {
        key: "tab_3",
        label: "Tab_3",
        icon: "fa fa-tab_3",
       
    },
    {
        key: "tab_4",
        label: "Tab_44",
        icon: "fa fa-gas-pump",
        
    },
    
]);



const functionName = () => {


}

const buttonMethod = () => {

}

</script>


