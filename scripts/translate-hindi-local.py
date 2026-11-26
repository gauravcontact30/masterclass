"""Offline Hindi translation with IndicTrans2 (CTranslate2). Only local files are read; no network client or API credentials.

Usage (after `npx tsx scripts/translate-exams-hindi.ts` exports .local-tools/hindi-input.json):
  python -I scripts/translate-hindi-local.py --sample    translate a spread of strings and print them
  python -I scripts/translate-hindi-local.py             translate pending strings into .local-tools/hindi-drafts-it2.json (resumable)
  python -I scripts/translate-hindi-local.py --publish-only   publish current drafts without translating
  python -I scripts/translate-hindi-local.py --publish   also write lib/locales/ui-hi.json and the per-surface shards in lib/locales/hi/

lib/locales/hi-reviewed.json always wins over machine output. Strings from English-language exercises (input `keep`)
and strings with no prose once math is removed are never translated: the UI falls back to the English source.
Math is masked before translation so formulas stay byte-identical. Every machine translation is validated;
failures go to .local-tools/hindi-rejected.json and stay English until reviewed.
"""
from pathlib import Path
import sys, json, re, time

ROOT = Path(__file__).resolve().parent.parent
for lib in ('.local-tools/hindi-py315', '.local-tools/hindi'):
    if (ROOT / lib).exists():
        sys.path.insert(0, str(ROOT / lib))
        break

MODEL = ROOT / '.local-tools/hindi-model-indic'
INPUT = ROOT / '.local-tools/hindi-input.json'
DRAFTS = ROOT / '.local-tools/hindi-drafts-it2.json'
REJECTED = ROOT / '.local-tools/hindi-rejected.json'
REVIEWED = ROOT / 'lib/locales/hi-reviewed.json'
BROKEN = '<<UNMASK_FAILED>>'
# Beam width: 4 is the quality default; --beam 2 is ~1.7x faster on CPU for long passages.
BEAM = int(sys.argv[sys.argv.index('--beam') + 1]) if '--beam' in sys.argv else 4

PROSE = re.compile(r'(?<![A-Za-z])(?:[a-z]{3,}|[A-Z][a-z]{2,})(?![A-Za-z])')
PLACEHOLDER = re.compile(r'\{[A-Za-z_]+\}')
NUMBER = re.compile(r'\d+(?:[.,]\d+)*')
DEVANAGARI = re.compile('[ऀ-ॿ]')
# Numbers, operators, sub/superscripts, Greek letters, arrows and relations.
MATHY = re.compile('[0-9=+−×÷√π∞≤≥<>±%₹°′″^∑∫∆²³¹'
                   '⁰-₟α-ωΑ-Ω←-⇿≈≠≡∝∠⊥∥∴∵'
                   # |x| and set, logic, geometry symbols; modifier and phonetic super/subscripts (xˣ, aᵢ, Aᵀ); vector hats (î, ĵ, k̂).
                   '|∀-⋿△▲□ʰ-˿ᴀ-ᶿîĵ̂]')
# Upper-case words that are emphasis in a question, not abbreviations: they must be translated, never masked.
EMPHASIS = {'NOT', 'ALL', 'AND', 'OR', 'NO', 'ONLY', 'TRUE', 'FALSE', 'EXCEPT', 'CORRECT', 'INCORRECT', 'BOTH', 'NONE', 'NEITHER', 'NOR',
            'NEVER', 'ALWAYS', 'LEAST', 'MOST', 'BEST', 'WRONG', 'RIGHT', 'ONE', 'TWO', 'THREE', 'MORE', 'THAN', 'WORDS', 'WORD', 'NUMBER'}
ACRONYM = re.compile(r'[A-Z][A-Z0-9&]*[A-Z0-9]')
UNITS = {'cm', 'mm', 'km', 'm', 's', 'kg', 'g', 'mg', 'mol', 'h', 'hr', 'hrs', 'min', 'L', 'mL', 'N', 'J', 'W', 'V', 'A', 'K', 'Pa', 'Hz',
         'C', 'kJ', 'kW', 'eV', 'dm', 'mA', 'kV', 'atm', 'cal', 'kcal', 'Wb', 'T', 'F', 'H', 'S', 'D', 'mph', 'kmph', 'sec', 'secs'}
