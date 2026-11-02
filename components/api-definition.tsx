"use client";

import { useMemo, useState, type CSSProperties } from "react";
import { Check, Copy, FileCode2, PackageOpen, Shapes } from "lucide-react";
import { importLines, isBuiltIn, kindInfo, normalizeCode } from "@/lib/annotate-code";
import { highlightLines, type CodeLanguage } from "@/lib/code-highlight";
import { KeyText } from "./key-text";
import styles from "./api-definition.module.css";

type Parameter = { name: string; type: string; description: string };

function CodeBlock({ code, language, label }: { code: string; language: CodeLanguage; label: string }) {
  const [copied, setCopied] = useState(false);
  const lines = useMemo(() => highlightLines(code, language), [code, language]);
  return (
    <div className={styles.code}>
      <div className={styles.codeBar}>
        <span className={styles.lights} aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
        <span className={styles.codeLabel}>{label}</span>
        <button
          type="button"
          className={styles.copy}
          aria-label={`Copy ${label}`}
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(code);
              setCopied(true);
              setTimeout(() => setCopied(false), 1800);
            } catch {}
          }}
        >
          {copied ? <Check size={13} aria-hidden="true" /> : <Copy size={13} aria-hidden="true" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre tabIndex={0} aria-label={label}>
        <code>
          {lines.map((line, index) => (
            <span className={styles.line} key={index}>
              <span className={styles.gutter} aria-hidden="true">
                {index + 1}
              </span>
              <span className={styles.text}>
                {line.length
                  ? line.map((token, part) => (
                      <span key={part} className={token.tone ? styles[token.tone] : undefined}>
                        {token.text}
                      </span>
                    ))
                  : " "}
              </span>
              {"\n"}
            </span>
          ))}
        </code>
      </pre>
    </div>
  );
}

/**
 * The reference half of the Definition section: what the identifier is, how
 * to import it and its complete syntax. The worked example is in the Example code section.
 */
export function ApiDefinitionCards({
  numberFrom = 0,
  name,
  kindLabel,
  status,
  packageName,
  signature,
  parameters,
  returns,
  code,
  language,
  missingSignature,
}: {
  /** How many numbered cards come before these, so one section counts straight through. */
  numberFrom?: number;
  name: string;
  kindLabel: string;
  status: string;
  packageName: string;
  signature: string;
  parameters: Parameter[];
  returns: string;
  code: string;
  language: CodeLanguage;
  missingSignature: string;
}) {
  const example = useMemo(() => (code ? normalizeCode(code, language) : ""), [code, language]);
  // An identifier reached through an alias (pl.lit) has no import of its own, so the example's imports stand in.
  const imports = useMemo(() => {
    if (!example) return [];
    const own = importLines(example, name);
    return own.length ? own : example.split("\n").filter(line => /^(?:import|from)\s/.test(line)).slice(0, 3);
  }, [example, name]);
  const builtIn = isBuiltIn(packageName);
  const kind = kindInfo(kindLabel, packageName, signature);
  const cleanSignature = signature ? normalizeCode(signature, language) : "";
  const syntax = cleanSignature
    ? [imports.join("\n"), cleanSignature].filter(Boolean).join("\n\n")
    : "";

  return (
    <div className={styles.cards} style={{ "--number-from": numberFrom } as CSSProperties}>
      <section className={styles.card} data-tone="violet" aria-labelledby="api-kind-title">
        <h3 id="api-kind-title" className={styles.cardTitle}>
          <span className={styles.cardIcon} aria-hidden="true">
            <Shapes size={15} />
          </span>
          What it is
        </h3>
        <p className={styles.kindLine}>
          <span className={styles.kindPill}>{kind.label}</span>
          <span>
            in <code>{packageName}</code>
          </span>
        </p>
        <p className={styles.cardText}>{kind.summary}</p>
        <dl className={styles.facts}>
          <div>
            <dt>Status</dt>
            <dd>{status}</dd>
          </div>
          <div>
            <dt>Parameters</dt>
            <dd>{parameters.length ? parameters.length : "None"}</dd>
          </div>
        </dl>
      </section>

      <section className={styles.card} data-tone="blue" aria-labelledby="api-import-title">
        <h3 id="api-import-title" className={styles.cardTitle}>
          <span className={styles.cardIcon} aria-hidden="true">
            <PackageOpen size={15} />
          </span>
          Import
        </h3>
        {imports.length ? (
          <>
            <CodeBlock code={imports.join("\n")} language={language} label="Dependency" />
            <p className={styles.cardText}>
              Add this line at the top of the file before using <code>{name}</code>.
            </p>
          </>
        ) : builtIn ? (
          <p className={styles.cardText}>
            <code>{name}</code> is built into the language, so no import is needed.
          </p>
        ) : (
          <p className={styles.cardText}>
            <code>{name}</code> comes from <code>{packageName}</code>.
          </p>
        )}
      </section>

      <section id="api-signature" className={`${styles.card} ${styles.wide}`} data-tone="sky" aria-labelledby="api-syntax-title">
        <h3 id="api-syntax-title" className={styles.cardTitle}>
          <span className={styles.cardIcon} aria-hidden="true">
            <FileCode2 size={15} />
          </span>
          Syntax
        </h3>
        {syntax ? <CodeBlock code={syntax} language={language} label={`${name} syntax`} /> : <p className={styles.cardText}>{missingSignature}</p>}
        {(parameters.length > 0 || returns) && (
          <div className={styles.parameters}>
            {parameters.map(parameter => (
              <div className={styles.parameter} key={parameter.name}>
                <p>
                  <b>{parameter.name}</b> <code>{parameter.type}</code>
                </p>
                <p>
                  <KeyText text={parameter.description} />
                </p>
              </div>
            ))}
            {returns && (
              <div className={styles.parameter}>
                <p>
                  <b>Returns</b>
                </p>
                <p>
                  <KeyText text={returns} />
                </p>
              </div>
            )}
          </div>
        )}
      </section>

    </div>
  );
}
