import { redirect } from 'next/navigation';
import { Workspace } from '@/components/workspace';
import { ApiDetail } from '@/components/api-docs';
import { ApiEntryLocked } from '@/components/api-tech-guide';
import { API_PACKAGES } from '@/lib/api-docs';
import { authConfigured,billingConfigured,databaseConfigured } from '@/lib/server/config';
import styles from '@/components/api-docs.module.css';
import { isSuperAdminUser } from "@/lib/study/preparations";
import { storedApiPage } from "@/lib/server/api-detail-store";
import { apiPreview } from "@/lib/server/api-previews";
import { learningViewer } from "@/lib/server/subscription-access";
// Signed-in page: renders once the user is read, like its layout (instant = false there does not cover pages).
export const instant = false;
type Props={params:Promise<{packageId:string;name:string}>};
export async function generateMetadata({params}:Props) { const {packageId,name}=await params;return {title:`${name} · ${packageId} · API Learning`}; }
export default async function Page({params}:Props) {
  const {packageId,name}=await params;
  const viewer=(authConfigured() || process.env.NODE_ENV === "production")?await learningViewer(`/learning/api-docs/${packageId}/${name}`):null;
  const pkg=API_PACKAGES.find(item=>item.id===packageId),entry=pkg?.entries.find(item=>item.name===name);
  // An entry renamed or removed since a link was shared opens the API Docs instead of a dead end.
  if(!pkg||!entry) redirect('/learning/api-docs');
  const member=viewer?.member??true;
  // A non-member's page is built without reading the stored content, so none of it can reach their browser.
  const content=member
    ?<ApiDetail key={`${packageId}:${name}`} pkg={pkg} entry={entry} pathname="/learning/api-docs" page={await storedApiPage(pkg,entry)}/>
    :<ApiEntryLocked pkg={pkg} entry={entry} preview={apiPreview(pkg).find(item=>item.name===entry.name)}/>;
  return <Workspace initialCategory="api-docs" authEnabled={authConfigured()} configured={databaseConfigured()} billingEnabled={billingConfigured()} userEmail={viewer?.user.email??null} initialSuperAdmin={isSuperAdminUser(viewer?.user??null)} notesContent={<div className={styles.root}>{content}</div>}/>;
}