MATH_EDGE = re.compile(r'''^(["'‘“]*)(.*?)([.,;:?!"'’”]*)$''', re.S)
EDGE = re.compile(r'''^([("'\[]*)(.*?)([)\]"'.,;:?!]*)$''', re.S)
OPERATORS = '=+−×÷√%₹()[]'
FUNCTIONS = {'sin', 'cos', 'tan', 'cot', 'sec', 'cosec', 'csc', 'log', 'ln', 'lim', 'exp', 'det', 'max', 'min', 'mod', 'sinh', 'cosh', 'tanh'}
# Characters a Hindi rendering may add that the English source lacks.
HINDI_EXTRA = set(' ।॥,.?!:;-–—\'"‘’“”॰')
# Domain glossary applied to the English before translation (the model otherwise picks the wrong sense).
GLOSSARY = [
    (re.compile(r'\b(an?|the|each|one) article\b', re.I), r'\1 item', re.compile(r'[₹]|\b(sold|cost price|selling price|marked price|discount|profit|loss)\b', re.I)),
    (re.compile(r'\barticles\b', re.I), 'items', re.compile(r'[₹]|\b(sold|cost price|selling price|marked price|discount|profit|loss)\b', re.I)),
]


def prepare(text: str) -> str:
    for pattern, replacement, context in GLOSSARY:
        if context.search(text):
            text = pattern.sub(replacement, text)
    return text


def is_prose(text: str) -> bool:
    return bool(PROSE.search(text))


def is_mathy(core: str, previous: bool) -> bool:
    if not core:
        return False
    if PLACEHOLDER.search(core) or MATHY.search(core) or '_' in core or core in FUNCTIONS or re.search(r'\w\(', core):
        return True
    if re.fullmatch(r'[A-Za-z]', core) and (core not in ('a', 'A', 'I') or previous):
        return True
    # Abbreviations (CBI, GNP, RNA, CTET) stay in Latin script; the model otherwise copies them with invented letters ("GNPHI").
    if ACRONYM.fullmatch(core) and core not in EMPHASIS:
        return True
    if re.fullmatch('[/|·…:\\-–()]+', core):
        return True
    return previous and all(part in UNITS for part in re.split(r'[/·]', core))


def mask(text: str):
    """Replace math spans with <IDn> keys, the placeholder form IndicTrans2 was trained to copy verbatim."""
    out, mapping, span, prev = [], {}, [], False

    def flush():
        nonlocal span
        if span:
            raw = ''.join(span)
            joined = raw.rstrip()
            key = f'<ID{len(mapping) + 1}>'
            mapping[key] = joined
            out.append(key + raw[len(joined):])
            span = []

    tokens = [tok for tok in re.split(r'(\s+)', text) if tok]
    words = [tok for tok in tokens if not tok.isspace()]
    # "a", "A" and "I" are words, except right before an operator ("a = 21", "A + B").
    before_operator = {i for i, word in enumerate(words[:-1]) if re.match('[=<>≤≥+−×÷]', words[i + 1])}
    index = -1
    for tok in tokens:
        if not tok.isspace():
            index += 1
        if tok.isspace():
            (span if span else out).append(tok)
            continue
        lead, core, tail = EDGE.match(tok).groups()
        mathy = is_mathy(core, prev) or (index in before_operator and core in ('a', 'A', 'I'))
        if mathy:
            # Brackets stay inside the math span, so "(4 + 1)" is masked whole and never comes back unbalanced.
            lead, core, tail = MATH_EDGE.match(tok).groups()
        if mathy and not lead and not tail:
            span.append(tok)
        elif mathy:
            if lead:
                flush()
                out.append(lead)
            span.append(core)
            if tail:
                flush()
                out.append(tail)
        else:
            flush()
            out.append(tok)
        prev = mathy
    flush()
    return ''.join(out), mapping


