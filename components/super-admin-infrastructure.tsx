"use client";

import { useState, useEffect, useCallback } from "react";
import { useForm, getFormProps, getInputProps } from "@conform-to/react";
import { parseWithZod } from "@conform-to/zod/v4";
import { z } from "zod";
import {
  Database,
  Workflow,
  ShieldAlert,
  Flame,
  CheckCircle2,
  RefreshCw,
  Send,
  Zap,
  Server,
  Layers,
} from "lucide-react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { toast } from "sonner";
import styles from "./super-admin-infrastructure.module.css";

const inviteSchema = z.object({
  email: z.string().min(1, "Email is required").email("Please enter a valid email"),
  role: z.enum(["user", "pro", "admin"] as const),
});
type InviteValues = z.infer<typeof inviteSchema>;

export function SuperAdminInfrastructure() {
  const [loading, setLoading] = useState(true);
  const [statusError, setStatusError] = useState("");
  const [checkedAt, setCheckedAt] = useState<string | null>(null);
  const [flushing, setFlushing] = useState(false);
  const [warming, setWarming] = useState(false);
  const [status, setStatus] = useState<{
    redis?: { provider: string; status: string; ratelimitEnabled: boolean };
    inngest?: { appId: string; status: string; functions: string[] };
    arcjet?: { status: string; features: string[] };
    t3Env?: { nodeEnv: string; configuredKeys: string[] };
  } | null>(null);

  const loadStatus = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    try {
      const res = await fetch("/api/super-admin/integrations", { cache: "no-store", signal });
      if (!res.ok) throw new Error("Unable to check infrastructure configuration.");
      const json = await res.json();
      if (!signal?.aborted) { setStatus(json); setStatusError(""); setCheckedAt(new Date().toLocaleTimeString()); }
    } catch {
      if (!signal?.aborted) setStatusError("Infrastructure check failed. Previously loaded configuration may be out of date.");
    } finally { if (!signal?.aborted) setLoading(false); }
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    queueMicrotask(() => { if (!controller.signal.aborted) void loadStatus(controller.signal); });
    return () => controller.abort();
  }, [loadStatus]);

  async function handleFlushCache() {
    setFlushing(true);
    try {
      const res = await fetch("/api/super-admin/integrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "flush_cache" }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || "Redis cache cleared successfully");
      } else {
        toast.error(data.error || "Failed to flush cache");
      }
    } catch {
      toast.error("Network error clearing cache");
    } finally {
      setFlushing(false);
    }
  }

  async function handleWarmCache() {
    setWarming(true);
    try {
      const res = await fetch("/api/super-admin/integrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "trigger_warm_cache", category: "all" }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || "Inngest cache-warming event triggered");
      } else {
        toast.error(data.error || "Failed to queue Inngest event");
      }
    } catch {
      toast.error("Network error triggering Inngest");
    } finally {
      setWarming(false);
    }
  }

  const [form, fields] = useForm<InviteValues>({
    defaultValue: { email: "", role: "pro" },
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: inviteSchema });
    },
    onSubmit(e, { formData }) {
      e.preventDefault();
      const submission = parseWithZod(formData, { schema: inviteSchema });
      if (submission.status !== "success") return;

      void fetch("/api/super-admin/integrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "invite_user", ...submission.value }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            toast.success(data.message);
            form.reset();
          } else {
            toast.error(data.error || "Invite failed");
          }
        })
        .catch(() => toast.error("Invite error"));
    },
    shouldValidate: "onBlur",
    shouldRevalidate: "onInput",
  });

  // getInputProps includes the field's `key`; React needs it passed directly, ahead of the spread
  // (a key after a spread falls back to createElement, which flags the <option> children as an unkeyed list).
  const { key: emailKey, ...emailProps } = getInputProps(fields.email, { type: "email" });
  const { key: roleKey, ...roleProps } = getInputProps(fields.role, { type: "text" });

  return (
    <div className={styles.container}>
      <div className={styles.actionRow}>
        <p role="status">{loading ? "Checking configuration…" : checkedAt ? `Last checked ${checkedAt}. Configuration does not verify provider uptime.` : "Configuration not yet verified."}</p>
        <Button variant="outline" disabled={loading} onClick={() => void loadStatus()}>Refresh configuration</Button>
      </div>
      {statusError && <p role="alert">{statusError}</p>}
      {/* Overview Cards Grid */}
      <div className={styles.grid}>
        {/* Redis & Upstash Card */}
        <Card className={styles.techCard}>
          <div className={styles.cardHeader}>
            <div className={styles.iconWrap} style={{ background: "#fef2f2", color: "#dc2626" }}>
              <Database size={18} />
            </div>
            <div>
              <h3 className={styles.cardTitle}>Redis & Upstash Cache</h3>
              <p className={styles.cardSubtitle}>{status?.redis?.provider ?? "Upstash Redis / In-Memory"}</p>
            </div>
            <Badge variant="outline" className={styles.badgeSuccess}>
              <CheckCircle2 size={12} className={styles.inlineIcon} />
              {status?.redis?.status ?? "Unknown"}
            </Badge>
          </div>
          <div className={styles.cardBody}>
            <p className={styles.description}>
              High-throughput key-value caching with sliding-window rate limiting. Caches syllabus catalogs, user study progress, and search indexes with sub-5ms latency.
            </p>
            <div className={styles.featuresList}>
              <span className={styles.featurePill}>Upstash REST Client</span>
              <span className={styles.featurePill}>Sliding Window Rate Limit</span>
              <span className={styles.featurePill}>TTL Auto-Eviction</span>
            </div>
            <div className={styles.actionRow}>
              <Button
                variant="outline"
                size="sm"
                disabled={flushing || loading || !status || !!statusError}
                onClick={handleFlushCache}
                className={styles.actionBtn}
              >
                <RefreshCw size={13} className={flushing ? styles.spin : ""} />
                <span>{flushing ? "Flushing…" : "Flush Redis Cache"}</span>
              </Button>
            </div>
          </div>
        </Card>

        {/* Inngest Background Workflows Card */}
        <Card className={styles.techCard}>
          <div className={styles.cardHeader}>
            <div className={styles.iconWrap} style={{ background: "#f5f3ff", color: "#7c3aed" }}>
              <Workflow size={18} />
            </div>
            <div>
              <h3 className={styles.cardTitle}>Inngest Event Engine</h3>
              <p className={styles.cardSubtitle}>App ID: {status?.inngest?.appId ?? "masterclass"}</p>
            </div>
            <Badge variant="outline" className={styles.badgeSuccess}>
              <Zap size={12} className={styles.inlineIcon} />
              {status?.inngest?.status ?? "Unknown"}
            </Badge>
          </div>
          <div className={styles.cardBody}>
            <p className={styles.description}>
              Durable background workflow execution. Handles asynchronous AI curriculum generation, super-admin audit log persistence, and automated syllabus prefetching.
            </p>
            <div className={styles.featuresList}>
              <span className={styles.featurePill}>curriculum-generation</span>
              <span className={styles.featurePill}>user-audit-logger</span>
              <span className={styles.featurePill}>cache-warmer</span>
            </div>
            <div className={styles.actionRow}>
              <Button
                variant="outline"
                size="sm"
                disabled={warming || loading || !status || !!statusError}
                onClick={handleWarmCache}
                className={styles.actionBtn}
              >
                <Flame size={13} className={warming ? styles.spin : ""} />
                <span>{warming ? "Queuing…" : "Queue Inngest Cache-Warm Job"}</span>
              </Button>
            </div>
          </div>
        </Card>

        {/* Arcjet Security & Bot Defense Card */}
        <Card className={styles.techCard}>
          <div className={styles.cardHeader}>
            <div className={styles.iconWrap} style={{ background: "#ecfdf5", color: "#059669" }}>
              <ShieldAlert size={18} />
            </div>
            <div>
              <h3 className={styles.cardTitle}>Arcjet Security Shield</h3>
              <p className={styles.cardSubtitle}>Bot Defense & Attack Shield</p>
            </div>
            <Badge variant="outline" className={styles.badgeSuccess}>
              <CheckCircle2 size={12} className={styles.inlineIcon} />
              {status?.arcjet?.status ?? "Unknown"}
            </Badge>
          </div>
          <div className={styles.cardBody}>
            <p className={styles.description}>
              Comprehensive edge security shield inspecting incoming HTTP traffic for malicious scraping bots, OWASP Top 10 exploits, and burst request flooding.
            </p>
            <div className={styles.featuresList}>
              <span className={styles.featurePill}>Bot Detection (Search Allowed)</span>
              <span className={styles.featurePill}>Shield Attack Defense</span>
              <span className={styles.featurePill}>Sliding Window Rate Limit (100 req/60s)</span>
            </div>
          </div>
        </Card>

        {/* T3 Environment Configuration Card */}
        <Card className={styles.techCard}>
          <div className={styles.cardHeader}>
            <div className={styles.iconWrap} style={{ background: "#eff6ff", color: "#2563eb" }}>
              <Server size={18} />
            </div>
            <div>
              <h3 className={styles.cardTitle}>T3 Environment</h3>
              <p className={styles.cardSubtitle}>@t3-oss/env-nextjs</p>
            </div>
            <Badge variant="outline" className={styles.badgeSuccess}>
              <Layers size={12} className={styles.inlineIcon} />
              {status?.t3Env?.nodeEnv ?? "Unknown"}
            </Badge>
          </div>
          <div className={styles.cardBody}>
            <p className={styles.description}>
              Strict, compile-time and runtime validation of environment variables via Zod. Prevents deployment misconfigurations and protects secrets from leaking to client bundles.
            </p>
            <div className={styles.featuresList}>
              <span className={styles.featurePill}>Runtime Zod Type-Checking</span>
              <span className={styles.featurePill}>Client/Server Variable Separation</span>
              <span className={styles.featurePill}>Fail-Fast Boot Safeguards</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Conform & Zod Fast User Invitation Form */}
      <Card className={styles.invitePanel}>
        <div className={styles.inviteHeader}>
          <div className={styles.iconWrap} style={{ background: "#fff7ed", color: "#ea580c" }}>
            <Send size={18} />
          </div>
          <div>
            <h3 className={styles.inviteTitle}>Invite User or Grant Tier (Conform & Zod)</h3>
            <p className={styles.inviteSubtitle}>
              Type-safe form submission with instant client-side validation and server-side Zod parsing.
            </p>
          </div>
        </div>

        <form {...getFormProps(form)} className={styles.inviteForm}>
          <div className={styles.formRow}>
            <div className={styles.inputGroup}>
              <label htmlFor={fields.email.id} className={styles.label}>
                User Email Address
              </label>
              <input
                key={emailKey}
                {...emailProps}
                placeholder="colleague@domain.com"
                className={styles.textInput}
              />
              {fields.email.errors && (
                <p id={fields.email.errorId} className={styles.fieldError}>
                  {fields.email.errors[0]}
                </p>
              )}
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor={fields.role.id} className={styles.label}>
                Assigned Role / Tier
              </label>
              <select
                key={roleKey}
                {...roleProps}
                className={styles.selectInput}
              >
                <option value="pro">Pro Learner (All Categories & Features)</option>
                <option value="user">Free Tier</option>
                <option value="admin">Super Administrator</option>
              </select>
              {fields.role.errors && (
                <p id={fields.role.errorId} className={styles.fieldError}>
                  {fields.role.errors[0]}
                </p>
              )}
            </div>

            <div className={styles.submitWrap}>
              <Button type="submit" className={styles.submitBtn}>
                <Send size={14} />
                <span>Send Invitation</span>
              </Button>
            </div>
          </div>
        </form>
      </Card>
    </div>
  );
}
