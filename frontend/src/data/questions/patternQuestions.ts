export interface PatternItem {
  shape: string;
  color: string; // CSS color
  colorName: { en: string; bn: string; hi: string };
  symbol: string;
  rotationDeg?: number;
}

export interface CompletePatternQuestion {
  id: string;
  difficulty: "beginner" | "moderate" | "pro" | "advanced";
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

// Basic Items
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

const GREEN_CIRCLE: PatternItem = {
  shape: "circle",
  color: "#22c55e",
  colorName: { en: "Green Circle", bn: "সবুজ বৃত্ত", hi: "हरा वृत्त" },
  symbol: "🟢"
};

const YELLOW_CIRCLE: PatternItem = {
  shape: "circle",
  color: "#eab308",
  colorName: { en: "Yellow Circle", bn: "হলুদ বৃত্ত", hi: "पीला वृत्त" },
  symbol: "🟡"
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

const BLUE_SQUARE: PatternItem = {
  shape: "square",
  color: "#3b82f6",
  colorName: { en: "Blue Square", bn: "নীল বর্গ", hi: "नीला वर्ग" },
  symbol: "🟦"
};

const RED_SQUARE: PatternItem = {
  shape: "square",
  color: "#ef4444",
  colorName: { en: "Red Square", bn: "লাল বর্গ", hi: "लाल वर्ग" },
  symbol: "🟥"
};

const PURPLE_STAR: PatternItem = {
  shape: "star",
  color: "#a855f7",
  colorName: { en: "Purple Star", bn: "বেগুনি তারা", hi: "बैंगनी तारा" },
  symbol: "⭐"
};

const GOLD_STAR: PatternItem = {
  shape: "star",
  color: "#f59e0b",
  colorName: { en: "Gold Star", bn: "সোনালী তারা", hi: "सुनहरा तारा" },
  symbol: "🌟"
};

const GREEN_TRIANGLE: PatternItem = {
  shape: "triangle",
  color: "#16a34a",
  colorName: { en: "Green Triangle", bn: "সবুজ ত্রিভুজ", hi: "हरा त्रिभुज" },
  symbol: "🔺"
};

const BLUE_TRIANGLE: PatternItem = {
  shape: "triangle",
  color: "#2563eb",
  colorName: { en: "Blue Triangle", bn: "নীল ত্রিভুজ", hi: "नीला त्रिभुज" },
  symbol: "🔷"
};

const RED_TRIANGLE: PatternItem = {
  shape: "triangle",
  color: "#ef4444",
  colorName: { en: "Red Triangle", bn: "লাল ত্রিভুজ", hi: "लाल त्रिभुज" },
  symbol: "🔺"
};

const ORANGE_DIAMOND: PatternItem = {
  shape: "diamond",
  color: "#f97316",
  colorName: { en: "Orange Diamond", bn: "কমলা হীরা", hi: "नारंगी हीरा" },
  symbol: "🔶"
};

const TEAL_DIAMOND: PatternItem = {
  shape: "diamond",
  color: "#0d9488",
  colorName: { en: "Teal Diamond", bn: "ময়ূরকণ্ঠী হীরা", hi: "नील-हरित हीरा" },
  symbol: "💠"
};

// Rotations and Shapes for Pro / Moderate
const ARROW_UP: PatternItem = {
  shape: "arrow",
  color: "#2563eb",
  colorName: { en: "Up Arrow", bn: "উপরের তীর", hi: "ऊपर का तीर" },
  symbol: "⬆️",
  rotationDeg: 0
};

const ARROW_RIGHT: PatternItem = {
  shape: "arrow",
  color: "#2563eb",
  colorName: { en: "Right Arrow", bn: "ডানের তীর", hi: "दायां तीर" },
  symbol: "➡️",
  rotationDeg: 90
};

const ARROW_DOWN: PatternItem = {
  shape: "arrow",
  color: "#2563eb",
  colorName: { en: "Down Arrow", bn: "নিচের তীর", hi: "नीचे का तीर" },
  symbol: "⬇️",
  rotationDeg: 180
};

const ARROW_LEFT: PatternItem = {
  shape: "arrow",
  color: "#2563eb",
  colorName: { en: "Left Arrow", bn: "বামের তীর", hi: "बायां तीर" },
  symbol: "⬅️",
  rotationDeg: 270
};

// Polygons by side counts
const POLY_TRIANGLE_3: PatternItem = {
  shape: "polygon",
  color: "#ea580c",
  colorName: { en: "Triangle (3 sides)", bn: "ত্রিভুজ (৩ বাহু)", hi: "त्रिभुज (3 भुजाएं)" },
  symbol: "📐"
};

const POLY_SQUARE_4: PatternItem = {
  shape: "polygon",
  color: "#2563eb",
  colorName: { en: "Square (4 sides)", bn: "চতুর্ভুজ (৪ বাহু)", hi: "वर्ग (4 भुजाएं)" },
  symbol: "⏹️"
};

const POLY_PENTAGON_5: PatternItem = {
  shape: "polygon",
  color: "#9333ea",
  colorName: { en: "Pentagon (5 sides)", bn: "পঞ্চভুজ (৫ বাহু)", hi: "पंचभुज (5 भुजाएं)" },
  symbol: "⬠"
};

const POLY_HEXAGON_6: PatternItem = {
  shape: "polygon",
  color: "#16a34a",
  colorName: { en: "Hexagon (6 sides)", bn: "ষড়ভুজ (৬ বাহু)", hi: "षट्भुज (6 भुजाएं)" },
  symbol: "⬡"
};

const POLY_OCTAGON_8: PatternItem = {
  shape: "polygon",
  color: "#dc2626",
  colorName: { en: "Octagon (8 sides)", bn: "অষ্টভুজ (৮ বাহু)", hi: "अष्टभुज (8 भुजाएं)" },
  symbol: "🛑"
};

// Crescents and Moon Phases
const MOON_CRESCENT_RIGHT: PatternItem = {
  shape: "crescent",
  color: "#6366f1",
  colorName: { en: "Crescent Right", bn: "শুক্লপক্ষের চাঁদ", hi: "दायां अर्धचंद्र" },
  symbol: "☽"
};

const MOON_FULL: PatternItem = {
  shape: "circle",
  color: "#eab308",
  colorName: { en: "Full Moon", bn: "পূর্ণিমা চাঁদ", hi: "पूर्णिमा का चांद" },
  symbol: "🌕"
};

const MOON_CRESCENT_LEFT: PatternItem = {
  shape: "crescent",
  color: "#6366f1",
  colorName: { en: "Crescent Left", bn: "কৃষ্ণপক্ষের চাঁদ", hi: "बायां अर्धचंद्र" },
  symbol: "☾"
};

export const COMPLETE_PATTERN_QUESTIONS: CompletePatternQuestion[] = [
  // ==========================================
  // LEVEL 1: BEGINNER (Simple repetition ABAB, AABB, ABCABC)
  // ==========================================
  {
    id: "beg-1",
    difficulty: "beginner",
    ruleType: "Simple Repetition (ABAB)",
    sequence: [BLUE_CIRCLE, YELLOW_SQUARE, BLUE_CIRCLE, null],
    missingIndex: 3,
    options: [YELLOW_SQUARE, BLUE_CIRCLE, GREEN_SQUARE, RED_CIRCLE],
    correctIndex: 0,
    explanation: {
      en: "The pattern alternates: Blue Circle → Yellow Square → Blue Circle → Yellow Square.",
      bn: "প্যাটার্নটিতে নীল বৃত্ত এবং হলুদ বর্গ পর্যায়ক্রমে আসছে।",
      hi: "पैटर्न में नीला वृत्त और पीला वर्ग बारी-बारी से आ रहे हैं।"
    }
  },
  {
    id: "beg-2",
    difficulty: "beginner",
    ruleType: "Paired Repetition (AABB)",
    sequence: [RED_CIRCLE, RED_CIRCLE, GREEN_SQUARE, null],
    missingIndex: 3,
    options: [GREEN_SQUARE, RED_CIRCLE, BLUE_CIRCLE, PURPLE_STAR],
    correctIndex: 0,
    explanation: {
      en: "Each shape appears in pairs: Two Red Circles, then Two Green Squares.",
      bn: "প্রতিটি আকার জোড়ায় জোড়ায় আসছে: দুটি লাল বৃত্ত, এরপর দুটি সবুজ বর্গ।",
      hi: "प्रत्येक आकार दो-दो के जोड़े में है: दो लाल वृत्त, फिर दो हरे वर्ग।"
    }
  },
  {
    id: "beg-3",
    difficulty: "beginner",
    ruleType: "Three-Item Cycle (ABC ABC)",
    sequence: [GOLD_STAR, BLUE_CIRCLE, GREEN_TRIANGLE, GOLD_STAR, BLUE_CIRCLE, null],
    missingIndex: 5,
    options: [GREEN_TRIANGLE, GOLD_STAR, RED_CIRCLE, BLUE_CIRCLE],
    correctIndex: 0,
    explanation: {
      en: "The 3 items cycle in order: Star → Circle → Triangle.",
      bn: "৩টি আকার পর্যায়ক্রমে আসছে: তারা → বৃত্ত → ত্রিভুজ।",
      hi: "3 आकार क्रम में आ रहे हैं: तारा → वृत्त → त्रिभुज।"
    }
  },
  {
    id: "beg-4",
    difficulty: "beginner",
    ruleType: "Alternating Shapes (ABAB)",
    sequence: [ORANGE_DIAMOND, PURPLE_STAR, ORANGE_DIAMOND, null],
    missingIndex: 3,
    options: [PURPLE_STAR, ORANGE_DIAMOND, BLUE_CIRCLE, GREEN_SQUARE],
    correctIndex: 0,
    explanation: {
      en: "The pattern alternates between Orange Diamond and Purple Star.",
      bn: "প্যাটার্নটিতে কমলা হীরা এবং বেগুনি তারা পর্যায়ক্রমে আসছে।",
      hi: "पैटर्न में नारंगी हीरा और बैंगनी तारा बारी-बारी से आ रहे हैं।"
    }
  },
  {
    id: "beg-5",
    difficulty: "beginner",
    ruleType: "Color Alternation (ABAB)",
    sequence: [GREEN_SQUARE, RED_SQUARE, GREEN_SQUARE, null],
    missingIndex: 3,
    options: [RED_SQUARE, GREEN_SQUARE, YELLOW_SQUARE, BLUE_SQUARE],
    correctIndex: 0,
    explanation: {
      en: "The square alternates between Green and Red.",
      bn: "বর্গটি সবুজ ও লাল রঙের মধ্যে পর্যায়ক্রমে পরিবর্তিত হচ্ছে।",
      hi: "वर्ग हरे और लाल रंग में बारी-बारी से बदल रहा है।"
    }
  },
  {
    id: "beg-6",
    difficulty: "beginner",
    ruleType: "Paired Items (AABB)",
    sequence: [BLUE_TRIANGLE, BLUE_TRIANGLE, YELLOW_CIRCLE, null],
    missingIndex: 3,
    options: [YELLOW_CIRCLE, BLUE_TRIANGLE, RED_CIRCLE, GREEN_SQUARE],
    correctIndex: 0,
    explanation: {
      en: "Pairs pattern: Two Blue Triangles, followed by Two Yellow Circles.",
      bn: "জোড়া প্যাটার্ন: দুটি নীল ত্রিভুজ, এরপর দুটি হলুদ বৃত্ত।",
      hi: "जोड़े का पैटर्न: दो नीले त्रिभुज, फिर दो पीले वृत्त।"
    }
  },
  {
    id: "beg-7",
    difficulty: "beginner",
    ruleType: "Simple Cycle (ABC ABC)",
    sequence: [YELLOW_SQUARE, RED_CIRCLE, PURPLE_STAR, YELLOW_SQUARE, RED_CIRCLE, null],
    missingIndex: 5,
    options: [PURPLE_STAR, YELLOW_SQUARE, GREEN_TRIANGLE, RED_CIRCLE],
    correctIndex: 0,
    explanation: {
      en: "The sequence repeats: Square → Circle → Star.",
      bn: "সিকোয়েন্সটি পুনরাবৃত্তি হচ্ছে: বর্গ → বৃত্ত → তারা।",
      hi: "क्रम दोहराया जा रहा है: वर्ग → वृत्त → तारा।"
    }
  },
  {
    id: "beg-8",
    difficulty: "beginner",
    ruleType: "Alternating Shapes (ABAB)",
    sequence: [RED_CIRCLE, GOLD_STAR, RED_CIRCLE, null],
    missingIndex: 3,
    options: [GOLD_STAR, RED_CIRCLE, BLUE_CIRCLE, YELLOW_SQUARE],
    correctIndex: 0,
    explanation: {
      en: "Alternating between Red Circle and Gold Star.",
      bn: "লাল বৃত্ত এবং সোনালী তারা পর্যায়ক্রমে আসছে।",
      hi: "लाल वृत्त और सुनहरे तारे के बीच एकांतर क्रम।"
    }
  },

  // ==========================================
  // LEVEL 2: MODERATE (Growing, multi-attribute, side counts, alternation)
  // ==========================================
  {
    id: "mod-1",
    difficulty: "moderate",
    ruleType: "Three-Item Missing Middle (ABC ABC)",
    sequence: [BLUE_CIRCLE, YELLOW_SQUARE, PURPLE_STAR, BLUE_CIRCLE, null, PURPLE_STAR],
    missingIndex: 4,
    options: [YELLOW_SQUARE, GREEN_SQUARE, RED_CIRCLE, ORANGE_DIAMOND],
    correctIndex: 0,
    explanation: {
      en: "The cycle is Blue Circle → Yellow Square → Purple Star. Yellow Square fills the gap.",
      bn: "চক্রটি: নীল বৃত্ত → হলুদ বর্গ → বেগুনি তারা। হলুদ বর্গ শূন্যস্থানে বসবে।",
      hi: "चक्र है: नीला वृत्त → पीला वर्ग → बैंगनी तारा। पीला वर्ग रिक्त स्थान भरेगा।"
    }
  },
  {
    id: "mod-2",
    difficulty: "moderate",
    ruleType: "Increasing Polygon Sides (3 → 4 → 5 → 6)",
    sequence: [POLY_TRIANGLE_3, POLY_SQUARE_4, POLY_PENTAGON_5, null],
    missingIndex: 3,
    options: [POLY_HEXAGON_6, POLY_TRIANGLE_3, RED_CIRCLE, GOLD_STAR],
    correctIndex: 0,
    explanation: {
      en: "Number of sides increases by 1: Triangle (3) → Square (4) → Pentagon (5) → Hexagon (6).",
      bn: "বাহুর সংখ্যা ১ করে বাড়ছে: ত্রিভুজ (৩) → চতুর্ভুজ (৪) → পঞ্চভুজ (৫) → ষড়ভুজ (৬)।",
      hi: "भुजाओं की संख्या 1 बढ़ रही है: त्रिभुज (3) → वर्ग (4) → पंचभुज (5) → षट्भुज (6)।"
    }
  },
  {
    id: "mod-3",
    difficulty: "moderate",
    ruleType: "Dual Attribute Shift (Shape + Color Alternation)",
    sequence: [RED_CIRCLE, BLUE_SQUARE, RED_CIRCLE, BLUE_SQUARE, RED_CIRCLE, null],
    missingIndex: 5,
    options: [BLUE_SQUARE, RED_CIRCLE, GREEN_TRIANGLE, YELLOW_SQUARE],
    correctIndex: 0,
    explanation: {
      en: "Both shape and color alternate together: Red Circle then Blue Square.",
      bn: "আকার এবং রঙ উভয়ই একসাথে পরিবর্তিত হচ্ছে: লাল বৃত্ত ও নীল বর্গ।",
      hi: "आकार और रंग दोनों साथ में बदल रहे हैं: लाल वृत्त फिर नीला वर्ग।"
    }
  },
  {
    id: "mod-4",
    difficulty: "moderate",
    ruleType: "Growing Group Pattern (1 → 2 → 3)",
    sequence: [GREEN_TRIANGLE, GOLD_STAR, GOLD_STAR, GREEN_TRIANGLE, GOLD_STAR, GOLD_STAR, GOLD_STAR, null],
    missingIndex: 7,
    options: [GREEN_TRIANGLE, GOLD_STAR, BLUE_CIRCLE, RED_SQUARE],
    correctIndex: 0,
    explanation: {
      en: "Green Triangle serves as the anchor between growing sets of stars: 1 Triangle, 2 Stars, 1 Triangle, 3 Stars, 1 Triangle.",
      bn: "সবুজ ত্রিভুজটি নোঙর হিসেবে কাজ করছে: ত্রিভুজ, ২টি তারা, ত্রিভুজ, ৩টি তারা, এরপর ত্রিভুজ।",
      hi: "हरा त्रिभुज विभाजक है: 1 त्रिभुज, 2 तारे, 1 त्रिभुज, 3 तारे, फिर 1 त्रिभुज।"
    }
  },
  {
    id: "mod-5",
    difficulty: "moderate",
    ruleType: "Four-Step Cycle (ABCD ABCD)",
    sequence: [RED_CIRCLE, YELLOW_SQUARE, GREEN_TRIANGLE, ORANGE_DIAMOND, RED_CIRCLE, YELLOW_SQUARE, null, ORANGE_DIAMOND],
    missingIndex: 6,
    options: [GREEN_TRIANGLE, RED_CIRCLE, PURPLE_STAR, BLUE_CIRCLE],
    correctIndex: 0,
    explanation: {
      en: "4-step cycle: Circle → Square → Triangle → Diamond. Triangle is missing.",
      bn: "৪-ধাপের চক্র: বৃত্ত → বর্গ → ত্রিভুজ → হীরা। ত্রিভুজটি অনুপস্থিত।",
      hi: "4-चरणीय चक्र: वृत्त → वर्ग → त्रिभुज → हीरा। त्रिभुज गायब है।"
    }
  },
  {
    id: "mod-6",
    difficulty: "moderate",
    ruleType: "Inverted Pair Symmetry (AB BA AB)",
    sequence: [BLUE_CIRCLE, GREEN_SQUARE, GREEN_SQUARE, BLUE_CIRCLE, BLUE_CIRCLE, null],
    missingIndex: 5,
    options: [GREEN_SQUARE, BLUE_CIRCLE, RED_CIRCLE, YELLOW_SQUARE],
    correctIndex: 0,
    explanation: {
      en: "Pattern flips in pairs: (Blue, Green) → (Green, Blue) → (Blue, Green).",
      bn: "জোড়া আকারে পরিবর্তিত হচ্ছে: (নীল, সবুজ) → (সবুজ, নীল) → (নীল, সবুজ)।",
      hi: "जोड़ों में क्रम उलट रहा है: (नीला, हरा) → (हरा, नीला) → (नीला, हरा)।"
    }
  },
  {
    id: "mod-7",
    difficulty: "moderate",
    ruleType: "Color Progression Cycle",
    sequence: [RED_CIRCLE, YELLOW_CIRCLE, GREEN_CIRCLE, BLUE_CIRCLE, RED_CIRCLE, null],
    missingIndex: 5,
    options: [YELLOW_CIRCLE, GREEN_CIRCLE, RED_CIRCLE, BLUE_CIRCLE],
    correctIndex: 0,
    explanation: {
      en: "Colors cycle around: Red → Yellow → Green → Blue → Red → Yellow.",
      bn: "রঙের চক্র: লাল → হলুদ → সবুজ → নীল → লাল → হলুদ।",
      hi: "रंगों का चक्र: लाल → पीला → हरा → नीला → लाल → पीला।"
    }
  },
  {
    id: "mod-8",
    difficulty: "moderate",
    ruleType: "Diamond & Star Alternation",
    sequence: [TEAL_DIAMOND, GOLD_STAR, TEAL_DIAMOND, GOLD_STAR, null, GOLD_STAR],
    missingIndex: 4,
    options: [TEAL_DIAMOND, GOLD_STAR, BLUE_CIRCLE, RED_SQUARE],
    correctIndex: 0,
    explanation: {
      en: "Alternating sequence: Teal Diamond → Gold Star → Teal Diamond.",
      bn: "পর্যায়ক্রমিক ধারা: হীরা → তারা → হীরা।",
      hi: "एकांतर क्रम: हीरा → तारा → हीरा।"
    }
  },
  {
    id: "mod-9",
    difficulty: "moderate",
    ruleType: "Alternating Triplets (AAB AAB)",
    sequence: [RED_SQUARE, RED_SQUARE, BLUE_CIRCLE, RED_SQUARE, RED_SQUARE, null],
    missingIndex: 5,
    options: [BLUE_CIRCLE, RED_SQUARE, GREEN_TRIANGLE, YELLOW_SQUARE],
    correctIndex: 0,
    explanation: {
      en: "Triplets of Two Red Squares followed by One Blue Circle.",
      bn: "দুটি লাল বর্গ এবং একটি নীল বৃত্তের পুনরাবৃত্তি।",
      hi: "दो लाल वर्ग और उसके बाद एक नीले वृत्त का क्रम।"
    }
  },
  {
    id: "mod-10",
    difficulty: "moderate",
    ruleType: "Shape Alternation with Consistent Hue",
    sequence: [BLUE_CIRCLE, BLUE_SQUARE, BLUE_TRIANGLE, BLUE_CIRCLE, BLUE_SQUARE, null],
    missingIndex: 5,
    options: [BLUE_TRIANGLE, BLUE_CIRCLE, BLUE_SQUARE, RED_CIRCLE],
    correctIndex: 0,
    explanation: {
      en: "All items are blue, cycling: Circle → Square → Triangle.",
      bn: "সবগুলি নীল রঙের: বৃত্ত → বর্গ → ত্রিভুজ।",
      hi: "सभी नीले हैं, क्रम: वृत्त → वर्ग → त्रिभुज।"
    }
  },

  // ==========================================
  // LEVEL 3: PRO (Rotations, Palindromic Symmetries, Matrix 2x2, Dual Inversion)
  // ==========================================
  {
    id: "pro-1",
    difficulty: "pro",
    ruleType: "Clockwise Rotation (90° Steps)",
    sequence: [ARROW_UP, ARROW_RIGHT, ARROW_DOWN, null],
    missingIndex: 3,
    options: [ARROW_LEFT, ARROW_UP, ARROW_RIGHT, ARROW_DOWN],
    correctIndex: 0,
    explanation: {
      en: "Arrow rotates 90° clockwise at each step: Up (0°) → Right (90°) → Down (180°) → Left (270°).",
      bn: "তীরটি ঘড়ির কাঁটার দিকে ৯০ ডিগ্রি করে ঘুরছে: উপরে → ডানে → নিচে → বামে।",
      hi: "तीर दक्षिणावर्त 90° घूम रहा है: ऊपर → दायां → नीचे → बायां।"
    }
  },
  {
    id: "pro-2",
    difficulty: "pro",
    ruleType: "Symmetric Palindromic Reflection",
    sequence: [RED_CIRCLE, GREEN_SQUARE, PURPLE_STAR, GREEN_SQUARE, null],
    missingIndex: 4,
    options: [RED_CIRCLE, BLUE_CIRCLE, YELLOW_SQUARE, ORANGE_DIAMOND],
    correctIndex: 0,
    explanation: {
      en: "Symmetrical palindrome around the central Purple Star: Red → Green → [Star] → Green → Red.",
      bn: "মাঝের তারাকে কেন্দ্র করে দুই পাশে প্রতিসম নকশা: লাল → সবুজ → [তারা] → সবুজ → লাল।",
      hi: "मध्य तारे के चारों ओर सममित क्रम: लाल → हरा → [तारा] → हरा → लाल।"
    }
  },
  {
    id: "pro-3",
    difficulty: "pro",
    ruleType: "Counter-Clockwise Rotation (90° Steps)",
    sequence: [ARROW_LEFT, ARROW_DOWN, ARROW_RIGHT, null],
    missingIndex: 3,
    options: [ARROW_UP, ARROW_LEFT, ARROW_DOWN, ARROW_RIGHT],
    correctIndex: 0,
    explanation: {
      en: "Arrow rotates 90° counter-clockwise: Left (270°) → Down (180°) → Right (90°) → Up (0°).",
      bn: "তীরটি ঘড়ির কাঁটার বিপরীত দিকে ৯০ ডিগ্রি করে ঘুরছে: বামে → নিচে → ডানে → উপরে।",
      hi: "तीर वामावर्त 90° घूम रहा है: बायां → नीचे → दायां → ऊपर।"
    }
  },
  {
    id: "pro-4",
    difficulty: "pro",
    ruleType: "Descending Polygon Sides (8 → 6 → 5 → 4 → 3)",
    sequence: [POLY_OCTAGON_8, POLY_HEXAGON_6, POLY_PENTAGON_5, POLY_SQUARE_4, null],
    missingIndex: 4,
    options: [POLY_TRIANGLE_3, POLY_HEXAGON_6, BLUE_CIRCLE, GOLD_STAR],
    correctIndex: 0,
    explanation: {
      en: "Polygon side counts decrease in order: Octagon (8) → Hexagon (6) → Pentagon (5) → Square (4) → Triangle (3).",
      bn: "বহুভুজের বাহু ক্রমান্বয়ে কমছে: অষ্টভুজ (৮) → ষড়ভুজ (৬) → পঞ্চভুজ (৫) → চতুর্ভুজ (৪) → ত্রিভুজ (৩)।",
      hi: "भुजाओं की संख्या घट रही है: अष्टभुज (8) → षट्भुज (6) → पंचभुज (5) → वर्ग (4) → त्रिभुज (3)।"
    }
  },
  {
    id: "pro-5",
    difficulty: "pro",
    ruleType: "Moon Phase Reflection (Waxing → Full → Waning)",
    sequence: [MOON_CRESCENT_RIGHT, MOON_FULL, MOON_CRESCENT_LEFT, MOON_FULL, null],
    missingIndex: 4,
    options: [MOON_CRESCENT_RIGHT, MOON_FULL, BLUE_CIRCLE, GOLD_STAR],
    correctIndex: 0,
    explanation: {
      en: "Lunar phase cycle: Waxing Crescent → Full Moon → Waning Crescent → Full Moon → Waxing Crescent.",
      bn: "চাঁদের কলার চক্র: শুক্লপক্ষ → পূর্ণিমা → কৃষ্ণপক্ষ → পূর্ণিমা → শুক্লপক্ষ।",
      hi: "चंद्रमा कला का चक्र: शुक्लपक्ष → पूर्णिमा → कृष्णपक्ष → पूर्णिमा → शुक्लपक्ष।"
    }
  },
  {
    id: "pro-6",
    difficulty: "pro",
    ruleType: "Simultaneous Color & Shape Cycling (A1 → B2 → C3)",
    sequence: [RED_CIRCLE, BLUE_SQUARE, GREEN_TRIANGLE, RED_CIRCLE, BLUE_SQUARE, null],
    missingIndex: 5,
    options: [GREEN_TRIANGLE, RED_CIRCLE, BLUE_SQUARE, YELLOW_SQUARE],
    correctIndex: 0,
    explanation: {
      en: "Tri-rule simultaneous cycle: (Red, Circle) → (Blue, Square) → (Green, Triangle). Green Triangle comes next.",
      bn: "একসাথে রঙ ও আকারের ৩-ধাপের চক্র: লাল বৃত্ত → নীল বর্গ → সবুজ ত্রিভুজ।",
      hi: "एक साथ रंग और आकार का चक्र: लाल वृत्त → नीला वर्ग → हरा त्रिभुज।"
    }
  },
  {
    id: "pro-7",
    difficulty: "pro",
    ruleType: "5-Item Palindrome with Central Anchor",
    sequence: [GOLD_STAR, BLUE_CIRCLE, ORANGE_DIAMOND, BLUE_CIRCLE, null],
    missingIndex: 4,
    options: [GOLD_STAR, BLUE_CIRCLE, GREEN_TRIANGLE, RED_CIRCLE],
    correctIndex: 0,
    explanation: {
      en: "Mirrored reflection: Star → Circle → [Diamond] → Circle → Star.",
      bn: "প্রতিসম নকশা: তারা → বৃত্ত → [হীরা] → বৃত্ত → তারা।",
      hi: "दर्पण समरूपता: तारा → वृत्त → [हीरा] → वृत्त → तारा।"
    }
  },
  {
    id: "pro-8",
    difficulty: "pro",
    ruleType: "Alternating 180° Rotational Polarity",
    sequence: [ARROW_UP, ARROW_DOWN, ARROW_UP, ARROW_DOWN, ARROW_UP, null],
    missingIndex: 5,
    options: [ARROW_DOWN, ARROW_UP, ARROW_RIGHT, ARROW_LEFT],
    correctIndex: 0,
    explanation: {
      en: "Vertical arrows flip polarity by 180°: Up → Down → Up → Down → Up → Down.",
      bn: "উল্লম্ব তীর ১৮০ ডিগ্রি কোণে বিপরীতমুখী হচ্ছে: উপরে → নিচে → উপরে → নিচে → উপরে → নিচে।",
      hi: "लंबवत तीर 180° पर दिशा बदल रहे हैं: ऊपर → नीचे → ऊपर → नीचे → ऊपर → नीचे।"
    }
  },
  {
    id: "pro-9",
    difficulty: "pro",
    ruleType: "2x2 Matrix Logic Sequence",
    sequence: [RED_CIRCLE, BLUE_CIRCLE, RED_SQUARE, null],
    missingIndex: 3,
    options: [BLUE_SQUARE, RED_CIRCLE, GREEN_SQUARE, YELLOW_CIRCLE],
    correctIndex: 0,
    explanation: {
      en: "Matrix rule: Top row has Circles (Red, Blue). Bottom row has Squares (Red, [Blue]). Blue Square completes the analogy.",
      bn: "ম্যাট্রিক্স নিয়ম: উপরের সারিতে বৃত্ত (লাল, নীল)। নিচের সারিতে বর্গ (লাল, [নীল বর্গ])।",
      hi: "मैट्रिक्स नियम: पहली पंक्ति में वृत्त (लाल, नीला)। दूसरी पंक्ति में वर्ग (लाल, [नीला वर्ग])।"
    }
  },
  {
    id: "pro-10",
    difficulty: "pro",
    ruleType: "Nested Pair Alternation (A B B A A B B ?)",
    sequence: [BLUE_CIRCLE, RED_SQUARE, RED_SQUARE, BLUE_CIRCLE, BLUE_CIRCLE, RED_SQUARE, RED_SQUARE, null],
    missingIndex: 7,
    options: [BLUE_CIRCLE, RED_SQUARE, GREEN_TRIANGLE, GOLD_STAR],
    correctIndex: 0,
    explanation: {
      en: "Sequence of alternating double pairs: 1 Blue, 2 Reds, 2 Blues, 2 Reds, next is Blue.",
      bn: "পর্যায়ক্রমিক জোড়া নকশা: ১টি নীল, ২টি লাল, ২টি নীল, ২টি লাল, এরপর নীল।",
      hi: "दोहरे जोड़ों का क्रम: 1 नीला, 2 लाल, 2 नीले, 2 लाल, अगला नीला है।"
    }
  },
  {
    id: "pro-11",
    difficulty: "pro",
    ruleType: "Horizontal 180° Directional Flip",
    sequence: [ARROW_RIGHT, ARROW_LEFT, ARROW_RIGHT, ARROW_LEFT, ARROW_RIGHT, null],
    missingIndex: 5,
    options: [ARROW_LEFT, ARROW_RIGHT, ARROW_UP, ARROW_DOWN],
    correctIndex: 0,
    explanation: {
      en: "Horizontal alternating arrows: Right → Left → Right → Left → Right → Left.",
      bn: "অনুভূমিক তীরের দিকবদল: ডানে → বামে → ডানে → বামে → ডানে → বামে।",
      hi: "क्षैतिज तीर दिशा परिवर्तन: दायां → बायां → दायां → बायां → दायां → बायां।"
    }
  },
  {
    id: "pro-12",
    difficulty: "pro",
    ruleType: "Color Inversion Triad",
    sequence: [GREEN_SQUARE, RED_CIRCLE, GREEN_SQUARE, RED_CIRCLE, GREEN_SQUARE, null],
    missingIndex: 5,
    options: [RED_CIRCLE, GREEN_SQUARE, BLUE_CIRCLE, YELLOW_SQUARE],
    correctIndex: 0,
    explanation: {
      en: "Dual attribute complementary pair: Green Square and Red Circle alternate.",
      bn: "পরিপূরক জোড়া: সবুজ বর্গ এবং লাল বৃত্ত পর্যায়ক্রমে আসছে।",
      hi: "पूरक जोड़ा: हरा वर्ग और लाल वृत्त बारी-बारी से आ रहे हैं।"
    }
  },
  {
    id: "pro-13",
    difficulty: "pro",
    ruleType: "Complex Symmetry Around Central Diamond",
    sequence: [GREEN_TRIANGLE, RED_CIRCLE, GOLD_STAR, ORANGE_DIAMOND, GOLD_STAR, RED_CIRCLE, null],
    missingIndex: 6,
    options: [GREEN_TRIANGLE, RED_CIRCLE, GOLD_STAR, BLUE_CIRCLE],
    correctIndex: 0,
    explanation: {
      en: "7-element reflection around Diamond: Triangle → Circle → Star → [Diamond] → Star → Circle → Triangle.",
      bn: "৭টি উপাদানের প্রতিসম নকশা: ত্রিভুজ → বৃত্ত → তারা → [হীরা] → তারা → বৃত্ত → ত্রিভুজ।",
      hi: "7 तत्वों की दर्पण समरूपता: त्रिभुज → वृत्त → तारा → [हीरा] → तारा → वृत्त → त्रिभुज।"
    }
  },
  {
    id: "pro-14",
    difficulty: "pro",
    ruleType: "Dual Property Geometric Analogy",
    sequence: [RED_CIRCLE, RED_TRIANGLE, BLUE_CIRCLE, null],
    missingIndex: 3,
    options: [BLUE_TRIANGLE, RED_CIRCLE, GREEN_TRIANGLE, BLUE_SQUARE],
    correctIndex: 0,
    explanation: {
      en: "Shape transforms from Circle to Triangle while retaining color: Red Circle → Red Triangle, so Blue Circle → Blue Triangle.",
      bn: "রঙ অপরিবর্তিত রেখে বৃত্ত থেকে ত্রিভুজে রূপান্তর: লাল বৃত্ত → লাল ত্রিভুজ, সুতরাং নীল বৃত্ত → নীল ত্রিভুজ।",
      hi: "रंग समान रखते हुए वृत्त से त्रिभुज में रूपांतरण: लाल वृत्त → लाल त्रिभुज, अतः नीला वृत्त → नीला त्रिभुज।"
    }
  }
];