def unmask(text: str, mapping: dict, masked_source: str) -> str:
    # The model may only copy Latin words that the masked source already contains (it otherwise invents "HI", transliterated keys, ...).
    text = re.sub(r'<\s*ID\s*(\d+)\s*[>′]', lambda m: f'<ID{m.group(1)}>', text)
    # Damaged keys the model writes when a key ends the sentence: "<ID1 ]", "<ID1 .", "<ID1 }", "< आई . डी . 1 .".
    text = re.sub(r'<\s*(?:ID|आई\s*\.?\s*डी)\s*\.?\s*(\d+)(?!\d)(?!\s*>)\s*[\]\}\.|।]?', lambda m: f'<ID{m.group(1)}>', text)
    allowed = set(re.findall(r'[A-Za-z]+', re.sub(r'<ID\d+>', ' ', masked_source)))
    if any(word not in allowed for word in re.findall(r'[A-Za-z]+', re.sub(r'<ID\d+>', ' ', text))):
        return text + BROKEN
    # The model writes a prime for "," or ")" after numbers: an open bracket makes it ")", otherwise ",".
    if '′' not in masked_source and '′' in text:
        fixed, depth = [], 0
        for ch in text:
            if ch == '(':
                depth += 1
            elif ch == ')':
                depth = max(0, depth - 1)
            elif ch == '′':
                ch = ')' if depth else ','
                depth = max(0, depth - 1)
            fixed.append(ch)
        text = ''.join(fixed)
    if '®' not in masked_source:
        text = text.replace('®', ',')
    if '_' not in masked_source:
        text = re.sub(r'\s_\s', ', ', text)
    if 'ḥ' not in masked_source:
        text = text.replace('ḥ', '')
    for key, value in mapping.items():
        if text.count(key) != 1:
            return text + BROKEN
        text = text.replace(key, value)
    return text


def prose_after_mask(text: str) -> bool:
    return is_prose(re.sub(r'<ID\d+>', ' ', mask(text)[0]))


def numbers(text: str) -> list[str]:
    return sorted(NUMBER.findall(text))


def postprocess(source: str, hindi: str) -> str:
    out = hindi.strip()
    out = re.sub(r'\s+([।?!,;:])', r'\1', out)
    out = re.sub('(?<=[ऀ-ॿ]) - (?=[ऀ-ॿ])', '-', out)
    out = re.sub(r'\(\s+', '(', out)
    out = re.sub(r'\s+\)', ')', out)
    src = source.rstrip()
    # The model doubles a bracket after a unit ("(kWh))") or drops the one that closes the sentence ("(23 pairs).").
    if '))' not in source and out.count(')') > source.count(')'):
        out = out.replace('))', ')')
    if (source.count('(') == source.count(')') and out.count('(') == out.count(')') + 1 and re.search(r'\)[.?!]?$', src)
            and ')' not in out[out.rfind('('):]):
        body = re.match(r'^(.*?)([।.?!]?)$', out, re.S)
        out = body.group(1).rstrip() + ')' + body.group(2)
    tail = src[-1:]
    if tail == '?' and not out.endswith('?'):
        out = out.rstrip('।.').rstrip() + '?'
    elif tail not in '.!?' and out.endswith('।'):
        out = out[:-1].rstrip()
    elif tail == '.' and not out.endswith(('।', '.', '?', '!')):
        out += '।'
    return out


