-- Migration: add file_uploads and quotes tables

-- FILE UPLOADS TABLE
-- Stores R2 object keys for each job with optional description
create table if not exists file_uploads (
    id uuid primary key default gen_random_uuid(),
    jobnumber text not null references jobsfile(jobnumber) on delete cascade,
    r2_key text not null,
    description text,
    created_at timestamptz not null default now()
);

create index if not exists idx_file_uploads_jobnumber on file_uploads(jobnumber);

-- QUOTES TABLE (modeled after billing table)
-- Mirrors columns of billing: id, jobnumber, chargecode, charge, created_at
create table if not exists quotes (
    id serial primary key,
    jobnumber text not null references jobsfile(jobnumber) on delete cascade,
    chargecode text,
    charge decimal,
    created_at timestamptz default now()
);

create index if not exists idx_quotes_jobnumber on quotes(jobnumber);

-- Enable RLS
alter table file_uploads enable row level security;
alter table quotes enable row level security;

-- Policies: allow users who can see a job to CRUD related records
-- File uploads policies
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

-- Quotes policies (same visibility model as billing)
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


