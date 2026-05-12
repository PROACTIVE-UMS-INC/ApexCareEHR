import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { addDays, addHours, addMinutes, setHours, setMinutes, startOfDay, subDays, subYears } from "date-fns";

const db = new PrismaClient();

const PASSWORD = "apex123";

async function main() {
  console.log("🌱 Seeding ApexCare EHR…");

  // Wipe everything first (dev only)
  await db.auditLog.deleteMany();
  await db.message.deleteMany();
  await db.document.deleteMany();
  await db.encounterCharge.deleteMany();
  await db.encounterDiagnosis.deleteMany();
  await db.encounterNote.deleteMany();
  await db.order.deleteMany();
  await db.encounter.deleteMany();
  await db.appointment.deleteMany();
  await db.immunization.deleteMany();
  await db.vital.deleteMany();
  await db.medication.deleteMany();
  await db.problem.deleteMany();
  await db.allergy.deleteMany();
  await db.patient.deleteMany();
  await db.serviceType.deleteMany();
  await db.user.deleteMany();

  // ---------------- Users ----------------
  const hash = await bcrypt.hash(PASSWORD, 10);
  const [drRivera, npTan, dptJones, mdSmith, nurseKim, frontLopez, billing, admin] = await Promise.all([
    db.user.create({ data: { email: "mariuska.aristica@apexcare.health", passwordHash: hash, firstName: "Mariuska", lastName: "Aristica", role: "provider", credential: "PD", specialty: "Practice Director", npi: "1234567890" } }),
    db.user.create({ data: { email: "np.tan@apexcare.health", passwordHash: hash, firstName: "Linh", lastName: "Tan", role: "provider", credential: "NP", specialty: "Primary Care / Aesthetics", npi: "9876543210" } }),
    db.user.create({ data: { email: "dpt.jones@apexcare.health", passwordHash: hash, firstName: "Devon", lastName: "Jones", role: "provider", credential: "DPT", specialty: "Physical Therapy", npi: "5556667770" } }),
    db.user.create({ data: { email: "md.smith@apexcare.health", passwordHash: hash, firstName: "Aaron", lastName: "Smith", role: "provider", credential: "MD", specialty: "Wound Care / Pain Management", npi: "1112223334" } }),
    db.user.create({ data: { email: "nurse.kim@apexcare.health", passwordHash: hash, firstName: "Soo", lastName: "Kim", role: "nurse", credential: "RN" } }),
    db.user.create({ data: { email: "front.lopez@apexcare.health", passwordHash: hash, firstName: "Carla", lastName: "Lopez", role: "frontdesk" } }),
    db.user.create({ data: { email: "billing@apexcare.health", passwordHash: hash, firstName: "Pat", lastName: "Nguyen", role: "billing" } }),
    db.user.create({ data: { email: "admin@apexcare.health", passwordHash: hash, firstName: "Avery", lastName: "Park", role: "admin" } }),
  ]);

  console.log(`  ✓ ${8} users`);

  // ---------------- Service Types ----------------
  const services = await Promise.all([
    // Physical Therapy
    db.serviceType.create({ data: { code: "PT-EVAL", name: "PT — Initial Evaluation", category: "physical-therapy", durationMin: 45, description: "Functional rehab evaluation", defaultCpt: "97161", homeEligible: true } }),
    db.serviceType.create({ data: { code: "PT-FOLLOW", name: "PT — Follow-up Treatment", category: "physical-therapy", durationMin: 45, description: "Therapeutic exercise + manual therapy", defaultCpt: "97110", homeEligible: true } }),
    db.serviceType.create({ data: { code: "PT-PAIN", name: "PT — Pain Management", category: "physical-therapy", durationMin: 45, description: "Pain management therapy", defaultCpt: "97140" } }),
    db.serviceType.create({ data: { code: "PT-POSTOP", name: "PT — Post-operative Therapy", category: "physical-therapy", durationMin: 45, description: "Post-surgical rehabilitation", defaultCpt: "97110" } }),

    // Wound Care
    db.serviceType.create({ data: { code: "WC-CHRONIC", name: "Wound Care — Chronic Wound", category: "wound-care", durationMin: 45, description: "Chronic wound assessment & dressing", defaultCpt: "97597", homeEligible: true } }),
    db.serviceType.create({ data: { code: "WC-ACUTE", name: "Wound Care — Acute Wound", category: "wound-care", durationMin: 45, description: "Acute wound management", defaultCpt: "97597", homeEligible: true } }),
    db.serviceType.create({ data: { code: "WC-INFECT", name: "Wound Care — Infection Prevention", category: "wound-care", durationMin: 45, description: "Infection prevention & cleaning", defaultCpt: "97598", homeEligible: true } }),
    db.serviceType.create({ data: { code: "WC-HOMEEVAL", name: "Wound Care — Home Evaluation", category: "wound-care", durationMin: 45, description: "Evaluation conducted at the patient's home", homeEligible: true } }),

    // Other Services
    db.serviceType.create({ data: { code: "OS-PE", name: "Physical Exam", category: "other-services", durationMin: 45, description: "Annual / new-patient physical", defaultCpt: "99204" } }),
    db.serviceType.create({ data: { code: "OS-LAB", name: "Laboratory Draw", category: "other-services", durationMin: 45, description: "In-office labs (CBC, CMP, A1c, lipids)" } }),
    db.serviceType.create({ data: { code: "OS-WEIGHT", name: "Weight Management Consult", category: "other-services", durationMin: 45, description: "Weight management counseling" } }),

    // Aesthetic Medicine
    db.serviceType.create({ data: { code: "AE-BOTOX", name: "Botox Injection", category: "aesthetic-medicine", durationMin: 45, description: "Toxin injection consultation + treatment", defaultCpt: "11900" } }),
    db.serviceType.create({ data: { code: "AE-FILLER", name: "Dermal Filler", category: "aesthetic-medicine", durationMin: 45, description: "Hyaluronic acid filler" } }),
    db.serviceType.create({ data: { code: "AE-MESO", name: "Mesotherapy", category: "aesthetic-medicine", durationMin: 45, description: "Mesotherapy treatment" } }),
    db.serviceType.create({ data: { code: "AE-PRP-FACE", name: "Facial PRP", category: "aesthetic-medicine", durationMin: 45, description: "Facial platelet-rich plasma therapy" } }),
    db.serviceType.create({ data: { code: "AE-PRP-HAIR", name: "Capillary PRP (Hair)", category: "aesthetic-medicine", durationMin: 45, description: "Capillary PRP for hair restoration" } }),

    // Primary Care
    db.serviceType.create({ data: { code: "PC-FOLLOW", name: "Primary Care Follow-up", category: "primary-care", durationMin: 30, description: "Established patient visit", defaultCpt: "99213" } }),
    db.serviceType.create({ data: { code: "PC-ACUTE", name: "Primary Care Acute Visit", category: "primary-care", durationMin: 30, description: "Acute concern", defaultCpt: "99214" } }),
  ]);
  console.log(`  ✓ ${services.length} service types`);

  // ---------------- Patients ----------------
  const patientsData = [
    { firstName: "Eleanor", lastName: "Adams", dob: new Date("1958-04-12"), sex: "F", email: "eadams@example.com", phone: "5551112201", insurerName: "Medicare", insurerPlan: "Part B", memberId: "1A2B3C4D" },
    { firstName: "Marcus", lastName: "Brown", dob: new Date("1979-09-30"), sex: "M", email: "mbrown@example.com", phone: "5551112202", insurerName: "Aetna", insurerPlan: "PPO" },
    { firstName: "Sofia", lastName: "Chen", dob: new Date("1992-06-18"), sex: "F", phone: "5551112203", insurerName: "BlueCross", insurerPlan: "HMO" },
    { firstName: "Jamal", lastName: "Davis", dob: new Date("1985-12-05"), sex: "M", phone: "5551112204", insurerName: "United Healthcare", insurerPlan: "Choice Plus" },
    { firstName: "Priya", lastName: "Patel", dob: new Date("1968-02-22"), sex: "F", phone: "5551112205", insurerName: "Cigna" },
    { firstName: "Liam", lastName: "O'Connor", dob: new Date("2001-07-15"), sex: "M", phone: "5551112206", insurerName: "Self-pay" },
    { firstName: "Ava", lastName: "Martinez", dob: new Date("1995-11-08"), sex: "F", phone: "5551112207", insurerName: "Kaiser" },
    { firstName: "Noah", lastName: "Schmidt", dob: new Date("1948-01-25"), sex: "M", phone: "5551112208", insurerName: "Medicare", memberId: "9X8Y7Z6W" },
    { firstName: "Mia", lastName: "Garcia", dob: new Date("1976-08-14"), sex: "F", phone: "5551112209", insurerName: "Anthem", insurerPlan: "Silver" },
    { firstName: "Ethan", lastName: "Williams", dob: new Date("2010-03-19"), sex: "M", phone: "5551112210", insurerName: "BlueCross", insurerPlan: "Family" },
  ];

  const patients = await Promise.all(patientsData.map((p, i) => db.patient.create({
    data: {
      ...p,
      mrn: `AC-${100000 + i}`,
      addressLine1: `${100 + i} Main St`,
      city: "Miami",
      state: "FL",
      postalCode: "33101",
      preferredLang: i === 4 ? "Spanish" : "English",
      ecName: `Family member ${i + 1}`,
      ecRelation: "Spouse",
      ecPhone: `555${(8000 + i).toString().padStart(4, "0")}`,
    },
  })));
  console.log(`  ✓ ${patients.length} patients`);

  // ---------------- Allergies / Problems / Meds / Vitals per patient ----------------
  const [eleanor, marcus, sofia, jamal, priya, liam, ava, noah, mia, ethan] = patients;

  await db.allergy.createMany({ data: [
    { patientId: eleanor.id, substance: "Penicillin", reaction: "Hives", severity: "moderate" },
    { patientId: marcus.id, substance: "Sulfa drugs", reaction: "Rash", severity: "mild" },
    { patientId: noah.id, substance: "Iodinated contrast", reaction: "Anaphylaxis", severity: "life-threatening" },
    { patientId: priya.id, substance: "Latex", reaction: "Contact dermatitis", severity: "mild" },
  ] });

  await db.problem.createMany({ data: [
    { patientId: eleanor.id, icd10: "I10", description: "Essential hypertension", status: "chronic" },
    { patientId: eleanor.id, icd10: "E11.9", description: "Type 2 diabetes mellitus, w/o complications", status: "chronic" },
    { patientId: eleanor.id, icd10: "L97.929", description: "Non-pressure chronic ulcer of left lower leg", status: "active" },
    { patientId: marcus.id, icd10: "M54.5", description: "Low back pain", status: "active" },
    { patientId: marcus.id, icd10: "G89.4", description: "Chronic pain syndrome", status: "chronic" },
    { patientId: sofia.id, icd10: "L70.0", description: "Acne vulgaris", status: "active" },
    { patientId: jamal.id, icd10: "M25.561", description: "Pain in right knee, post-op", status: "active" },
    { patientId: priya.id, icd10: "I10", description: "Essential hypertension", status: "chronic" },
    { patientId: priya.id, icd10: "E78.5", description: "Hyperlipidemia", status: "chronic" },
    { patientId: noah.id, icd10: "L97.521", description: "Diabetic foot ulcer, right foot, w/ exposed fat", status: "active" },
    { patientId: noah.id, icd10: "E11.621", description: "Type 2 DM with foot ulcer", status: "chronic" },
    { patientId: mia.id, icd10: "E66.9", description: "Obesity, unspecified", status: "active" },
    { patientId: ava.id, icd10: "F41.1", description: "Generalized anxiety disorder", status: "chronic" },
  ] });

  await db.medication.createMany({ data: [
    { patientId: eleanor.id, name: "Lisinopril", strength: "20 mg", form: "tablet", sig: "1 tab PO daily", route: "PO", prescriberId: drRivera.id },
    { patientId: eleanor.id, name: "Metformin", strength: "500 mg", form: "tablet", sig: "1 tab PO BID with meals", route: "PO", prescriberId: drRivera.id },
    { patientId: marcus.id, name: "Gabapentin", strength: "300 mg", form: "capsule", sig: "1 cap PO TID", route: "PO", prescriberId: mdSmith.id },
    { patientId: priya.id, name: "Atorvastatin", strength: "40 mg", form: "tablet", sig: "1 tab PO QHS", route: "PO", prescriberId: drRivera.id },
    { patientId: noah.id, name: "Insulin glargine", strength: "100 U/mL", sig: "20 units SC at bedtime", route: "SC", prescriberId: drRivera.id },
  ] });

  // Vitals
  for (const p of patients) {
    const baseSys = 110 + Math.floor(Math.random() * 30);
    const baseDia = 70 + Math.floor(Math.random() * 15);
    for (let i = 0; i < 4; i++) {
      const taken = subDays(new Date(), i * 21 + 1);
      await db.vital.create({ data: {
        patientId: p.id,
        takenAt: taken,
        systolic: baseSys + Math.floor(Math.random() * 8 - 4),
        diastolic: baseDia + Math.floor(Math.random() * 6 - 3),
        pulse: 65 + Math.floor(Math.random() * 20),
        temperatureC: 36.5 + Math.random() * 0.6,
        spo2: 96 + Math.floor(Math.random() * 4),
        respRate: 14 + Math.floor(Math.random() * 4),
        weightKg: 60 + Math.random() * 40,
        heightCm: 160 + Math.random() * 25,
        bmi: 22 + Math.random() * 8,
        painScore: i === 0 && (p.id === marcus.id || p.id === jamal.id) ? 6 : 1,
      } });
    }
  }

  // ---------------- Appointments ----------------
  const today = startOfDay(new Date());
  const apptsData: any[] = [];
  function pickAt(day: Date, h: number, m = 0) { return setMinutes(setHours(day, h), m); }

  // today's schedule
  apptsData.push(
    { patientId: eleanor.id, providerId: drRivera.id, serviceTypeId: services.find(s => s.code === "PC-FOLLOW")!.id, startsAt: pickAt(today, 8, 30), reason: "BP follow-up", status: "completed" },
    { patientId: marcus.id, providerId: dptJones.id, serviceTypeId: services.find(s => s.code === "PT-FOLLOW")!.id, startsAt: pickAt(today, 9, 30), reason: "Lower back pain", status: "checked-in" },
    { patientId: sofia.id, providerId: npTan.id, serviceTypeId: services.find(s => s.code === "AE-FILLER")!.id, startsAt: pickAt(today, 10, 30), reason: "Filler consult", status: "scheduled" },
    { patientId: jamal.id, providerId: dptJones.id, serviceTypeId: services.find(s => s.code === "PT-POSTOP")!.id, startsAt: pickAt(today, 11, 30), reason: "Post-op knee rehab", status: "scheduled" },
    { patientId: priya.id, providerId: drRivera.id, serviceTypeId: services.find(s => s.code === "PC-ACUTE")!.id, startsAt: pickAt(today, 13, 0), reason: "Headache", status: "scheduled" },
    { patientId: noah.id, providerId: mdSmith.id, serviceTypeId: services.find(s => s.code === "WC-CHRONIC")!.id, startsAt: pickAt(today, 14, 0), reason: "Diabetic foot ulcer dressing change", status: "scheduled", location: "home-visit" },
    { patientId: liam.id, providerId: drRivera.id, serviceTypeId: services.find(s => s.code === "OS-PE")!.id, startsAt: pickAt(today, 15, 0), reason: "Sports physical", status: "scheduled" },
    { patientId: mia.id, providerId: npTan.id, serviceTypeId: services.find(s => s.code === "OS-WEIGHT")!.id, startsAt: pickAt(today, 16, 0), reason: "Weight management", status: "scheduled" },
    { patientId: ava.id, providerId: npTan.id, serviceTypeId: services.find(s => s.code === "AE-PRP-FACE")!.id, startsAt: pickAt(today, 16, 30), reason: "Facial PRP follow-up", status: "scheduled" },
  );
  // tomorrow + day after
  for (let d = 1; d <= 3; d++) {
    const day = addDays(today, d);
    apptsData.push(
      { patientId: ethan.id, providerId: drRivera.id, serviceTypeId: services.find(s => s.code === "OS-PE")!.id, startsAt: pickAt(day, 9, 0), reason: "School physical", status: "scheduled" },
      { patientId: noah.id, providerId: mdSmith.id, serviceTypeId: services.find(s => s.code === "WC-CHRONIC")!.id, startsAt: pickAt(day, 11, 0), reason: "Wound dressing", status: "scheduled" },
    );
  }

  const allAppts = await Promise.all(apptsData.map(a => {
    const start = a.startsAt;
    const end = addMinutes(start, 45);
    return db.appointment.create({ data: { ...a, endsAt: end } });
  }));
  console.log(`  ✓ ${allAppts.length} appointments`);

  // ---------------- Encounters (with SOAP, Dx, Charges, Orders) ----------------
  // Eleanor — completed PC follow-up today
  const eleanorEnc = await db.encounter.create({
    data: {
      patientId: eleanor.id,
      providerId: drRivera.id,
      appointmentId: allAppts[0].id,
      visitType: "follow-up",
      chiefComplaint: "Hypertension follow-up; medication review",
      startedAt: pickAt(today, 8, 30),
      signedAt: pickAt(today, 9, 5),
      status: "signed",
      subjective: "65 y/o F with HTN and T2DM here for routine f/u. BP at home running 130s/80s. Denies CP, SOB, dizziness. Adherent with lisinopril and metformin. Reports left calf ulcer is unchanged in size, no drainage.",
      ros: "General: no fevers, no weight changes. CV: no chest pain, no palpitations. Resp: no SOB. GI: no n/v. GU: no dysuria. Skin: chronic L lower-leg ulcer, stable.",
      objective: "BP 132/82, HR 72, T 36.7, SpO2 98%. Wt 78 kg. Lungs clear. Heart RRR. Extremities: 2 cm × 1.5 cm L lateral malleolar ulcer, granulation tissue, no purulence.",
      examFindings: "WDWN female, NAD. CV: regular rate and rhythm, no murmurs. Lungs: clear bilaterally. Lower extremities: chronic ulcer L leg as described, no surrounding cellulitis.",
      assessment: "1) Essential HTN — controlled.\n2) T2DM — stable, A1c last 6.9.\n3) Chronic non-pressure ulcer L lower leg — stable, continue wound care.",
      plan: "Continue lisinopril 20 mg, metformin 500 mg BID. Order A1c, BMP. Refer to wound care for ongoing dressing q3 days. Return in 3 months.",
    },
  });
  await db.encounterDiagnosis.createMany({ data: [
    { encounterId: eleanorEnc.id, icd10: "I10", description: "Essential hypertension", primary: true },
    { encounterId: eleanorEnc.id, icd10: "E11.9", description: "Type 2 diabetes mellitus, w/o complications" },
    { encounterId: eleanorEnc.id, icd10: "L97.929", description: "Non-pressure chronic ulcer, L lower leg" },
  ] });
  await db.encounterCharge.createMany({ data: [
    { encounterId: eleanorEnc.id, cpt: "99214", description: "Office visit, established, moderate MDM", units: 1, feeCents: 17500 },
  ] });
  await db.order.createMany({ data: [
    { patientId: eleanor.id, providerId: drRivera.id, encounterId: eleanorEnc.id, type: "lab", itemName: "Hemoglobin A1c", itemCode: "4548-4", priority: "routine", status: "pending", diagnosisCode: "E11.9" },
    { patientId: eleanor.id, providerId: drRivera.id, encounterId: eleanorEnc.id, type: "lab", itemName: "Basic Metabolic Panel", itemCode: "BMP", priority: "routine", status: "pending", diagnosisCode: "I10" },
    { patientId: eleanor.id, providerId: drRivera.id, encounterId: eleanorEnc.id, type: "referral", itemName: "Wound Care Clinic — chronic LE ulcer", priority: "routine", status: "sent" },
  ] });

  // Marcus — open PT encounter
  const marcusEnc = await db.encounter.create({
    data: {
      patientId: marcus.id,
      providerId: dptJones.id,
      appointmentId: allAppts[1].id,
      visitType: "office",
      chiefComplaint: "Lower back pain — PT visit 3/12",
      startedAt: pickAt(today, 9, 30),
      status: "open",
      subjective: "Pt reports 30% improvement since last visit. Pain currently 4/10, was 6/10. Sleeping better.",
      objective: "Lumbar AROM: flexion 50° (was 35°), extension 15°. SLR neg bilaterally. Tenderness paraspinal L>R.",
      assessment: "Mechanical low back pain, improving with PT.",
      plan: "Continue therapeutic exercise 2x/week × 6 weeks. Add core stabilization. HEP given.",
    },
  });
  await db.encounterDiagnosis.create({ data: { encounterId: marcusEnc.id, icd10: "M54.5", description: "Low back pain", primary: true } });
  await db.encounterCharge.createMany({ data: [
    { encounterId: marcusEnc.id, cpt: "97110", description: "Therapeutic exercise — 15 min", units: 2, feeCents: 4500 },
    { encounterId: marcusEnc.id, cpt: "97140", description: "Manual therapy — 15 min", units: 1, feeCents: 4500 },
  ] });

  // Noah — wound care home visit (open)
  const noahEnc = await db.encounter.create({
    data: {
      patientId: noah.id,
      providerId: mdSmith.id,
      appointmentId: allAppts[5].id,
      visitType: "home",
      chiefComplaint: "Diabetic foot ulcer — home dressing change",
      startedAt: pickAt(today, 14, 0),
      status: "open",
      subjective: "Pt reports no new pain. Caregiver notes mild yellow drainage on prior dressing. No fever.",
      objective: "Wound R plantar foot 2 cm × 1.5 cm × 0.3 cm depth. Granulation tissue 70%, slough 30%, scant serous drainage. Periwound intact, no cellulitis.",
      assessment: "Diabetic foot ulcer, R foot — stable, slough increasing — debride.",
      plan: "Sharp debridement, calcium alginate dressing, foam cover. Offload with boot. RTC q3 days.",
    },
  });
  await db.encounterDiagnosis.createMany({ data: [
    { encounterId: noahEnc.id, icd10: "L97.521", description: "Diabetic foot ulcer, R foot", primary: true },
    { encounterId: noahEnc.id, icd10: "E11.621", description: "T2DM with foot ulcer" },
  ] });
  await db.encounterCharge.createMany({ data: [
    { encounterId: noahEnc.id, cpt: "97597", description: "Wound debridement, ≤20 cm²", units: 1, feeCents: 13000 },
  ] });

  // Some past signed encounters
  const past = subDays(today, 14);
  const pastEnc = await db.encounter.create({
    data: {
      patientId: priya.id,
      providerId: drRivera.id,
      visitType: "follow-up",
      chiefComplaint: "Annual physical",
      startedAt: pickAt(past, 10, 0),
      signedAt: pickAt(past, 10, 35),
      status: "signed",
      subjective: "Pt feeling well overall. No specific complaints. Diet better, exercising 3x/week.",
      objective: "BP 128/78, HR 70. Wt 64 kg. Exam unremarkable.",
      assessment: "Hyperlipidemia controlled on statin. HTN well-controlled. No new issues.",
      plan: "Continue current meds. Order lipid panel, A1c. RTC 1 year for annual.",
    },
  });
  await db.encounterDiagnosis.createMany({ data: [
    { encounterId: pastEnc.id, icd10: "Z00.00", description: "Encounter for general adult medical exam", primary: true },
    { encounterId: pastEnc.id, icd10: "I10", description: "Essential hypertension" },
    { encounterId: pastEnc.id, icd10: "E78.5", description: "Hyperlipidemia" },
  ] });
  await db.encounterCharge.create({ data: { encounterId: pastEnc.id, cpt: "99204", description: "Office visit, new, moderate MDM", units: 1, feeCents: 22000 } });

  console.log(`  ✓ encounters & charges`);

  // ---------------- Messages ----------------
  await db.message.createMany({ data: [
    { fromUserId: nurseKim.id, toUserId: drRivera.id, patientId: noah.id, subject: "Wound care — schedule", body: "Mr. Schmidt's daughter called to confirm home visit at 2pm. Roads OK." },
    { fromUserId: frontLopez.id, toUserId: drRivera.id, patientId: eleanor.id, subject: "Refill request", body: "Eleanor Adams requests refill on lisinopril and metformin. Please review." },
    { fromUserId: billing.id, toUserId: drRivera.id, subject: "Charges pending signature", body: "3 encounters from yesterday have draft charges awaiting signature." },
  ] });
  console.log(`  ✓ messages`);

  console.log("\nDone. Login: mariuska.aristica@apexcare.health / apex123\n");
}

main()
  .then(() => db.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await db.$disconnect();
    process.exit(1);
  });
