import type { RequestHandler } from '@sveltejs/kit';
import { json, error } from '@sveltejs/kit';
import { FileUploadService } from '$lib/services/fileUploadService';

async function resolveCanonicalJobnumber(locals: any, provided: string): Promise<string> {
    if (!locals.supabase) throw error(500, 'Database not configured');

    // Try direct match against canonical jobnumber first
    const direct = await locals.supabase
        .from('jobsfile')
        .select('jobnumber')
        .eq('jobnumber', provided)
        .maybeSingle();

    if (direct.data?.jobnumber) return direct.data.jobnumber as string;

    // Fallback: resolve via human-friendly jobno -> jobnumber
    const viaJobno = await locals.supabase
        .from('jobsfile')
        .select('jobnumber')
        .eq('jobno', provided)
        .maybeSingle();

    if (viaJobno.data?.jobnumber) return viaJobno.data.jobnumber as string;

    throw error(404, `Job not found for reference ${provided}`);
}

// GET /api/files/[jobno] -> list files
export const GET: RequestHandler = async ({ params, locals }) => {
    try {
        const session = await locals.getSession?.();
        if (!session) throw error(401, 'Unauthorized');

        const jobno = params.jobno as string;
        if (!locals.supabase) throw error(500, 'Database not configured');

        const jobnumber = await resolveCanonicalJobnumber(locals, jobno);

        // Read from DB table, then attach signed URLs from R2 for download
        const { data: rows, error: listErr } = await locals.supabase
            .from('file_uploads')
            .select('id, r2_key, file_name, size_bytes, created_at')
            .eq('jobnumber', jobnumber)
            .order('created_at', { ascending: false });

        if (listErr) {
            throw error(500, listErr.message);
        }

        const service = new FileUploadService();
        const files = await Promise.all(
            (rows || []).map(async (r) => ({
                key: r.r2_key,
                name: r.file_name || r.r2_key.split('/').pop() || 'file',
                size: Number(r.size_bytes || 0),
                url: await service.getDownloadUrl(r.r2_key)
            }))
        );

        return json({ files });
    } catch (e: any) {
        console.error('List files error', e);
        throw error(e.status || 500, e.message || 'Failed to list files');
    }
};

// POST /api/files/[jobno] -> upload one file (multipart/form-data)
export const POST: RequestHandler = async ({ params, request, locals }) => {
    try {
        const session = await locals.getSession?.();
        if (!session) throw error(401, 'Unauthorized');

        const jobno = params.jobno as string;
        if (!locals.supabase) throw error(500, 'Database not configured');
        const jobnumber = await resolveCanonicalJobnumber(locals, jobno);
        const form = await request.formData();
        const file = form.get('file');
        if (!(file instanceof File)) throw error(400, 'Missing file field');

        const service = new FileUploadService();
        // Use the canonical jobnumber for object prefixing to keep consistency
        const uploaded = await service.uploadFile({ jobno: jobnumber, file });
        const url = await service.getDownloadUrl(uploaded.key);

        // Record in database
        const { error: dbErr } = await locals.supabase
            .from('file_uploads')
            .insert({
                jobnumber,
                r2_key: uploaded.key,
                file_name: file.name,
                content_type: file.type || null,
                size_bytes: file.size || null
            });

        if (dbErr) {
            console.error('DB insert error (file_uploads):', dbErr);
            throw error(500, dbErr.message || 'Failed to save file metadata');
        }

        return json({
            success: true,
            file: { ...uploaded, url }
        });
    } catch (e: any) {
        console.error('Upload file error', e);
        throw error(e.status || 500, e.message || 'Failed to upload file');
    }
};

// DELETE /api/files/[jobno]?key=... -> delete file by key
export const DELETE: RequestHandler = async ({ url, locals }) => {
    try {
        const session = await locals.getSession?.();
        if (!session) throw error(401, 'Unauthorized');

        const key = url.searchParams.get('key');
        if (!key) throw error(400, 'Missing key');

        const service = new FileUploadService();
        await service.deleteFile(key);

        // Remove DB record
        if (locals.supabase) {
            const { error: dbErr } = await locals.supabase
                .from('file_uploads')
                .delete()
                .eq('r2_key', key);
            if (dbErr) {
                console.error('DB delete error (file_uploads):', dbErr);
            }
        }

        return json({ success: true });
    } catch (e: any) {
        console.error('Delete file error', e);
        throw error(e.status || 500, e.message || 'Failed to delete file');
    }
};


