-- Preserve technology/topic IDs while matching the requested notes display name.
insert into technologies(id,title,title_hi,category) values
  ('nestjs','Nest JS','Nest JS','Web development')
on conflict(id) do update set title=excluded.title,title_hi=excluded.title_hi,category=excluded.category;

insert into topics(id,technology_id,title,title_hi,full_track,version,"references") values
  ('nestjs-full','nestjs','Complete Nest JS path','Complete Nest JS path',true,2,'["https://docs.nestjs.com/"]')
on conflict(id) do update set title=excluded.title,title_hi=excluded.title_hi,version=greatest(topics.version,excluded.version),"references"=excluded."references";
