import { API_PACKAGES, filterApiPackages } from "@/lib/api-docs";
import { PRO_TRACKS, trackById } from "@/lib/pro-learn/types";
import lessons from "@/lib/pro-learn/lessons.json";
import retired from "@/lib/retired-technologies.json";
import { clearRetiredTechnologyStorage } from "@/lib/retired-technology-storage";

test.each(retired)("%s has no package, learning track, dedicated lesson or search result",id=>{
  expect(API_PACKAGES.some(pkg=>pkg.id===id)).toBe(false);
  expect(PRO_TRACKS.some(track=>track.id===id)).toBe(false);
  expect(trackById(id)).toBeUndefined();
  expect(lessons.some(lesson=>lesson.track===id)).toBe(false);
  expect(filterApiPackages("",id,[],["s","p","x","d"])).toEqual([]);
});
test("cleans retired browser content without deleting unrelated learning progress",()=>{
  localStorage.clear();
  localStorage.setItem("masterclass:pro-track","django");
  localStorage.setItem("masterclass:lessons-generated",JSON.stringify([{track:"flask",title:"Old lesson"},{track:"react",title:"Keep"}]));
  localStorage.setItem("masterclass:quiz-history",JSON.stringify([{trackId:"rich"},{trackId:"python"}]));
  localStorage.setItem("masterclass:lessons-done",JSON.stringify(["tqdm:progress","react:hooks"]));
  localStorage.setItem("masterclass:api-detail:v1",JSON.stringify({"loguru:logger":{secret:"old"},"react:useState":{description:"keep"}}));
  localStorage.setItem("unrelated","preserved");
  clearRetiredTechnologyStorage(localStorage);
  expect(localStorage.getItem("masterclass:pro-track")).toBeNull();
  expect(JSON.parse(localStorage.getItem("masterclass:lessons-generated")!)).toEqual([{track:"react",title:"Keep"}]);
  expect(JSON.parse(localStorage.getItem("masterclass:quiz-history")!)).toEqual([{trackId:"python"}]);
  expect(JSON.parse(localStorage.getItem("masterclass:lessons-done")!)).toEqual(["react:hooks"]);
  expect(JSON.parse(localStorage.getItem("masterclass:api-detail:v1")!)).toEqual({"react:useState":{description:"keep"}});
  expect(localStorage.getItem("unrelated")).toBe("preserved");
});
