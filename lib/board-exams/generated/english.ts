import type { ClassId } from "../types";
import { Bank, pick, rng, shuffle, type Generated } from "./util";

/*
 * English practice for board grammar and vocabulary sections, from hand-curated tables. The bank is shared by
 * Class 10 and Class 12 (their grammar syllabi overlap), shuffled differently for each class.
 */
/** Answers that mean nearly the same thing: never offered as a wrong option for one another. */
const GROUPS = [
  ["huge", "vast", "magnificent"], ["famous", "distinguished"], ["calm", "peaceful"], ["strong", "sturdy"], ["clear", "obvious", "bright"], ["quick", "fast"],
  ["kind", "warm", "friendly"], ["real", "genuine"], ["enough", "sufficient", "plentiful"], ["wise", "clever"], ["brave", "bravery"], ["decrease", "shrink"],
  ["old", "outdated"], ["enthusiasm", "passionate", "eager"], ["capable", "skilled"], ["danger", "unfriendly"], ["boring", "tiredness"], ["rare", "scarce"],
  ["defeat", "failure", "loss", "retreat"], ["late", "slow"], ["diligent", "busy"], ["merciful", "kind", "friendly", "humble"], ["cowardly", "timid", "diffident"],
  ["proud", "boastful"], ["invisible", "hidden", "opaque"], ["compulsory", "optional"], ["enemy", "hostile"], ["deny", "reject", "exclude"], ["modern", "urban"],
  ["present", "occupied"], ["strong", "superior"], ["joy", "victory"], ["minor", "inferior"], ["major", "superior", "maximum"],
];
const related = (a: string, b: string) => GROUPS.some(group => group.includes(a) && group.includes(b));
/** Wrong options from a column, skipping any that mean the same as the answer. */
const others = (list: string[][], col: number, answer: string, r: () => number) => shuffle(r, list.map(row => row[col])).filter(option => option !== answer && !related(option, answer)).slice(0, 6);
/** Plausible wrong versions of a transformed sentence: the tense or form shifted one step. */
const SHIFTS: [RegExp, string][] = [[/\bis\b/, "was"], [/\bwas\b/, "is"], [/\bare\b/, "were"], [/\bwere\b/, "are"], [/\bhas been\b/, "had been"], [/\bhad been\b/, "has been"], [/\bwill be\b/, "would be"], [/\bhad\b/, "has"], [/\bwould\b/, "will"], [/\bthe next day\b/, "tomorrow"], [/\bthe day before\b/, "yesterday"], [/\bthen\b/, "now"], [/\bthere\b/, "here"], [/\bhe\b/, "I"], [/\bshe\b/, "I"], [/ by [a-z ]+\.$/i, "."], [/\bbeing\b/, "been"], [/\basked\b/, "said"]];
const variants = (text: string, fallback: string[]) => [...new Set(SHIFTS.map(([re, to]) => text.replace(re, to)).filter(v => v !== text)), ...fallback];
const rows = (text: string) => text.trim().split("\n").map(line => line.split("|").map(part => part.trim()));

