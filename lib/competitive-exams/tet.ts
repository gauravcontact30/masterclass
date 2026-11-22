import { obj, pack, sub } from "./types";
import { TET_OBJECTIVE, TET_SUBJECTIVE } from "./tet-more";

/* Teacher Eligibility Tests: CTET, UPTET and other state TETs. The papers are objective; the subjective set is pedagogy revision and interview questions. */
export default pack("tet", [
  obj("Child Development", 5, "CTET 2016, CTET 2019, UPTET 2021", "According to Piaget, a child in the concrete operational stage is usually aged", ["0 to 2 years", "2 to 7 years", "7 to 11 years", "11 years and above"], 2, "Piaget's stages: sensorimotor (0 to 2), pre-operational (2 to 7), concrete operational (7 to 11), formal operational (11+)."),
  obj("Child Development", 5, "CTET 2018, CTET 2021, UPTET 2019", "The 'Zone of Proximal Development' was proposed by", ["Jean Piaget", "Lev Vygotsky", "Lawrence Kohlberg", "B. F. Skinner"], 1, "Vygotsky defined it as the gap between what a child can do alone and what the child can do with help."),
  obj("Child Development", 5, "CTET 2015, CTET 2020", "Howard Gardner is associated with the theory of", ["operant conditioning", "moral development", "multiple intelligences", "psychosexual development"], 2, "Gardner (1983) described several distinct intelligences, such as linguistic, logical-mathematical and musical."),
  obj("Child Development", 4, "CTET 2019, UPTET 2018", "How many stages of moral development did Kohlberg describe?", ["Three", "Four", "Six", "Eight"], 2, "Six stages grouped into three levels: pre-conventional, conventional and post-conventional."),
  obj("Pedagogy", 5, "CTET 2018, CTET 2022", "Continuous and Comprehensive Evaluation emphasises", ["only year-end written tests", "assessment of scholastic and co-scholastic areas throughout the year", "ranking learners by marks", "homework alone"], 1, "'Continuous' is regular assessment; 'comprehensive' covers both scholastic and co-scholastic growth."),
  obj("Pedagogy", 4, "CTET 2016, UPTET 2020", "Under the Right to Education Act, 2009, free and compulsory education is guaranteed to children aged", ["3 to 10 years", "5 to 12 years", "6 to 14 years", "6 to 18 years"], 2, "The Act gives effect to Article 21A for children of 6 to 14 years."),
  obj("Pedagogy", 4, "CTET 2019, CTET 2021", "Assessment for learning is also called", ["summative assessment", "formative assessment", "norm-referenced assessment", "placement assessment"], 1, "Formative assessment happens during teaching and feeds back into it."),
  obj("Language Pedagogy", 4, "CTET 2018, CTET 2022", "The natural order of acquiring language skills is", ["reading, writing, listening, speaking", "listening, speaking, reading, writing", "speaking, listening, writing, reading", "writing, reading, speaking, listening"], 1, "LSRW: listening and speaking come before reading and writing."),
  obj("Mathematics Pedagogy", 4, "CTET 2016, CTET 2020", "According to the van Hiele theory, the first level of geometric thinking is", ["analysis", "visualisation", "deduction", "rigour"], 1, "Levels: visualisation, analysis, informal deduction, formal deduction and rigour."),
  obj("Environmental Studies", 4, "CTET 2019, UPTET 2021", "EVS at the primary stage, as recommended by NCF 2005, should be taught", ["as separate science and social science", "in an integrated manner", "only through the textbook", "through lectures"], 1, "NCF 2005 treats EVS in classes 3 to 5 as an integrated subject built around themes from the child's surroundings."),
  obj("Child Development", 4, "CTET 2018, CTET 2021", "Dyslexia is associated mainly with difficulty in", ["reading", "calculation", "motor coordination", "hearing"], 0, "Dyslexia affects reading; dyscalculia affects arithmetic and dysgraphia affects writing."),
  obj("Child Development", 3, "CTET 2016, UPTET 2019", "Which of these is a principle of child development?", ["Development proceeds from specific to general", "Development is the same for every child", "Development proceeds from head to toe", "Development stops at adolescence"], 2, "The cephalocaudal principle: development moves from head to toe; it also moves from general to specific."),
  obj("Child Development", 4, "CTET 2016, UPTET 2019", "The 'law of effect' in learning was given by", ["Pavlov", "Thorndike", "Kohler", "Bandura"], 1, "Thorndike's trial-and-error theory gives the laws of readiness, exercise and effect."),
  obj("Child Development", 4, "CTET 2018, CTET 2021", "Operant conditioning is associated with", ["Ivan Pavlov", "B. F. Skinner", "Jean Piaget", "Jerome Bruner"], 1, "Skinner showed that behaviour is shaped by reinforcement; Pavlov gave classical conditioning."),
  obj("Pedagogy", 4, "CTET 2021, CTET 2023", "The school structure recommended by the National Education Policy 2020 is", ["10 + 2", "5 + 3 + 3 + 4", "8 + 4", "5 + 5 + 2"], 1, "Foundational (5 years), preparatory (3), middle (3) and secondary (4)."),
  ...TET_OBJECTIVE,
], [
  sub("Child Development", 5, "CTET and state TET, asked almost every cycle", "Explain Piaget's four stages of cognitive development.", [
    "Sensorimotor (birth to 2): learning through senses and actions; object permanence develops.",
    "Pre-operational (2 to 7): language and symbolic play; thinking is egocentric and lacks conservation.",
    "Concrete operational (7 to 11): logical thought about concrete objects; conservation, classification and reversibility.",
    "Formal operational (11 onwards): abstract and hypothetical reasoning.",
    "Classroom use: give hands-on material before abstract rules.",
  ]),
  sub("Child Development", 5, "CTET 2018 to 2022", "What is the Zone of Proximal Development, and what is scaffolding?", [
    "ZPD (Vygotsky): the gap between what a learner can do alone and what the learner can do with guidance.",
    "Scaffolding: temporary support from a teacher or peer, such as hints, prompts and worked examples.",
    "The support is withdrawn step by step as the learner gains control.",
    "Implication: group work and peer tutoring, with tasks set just above the present level.",
  ]),
  sub("Pedagogy", 4, "CTET 2016 to 2021", "Differentiate between assessment of learning, assessment for learning and assessment as learning.", [
    "Assessment of learning: summative, at the end of a unit or term, to grade and certify.",
    "Assessment for learning: formative, during teaching, to find gaps and adjust instruction.",
    "Assessment as learning: learners assess themselves and reflect on how they learn.",
    "A balanced classroom uses all three, with the weight on formative assessment.",
  ]),
  sub("Pedagogy", 4, "CTET 2015 to 2022", "What is inclusive education? How would you include a child with special needs in your class?", [
    "Inclusive education teaches all children, including those with disabilities, together in the regular classroom.",
    "Legal basis: the RTE Act, 2009 and the Rights of Persons with Disabilities Act, 2016.",
    "Adapt the teaching: seating, large print, extra time, peer buddy and multi-sensory material.",
    "Adapt assessment, not expectations of dignity: oral answers, a scribe or alternate tasks.",
    "Work with parents and the special educator through an individual plan.",
  ]),
  sub("Pedagogy", 4, "CTET 2014 to 2021", "State the guiding principles of the National Curriculum Framework 2005.", [
    "Connect knowledge to life outside the school.",
    "Shift learning away from rote methods.",
    "Enrich the curriculum beyond textbooks.",
    "Make examinations flexible and integrated with classroom life.",
    "Nurture an identity informed by caring concerns within a democratic polity.",
  ]),
  sub("Interview", 3, "State teacher recruitment interviews", "How would you handle a class in which children learn at very different speeds?", [
    "Find each child's level first with a short diagnostic activity.",
    "Teach the core idea to all, then give graded tasks: support, practice and extension.",
    "Use mixed-ability pairs so quicker learners explain and consolidate.",
    "Give slower learners more time and concrete material, never a label.",
    "Track progress against the child's own earlier work.",
  ]),
  sub("Child Development", 4, "CTET and UPTET 2016 to 2022", "Explain Kohlberg's stages of moral development.", [
    "Pre-conventional level: stage 1, obedience to avoid punishment; stage 2, acting for one's own reward.",
    "Conventional level: stage 3, being a 'good boy or good girl' to win approval; stage 4, respect for law and order.",
    "Post-conventional level: stage 5, social contract and individual rights; stage 6, universal ethical principles.",
    "Most primary-school children reason at the pre-conventional or early conventional level.",
  ]),
  sub("Pedagogy", 4, "CTET 2015 to 2022", "What is constructivism? What does it mean for the classroom?", [
    "Learners build their own knowledge from experience instead of receiving it ready-made.",
    "Piaget stressed individual construction; Vygotsky stressed construction through social interaction.",
    "The teacher is a facilitator who sets tasks, asks questions and uses the child's earlier knowledge.",
    "Methods: activities, projects, discussion and group work.",
    "Errors are treated as a window into the child's thinking.",
  ]),
  ...TET_SUBJECTIVE,
]);
