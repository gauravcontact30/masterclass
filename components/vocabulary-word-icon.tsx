import { createElement } from "react";
import {
  Anchor, Award, Banknote, BookText, Brain, Building2, Clock, CloudRain, Compass, Crown, Drama,
  Eye, Flame, Footprints, Gavel, Gem, Handshake, Heart, HeartCrack, Landmark, Leaf, Lightbulb,
  Link2, Lock, MessageSquareText, Minimize2, Mountain, Music, Recycle, Scale, Scissors, Shield,
  Sparkles, Split, Swords, Target, ThumbsDown, ThumbsUp, TrendingDown, TrendingUp, Users,
  VenetianMask, Waves, Wrench, Zap, type LucideIcon,
} from "lucide-react";

/**
 * A mark for a single vocabulary word.
 *
 * The other catalogues name an icon per entry by hand, which works for the
 * seventy terms in the AI glossary and would not work here: this handbook runs
 * to thousands of words and grows every time a list is imported. So the mark is
 * derived instead — from the word itself where it is recognisable, otherwise
 * from the language of its definition, and from its category only as a last
 * resort. A rule earns its place by covering a whole family of words ("-phobia",
 * "anything to do with money"), never a single one.
 *
 * The sense buckets are deliberately coarse. A reader scanning a grid of six
 * cards wants to tell them apart at a glance; they are not consulting the mark
 * for the definition, which is two lines below it.
 */

/** Sense buckets, most specific first — the first rule that matches wins. */
const SENSES: [LucideIcon, RegExp][] = [
  [Banknote, /\b(money|wealth|rich|payment|pay|profit|wages|财|financial|funds|afford|cost|price|debt|poverty|poor|stingy|miserly|generous with money)\b/],
  [Gavel, /\b(law|legal|court|judge|judicial|verdict|trial|jury|statute|litigat|prosecut|sentence of a court|illegal|crime|criminal|guilt)\b/],
  [Swords, /\b(kill|killing|slaughter|war|battle|fight|attack|combat|weapon|violent|violence|destroy|destruction|massacre|hostile)\b/],
  [Shield, /\b(protect|defend|guard|shelter|safe|safety|secure|immune|preserve|shield)\b/],
  [Lock, /\b(forbid|prohibit|ban|restrict|confine|imprison|captive|trap|bind|restrain|prevent)\b/],
  [VenetianMask, /\b(deceive|deceit|deception|lie|lying|false|fake|fraud|cheat|mislead|pretend|pretence|hypocri|disguise|sham|insincere)\b/],
  [MessageSquareText, /\b(speak|speech|say|said|talk|utter|voice|tell|telling|statement|remark|oratory|eloquen|verbal|conversation|chatter|articulat)\b/],
  [BookText, /\b(write|writing|written|book|literature|text|author|poem|poetry|prose|read|scholar|erudit|learned)\b/],
  [ThumbsUp, /\b(praise|approve|approval|admire|applaud|commend|compliment|flatter|acclaim|celebrat|honou?r)\b/],
  [ThumbsDown, /\b(criticis|criticiz|blame|condemn|disapprov|scold|rebuke|reproach|belittle|disparage|mock|ridicule|sneer|slander|insult)\b/],
  [Heart, /\b(love|kind|kindness|affection|tender|compassion|mercy|charit|benevolen|caring|devoted|warmth|friendly)\b/],
  [HeartCrack, /\b(hate|hatred|cruel|cruelty|malice|malicious|spite|bitter|hostilit|resent|contempt|ruthless|merciless)\b/],
  [CloudRain, /\b(sad|sadness|sorrow|grief|mourn|gloom|melanchol|despair|dejected|miserable|unhappy|weep|lament)\b/],
  [Sparkles, /\b(happy|happiness|joy|delight|cheer|glad|merry|elat|pleasure|pleasing|bliss|content)\b/],
  [Flame, /\b(anger|angry|rage|fury|furious|wrath|irritat|annoy|enrage|temper|indignat|passionate|zeal|fervou?r|ardent)\b/],
  [Brain, /\b(think|thought|mind|intellig|clever|wise|wisdom|reason|knowledge|understand|insight|shrewd|astute|ingenious|memory|learn)\b/],
  [Lightbulb, /\b(idea|invent|discover|creative|imagin|origin|novel|innovat|inspire|insight)\b/],
  [Eye, /\b(see|seeing|sight|look|watch|observ|visible|vision|appear|glance|stare|conspicuous|notice)\b/],
  [Users, /\b(people|crowd|group|society|social|community|public|companion|gathering|assembly|colleague|team)\b/],
  [Handshake, /\b(agree|agreement|accord|consent|reconcil|peace|harmon|cooperat|alliance|treaty|compromise|settle a dispute)\b/],
  [Split, /\b(disagree|dispute|quarrel|conflict|argument|discord|divide|division|separat|split|schism|oppose|opposition|contradict)\b/],
  [Crown, /\b(king|queen|royal|noble|rule|ruler|sovereign|reign|monarch|aristocra|supreme|command|authority|dominate|superior)\b/],
  [Landmark, /\b(government|state|nation|politic|civic|official|administration|bureaucra|institution)\b/],
  [Building2, /\b(build|building|structure|construct|architect|house|dwelling|edifice|city|urban)\b/],
  [Leaf, /\b(plant|tree|flower|grow|growth|garden|vegetat|crop|harvest|nature|natural world|forest|rural)\b/],
  [Waves, /\b(water|sea|ocean|river|flood|wave|rain|liquid|wet|drown|swim|tide)\b/],
  [Mountain, /\b(mountain|rock|stone|earth|ground|hill|land|terrain|soil)\b/],
  [Music, /\b(sound|music|song|sing|melod|tune|noise|ear|hear|heard|loud|quiet|silence|voice quality|tone)\b/],
  [Clock, /\b(time|delay|late|early|brief|moment|duration|lasting|prolong|postpone|temporary|permanent|eternal|sudden|prompt)\b/],
  [Footprints, /\b(walk|move|movement|travel|journey|go|going|wander|roam|flee|run|depart|arrive|migrat|pace)\b/],
  [TrendingUp, /\b(increase|grow|rise|raise|expand|enlarge|augment|abundan|plenty|excess|surplus|profuse|copious|numerous|many)\b/],
  [TrendingDown, /\b(decrease|reduce|decline|diminish|lessen|shrink|scarce|scarcity|lack|deficien|meagre|meager|sparse|few)\b/],
  [Minimize2, /\b(small|tiny|little|minute|slight|narrow|thin|short|compress|condense|brief and to the point)\b/],
  [Scale, /\b(balance|equal|fair|just|justice|impartial|unbiased|weigh|compare|proportion|moderate)\b/],
  [Target, /\b(aim|goal|purpose|intent|objective|ambition|strive|pursue|determined|resolute|persist)\b/],
  [Zap, /\b(sudden|quick|swift|rapid|fast|energ|vigor|vigour|force|forceful|powerful|intense|strong)\b/],
  [Anchor, /\b(firm|fixed|stable|steady|constant|unchang|stubborn|obstinate|rigid|inflexible|immovable)\b/],
  [Waves, /\b(change|changing|vary|variable|fickle|unstable|inconstant|fluctuat|wavering|hesitat)\b/],
  [Scissors, /\b(cut|cutting|sever|remove|delete|abolish|eliminat|shorten|trim|curtail)\b/],
  [Recycle, /\b(repeat|again|restore|renew|revive|return|recover|reform|replace)\b/],
  [Wrench, /\b(work|labou?r|tool|craft|skill|practical|method|technique|repair|machine|industr)\b/],
  [Drama, /\b(act|acting|theatre|theater|perform|display|show off|ostentatious|pretentious|exaggerat|dramatic)\b/],
  [Gem, /\b(beautiful|beauty|elegan|grace|splendid|magnificent|exquisite|ornament|decorat|luxur|precious)\b/],
  [Award, /\b(reward|prize|gift|award|grant|bestow|generous|give|giving|bounty|donat)\b/],
  [Compass, /\b(guide|lead|direct|advice|advise|instruct|teach|show the way|explore|seek|search)\b/],
  [Link2, /\b(join|connect|attach|unite|combine|merge|bind together|relation|association)\b/],
];