const SYNONYMS = rows(`
abundant|plentiful
accurate|precise
adequate|sufficient
affluent|wealthy
amiable|friendly
ancient|old
anxious|worried
apparent|obvious
arrogant|haughty
assist|help
astonish|amaze
benevolent|kind
brief|short
candid|frank
cautious|careful
cease|stop
colossal|huge
commence|begin
competent|capable
conceal|hide
courage|bravery
curious|inquisitive
deceive|cheat
diligent|hardworking
diminish|decrease
eminent|famous
endeavour|attempt
enormous|vast
essential|necessary
evident|clear
fatigue|tiredness
feeble|weak
fortunate|lucky
frugal|thrifty
gloomy|dismal
gratitude|thankfulness
hazard|danger
hostile|unfriendly
humble|modest
immense|huge
imitate|copy
inevitable|unavoidable
infant|baby
jubilant|joyful
keen|eager
lethargic|sluggish
lucid|clear
meagre|scanty
merit|worth
novice|beginner
obstinate|stubborn
obsolete|outdated
odour|smell
optimistic|hopeful
peril|danger
perish|die
persuade|convince
placid|calm
proficient|skilled
prohibit|forbid
prudent|wise
rapid|fast
reluctant|unwilling
remote|distant
renowned|famous
rigid|stiff
robust|strong
scarce|rare
serene|peaceful
shrewd|clever
slender|slim
solitary|lonely
spacious|roomy
splendid|magnificent
stern|strict
sturdy|strong
summit|peak
superficial|shallow
swift|quick
tedious|boring
temporary|short-lived
tranquil|calm
trivial|unimportant
vacant|empty
valiant|brave
vanish|disappear
vigilant|watchful
vivid|bright
wrath|anger
zeal|enthusiasm
abandon|desert
adversity|misfortune
ample|enough
authentic|genuine
cordial|warm
dwindle|shrink
eccentric|odd
fervent|passionate
genuine|real
illustrious|distinguished
`);
const ANTONYMS = rows(`
abundant|scarce
accept|reject
ancient|modern
arrogant|humble
artificial|natural
ascend|descend
attack|defend
barren|fertile
bold|timid
brave|cowardly
brief|lengthy
cautious|careless
cheap|expensive
comfort|discomfort
compulsory|optional
conceal|reveal
confident|diffident
create|destroy
cruel|kind
deep|shallow
defeat|victory
deny|admit
dull|bright
dwarf|giant
early|late
encourage|discourage
entrance|exit
expand|contract
export|import
exterior|interior
famous|unknown
feeble|strong
foolish|wise
forget|remember
frequent|rare
generous|mean
guilty|innocent
harmful|harmless
hostile|friendly
humble|proud
idle|busy
include|exclude
increase|decrease
inferior|superior
justice|injustice
lazy|diligent
liberty|slavery
loyal|disloyal
major|minor
maximum|minimum
merciful|merciless
minor|major
modest|boastful
natural|artificial
negative|positive
obedient|disobedient
optimist|pessimist
permanent|temporary
polite|rude
poverty|wealth
praise|criticise
private|public
profit|loss
punctual|late
quiet|noisy
rapid|slow
rigid|flexible
rough|smooth
rural|urban
sorrow|joy
strict|lenient
success|failure
sunrise|sunset
thick|thin
transparent|opaque
triumph|defeat
truth|falsehood
vacant|occupied
victory|defeat
visible|invisible
voluntary|compulsory
wisdom|folly
youth|age
zenith|nadir
absent|present
advance|retreat
affirm|deny
ally|enemy
amateur|professional
apparent|hidden
`);
const VERBS = rows(`
arise|arose|arisen
awake|awoke|awoken
bear|bore|borne
beat|beat|beaten
become|became|become
begin|began|begun
bend|bent|bent
bite|bit|bitten
blow|blew|blown
break|broke|broken
bring|brought|brought
build|built|built
burst|burst|burst
buy|bought|bought
catch|caught|caught
choose|chose|chosen
come|came|come
cost|cost|cost
creep|crept|crept
cut|cut|cut
deal|dealt|dealt
dig|dug|dug
do|did|done
draw|drew|drawn
drink|drank|drunk
drive|drove|driven
eat|ate|eaten
fall|fell|fallen
feed|fed|fed
feel|felt|felt
fight|fought|fought
find|found|found
flee|fled|fled
fly|flew|flown
forbid|forbade|forbidden
forget|forgot|forgotten
forgive|forgave|forgiven
freeze|froze|frozen
get|got|got
give|gave|given
go|went|gone
grind|ground|ground
grow|grew|grown
hang|hung|hung
hide|hid|hidden
hit|hit|hit
hold|held|held
hurt|hurt|hurt
keep|kept|kept
kneel|knelt|knelt
know|knew|known
lay|laid|laid
lead|led|led
leave|left|left
lend|lent|lent
lie|lay|lain
lose|lost|lost
make|made|made
mean|meant|meant
meet|met|met
pay|paid|paid
ride|rode|ridden
ring|rang|rung
rise|rose|risen
run|ran|run
say|said|said
see|saw|seen
seek|sought|sought
sell|sold|sold
send|sent|sent
shake|shook|shaken
shine|shone|shone
shoot|shot|shot
shrink|shrank|shrunk
sing|sang|sung
sink|sank|sunk
sit|sat|sat
sleep|slept|slept
slide|slid|slid
speak|spoke|spoken
spend|spent|spent
spin|spun|spun
spread|spread|spread
spring|sprang|sprung
stand|stood|stood
steal|stole|stolen
sting|stung|stung
strike|struck|struck
swear|swore|sworn
swim|swam|swum
swing|swung|swung
take|took|taken
teach|taught|taught
tear|tore|torn
tell|told|told
think|thought|thought
throw|threw|thrown
tread|trod|trodden
understand|understood|understood
wake|woke|woken
wear|wore|worn
weave|wove|woven
weep|wept|wept
win|won|won
write|wrote|written
`);
const ONE_WORD = rows(`
One who cannot read or write|Illiterate
A person who does not believe in God|Atheist
One who knows everything|Omniscient
One who is present everywhere|Omnipresent
A person who loves mankind|Philanthropist
A person who hates mankind|Misanthrope
One who eats only vegetables|Vegetarian
A person who lives on another|Parasite
A place where birds are kept|Aviary
A place where bees are kept|Apiary
A place where fish are kept|Aquarium
The study of the stars and planets|Astronomy
The study of insects|Entomology
The study of birds|Ornithology
A speech made without preparation|Extempore
Something that cannot be seen|Invisible
Something that cannot be read|Illegible
Something that cannot be avoided|Inevitable
Something that cannot be corrected|Incorrigible
A life history written by oneself|Autobiography
A life history written by someone else|Biography
A person who speaks two languages|Bilingual
A person who speaks many languages|Polyglot
A government by the people|Democracy
Rule by one person with total power|Autocracy
A word opposite in meaning|Antonym
A word similar in meaning|Synonym
Killing of one's own self|Suicide
Killing of a king|Regicide
A child whose parents are dead|Orphan
A woman whose husband is dead|Widow
One who travels on foot|Pedestrian
A list of books|Catalogue
A collection of poems|Anthology
A number of ships|Fleet
A number of stars grouped together|Constellation
A sound that cannot be heard|Inaudible
A person who is new to a profession|Novice
A medicine that kills germs|Antiseptic
A remedy for all diseases|Panacea
One who looks at the bright side|Optimist
One who looks at the dark side|Pessimist
A place where dead bodies are kept|Mortuary
A place where orphans live|Orphanage
A person who walks in sleep|Somnambulist
Fear of heights|Acrophobia
Fear of water|Hydrophobia
One who abstains from alcohol|Teetotaller
A paper written by hand|Manuscript
Words written on a tomb|Epitaph
A period of ten years|Decade
A period of one hundred years|Century
A period of one thousand years|Millennium
One who is unable to pay debts|Insolvent
That which is fit to be eaten|Edible
That which cannot be broken|Unbreakable
A post with high salary but little work|Sinecure
An animal that eats flesh|Carnivore
An animal that eats plants|Herbivore
Happening every year|Annual
`);
const IDIOMS = rows(`
a piece of cake|very easy
once in a blue moon|very rarely
to burn the midnight oil|to work or study late into the night
to beat about the bush|to avoid coming to the point
to break the ice|to start a conversation in an awkward situation
to call it a day|to stop working for the day
to cry over spilt milk|to regret what cannot be undone
to hit the nail on the head|to say exactly the right thing
to let the cat out of the bag|to reveal a secret
to turn a blind eye|to ignore deliberately
a blessing in disguise|something good that seemed bad at first
to bite the bullet|to face something difficult bravely
to cost an arm and a leg|to be very expensive
to get cold feet|to become nervous before something important
to hit the sack|to go to bed
to keep one's fingers crossed|to hope for success
to pull someone's leg|to tease someone playfully
under the weather|feeling unwell
to see eye to eye|to agree fully
to spill the beans|to reveal secret information
to go the extra mile|to make more effort than expected
to make ends meet|to manage with limited money
to be in hot water|to be in trouble
to add fuel to the fire|to make a bad situation worse
an apple of discord|a cause of quarrel
to be all ears|to listen eagerly
to bell the cat|to undertake a risky task
to bury the hatchet|to make peace
by leaps and bounds|very rapidly
to face the music|to accept the consequences
to fly off the handle|to lose one's temper suddenly
to get into hot water|to get into trouble
in the nick of time|just in time
to keep the wolf from the door|to avoid starvation
to lend a hand|to help
to nip in the bud|to stop something at an early stage
to rain cats and dogs|to rain very heavily
red-letter day|a memorable day
a white elephant|a costly but useless possession
to smell a rat|to suspect something wrong
to take to one's heels|to run away
to throw in the towel|to admit defeat
an olive branch|an offer of peace
at the eleventh hour|at the last moment
to be at sixes and sevens|to be in disorder
to cut corners|to do something cheaply or carelessly
to get the ball rolling|to start something
to hold one's horses|to wait and be patient
a dark horse|an unexpected winner
to show the white feather|to show cowardice
`);
const PREPOSITIONS = rows(`
She is good ___ mathematics.|at|in|on|for
He has been ill ___ Monday.|since|for|from|by
The book is ___ the table.|on|in|at|over
I prefer tea ___ coffee.|to|than|over|from
He is fond ___ music.|of|for|with|about
She was angry ___ her brother.|with|on|at|against
We arrived ___ Delhi in the morning.|in|at|to|on
He died ___ cancer.|of|from|by|with
The train arrived ___ the station on time.|at|in|on|to
She is married ___ a doctor.|to|with|by|for
He is junior ___ me.|to|than|from|of
They have lived here ___ ten years.|for|since|from|by
The cat jumped ___ the wall.|over|on|at|in
He was accused ___ theft.|of|for|with|on
She is senior ___ me by two years.|to|than|from|of
Divide the sweets ___ the two children.|between|among|with|to
Divide the sweets ___ the five children.|among|between|with|to
He is afraid ___ dogs.|of|from|with|by
I will meet you ___ 5 o'clock.|at|on|in|by
We will go there ___ Sunday.|on|at|in|by
The meeting is ___ June.|in|on|at|by
He insisted ___ paying the bill.|on|in|at|for
She congratulated him ___ his success.|on|for|at|with
The house was built ___ bricks.|of|from|with|by
Wine is made ___ grapes.|from|of|with|by
He is blind ___ one eye.|of|in|from|with
She takes after ___ her mother.|(no preposition: she takes after her mother)|of|with|to
I am tired ___ waiting.|of|from|with|by
He was absent ___ school.|from|in|at|of
She is proud ___ her achievements.|of|for|with|about
He prevented me ___ going.|from|to|for|of
The thief was sentenced ___ two years in prison.|to|for|with|at
They agreed ___ the plan.|to|with|on|for
I agree ___ you.|with|to|on|for
He is suffering ___ fever.|from|with|of|by
She apologised ___ being late.|for|of|about|on
He is capable ___ doing it.|of|for|to|in
She is interested ___ painting.|in|on|at|for
He aimed ___ the target.|at|on|to|for
The bus is full ___ passengers.|of|with|by|from
`);
const ARTICLES = rows(`
He is ___ honest man.|an|a|the|no article
She is ___ university student.|a|an|the|no article
___ sun rises in the east.|The|A|An|No article
He is ___ best student in the class.|the|a|an|no article
I saw ___ elephant at the zoo.|an|a|the|no article
She plays ___ piano beautifully.|the|a|an|no article
He wants to become ___ engineer.|an|a|the|no article
___ Ganga is a holy river.|The|A|An|No article
It took ___ hour to reach.|an|a|the|no article
He is ___ European.|a|an|the|no article
She bought ___ umbrella.|an|a|the|no article
___ honesty is the best policy.|No article|The|A|An
He gave me ___ one-rupee coin.|a|an|the|no article
This is ___ book I told you about.|the|a|an|no article
She is ___ MLA from our district.|an|a|the|no article
I have ___ headache.|a|an|the|no article
___ Himalayas are the highest mountains.|The|A|An|No article
He plays ___ cricket every evening.|no article|the|a|an
___ rich should help the poor.|The|A|An|No article
She is ___ only child of her parents.|the|a|an|no article
`);
const TENSES = rows(`
She ___ to school every day.|goes|go|is going|gone
They ___ football when it started raining.|were playing|played|are playing|have played
I ___ my homework already.|have finished|finished|finish|am finishing
He ___ here since 2015.|has been living|is living|lives|lived
By next year, she ___ her degree.|will have completed|will complete|completes|has completed
The train ___ before we reached the station.|had left|has left|left|leaves
Water ___ at 100 °C.|boils|is boiling|boiled|has boiled
Look! The baby ___.|is sleeping|sleeps|slept|has slept
If it rains, we ___ at home.|will stay|stayed|would stay|stay
If I were you, I ___ apologise.|would|will|shall|can
She ___ a letter when the phone rang.|was writing|wrote|is writing|has written
I ___ him yesterday.|met|have met|meet|had meet
He ___ for two hours before the bus came.|had been waiting|has been waiting|was waiting|waits
Listen! Someone ___ at the door.|is knocking|knocks|knocked|has knocked
They ___ in Mumbai for five years now.|have lived|lived|live|are living
The earth ___ round the sun.|moves|is moving|moved|has moved
Neither of the boys ___ present.|was|were|are|have been
Each of the students ___ a book.|has|have|are having|were having
The news ___ good.|is|are|were|have been
Mathematics ___ my favourite subject.|is|are|were|have been
`);
const VOICE = rows(`
She writes a letter.|A letter is written by her.
They are building a bridge.|A bridge is being built by them.
He has completed the work.|The work has been completed by him.
The police arrested the thief.|The thief was arrested by the police.
I will finish the project.|The project will be finished by me.
Ram was reading a book.|A book was being read by Ram.
Who wrote this poem?|By whom was this poem written?
Open the door.|Let the door be opened.
They had won the match.|The match had been won by them.
People speak English all over the world.|English is spoken all over the world.
She is cooking dinner.|Dinner is being cooked by her.
The teacher praised the students.|The students were praised by the teacher.
We must obey the rules.|The rules must be obeyed by us.
Did he solve the problem?|Was the problem solved by him?
The cat killed the rat.|The rat was killed by the cat.
They will announce the results tomorrow.|The results will be announced tomorrow.
He can lift this box.|This box can be lifted by him.
Somebody has stolen my bag.|My bag has been stolen.
The gardener waters the plants daily.|The plants are watered daily by the gardener.
Help the poor.|Let the poor be helped.
They were painting the walls.|The walls were being painted by them.
She sang a beautiful song.|A beautiful song was sung by her.
The manager will interview the candidates.|The candidates will be interviewed by the manager.
Do you know him?|Is he known to you?
The fire destroyed the house.|The house was destroyed by the fire.
`);
const NARRATION = rows(`
He said, "I am busy."|He said that he was busy.
She said, "I will come tomorrow."|She said that she would come the next day.
He said to me, "Where are you going?"|He asked me where I was going.
The teacher said, "The earth is round."|The teacher said that the earth is round.
She said to him, "Please help me."|She requested him to help her.
He said, "I have finished my work."|He said that he had finished his work.
They said, "We are playing cricket."|They said that they were playing cricket.
He said to her, "Do you like music?"|He asked her if she liked music.
The captain said to the soldiers, "March forward."|The captain ordered the soldiers to march forward.
She said, "What a beautiful flower it is!"|She exclaimed that it was a very beautiful flower.
He said, "I saw a lion yesterday."|He said that he had seen a lion the day before.
Mother said to me, "Don't play in the sun."|Mother told me not to play in the sun.
He said, "I can swim."|He said that he could swim.
She said to me, "Are you ready?"|She asked me whether I was ready.
He said, "I may go to Delhi."|He said that he might go to Delhi.
The boy said, "I am reading a book now."|The boy said that he was reading a book then.
She said, "I bought this dress last week."|She said that she had bought that dress the previous week.
He said to me, "Wait here."|He told me to wait there.
Ravi said, "Alas! I have failed."|Ravi exclaimed sadly that he had failed.
She said, "I must leave now."|She said that she had to leave then.
`);
const ERRORS = rows(`
He don't like tea.|He doesn't like tea.|"He" takes the singular verb "doesn't".
She is senior than me.|She is senior to me.|Words ending in -ior take "to", not "than".
I am living here since 2010.|I have been living here since 2010.|An action continuing from the past to now takes the present perfect continuous.
Each of the boys have a pen.|Each of the boys has a pen.|"Each" is singular.
He is more taller than his brother.|He is taller than his brother.|Do not use "more" with a comparative ending in -er.
The news are good.|The news is good.|"News" is an uncountable singular noun.
I have seen him yesterday.|I saw him yesterday.|A finished past time ("yesterday") takes the simple past.
She is one of the best student in the class.|She is one of the best students in the class.|"One of the" is followed by a plural noun.
Neither he nor I are going.|Neither he nor I am going.|With neither…nor, the verb agrees with the nearer subject.
He gave me an advice.|He gave me some advice.|"Advice" is uncountable and takes no article "an".
Despite of the rain, we went out.|Despite the rain, we went out.|"Despite" is not followed by "of".
He is good in English.|He is good at English.|"Good at" is the correct collocation.
Ten miles are a long distance.|Ten miles is a long distance.|A distance taken as one amount takes a singular verb.
She speaks English very good.|She speaks English very well.|"Well" is the adverb that modifies a verb.
Please return back the book.|Please return the book.|"Return" already means "give back".
The furnitures are new.|The furniture is new.|"Furniture" is uncountable.
I prefer coffee than tea.|I prefer coffee to tea.|"Prefer" takes "to".
If I was you, I would go.|If I were you, I would go.|Unreal conditions use "were" for all persons.
He did not knew the answer.|He did not know the answer.|After "did", use the base form of the verb.
The boy who is standing there he is my cousin.|The boy who is standing there is my cousin.|Do not repeat the subject with a pronoun.
She has been working here for 2015.|She has been working here since 2015.|"Since" goes with a point of time.
My friend and guide have come.|My friend and guide has come.|One person described two ways takes a singular verb.
Bread and butter are my breakfast.|Bread and butter is my breakfast.|Two nouns forming one idea take a singular verb.
He is an university student.|He is a university student.|"University" begins with a "yoo" sound, so it takes "a".
Unless you do not work hard, you will fail.|Unless you work hard, you will fail.|"Unless" already means "if not".
I look forward to meet you.|I look forward to meeting you.|"Look forward to" is followed by the -ing form.
The cattle is grazing.|The cattle are grazing.|"Cattle" is always plural.
He is the most cleverest boy.|He is the cleverest boy.|Do not double the superlative.
One should do his duty.|One should do one's duty.|"One" is followed by "one's".
Scarcely had he left than it rained.|Scarcely had he left when it rained.|"Scarcely" pairs with "when", not "than".
`);

