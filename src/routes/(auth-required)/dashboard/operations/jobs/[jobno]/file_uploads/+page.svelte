<script lang="ts">
import { onMount } from 'svelte';
import { page } from '$app/stores';
let jobno = '';
let files: { key: string; name: string; size: number; lastModified?: string; url?: string }[] = [];
let uploading = false;
let error = '';

onMount(() => {
    jobno = $page.params.jobno;
});

async function refresh() {
    try {
        const res = await fetch(`/api/files/${jobno}`);
        const data = await res.json();
        files = data.files || [];
    } catch (e: any) {
        error = e.message || 'Failed to load files';
    }
}

onMount(refresh);

async function uploadFile(file: File) {
    uploading = true;
    error = '';
    try {
        const fd = new FormData();
        fd.append('file', file);
        const res = await fetch(`/api/files/${jobno}`, { method: 'POST', body: fd });
        if (!res.ok) throw new Error('Upload failed');
        await refresh();
    } catch (e: any) {
        error = e.message || 'Upload failed';
    } finally {
        uploading = false;
    }
}

function onInputChange(e: Event) {
    const input = e.target as HTMLInputElement;
    if (input.files && input.files[0]) uploadFile(input.files[0]);
}

function onDrop(e: DragEvent) {
    e.preventDefault();
    if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]) {
        uploadFile(e.dataTransfer.files[0]);
    }
}

function onDragOver(e: DragEvent) {
    e.preventDefault();
}

async function removeFile(key: string) {
    if (!confirm('Delete this file?')) return;
    const url = new URL(`/api/files/${jobno}`, window.location.origin);
    url.searchParams.set('key', key);
    const res = await fetch(url, { method: 'DELETE' });
    if (res.ok) files = files.filter((f) => f.key !== key);
}

function downloadFile(url: string) {
    if (!url) return;
    window.open(url, '_blank', 'noopener');
}
</script>

<div class="job-details-container">
    <div class="header">
        <div class="breadcrumb">
            <a href="/dashboard/operations" class="breadcrumb-link">Operations Dashboard</a>
            <span class="breadcrumb-separator">›</span>
            <a href="/dashboard/operations/jobsearch" class="breadcrumb-link">Job Search</a>
            <span class="breadcrumb-separator">›</span>
            <span class="breadcrumb-current"><span class="text-blue-600">Job {jobno} - File Uploads</span></span>
        </div>
    </div>

    <div class="page-body">
    <div class="bg-white rounded-2xl border border-gray-200 shadow overflow-hidden">
        <div class="px-6 py-4 border-b border-gray-200">
            <h3 class="text-lg font-medium text-gray-900">Files</h3>
            <p class="mt-1 text-sm text-gray-600">Uploaded documents for job {jobno}.</p>
        </div>

        <div class="p-6">
            <div
                class="border-2 border-dashed border-blue-300 rounded-2xl p-16 text-center bg-white"
                role="button"
                tabindex="0"
                ondrop={onDrop}
                ondragover={onDragOver}
            >
                <p class="text-sm text-gray-600 mb-4">Drag and drop files here</p>
                <label class="inline-flex items-center gap-2 cursor-pointer">
                    <input type="file" accept="application/pdf,image/*" onchange={onInputChange} class="hidden" />
                    <span class="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow">Select File</span>
                </label>
                {#if uploading}
                    <div class="mt-3 text-xs text-gray-500">Uploading...</div>
                {/if}
                {#if error}
                    <div class="mt-3 text-xs text-red-600">{error}</div>
                {/if}
            </div>
        </div>

        {#if files.length > 0}
            <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200">
                    <thead class="bg-gray-50">
                        <tr>
                            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">File Name</th>
                            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Size</th>
                            <th scope="col" class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody class="bg-white divide-y divide-gray-200">
                        {#each files as f}
                            <tr class="hover:bg-gray-50">
                                <td class="px-6 py-4">
                                    <div class="flex items-center gap-3 min-w-0">
                                        <span class="shrink-0">📄</span>
                                        <a class="truncate text-orange-700 hover:underline" href={f.url} target="_blank" rel="noopener">{f.name}</a>
                                    </div>
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap text-gray-600 text-sm">{Math.ceil(f.size / 1024)} KB</td>
                                <td class="px-6 py-4 whitespace-nowrap text-right">
                                    <div class="inline-flex items-center gap-2">
                                        <button class="inline-flex items-center justify-center w-9 h-9 rounded-md border border-gray-200 hover:bg-gray-50" onclick={() => downloadFile(f.url || '')} title="Download">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
                                        </button>
                                        <button class="inline-flex items-center justify-center w-9 h-9 rounded-md border border-red-200 text-red-600 hover:bg-red-50" onclick={() => removeFile(f.key)} title="Delete">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        {/each}
                    </tbody>
                </table>
            </div>
        {:else}
            <div class="px-6 py-12 text-center">
                <div class="text-gray-500">
                    <svg class="mx-auto text-gray-400" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    <h3 class="mt-2 text-sm font-medium text-gray-900">No files uploaded</h3>
                    <p class="mt-1 text-sm text-gray-500">Drag a file above or click Select File to upload.</p>
                </div>
            </div>
        {/if}
    </div>
    </div>
</div>

<style>
	.job-details-container {
		min-height: 100vh;
		background: linear-gradient(135deg, #f0f4f8 0%, #e2e8f0 100%);
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
		padding: 2rem;
	}

	.page-body {
		max-width: 1200px;
		margin: 0 auto;
		padding: 1rem;
	}

	.header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 2rem;
		padding: 1.5rem;
		background: white;
		border-radius: 15px;
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
		border: 1px solid #e5e7eb;
	}

	.breadcrumb {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.875rem;
	}

	.breadcrumb-link {
		color: #ea580c;
		text-decoration: none;
		font-weight: 500;
		transition: all 0.2s ease;
	}

	.breadcrumb-link:hover {
		color: #dc2626;
		text-decoration: underline;
	}

	.breadcrumb-separator {
		color: #6b7280;
	}

	.breadcrumb-current {
		color: #1f2937;
		font-weight: 600;
	}
</style>


