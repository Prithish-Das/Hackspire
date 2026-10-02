export interface MemoryLaneQuestion {
  id: string;
  category: string;
  era: string; // e.g. "1960s - 1980s"
  region?: string;
  difficulty: "beginner" | "moderate" | "advanced";
  question: {
    en: string;
    bn: string;
    hi: string;
  };
  options: {
    en: string[];
    bn: string[];
    hi: string[];
  };
  correctIndex: number;
  image?: string;
  imageMeta?: {
    title: string;
    creator: string;
    source: string;
    license: string;
  };
}

export const MEMORY_LANE_QUESTIONS: MemoryLaneQuestion[] = [
  {
    id: "mlq-1",
    category: "Cricket & Sports",
    era: "1983 World Cup Era",
    region: "All-India",
    difficulty: "beginner",
    question: {
      en: "Who was the captain of the Indian cricket team that lifted the 1983 World Cup at Lord's?",
      bn: "১৯৮৩ সালে লর্ডসে প্রথম ক্রিকেট বিশ্বকাপ জয়ী ভারতীয় দলের অধিনায়ক কে ছিলেন?",
      hi: "१९८३ में लॉर्ड्स में पहला क्रिकेट विश्व कप जीतने वाली भारतीय टीम के कप्तान कौन थे?"
    },
    options: {
      en: ["Kapil Dev", "Sunil Gavaskar", "Mohinder Amarnath", "Ravi Shastri"],
      bn: ["কপিল দেব", "সুনীল গাভাস্কার", "মহিন্দর অমরনাথ", "রবি শাস্ত্রী"],
      hi: ["कपिल देव", "सुनील गावस्कर", "मोहिंदर अमरनाथ", "रवि शास्त्री"]
    },
    correctIndex: 0,
    image: "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=700&auto=format&fit=crop&q=80",
    imageMeta: {
      title: "Cricket Ground & Pitch",
      creator: "Sports Collection",
      source: "Unsplash",
      license: "Unsplash Free License"
    }
  },
  {
    id: "mlq-2",
    category: "Indian Cinema",
    era: "1970s - 1980s",
    region: "All-India",
    difficulty: "beginner",
    question: {
      en: "In the legendary 1975 film 'Sholay', which iconic character lived in Ramgarh and declared 'Yeh haath humko de de, Thakur'?",
      bn: "১৯৭৫ সালের জনপ্রিয় হিন্দি চলচ্চিত্র 'শোলে'-তে রামগড়ের ডাকাত গব্বর সিংয়ের বিপরীতে কে ছিলেন?",
      hi: "१९७५ की सुप्रसिद्ध फ़िल्म 'शोले' में डाकू गब्बर सिंह का किरदार किसने निभाया था?"
    },
    options: {
      en: ["Amjad Khan (Gabbar Singh)", "Sanjeev Kumar", "Dharmendra", "Amitabh Bachchan"],
      bn: ["আমজাদ খান (গব্বর সিং)", "সঞ্জীব কুমার", "ধর্মেন্দ্র", "অমিতাভ বচ্চন"],
      hi: ["अमजद खान (गब्बर सिंह)", "संजीव कुमार", "धर्मेन्द्र", "अमिताभ बच्चन"]
    },
    correctIndex: 0,
    image: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=700&auto=format&fit=crop&q=80",
    imageMeta: {
      title: "Vintage Cinema Projector",
      creator: "Cinema Archive",
      source: "Unsplash",
      license: "Unsplash Free License"
    }
  },
  {
    id: "mlq-3",
    category: "Music & Performing Arts",
    era: "1960s - 1970s",
    region: "All-India",
    difficulty: "beginner",
    question: {
      en: "Which beloved singer was fondly called the 'Nightingale of India' (Bharat Kokila) and recorded 'Aye Mere Watan Ke Logo'?",
      bn: "কোন শ্রদ্ধেয় সঙ্গীতশিল্পীকে 'ভারতের নাইটিঙ্গেল' বলা হতো এবং যিনি 'অ্যায় মেরে ওয়াতন কে লোগো' গেয়েছিলেন?",
      hi: "किस महान गायिका को 'स्वर कोकिला' कहा गया और जिन्होंने 'ऐ मेरे वतन के लोगों' गाया था?"
    },
    options: {
      en: ["Lata Mangeshkar", "Asha Bhosle", "Geeta Dutt", "Suraiya"],
      bn: ["লতা মঙ্গেশকর", "আশা ভোঁসলে", "গীতা দত্ত", "সুরাইয়া"],
      hi: ["लता मंगेशकर", "आशा भोसले", "गीता दत्त", "सुरैया"]
    },
    correctIndex: 0,
    image: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=700&auto=format&fit=crop&q=80",
    imageMeta: {
      title: "Microphone & Musical Heritage",
      creator: "Audio Archive",
      source: "Unsplash",
      license: "Unsplash Free License"
    }
  },
  {
    id: "mlq-4",
    category: "Regional Culture & Cinema",
    era: "1950s - 1970s",
    region: "Bengal & Eastern India",
    difficulty: "moderate",
    question: {
      en: "Which internationally celebrated filmmaker directed the timeless Apu Trilogy, starting with 'Pather Panchali' (1955)?",
      bn: "১৯৫৫ সালে মুক্তিপ্রাপ্ত কালজয়ী 'পথের পাঁচালী' এবং অপু ট্রিলজির পরিচালক কে ছিলেন?",
      hi: "१९५५ की अमर फ़िल्म 'पाथेर पांचाली' और अपू त्रयी के विश्वविख्यात निर्देशक कौन थे?"
    },
    options: {
      en: ["Satyajit Ray", "Ritwik Ghatak", "Mrinal Sen", "Tapan Sinha"],
      bn: ["সত্যজিৎ রায়", "ঋত্বিক ঘটক", "মৃণাল সেন", "তপন সিংহ"],
      hi: ["सत्यजीत रे", "ऋत्विक घटक", "मृणाल सेन", "तपन सिन्हा"]
    },
    correctIndex: 0,
    image: "https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=700&auto=format&fit=crop&q=80",
    imageMeta: {
      title: "Classic Film Strip",
      creator: "Ray Film Archive",
      source: "Wikimedia Commons",
      license: "Public Domain / CC BY"
    }
  },
  {
    id: "mlq-5",
    category: "Television & Doordarshan",
    era: "1980s",
    region: "All-India",
    difficulty: "moderate",
    question: {
      en: "Which monumental television serial directed by Ramanand Sagar brought Sunday mornings across India to a standstill in 1987-1988?",
      bn: "১৯৮৭ সালে দূরদর্শনে প্রচারিত রামানন্দ সাগরের কোন পৌরাণিক ধারাবাহিকটির সময় রবিবার সকালে গোটা দেশ স্তব্ধ হয়ে যেত?",
      hi: "१९८७-८८ में दूरदर्शन पर प्रसारित रामानंद सागर के किस धारावाहिक के समय रविवार सुबह सड़कें खाली हो जाती थीं?"
    },
    options: {
      en: ["Ramayan", "Mahabharat", "Hum Log", "Buniyaad"],
      bn: ["রামায়ণ", "মহাভারত", "হাম লোগ", "বুনিয়াদ"],
      hi: ["रामायण", "महाभारत", "हम लोग", "बुनियाद"]
    },
    correctIndex: 0,
    image: "https://images.unsplash.com/photo-1593784991095-a205069470b6?w=700&auto=format&fit=crop&q=80",
    imageMeta: {
      title: "Retro Television",
      creator: "Vintage Tech",
      source: "Unsplash",
      license: "Unsplash Free License"
    }
  },
  {
    id: "mlq-6",
    category: "National Events",
    era: "1960s - 1970s",
    region: "All-India",
    difficulty: "moderate",
    question: {
      en: "In which year did India celebrate its historic Silver Jubilee (25 years) of Independence?",
      bn: "ভারত কোন সালে তার স্বাধীনতার ঐতিহাসিক রৌপ্যজয়ন্তী (২৫ বছর) উদযাপন করেছিল?",
      hi: "भारत ने किस वर्ष अपनी आज़ादी की ऐतिहासिक रजत जयंती (२५ वर्ष) मनाई थी?"
    },
    options: {
      en: ["1972", "1970", "1975", "1967"],
      bn: ["১৯৭২", "১৯৭০", "১৯৭৫", "১৯৬৭"],
      hi: ["१९७२", "१९७०", "१९७५", "१९६७"]
    },
    correctIndex: 0,
    image: "https://images.unsplash.com/photo-1532375810709-75b1da00537c?w=700&auto=format&fit=crop&q=80",
    imageMeta: {
      title: "Tricolor of India",
      creator: "National Collection",
      source: "Wikimedia Commons",
      license: "Public Domain"
    }
  }
];
