"use client";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useVisiblePlayback } from "./use-visible-playback";
import Image from "@/components/responsive-image";
import { ArrowLeft, ArrowRight, BookA, MessagesSquare, Pause, Play, Quote, Sparkles, Star, Workflow, FileCode2, MessageSquareQuote, type LucideIcon } from "lucide-react";
import { useLanguage } from "./language-provider";
import home from "./landing-home.module.css";
import frame from "./landing-section.module.css";
import styles from "./student-reviews.module.css";
// Fictional reviews requested for design. Keep the sample label until replaced with actual feedback.
// Portraits are AI-generated illustrations, never photographs, so no face is passed off as a reviewer's.
// Set `photo` on a review only once its file exists in public/images/reviews/ (a missing file would
// cost every visitor a 404); reviews without one show initials.
// Each sample names the dashboard area it describes, so the stories map onto what a member actually opens.
type Review={id:string;name:string;initials:string;photo?:string;focus:[string,string];area:{icon:LucideIcon;name:[string,string]};quote:[string,string];rating:number};
const samples:Review[]=[
  {id:"aditi",name:"Aditi S.",initials:"AS",focus:["Final-year B.Tech · Preparing for campus placements","अंतिम वर्ष B.Tech · कैंपस प्लेसमेंट की तैयारी"],area:{icon:BookA,name:["Word power","शब्द शक्ति"]},quote:["Twelve words a day sounded small, but hearing each one and reading it in a real sentence made them stick. The Hindi meaning helps when an English definition alone is not enough.","रोज़ बारह शब्द कम लगते थे, पर हर शब्द सुनकर और असली वाक्य में पढ़कर वे याद रह जाते हैं। जब केवल अंग्रेज़ी परिभाषा काफ़ी नहीं होती, तब हिन्दी अर्थ मदद करता है।"],rating:5},
  {id:"rohan",name:"Rohan M.",initials:"RM",focus:["Backend developer · System design rounds","बैकएंड डेवलपर · सिस्टम डिज़ाइन राउंड"],area:{icon:Workflow,name:["Workflow blueprints","वर्कफ़्लो ब्लूप्रिंट"]},quote:["The blueprints walk through a URL shortener or a rate limiter one decision at a time, then list the mistakes people make. Reading the most-asked questions right after is exactly how I revise.","ब्लूप्रिंट URL शॉर्टनर या रेट लिमिटर को एक-एक निर्णय के साथ समझाते हैं, फिर आम गलतियाँ बताते हैं। उसके तुरंत बाद सबसे ज़्यादा पूछे गए प्रश्न पढ़ना ही मेरा दोहराने का तरीका है।"],rating:5},
  {id:"meera",name:"Meera K.",initials:"MK",focus:["Frontend engineer · React and Next.js","फ़्रंटएंड इंजीनियर · React और Next.js"],area:{icon:FileCode2,name:["API Docs","API Docs"]},quote:["I keep API Docs open while I work. Finding a hook, its parameters and a short usage example in one place is quicker than jumping between three sites, and the link to the official page is always there.","काम करते समय मैं API Docs खुला रखती हूँ। एक ही जगह hook, उसके पैरामीटर और छोटा उदाहरण मिल जाना तीन साइटों के बीच घूमने से तेज़ है, और आधिकारिक पेज का लिंक हमेशा साथ होता है।"],rating:4},
  {id:"arjun",name:"Arjun P.",initials:"AP",focus:["Career switcher · First developer role","करियर बदलने वाले · पहली डेवलपर नौकरी"],area:{icon:MessagesSquare,name:["Interview prep","इंटरव्यू की तैयारी"]},quote:["I answer the subjective questions out loud first, then take the objective set on the same technology. Seeing where my spoken answer and the quiz disagree shows me what to study next.","मैं पहले विषयगत प्रश्नों के उत्तर बोलकर देता हूँ, फिर उसी तकनीक का वस्तुनिष्ठ सेट हल करता हूँ। जहाँ मेरा उत्तर और क्विज़ अलग निकलते हैं, वहीं से पता चलता है कि आगे क्या पढ़ना है।"],rating:5},
  {id:"sana",name:"Sana R.",initials:"SR",focus:["Data analyst · Moving into AI engineering","डेटा विश्लेषक · AI इंजीनियरिंग की ओर"],area:{icon:Sparkles,name:["AI & agentic pulse","AI और एजेंटिक हलचल"]},quote:["The pulse is my morning read. One card on LangGraph, one on RAG, one comparing two tools, each linked to its source, so I keep up with agents without losing an hour to news.","पल्स मेरी सुबह की पढ़ाई है। एक कार्ड LangGraph पर, एक RAG पर, एक दो टूल की तुलना पर, हर एक स्रोत से जुड़ा, ताकि बिना घंटा गँवाए एजेंटों की जानकारी बनी रहे।"],rating:5},
];
const subscribe=(notify:()=>void)=>{const query=window.matchMedia?.("(prefers-reduced-motion: reduce)");query?.addEventListener?.("change",notify);return()=>query?.removeEventListener?.("change",notify);};
const snapshot=()=>Boolean(window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches);

/**
 * Sample student stories: one large quote beside an index of every reviewer and the dashboard area their story is
 * about. It rotates every 5.5s, and stops while hovered, focused, paused or when reduced motion is preferred.
 */
