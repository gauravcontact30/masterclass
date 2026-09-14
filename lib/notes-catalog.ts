import type { Technology, Topic } from "./domain";

// These built-in guides are seeded without waiting for catalog migrations.
export const BUILTIN_NOTES_TECHNOLOGIES: Technology[] = [
  { id: "nestjs", title: "Nest JS", title_hi: "Nest JS", category: "Web development" },
  { id: "redux", title: "Redux", title_hi: "Redux", category: "web" },
  { id: "redux-toolkit", title: "Redux Toolkit", title_hi: "Redux Toolkit", category: "web" },
];
export const BUILTIN_NOTES_TOPICS: Topic[] = [
  { id: "nestjs-full", technology_id: "nestjs", title: "Complete Nest JS path", title_hi: "Complete Nest JS path", full_track: true, version: 2, references: ["https://docs.nestjs.com/"] },
  { id: "redux-full", technology_id: "redux", title: "Redux: state, actions, reducers and React", title_hi: "Redux: स्टेट, ऐक्शन, रिड्यूसर और React", full_track: true, version: 1, references: ["https://redux.js.org/tutorials/fundamentals/part-1-overview", "https://react-redux.js.org/api/hooks"] },
  { id: "redux-toolkit-full", technology_id: "redux-toolkit", title: "Redux Toolkit: slices, async workflows and RTK Query", title_hi: "Redux Toolkit: स्लाइस, एसिंक वर्कफ़्लो और RTK Query", full_track: true, version: 1, references: ["https://redux-toolkit.js.org/introduction/getting-started", "https://redux-toolkit.js.org/rtk-query/overview"] },
];
