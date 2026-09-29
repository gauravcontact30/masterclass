import type { AwsHighlight } from "../aws-highlights";
import { forClass } from "./maths";

/**
 * English is organised by skill rather than by prescribed text.
 *
 * Board prescriptions change between CBSE, ICSE and state boards and between
 * years, so a card naming a particular poem would go stale and would be wrong
 * for most readers. Grammar, writing and reading skills are common to every
 * board at a given class, so those are what these cards teach.
 */
export const ENGLISH_6: AwsHighlight[] = forClass("Class 6", [
  ["Grammar Foundations", [
    ["Nouns and their kinds", "Sort common, proper, collective and abstract nouns."],
    ["Pronouns", "Replace nouns correctly with personal, possessive and reflexive pronouns."],
    ["Verbs: action and being", "Identify the verb and what it tells you about the subject."],
    ["Adjectives", "Describe nouns and use degrees of comparison."],
    ["Adverbs", "Modify verbs with manner, place, time and frequency."],
    ["Articles a, an and the", "Choose the right article from sound and definiteness."],
    ["Prepositions of place and time", "Use in, on, at and their companions accurately."],
    ["Conjunctions", "Join words and clauses with and, but, or and because."],
  ]],
  ["Sentence and Tense", [
    ["Subject and predicate", "Split any sentence into who it is about and what is said."],
    ["Kinds of sentences", "Use declarative, interrogative, imperative and exclamatory forms."],
    ["Simple present and present continuous", "Choose between habit and action in progress."],
    ["Simple past tense", "Form regular and irregular past forms."],
    ["Simple future tense", "Express future plans with will and going to."],
    ["Punctuation and capitals", "Apply full stop, comma, question mark and capital letters."],
  ]],
  ["Writing Skills", [
    ["Paragraph writing", "Build a topic sentence, supporting details and a closing line."],
    ["Informal letter", "Write to a friend or relative in the correct format."],
    ["Picture composition", "Describe a picture in ordered, connected sentences."],
    ["Story writing from an outline", "Expand given hints into a complete narrative."],
  ]],
  ["Reading and Vocabulary", [
    ["Unseen passage comprehension", "Locate explicit answers and infer simple meaning."],
    ["Synonyms and antonyms", "Build word pairs from context."],
    ["Dictionary skills", "Find meaning, spelling, part of speech and pronunciation."],
    ["Word formation with prefixes and suffixes", "Build new words from a common root."],
  ]],
]);

export const ENGLISH_7: AwsHighlight[] = forClass("Class 7", [
  ["Grammar", [
    ["Present perfect tense", "Link a past action to the present with has and have."],
    ["Past continuous and past perfect", "Sequence two past events correctly."],
    ["Modal verbs", "Express ability, permission, obligation and possibility."],
    ["Subject-verb agreement", "Match the verb to the number and person of the subject."],
    ["Degrees of comparison", "Form and use positive, comparative and superlative."],
    ["Determiners", "Use quantifiers such as some, any, much, many and few."],
  ]],
  ["Sentence Transformation", [
    ["Active and passive voice", "Convert between the two without changing meaning."],
    ["Direct and indirect speech", "Report statements, questions and commands."],
    ["Phrases and clauses", "Tell apart a group of words with and without a finite verb."],
    ["Types of clauses", "Identify main and subordinate clauses."],
  ]],
  ["Writing Skills", [
    ["Formal letter", "Write an application or complaint in the correct format."],
    ["Notice writing", "Fit purpose, date, venue and signature into a box."],
    ["Diary entry", "Record an experience with date, feeling and reflection."],
    ["Dialogue writing", "Write a natural exchange with correct punctuation."],
  ]],
  ["Reading and Vocabulary", [
    ["Comprehension with inference", "Answer questions that require reading between the lines."],
    ["Homophones and homonyms", "Distinguish words that sound or look alike."],
    ["Idioms and phrases", "Use common idioms in context."],
    ["One-word substitution", "Replace a phrase with a single precise word."],
  ]],
]);