def problems(source: str, hindi: str) -> list[str]:
    issues = []
    if not hindi.strip():
        issues.append('empty')
    if BROKEN in hindi or '<ID' in hindi or '⁇' in hindi:
        issues.append('mask')
    if prose_after_mask(source) and not DEVANAGARI.search(hindi):
        issues.append('no_devanagari')
    # Single-letter variables left outside the masks (text such as "point P") must survive.
    masked_source = mask(prepare(source))[0]
    # The "s" of a possessive or the "t" of a contraction ("A's", "don't") is not a variable.
    # Accented letters belong to the word ("Döbereiner"); "e-Shram", "i.e." and "e.g." are a prefix and abbreviations, not variables.
    scan = re.sub(r'(?<![A-Za-z])(?:i\.e\.|e\.g\.|e-(?=[A-Za-z]))', ' ', masked_source)
    for letter in set(re.findall(r'(?<![A-Za-zÀ-ɏ\'’])([B-HJ-Zb-z])(?![A-Za-zÀ-ɏ])', scan)):
        if not re.search(rf'(?<![A-Za-z]){letter}(?![A-Za-z])', hindi):
            issues.append('variable')
            break
    if numbers(source) != numbers(hindi):
        issues.append('numbers')
    if sorted(PLACEHOLDER.findall(source)) != sorted(PLACEHOLDER.findall(hindi)):
        issues.append('placeholders')
    if any(source.count(ch) != hindi.count(ch) for ch in OPERATORS):
        issues.append('symbols')
    if any(ch not in source and ch not in HINDI_EXTRA and not DEVANAGARI.match(ch) for ch in hindi):
        issues.append('stray')
    # Every formula-like token ("|A|", "nh/2π", "C₆H₁₂O₆", "x²") must survive verbatim; plain words may be translated.
    for token in re.findall(r"[^\s,;:?!()\[\]{}\"“”‘’]+", source):
        # A word suffix after a formula prefix may be translated ("β-D-ribose" → "β-D-राइबोस", "24-carat" → "24 कैरेट").
        token = re.sub(r"(?:-[A-Za-zÀ-ɏ]{2,})+$", "", token.strip(".'"))
        if token and re.search(r"[^A-Za-zÀ-ɏ0-9'’\-/&.…–—]", token) and token not in hindi:
            issues.append('math_tokens')
            break
    # Letter-by-letter transliteration ("एम . वी . आर .") is the model spelling out a formula it lost.
    if re.search(r'(?:[ऀ-ॿ]{1,7} \. ?){2,}', hindi) or re.search(r'(?<=[A-Za-z0-9]) [ऀ-ॿ]{1,7} \.(?= )', hindi):
        issues.append('spelled_out')
    ratio = len(hindi) / max(1, len(source))
    if len(source) > 12 and not 0.45 <= ratio <= 3.2:
        issues.append('length')
    words, source_words = hindi.split(), source.split()
    # A run the source itself repeats ("3d: ↑↓ ↑↓ ↑↓") is copied, not a decoding loop.
    repeated = lambda items: {items[i] for i in range(len(items) - 2) if items[i] == items[i + 1] == items[i + 2]}
    if repeated(words) - repeated(source_words):
        issues.append('repetition')
    return issues


def sentences(text: str) -> list[str]:
    return [piece for piece in re.split(r'(?<=[.!?])\s+(?=[A-Z0-9"(])|\n', text) if piece.strip()]


class Engine:
    def __init__(self):
        import ctranslate2
        import sentencepiece as spm
        self.src = spm.SentencePieceProcessor(model_file=str(MODEL / 'model.SRC'))
        self.tgt = spm.SentencePieceProcessor(model_file=str(MODEL / 'model.TGT'))
        self.model = ctranslate2.Translator(str(MODEL), device='cpu', compute_type='int8', inter_threads=2, intra_threads=5)

    def raw(self, texts: list[str], beam: int = 0) -> list[str]:
        beam = beam or BEAM
        if not texts:
            return []
        masked = [mask(prepare(text)) for text in texts]
        encoded = [['eng_Latn', 'hin_Deva'] + self.src.encode(m, out_type=str) for m, _ in masked]
        result = self.model.translate_batch(encoded, beam_size=beam, max_batch_size=48, max_decoding_length=320, repetition_penalty=1.05)
        return [unmask(self.tgt.decode(item.hypotheses[0]), mapping, m) for item, (m, mapping) in zip(result, masked)]

    def translate(self, texts: list[str]) -> list[tuple[str, list[str]]]:
        """Whole-string translation; failures are retried sentence by sentence, then greedily."""
        first = [postprocess(s, h) for s, h in zip(texts, self.raw(texts))]
        output = []
        for source, hindi in zip(texts, first):
            issues = problems(source, hindi)
            parts = sentences(source)
            if issues and len(parts) > 1:
                retry = postprocess(source, ' '.join(postprocess(p, h) for p, h in zip(parts, self.raw(parts))))
                if not problems(source, retry):
                    hindi, issues = retry, []
            if issues:
                retry = postprocess(source, self.raw([source], beam=1)[0])
                if not problems(source, retry):
                    hindi, issues = retry, []
            output.append((hindi, issues))
        return output


