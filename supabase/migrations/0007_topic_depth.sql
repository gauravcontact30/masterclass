-- The topic dropdown already renders every row scoped to the chosen
-- technology (components/generation-form.tsx filters with no slice/limit),
-- so nothing in the UI truncates the list. This migration widens the
-- catalogue itself for the two most-picked technologies so that "no topic
-- skipped" is backed by real depth, not just an unfiltered but short list.
insert into public.topics(id,technology_id,title,title_hi,full_track,"references") values
  ('react-forms','react','Forms and controlled inputs','Forms और controlled inputs',false,'["https://react.dev/reference/react-dom/components/input"]'),
  ('react-effects','react','Synchronizing with Effects','Effects से synchronize करना',false,'["https://react.dev/learn/synchronizing-with-effects"]'),
  ('react-context','react','Passing data with Context','Context से data पास करना',false,'["https://react.dev/learn/passing-data-deeply-with-context"]'),
  ('react-refs','react','Refs and the DOM','Refs और DOM',false,'["https://react.dev/learn/manipulating-the-dom-with-refs"]'),

  ('nextjs-images','nextjs','Image and font optimization','Image और font optimization',false,'["https://nextjs.org/docs/app/getting-started/images"]'),
  ('nextjs-metadata','nextjs','Metadata and SEO','Metadata और SEO',false,'["https://nextjs.org/docs/app/getting-started/metadata-and-og-images"]'),
  ('nextjs-middleware','nextjs','Middleware','Middleware',false,'["https://nextjs.org/docs/app/building-your-application/routing/middleware"]'),
  ('nextjs-caching','nextjs','Caching and revalidation','Caching और revalidation',false,'["https://nextjs.org/docs/app/deep-dive/caching"]')
on conflict(id) do update set technology_id=excluded.technology_id,title=excluded.title,title_hi=excluded.title_hi,full_track=excluded.full_track,"references"=excluded."references";
