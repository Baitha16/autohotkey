do $$ begin
  if not exists (select 1 from pg_type where typname = 'license_status') then
    create type license_status as enum ('active', 'expired', 'suspended');
  end if;
end $$;

create table if not exists licenses (
  id bigint generated always as identity primary key,
  license_code text not null unique,
  membership_type text not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  last_used_at timestamptz,
  status license_status not null default 'active'
);

create index if not exists idx_licenses_license_code on licenses (license_code);
create index if not exists idx_licenses_status on licenses (status);
