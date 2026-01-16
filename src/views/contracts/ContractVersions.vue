<template>
	<div class="versions-card">
		<div class="subsection-header">
			<h4>Contract Versions</h4>
			<div class="header-controls">
				<button v-if="!hasSavedVersion" class="btn btn-sm btn-primary" @click="addVersion" type="button">+ Add Version</button>
			</div>
		</div>

		<div v-if="displayedVersions.length > 0" class="table-wrapper mt-3">
			<table class="data-table">
				<thead>
					<tr>
						<th>Version</th>
						<th>Status</th>
						<th>Template</th>
						<th>Generated</th>
						<th>Actions</th>
					</tr>
				</thead>
				<tbody>
					<tr v-for="(version, idx) in displayedVersions" :key="version._localId || version.id || idx">
						<td>#{{ version.versionNo }}</td>
						<td>{{ version.status }}</td>
						<td>{{ version.templateName || version.templateId || '-' }}</td>
						<td>{{ formatDate(version.generatedAt) }}</td>
						<td>
							<input :id="`cv-file-${idx}`" type="file" style="display:none" @change="(e) => onFileSelected(e, idx)" />
							<button class="btn btn-xs" @click.prevent="triggerFileSelect(idx)" type="button">Choose</button>
							<button class="btn btn-xs" @click.prevent="downloadVersionFile(version)" type="button">Download</button>
							<button v-if="version.status !== 'SIGNED'" class="btn btn-xs btn-success" @click.prevent="signVersion(version)" type="button">Sign</button>
							<button class="btn btn-xs btn-danger" @click.prevent="deleteVersion(idx, version)" type="button">Delete</button>
						</td>
					</tr>
				</tbody>
			</table>
		</div>

		<div v-else class="empty-state mt-3">No versions available</div>
	</div>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted, computed } from 'vue'
import { useContractStore } from '@/stores/bushman/contract-store'
import { useToast } from '@/composables/useToast'

const props = defineProps<{ contractId: number | null }>()
const { init } = useToast()

const store = useContractStore()
const localVersions = reactive<Array<any>>([])
let localCounter = 0

const formatDate = (d: string | null | undefined) => {
	if (!d) return 'N/A'
	try { return new Date(d).toLocaleDateString() } catch { return 'N/A' }
}

const hasSavedVersion = computed(() => Array.isArray(store.versions) && store.versions.length > 0)

const displayedVersions = computed(() => {
	// Prefer saved version with versionNo === 1, else prefer local versionNo === 1, else first available
	try {
		if (Array.isArray(store.versions) && store.versions.length) {
			const v = (store.versions || []).find((x: any) => (x.version_no || x.versionNo) === 1)
			if (v) return [{
				id: v.id,
				versionNo: v.version_no || v.versionNo || 1,
				status: v.status,
				templateId: v.template_id ?? v.templateId ?? null,
				templateName: v.template_name || v.templateName,
				filePath: v.file_path || v.filePath || '',
				generatedAt: v.generated_at || v.generatedAt,
				_file: null
			}]
		}

		const localMatch = localVersions.find(v => Number(v.versionNo) === 1)
		if (localMatch) return [localMatch]

		return localVersions.length ? [localVersions[0]] : []
	} catch (e) {
		return localVersions.length ? [localVersions[0]] : []
	}
})

const fetchVersions = async () => {
	if (!props.contractId) return
	try {
		await store.getContractVersions(props.contractId)
		const list = store.versions || []
		localVersions.splice(0, localVersions.length, ...list.map((v: any, i: number) => ({
			id: v.id,
			versionNo: v.version_no || v.versionNo || i + 1,
			status: v.status,
			templateId: v.template_id ?? v.templateId ?? null,
			templateName: v.template_name || v.templateName,
			filePath: v.file_path || v.filePath || '',
			generatedAt: v.generated_at || v.generatedAt,
			signedAt: v.signed_at || v.signedAt,
			createdBy: v.createdBy || v.created_by || null,
			_file: null
		})))
	} catch (error) {
		console.error('Failed to fetch versions', error)
	}
}

const addVersion = () => {
	if (hasSavedVersion.value) {
		init({ message: 'A saved version exists. Manage it from the details view.', color: 'info' })
		return
	}
	localCounter += 1
	localVersions.push({
		_localId: `local-${localCounter}`,
		versionNo: localVersions.length + 1,
		status: 'DRAFT',
		templateId: null,
		templateName: '',
		filePath: '',
		generatedAt: new Date().toISOString(),
		_file: null
	})
}

