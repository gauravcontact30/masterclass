import { bank, imp, mcq, pack, solved, unsolved } from "./types";

/* Class 10 English: grammar and writing for all three boards; literature from First Flight (UP Board, CBSE) and Julius Caesar (ICSE). */
export default pack("x-english", [
  bank("Grammar: Tenses", "Fill in the blank: She ______ (live) in Lucknow since 2015.", "has lived (or has been living). 'Since' with a point of time takes the present perfect or present perfect continuous.", 1),
  bank("Grammar: Reported Speech", "Change into indirect speech: He said, \"I am reading a book.\"", "He said that he was reading a book. The pronoun changes to 'he' and the present continuous becomes past continuous.", 1),
  bank("Grammar: Voice", "Change into passive voice: The boys are playing cricket.", "Cricket is being played by the boys.", 1),
  bank("Grammar: Modals", "Fill in with a suitable modal: You ______ respect your elders.", "should (or must). 'Should' expresses advice or moral duty; 'must' a strong obligation.", 1),
  bank("Grammar: Subject-Verb Agreement", "Correct the sentence: Each of the boys have a pen.", "Each of the boys has a pen. 'Each' is singular and takes a singular verb.", 1),
  bank("Grammar: Determiners", "Fill in: There isn't ______ milk left in the jug.", "any. 'Any' is used in negative sentences and questions; 'some' in affirmative ones.", 1),
  bank("Literature: First Flight", "In 'A Letter to God', why did Lencho write a letter to God?", "A hailstorm destroyed his whole crop. With deep, simple faith that God sees everything, he asked God for a hundred pesos to sow his field again and live until the next harvest.", 2, "uc"),
  bank("Literature: First Flight", "What does Nelson Mandela mean by 'the twin obligations'?", "Every man has an obligation to his family (parents, wife and children) and an obligation to his people, community and country.", 2, "uc"),
  bank("Literature: Julius Caesar", "Why does Brutus join the conspiracy against Caesar?", "Not out of personal hatred but out of love for Rome. He fears that if Caesar is crowned he may become a tyrant, so he decides to prevent the danger before it grows.", 2, "i"),
  bank("Grammar: Transformation", "Rewrite using 'No sooner … than': As soon as the bell rang, the students ran out.", "No sooner did the bell ring than the students ran out.", 1, "i"),
  bank("Grammar: Voice", "Change into the passive voice: The teacher praised the boy.", "The boy was praised by the teacher.", 1),
  bank("Grammar: Reported Speech", "Change into indirect speech: He said, 'I am busy now.'", "He said that he was busy then.", 1),
  bank("Grammar: Prepositions", "Fill in the blank: He has been absent ____ Monday.", "since. 'Since' is used with a point of time and 'for' with a period of time.", 1),
  bank("Writing: Formal Letter", "What are the parts of a formal letter?", "Sender's address, date, receiver's designation and address, subject, salutation, body in three short paragraphs, complimentary close, and the sender's name and signature.", 2),
  imp("Writing: Formal Letter", 5, "Write a letter to the editor of a newspaper about the increasing noise pollution in your locality.", "A formal letter with a subject line and three paragraphs: problem, effects, request.", [
    "Sender's address and date, then 'The Editor', the newspaper's name and city.",
    "Subject: Increasing noise pollution in (name of locality).",
    "Paragraph 1: introduce yourself as a resident and state the problem: loudspeakers, horns and late-night processions.",
    "Paragraph 2: effects on students preparing for examinations, patients and the elderly.",
    "Paragraph 3: request the authorities, through the newspaper, to enforce the time limit on loudspeakers and no-horn zones near schools and hospitals.",
    "Close with 'Yours truly' and your name.",
  ], 5),

  imp("Writing: Formal Letter", 5, "Write a letter to the editor of a newspaper about the problem of water-logging in your locality.", "Follow the formal letter format: addresses, date, subject, salutation, three short paragraphs, formal close.", [
    "Sender's address, then the date on the next line.", "The Editor, name of the newspaper, city.",
    "Subject: Water-logging in (name of locality).", "Sir/Madam,",
    "Paragraph 1: State who you are and the problem in one or two sentences.",
    "Paragraph 2: Give details: blocked drains, dirty water on roads, mosquitoes, risk of dengue, trouble for school children and the elderly.",
    "Paragraph 3: Request action: cleaning of drains, repair of roads, regular spraying. Thank the editor for the space.",
    "Yours truly, followed by your name.",
  ], 5),
  imp("Writing: Analytical Paragraph", 4, "How do you write an analytical paragraph based on a bar graph or pie chart?", "Three parts: introduction, body with comparisons, conclusion. No personal opinion.", [
    "Introduction (1 or 2 sentences): say what the chart shows, with the source and period.",
    "Body: describe the highest and lowest figures, then compare trends using words such as 'whereas', 'in contrast', 'twice as many'.",
    "Use exact figures from the chart; do not add information that is not given.",
    "Conclusion (1 sentence): sum up the overall trend.",
    "Keep to 100–120 words, in the third person and the present or past tense as the data requires.",
  ], 5, "uc"),
  imp("Literature: First Flight", 5, "Describe the character of Lencho in 'A Letter to God'.", "A hard-working farmer with unshakeable, childlike faith in God, yet quick to doubt men.", [
    "Hard-working: he is called 'an ox of a man' who works like an animal in the fields.",
    "Deep faith: when the hail ruins his crop, he writes to God for a hundred pesos, certain of a reply.",
    "Innocent and simple: he posts a letter addressed only 'To God'.",
    "Ironic ending: receiving seventy pesos, he suspects the post office employees and calls them 'a bunch of crooks', never guessing they were his helpers.",
  ], 5, "uc"),
  imp("Literature: First Flight", 4, "What is the central idea of the poem 'Fire and Ice' by Robert Frost?", "Desire (fire) and hatred (ice) are both strong enough to destroy the world.", [
    "The poet considers two views on how the world will end: in fire or in ice.",
    "Fire stands for desire, greed and passion; ice for hatred, coldness and indifference.",
    "From his own experience of desire, he sides with fire, but adds that hatred is equally capable of destruction.",
    "Message: human emotions, if unchecked, can ruin humanity.",
  ], 3, "uc"),
  imp("Literature: Julius Caesar", 5, "Compare the funeral speeches of Brutus and Antony.", "Brutus appeals to reason in prose; Antony appeals to emotion in verse and wins the crowd.", [
    "Brutus speaks in measured prose and argues that he loved Caesar but loved Rome more; Caesar was ambitious.",
    "The crowd is satisfied for a moment, but Brutus leaves before Antony speaks, which is his error.",
    "Antony repeats 'Brutus is an honourable man' until the phrase turns into irony.",
    "He shows Caesar's wounded body and cloak and reads the will, moving the crowd from pity to rage.",
    "Result: the citizens turn against the conspirators and civil war begins.",
  ], 5, "i"),
  imp("Writing: Composition", 4, "Write a notice for your school notice board about an inter-house debate competition.", "A boxed notice: name of the school, the word NOTICE, date, heading, body with what, when, where and whom to contact, then signature.", [
    "Name of the school, in capitals, centred.", "NOTICE, centred; the date at the left; then a short heading.",
    "Body, in the third person: the event, date, time, venue and who may take part.",
    "Last date and the person to whom names should be given.",
    "Signature, name and designation of the person issuing it. Keep within 50 words.",
  ], 5),

  solved("Grammar: Reported Speech", "Change into indirect speech: The teacher said to me, \"Why are you late today?\"", "The teacher asked me why I was late that day.", [
    "The reporting verb 'said to' becomes 'asked' because it is a question.",
    "The question word 'why' is kept as the connector; no 'that' is used.",
    "The question order changes to statement order: 'are you' becomes 'I was'.",
    "'Today' changes to 'that day'.",
  ], 2),
  solved("Grammar: Voice", "Change into passive voice: Who wrote this letter?", "By whom was this letter written?", [
    "The object 'this letter' becomes the subject.",
    "'Who' changes to 'By whom'.",
    "The simple past 'wrote' becomes 'was written'.",
  ], 2),
  solved("Grammar: Synthesis", "Combine into one sentence: He is very weak. He cannot walk.", "He is too weak to walk. (or: He is so weak that he cannot walk.)", [
    "Use 'too … to' when the second sentence is negative.",
    "Remove 'very' and 'cannot'; put 'too' before the adjective and 'to' before the verb.",
  ], 2),

  unsolved("Grammar: Tenses", "Fill in: By the time we reached the station, the train ______ (leave).", "had left", "The earlier of two past actions takes the past perfect.", 1),
  unsolved("Grammar: Prepositions", "Fill in: He has been absent ______ Monday.", "since", "A point of time takes 'since'; a period of time takes 'for'.", 1),
  unsolved("Grammar: Reported Speech", "Change into indirect speech: Mother said, \"Do not waste water.\"", "Mother advised (or told) us not to waste water.", "A negative command becomes 'not to' followed by the verb.", 2),
  unsolved("Grammar: Editing", "Correct the sentence: One of my friend live in Delhi.", "One of my friends lives in Delhi.", "'One of' is followed by a plural noun and a singular verb.", 1),
  unsolved("Grammar: Transformation", "Rewrite beginning with 'Hardly': He had just sat down when the phone rang.", "Hardly had he sat down when the phone rang.", "After 'Hardly' the helping verb comes before the subject.", 2, "i"),
], [
  mcq("Grammar: Tenses", "I ______ my homework before the guests arrived.", ["finish", "have finished", "had finished", "was finishing"], 2, "The earlier past action takes the past perfect."),
  mcq("Grammar: Subject-Verb Agreement", "Neither the teacher nor the students ______ present.", ["was", "were", "is", "has"], 1, "With 'neither … nor', the verb agrees with the nearer subject, 'students'."),
  mcq("Grammar: Modals", "______ I borrow your pen, please?", ["Must", "May", "Should", "Would"], 1, "'May' is used to ask for permission politely."),
  mcq("Grammar: Voice", "The passive of 'They built this bridge in 1990' is", ["This bridge built in 1990.", "This bridge was built in 1990.", "This bridge is built in 1990.", "This bridge has built in 1990."], 1, "Simple past passive: was/were + past participle."),
  mcq("Grammar: Determiners", "She gave me ______ useful advice.", ["an", "many", "some", "few"], 2, "'Advice' is uncountable, so it takes 'some'."),
  mcq("Grammar: Prepositions", "He is good ______ mathematics.", ["in", "at", "on", "with"], 1, "The fixed expression is 'good at'."),
  mcq("Grammar: Reported Speech", "He said, \"I will come tomorrow.\" In indirect speech: He said that he ______ come the next day.", ["will", "would", "shall", "can"], 1, "'Will' changes to 'would' after a past reporting verb."),
  mcq("Literature: First Flight", "How much money did Lencho ask God for?", ["Seventy pesos", "A hundred pesos", "Thirty pesos", "A thousand pesos"], 1, "He asked for a hundred pesos and received seventy.", "uc"),
  mcq("Literature: First Flight", "In 'Fire and Ice', ice is a symbol of", ["love", "desire", "hatred", "peace"], 2, "Fire stands for desire and ice for hatred.", "uc"),
  mcq("Literature: Julius Caesar", "\"Friends, Romans, countrymen, lend me your ears\" is spoken by", ["Brutus", "Cassius", "Mark Antony", "Octavius"], 2, "It opens Antony's funeral oration.", "i"),
  mcq("Grammar: Conjunctions", "Work hard ______ you will fail.", ["and", "or", "but", "so"], 1, "'Or' introduces the result of not doing the first action."),
], [
  { title: "Reported speech: the changes", lines: [
    "Present simple → past simple; present continuous → past continuous; present perfect → past perfect.",
    "will → would, can → could, may → might, must → had to.",
    "now → then, today → that day, tomorrow → the next day, yesterday → the previous day, here → there, this → that.",
    "Statements take 'that'; questions take the question word or 'if/whether'; commands take 'to' + verb.",
  ] },
  { title: "Active to passive: the pattern", lines: [
    "Simple present: is/am/are + past participle. Simple past: was/were + past participle.",
    "Continuous: is/was being + past participle. Perfect: has/have/had been + past participle.",
    "Modals: modal + be + past participle (The work must be done).",
  ] },
  { title: "Writing formats", lines: [
    "Formal letter: sender's address, date, receiver's address, subject, salutation, body in three paragraphs, 'Yours faithfully/truly', name.",
    "Notice: school name, NOTICE, date, heading, body (what, when, where, who), signature with designation; about 50 words.",
    "Analytical paragraph: introduction, comparisons with figures, one-line conclusion; 100–120 words, no opinion.",
  ] },
]);
