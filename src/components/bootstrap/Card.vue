<template>
	<div class="card" ref="card">
		<slot />
	</div>
</template>

<style scoped>
.card {
    border-radius: 8px;
    border: none;
    box-shadow: 0 4px 20px 1px rgba(0, 0, 0, 0.06);
    transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.card:hover {
    transform: translateY(-5px) scale(1.02);
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
    z-index: 1;
}
</style>