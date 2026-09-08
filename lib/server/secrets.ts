import "server-only";
import { createCipheriv,createDecipheriv,randomBytes,timingSafeEqual,createHmac } from "node:crypto";
import { required } from "./config";
export function equalSecret(a:string,b:string) { const x=Buffer.from(a);const y=Buffer.from(b);return x.length===y.length && timingSafeEqual(x,y); }
export function verifyHmac(body:string,signature:string,secret:string) { return /^[a-f0-9]{64}$/i.test(signature) && equalSecret(createHmac("sha256",secret).update(body).digest("hex"),signature.toLowerCase()); }
function key() { const value=Buffer.from(required("INTEGRATION_ENCRYPTION_KEY"),"base64");if(value.length!==32)throw new Error("CONFIG:INTEGRATION_ENCRYPTION_KEY");return value; }
export function encrypt(value:string) {const iv=randomBytes(12);const cipher=createCipheriv("aes-256-gcm",key(),iv);const data=Buffer.concat([cipher.update(value,"utf8"),cipher.final()]);return Buffer.concat([iv,cipher.getAuthTag(),data]).toString("base64");}
export function decrypt(value:string) {const data=Buffer.from(value,"base64");const decipher=createDecipheriv("aes-256-gcm",key(),data.subarray(0,12));decipher.setAuthTag(data.subarray(12,28));return Buffer.concat([decipher.update(data.subarray(28)),decipher.final()]).toString("utf8");}
