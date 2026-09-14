-- Same pattern as 0007_topic_depth.sql: the "Choose your learning scope"
-- dropdown already renders every topic scoped to the chosen technology with
-- no truncation, so a thin catalogue reads as "missing content" even though
-- nothing in the UI is hiding it. This fills the most visible gaps flagged
-- during a review of the dashboard's technology dropdown: JavaScript and
-- TypeScript had no dedicated classes topic (properties/methods/inheritance),
-- and neither TypeScript nor Java covered interfaces at all.
insert into public.topics(id,technology_id,title,title_hi,full_track,"references") values
  ('js-classes','javascript','Classes, properties and methods','क्लास, properties और methods',false,'["https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes"]'),
  ('ts-classes','typescript','Classes, properties and methods','क्लास, properties और methods',false,'["https://www.typescriptlang.org/docs/handbook/2/classes.html"]'),
  ('ts-interfaces','typescript','Interfaces and type contracts','Interfaces और type contracts',false,'["https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#interfaces"]'),
  ('java-interfaces','java','Interfaces and abstract classes','Interfaces और abstract classes',false,'["https://docs.oracle.com/javase/tutorial/java/IandI/createinterface.html"]')
on conflict(id) do update set technology_id=excluded.technology_id,title=excluded.title,title_hi=excluded.title_hi,full_track=excluded.full_track,"references"=excluded."references";