export function StudentReviews(){
  const section=useRef<HTMLElement>(null);const visible=useVisiblePlayback(section);
  const {language}=useLanguage();const hi=language==="hi";const lang=hi?1:0;
  const reduced=useSyncExternalStore(subscribe,snapshot,()=>false);const [index,setIndex]=useState(0);const [paused,setPaused]=useState(false);const [hover,setHover]=useState(false);const [focus,setFocus]=useState(false);const rotating=visible&&!reduced&&!paused&&!hover&&!focus;
  useEffect(()=>{if(!rotating)return;const timer=setTimeout(()=>setIndex(value=>(value+1)%samples.length),5500);return()=>clearTimeout(timer);},[index,rotating]);
  return <section ref={section} id="reviews" className={frame.section} data-ground="paper" aria-label={hi?"नमूना छात्र समीक्षा":"Sample student reviews"} aria-roledescription="carousel" onMouseEnter={()=>setHover(true)} onMouseLeave={()=>setHover(false)} onFocus={()=>setFocus(true)} onBlur={event=>{if(!event.currentTarget.contains(event.relatedTarget))setFocus(false);}}><div className={home.inner}>
    <header className={frame.head}>
      <div>
        <p className={frame.kicker}><MessageSquareQuote size={14} aria-hidden="true"/>{hi?"छात्रों की कहानियाँ":"Student stories"}<span>{hi?"नमूना समीक्षाएँ":"Sample reviews"}</span></p>
        <h2>{hi?"छोटे कदम। ":"Small steps. "}<em>{hi?"बढ़ता आत्मविश्वास।":"Growing confidence."}</em></h2>
      </div>
      <p className={frame.lede}>{hi?"ये नमूना समीक्षाएँ दिखाती हैं कि डैशबोर्ड का हर क्षेत्र रोज़ की पढ़ाई में कैसे काम आ सकता है। ये असली छात्रों के उद्धरण नहीं हैं; असली प्रतिक्रिया मिलने पर इन्हें बदल दिया जाएगा।":"These sample stories show how each area of the dashboard can fit into a week of study. They are illustrations, not quotes from real students, and will be replaced with real feedback as it arrives."}</p>
    </header>
    <div className={styles.layout}>
      <div className={styles.stage}>
        <div className={styles.slides} aria-live={rotating?"off":"polite"}>{samples.map((item,i)=><div key={item.id} hidden={index!==i} role="group" aria-roledescription="slide" aria-label={hi?`नमूना समीक्षा ${i+1} / ${samples.length}`:`Sample review ${i+1} of ${samples.length}`} className={styles.card}>
          <div className={styles.cardTop}>
            <span className={styles.area}><item.area.icon size={14} aria-hidden="true"/>{item.area.name[lang]}</span>
            <div role="img" aria-label={hi?`नमूना रेटिंग ${item.rating} / 5`:`Sample rating ${item.rating} out of 5`} className={styles.stars}>{[1,2,3,4,5].map(star=><Star key={star} size={15} fill={star<=item.rating?"currentColor":"none"} aria-hidden="true"/>)}</div>
          </div>
          <Quote size={30} strokeWidth={1.4} aria-hidden="true" className={styles.mark}/>
          <blockquote>{item.quote[lang]}</blockquote>
          <div className={styles.profile}><Avatar item={item} tone={i%3} className={styles.avatar} size={56}/><div><strong>{item.name}</strong><span>{item.focus[lang]}</span></div></div>
        </div>)}</div>
        <div className={styles.controls}>
          <button type="button" aria-label={hi?"पिछली समीक्षा":"Previous review"} onClick={()=>setIndex(value=>(value+samples.length-1)%samples.length)}><ArrowLeft size={17}/></button>
          <span>{String(index+1).padStart(2,"0")} <i>/ {String(samples.length).padStart(2,"0")}</i></span>
          <button type="button" aria-label={hi?"अगली समीक्षा":"Next review"} onClick={()=>setIndex(value=>(value+1)%samples.length)}><ArrowRight size={17}/></button>
          <button type="button" aria-label={paused?hi?"समीक्षा चलाएँ":"Play reviews":hi?"समीक्षा रोकें":"Pause reviews"} onClick={()=>setPaused(value=>!value)}>{paused?<Play size={14}/>:<Pause size={14}/>}</button>
          {rotating&&<span key={index} className={styles.timer} aria-hidden="true"/>}
        </div>
      </div>
      <div className={styles.index} role="group" aria-label={hi?"समीक्षा चुनें":"Choose a review"}>{samples.map((item,i)=><button type="button" key={item.id} aria-pressed={index===i} onClick={()=>setIndex(i)}>
        <Avatar item={item} tone={i%3} className={styles.selectorAvatar} size={40}/>
        <span className={styles.who}><b>{item.name}</b><small>{item.focus[lang]}</small></span>
        <span className={styles.whoArea}><item.area.icon size={15} aria-hidden="true"/><span>{item.area.name[lang]}</span></span>
      </button>)}</div>
    </div>
  </div></section>;
}

function Avatar({item,tone,className,size}:{item:Review;tone:number;className?:string;size:number}){
  return <span className={className} data-tone={tone} data-photo={item.photo?"":undefined} aria-hidden="true">
    {item.photo?<Image src={item.photo} alt="" width={size} height={size}/>:item.initials}
  </span>;
}
