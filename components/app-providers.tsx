"use client";
import { ClerkProvider } from "@clerk/nextjs";
import { enUS,hiIN } from "@clerk/localizations";
import { LanguageProvider,useLanguage } from "./language-provider";
function AuthProvider({children,enabled}:{children:React.ReactNode;enabled:boolean}) {
  const {language}=useLanguage();
  return enabled ? <ClerkProvider localization={language === "hi" ? hiIN : enUS} signInFallbackRedirectUrl="/dashboard" signUpFallbackRedirectUrl="/dashboard">{children}</ClerkProvider> : children;
}
export function AppProviders({children,authEnabled}:{children:React.ReactNode;authEnabled:boolean}) {return <LanguageProvider><AuthProvider enabled={authEnabled}>{children}</AuthProvider></LanguageProvider>;}
