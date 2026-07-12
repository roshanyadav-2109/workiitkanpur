-- 0008_carousel.sql
-- Image banners for the subject-page carousel. Each row is one framed image
-- slide with an optional link target, so the carousel content (and where each
-- slide points) is managed from the database, no redeploy needed. Safe to re-run.

create table if not exists public.carousel_banners (
  id uuid primary key default gen_random_uuid(),
  image_url text not null,
  href text,
  alt text,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.carousel_banners enable row level security;

-- Public marketing content: anyone may read the active slides.
drop policy if exists carousel_public_read on public.carousel_banners;
create policy carousel_public_read
  on public.carousel_banners
  for select
  using (is_active);

grant select on public.carousel_banners to anon, authenticated;
