export type ClinicalModuleKey = "physical-therapy" | "wound-care" | "aesthetic-medicine";

export type ClinicalModuleDef = {
  key: ClinicalModuleKey;
  slug: "physical-therapy" | "wound-care" | "aesthetics";
  title: string;
  lead: string;
  specialtyHint: string;
  overview: string;
  focus: string[];
  patientUse: string[];
  sidebarLabel: string;
  specialtySearchTerms: string[];
};

export type ModuleServiceFallback = {
  id: string;
  name: string;
  category: ClinicalModuleKey;
  description?: string;
};

export const CLINICAL_MODULES: ClinicalModuleDef[] = [
  {
    key: "physical-therapy",
    slug: "physical-therapy",
    title: "Physical Therapy",
    lead: "Devon Jones, DPT",
    specialtyHint: "Rehab, mobility, pain reduction, post-op recovery",
    overview:
      "Structured therapy plans, home exercise programs, and progressive functional rehab for orthopedic and pain management cases.",
    focus: [
      "Initial evaluations",
      "Therapeutic exercise",
      "Manual therapy",
      "Post-operative rehab",
      "Physical rehabilitation programs",
    ],
    patientUse: ["Low back pain", "Joint recovery", "Mobility deficits", "Chronic pain support"],
    sidebarLabel: "Physical Therapy",
    specialtySearchTerms: ["physical therapy", "rehab", "dpt"],
  },
  {
    key: "wound-care",
    slug: "wound-care",
    title: "Wound Care",
    lead: "Aaron Smith, MD",
    specialtyHint: "Chronic ulcers, acute wounds, home wound visits",
    overview:
      "In-clinic and home-based wound management with dressing changes, infection prevention, and debridement workflows.",
    focus: ["Chronic wound follow-up", "Acute wound care", "Home evaluation", "Debridement and dressing"],
    patientUse: ["Diabetic ulcers", "Pressure injuries", "Post-surgical wounds", "Homebound patients"],
    sidebarLabel: "Wound Care",
    specialtySearchTerms: ["wound care", "wound", "ulcer"],
  },
  {
    key: "aesthetic-medicine",
    slug: "aesthetics",
    title: "Aesthetics",
    lead: "Linh Tan, NP",
    specialtyHint: "Injectables, lasers, RF microneedling, and regenerative aesthetics",
    overview:
      "Elective aesthetic services with consult-to-treatment workflows for injectables, laser treatments, and regenerative procedures.",
    focus: [
      "Botox",
      "Dermal fillers",
      "Endolaser (Endolift)",
      "Laser skin rejuvenation",
      "Laser hair removal",
      "Morpheus8 (RF + microneedling)",
      "Facial and capillary PRP",
    ],
    patientUse: ["Cosmetic consults", "Facial rejuvenation", "Hair reduction", "Skin tightening", "Maintenance visits"],
    sidebarLabel: "Aesthetics",
    specialtySearchTerms: ["aesthetic", "cosmetic", "laser", "beauty"],
  },
];

export function getModuleBySlug(slug: string) {
  return CLINICAL_MODULES.find((m) => m.slug === slug);
}

export const MODULE_SERVICE_FALLBACKS: ModuleServiceFallback[] = [
  { id: "PT-EVAL", name: "PT - Initial Evaluation", category: "physical-therapy" },
  { id: "PT-FOLLOW", name: "PT - Follow-up Treatment", category: "physical-therapy" },
  { id: "PT-PAIN", name: "PT - Pain Management", category: "physical-therapy" },
  { id: "PT-POSTOP", name: "PT - Post-operative Therapy", category: "physical-therapy" },
  { id: "PT-REHAB", name: "Physical Rehabilitation Session", category: "physical-therapy" },
  { id: "WC-CHRONIC", name: "Wound Care - Chronic Wound", category: "wound-care" },
  { id: "WC-ACUTE", name: "Wound Care - Acute Wound", category: "wound-care" },
  { id: "WC-INFECT", name: "Wound Care - Infection Prevention", category: "wound-care" },
  { id: "WC-HOMEEVAL", name: "Wound Care - Home Evaluation", category: "wound-care" },
  { id: "AE-BOTOX", name: "Botox Injection", category: "aesthetic-medicine" },
  { id: "AE-FILLER", name: "Dermal Filler", category: "aesthetic-medicine" },
  { id: "AE-LASER", name: "Laser Aesthetic Consultation", category: "aesthetic-medicine" },
  { id: "AE-ENDOLIFT", name: "Endolaser (Endolift)", category: "aesthetic-medicine" },
  { id: "AE-SKIN-REJ", name: "Laser Skin Rejuvenation", category: "aesthetic-medicine" },
  { id: "AE-HAIR-LASER", name: "Laser Hair Removal", category: "aesthetic-medicine" },
  { id: "AE-M8", name: "Morpheus8 (Radiofrequency + Microneedling)", category: "aesthetic-medicine" },
];
