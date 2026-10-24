"use client";

import { useActionState } from "react";
import { useForm, getFormProps, getInputProps, getSelectProps } from "@conform-to/react";
import { parseWithZod } from "@conform-to/zod/v4";
import { z } from "zod";
import { Search, Send, Sparkles, AlertCircle, CheckCircle2 } from "lucide-react";
import { useLanguage } from "./language-provider";
import styles from "./conform-form.module.css";

// 1. Zod Schema for Study Goal / Feedback
export const studyGoalSchema = z.object({
  topicName: z
    .string()
    .min(3, "Topic name must be at least 3 characters")
    .max(80, "Topic name must be under 80 characters"),
  targetCategory: z.enum(
    ["technology", "ai", "cloud", "system-design", "interview", "certification", "general"] as const
  ),
  dailyMinutes: z.coerce
    .number()
    .min(15, "Minimum 15 minutes required")
    .max(480, "Maximum 480 minutes per day"),
});

export type StudyGoalValues = z.infer<typeof studyGoalSchema>;

type FormState = {
  status: "idle" | "success" | "error";
  message?: string;
  data?: StudyGoalValues;
};

/**
 * Server Action simulator for Conform form submission with Zod validation
 */
async function submitStudyGoalAction(prevState: FormState, formData: FormData): Promise<FormState> {
  const submission = parseWithZod(formData, { schema: studyGoalSchema });

  if (submission.status !== "success") {
    return {
      status: "error",
      message: "Please correct the highlighted validation errors.",
    };
  }

  // Simulate persistent save to Redis/Database
  return {
    status: "success",
    message: `Study goal for "${submission.value.topicName}" successfully set!`,
    data: submission.value,
  };
}

/**
 * Conform & Zod Powered Study Goal & Topic Plan Form
 */
export function ConformStudyGoalForm({ defaultCategory = "technology" }: { defaultCategory?: string }) {
  const { language } = useLanguage();
  const hi = language === "hi";

  const [state, formAction, isPending] = useActionState(submitStudyGoalAction, {
    status: "idle",
  });

  const [form, fields] = useForm<StudyGoalValues>({
    defaultValue: {
      topicName: "",
      targetCategory: (["technology", "cbse", "icse", "ssc", "banking", "railways", "defence", "upsc", "general"].includes(defaultCategory)
        ? defaultCategory
        : "technology") as StudyGoalValues["targetCategory"],
      dailyMinutes: 45,
    },
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: studyGoalSchema });
    },
    shouldValidate: "onBlur",
    shouldRevalidate: "onInput",
  });

  return (
    <div className={styles.formContainer} aria-label={hi ? "कन्फॉर्म अध्ययन लक्ष्य फॉर्म" : "Conform Study Goal Form"}>
      <div className={styles.formHeader}>
        <div className={styles.headerIcon}>
          <Sparkles size={16} aria-hidden="true" />
        </div>
        <div>
          <h3 className={styles.formTitle}>
            {hi ? "लक्ष्य आधारित अध्ययन योजना (Conform & Zod)" : "Target-Based Study Planner (Conform & Zod)"}
          </h3>
          <p className={styles.formSubtitle}>
            {hi
              ? "टाइप-सुरक्षित फॉर्म सत्यापन के साथ अपने दैनिक अध्ययन लक्ष्य निर्धारित करें।"
              : "Set your daily study objectives with type-safe schema validation."}
          </p>
        </div>
      </div>

      {state.status === "success" && (
        <div className={styles.successBanner} role="status">
          <CheckCircle2 size={16} className={styles.successIcon} aria-hidden="true" />
          <span>{state.message}</span>
        </div>
      )}

      {state.status === "error" && (
        <div className={styles.errorBanner} role="alert">
          <AlertCircle size={16} className={styles.errorIcon} aria-hidden="true" />
          <span>{state.message}</span>
        </div>
      )}

      <form {...getFormProps(form)} action={formAction} className={styles.formBody}>
        {/* Topic Name Field */}
        <div className={styles.fieldGroup}>
          <label htmlFor={fields.topicName.id} className={styles.label}>
            {hi ? "विषय या तकनीक का नाम" : "Topic or Technology Name"}
          </label>
          <div className={styles.inputWrapper}>
            <Search size={15} className={styles.fieldIcon} aria-hidden="true" />
            <input
              {...getInputProps(fields.topicName, { type: "text" })}
              placeholder={hi ? "उदा. Next.js App Router, न्यूटन के गति नियम" : "e.g. Next.js App Router, Docker Microservices"}
              className={styles.textInput}
            />
          </div>
          {fields.topicName.errors && (
            <p id={fields.topicName.errorId} className={styles.fieldError}>
              {fields.topicName.errors[0]}
            </p>
          )}
        </div>

        <div className={styles.dualRow}>
          {/* Target Category Select */}
          <div className={styles.fieldGroup}>
            <label htmlFor={fields.targetCategory.id} className={styles.label}>
              {hi ? "श्रेणी" : "Category"}
            </label>
            <select
              {...getSelectProps(fields.targetCategory)}
              className={styles.selectInput}
            >
              <option value="technology">{hi ? "तकनीक एवं इंजीनियरिंग" : "Technology & Engineering"}</option>
              <option value="ai">{hi ? "AI और एजेंट" : "AI & agents"}</option>
              <option value="cloud">{hi ? "क्लाउड और DevOps" : "Cloud & DevOps"}</option>
              <option value="system-design">{hi ? "सिस्टम डिज़ाइन" : "System Design"}</option>
              <option value="interview">{hi ? "इंटरव्यू की तैयारी" : "Interview preparation"}</option>
              <option value="certification">{hi ? "सर्टिफ़िकेशन" : "Certifications"}</option>
            </select>
            {fields.targetCategory.errors && (
              <p id={fields.targetCategory.errorId} className={styles.fieldError}>
                {fields.targetCategory.errors[0]}
              </p>
            )}
          </div>

          {/* Daily Minutes Input */}
          <div className={styles.fieldGroup}>
            <label htmlFor={fields.dailyMinutes.id} className={styles.label}>
              {hi ? "दैनिक अध्ययन लक्ष्य (मिनट)" : "Daily Target (Minutes)"}
            </label>
            <input
              {...getInputProps(fields.dailyMinutes, { type: "number" })}
              min={15}
              max={480}
              step={15}
              className={styles.numberInput}
            />
            {fields.dailyMinutes.errors && (
              <p id={fields.dailyMinutes.errorId} className={styles.fieldError}>
                {fields.dailyMinutes.errors[0]}
              </p>
            )}
          </div>
        </div>

        {/* Submit Button */}
        <div className={styles.actionsRow}>
          <button type="submit" disabled={isPending} className={styles.submitBtn}>
            <Send size={14} aria-hidden="true" />
            <span>
              {isPending
                ? hi
                  ? "सत्यापित हो रहा है…"
                  : "Validating…"
                : hi
                ? "लक्ष्य सहेजें"
                : "Save Study Target"}
            </span>
          </button>
        </div>
      </form>
    </div>
  );
}
