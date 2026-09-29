export type HighlightPoint = {
  id: string;
  iconName: string;
  title: { en: string; hi: string };
  description: { en: string; hi: string };
};

export type LearningInfo = {
  strategyTitle: { en: string; hi: string };
  strategySteps: Array<{ en: string; hi: string }>;
  learningOutcome: { en: string; hi: string };
  proTip?: { en: string; hi: string };
  quickTags?: Array<{ en: string; hi: string }>;
};

export type PageHighlightConfig = {
  id: string;
  badge: { en: string; hi: string };
  heading: { en: string; hi: string };
  subheading: { en: string; hi: string };
  tone: {
    bg: string;
    ink: string;
    border: string;
    badgeBg: string;
    badgeInk: string;
  };
  keyPoints: HighlightPoint[];
  learningInfo: LearningInfo;
};

export const PAGE_HIGHLIGHTS: Record<string, PageHighlightConfig> = {
  // Main User Dashboard
  dashboard: {
    id: "dashboard",
    badge: { en: "Study Dashboard", hi: "अध्ययन डैशबोर्ड" },
    heading: { en: "Key Points & Learning Highlights", hi: "मुख्य बिंदु एवं शिक्षण हाइलाइट्स" },
    subheading: {
      en: "Your centralized learning workspace with bilingual curricula, guided roadmaps, and AI study tools.",
      hi: "द्विभाषी पाठ्यक्रम, निर्देशित रोडमैप और एआई अध्ययन उपकरणों के साथ आपका मुख्य शिक्षण केंद्र।"
    },
    tone: {
      bg: "#faf8f2",
      ink: "#6b5114",
      border: "#ede4cb",
      badgeBg: "#f5e8be",
      badgeInk: "#5e450d"
    },
    keyPoints: [
      {
        id: "curated-paths",
        iconName: "compass",
        title: { en: "Targeted Learning Paths", hi: "लक्षित अध्ययन पथ" },
        description: {
          en: "Comprehensive syllabus tracks for School (CBSE, ICSE, NCERT), Competitive Exams (SSC, Banking, Railways, Defence), and Professional Engineering.",
          hi: "स्कूल (CBSE, ICSE, NCERT), प्रतियोगी परीक्षाओं (SSC, बैंकिंग, रेलवे, रक्षा) और तकनीकी करियर के लिए केंद्रित अध्ययन पथ।"
        }
      },
      {
        id: "bilingual-native",
        iconName: "languages",
        title: { en: "Bilingual English & Hindi", hi: "अंग्रेजी और हिन्दी में समान पकड़" },
        description: {
          en: "Every lesson, note, and worked example is crafted with seamless English and Hindi toggle for intuitive concept clarity.",
          hi: "प्रत्येक पाठ, नोट्स और अभ्यास उदाहरण अंग्रेजी व हिन्दी में उपलब्ध हैं ताकि अवधारणाएं सरलता से समझ आएं।"
        }
      },
      {
        id: "interactive-sandbox",
        iconName: "code",
        title: { en: "Live Coding Sandbox & Practice", hi: "लाइव कोडिंग सैंडबॉक्स एवं अभ्यास" },
        description: {
          en: "Interactive in-browser code editor, instant execution previews, and worked solutions for every syllabus concept.",
          hi: "इन-ब्राउज़र कोड एडिटर, लाइव परिणाम और प्रत्येक पाठ्यक्रम अवधारणा के लिए हल किए गए अभ्यास।"
        }
      },
      {
        id: "ai-grounded",
        iconName: "sparkles",
        title: { en: "Grounded AI Study Engine", hi: "सत्यापित एआई अध्ययन इंजन" },
        description: {
          en: "Dual-mode study support: query verified offline repository notes or unleash real-time AI reasoning with official documentation sources.",
          hi: "दोहरी अध्ययन सहायता: सत्यापित नोट्स से सीखें या आधिकारिक संदर्भों के साथ सीधे एआई मॉडल से प्रश्न पूछें।"
        }
      }
    ],
    learningInfo: {
      strategyTitle: { en: "Recommended Daily Study Strategy", hi: "दैनिक अध्ययन रणनीति" },
      strategySteps: [
        {
          en: "Select 1 core topic per study block and read the bilingual summary to anchor key definitions.",
          hi: "प्रत्येक अध्ययन सत्र में 1 मुख्य विषय चुनें और मूल परिभाषाओं को समझने के लिए द्विभाषी सारांश पढ़ें।"
        },
        {
          en: "Work through the concept examples before looking at final answers or code solutions.",
          hi: "अंतिम उत्तर या कोड देखने से पहले उदाहरणों को स्वयं हल करने का प्रयास करें।"
        },
        {
          en: "Use 'Techy' for live code experimentation or 'Quiz' to evaluate your concept retention.",
          hi: "कोडिंग अभ्यास के लिए 'Techy' का उपयोग करें और स्मृति परीक्षण के लिए 'Quiz' में भाग लें।"
        },
        {
          en: "Bookmark difficult points for revision; review them 24 hours later using your Bookmarks deck.",
          hi: "कठिन बिंदुओं को बुकमार्क करें और 24 घंटे बाद अपने बुकमार्क डेक से उनका पुनरीक्षण करें।"
        }
      ],
      learningOutcome: {
        en: "Consistent daily engagement builds durable mental models, faster problem-solving speed, and exam confidence.",
        hi: "नियमित अध्ययन से गहरी समझ, प्रश्नों को तेजी से हल करने की क्षमता और परीक्षा में आत्मविश्वास विकसित होता है।"
      },
      proTip: {
        en: "Toggle between EN and Hi whenever a technical term feels abstract — dual language reading doubles conceptual recall.",
        hi: "जब भी कोई तकनीकी शब्द कठिन लगे, भाषा टॉगल करें — दो भाषाओं में पढ़ने से अवधारणाएं अधिक समय तक याद रहती हैं।"
      },
      quickTags: [
        { en: "Curriculum Hub", hi: "पाठ्यक्रम केंद्र" },
        { en: "Bilingual Study", hi: "द्विभाषी अध्ययन" },
        { en: "Track Progress", hi: "प्रगति ट्रैकिंग" },
        { en: "Exam Ready", hi: "परीक्षा तैयारी" }
      ]
    }
  },

  // Search Page
  search: {
    id: "search",
    badge: { en: "Knowledge Engine", hi: "ज्ञान खोज इंजन" },
    heading: { en: "Search & AI Knowledge Engine", hi: "खोज एवं एआई ज्ञान इंजन" },
    subheading: {
      en: "Query 60+ technology and exam catalogues with grounded notes or dynamic AI reasoning with source links.",
      hi: "60+ तकनीकी और परीक्षा संग्रहों में सत्यापित नोट्स या स्रोत संदर्भों सहित गतिशील एआई से प्रश्न पूछें।"
    },
    tone: {
      bg: "#edf6f8",
      ink: "#1f6474",
      border: "#d0e7ed",
      badgeBg: "#d9eef2",
      badgeInk: "#144e5b"
    },
    keyPoints: [
      {
        id: "dual-modes",
        iconName: "sparkles",
        title: { en: "Dual Retrieval Modes", hi: "दोहरे खोज मोड" },
        description: {
          en: "Search offline verified repository notes when AI Mode is off, or query Anthropic and Perplexity AI models when AI Mode is on.",
          hi: "एआई मोड बंद होने पर सत्यापित नोट्स खोजें, या एआई मोड चालू होने पर सीधे आधुनिक एआई मॉडल से उत्तर प्राप्त करें।"
        }
      },
      {
        id: "catalogues",
        iconName: "layers",
        title: { en: "60+ Stack & Cloud Catalogues", hi: "60+ तकनीकी व क्लाउड संग्रह" },
        description: {
          en: "Deep indexed reference covering AWS cloud architecture, modern Python, AI concepts, and full-stack frameworks.",
          hi: "AWS क्लाउड, आधुनिक पाइथन, एआई शब्दावली और फुल-स्टैक फ्रेमवर्क का व्यापक संदर्भ संग्रह।"
        }
      },
      {
        id: "diagrams-code",
        iconName: "code",
        title: { en: "Visual Diagrams & Code Files", hi: "विजुअल आरेख और कोड फाइलें" },
        description: {
          en: "Answers deliver labeled architecture diagrams, terminal commands, and multi-file code walkthroughs ready to run.",
          hi: "उत्तरों में स्पष्ट आर्किटेक्चर आरेख, टर्मिनल कमांड और तुरंत चलाने योग्य बहु-फ़ाइल कोड शामिल हैं।"
        }
      },
      {
        id: "citations",
        iconName: "shield-check",
        title: { en: "Official Documentation Sources", hi: "सत्यापित आधिकारिक स्रोत" },
        description: {
          en: "Direct citations and official reference links ensure accuracy, preventing outdated patterns and hallucinated APIs.",
          hi: "आधिकारिक संदर्भ लिंक सटीकता सुनिश्चित करते हैं और पुराने या गलत कोड सिंटैक्स से बचाते हैं।"
        }
      }
    ],
    learningInfo: {
      strategyTitle: { en: "Effective Question Framing Tips", hi: "सटीक प्रश्न पूछने की युक्तियाँ" },
      strategySteps: [
        {
          en: "Ask specific implementation questions (e.g. 'How do I handle file uploads in Next.js Server Actions?').",
          hi: "विशिष्ट प्रश्न पूछें (जैसे 'Next.js Server Actions में फाइल अपलोड कैसे संभालें?')।"
        },
        {
          en: "Ask for trade-offs when designing architecture (e.g. 'PostgreSQL JSONB vs MongoDB for activity feeds').",
          hi: "आर्किटेक्चर में तुलना मांगें (जैसे 'गतिविधि फ़ीड के लिए PostgreSQL JSONB बनाम MongoDB')।"
        },
        {
          en: "Inspect the generated learning diagram to understand data flows before inspecting code snippets.",
          hi: "कोड देखने से पहले जनरेट किए गए लर्निंग डायग्राम से डेटा फ्लो को समझें।"
        },
        {
          en: "Open referenced official links to verify latest configuration options and security guidelines.",
          hi: "नवीनतम सुरक्षा नियमों और कॉन्फ़िगरेशन की पुष्टि के लिए आधिकारिक लिंक्स देखें।"
        }
      ],
      learningOutcome: {
        en: "Eliminate hours of aimless web searches with direct, grounded answers and complete executable examples.",
        hi: "सीधे, सत्यापित उत्तरों और क्रियान्वित उदाहरणों से खोज का समय बचाएं और तेजी से सीखें।"
      },
      proTip: {
        en: "Switch AI Mode off if you want instant responses pulled strictly from the course author's verified notes.",
        hi: "यदि आप केवल लेखक के सत्यापित नोट्स से तुरंत उत्तर चाहते हैं, तो साइडबार से एआई मोड बंद रखें।"
      },
      quickTags: [
        { en: "AI Engine", hi: "एआई इंजन" },
        { en: "60+ Technologies", hi: "60+ तकनीकें" },
        { en: "Architecture Diagrams", hi: "आर्किटेक्चर डायग्राम" },
        { en: "Code Walkthroughs", hi: "कोड मार्गदर्शन" }
      ]
    }
  },

  // Step-by-Step (On The Go)
  "step-by-step": {
    id: "step-by-step",
    badge: { en: "On The Go", hi: "ऑन द गो गाइड्स" },
    heading: { en: "On The Go: Technology Architectures", hi: "ऑन द गो: तकनीक आर्किटेक्चर" },
    subheading: {
      en: "Hands-on architectural cards, runnable terminal commands, and interview questions for 60+ technologies.",
      hi: "60+ तकनीकों के लिए व्यावहारिक आर्किटेक्चर कार्ड, टर्मिनल कमांड और साक्षात्कार प्रश्न।"
    },
    tone: {
      bg: "#fbeee6",
      ink: "#9a4a2c",
      border: "#ecd3c5",
      badgeBg: "#f6ded1",
      badgeInk: "#7c371d"
    },
    keyPoints: [
      {
        id: "prod-arch",
        iconName: "layers",
        title: { en: "Zero to Production", hi: "शून्य से प्रोडक्शन तक" },
        description: {
          en: "Complete architecture blueprints starting from foundational setup to production-grade deployment and scaling.",
          hi: "बुनियादी सेटअप से लेकर प्रोडक्शन परिनियोजन और स्केलिंग तक पूर्ण व्यावहारिक निर्माण।"
        }
      },
      {
        id: "diamond-points",
        iconName: "target",
        title: { en: "Diamond Bullet Definitions", hi: "स्पष्ट परिभाषाएं और मुख्य तथ्य" },
        description: {
          en: "Concise, unambiguous architectural definitions followed by concrete real-world problem statements.",
          hi: "सटीक अवधारणात्मक परिभाषाएं और वास्तविक उद्योग की समस्याओं के व्यावहारिक समाधान।"
        }
      },
      {
        id: "terminal-files",
        iconName: "terminal",
        title: { en: "Runnable Code & Commands", hi: "चलाने योग्य कमांड और कोड" },
        description: {
          en: "Ready-to-copy terminal commands and structured multi-file code implementations with inline comments.",
          hi: "तैयार टर्मिनल कमांड्स और विस्तृत टिप्पणियों के साथ बहु-फ़ाइल कोड कार्यान्वयन।"
        }
      },
      {
        id: "interview-prep",
        iconName: "messages-square",
        title: { en: "Targeted Interview Questions", hi: "लक्षित साक्षात्कार प्रश्न" },
        description: {
          en: "Built-in objective and architectural interview prompts tailored to each technology card.",
          hi: "प्रत्येक तकनीक कार्ड के साथ वास्तविक जॉब साक्षात्कार में पूछे जाने वाले प्रश्न और उत्तर।"
        }
      }
    ],
    learningInfo: {
      strategyTitle: { en: "Architecture Blueprint Method", hi: "आर्किटेक्चर ब्लूप्रिंट विधि" },
      strategySteps: [
        {
          en: "Filter by your current level: Introductory for foundations, Foundation for core builds, Advanced for scaling.",
          hi: "अपने स्तर से फ़िल्टर करें: प्रारंभिक (Introductory), आधारभूत (Foundation), या उन्नत (Advanced)।"
        },
        {
          en: "Execute the setup commands in your terminal or in the 'Techy' code lab.",
          hi: "टर्मिनल कमांड को अपने सिस्टम में या 'Techy' कोड लैब में चलाएं।"
        },
        {
          en: "Study the multi-file architecture to see how configuration, models, and routes interact.",
          hi: "कॉन्फ़िगरेशन, मॉडल और रूट के आपसी संबंध को समझने के लिए फ़ाइल संरचना का अध्ययन करें।"
        },
        {
          en: "Answer the interview challenge questions at the bottom of the card to test your depth.",
          hi: "कार्ड के नीचे दिए गए साक्षात्कार प्रश्नों के उत्तर देकर अपनी तैयारी की जांच करें।"
        }
      ],
      learningOutcome: {
        en: "Bridge the gap between theoretical tutorials and production-ready software engineering.",
        hi: "सैद्धांतिक ज्ञान और वास्तविक सॉफ्टवेयर इंजीनियरिंग के बीच की दूरी को समाप्त करें।"
      },
      proTip: {
        en: "Use the Technology filter tabs to quickly jump across React, Next.js, Node, Docker, Kubernetes, and PostgreSQL.",
        hi: "React, Next.js, Node, Docker, Kubernetes और PostgreSQL के बीच तेज़ी से स्विच करने के लिए फ़िल्टर टैब का उपयोग करें।"
      },
      quickTags: [
        { en: "Production Architecture", hi: "प्रोडक्शन आर्किटेक्चर" },
        { en: "Code Walkthrough", hi: "कोड वॉकथ्रू" },
        { en: "Interview Prompts", hi: "इंटरव्यू प्रश्न" },
        { en: "Terminal Ready", hi: "टर्मिनल कमांड्स" }
      ]
    }
  },

  // Notes Page
  notes: {
    id: "notes",
    badge: { en: "Curated Notes", hi: "सत्यापित नोट्स" },
    heading: { en: "Notes Explorer & Concept Cards", hi: "नोट्स एक्सप्लोरर और अवधारणा कार्ड" },
    subheading: {
      en: "Topic cards with worked explanations, estimated reading times, and copyable markdown curriculum.",
      hi: "हल किए गए स्पष्टीकरण, पठन समय और कॉपी करने योग्य मार्कडाउन सारांश के साथ विषय कार्ड।"
    },
    tone: {
      bg: "#f3f6ed",
      ink: "#4a6828",
      border: "#dce7cd",
      badgeBg: "#e3edd0",
      badgeInk: "#39521c"
    },
    keyPoints: [
      {
        id: "topic-cards",
        iconName: "book-open",
        title: { en: "Curated Topic Cards", hi: "विषयवार संरचित कार्ड्स" },
        description: {
          en: "Hand-crafted concept cards broken into concise chapters, essential points, and practical diagrams.",
          hi: "संक्षिप्त अध्यायों, आवश्यक बिंदुओं और व्यावहारिक आरेखों में विभाजित अवधारणा कार्ड।"
        }
      },
      {
        id: "reading-metrics",
        iconName: "clock",
        title: { en: "Reading Times & Difficulty", hi: "पठन समय और स्तर" },
        description: {
          en: "Every topic card indicates estimated completion minutes and difficulty level for focused study pacing.",
          hi: "प्रत्येक विषय में समय सीमा और कठिनाई स्तर अंकित है ताकि आप अध्ययन की योजना बना सकें।"
        }
      },
      {
        id: "bilingual-notes",
        iconName: "languages",
        title: { en: "Bilingual Explanations", hi: "द्विभाषी स्पष्टीकरण" },
        description: {
          en: "Full dual-language support with native terminology so complex ideas become immediately understandable.",
          hi: "सटीक शब्दावली के साथ पूर्ण द्विभाषी समर्थन ताकि जटिल विषय तुरंत समझ आ सकें।"
        }
      },
      {
        id: "copy-curriculum",
        iconName: "file-code",
        title: { en: "One-Click Markdown Export", hi: "एक-क्लिक मार्कडाउन निर्यात" },
        description: {
          en: "Copy the complete structured curriculum notes to clipboard for your personal Obsidian or Notion vault.",
          hi: "अपने व्यक्तिगत नोट्स संग्रह (Notion/Obsidian) के लिए संपूर्ण पाठ्यक्रम नोट्स को तुरंत कॉपी करें।"
        }
      }
    ],
    learningInfo: {
      strategyTitle: { en: "Active Recall Study Flow", hi: "सक्रिय स्मरण अध्ययन पद्धति" },
      strategySteps: [
        {
          en: "Pick a card and read the summary section without jumping straight to the solutions.",
          hi: "एक कार्ड चुनें और सीधे उत्तर देखे बिना पहले सारांश अनुभाग को पढ़ें।"
        },
        {
          en: "Formulate an answer mentally or on paper to the core problem posed in the topic card.",
          hi: "कार्ड में पूछे गए मुख्य प्रश्न का उत्तर अपने दिमाग में या कागज पर तैयार करें।"
        },
        {
          en: "Compare your answer against the card's worked solution and highlight differences.",
          hi: "अपने उत्तर की तुलना कार्ड के विस्तृत समाधान से करें और अंतर नोट करें।"
        },
        {
          en: "Bookmark cards that need second review, then re-test yourself in 48 hours.",
          hi: "जिन कार्ड्स में सुधार की आवश्यकता हो उन्हें बुकमार्क करें और 48 घंटे बाद पुन: परीक्षण करें।"
        }
      ],
      learningOutcome: {
        en: "Retain complex technical and academic concepts permanently using structured bite-sized revision.",
        hi: "संरचित छोटे-छोटे रिवीजनों से तकनीकी और शैक्षणिक अवधारणाओं को स्थायी रूप से याद रखें।"
      },
      proTip: {
        en: "Use the 'Copy notes' button on any card to export bullet-pointed summaries directly into your study diary.",
        hi: "कार्ड पर दिए 'Copy notes' बटन से मुख्य बिंदुओं को सीधे अपनी अध्ययन डायरी में सेव करें।"
      },
      quickTags: [
        { en: "Active Recall", hi: "सक्रिय स्मरण" },
        { en: "Bite-Sized", hi: "छोटे पाठ" },
        { en: "Export Ready", hi: "निर्यात योग्य" },
        { en: "Bilingual", hi: "द्विभाषी" }
      ]
    }
  },

  // Vocabulary Page
  vocabulary: {
    id: "vocabulary",
    badge: { en: "Language Mastery", hi: "भाषा दक्षता" },
    heading: { en: "English-Hindi Vocabulary & Word Explorer", hi: "अंग्रेजी-हिन्दी शब्दावली और शब्द अन्वेषक" },
    subheading: {
      en: "Explore words with contextual Hindi meanings, phonetics, example sentences, synonyms, and antonyms.",
      hi: "संदर्भ सहित हिन्दी अर्थ, उच्चारण, उदाहरण वाक्य, समानार्थी और विलोम शब्दों के साथ अंग्रेजी सीखें।"
    },
    tone: {
      bg: "#f4f0f9",
      ink: "#5e4a8f",
      border: "#e3d8f3",
      badgeBg: "#ebdff7",
      badgeInk: "#4c3877"
    },
    keyPoints: [
      {
        id: "authentic-nuance",
        iconName: "book-open-text",
        title: { en: "Authentic Meanings & Nuances", hi: "सटीक हिन्दी अर्थ और भाव" },
        description: {
          en: "Go beyond simple dictionary lookups with culturally precise Hindi meanings and context-aware definitions.",
          hi: "साधारण शब्दकोश से आगे बढ़कर सटीक हिन्दी अर्थ, संदर्भ और उपयोग के भाव को समझें।"
        }
      },
      {
        id: "pronunciation",
        iconName: "brain",
        title: { en: "Phonetics & Pronunciation", hi: "ध्वन्यात्मकता और सही उच्चारण" },
        description: {
          en: "Accurate phonetic transcription and parts of speech markers to build confident speaking and writing.",
          hi: "सटीक उच्चारण और व्याकरण श्रेणी (Parts of Speech) जिससे आत्मविश्वास से बोल और लिख सकें।"
        }
      },
      {
        id: "sentence-usage",
        iconName: "messages-square",
        title: { en: "Real-World Example Sentences", hi: "व्यावहारिक उदाहरण वाक्य" },
        description: {
          en: "Contextual sentence examples in formal, professional, and conversational registers with Hindi translations.",
          hi: "व्यावसायिक, औपचारिक और बातचीत के संदर्भ में हिन्दी अनुवाद सहित व्यावहारिक वाक्य।"
        }
      },
      {
        id: "clusters",
        iconName: "layers",
        title: { en: "Synonyms & Antonyms Clusters", hi: "समानार्थी एवं विलोम समूह" },
        description: {
          en: "Expand your expressive vocabulary for competitive exams (IELTS, SSC, Banking) and job interviews.",
          hi: "IELTS, SSC, बैंकिंग और साक्षात्कारों के लिए अपने शब्द भंडार को कई गुना बढ़ाएं।"
        }
      }
    ],
    learningInfo: {
      strategyTitle: { en: "Vocabulary Retention Protocol", hi: "शब्दावली याद रखने की विधि" },
      strategySteps: [
        {
          en: "Search for unfamiliar words whenever you encounter them in lessons or technical documentation.",
          hi: "पाठ या तकनीकी दस्तावेज़ों में जब भी कोई नया शब्द मिले, उसे तुरंत खोजें।"
        },
        {
          en: "Read the Hindi translation and note the subtle difference between each synonym.",
          hi: "हिन्दी अनुवाद पढ़ें और समानार्थी शब्दों के बीच के सूक्ष्म अंतर को समझें।"
        },
        {
          en: "Construct 2 original sentences applying the word to your own career or academic context.",
          hi: "उस शब्द का उपयोग करके अपने जीवन या पढ़ाई से जुड़े 2 नए वाक्य बनाएं।"
        },
        {
          en: "Revisit your recent word history below every 3 days to cement terms in long-term memory.",
          hi: "शब्दों को स्थायी रूप से याद रखने के लिए हर 3 दिन में नीचे दी गई शब्द हिस्ट्री को दोहराएं।"
        }
      ],
      learningOutcome: {
        en: "Dramatically improve reading comprehension, competitive exam verbal scores, and professional fluency.",
        hi: "पढ़ने की समझ, प्रतियोगी परीक्षाओं में अंग्रेजी स्कोर और पेशेवर संवाद में उल्लेखनीय सुधार करें।"
      },
      proTip: {
        en: "Click any synonym or antonym tag on a word card to instantly navigate into that term's detailed breakdown.",
        hi: "किसी भी शब्द कार्ड पर दिए गए समानार्थी या विलोम शब्द पर क्लिक करके तुरंत उसका पूरा विवरण देखें।"
      },
      quickTags: [
        { en: "IELTS & SSC Ready", hi: "IELTS और SSC उपयोगी" },
        { en: "Hindi Context", hi: "हिन्दी संदर्भ" },
        { en: "Sentence Examples", hi: "वाक्य उदाहरण" },
        { en: "Synonyms & Antonyms", hi: "समानार्थी व विलोम" }
      ]
    }
  },

  // Class Room Page
  classroom: {
    id: "classroom",
    badge: { en: "School & Exam Academy", hi: "स्कूल और परीक्षा अकादमी" },
    heading: { en: "Class Room: School & Exam Concept Lab", hi: "क्लास रूम: स्कूल एवं परीक्षा अवधारणा लैब" },
    subheading: {
      en: "Every subject from Class 6 to 12 and competitive exams with worked answers, diagrams, and Hindi toggle.",
      hi: "कक्षा 6 से 12 और प्रतियोगी परीक्षाओं के सभी विषय, हल किए गए उत्तरों, आरेखों और हिन्दी टॉगल के साथ।"
    },
    tone: {
      bg: "#edf5ee",
      ink: "#28633b",
      border: "#d0e5d4",
      badgeBg: "#dbeedf",
      badgeInk: "#1a4d29"
    },
    keyPoints: [
      {
        id: "class-coverage",
        iconName: "graduation-cap",
        title: { en: "Class 6 to 12 & State Boards", hi: "कक्षा 6 से 12 और राज्य बोर्ड" },
        description: {
          en: "Aligned to CBSE, NCERT, ICSE, and state boards across Physics, Chemistry, Biology, Mathematics, and Social Science.",
          hi: "भौतिकी, रसायन, जीवविज्ञान, गणित और सामाजिक विज्ञान के लिए CBSE, NCERT, ICSE और राज्य बोर्डों के अनुसार।"
        }
      },
      {
        id: "worked-solutions",
        iconName: "check-circle-2",
        title: { en: "Step-by-Step Worked Answers", hi: "चरण-दर-चरण हल किए गए उत्तर" },
        description: {
          en: "Model solutions formatted exactly as required by board examiners to maximize step marks.",
          hi: "बोर्ड परीक्षकों द्वारा अपेक्षित फॉर्मेट में मॉडल उत्तर ताकि स्टेप मार्किंग में पूरे अंक मिलें।"
        }
      },
      {
        id: "visual-diagrams",
        iconName: "target",
        title: { en: "Visual Explanatory Diagrams", hi: "विजुअल व्याख्यात्मक आरेख" },
        description: {
          en: "Clear labeled diagrams and structural flowcharts that make complex scientific processes memorable.",
          hi: "स्पष्ट नामांकित आरेख और प्रवाह चार्ट जो जटिल वैज्ञानिक प्रक्रियाओं को आसानी से समझाते हैं।"
        }
      },
      {
        id: "mistakes-pitfalls",
        iconName: "shield-check",
        title: { en: "Common Pitfalls & Exam Traps", hi: "सामान्य गलतियां और परीक्षा जाल" },
        description: {
          en: "Highlighted warnings on recurring student errors, sign mistakes, and conceptual traps.",
          hi: "अक्सर होने वाली गलतियों, चिह्नों की चूक और परीक्षा के भ्रामक प्रश्नों पर विशेष चेतावनी।"
        }
      }
    ],
    learningInfo: {
      strategyTitle: { en: "Board & Exam Scoring Routine", hi: "बोर्ड परीक्षा में अधिकतम अंक लाने की विधि" },
      strategySteps: [
        {
          en: "Pick a syllabus topic and review the core law or formula before jumping to calculations.",
          hi: "पाठ्यक्रम का विषय चुनें और गणना से पहले मूल नियम या सूत्र को ध्यान से पढ़ें।"
        },
        {
          en: "Practice drawing the labeled diagram from memory on blank paper.",
          hi: "बिना देखे सादे कागज पर नामांकित आरेख बनाने का अभ्यास करें।"
        },
        {
          en: "Check the step-by-step worked answer and note how units and assumptions are written.",
          hi: "हल किए गए उत्तर में देखें कि इकाइयां (Units) और मान्यताएं कैसे लिखी गई हैं।"
        },
        {
          en: "Read the 'Common Mistakes' callout to avoid losing silly marks on exam day.",
          hi: "परीक्षा में छोटी गलतियों से बचने के लिए 'Common Mistakes' अनुभाग को अवश्य पढ़ें।"
        }
      ],
      learningOutcome: {
        en: "Master syllabus foundations with crystal clarity and secure high scores in board and entrance tests.",
        hi: "अवधारणाओं पर मजबूत पकड़ बनाएं और बोर्ड व प्रवेश परीक्षाओं में सर्वोच्च अंक प्राप्त करें।"
      },
      proTip: {
        en: "Click the Hindi toggle whenever an abstract English term needs intuitive clarification in your mother tongue.",
        hi: "जब भी कोई अमूर्त वैज्ञानिक शब्द समझ न आए, हिन्दी टॉगल का उपयोग करके उसकी सरल व्याख्या पढ़ें।"
      },
      quickTags: [
        { en: "Classes 6–12", hi: "कक्षा 6–12" },
        { en: "CBSE & NCERT", hi: "CBSE और NCERT" },
        { en: "Step Marking", hi: "स्टेप मार्किंग" },
        { en: "Visual Diagrams", hi: "विजुअल आरेख" }
      ]
    }
  },

  // Bookmark Page
  bookmark: {
    id: "bookmark",
    badge: { en: "Revision Vault", hi: "रिवीजन वॉल्ट" },
    heading: { en: "Bookmarks & Personal Review Deck", hi: "बुकमार्क और व्यक्तिगत रिवीजन डेक" },
    subheading: {
      en: "Saved topics and build steps stored offline in your browser for rapid spaced revision and exam prep.",
      hi: "तेजी से रिवीजन और परीक्षा तैयारी के लिए आपके ब्राउज़र में सहेजे गए विषय और निर्माण चरण।"
    },
    tone: {
      bg: "#faeef1",
      ink: "#8f3a55",
      border: "#f1d2db",
      badgeBg: "#f6dde4",
      badgeInk: "#6f293e"
    },
    keyPoints: [
      {
        id: "offline-recall",
        iconName: "bookmark",
        title: { en: "Instant In-Browser Storage", hi: "ब्राउज़र में त्वरित सहेजाव" },
        description: {
          en: "All bookmarks persist locally in your browser for instantaneous loading without waiting on network queries.",
          hi: "सभी बुकमार्क आपके ब्राउज़र में सुरक्षित रहते हैं ताकि बिना इंटरनेट धीमेपन के तुरंत खुल सकें।"
        }
      },
      {
        id: "organized-stacks",
        iconName: "layers",
        title: { en: "Organized by Technology & Exam", hi: "तकनीक और परीक्षा अनुसार वर्गीकरण" },
        description: {
          en: "Automatically categorizes saved topics by their subject and framework for orderly review.",
          hi: "सहेजे गए विषयों को उनके विषय और फ्रेमवर्क के आधार पर स्वचालित रूप से व्यवस्थित करता है।"
        }
      },
      {
        id: "rapid-deck",
        iconName: "flame",
        title: { en: "Pre-Exam Rapid Fire Deck", hi: "परीक्षा पूर्व तीव्र रिवीजन डेक" },
        description: {
          en: "Review only the cards where you previously hesitated, making your pre-test hours high impact.",
          hi: "केवल उन्हीं कार्ड्स का रिवीजन करें जहाँ आपको संदेह था, जिससे परीक्षा पूर्व का समय सबसे उपयोगी बने।"
        }
      },
      {
        id: "curate-mastery",
        iconName: "check-circle-2",
        title: { en: "Curate As You Master", hi: "सफलता के साथ सूची परिष्कृत करें" },
        description: {
          en: "Remove items once you achieve 100% recall so your revision deck remains tightly focused.",
          hi: "अवधारणा पूरी तरह याद होने पर उसे बुकमार्क से हटाएँ ताकि आपका रिवीजन डेक हमेशा संक्षिप्त रहे।"
        }
      }
    ],
    learningInfo: {
      strategyTitle: { en: "Spaced Repetition Protocol", hi: "अंतराल पुनरावृत्ति (Spaced Repetition) नियम" },
      strategySteps: [
        {
          en: "Day 1: Bookmark cards during your initial study session.",
          hi: "पहला दिन: पहले अध्ययन सत्र के दौरान कठिन कार्ड्स को बुकमार्क करें।"
        },
        {
          en: "Day 2: Run through your bookmark deck once without checking hints.",
          hi: "दूसरा दिन: बिना हिंट देखे अपने बुकमार्क डेक के सभी कार्ड्स को एक बार दोहराएं।"
        },
        {
          en: "Day 7: Second review to transfer volatile facts into long-term mental storage.",
          hi: "सातवाँ दिन: तथ्यों को स्थायी स्मृति में बदलने के लिए दूसरा रिवीजन करें।"
        },
        {
          en: "Day 30: Final sweep before your target interview or examination.",
          hi: "तीसवाँ दिन: अपने इंटरव्यू या परीक्षा से पहले अंतिम रिवीजन करें।"
        }
      ],
      learningOutcome: {
        en: "Defeat the forgetting curve and walk into exams with total recall of formulas, syntax, and principles.",
        hi: "विस्मृति चक्र को हराएं और सूत्रों, कोड सिंटैक्स व सिद्धांतों पर शत-प्रतिशत नियंत्रण पाएं।"
      },
      proTip: {
        en: "Keep your bookmark deck under 25 active items at any time — review, master, and clean up regularly.",
        hi: "अपने बुकमार्क डेक में सक्रिय विषयों की संख्या 25 के भीतर रखें — सीखें, कंठस्थ करें और सूची साफ़ रखें।"
      },
      quickTags: [
        { en: "Spaced Repetition", hi: "अंतराल पुनरावृत्ति" },
        { en: "Offline Access", hi: "ऑफ़लाइन पहुंच" },
        { en: "High Impact", hi: "उच्च प्रभाव" },
        { en: "Quick Review", hi: "त्वरित समीक्षा" }
      ]
    }
  },

  // Techy - Live Sandbox
  techy: {
    id: "techy",
    badge: { en: "Live Code Lab", hi: "लाइव कोड लैब" },
    heading: { en: "Techy: In-Browser Interactive Sandbox", hi: "Techy: इन-ब्राउज़र इंटरैक्टिव कोडिंग लैब" },
    subheading: {
      en: "Zero-config code editor with live execution, instant preview, and experimentation for web and algorithms.",
      hi: "बिना किसी सेटअप के लाइव निष्पादन, तुरंत परिणाम और वेब व एल्गोरिदम के लिए कोडिंग सैंडबॉक्स।"
    },
    tone: {
      bg: "#faf3dc",
      ink: "#7a5d10",
      border: "#ecdba6",
      badgeBg: "#f5e8be",
      badgeInk: "#5e450d"
    },
    keyPoints: [
      {
        id: "zero-setup",
        iconName: "code",
        title: { en: "Zero Local Environment Setup", hi: "बिना किसी इंस्टॉलेशन के कोडिंग" },
        description: {
          en: "Run modern HTML, CSS, JavaScript, and algorithms straight inside your web browser without Node or npm.",
          hi: "बिना Node या npm इंस्टॉल किए सीधे अपने ब्राउज़र में आधुनिक HTML, CSS, JavaScript और एल्गोरिदम चलाएं।"
        }
      },
      {
        id: "live-preview",
        iconName: "sparkles",
        title: { en: "Real-Time Visual & Console Output", hi: "रियल-टाइम आउटपुट और कंसोल" },
        description: {
          en: "Instant feedback loop with rendered DOM outputs and live console logging for immediate debugging.",
          hi: "कोड बदलते ही लाइव स्क्रीन और कंसोल लॉग में तुरंत परिणाम देखें और गलतियों को ठीक करें।"
        }
      },
      {
        id: "sandbox-fork",
        iconName: "terminal",
        title: { en: "Safe Experimentation Sandbox", hi: "सुरक्षित प्रयोग सैंडबॉक्स" },
        description: {
          en: "Paste code snippets from On The Go guides, tweak parameters, and observe changes safely.",
          hi: "गाइड्स से कोड स्निपेट्स को पेस्ट करें, मान बदलें और बिना किसी डर के नए प्रयोग करें।"
        }
      },
      {
        id: "dev-shortcuts",
        iconName: "flame",
        title: { en: "Developer Hotkeys & Ergonomics", hi: "डेवलपर शॉर्टकट और सुविधा" },
        description: {
          en: "Equipped with keyboard shortcuts for running code, clearing buffers, and managing split views.",
          hi: "कोड निष्पादित करने, कंसोल साफ़ करने और स्क्रीन प्रबंधित करने के लिए कीबोर्ड शॉर्टकट।"
        }
      }
    ],
    learningInfo: {
      strategyTitle: { en: "Interactive Coding Methodology", hi: "प्रायोगिक कोडिंग विधि" },
      strategySteps: [
        {
          en: "Never just read code — type it out in Techy to build muscle memory and identify syntax errors.",
          hi: "केवल कोड पढ़ें नहीं — उंगलियों की स्मृति और सिंटैक्स समझने के लिए उसे Techy में स्वयं टाइप करें।"
        },
        {
          en: "Intentionally break one parameter (e.g. change an array index or CSS property) to observe the error.",
          hi: "जानबूझकर एक मान बदलें (जैसे गलत इंडेक्स या CSS नियम) और देखें कि सिस्टम क्या एरर देता है।"
        },
        {
          en: "Fix the bug using console.log() statements to see how variables change over execution cycles.",
          hi: "वेरिएबल के बदलाव देखने के लिए console.log() लगाएं और समस्या को हल करें।"
        },
        {
          en: "Add an extra feature or edge-case guard before considering the exercise complete.",
          hi: "अभ्यास पूरा मानने से पहले कोड में एक अतिरिक्त फ़ीचर या एज-केस सुरक्षा जोड़ें।"
        }
      ],
      learningOutcome: {
        en: "Transform passive theory reading into active engineering reflexes and fearless debugging.",
        hi: "किताबी ज्ञान को वास्तविक इंजीनियरिंग कुशलता और निडर डिबगिंग क्षमता में बदलें।"
      },
      proTip: {
        en: "Test edge cases (like null inputs, empty arrays, or extreme values) to see how robust your code really is.",
        hi: "खाली ऐरे (Empty Arrays), null मान या बड़ी संख्याओं के साथ कोड का परीक्षण करें।"
      },
      quickTags: [
        { en: "Live Execution", hi: "लाइव निष्पादन" },
        { en: "Zero Setup", hi: "शून्य सेटअप" },
        { en: "Instant Console", hi: "तुरंत कंसोल" },
        { en: "Code Sandbox", hi: "कोड सैंडबॉक्स" }
      ]
    }
  },

  // API Docs
  "api-docs": {
    id: "api-docs",
    badge: { en: "Developer Reference", hi: "डेवलपर संदर्भ" },
    heading: { en: "API Docs & Framework Reference", hi: "एपीआई दस्तावेज़ और संदर्भ" },
    subheading: {
      en: "Method signatures, endpoint specs, authentication flows, and real-world code snippets.",
      hi: "मेथड सिग्नेचर, एंडपॉइंट विवरण, प्रमाणीकरण फ्लो और वास्तविक उपयोग के कोड स्निपेट्स।"
    },
    tone: {
      bg: "#eaf2f8",
      ink: "#24587c",
      border: "#cadfee",
      badgeBg: "#d7e9f5",
      badgeInk: "#1a4666"
    },
    keyPoints: [
      {
        id: "specs-signatures",
        iconName: "file-code",
        title: { en: "Method & Type Signatures", hi: "मेथड और टाइप सिग्नेचर" },
        description: {
          en: "Clear parameter lists, return types, and TypeScript interfaces for production frameworks.",
          hi: "उत्पादन फ्रेमवर्क के लिए स्पष्ट पैरामीटर सूची, रिटर्न प्रकार और TypeScript इंटरफेस।"
        }
      },
      {
        id: "auth-patterns",
        iconName: "shield-check",
        title: { en: "Authentication & Security", hi: "प्रमाणीकरण एवं सुरक्षा" },
        description: {
          en: "Standardized token authorization patterns, Bearer headers, and secrets management guidance.",
          hi: "मानकीकृत टोकन ऑथराइजेशन, Bearer हेडर्स और सीक्रेट्स प्रबंधन के सुरक्षा नियम।"
        }
      },
      {
        id: "snippets",
        iconName: "code",
        title: { en: "Production-Grade Snippets", hi: "प्रोडक्शन स्तर के कोड स्निपेट्स" },
        description: {
          en: "Copy-pasteable code blocks covering cURL, Fetch API, Axios, and language SDKs.",
          hi: "cURL, Fetch API, Axios और SDKs के लिए तुरंत उपयोग योग्य कोड ब्लॉक्स।"
        }
      },
      {
        id: "error-handling",
        iconName: "terminal",
        title: { en: "HTTP Status & Error Recovery", hi: "HTTP स्टेटस और एरर रिकवरी" },
        description: {
          en: "Comprehensive status code mapping, rate limit handling, and retry strategies with backoff.",
          hi: "विस्तृत स्टेटस कोड विवरण, रेट लिमिट प्रबंधन और बैकऑफ़ के साथ पुनः प्रयास की रणनीतियाँ।"
        }
      }
    ],
    learningInfo: {
      strategyTitle: { en: "API Integration Best Practices", hi: "एपीआई एकीकरण के सर्वोत्तम नियम" },
      strategySteps: [
        {
          en: "Always inspect the required headers and auth parameters before writing client logic.",
          hi: "क्लाइंट कोड लिखने से पहले आवश्यक हेडर्स और ऑथेंटिकेशन पैरामीटर्स की जांच करें।"
        },
        {
          en: "Implement exponential backoff when handling 429 (Rate Limited) or 503 (Unavailable) errors.",
          hi: "429 (रेट लिमिट) या 503 एरर के समाधान के लिए हमेशा एक्सपोनेंशियल बैकऑफ़ लागू करें।"
        },
        {
          en: "Validate API response shapes with schema validators (like Zod) to prevent silent runtime crashes.",
          hi: "रनटाइम क्रैश से बचने के लिए Zod जैसे स्कीमा वैलिडेटर से API रिस्पॉन्स की पुष्टि करें।"
        },
        {
          en: "Never expose secret keys on the client; route external API calls through server actions or proxies.",
          hi: "क्लाइंट पर सीक्रेट कीज कभी न रखें; सर्वर एक्शन या प्रॉक्सी के माध्यम से कॉल करें।"
        }
      ],
      learningOutcome: {
        en: "Build resilient, production-ready integrations that never fail silently in production environments.",
        hi: "मजबूत और सुरक्षित सॉफ्टवेयर बनाएं जो वास्तविक उपयोग में बिना किसी रुकावट के काम करे।"
      },
      proTip: {
        en: "Use the quick search filter to instantly find method names and error codes without scrolling.",
        hi: "बिना स्क्रॉल किए मेथड नाम और एरर कोड तुरंत खोजने के लिए सर्च फ़िल्टर का उपयोग करें।"
      },
      quickTags: [
        { en: "SDK Reference", hi: "SDK संदर्भ" },
        { en: "Auth Patterns", hi: "ऑथ पैटर्न" },
        { en: "Error Codes", hi: "एरर कोड्स" },
        { en: "Type Safe", hi: "टाइप सेफ" }
      ]
    }
  },

  // Lessons Page
  lessons: {
    id: "lessons",
    badge: { en: "Curriculum Track", hi: "पाठ्यक्रम ट्रैक" },
    heading: { en: "Lessons: Career-Focused Micro-Courses", hi: "पाठ: करियर-केंद्रित माइक्रो-कोर्स" },
    subheading: {
      en: "Structured engineering curriculum broken into bite-sized units with checkpoints and practical projects.",
      hi: "चेकपॉइंट्स और व्यावहारिक प्रोजेक्ट्स के साथ छोटे-छोटे भागों में संरचित इंजीनियरिंग पाठ्यक्रम।"
    },
    tone: {
      bg: "#eff1fa",
      ink: "#374684",
      border: "#d1dbf4",
      badgeBg: "#dfe6f9",
      badgeInk: "#26356c"
    },
    keyPoints: [
      {
        id: "career-progression",
        iconName: "trending-up",
        title: { en: "Progressive Engineering Ladder", hi: "क्रमिक इंजीनियरिंग प्रगति" },
        description: {
          en: "Carefully paced units taking you from junior concepts to senior architectural decisions.",
          hi: "शुरुआती अवधारणाओं से लेकर वरिष्ठ स्तर के आर्किटेक्चरल निर्णयों तक क्रमिक सीख।"
        }
      },
      {
        id: "micro-modules",
        iconName: "layers",
        title: { en: "Focused Micro-Modules", hi: "केंद्रित माइक्रो-मॉड्यूल" },
        description: {
          en: "10-15 minute learning bursts designed to fit into busy working schedules and study blocks.",
          hi: "व्यस्त दिनचर्या में आसानी से समा जाने वाले 10-15 मिनट के केंद्रित अध्ययन मॉड्यूल।"
        }
      },
      {
        id: "checkpoints",
        iconName: "target",
        title: { en: "Milestone Checkpoints", hi: "ज्ञान सत्यापन चेकपॉइंट्स" },
        description: {
          en: "Formative checks at the end of each module to verify concept understanding before advancing.",
          hi: "आगे बढ़ने से पहले समझ की पुष्टि करने के लिए प्रत्येक मॉड्यूल के अंत में ज्ञान परीक्षण।"
        }
      },
      {
        id: "real-world-scenarios",
        iconName: "code",
        title: { en: "Industry-Grade Scenarios", hi: "उद्योग-स्तरीय परिदृश्य" },
        description: {
          en: "Learn patterns used by top tech companies: caching layers, event queues, and state orchestration.",
          hi: "शीर्ष कंपनियों द्वारा उपयोग किए जाने वाले पैटर्न: कैशिंग, इवेंट क्यू और स्टेट प्रबंधन।"
        }
      }
    ],
    learningInfo: {
      strategyTitle: { en: "Micro-Learning Routine", hi: "माइक्रो-लर्निंग अध्ययन दिनचर्या" },
      strategySteps: [
        {
          en: "Commit to completing just 1 micro-lesson each morning to maintain consistent momentum.",
          hi: "निरंतर गति बनाए रखने के लिए हर सुबह केवल 1 माइक्रो-पाठ पूरा करने का नियम बनाएं।"
        },
        {
          en: "Take notes in your personal markdown notebook as you read through key architectural choices.",
          hi: "मुख्य आर्किटेक्चरल विकल्पों को पढ़ते समय अपनी व्यक्तिगत नोटबुक में नोट्स बनाएं।"
        },
        {
          en: "Complete the checkpoint questions without referring back to the lesson text.",
          hi: "पाठ को दोबारा देखे बिना चेकपॉइंट प्रश्नों के उत्तर देने का प्रयास करें।"
        },
        {
          en: "Implement the lesson's code pattern inside Techy to cement understanding.",
          hi: "अवधारणा को पक्का करने के लिए पाठ के कोड पैटर्न को Techy में लागू करें।"
        }
      ],
      learningOutcome: {
        en: "Acquire full-stack engineering maturity through structured daily compounding.",
        hi: "दैनिक नियमित अभ्यास से परिपक्व फुल-स्टैक सॉफ्टवेयर इंजीनियर बनें।"
      },
      proTip: {
        en: "Focus on the 'Why' behind architectural choices rather than merely memorizing syntax.",
        hi: "केवल कोड याद करने के बजाय इस बात पर ध्यान दें कि कोई निर्णय 'क्यों' लिया गया।"
      },
      quickTags: [
        { en: "Daily Micro-Lessons", hi: "दैनिक माइक्रो-पाठ" },
        { en: "Career Focused", hi: "करियर केंद्रित" },
        { en: "Checkpoints", hi: "चेकपॉइंट्स" },
        { en: "Practical Projects", hi: "प्रोजेक्ट्स" }
      ]
    }
  },

  // Quiz Page
  quiz: {
    id: "quiz",
    badge: { en: "Skill Assessment", hi: "कौशल मूल्यांकन" },
    heading: { en: "Interactive Quizzes & Timed Assessments", hi: "इंटरैक्टिव क्विज़ और समयबद्ध मूल्यांकन" },
    subheading: {
      en: "Test your mastery across frameworks, languages, and exams with instant evaluations and explanations.",
      hi: "तत्काल परिणाम और विस्तृत व्याख्या के साथ तकनीकों और परीक्षाओं में अपने ज्ञान का परीक्षण करें।"
    },
    tone: {
      bg: "#f9eff2",
      ink: "#873650",
      border: "#eed2dc",
      badgeBg: "#f6dce4",
      badgeInk: "#6b233a"
    },
    keyPoints: [
      {
        id: "timed-practice",
        iconName: "clock",
        title: { en: "Timed Real-Exam Simulation", hi: "समयबद्ध परीक्षा सिमुलेशन" },
        description: {
          en: "Simulate test pressure to sharpen problem-solving speed, accuracy, and composure.",
          hi: "गति, सटीकता और एकाग्रता बढ़ाने के लिए परीक्षा जैसे माहौल में प्रश्नों का अभ्यास करें।"
        }
      },
      {
        id: "instant-rationale",
        iconName: "check-circle-2",
        title: { en: "Instant Rationale & Feedback", hi: "तत्काल परिणाम और विस्तृत व्याख्या" },
        description: {
          en: "Get instant feedback explaining why the correct choice wins and why common distractors fail.",
          hi: "तुरंत जानें कि सही विकल्प क्यों सही है और बाकी विकल्प किन कारणों से गलत हैं।"
        }
      },
      {
        id: "track-banks",
        iconName: "layers",
        title: { en: "Track-Specific Question Banks", hi: "विषयवार प्रश्न बैंक" },
        description: {
          en: "Specialized question repositories for Python, React, Next.js, Cloud, and Indian competitive exams.",
          hi: "पाइथन, रिएक्ट, नेक्स्ट.जेएस, क्लाउड और भारतीय प्रतियोगी परीक्षाओं के लिए विशेष प्रश्न बैंक।"
        }
      },
      {
        id: "diagnostics",
        iconName: "trending-up",
        title: { en: "Knowledge Gap Diagnostics", hi: "कमज़ोरियों की सटीक पहचान" },
        description: {
          en: "Identify your exact conceptual blind spots to make your next study session highly targeted.",
          hi: "अपनी कमियों को पहचानें ताकि अगला अध्ययन सत्र केवल ज़रूरी विषयों पर केंद्रित हो।"
        }
      }
    ],
    learningInfo: {
      strategyTitle: { en: "Quiz Mastery Technique", hi: "क्विज़ से सीखने की सही तकनीक" },
      strategySteps: [
        {
          en: "Read the full question stem carefully; look for disqualifiers like 'NOT', 'EXCEPT', or 'ALWAYS'.",
          hi: "प्रश्न को ध्यान से पढ़ें; 'NOT', 'EXCEPT' या 'ALWAYS' जैसे शब्दों पर विशेष ध्यान दें।"
        },
        {
          en: "Eliminate at least 2 obviously incorrect distractors before committing to your final answer.",
          hi: "अंतिम उत्तर चुनने से पहले कम से कम 2 गलत विकल्पों को सीधे बाहर करें।"
        },
        {
          en: "Never skip reading the explanation — even on questions you answered correctly.",
          hi: "सही उत्तर देने के बाद भी व्याख्या अवश्य पढ़ें ताकि नया दृष्टिकोण मिल सके।"
        },
        {
          en: "Retake missed quizzes 48 hours later to confirm that knowledge gaps are fully bridged.",
          hi: "48 घंटे बाद उन क्विज़ को दोबारा दें जिनमें पहले गलतियां हुई थीं।"
        }
      ],
      learningOutcome: {
        en: "Build rock-solid exam temperament, quick decision-making, and high test scores.",
        hi: "परीक्षा का दबाव झेलने की क्षमता, त्वरित निर्णय और उच्च स्कोर प्राप्त करने की दक्षता हासिल करें।"
      },
      proTip: {
        en: "Don't fear wrong answers; mistakes made during practice are the most permanent learning moments.",
        hi: "गलत उत्तरों से घबराएं नहीं; अभ्यास के दौरान की गई गलतियां सबसे गहरा ज्ञान देती हैं।"
      },
      quickTags: [
        { en: "Timed Tests", hi: "समयबद्ध टेस्ट" },
        { en: "Instant Rationale", hi: "विस्तृत व्याख्या" },
        { en: "Gap Diagnostic", hi: "कमी पहचान" },
        { en: "Exam Ready", hi: "परीक्षा अनुकूल" }
      ]
    }
  },

  // Interview Page
  interview: {
    id: "interview",
    badge: { en: "Career Preparation", hi: "साक्षात्कार तैयारी" },
    heading: { en: "Technical & System Design Interview Prep", hi: "तकनीकी और सिस्टम डिज़ाइन साक्षात्कार" },
    subheading: {
      en: "Real-world engineering questions, architecture trade-off prompts, and STAR behavioral rubrics.",
      hi: "वास्तविक इंजीनियरिंग प्रश्न, आर्किटेक्चरल तुलना और STAR पद्धति पर आधारित साक्षात्कार तैयारी।"
    },
    tone: {
      bg: "#edf2f7",
      ink: "#2b4968",
      border: "#d0dee9",
      badgeBg: "#dbe6f0",
      badgeInk: "#1e3752"
    },
    keyPoints: [
      {
        id: "system-design",
        iconName: "layers",
        title: { en: "System Design Trade-offs", hi: "सिस्टम डिज़ाइन और तुलना" },
        description: {
          en: "Master high-scale architectures: database sharding, caching strategies, rate limiting, and CAP theorem.",
          hi: "उच्च-स्तरीय आर्किटेक्चर: डेटाबेस शार्डिंग, कैशिंग, रेट लिमिटिंग और CAP प्रमेय में महारत हासिल करें।"
        }
      },
      {
        id: "coding-prompts",
        iconName: "code",
        title: { en: "Live Coding & Algorithm Prompts", hi: "कोडिंग और एल्गोरिदम प्रश्न" },
        description: {
          en: "Practical problem prompts with optimal Big-O complexity analysis and edge case checklists.",
          hi: "सर्वोत्तम Big-O समय जटिलता और एज-केस चेकलिस्ट के साथ कोडिंग प्रश्न।"
        }
      },
      {
        id: "star-rubrics",
        iconName: "messages-square",
        title: { en: "STAR Method Behavioral Rubric", hi: "STAR पद्धति और व्यवहार कुशलता" },
        description: {
          en: "Structure your project stories using Situation, Task, Action, and Result for maximum interviewer impact.",
          hi: "Situation, Task, Action और Result (STAR) के साथ अपने प्रोजेक्ट अनुभवों को प्रभावशाली बनाएं।"
        }
      },
      {
        id: "interviewer-critique",
        iconName: "shield-check",
        title: { en: "Interviewer Evaluation Rubrics", hi: "परीक्षक मूल्यांकन मानदंड" },
        description: {
          en: "Learn exactly what hiring managers evaluate: communication clarity, technical depth, and trade-off defense.",
          hi: "सटीक समझें कि इंटरव्यूअर क्या देखते हैं: संवाद स्पष्टता, तकनीकी गहराई और निर्णयों का बचाव।"
        }
      }
    ],
    learningInfo: {
      strategyTitle: { en: "Interview Articulation Protocol", hi: "साक्षात्कार में उत्तर देने की सही रणनीति" },
      strategySteps: [
        {
          en: "Never jump straight into coding — spend the first 3-5 minutes clarifying requirements and constraints.",
          hi: "सीधे कोडिंग शुरू न करें — पहले 3-5 मिनट आवश्यकताओं और बाधाओं को स्पष्ट करने में लगाएं।"
        },
        {
          en: "Think aloud: state your baseline brute-force approach first, then explain how you will optimize it.",
          hi: "बोलकर सोचें: पहले साधारण समाधान बताएं, फिर बताएं कि आप इसे कैसे अनुकूलित करेंगे।"
        },
        {
          en: "When asked about architecture, always present two alternatives and defend your final choice.",
          hi: "आर्किटेक्चर के प्रश्नों में दो विकल्प प्रस्तुत करें और बताएं कि आपने अंतिम विकल्प क्यों चुना।"
        },
        {
          en: "State boundary conditions and test cases proactively before the interviewer prompts you.",
          hi: "इंटरव्यूअर के पूछने से पहले ही सीमावर्ती स्थितियों (Boundary Cases) और परीक्षण मामलों का उल्लेख करें।"
        }
      ],
      learningOutcome: {
        en: "Walk into technical screening and onsite rounds with structured poise, clarity, and authority.",
        hi: "तकनीकी साक्षात्कारों में आत्मविश्वास, स्पष्ट संवाद और तकनीकी अधिकार के साथ सफलता पाएं।"
      },
      proTip: {
        en: "Practice explaining complex topics in simple terms without relying on excessive buzzwords.",
        hi: "जटिल अवधारणाओं को सरल शब्दों में समझाने का अभ्यास करें — स्पष्टता ही चयन की कुंजी है।"
      },
      quickTags: [
        { en: "System Design", hi: "सिस्टम डिज़ाइन" },
        { en: "STAR Method", hi: "STAR पद्धति" },
        { en: "Big-O Analysis", hi: "Big-O विश्लेषण" },
        { en: "Trade-offs", hi: "तुलना व निर्णय" }
      ]
    }
  },

  // Mentors Page
  mentors: {
    id: "mentors",
    badge: { en: "Advisory & Guidance", hi: "मार्गदर्शन एवं परामर्श" },
    heading: { en: "AI Mentors & Career Advisory", hi: "एआई मेंटर्स और करियर परामर्श" },
    subheading: {
      en: "Specialized architect, coach, and reviewer personas for 1-on-1 personalized guidance and roadmaps.",
      hi: "व्यक्तिगत मार्गदर्शन और अध्ययन रोडमैप के लिए विशेषज्ञ आर्किटेक्ट, कोच और समीक्षक मेंटर्स।"
    },
    tone: {
      bg: "#e7f5f2",
      ink: "#226b5d",
      border: "#c7e8e0",
      badgeBg: "#d5eee7",
      badgeInk: "#164f44"
    },
    keyPoints: [
      {
        id: "persona-specialists",
        iconName: "users",
        title: { en: "Specialized Mentor Personas", hi: "विशेषज्ञ मेंटर पर्सोना" },
        description: {
          en: "Choose between Senior Software Architect, Exam Strategy Coach, and Code Reviewer for targeted feedback.",
          hi: "वरिष्ठ सॉफ्टवेयर आर्किटेक्ट, परीक्षा रणनीति कोच या कोड समीक्षक मेंटर्स से सीधे परामर्श लें।"
        }
      },
      {
        id: "personalized-plans",
        iconName: "compass",
        title: { en: "Personalized Study Roadmaps", hi: "अनुकूलित अध्ययन रोडमैप" },
        description: {
          en: "Receive milestone-based weekly study schedules tailored to your target exam date or job transition.",
          hi: "अपनी परीक्षा तिथि या करियर लक्ष्य के अनुसार सप्ताह-दर-सप्ताह अध्ययन योजना प्राप्त करें।"
        }
      },
      {
        id: "portfolio-critique",
        iconName: "check-circle-2",
        title: { en: "Code & Architecture Reviews", hi: "कोड और प्रोजेक्ट समीक्षा" },
        description: {
          en: "Share architectural designs and code snippets to receive constructive critique and refactoring tips.",
          hi: "अपने कोड और डिज़ाइन साझा करें तथा सुधार और पुनर्गठन के उपयोगी सुझाव पाएं।"
        }
      },
      {
        id: "unblock-plateaus",
        iconName: "sparkles",
        title: { en: "Overcoming Learning Plateaus", hi: "अध्ययन में आने वाली रुकावटों का समाधान" },
        description: {
          en: "Get unblocked when stuck on confusing bugs, abstract math proofs, or complex distributed systems.",
          hi: "कठिन बग्स, अमूर्त गणितीय प्रमेयों या जटिल सिस्टम्स में अटके होने पर तुरंत स्पष्ट मार्गदर्शन पाएं।"
        }
      }
    ],
    learningInfo: {
      strategyTitle: { en: "Mentorship Interaction Guidelines", hi: "मेंटर से अधिकतम लाभ पाने के नियम" },
      strategySteps: [
        {
          en: "State your exact background and goal upfront (e.g. 'I am preparing for SSC CGL Tier-1 in 3 months').",
          hi: "अपनी पृष्ठभूमि और लक्ष्य स्पष्ट बताएं (जैसे 'मैं 3 महीने में SSC CGL Tier-1 की तैयारी कर रहा हूँ')।"
        },
        {
          en: "Share what you have already tried and where you encountered confusion or failure.",
          hi: "बताएं कि आपने अब तक क्या प्रयास किए हैं और आपको कहाँ कठिनाई आ रही है।"
        },
        {
          en: "Ask for actionable next steps: request 3 concrete tasks to accomplish before the next check-in.",
          hi: "कार्रवाई योग्य कदम मांगें: अगले सत्र से पहले पूरे करने के लिए 3 ठोस कार्य निर्धारित करें।"
        },
        {
          en: "Execute the advice immediately, then report back with your results for continuous calibration.",
          hi: "सलाह पर तुरंत अमल करें और निरंतर सुधार के लिए मेंटर को अपनी प्रगति से अवगत कराएं।"
        }
      ],
      learningOutcome: {
        en: "Save months of trial and error with tailored expert insight and disciplined accountability.",
        hi: "विशेषज्ञ मार्गदर्शन और अनुशासित योजना से महीनों का समय और भटकाव बचाएं।"
      },
      proTip: {
        en: "Treat your AI mentor like a senior colleague: concise, detailed questions yield world-class insights.",
        hi: "मेंटर से वरिष्ठ सहकर्मी की तरह बात करें: संक्षिप्त और सटीक प्रश्न सबसे उच्च कोटि की सलाह देते हैं।"
      },
      quickTags: [
        { en: "1-on-1 Guidance", hi: "व्यक्तिगत मार्गदर्शन" },
        { en: "Career Coaching", hi: "करियर कोचिंग" },
        { en: "Code Review", hi: "कोड समीक्षा" },
        { en: "Roadmaps", hi: "अध्ययन रोडमैप" }
      ]
    }
  },

  // My Library Tab
  library: {
    id: "library",
    badge: { en: "Personal Vault", hi: "व्यक्तिगत वॉल्ट" },
    heading: { en: "My Library & Generated Notes", hi: "मेरी लाइब्रेरी और सहेजे गए नोट्स" },
    subheading: {
      en: "Your personal archive of custom-generated curricula, reading progress, and exported notes.",
      hi: "आपके द्वारा जनरेट किए गए व्यक्तिगत पाठ्यक्रम, पठन प्रगति और सहेजे गए नोट्स का संग्रह।"
    },
    tone: {
      bg: "#f6f3ed",
      ink: "#5c4c37",
      border: "#e3dcce",
      badgeBg: "#ede5d5",
      badgeInk: "#473a2a"
    },
    keyPoints: [
      {
        id: "custom-archive",
        iconName: "book-open",
        title: { en: "Custom Generated Notes Archive", hi: "व्यक्तिगत जनरेटेड नोट्स संग्रह" },
        description: {
          en: "Every custom AI study curriculum you request is saved permanently to your personal library.",
          hi: "आपके द्वारा अनुरोधित प्रत्येक कस्टम एआई अध्ययन पाठ्यक्रम आपकी लाइब्रेरी में हमेशा सुरक्षित रहता है।"
        }
      },
      {
        id: "progress-tracking",
        iconName: "trending-up",
        title: { en: "Reading Progress Tracking", hi: "पठन प्रगति की निगरानी" },
        description: {
          en: "Monitor completed lessons, read minutes, and active documents across your study journey.",
          hi: "अपनी अध्ययन यात्रा में पूरे किए गए पाठों, पठन समय और सक्रिय दस्तावेज़ों को ट्रैक करें।"
        }
      },
      {
        id: "export-notes",
        iconName: "file-code",
        title: { en: "Instant Curriculum Copy", hi: "एक-क्लिक में नोट्स कॉपी करें" },
        description: {
          en: "Export formatted markdown outlines, lesson objectives, and glossaries directly to your clipboard.",
          hi: "फॉर्मेट किए गए मार्कडाउन सारांश, पाठ उद्देश्य और शब्दावली को सीधे क्लिपबोर्ड पर कॉपी करें।"
        }
      },
      {
        id: "retry-regenerate",
        iconName: "sparkles",
        title: { en: "Regenerate & Refine Anytime", hi: "किसी भी समय नया रूप दें" },
        description: {
          en: "Retry generation with different language or skill level parameters to adapt to your evolving needs.",
          hi: "अपनी बदलती ज़रूरतों के अनुसार अलग भाषा या कठिनाई स्तर के साथ नोट्स को पुनः जनरेट करें।"
        }
      }
    ],
    learningInfo: {
      strategyTitle: { en: "Personal Knowledge Management Flow", hi: "ज्ञान प्रबंधन और पुनरावलोकन पद्धति" },
      strategySteps: [
        {
          en: "Review active documents in your library at least once every weekend to consolidate progress.",
          hi: "प्रगति सुदृढ़ करने के लिए हर सप्ताहांत अपनी लाइब्रेरी के सक्रिय दस्तावेज़ों की समीक्षा करें।"
        },
        {
          en: "Delete outdated or test documents to keep your reading queue uncluttered and motivating.",
          hi: "अपनी पठन सूची को स्पष्ट रखने के लिए अप्रचलित या परीक्षण दस्तावेज़ों को हटा दें।"
        },
        {
          en: "Use 'Copy notes' to transfer important chapter outlines into external note tools if desired.",
          hi: "महत्वपूर्ण अध्यायों को अपने व्यक्तिगत नोट टूल्स में सुरक्षित करने के लिए 'Copy notes' का उपयोग करें।"
        },
        {
          en: "Track your completion percentage to maintain high learning accountability.",
          hi: "उच्च अनुशासन बनाए रखने के लिए अपनी पूर्णता प्रतिशतता (Completion %) पर नज़र रखें।"
        }
      ],
      learningOutcome: {
        en: "Transform scattered study sessions into an organized, compoundable personal knowledge asset.",
        hi: "बिखरे हुए अध्ययन को एक व्यवस्थित और दीर्घकालिक व्यक्तिगत ज्ञान धरोहर में बदलें।"
      },
      proTip: {
        en: "Use the search bar at the top of your library to instantly filter notes by technology or keyword.",
        hi: "नोट्स को तकनीक या कीवर्ड से तुरंत खोजने के लिए लाइब्रेरी के शीर्ष पर दिए सर्च बार का उपयोग करें।"
      },
      quickTags: [
        { en: "Saved Curricula", hi: "सहेजे गए नोट्स" },
        { en: "Reading Progress", hi: "पठन प्रगति" },
        { en: "Markdown Export", hi: "मार्कडाउन कॉपी" },
        { en: "Regeneration", hi: "पुनः जनरेशन" }
      ]
    }
  },

  // Plans & Membership Tab
  plans: {
    id: "plans",
    badge: { en: "Membership Hub", hi: "सदस्यता केंद्र" },
    heading: { en: "Membership Plans & Unrestricted Learning", hi: "सदस्यता योजनाएं और असीमित शिक्षण" },
    subheading: {
      en: "Transparent Indian pricing with Razorpay for unlimited AI queries, full course coverage, and sandbox tools.",
      hi: "असीमित एआई प्रश्नों, संपूर्ण पाठ्यक्रम और सैंडबॉक्स उपकरणों के लिए रेज़रपे द्वारा पारदर्शी भारतीय दरें।"
    },
    tone: {
      bg: "#fef9e7",
      ink: "#735610",
      border: "#f5e6a8",
      badgeBg: "#faefb9",
      badgeInk: "#5a4209"
    },
    keyPoints: [
      {
        id: "full-coverage",
        iconName: "layers",
        title: { en: "Complete Curriculum Access", hi: "संपूर्ण पाठ्यक्रम की पहुंच" },
        description: {
          en: "Full access across all 60+ technology build guides, board exam syllabi, and competitive exam tracks.",
          hi: "सभी 60+ तकनीकी गाइड्स, बोर्ड परीक्षा पाठ्यक्रमों और प्रतियोगी परीक्षा ट्रैक्स की पूर्ण पहुंच।"
        }
      },
      {
        id: "unlimited-ai",
        iconName: "sparkles",
        title: { en: "Uncapped AI Study Engine", hi: "असीमित एआई अध्ययन सहायता" },
        description: {
          en: "Ask unlimited architecture, coding, and concept questions without restrictive daily query caps.",
          hi: "दैनिक सीमाओं के बिना असीमित आर्किटेक्चर, कोडिंग और शैक्षणिक प्रश्न पूछें।"
        }
      },
      {
        id: "razorpay-billing",
        iconName: "shield-check",
        title: { en: "Secure Indian Billing (UPI & Cards)", hi: "सुरक्षित भुगतान (UPI और कार्ड्स)" },
        description: {
          en: "Live transparent pricing with instant UPI, debit/credit cards, and netbanking powered by Razorpay.",
          hi: "रेज़रपे द्वारा संचालित UPI, डेबिट/क्रेडिट कार्ड और नेटबैंकिंग से तुरंत पारदर्शी भुगतान।"
        }
      },
      {
        id: "cancel-anytime",
        iconName: "clock",
        title: { en: "Zero Lock-in & Easy Cancellation", hi: "बिना किसी बंधन के आसान प्रबंधन" },
        description: {
          en: "Manage your monthly or annual subscription directly with full control and zero hidden commitments.",
          hi: "बिना किसी छुपे नियम के अपनी मासिक या वार्षिक सदस्यता को सीधे आसानी से प्रबंधित करें।"
        }
      }
    ],
    learningInfo: {
      strategyTitle: { en: "Membership Advantages", hi: "सदस्यता के प्रमुख लाभ" },
      strategySteps: [
        {
          en: "Choose your active preparations during onboarding to tailor your dashboard layout.",
          hi: "अपनी पसंद के अनुसार डैशबोर्ड सेट करने के लिए अपनी सक्रिय परीक्षाओं का चयन करें।"
        },
        {
          en: "Utilize both offline verified notes and live AI queries to accelerate your learning speed.",
          hi: "सीखने की गति दोगुनी करने के लिए सत्यापित नोट्स और लाइव एआई दोनों का उपयोग करें।"
        },
        {
          en: "Practice without limits in the Techy code lab and test your skills in timed quizzes.",
          hi: "Techy कोड लैब में बिना किसी सीमा के कोडिंग करें और समयबद्ध क्विज़ में अभ्यास करें।"
        },
        {
          en: "Export unlimited formatted markdown summaries for your personal offline notebook.",
          hi: "व्यक्तिगत अध्ययन के लिए असीमित मार्कडाउन सारांश कॉपी और निर्यात करें।"
        }
      ],
      learningOutcome: {
        en: "Active members achieve 3x faster exam readiness and engineering skill acquisition with unrestricted tools.",
        hi: "असीमित सुविधाओं के साथ सदस्य 3 गुना तेज़ी से परीक्षा और तकनीकी कौशल में निपुणता प्राप्त करते हैं।"
      },
      proTip: {
        en: "Annual membership plans provide substantial savings and guarantee uninterrupted preparation for your target exam year.",
        hi: "वार्षिक सदस्यता योजनाएं अत्यधिक किफ़ायती हैं और आपकी पूरी परीक्षा अवधि में निर्बाध अध्ययन सुनिश्चित करती हैं।"
      },
      quickTags: [
        { en: "Full Access", hi: "पूर्ण पहुंच" },
        { en: "Unlimited AI", hi: "असीमित एआई" },
        { en: "UPI & Cards", hi: "UPI और कार्ड्स" },
        { en: "Zero Lock-in", hi: "आसान कैंसलेशन" }
      ]
    }
  },

  // Settings / Connections Tab
  settings: {
    id: "settings",
    badge: { en: "Account Settings", hi: "अकाउंट सेटिंग्स" },
    heading: { en: "Settings & AI Provider Connections", hi: "सेटिंग्स और एआई प्रोवाइडर कनेक्शन" },
    subheading: {
      en: "Configure your custom AI API keys, local browser storage preferences, and data privacy.",
      hi: "अपनी कस्टम एआई एपीआई कीज, स्थानीय ब्राउज़र स्टोरेज प्राथमिकताएं और डेटा गोपनीयता प्रबंधित करें।"
    },
    tone: {
      bg: "#f4f4f3",
      ink: "#3a3935",
      border: "#deddd9",
      badgeBg: "#e8e7e4",
      badgeInk: "#262523"
    },
    keyPoints: [
      {
        id: "byo-keys",
        iconName: "shield-check",
        title: { en: "Custom AI API Keys", hi: "कस्टम एआई एपीआई कीज" },
        description: {
          en: "Bring your own Anthropic or Perplexity keys for dedicated throughput and direct quota control.",
          hi: "अपनी खुद की Anthropic या Perplexity कीज जोड़कर समर्पित स्पीड और कोटा का उपयोग करें।"
        }
      },
      {
        id: "browser-privacy",
        iconName: "lock",
        title: { en: "Client-Side Privacy", hi: "क्लाइंट-साइड डेटा गोपनीयता" },
        description: {
          en: "API keys are stored securely in your browser and used only for your direct study requests.",
          hi: "आपकी एपीआई कीज आपके ब्राउज़र में सुरक्षित रहती हैं और केवल आपके अध्ययन अनुरोधों के लिए उपयोग होती हैं।"
        }
      },
      {
        id: "language-pref",
        iconName: "languages",
        title: { en: "Default Language Setting", hi: "डिफ़ॉल्ट भाषा वरीयता" },
        description: {
          en: "Set your preferred interface and lesson reading language (English or Hindi) across all sessions.",
          hi: "सभी सत्रों के लिए अपनी पसंदीदा इंटरफेस और पठन भाषा (अंग्रेजी या हिन्दी) निर्धारित करें।"
        }
      },
      {
        id: "cache-control",
        iconName: "clock",
        title: { en: "Local Cache & History", hi: "स्थानीय कैश और हिस्ट्री प्रबंधन" },
        description: {
          en: "Manage your search history, saved step cards, and vocabulary word drills stored in localStorage.",
          hi: "अपने ब्राउज़र स्टोरेज में सहेजी गई सर्च हिस्ट्री, स्टेप कार्ड्स और वोकैबुलरी हिस्ट्री को प्रबंधित करें।"
        }
      }
    ],
    learningInfo: {
      strategyTitle: { en: "Workspace Configuration Tips", hi: "कार्यशाला कॉन्फ़िगरेशन सुझाव" },
      strategySteps: [
        {
          en: "Add your Anthropic API key to unlock Claude 3.5 Sonnet responses with the highest architectural depth.",
          hi: "गहन आर्किटेक्चरल उत्तरों के लिए अपनी Anthropic API key जोड़ें।"
        },
        {
          en: "Add your Perplexity API key for answers with live web research and source links.",
          hi: "ताज़ा वेब रिसर्च और स्रोतों के साथ उत्तर पाने के लिए अपनी Perplexity API key जोड़ें।"
        },
        {
          en: "Verify that your selected language matches your upcoming examination medium.",
          hi: "सुनिश्चित करें कि आपकी चुनी हुई भाषा आपकी आगामी परीक्षा के माध्यम से मेल खाती हो।"
        },
        {
          en: "Keep your browser cookies and local storage enabled to preserve your study history.",
          hi: "अपनी अध्ययन हिस्ट्री सुरक्षित रखने के लिए ब्राउज़र कुकीज़ और लोकल स्टोरेज चालू रखें।"
        }
      ],
      learningOutcome: {
        en: "Enjoy a tailored, lightning-fast study environment configured to your exact technical preferences.",
        hi: "अपनी सटीक प्राथमिकताओं के अनुसार अनुकूलित, तीव्र और सुरक्षित अध्ययन अनुभव का आनंद लें।"
      },
      proTip: {
        en: "API keys are encrypted in browser local storage and never logged or shared across users.",
        hi: "आपकी API कीज ब्राउज़र में एन्क्रिप्टेड रहती हैं और कभी किसी अन्य यूज़र के साथ साझा नहीं की जातीं।"
      },
      quickTags: [
        { en: "BYO API Keys", hi: "कस्टम API कीज" },
        { en: "Local Privacy", hi: "लोकल गोपनीयता" },
        { en: "Language Setting", hi: "भाषा वरीयता" },
        { en: "Storage Control", hi: "स्टोरेज नियंत्रण" }
      ]
    }
  }
};

