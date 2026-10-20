"use client"

import { Toaster as Sonner, type ToasterProps } from "sonner"
import { CircleCheckIcon, InfoIcon, TriangleAlertIcon, OctagonXIcon, Loader2Icon } from "lucide-react"
import styles from "./sonner.module.css"

/**
 * The app's toaster, styled in the site's paper-and-clay palette (sonner.module.css). The site is light-only and
 * has no theme provider, so the theme is pinned: following the OS would paint dark toasts on the light pages.
 */
const Toaster = ({ ...props }: ToasterProps) => (
  <Sonner
    theme="light"
    className="toaster group"
    icons={{
      success: <CircleCheckIcon className="size-4" aria-hidden="true" />,
      info: <InfoIcon className="size-4" aria-hidden="true" />,
      warning: <TriangleAlertIcon className="size-4" aria-hidden="true" />,
      error: <OctagonXIcon className="size-4" aria-hidden="true" />,
      loading: <Loader2Icon className="size-4 animate-spin" aria-hidden="true" />,
    }}
    toastOptions={{
      unstyled: true,
      classNames: {
        toast: styles.toast,
        icon: styles.icon,
        content: styles.content,
        title: styles.title,
        description: styles.description,
        closeButton: styles.closeButton,
        actionButton: styles.actionButton,
        success: styles.success,
        error: styles.error,
        warning: styles.warning,
        info: styles.info,
        default: styles.default,
      },
    }}
    {...props}
  />
)

export { Toaster }
