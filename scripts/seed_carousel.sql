-- Seed a couple of starter banner slides. Replace image_url / href with your
-- own images and target routes (or manage rows directly in the table).
insert into public.carousel_banners (image_url, href, alt, sort_order, is_active)
select * from (values
  ('/demo-coding.png', '/app/subjects', 'Practice coding for OPPE', 0, true),
  ('/demo-coding.png', '/leaderboard', 'Climb the leaderboard', 1, true)
) as v(image_url, href, alt, sort_order, is_active)
where not exists (select 1 from public.carousel_banners);

select id, image_url, href, sort_order, is_active from public.carousel_banners order by sort_order;
