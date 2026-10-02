export interface MatchCardItem {
  id: string;
  name: { en: string; bn: string; hi: string };
  symbol: string;
  color: string;
  bgLight: string;
}

export const MATCH_ITEMS: MatchCardItem[] = [
  {
    id: "diya",
    name: { en: "Diya (Oil Lamp)", bn: "প্রদীপ (দিয়া)", hi: "दीया (दीपक)" },
    symbol: "🪔",
    color: "#d97706",
    bgLight: "#fef3c7"
  },
  {
    id: "peacock",
    name: { en: "Peacock (Mayur)", bn: "ময়ূর", hi: "मोर (मयूर)" },
    symbol: "🦚",
    color: "#0284c7",
    bgLight: "#e0f2fe"
  },
  {
    id: "lotus",
    name: { en: "Lotus (Padma)", bn: "পদ্ম ফুল", hi: "कमल का फूल" },
    symbol: "🪷",
    color: "#db2777",
    bgLight: "#fce7f3"
  },
  {
    id: "auto",
    name: { en: "Auto-Rickshaw", bn: "অটো-রিকশা", hi: "ऑटो-रिक्शा" },
    symbol: "🛺",
    color: "#16a34a",
    bgLight: "#dcfce7"
  },
  {
    id: "taj",
    name: { en: "Taj Mahal / Monument", bn: "তাজমহল", hi: "ताजमहल" },
    symbol: "🏛️",
    color: "#4f46e5",
    bgLight: "#e0e7ff"
  },
  {
    id: "tabla",
    name: { en: "Tabla / Drums", bn: "তবলা", hi: "तबला" },
    symbol: "🥁",
    color: "#9333ea",
    bgLight: "#f3e8ff"
  },
  {
    id: "sitar",
    name: { en: "Sitar / Vina", bn: "সেতার / বীণা", hi: "सितार / वीणा" },
    symbol: "🪕",
    color: "#ea580c",
    bgLight: "#ffedd5"
  },
  {
    id: "harmonium",
    name: { en: "Harmonium / Melody", bn: "হারমোনিয়াম", hi: "हार्मोनियम" },
    symbol: "🎹",
    color: "#0d9488",
    bgLight: "#ccfbf1"
  },
  {
    id: "mango",
    name: { en: "Alphonso Mango", bn: "আম (আম্র)", hi: "आम (फलों का राजा)" },
    symbol: "🥭",
    color: "#f59e0b",
    bgLight: "#fef9c3"
  },
  {
    id: "tea",
    name: { en: "Masala Chai", bn: "চা (চা-পাতা)", hi: "मसाला चाय" },
    symbol: "☕",
    color: "#b45309",
    bgLight: "#fef3c7"
  }
];
