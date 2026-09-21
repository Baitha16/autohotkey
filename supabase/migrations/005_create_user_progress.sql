create table if not exists user_progress (
  id bigint generated always as identity primary key,
  license_code text not null unique,
  progress jsonb not null default '{}'::jsonb,
  marked_words jsonb not null default '{}'::jsonb,
  bunpou_understand jsonb not null default '{}'::jsonb,
  completed_levels jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_user_progress_license_code on user_progress (license_code);