/** Words whose sense the definition text does not give away. */
const BY_WORD: Record<string, LucideIcon> = {
  articulate: MessageSquareText, succinct: Minimize2, candid: Eye, verbose: MessageSquareText,
  aloof: Split, frail: HeartCrack, potent: Zap, pragmatic: Wrench, devout: Heart,
  criterion: Scale, plaintiff: Gavel, libel: Gavel, pariah: Split, largess: Award,
  dulcet: Music, wistful: CloudRain, vestige: Footprints, guise: VenetianMask,
  corpulent: TrendingUp, diminutive: Minimize2, deluge: Waves, carnage: Swords,
};

/** The category's own mark, for a word no rule recognises. */
const BY_CATEGORY: Record<string, LucideIcon> = {
  "Workplace speaking": MessageSquareText,
  "Corporate vocabulary": Building2,
  "Professional tone": Drama,
  "Leadership & strategy": Crown,
  "Meetings & negotiation": Handshake,
  "Writing & presentations": BookText,
  "People & culture": Users,
  "Business analysis": Scale,
  "Synonyms & precision": Target,
  "Antonyms & contrast": Split,
};

/** The icon for a word, given whatever is known about it. */
export function wordIcon(word: string, meaning?: string, category?: string): LucideIcon {
  const key = word.trim().toLowerCase();
  const direct = BY_WORD[key];
  if (direct) return direct;
  // The word itself is searched first and the definition second, so "hateful"
  // is not filed under "love" merely because its gloss mentions the word.
  const haystacks = [` ${key} `, ` ${(meaning ?? "").toLowerCase()} `];
  for (const haystack of haystacks) {
    for (const [icon, pattern] of SENSES) if (pattern.test(haystack)) return icon;
  }
  return (category && BY_CATEGORY[category]) || BookText;
}

export function VocabularyWordIcon({ word, meaning, category, size = 15, className }: {
  word: string; meaning?: string; category?: string; size?: number; className?: string;
}) {
  return createElement(wordIcon(word, meaning, category), { size, className, "aria-hidden": true });
}
