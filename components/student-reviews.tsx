"use client";
import { useEffect, useState, useSyncExternalStore } from "react";
import Image from "next/image";
import { ArrowLeft, ArrowRight, Pause, Play, Quote, Star, BookOpen } from "lucide-react";
import { useLanguage } from "./language-provider";
import styles from "./student-reviews.module.css";
// Fictional reviews requested for design. Keep the sample label until replaced with actual feedback.
// Portraits are AI-generated illustrations, never photographs, so no face is passed off as a reviewer's.
// Set `photo` on a review only once its file exists in public/images/reviews/ (a missing file would
// cost every visitor a 404); reviews without one show initials.
type Review={id:string;name:string;initials:string;photo?:string;focus:[string,string];quote:[string,string];rating:number};
const samples:Review[]=[
  {id:"aditi",name:"Aditi S.",initials:"AS",focus:["Class 10 · School preparation","कक्षा 10 · स्कूल की तैयारी"],quote:["The worked examples help me understand how to reach an answer. I can revisit a tricky topic and practise until it starts to feel familiar.","हल किए हुए उदाहरणों से उत्तर तक पहुँचने का तरीका समझ आता है। कठिन विषय को दोबारा पढ़कर अभ्यास करना आसान लगता है।"],rating:5},
  {id:"rohan",name:"Rohan M.",initials:"RM",focus:["Technology & system design","तकनीक और सिस्टम डिज़ाइन"],quote:["Seeing the code alongside the explanation makes a big difference. I like connecting each lesson to how an application is put together.","व्याख्या के साथ कोड देखने से समझ बेहतर होती है। पाठ में सीखी बातों को किसी ऐप की बनावट से जोड़ना अच्छा लगता है।"],rating:5},
  {id:"meera",name:"Meera K.",initials:"MK",focus:["English & language practice","अंग्रेज़ी और भाषा अभ्यास"],quote:["I switch between English and Hindi whenever I need a little more clarity. Learning at my own pace makes difficult ideas feel more approachable.","बेहतर समझने के लिए अंग्रेज़ी और हिन्दी के बीच बदल लेती हूँ। अपनी गति से पढ़ने पर कठिन बातें भी आसान लगती हैं।"],rating:4},
  {id:"arjun",name:"Arjun P.",initials:"AP",focus:["Government exam preparation","सरकारी परीक्षा की तैयारी"],quote:["Having notes and practice in one place gives my study sessions a clear direction. I can focus on one topic, check my understanding and move to the next.","नोट्स और अभ्यास एक जगह होने से पढ़ाई की दिशा स्पष्ट रहती है। एक विषय पढ़कर अपनी समझ जाँचता हूँ, फिर आगे बढ़ता हूँ।"],rating:5},
  {id:"sana",name:"Sana R.",initials:"SR",focus:["Class 12 · Science foundations","कक्षा 12 · विज्ञान के आधार"],quote:["Breaking a topic into smaller lessons makes revision feel manageable. The explanations help me see the reasoning instead of only remembering a formula.","छोटे पाठों में पढ़ने से पुनरावृत्ति आसान लगती है। व्याख्या से केवल सूत्र याद करने के बजाय उसके पीछे का तर्क समझ आता है।"],rating:5},
];
const subscribe=(notify:()=>void)=>{const query=window.matchMedia?.("(prefers-reduced-motion: reduce)");query?.addEventListener?.("change",notify);return()=>query?.removeEventListener?.("change",notify);};
const snapshot=()=>Boolean(window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches);
export function StudentReviews(){
  const {language}=useLanguage();const hi=language==="hi";const lang=hi?1:0;
  const reduced=useSyncExternalStore(subscribe,snapshot,()=>false);const [index,setIndex]=useState(0);const [paused,setPaused]=useState(false);const [hover,setHover]=useState(false);const [focus,setFocus]=useState(false);const rotating=!reduced&&!paused&&!hover&&!focus;
  useEffect(()=>{if(!rotating)return;const timer=setTimeout(()=>setIndex(value=>(value+1)%samples.length),5500);return()=>clearTimeout(timer);},[index,rotating]);
  return <section id="reviews" className={styles.section} aria-label={hi?"नमूना छात्र समीक्षा":"Sample student reviews"} aria-roledescription="carousel" onMouseEnter={()=>setHover(true)} onMouseLeave={()=>setHover(false)} onFocus={()=>setFocus(true)} onBlur={event=>{if(!event.currentTarget.contains(event.relatedTarget))setFocus(false);}}>
    <div className={styles.intro}>
      <span className={styles.eyebrow}>{hi?"छात्रों की कहानियाँ · नमूना समीक्षाएँ":"STUDENT STORIES · SAMPLE REVIEWS"}</span>
      <h2>{hi?"छोटे कदम।":"Small steps."} <em>{hi?"बढ़ता आत्मविश्वास।":"Growing confidence."}</em></h2>
      <p>{hi?"स्कूल के विषयों से अगले करियर लक्ष्य तक — सीखने की हर यात्रा अलग होती है।":"From school subjects to your next career goal, every learning journey has its own story."}</p>
      <div className={styles.learningNote}><BookOpen size={19} aria-hidden="true"/><span>{hi?"आपकी गति। आपका अगला कदम।":"Your pace. Your next chapter."}</span></div>
      <div className={styles.controls}>
        <button type="button" aria-label={hi?"पिछली समीक्षा":"Previous review"} onClick={()=>setIndex(value=>(value+samples.length-1)%samples.length)}><ArrowLeft size={17}/></button>
        <span>{String(index+1).padStart(2,"0")} <i>/ {String(samples.length).padStart(2,"0")}</i></span>
        <button type="button" aria-label={hi?"अगली समीक्षा":"Next review"} onClick={()=>setIndex(value=>(value+1)%samples.length)}><ArrowRight size={17}/></button>
        <button type="button" aria-label={paused?hi?"समीक्षा चलाएँ":"Play reviews":hi?"समीक्षा रोकें":"Pause reviews"} onClick={()=>setPaused(value=>!value)}>{paused?<Play size={14}/>:<Pause size={14}/>}</button>
      </div>
    </div>
    <div className={styles.reviewArea}>
      <div aria-live={rotating?"off":"polite"}>{samples.map((item,i)=><article key={item.id} hidden={index!==i} role="group" aria-roledescription="slide" aria-label={hi?`नमूना समीक्षा ${i+1} / ${samples.length}`:`Sample review ${i+1} of ${samples.length}`} className={styles.card}>
        <div className={styles.reviewTop}><Quote size={34} strokeWidth={1.4} aria-hidden="true"/><div role="img" aria-label={hi?`नमूना रेटिंग ${item.rating} / 5`:`Sample rating ${item.rating} out of 5`} className={styles.stars}>{[1,2,3,4,5].map(star=><Star key={star} size={15} fill={star<=item.rating?"currentColor":"none"}/>)}</div></div>
        <blockquote>{item.quote[lang]}</blockquote>
        <div className={styles.profile}><Avatar item={item} tone={i%3} className={styles.avatar} size={96}/><div><strong>{item.name}</strong><span>{item.focus[lang]}</span></div><span className={styles.storyNumber} aria-hidden="true">{String(i+1).padStart(2,"0")}</span></div>
      </article>)}</div>
      <div className={styles.selectors} role="group" aria-label={hi?"समीक्षा चुनें":"Choose a review"}>{samples.map((item,i)=><button type="button" key={item.id} aria-label={hi?`${item.name} की नमूना समीक्षा`:`Read sample review by ${item.name}`} aria-pressed={index===i} onClick={()=>setIndex(i)}><Avatar item={item} tone={i%3} className={styles.selectorAvatar} size={52}/><span className={styles.selectorName}>{item.name.split(" ")[0]}</span></button>)}</div>
    </div>
  </section>;
}

function Avatar({item,tone,className,size}:{item:Review;tone:number;className?:string;size:number}){
  return <span className={className} data-tone={tone} data-photo={item.photo?"":undefined} aria-hidden="true">
    {item.photo?<Image src={item.photo} alt="" width={size} height={size}/>:item.initials}
  </span>;
}
