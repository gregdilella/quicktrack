-- Create file_uploads table to track R2 objects associated with jobs
create table if not exists file_uploads (
    id uuid primary key default gen_random_uuid(),
    jobno text not null references jobsfile(jobno) on delete cascade,
    r2_key text not null,
    file_name text not null,
    content_type text,
    size_bytes bigint,
    created_at timestamptz not null default now()
);

-- Helpful index for job scoping
create index if not exists idx_file_uploads_jobno on file_uploads(jobno);


