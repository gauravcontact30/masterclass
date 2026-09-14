import { documentKey,entitlementTier,monthKey,requestSchema,progressSchema } from "@/lib/domain";
const input={technologyId:"javascript",topicId:"js-functions",format:"pdf",language:"en",level:"beginner",theme:"minimal"} as const;
test("document reuse isolates format, language, level, theme and content versions",()=>{const keys=[documentKey(input,1),documentKey({...input,language:"hi"},1),documentKey({...input,format:"pptx"},1),documentKey({...input,level:"advanced"},1),documentKey({...input,theme:"cyberpunk"},1),documentKey(input,2)];expect(new Set(keys).size).toBe(keys.length);});
test("rejects client-supplied ownership and unsupported choices",()=>{expect(requestSchema.safeParse({...input,user_id:"victim"}).success).toBe(false);expect(requestSchema.safeParse({...input,format:"html"}).success).toBe(false);});
test("grants access only for verified paid periods or bounded payment grace",()=>{const now=Date.parse("2026-09-08T00:00:00Z");const base={tier:"yearly" as const,current_period_end:"2026-10-01T00:00:00Z"};expect(entitlementTier({...base,status:"created"},now)).toBe("free");expect(entitlementTier({...base,status:"active"},now)).toBe("yearly");expect(entitlementTier({...base,status:"cancelled"},now)).toBe("yearly");expect(entitlementTier({...base,status:"active",current_period_end:"2026-09-01"},now)).toBe("free");expect(entitlementTier({...base,status:"pending",grace_until:"2026-09-09"},now)).toBe("yearly");expect(entitlementTier({...base,status:"pending",grace_until:"2026-09-07"},now)).toBe("free");});
test("uses UTC calendar month boundaries",()=>{expect(monthKey(new Date("2026-10-01T00:30:00+05:30"))).toBe("2026-09-01");});

test("allows notes as a first-class generation format",()=>{expect(requestSchema.safeParse({...input,format:"notes"}).success).toBe(true);expect(documentKey({...input,format:"notes"},1)).not.toBe(documentKey(input,1));});

test("saves progress and bookmarks throughout long default guides",()=>{
 const progress={page:530,completed:false,bookmarks:[1,501,530],notes:""};
 expect(progressSchema.safeParse(progress).success).toBe(true);
 expect(progressSchema.safeParse({...progress,page:901}).success).toBe(false);
 expect(progressSchema.safeParse({...progress,bookmarks:[901]}).success).toBe(false);
});