export const ENGLISH_8: AwsHighlight[] = forClass("Class 8", [
  ["Grammar", [
    ["All twelve tenses", "Map every tense to the time and aspect it expresses."],
    ["Non-finite verbs", "Use infinitives, gerunds and participles correctly."],
    ["Conditional sentences", "Form zero, first and second conditionals."],
    ["Relative clauses", "Join sentences with who, which, whose and that."],
    ["Prepositional phrases", "Use fixed verb and adjective collocations."],
    ["Common errors in English", "Correct the errors that native-like usage avoids."],
  ]],
  ["Writing Skills", [
    ["Article writing", "Structure an opinion piece with a title, body and conclusion."],
    ["Report writing", "Report an event factually in the third person."],
    ["Message and email", "Write concise messages and well-formatted email."],
    ["Descriptive writing", "Describe a person, place or process vividly."],
  ]],
  ["Reading Skills", [
    ["Factual passage comprehension", "Extract data and detail from informational text."],
    ["Discursive passage comprehension", "Follow an argument and identify the writer's stance."],
    ["Note making and summarising", "Condense a passage into headings and sub-points."],
  ]],
  ["Vocabulary", [
    ["Phrasal verbs", "Learn verb-particle combinations and their meanings."],
    ["Collocations", "Use word partnerships that sound natural."],
    ["Word roots from Latin and Greek", "Infer meaning from common roots."],
  ]],
]);

export const ENGLISH_9: AwsHighlight[] = forClass("Class 9", [
  ["Grammar", [
    ["Tenses in context", "Choose tense from the time reference in a passage."],
    ["Modals for advice and speculation", "Use should, must, might and could precisely."],
    ["Subject-verb concord rules", "Apply concord to collective nouns and compound subjects."],
    ["Reported speech", "Shift tense, pronoun and time reference correctly."],
    ["Determiners and quantifiers", "Choose the right determiner for countable and uncountable nouns."],
    ["Gap filling and editing", "Spot and correct errors in a continuous passage."],
  ]],
  ["Writing Skills", [
    ["Descriptive paragraph", "Write 100-120 words with sensory detail and structure."],
    ["Story completion", "Continue a given opening into a coherent story with a climax."],
    ["Diary entry and letter", "Write reflective and transactional pieces to format."],
    ["Speech and debate writing", "Open with an address, argue a stance and close persuasively."],
  ]],
  ["Reading Skills", [
    ["Discursive and literary passages", "Answer MCQ and short-answer questions on tone and purpose."],
    ["Inference and vocabulary in context", "Deduce word meaning from surrounding text."],
    ["Summary writing", "Reduce a passage to a third of its length without losing sense."],
  ]],
  ["Literature Skills", [
    ["Prose: theme and character", "Analyse motive, conflict and change in a character."],
    ["Poetry: figures of speech", "Identify simile, metaphor, personification and alliteration."],
    ["Poetic devices and rhyme scheme", "Mark rhyme scheme and describe rhythm."],
    ["Extract-based questions", "Answer context questions from a short quoted passage."],
  ]],
]);

export const ENGLISH_10: AwsHighlight[] = forClass("Class 10", [
  ["Grammar", [
    ["Tenses in editing tasks", "Correct tense errors in an exam-style passage."],
    ["Modals in formal writing", "Choose modals appropriate to register."],
    ["Subject-verb agreement traps", "Handle intervening phrases and inverted sentences."],
    ["Reported speech in paragraphs", "Convert extended dialogue into reported form."],
    ["Determiners in context", "Complete a passage with the correct determiners."],
    ["Sentence reordering and transformation", "Rearrange jumbled words into correct sentences."],
  ]],
  ["Writing Skills", [
    ["Formal letter: complaint and enquiry", "Write to an editor or an official in full format."],
    ["Letter of order and placing requests", "Use precise specifications and courteous register."],
    ["Analytical paragraph", "Interpret a chart, map or table in continuous prose."],
    ["Article and report writing", "Write 100-120 words to the prescribed structure."],
  ]],
  ["Reading Skills", [
    ["Discursive passage", "Answer objective questions on a 400-450 word passage."],
    ["Case-based factual passage", "Read graphs, tables and figures embedded in text."],
    ["Vocabulary from the passage", "Infer meanings and identify synonyms in context."],
  ]],
  ["Literature Skills", [
    ["Theme and message in prose", "State the central idea and support it with evidence."],
    ["Characterisation", "Trace how a writer builds a character indirectly."],
    ["Poetic devices", "Identify and explain the effect of each device used."],
    ["Long answer: value-based questions", "Argue a judgement about a character or theme."],
    ["Extract-based comprehension", "Answer inference questions on a short extract."],
  ]],
]);

