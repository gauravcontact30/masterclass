import { AuthPage } from "@/components/auth-page";
import { authConfigured } from "@/lib/server/config";
export const dynamic="force-dynamic";
export default function Page(){return <AuthPage mode="signup" enabled={authConfigured()} />;}
