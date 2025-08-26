-- Purpose: Ensure file_uploads and quotes match types, reference jobsfile.jobnumber, and (re)apply RLS
-- Safe to run multiple times (idempotent where possible)

begin;

-- 1) Ensure file_uploads table (and FK to jobsfile.jobnumber)
create table if not exists file_uploads (
  id uuid primary key default gen_random_uuid(),
  jobnumber text not null,
  r2_key text not null,
  file_name text,
  content_type text,
  size_bytes bigint,
  description text,
  created_at timestamptz not null default now(),
  constraint file_uploads_jobnumber_fkey foreign key (jobnumber)
    references jobsfile(jobnumber) on delete cascade
);

create index if not exists idx_file_uploads_jobnumber on file_uploads(jobnumber);

-- 2) Ensure quotes table exists and linked to jobnumber
create table if not exists quotes (
  id serial primary key,
  jobnumber text not null references jobsfile(jobnumber) on delete cascade,
  chargecode text,
  charge decimal,
  created_at timestamptz default now()
);

create index if not exists idx_quotes_jobnumber on quotes(jobnumber);

-- 3) Enable RLS and (re)apply policies using existing get_current_user_role() and user_table
alter table file_uploads enable row level security;
alter table quotes enable row level security;

-- File uploads policies (visibility consistent with jobs access)
drop policy if exists file_uploads_select on file_uploads;
drop policy if exists file_uploads_insert on file_uploads;
drop policy if exists file_uploads_update on file_uploads;
drop policy if exists file_uploads_delete on file_uploads;

create policy file_uploads_select on file_uploads
  for select using (
    exists (
      select 1 from jobsfile j
      where j.jobnumber = file_uploads.jobnumber
      and (
        get_current_user_role() in ('Admin','Management','Operations') or
        (
          get_current_user_role() = 'Customer' and exists (
            select 1 from user_table ut
            where ut.user_id = auth.uid() and ut.customer_id = j.customer_id
          )
        ) or (
          get_current_user_role() = 'LSP' and exists (
            select 1 from user_table ut join lsps l on ut.lsp_id = l.id
            where ut.user_id = auth.uid() and l.vendor_code = j.vendorcode
          )
        )
      )
    )
  );

create policy file_uploads_insert on file_uploads
  for insert with check (
    exists (
      select 1 from jobsfile j
      where j.jobnumber = file_uploads.jobnumber
      and (
        get_current_user_role() in ('Admin','Management','Operations') or
        (
          get_current_user_role() = 'Customer' and exists (
            select 1 from user_table ut
            where ut.user_id = auth.uid() and ut.customer_id = j.customer_id
          )
        )
      )
    )
  );

create policy file_uploads_update on file_uploads
  for update using (
    get_current_user_role() in ('Admin','Management','Operations')
  );

create policy file_uploads_delete on file_uploads
  for delete using (
    get_current_user_role() in ('Admin','Management','Operations')
  );

-- Quotes policies (mirror billing visibility)
drop policy if exists quotes_select on quotes;
drop policy if exists quotes_insert on quotes;
drop policy if exists quotes_update on quotes;
drop policy if exists quotes_delete on quotes;

create policy quotes_select on quotes
  for select using (
    exists (
      select 1 from jobsfile j
      where j.jobnumber = quotes.jobnumber
      and (
        get_current_user_role() in ('Admin','Management','Operations') or
        (
          get_current_user_role() = 'Customer' and exists (
            select 1 from user_table ut
            where ut.user_id = auth.uid() and ut.customer_id = j.customer_id
          )
        ) or (
          get_current_user_role() = 'LSP' and exists (
            select 1 from user_table ut join lsps l on ut.lsp_id = l.id
            where ut.user_id = auth.uid() and l.vendor_code = j.vendorcode
          )
        )
      )
    )
  );

create policy quotes_insert on quotes
  for insert with check (
    exists (
      select 1 from jobsfile j
      where j.jobnumber = quotes.jobnumber
      and (
        get_current_user_role() in ('Admin','Management','Operations') or
        (
          get_current_user_role() = 'Customer' and exists (
            select 1 from user_table ut
            where ut.user_id = auth.uid() and ut.customer_id = j.customer_id
          )
        )
      )
    )
  );

create policy quotes_update on quotes
  for update using (
    get_current_user_role() in ('Admin','Management','Operations')
  );

create policy quotes_delete on quotes
  for delete using (
    get_current_user_role() in ('Admin','Management','Operations')
  );

commit;


