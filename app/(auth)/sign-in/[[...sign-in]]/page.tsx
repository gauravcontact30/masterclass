import { AuthPage } from "@/components/auth-page";
import { authConfigured } from "@/lib/server/config";
export default function Page(){return <AuthPage mode="signin" enabled={authConfigured()} />;}
