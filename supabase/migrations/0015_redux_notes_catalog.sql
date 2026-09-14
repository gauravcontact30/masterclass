-- Redux and Redux Toolkit have independent preparation choices and notes.
insert into technologies(id,title,title_hi,category) values
  ('redux','Redux','Redux','web'),
  ('redux-toolkit','Redux Toolkit','Redux Toolkit','web')
on conflict(id) do update set title=excluded.title,title_hi=excluded.title_hi,category=excluded.category;

insert into topics(id,technology_id,title,title_hi,full_track,"references") values
  ('redux-full','redux','Redux: state, actions, reducers and React','Redux: स्टेट, ऐक्शन, रिड्यूसर और React',true,'["https://redux.js.org/tutorials/fundamentals/part-1-overview","https://react-redux.js.org/api/hooks"]'),
  ('redux-toolkit-full','redux-toolkit','Redux Toolkit: slices, async workflows and RTK Query','Redux Toolkit: स्लाइस, एसिंक वर्कफ़्लो और RTK Query',true,'["https://redux-toolkit.js.org/introduction/getting-started","https://redux-toolkit.js.org/rtk-query/overview"]')
on conflict(id) do update set technology_id=excluded.technology_id,title=excluded.title,title_hi=excluded.title_hi,full_track=excluded.full_track,"references"=excluded."references";
