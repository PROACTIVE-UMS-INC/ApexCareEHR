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
