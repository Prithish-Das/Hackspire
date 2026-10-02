export interface PatternItem {
  shape: "circle" | "square" | "triangle" | "star" | "diamond";
  color: string; // CSS color
  colorName: { en: string; bn: string; hi: string };
  symbol: string;
}

export interface CompletePatternQuestion {
  id: string;
  difficulty: "beginner" | "moderate" | "advanced";
  ruleType: string;
  sequence: (PatternItem | null)[]; // null represents the "?" missing item
  missingIndex: number;
  options: PatternItem[];
  correctIndex: number;
  explanation: {
    en: string;
    bn: string;
    hi: string;
  };
}

const RED_CIRCLE: PatternItem = {
  shape: "circle",
  color: "#ef4444",
  colorName: { en: "Red Circle", bn: "লাল বৃত্ত", hi: "लाल वृत्त" },
  symbol: "🔴"
};

const BLUE_CIRCLE: PatternItem = {
  shape: "circle",
  color: "#3b82f6",
  colorName: { en: "Blue Circle", bn: "নীল বৃত্ত", hi: "नीला वृत्त" },
  symbol: "🔵"
};

const YELLOW_SQUARE: PatternItem = {
  shape: "square",
  color: "#eab308",
  colorName: { en: "Yellow Square", bn: "হলুদ বর্গ", hi: "पीला वर्ग" },
  symbol: "🟨"
};

const GREEN_SQUARE: PatternItem = {
  shape: "square",
  color: "#22c55e",
  colorName: { en: "Green Square", bn: "সবুজ বর্গ", hi: "हरा वर्ग" },
  symbol: "🟩"
};

const PURPLE_STAR: PatternItem = {
  shape: "star",
  color: "#a855f7",
  colorName: { en: "Purple Star", bn: "বেগুনি তারা", hi: "बैंगनी तारा" },
  symbol: "⭐"
};

const ORANGE_DIAMOND: PatternItem = {
  shape: "diamond",
  color: "#f97316",
  colorName: { en: "Orange Diamond", bn: "কমলা হীরা", hi: "नारंगी हीरा" },
  symbol: "🔶"
};

export const COMPLETE_PATTERN_QUESTIONS: CompletePatternQuestion[] = [
  // 1. Beginner: Simple ABAB repetition
  {
    id: "cp-1",
    difficulty: "beginner",
    ruleType: "Simple Repetition (ABAB)",
    sequence: [BLUE_CIRCLE, YELLOW_SQUARE, BLUE_CIRCLE, null],
    missingIndex: 3,
    options: [YELLOW_SQUARE, BLUE_CIRCLE, GREEN_SQUARE, RED_CIRCLE],
    correctIndex: 0,
    explanation: {
      en: "The pattern alternates between Blue Circle and Yellow Square.",
      bn: "প্যাটার্নটিতে নীল বৃত্ত এবং হলুদ বর্গ পর্যায়ক্রমে আসছে।",
      hi: "पैटर्न में नीला वृत्त और पीला वर्ग बारी-बारी से आ रहे हैं।"
    }
  },
  // 2. Beginner: Colors AABB
  {
    id: "cp-2",
    difficulty: "beginner",
    ruleType: "Paired Repetition (AABB)",
    sequence: [RED_CIRCLE, RED_CIRCLE, GREEN_SQUARE, null],
    missingIndex: 3,
    options: [GREEN_SQUARE, RED_CIRCLE, BLUE_CIRCLE, PURPLE_STAR],
    correctIndex: 0,
    explanation: {
      en: "Each shape appears twice in pairs: Two Red Circles, then Two Green Squares.",
      bn: "প্রতিটি আকার জোড়ায় জোড়ায় আসছে: দুটি লাল বৃত্ত, এরপর দুটি সবুজ বর্গ।",
      hi: "प्रत्येक आकार दो-दो के जोड़े में है: दो लाल वृत्त, फिर दो हरे वर्ग।"
    }
  },
  // 3. Moderate: Alternating Color + Shape ABC ABC
  {
    id: "cp-3",
    difficulty: "moderate",
    ruleType: "Three-Item Cycle (ABCABC)",
    sequence: [BLUE_CIRCLE, YELLOW_SQUARE, PURPLE_STAR, BLUE_CIRCLE, null, PURPLE_STAR],
    missingIndex: 4,
    options: [YELLOW_SQUARE, GREEN_SQUARE, RED_CIRCLE, ORANGE_DIAMOND],
    correctIndex: 0,
    explanation: {
      en: "The cycle repeats: Blue Circle → Yellow Square → Purple Star.",
      bn: "চক্রটি পুনরায় ঘটছে: নীল বৃত্ত → হলুদ বর্গ → বেগুনি তারা।",
      hi: "यह चक्र दोहराया जा रहा है: नीला वृत्त → पीला वर्ग → बैंगनी तारा।"
    }
  },
  // 4. Moderate: Alternating Shapes with consistent color
  {
    id: "cp-4",
    difficulty: "moderate",
    ruleType: "Shape Alternation",
    sequence: [YELLOW_SQUARE, ORANGE_DIAMOND, YELLOW_SQUARE, ORANGE_DIAMOND, null],
    missingIndex: 4,
    options: [YELLOW_SQUARE, ORANGE_DIAMOND, BLUE_CIRCLE, PURPLE_STAR],
    correctIndex: 0,
    explanation: {
      en: "The pattern alternates between Yellow Square and Orange Diamond.",
      bn: "প্যাটার্নটিতে হলুদ বর্গ ও কমলা হীরা পর্যায়ক্রমে আসছে।",
      hi: "पैटर्न में पीला वर्ग और नारंगी हीरा बारी-बारी से आ रहे हैं।"
    }
  },
  // 5. Advanced: Complex symmetry
  {
    id: "cp-5",
    difficulty: "advanced",
    ruleType: "Symmetric Palindromic Pattern",
    sequence: [RED_CIRCLE, GREEN_SQUARE, PURPLE_STAR, GREEN_SQUARE, null],
    missingIndex: 4,
    options: [RED_CIRCLE, BLUE_CIRCLE, YELLOW_SQUARE, ORANGE_DIAMOND],
    correctIndex: 0,
    explanation: {
      en: "Symmetrical sequence around the center star: Red, Green, Star, Green, Red.",
      bn: "কেন্দ্রে তারার দুই পাশে প্রতিসম নকশা: লাল, সবুজ, তারা, সবুজ, লাল।",
      hi: "बीच के तारे के दोनों ओर सममित क्रम: लाल, हरा, तारा, हरा, लाल।"
    }
  }
];
