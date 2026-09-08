"use client";
import { SignIn,SignUp } from "@clerk/nextjs";
import Link from "next/link";
import { useLanguage } from "./language-provider";
export function AuthPage({mode,enabled}:{mode:"signin"|"signup";enabled:boolean}){const {t}=useLanguage();return <main className="auth-page"><Link className="wordmark" href="/">masterclass<span>✦</span></Link>{enabled ? mode==="signin" ? <SignIn /> : <SignUp /> : <section className="panel"><h1>{t("setupTitle")}</h1><p>{t("setupHelp")}</p><Link href="/">{t("dashboard")}</Link></section>}</main>;}
