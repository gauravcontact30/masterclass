/**
 * Extra key points for the "Explain this" answer.
 *
 * A catalogue topic carries one summary sentence, which is all a card has room
 * for. Opened as an answer, that sentence alone makes a thin "Worth
 * remembering" list, so each technology adds what stays true whichever of its
 * topics you opened: the mental model, the default that surprises people, the
 * failure everyone hits once.
 *
 * These are authored, not generated. A point earns its place by being something
 * a reader would otherwise learn from an incident — not by restating the topic
 * name at greater length.
 */
/**
 * Where a topic is used in real work, and the problem that use removes.
 *
 * `title` is the situation a reader would recognise — a named job, not a
 * restatement of the topic. `scenario` says what goes wrong without it, which
 * is what makes it a purpose rather than a description.
 */
export type TopicUseCase = { title: string; scenario: string };

export type TechnologyEssentials = {
  /** Handbook titles (and catalogue names) these points belong to, matched exactly. */
  technologies: string[];
  /** True across the whole technology. Shown for every topic in it. */
  points: string[];
  /** Keyed by the topic's category, added on top of `points` when it matches. */
  categories?: Record<string, string[]>;
  /** The real use behind this whole technology, for a topic with none of its own. */
  useCase?: TopicUseCase;
  /** The real use behind one category, preferred over the technology's own. */
  categoryUseCases?: Record<string, TopicUseCase>;
};
