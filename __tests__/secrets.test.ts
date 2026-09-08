/** @jest-environment node */
import { createHmac } from "node:crypto";
import { verifyHmac,encrypt,decrypt } from "@/lib/server/secrets";
test("validates the exact signed body and rejects altered payloads",()=>{const body='{"status":"active"}';const sig=createHmac("sha256","test-secret").update(body).digest("hex");expect(verifyHmac(body,sig,"test-secret")).toBe(true);expect(verifyHmac(body+" ",sig,"test-secret")).toBe(false);expect(verifyHmac(body,"x","test-secret")).toBe(false);});
test("encrypts credentials with authentication and unique nonces",()=>{process.env.INTEGRATION_ENCRYPTION_KEY=Buffer.alloc(32,7).toString("base64");const a=encrypt("access-token");expect(a).not.toContain("access-token");expect(a).not.toBe(encrypt("access-token"));expect(decrypt(a)).toBe("access-token");const changed=Buffer.from(a,"base64");changed[15]^=1;expect(()=>decrypt(changed.toString("base64"))).toThrow();});
