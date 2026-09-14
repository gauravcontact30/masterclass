-- NestJS notes are also available through the built-in catalog before migration.
insert into technologies(id,title,title_hi,category) values
  ('nestjs','NestJS','NestJS','Web development')
on conflict(id) do update set title=excluded.title,title_hi=excluded.title_hi,category=excluded.category;

insert into topics(id,technology_id,title,title_hi,full_track,"references") values
  ('nestjs-full','nestjs','Complete NestJS path','Complete NestJS path',true,'["https://docs.nestjs.com/"]')
on conflict(id) do update set technology_id=excluded.technology_id,title=excluded.title,title_hi=excluded.title_hi,full_track=excluded.full_track,"references"=excluded."references";
