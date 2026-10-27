import type { CourseId, CourseMeta } from "./types";

/*
 * Course cards for the Learning dashboard and /learning/lessons. Only these few strings reach the client;
 * the topic content is loaded per request on the server by ./load.ts.
 */
export const DEEP_COURSES: CourseMeta[] = [
  { id: "core-java", name: "Core Java", glyph: "☕", tint: "#fdf1e7", blurb: "The language itself: types, OOP, exceptions, collections, generics, I/O and the JVM.", audience: "Students, freshers, OCP 17/21 aspirants", highlights: ["OOP pillars", "Collections", "Exceptions", "JVM memory"] },
  { id: "advanced-java", name: "Advanced Java", glyph: "🧩", tint: "#eef3fd", blurb: "Building server applications: JDBC, Servlets, JSP, sessions, filters, JPA/Hibernate and concurrency.", audience: "University Advanced Java papers, backend developers", highlights: ["JDBC", "Servlets & JSP", "Hibernate/JPA", "Concurrency"] },
  { id: "spring-boot", name: "Spring Boot", glyph: "🍃", tint: "#ecf7ee", blurb: "Production REST services: DI, auto-configuration, Web MVC, Data JPA, validation, security, testing and Actuator.", audience: "Java backend interviews, microservice teams", highlights: ["IoC & DI", "REST APIs", "Spring Data JPA", "Security & testing"] },
  { id: "cpp", name: "C++", glyph: "➕", tint: "#eef1fb", blurb: "From fundamentals to modern C++: pointers, classes, RAII, templates, the STL, move semantics and threads.", audience: "Engineering exams, competitive programmers, systems roles", highlights: ["Pointers & references", "OOP", "STL", "Smart pointers"] },
  { id: "dsa", name: "DSA", glyph: "🌳", tint: "#f4effb", blurb: "Data structures and algorithms with complexity analysis and interview patterns, coded in Java and C++.", audience: "Placement and FAANG-style coding rounds", highlights: ["Big-O", "Trees & graphs", "Dynamic programming", "Patterns"] },
  { id: "java-basic-to-advanced", name: "Java Basic to Advanced", glyph: "🚀", tint: "#fbf6e6", blurb: "One guided path from your first program to modern Java 21: records, streams, virtual threads, builds and tests.", audience: "Complete beginners who want to reach job-ready Java", highlights: ["Setup to OOP", "Streams & lambdas", "Modern Java 21", "Build, test, ship"] },
];

export const deepCourseMeta = (id: string) => DEEP_COURSES.find(course => course.id === id) as CourseMeta | undefined;
export const isCourseId = (id: string): id is CourseId => DEEP_COURSES.some(course => course.id === id);
export const deepCourseHref = (id: string, topic?: string) => `/learning/lessons/${id}${topic ? `/${topic}` : ""}`;