export function generateEnglish(cls: ClassId): Generated {
  const r = rng(cls === "10" ? 5010 : 5212);
  const b = new Bank(`g${cls}-english`, r);
  const words = (list: string[][], col: number) => list.map(row => row[col]);
  for (const [word, syn] of shuffle(r, SYNONYMS)) b.mcq("Vocabulary: Synonyms", `Choose the word closest in meaning to "${word}".`, syn, others(SYNONYMS, 1, syn, r), `"${word}" means ${syn}.`);
  for (const [word, ant] of shuffle(r, ANTONYMS)) b.mcq("Vocabulary: Antonyms", `Choose the word opposite in meaning to "${word}".`, ant, others(ANTONYMS, 1, ant, r), `The opposite of "${word}" is "${ant}".`);
  for (const [base, past, part] of shuffle(r, VERBS)) {
    const regular = (v: string) => v.endsWith("e") ? `${v}d` : `${v}ed`;
    b.mcq("Grammar: Verb Forms", `What is the past tense of "${base}"?`, past, [part, regular(base), base, `${past}ed`, `${base}s`], `${base} – ${past} – ${part}.`);
    if (part !== past) b.mcq("Grammar: Verb Forms", `What is the past participle of "${base}"?`, part, [past, regular(base), base, `${part}ed`, `${base}ing`], `${base} – ${past} – ${part}.`);
    b.bank("Grammar: Verb Forms", `Give the past tense and past participle of "${base}", and use the past participle in a sentence.`, `${base} – ${past} – ${part}. Example: "I have ${part} it."`, 1);
  }
  for (const [meaning, word] of shuffle(r, ONE_WORD)) { b.mcq("Vocabulary: One-word Substitution", `One word for: "${meaning}"`, word, others(ONE_WORD, 1, word, r), `"${meaning}" = ${word}.`); b.bank("Vocabulary: One-word Substitution", `Give one word for: ${meaning}.`, word, 1); }
  for (const [idiom, meaning] of shuffle(r, IDIOMS)) { b.mcq("Vocabulary: Idioms and Phrases", `What does the idiom "${idiom}" mean?`, meaning, others(IDIOMS, 1, meaning, r), `"${idiom}" means ${meaning}.`); b.bank("Vocabulary: Idioms and Phrases", `Explain the idiom "${idiom}" and use it in a sentence of your own.`, `Meaning: ${meaning}. Use it in a sentence that shows this meaning clearly.`, 2); }
  for (const [sentence, answer, ...wrong] of PREPOSITIONS) b.mcq("Grammar: Prepositions", `Fill in the blank: ${sentence}`, answer, wrong, `${sentence.replace("___", answer.startsWith("(") ? "" : answer)} ${answer.startsWith("(") ? answer : ""}`.trim());
  for (const [sentence, answer, ...wrong] of ARTICLES) b.mcq("Grammar: Articles", `Fill in the blank with the correct article: ${sentence}`, answer, wrong, `The correct choice is "${answer}".`);
  for (const [sentence, answer, ...wrong] of TENSES) b.mcq("Grammar: Tenses and Agreement", `Fill in the blank: ${sentence}`, answer, wrong, `${sentence.replace("___", answer)}`);
  for (const [active, passive] of VOICE) {
    b.solved("Grammar: Active and Passive Voice", `Change into passive voice: ${active}`, passive, ["// Object becomes the subject; use the right form of 'be' + past participle", passive], 1);
    b.mcq("Grammar: Active and Passive Voice", `Choose the correct passive form of: "${active}"`, passive, variants(passive, [active]), `${passive}`);
  }
  for (const [direct, indirect] of NARRATION) {
    b.solved("Grammar: Direct and Indirect Speech", `Change into indirect speech: ${direct}`, indirect, ["// Change the reporting verb, pronouns, tense and time words as needed", indirect], 1);
    b.mcq("Grammar: Direct and Indirect Speech", `Choose the correct indirect speech for: ${direct}`, indirect, variants(indirect, [direct.replace(/"/g, "")]), indirect);
  }
  for (const [wrong, right, why] of ERRORS) {
    b.solved("Grammar: Error Correction", `Correct the sentence: "${wrong}"`, right, [`// ${why}`, right], 1);
    b.mcq("Grammar: Error Correction", `Which is the correct version of: "${wrong}"`, right, [wrong, ...shuffle(r, words(ERRORS, 1)).slice(0, 4)], why);
  }
  void pick;
  return { items: b.items, mcqs: b.mcqs };
}
