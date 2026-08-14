import type { Category } from "@/lib/portal-store";

export type GalleryItem = {
  id: string;
  name: string;
  category: Category;
  description: string;
  file: string;
};

export const PRODUCT_GALLERY: GalleryItem[] = [
  {
    id: "biofix-legume-inoculant",
    name: "BIOFIX Legume Inoculant (Bean)",
    category: "Fertilizer",
    description:
      "MEA Fertilizers BIOFIX legume inoculant for beans. 150g. Manufactured & distributed by MEA Ltd. under licence from the University of Nairobi. Store in a cool place and protect from sunlight.",
    file: "biofix-legume-inoculant.png",
  },
  {
    id: "vuna-fertilizer",
    name: "VUNA Fertilizer",
    category: "Fertilizer",
    description:
      "Hydroponics Africa VUNA. Top dressing 26:0:0+5S+6Ca (50kg) and planting fertilizer NPK 18-18-18 with a full spectrum of nutrients.",
    file: "vuna-fertilizer.png",
  },
  {
    id: "easygro-starter",
    name: "EasyGro STARTER 18:20:21+TE",
    category: "Fertilizer",
    description:
      "Osho EasyGro STARTER — water soluble fertilizer with chelated micro-elements for nursery and early growth. 18:20:21+TE. Mbolea inayoyeyuka kwenye maji kwa mimea michanga.",
    file: "easygro-starter.png",
  },
  {
    id: "mycoapply-endoprime",
    name: "MycoApply EndoPrime EA",
    category: "Fertilizer",
    description:
      "Suspendable humic powder with endomycorrhizal fungi (Glomus spp.) and 10% humic acid. Promotes root mass, nutrient efficiency and drought tolerance. 4g. Rate 40g/acre or 100g/ha. Distributed in Kenya by Millennial Agriculture Limited.",
    file: "mycoapply-endoprime.png",
  },
  {
    id: "simlaw-coriander-dania",
    name: "Simlaw Seeds Coriander Dania",
    category: "Seeds",
    description: "Simlaw Seeds coriander (dania). Superior & reliable certified seed in a metal tin.",
    file: "simlaw-coriander-dania.png",
  },
  {
    id: "kenya-seed-h629",
    name: "Kenya Seed Hybrid Maize H 629",
    category: "Seeds",
    description:
      "Kenya Seed Company Ltd. hybrid maize H 629. Production altitude 1500–2800m above sea level. 2 kg.",
    file: "kenya-seed-h629.png",
  },
  {
    id: "simlaw-kazuri-beans",
    name: "Simlaw Seeds Kazuri Beans 1kg",
    category: "Seeds",
    description: "Simlaw Seeds certified seed beans, variety Kazuri. 1kg. Verify genuineness via KEPHIS scratch code.",
    file: "simlaw-kazuri-beans.png",
  },
  {
    id: "ckl-milking-salve",
    name: "CKL Milking Salve 250g",
    category: "Vet Supplies",
    description:
      "Cooper K-Brands CKL Milking Salve with dichlorophene and lanolin. 250g. For livestock udder care.",
    file: "ckl-milking-salve.png",
  },
  {
    id: "actellic-super",
    name: "Actellic Super Dusting Powder",
    category: "Pesticides",
    description:
      "Syngenta / Twiga Actellic Super dusting powder. Pirimiphos-methyl 16 g/kg + Permethrin 3 g/kg. Controls larger grain borer, weevils and other insects in stored grains and pulses. PCPB(CR)0150.",
    file: "actellic-super.png",
  },
  {
    id: "alonze-50ec",
    name: "Alonze 50EC",
    category: "Pesticides",
    description:
      "Greenlife Crop Protection Africa insecticide. Abamectin 50 g/L. Controls spider mites, leafminers and thrips on roses, French beans, tomatoes, runner beans, snow peas, broccoli, chillies and potatoes. 1L. PCPB (CR) 1361.",
    file: "alonze-50ec.png",
  },
  {
    id: "amistar",
    name: "Amistar",
    category: "Pesticides",
    description: "Syngenta Amistar fungicide. 1 litre. Chemical composition listed on the product label.",
    file: "amistar.png",
  },
  {
    id: "bedlam-200sl",
    name: "BEDLAM 200SL",
    category: "Pesticides",
    description:
      "Insecticide for control of bedbugs, cockroaches and fleas (dawa ya kunguni, mende na viroboto). Acetamiprid 200 g/L. Rate 15 ml/L or 100 ml/10 L. No smell; can be used in public places without evacuation.",
    file: "bedlam-200sl.png",
  },
  {
    id: "duduthrin-175ec",
    name: "Duduthrin 1.75EC",
    category: "Pesticides",
    description:
      "Twiga Chemical Industries contact, residual and stomach acting insecticide. For insect pests in beans, tomatoes, maize, wheat, barley, mangoes, cotton, carnations, roses and pasture. 1 litre.",
    file: "duduthrin-175ec.png",
  },
  {
    id: "bactrolure",
    name: "Bactrolure 98.9% Liquid",
    category: "Pesticides",
    description:
      "Methyl eugenol 98.9% lure for commercial and agricultural use. Attracts Bactrocera dorsalis (fruit fly) on mango. Use with a pheromone trap. Harmful — read the label.",
    file: "bactrolure.png",
  },
  {
    id: "lexus-247sc",
    name: "Lexus 247 SC",
    category: "Pesticides",
    description:
      "Greenlife Crop Protection Africa insecticide. Lambda-cyhalothrin 106 g/L + Thiamethoxam 141 g/L. Aphids, whiteflies and thrips on roses, capsicum, French beans, onions and tomatoes; diamondback moth and caterpillars on cabbages and broccoli. 1L. PCPB(CR)1432.",
    file: "lexus-247sc.png",
  },
  {
    id: "ridomil-gold",
    name: "Ridomil Gold MZ 68 WG",
    category: "Pesticides",
    description:
      "Syngenta systemic fungicide. 250g. For downy mildew and blights in grapes, potatoes, tomatoes and raspberries. Syngenta Crop Protection AG, Basel.",
    file: "ridomil-gold.png",
  },
  {
    id: "occasion-star-200sc",
    name: "Occasion Star 200 SC",
    category: "Pesticides",
    description:
      "Greenlife Crop Protection Africa insecticide. Emamectin benzoate 40 g/L + Indoxacarb 160 g/L. Thrips, caterpillars and spider mites on roses; thrips and diamondback moth on broccoli; fall armyworm on maize and sweetcorn; false codling moth and thrips on tomatoes and chilli. 1L. PCPB(CR)1550.",
    file: "occasion-star-200sc.png",
  },
  {
    id: "pentagon-50ec",
    name: "Pentagon 50EC",
    category: "Pesticides",
    description:
      "Greenlife Crop Protection Africa insecticide. Lambda-cyhalothrin 50 g/L. Controls thrips and aphids on roses, tomatoes and broccoli. 1L.",
    file: "pentagon-50ec.png",
  },
  {
    id: "president-gold-20dp",
    name: "President Gold 20 DP",
    category: "Pesticides",
    description:
      "Greenlife Crop Protection Africa stored-grain insecticide. Pirimiphos-methyl 16 g/kg + Deltamethrin 2 g/kg. Larger grain borer, maize weevil and red flour beetle in maize. 1kg. PCPB (CR) 1903.",
    file: "president-gold-20dp.png",
  },
  {
    id: "indoking-300sc",
    name: "Indoking 300 SC",
    category: "Pesticides",
    description:
      "Greenlife Crop Protection Africa insecticide. Indoxacarb 300 g/L. Controls bollworms, caterpillars and leaf miners on roses. 1L.",
    file: "indoking-300sc.png",
  },
];

export function galleryImageSrc(item: GalleryItem): string {
  return `/product-gallery/${item.file}`;
}

export function filterGallery(items: GalleryItem[], query: string, category: Category | "all"): GalleryItem[] {
  const q = query.trim().toLowerCase();
  return items.filter((item) => {
    if (category !== "all" && item.category !== category) return false;
    if (!q) return true;
    return (
      item.name.toLowerCase().includes(q) ||
      item.description.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q)
    );
  });
}

export async function galleryItemToFile(item: GalleryItem): Promise<File> {
  const res = await fetch(galleryImageSrc(item));
  if (!res.ok) {
    throw new Error(`Could not load gallery photo (${res.status}).`);
  }
  const blob = await res.blob();
  return new File([blob], item.file, { type: blob.type || "image/png" });
}