/**
 * Returns dynamic highlight configuration for preparation categories like CBSE, SSC, Banking, etc.
 */
export function getCategoryHighlightConfig(category: string, preparationLabel?: { en: string; hi: string }): PageHighlightConfig {
  const titleEn = preparationLabel?.en ?? category.toUpperCase();
  const titleHi = preparationLabel?.hi ?? category.toUpperCase();

  return {
    id: `category-${category}`,
    badge: { en: "Preparation Hub", hi: "तैयारी केंद्र" },
    heading: {
      en: `${titleEn} · Key Points & Curriculum Highlights`,
      hi: `${titleHi} · मुख्य बिंदु एवं पाठ्यक्रम हाइलाइट्स`
    },
    subheading: {
      en: `Focused curriculum guides, worked solutions, and exam preparation material for ${titleEn}.`,
      hi: `${titleHi} के लिए केंद्रित पाठ्यक्रम मार्गदर्शिका, हल किए गए उत्तर और परीक्षा तैयारी सामग्री।`
    },
    tone: {
      bg: "#edf5ee",
      ink: "#28633b",
      border: "#d0e5d4",
      badgeBg: "#dbeedf",
      badgeInk: "#1a4d29"
    },
    keyPoints: [
      {
        id: "cat-syllabus",
        iconName: "book-open",
        title: { en: "Official Syllabus Alignment", hi: "आधिकारिक पाठ्यक्रम के अनुसार" },
        description: {
          en: `All guides for ${titleEn} are structured according to the latest official examination patterns and subject weightage.`,
          hi: `${titleHi} के सभी गाइड नवीनतम आधिकारिक परीक्षा पैटर्न और अंक वितरण के अनुसार तैयार किए गए हैं।`
        }
      },
      {
        id: "cat-bilingual",
        iconName: "languages",
        title: { en: "Bilingual Learning Support", hi: "द्विभाषी अध्ययन सुविधा" },
        description: {
          en: "Read every chapter guide, formula sheet, and practice set with instant English and Hindi language toggles.",
          hi: "प्रत्येक अध्याय, सूत्र सूची और अभ्यास सेट को तुरंत अंग्रेजी और हिन्दी टॉगल के साथ पढ़ें।"
        }
      },
      {
        id: "cat-worked-solutions",
        iconName: "check-circle-2",
        title: { en: "Worked Questions & Solutions", hi: "हल किए गए मॉडल प्रश्न" },
        description: {
          en: "Step-by-step worked answers that demonstrate exact scoring methodologies for examinations.",
          hi: "चरण-दर-चरण हल किए गए उत्तर जो परीक्षाओं में पूरे अंक प्राप्त करने की सही विधि सिखाते हैं।"
        }
      },
      {
        id: "cat-exam-focus",
        iconName: "target",
        title: { en: "High-Yield Exam Focus", hi: "परीक्षा उपयोगी मुख्य विषय" },
        description: {
          en: "Prioritize recurring topics and high-frequency questions to maximize your preparation efficiency.",
          hi: "परीक्षा में बार-बार पूछे जाने वाले उच्च-प्राथमिकता वाले अध्यायों को पहले तैयार करें।"
        }
      }
    ],
    learningInfo: {
      strategyTitle: { en: `${titleEn} Preparation Strategy`, hi: `${titleHi} तैयारी रणनीति` },
      strategySteps: [
        {
          en: "Filter guides by your specific class or exam tier using the filters above.",
          hi: "ऊपर दिए गए फ़िल्टर का उपयोग करके अपनी कक्षा या परीक्षा टियर के अनुसार गाइड चुनें।"
        },
        {
          en: "Complete core concept notes first, making bulleted summaries of formulas and definitions.",
          hi: "पहले मूल अवधारणा नोट्स पढ़ें और सूत्रों व परिभाषाओं के संक्षिप्त नोट्स बनाएं।"
        },
        {
          en: "Solve the original practice problems independently before reading the worked steps.",
          hi: "हल देखने से पहले अभ्यास प्रश्नों को स्वयं हल करने का प्रयास करें।"
        },
        {
          en: "Bookmark chapters that require revision and review them weekly to maintain retention.",
          hi: "कठिन अध्यायों को बुकमार्क करें और स्मृति बनाए रखने के लिए हर सप्ताह उनका रिवीजन करें।"
        }
      ],
      learningOutcome: {
        en: `Achieve comprehensive mastery of ${titleEn} with clear conceptual foundations and exam-ready confidence.`,
        hi: `${titleHi} के पूरे पाठ्यक्रम पर मजबूत पकड़ बनाएं और आत्मविश्वास के साथ परीक्षा में सफल हों।`
      },
      proTip: {
        en: "Focus on understanding foundational principles first — shortcuts and speed tricks come naturally with practice.",
        hi: "पहले बुनियादी सिद्धांतों को समझें — शॉर्टकट और प्रश्नों को तेजी से हल करने की गति अभ्यास से स्वयं आ जाएगी।"
      },
      quickTags: [
        { en: `${titleEn} Syllabus`, hi: `${titleHi} पाठ्यक्रम` },
        { en: "Bilingual Notes", hi: "द्विभाषी नोट्स" },
        { en: "High Yield", hi: "उच्च अंक भार" },
        { en: "Worked Solutions", hi: "हल सहित प्रश्न" }
      ]
    }
  };
}

/**
 * Resolves the appropriate highlight config given category, tab, and active preparation.
 */
export function resolvePageHighlight(category?: string, tab?: string, activePreparation?: { label: { en: string; hi: string } }): PageHighlightConfig {
  if (category) {
    if (PAGE_HIGHLIGHTS[category]) {
      return PAGE_HIGHLIGHTS[category];
    }
    return getCategoryHighlightConfig(category, activePreparation?.label);
  }

  if (tab && PAGE_HIGHLIGHTS[tab]) {
    return PAGE_HIGHLIGHTS[tab];
  }

  return PAGE_HIGHLIGHTS.dashboard;
}
