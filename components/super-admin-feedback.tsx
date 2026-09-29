import type { ReactNode } from "react";
import { Alert, AlertDescription } from "./ui/alert";
import { Skeleton } from "./ui/skeleton";
import { CircleCheck, CircleAlert } from "lucide-react";
import styles from "./super-admin-dashboard.module.css";
export function AdminError({children}:{children:ReactNode}) {
  return <Alert variant="destructive" className={styles.error}><AlertDescription>{children}</AlertDescription></Alert>;
}
export function AdminLoading({children}:{children:ReactNode}) {
  return <div role="status" className={styles.loading}><span>{children}</span><div className={styles.metrics}>{[0,1,2].map(id=><Skeleton key={id} className={styles.metricSkeleton}/>)}</div></div>;
}

export function AdminFormMessage({ message, success }: { message: string; success: boolean }) {
  if (!message) return null;
  const Icon = success ? CircleCheck : CircleAlert;
  return <Alert variant={success ? "default" : "destructive"} role={success ? "status" : "alert"} className={styles.formMessage} data-success={success || undefined}>
    <Icon aria-hidden="true" /><AlertDescription>{message}</AlertDescription>
  </Alert>;
}
