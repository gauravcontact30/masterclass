import { notFound } from "next/navigation";
import { Workspace } from "@/components/workspace";
import { STUDY_COURSES } from "@/lib/study/catalog";
export default function DashboardReview(){
  if(process.env.NODE_ENV!=="development")notFound();
  return <Workspace authEnabled configured={false} billingEnabled={false} initialStudyCourses={STUDY_COURSES} initialCategory="cbse" initialPreparation="cbse-10" initialAccount={{profile:{language:"en"},account:{tier:"yearly",used:0,limit:50,subscription:null,creditBalance:0},preparations:{isSuperAdmin:true,selections:[]},documents:[],progress:[]}}/>;
}