def save(path: Path, value) -> None:
    path.write_text(json.dumps(value, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')


def main():
    data = json.loads(INPUT.read_text(encoding='utf-8'))
    reviewed = json.loads(REVIEWED.read_text(encoding='utf-8')) if REVIEWED.exists() else {}
    drafts = json.loads(DRAFTS.read_text(encoding='utf-8')) if DRAFTS.exists() else {}
    rejected = json.loads(REJECTED.read_text(encoding='utf-8')) if REJECTED.exists() else {}
    if '--retry-rejected' in sys.argv:
        rejected = {}
    keep = set(data.get('keep', []))
    candidates = [s for s in dict.fromkeys(data['strings'] + data['ui']) if s not in keep and is_prose(s)]
    wanted = [s for s in candidates if prose_after_mask(s) or PLACEHOLDER.search(s)]
    no_prose = sorted(set(candidates) - set(wanted))
    if '--sample' in sys.argv:
        engine = Engine()
        sample = wanted[::max(1, len(wanted) // 24)][:24]
        for source, (hindi, issues) in zip(sample, engine.translate(sample)):
            print(json.dumps({'en': source, 'hi': hindi, 'issues': issues}, ensure_ascii=False), flush=True)
        return
    pending = sorted((s for s in wanted if s not in reviewed and s not in drafts and s not in rejected), key=len)
    print(json.dumps({'total': len(data['strings']), 'translatable': len(wanted), 'kept_english': len(keep), 'no_prose': len(no_prose),
                      'reviewed': sum(s in reviewed for s in wanted), 'pending': len(pending)}), flush=True)
    if pending and '--publish-only' not in sys.argv:
        engine, started, size = Engine(), time.monotonic(), 96
        for offset in range(0, len(pending), size):
            batch = pending[offset:offset + size]
            for source, (hindi, issues) in zip(batch, engine.translate(batch)):
                if issues:
                    rejected[source] = {'hi': hindi, 'issues': issues}
                else:
                    drafts[source] = hindi
            done = min(offset + size, len(pending))
            if (offset // size) % 5 == 0 or done == len(pending):
                save(DRAFTS, drafts)
                save(REJECTED, rejected)
                elapsed = time.monotonic() - started
                print(json.dumps({'completed': done, 'remaining': len(pending) - done, 'rejected': len(rejected), 'seconds': round(elapsed),
                                  'eta_min': round(elapsed / done * (len(pending) - done) / 60, 1)}), flush=True)
    if '--publish' not in sys.argv and '--publish-only' not in sys.argv:
        print('Drafts saved locally. Review, then publish with --publish.', flush=True)
        return
    merged = {**drafts, **reviewed}
    ui = {s: merged[s] for s in data['ui'] if s in merged}
    (ROOT / 'lib/locales/ui-hi.json').write_text(json.dumps(ui, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    # One shard per surface, so a page downloads only the Hindi for the pack it shows.
    out = ROOT / 'lib/locales/hi'
    out.mkdir(parents=True, exist_ok=True)
    for stale in out.glob('*.json'):
        stale.unlink()
    translated, names = set(), []
    for name, texts in sorted(data['shards'].items()):
        shard = {s: merged[s] for s in texts if s in merged and s not in keep}
        translated.update(shard)
        names.append(name)
        (out / f'{name}.json').write_text(json.dumps(shard, ensure_ascii=False, separators=(',', ':')) + '\n', encoding='utf-8')
    loaders = ',\n'.join(f'  {json.dumps(name)}: () => import("./{name}.json")' for name in names)
    (out / 'index.ts').write_text('/* Generated by scripts/translate-hindi-local.py --publish. Do not edit; edit lib/locales/hi-reviewed.json and republish. */\n'
                                  'export const HINDI_SHARDS: Record<string, () => Promise<{ default: Record<string, string> }>> = {\n' + loaders + ',\n};\n'
                                  'export type HindiShard = string;\n', encoding='utf-8')
    (out / 'skip.json').write_text(json.dumps(no_prose, ensure_ascii=False, indent=0) + '\n', encoding='utf-8')
    coverage = {'sourceHash': data['sourceHash'], 'sourceStrings': len(data['strings']), 'translatable': len(wanted), 'keptEnglish': len(keep),
                'noProse': len(no_prose), 'translatedStrings': len(translated), 'shards': len(names), 'uiStrings': len(data['ui']), 'uiTranslated': len(ui),
                'reviewedOverrides': len(reviewed), 'rejectedPendingReview': sum(s not in merged for s in wanted),
                'method': 'local IndicTrans2 (dist-200M, CTranslate2), math masked, validated; reviewed overrides win'}
    (out / 'coverage.json').write_text(json.dumps(coverage, indent=2) + '\n', encoding='utf-8')
    print(json.dumps(coverage), flush=True)


if __name__ == '__main__':
    main()