const triggerFileSelect = (idx: number) => {
	const el = document.getElementById('cv-file-' + idx) as HTMLInputElement | null
	el?.click()
}

const onFileSelected = (evt: Event, idx: number) => {
	const input = evt.target as HTMLInputElement
	if (!input.files || input.files.length === 0) return
	const file = input.files[0]
	const MAX_FILE_SIZE = 10 * 1024 * 1024
	const ALLOWED_TYPES = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
	if (!ALLOWED_TYPES.includes(file.type)) {
		init({ message: 'Invalid file type. Only PDF / DOC / DOCX allowed', color: 'danger' })
		return
	}
	if (file.size > MAX_FILE_SIZE) {
		init({ message: 'File too large. Maximum is 10MB', color: 'danger' })
		return
	}
	localVersions[idx]._file = file
	localVersions[idx].filePath = file.name
}

const uploadVersionToServer = async (version: any) => {
	if (!props.contractId) return init({ message: 'Save contract first to upload versions', color: 'warning' })
	try {
		const fd = new FormData()
		if (version.templateId) fd.append('template_id', String(version.templateId))
		else if (version.templateName) fd.append('template_name', version.templateName)
		if (version.generatedAt) fd.append('generated_at', new Date(version.generatedAt).toISOString().slice(0,19).replace('T',' '))
		if (version._file) fd.append('file', version._file)

		if (version.id) {
			await store.updateVersion(props.contractId, version.id, fd)
		} else {
			await store.createVersion(props.contractId, fd)
		}
		init({ message: `Version ${version.versionNo} uploaded`, color: 'success' })
		await fetchVersions()
	} catch (error: any) {
		console.error('Upload failed', error)
		init({ message: 'Upload failed', color: 'danger' })
	}
}

const downloadVersionFile = async (version: any) => {
	try {
		if (!version.id) {
			if (version._file) {
				const url = URL.createObjectURL(version._file)
				const a = document.createElement('a')
				a.href = url
				a.download = version._file.name
				a.click()
				URL.revokeObjectURL(url)
			} else {
				init({ message: 'No file available for download', color: 'warning' })
			}
			return
		}
		const resp = await store.downloadVersionFile(Number(props.contractId), Number(version.id))
		const blob = resp.data || resp
		const url = window.URL.createObjectURL(blob)
		const a = document.createElement('a')
		a.href = url
		const filename = version.filePath ? version.filePath.split('/').pop() : `contract_v${version.versionNo}.pdf`
		a.download = filename
		a.click()
		window.URL.revokeObjectURL(url)
	} catch (error: any) {
		console.error('Download failed', error)
		init({ message: 'Download failed', color: 'danger' })
	}
}

const signVersion = async (version: any) => {
	if (!version.id) return init({ message: 'Save version to sign', color: 'warning' })
	try {
		if (!confirm(`Sign version #${version.versionNo}? This will mark it as SIGNED.`)) return
		await store.signVersion(Number(props.contractId), Number(version.id))
		init({ message: `Version ${version.versionNo} signed`, color: 'success' })
		await fetchVersions()
	} catch (error) {
		console.error('Sign failed', error)
		init({ message: 'Signing failed', color: 'danger' })
	}
}

const deleteVersion = async (idx: number, version: any) => {
	try {
		if (!confirm(`Delete version #${version.versionNo}? This cannot be undone.`)) return
		if (version.id) {
			await store.deleteVersion(Number(props.contractId), Number(version.id))
		}
		await fetchVersions()
		init({ message: 'Version deleted', color: 'success' })
	} catch (error) {
		console.error('Delete failed', error)
		init({ message: 'Delete failed', color: 'danger' })
	}
}

onMounted(async () => {
	if (props.contractId) await fetchVersions()
})
</script>

<style scoped>
.versions-card { padding: 12px 0 }
.data-table th, .data-table td { padding: 8px 12px }
.btn-xs { padding:4px 8px; margin-right:6px }
.subsection-header { display:flex; align-items:center; justify-content:space-between }
.subsection-header .header-controls { display:flex; gap:8px; align-items:center }
</style>
