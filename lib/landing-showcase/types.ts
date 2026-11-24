/*
 * The three showcase sections right under the landing slider (components/landing-showcase*.tsx): Tech, Board Exams and
 * Government Job Exams. Each pairs an autoplay picture carousel with a panel of sample papers and questions with
 * answers. The copy is written for the landing page and kept small: the full banks (lib/board-exams,
 * lib/competitive-exams, lib/interview-bank) stay in the dashboards' chunks and are never loaded here.
 * Star ratings are editorial (how regularly a question type comes up), never an official count.
 */
export type Stars = 3 | 4 | 5;

/**
 * One carousel slide with the section's own copy over it. `image` may be a painted picture from the learning-images
 * bucket; `fallback` is the local picture shown if that one is missing or fails to load.
 */
export type ShowcaseSlide = { id: string; image: string; fallback?: string; alt: string; focus?: string; kicker: string; title: string; text: string; facts: string[]; logo?: string };

/** A multiple-choice question with its answer and the reason. */
export type Choice = { q: string; options: string[]; correct: number; why: string; stars: Stars; topic: string };

/** A written or interview question with its model answer, one point per line. */
export type Written = { q: string; points: string[]; stars: Stars; tag: string };
