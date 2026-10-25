import { redirect } from 'next/navigation';
import { Workspace } from '@/components/workspace';
import { ApiDetail } from '@/components/api-docs';
import { API_PACKAGES } from '@/lib/api-docs';
import { requireLearningUser as currentUser } from '@/lib/server/subscription-access';
import { authConfigured,billingConfigured,databaseConfigured } from '@/lib/server/config';
import styles from '@/components/api-docs.module.css';
type Props={params:Promise<{packageId:string;name:string}>};
export async function generateMetadata({params}:Props) { const {packageId,name}=await params;return {title:`${name} · ${packageId} · API Learning`}; }
export default async function Page({params}:Props) {
  const user=(authConfigured() || process.env.NODE_ENV === "production")?await currentUser():null;
  if(authConfigured()&&!user) redirect('/sign-in');
  const {packageId,name}=await params;
  const pkg=API_PACKAGES.find(item=>item.id===packageId),entry=pkg?.entries.find(item=>item.name===name);
  // An entry renamed or removed since a link was shared opens the API Docs instead of a dead end.
  if(!pkg||!entry) redirect('/learning/api-docs');
  return <Workspace initialCategory="api-docs" authEnabled={authConfigured()} configured={databaseConfigured()} billingEnabled={billingConfigured()} userEmail={user?.email??null} notesContent={<div className={styles.root}><ApiDetail key={`${packageId}:${name}`} pkg={pkg} entry={entry} pathname="/learning/api-docs"/></div>}/>;
}
