import { AuthPage } from "@/components/auth-page";
import { authConfigured } from "@/lib/server/config";
export const dynamic="force-dynamic";
export default async function Page({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }){
  const email=(await searchParams).email;
  return <AuthPage mode="signin" enabled={authConfigured()} initialEmail={typeof email==="string"?email.slice(0,254):""} />;
}
