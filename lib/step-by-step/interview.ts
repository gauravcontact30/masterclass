import type { GuideInterview, StepGuide } from './types';

/** Extract short points from existing guide content, preserving inline code. */
export function concisePoints(text: string): string[] {
  return text.split(/(?<=[.!?])\s+(?=[A-Z`])/).filter(Boolean).slice(0, 3);
}

/** Older saved answers also get practice drawn from their own authored content. */
export function interviewForGuide(guide: StepGuide): GuideInterview {
  if (guide.interview) return guide.interview;
  const features = guide.features;
  const subjective = [
    { question: guide.question, askRating: 5, answer: guide.answer,
      keyPoints: (guide.answerPoints.length ? guide.answerPoints : guide.keyPoints).slice(0, 4) },
    ...features.slice(0, 2).map(feature => ({
      question: `Explain ${feature.name} and its practical benefit.`, askRating: 4,
      answer: feature.detail, keyPoints: concisePoints(feature.detail),
    })),
  ];
  // Distractors describe other features in this same guide, rather than invented facts.
  const distinct = features.filter((feature, index) => features.findIndex(other => other.detail === feature.detail) === index);
  const objective = distinct.length >= 3 ? distinct.slice(0, 3).map((feature, index) => {
    const other = distinct.filter(item => item !== feature).slice(0, 3).map(item => item.detail);
    const correctIndex = (index + 1) % (other.length + 1);
    const options = [...other];
    options.splice(correctIndex, 0, feature.detail);
    return { question: `Which statement describes ${feature.name}?`, askRating: 4,
      answer: feature.detail, keyPoints: concisePoints(feature.detail), options, correctIndex };
  }) : [{
    question: 'Which step comes first in this guide’s implementation?', askRating: 3,
    options: [guide.steps[1].title, guide.steps[0].title],
    correctIndex: 1, answer: guide.steps[0].detail, keyPoints: guide.keyPoints.slice(0, 4),
  }];
  return { subjective, objective };
}
