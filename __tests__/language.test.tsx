import { render,screen,waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LanguageProvider,useLanguage } from "@/components/language-provider";
import { en,hi } from "@/lib/i18n";
function Probe(){const {language,setLanguage,t}=useLanguage();return <><h1>{t("welcome")}</h1><button onClick={()=>setLanguage(language==="en"?"hi":"en")}>Switch</button></>;}
test("all visible translation keys have Hindi strings",()=>{expect(Object.keys(hi).sort()).toEqual(Object.keys(en).sort());expect(Object.values(hi).every(Boolean)).toBe(true);});
test("defaults to English, updates document lang and persists Hindi",async()=>{localStorage.clear();global.fetch=jest.fn().mockResolvedValue({ok:true});render(<LanguageProvider><Probe/></LanguageProvider>);expect(screen.getByRole("heading")).toHaveTextContent(en.welcome);await userEvent.click(screen.getByRole("button"));expect(screen.getByRole("heading")).toHaveTextContent(hi.welcome);expect(localStorage.getItem("masterclass:language")).toBe("hi");await waitFor(()=>expect(document.documentElement.lang).toBe("hi"));expect(fetch).toHaveBeenCalledWith("/api/account",expect.objectContaining({body:JSON.stringify({language:"hi"})}));});
