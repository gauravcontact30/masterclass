"use client";
import { ExpandedText } from "@/components/expanded-text";

import { useState } from "react";
import { Download, LoaderCircle } from "lucide-react";
import { errorKey } from "@/lib/client";
import { useLanguage } from "./language-provider";

export function DownloadLink({ href, filename, iconOnly = false }: { href: string; filename: string; iconOnly?: boolean }) {
  const { t } = useLanguage();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function download() {
    if (busy) return;
    setBusy(true); setError(null);
    try {
      const response = await fetch(href);
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error ?? "service_error");
      }
      const blob = await response.blob();
      if (!blob.size) throw new Error("not_ready");
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url; link.download = filename;
      document.body.appendChild(link); link.click(); link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (error) { setError(t(errorKey(error))); }
    finally { setBusy(false); }
  }
  return <span className="download-control"><a href={href} download={filename} title={busy ? t("loading") : t("download")} aria-label={busy ? t("loading") : t("download")} aria-disabled={busy} onClick={event => { event.preventDefault(); void download(); }}>{iconOnly ? busy ? <LoaderCircle size={17} aria-hidden="true" /> : <Download size={17} aria-hidden="true" /> : busy ? t("loading") : t("download")}</a>{error && <span className="inline-error" role="alert"><ExpandedText text={error} /></span>}</span>;
}
