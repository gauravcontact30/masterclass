import { notFound,redirect } from 'next/navigation';
import { Workspace } from '@/components/workspace';
import { ApiDetail } from '@/components/api-docs';
import { API_PACKAGES } from '@/lib/api-docs';
import { requireLearningUser as currentUser } from '@/lib/server/subscription-access';
import { authConfigured,billingConfigured,databaseConfigured } from '@/lib/server/config';
import styles from '@/components/api-docs.module.css';
export const dynamic='force-dynamic';
type Props={params:Promise<{packageId:string;name:string}>};
export async function generateMetadata({params}:Props) { const {packageId,name}=await params;return {title:`${name} · ${packageId} · API Learning`}; }
export default async function Page({params}:Props) {
  const user=(authConfigured() || process.env.NODE_ENV === "production")?await currentUser():null;
  if(authConfigured()&&!user) redirect('/sign-in');
  const {packageId,name}=await params;
  const pkg=API_PACKAGES.find(item=>item.id===packageId),entry=pkg?.entries.find(item=>item.name===name);
  if(!pkg||!entry) notFound();
  return <Workspace initialCategory="api-docs" authEnabled={authConfigured()} configured={databaseConfigured()} billingEnabled={billingConfigured()} userEmail={user?.email??null} notesContent={<div className={styles.root}><ApiDetail key={`${packageId}:${name}`} pkg={pkg} entry={entry} pathname="/dashboard/api-docs"/></div>}/>;
}
