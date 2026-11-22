-- جداول قاعدة بيانات الموقع الصوتي الإسلامي على Supabase (مجاني)
-- انسخ هذا الملف والصقه في SQL Editor داخل مشروعك في Supabase ثم اضغط Run

create table if not exists public.site_settings (
  id text primary key default 'main',
  site_name text not null default 'مكتبة الداعية فاطمة',
  sheikh_name text not null default 'الداعية فاطمة',
  sheikh_title text not null default 'الدروس العلمية والمحاضرات الصوتية',
  bio text not null default 'موقع مخصص لنشر الدروس العلمية والمحاضرات الصوتية للداعية فاطمة بصيغة ميسّرة للاستماع والتحميل المجاني.',
  telegram_url text default '',
  youtube_url text default '',
  whatsapp_url text default '',
  updated_at timestamptz not null default now()
);

create table if not exists public.series (
  id text primary key,
  title text not null,
  slug text not null unique,
  category text not null default 'عقيدة',
  description text not null default '',
  status text not null default 'ongoing' check (status in ('ongoing', 'completed')),
  cover_accent text not null default 'emerald',
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.lessons (
  id text primary key,
  title text not null,
  series_id text references public.series(id) on delete set null,
  episode_number integer,
  category text not null default 'عام',
  description text not null default '',
  notes text not null default '',
  audio_url text not null,
  archive_identifier text default '',
  duration_seconds integer not null default 0,
  published_at text not null,
  plays_count integer not null default 0,
  is_featured boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.admin_users (
  id text primary key,
  username text not null unique,
  display_name text not null,
  password_hash text not null,
  role text not null default 'admin' check (role in ('owner', 'admin')),
  permissions jsonb not null default '[]'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  last_active_at timestamptz
);

-- فهارس لتسريع البحث والفرز
create index if not exists idx_lessons_series_id on public.lessons(series_id);
create index if not exists idx_lessons_category on public.lessons(category);
create index if not exists idx_lessons_published_at on public.lessons(published_at desc);

-- تفعيل الحماية (Row Level Security): القراءة عامة للزوار، والكتابة عبر خادم Next.js فقط (Service Role)
alter table public.site_settings enable row level security;
alter table public.series enable row level security;
alter table public.lessons enable row level security;

drop policy if exists "Public read site_settings" on public.site_settings;
create policy "Public read site_settings" on public.site_settings for select using (true);

drop policy if exists "Public read series" on public.series;
create policy "Public read series" on public.series for select using (true);

drop policy if exists "Public read lessons" on public.lessons;
create policy "Public read lessons" on public.lessons for select using (true);

-- بيانات مبدئية لإعدادات الموقع
insert into public.site_settings (id) values ('main') on conflict (id) do nothing;