export const ENGLISH_11: AwsHighlight[] = forClass("Class 11", [
  ["Reading Skills", [
    ["Factual and descriptive passages", "Answer comprehension on 800-900 word passages."],
    ["Note making", "Abbreviate, use a consistent format and supply a key."],
    ["Summary writing", "Write a connected summary from your own notes."],
    ["Inference, tone and attitude", "Identify the writer's purpose and stance."],
  ]],
  ["Writing Skills", [
    ["Notice, poster and advertisement", "Write concise display material to format."],
    ["Classified and display advertisements", "Distinguish the two and write both."],
    ["Letters to the editor", "Raise a public issue with argument and a call to action."],
    ["Job application and résumé", "Write a covering letter with a structured CV."],
    ["Speech, debate and article", "Write extended discursive pieces with clear structure."],
  ]],
  ["Grammar", [
    ["Error correction", "Find and fix one error per line in a passage."],
    ["Gap filling with tense and modals", "Complete passages with grammatically correct forms."],
    ["Sentence transformation", "Convert between simple, compound and complex sentences."],
    ["Reported speech in extended text", "Report a whole conversation accurately."],
  ]],
  ["Literature Skills", [
    ["Prose analysis", "Analyse narrative technique, setting and theme."],
    ["Poetry appreciation", "Comment on imagery, diction and structure."],
    ["Drama and dialogue", "Analyse conflict, stagecraft and characterisation."],
    ["Critical appreciation", "Write an evaluative response with textual evidence."],
  ]],
]);

export const ENGLISH_12: AwsHighlight[] = forClass("Class 12", [
  ["Reading Skills", [
    ["Unseen discursive passage", "Answer objective and short-answer questions accurately."],
    ["Case-based factual passage", "Interpret data-rich text with visual elements."],
    ["Note making and summarising", "Produce notes with headings, sub-headings and abbreviations."],
    ["Critical inference", "Evaluate argument, bias and implication."],
  ]],
  ["Writing Skills", [
    ["Notice writing", "Write a 50-word notice with all required elements."],
    ["Formal and informal invitations and replies", "Use the correct third-person and personal formats."],
    ["Letter to the editor and official letters", "Write 120-150 word letters to full format."],
    ["Job application with résumé", "Write a targeted application and structured CV."],
    ["Article, report and speech writing", "Write 120-150 word discursive pieces."],
  ]],
  ["Grammar", [
    ["Editing and omission", "Correct errors and supply missing words in a passage."],
    ["Tense and modal accuracy", "Apply precise tense and modal choice in formal writing."],
    ["Re-ordering and transformation", "Restructure sentences without changing meaning."],
    ["Determiners, prepositions and articles", "Complete passages with grammatically correct function words."],
  ]],
  ["Literature Skills", [
    ["Prose: theme, plot and narrative voice", "Analyse how the story is told and why it matters."],
    ["Characterisation and relationships", "Trace development and interaction between characters."],
    ["Poetry: imagery and symbolism", "Explain how images build meaning."],
    ["Poetic devices and form", "Comment on form, rhythm and sound patterning."],
    ["Long answer: value and theme", "Argue an interpretation supported by the text."],
    ["Extract-based questions", "Answer close-reading questions on a quoted passage."],
  ]],
]);

export const ENGLISH = [...ENGLISH_6, ...ENGLISH_7, ...ENGLISH_8, ...ENGLISH_9, ...ENGLISH_10, ...ENGLISH_11, ...ENGLISH_12];
