<script lang="ts">
import { onMount } from 'svelte';
type Props = { jobno: string };
let { jobno }: Props = $props();

let files = $state<{ key: string; name: string; size: number; lastModified?: string; url?: string }[]>([]);
let uploading = $state(false);
let error = $state('');

async function loadFiles() {
	error = '';
	try {
		const res = await fetch(`/api/files/${jobno}`);
		if (!res.ok) throw new Error('Failed to load files');
		const data = await res.json();
		files = data.files || [];
	} catch (e: any) {
		error = e.message || 'Error loading files';
	}
}

onMount(loadFiles);

async function onFileChange(ev: Event) {
	const input = ev.target as HTMLInputElement;
	if (!input.files || input.files.length === 0) return;
	const file = input.files[0];
	uploading = true;
	error = '';
	try {
		const fd = new FormData();
		fd.append('file', file);
		const res = await fetch(`/api/files/${jobno}`, { method: 'POST', body: fd });
		if (!res.ok) throw new Error('Upload failed');
		await loadFiles();
	} catch (e: any) {
		error = e.message || 'Upload error';
	} finally {
		uploading = false;
		if (input) input.value = '';
	}
}

async function removeFile(key: string) {
	if (!confirm('Delete this file?')) return;
	try {
		const url = new URL(`/api/files/${jobno}`, window.location.origin);
		url.searchParams.set('key', key);
		const res = await fetch(url, { method: 'DELETE' });
		if (!res.ok) throw new Error('Delete failed');
		files = files.filter((f) => f.key !== key);
	} catch (e: any) {
		error = e.message || 'Delete error';
	}
}
</script>

<div class="rounded-xl border border-gray-200 p-4 bg-white">
	<div class="flex items-center justify-between mb-3">
		<h3 class="text-sm font-semibold text-gray-700">Job Files</h3>
		<label class="inline-flex items-center gap-2 cursor-pointer">
			<input type="file" accept="application/pdf,image/*" onchange={onFileChange} class="hidden" />
			<span class="px-3 py-1.5 text-xs font-medium bg-orange-600 text-white rounded-md hover:bg-orange-700">Upload</span>
		</label>
	</div>

	{#if error}
		<div class="text-xs text-red-600 mb-2">{error}</div>
	{/if}

	{#if uploading}
		<div class="text-xs text-gray-500 mb-2">Uploading...</div>
	{/if}

	{#if files.length === 0}
		<div class="text-xs text-gray-500">No files uploaded yet.</div>
	{:else}
		<ul class="space-y-2">
			{#each files as f}
				<li class="flex items-center justify-between text-sm">
					<div class="flex items-center gap-3 min-w-0">
						<span class="shrink-0 text-gray-500">📄</span>
						<a class="truncate text-orange-700 hover:underline" href={f.url} target="_blank" rel="noopener">{f.name}</a>
						<span class="text-xs text-gray-400">{Math.ceil(f.size / 1024)} KB</span>
					</div>
					<button class="text-xs text-gray-500 hover:text-red-600" onclick={() => removeFile(f.key)}>Delete</button>
				</li>
			{/each}
		</ul>
	{/if}
</div>


