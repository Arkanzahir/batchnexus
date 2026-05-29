/**
 * Seed Script — Populates the DaaS backend with realistic demo data
 * for the BatchNexus Control Tower hackathon pitch.
 *
 * Usage: node scripts/seed-daas.mjs
 */

const DAAS_URL = "https://29dd52b2-e0be-43c7-a587-2c78d2dc107a.daas4.buildpad.ai";
const TOKEN = "Y45aktNq5TgbalfTlggMJ8ukwjwU3wdR";

async function post(collection, body) {
  const res = await fetch(`${DAAS_URL}/api/items/${collection}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!res.ok) {
    console.error(`❌ Failed to seed ${collection}:`, JSON.stringify(json));
    return null;
  }
  console.log(`✅ Seeded ${collection}: ${json.data?.id ?? JSON.stringify(json.data)}`);
  return json.data;
}

async function main() {
  console.log("🌱 Seeding DaaS with demo data...\n");

  // ─── 1. Suppliers ──────────────────────────────────────
  const sup1 = await post("suppliers", {
    name: "KTA Ponorogo",
    code: "KTA-PON",
    country: "Indonesia",
    contact_email: "supply@kta-ponorogo.co.id",
  });
  const sup2 = await post("suppliers", {
    name: "Java Citrus Farm",
    code: "JCF",
    country: "Indonesia",
    contact_email: "ops@javacitrus.co.id",
  });
  const sup3 = await post("suppliers", {
    name: "Flores Botanica",
    code: "FLB",
    country: "Indonesia",
    contact_email: "hello@floresbotanica.id",
  });

  // ─── 2. Materials ─────────────────────────────────────
  const mat1 = await post("materials", {
    name: "Lavender Absolute",
    type: "Essential Oil",
    hazard_class: "Flammable",
    default_temp: "Ambient",
  });
  const mat2 = await post("materials", {
    name: "Citrus Peel Extract",
    type: "Extract Liquid",
    hazard_class: "Flammable",
    default_temp: "-20 to -4°C",
  });
  const mat3 = await post("materials", {
    name: "Sandalwood Oil",
    type: "Essential Oil",
    hazard_class: "Normal",
    default_temp: "Ambient",
  });
  const mat4 = await post("materials", {
    name: "Rose Absolute",
    type: "Essential Oil",
    hazard_class: "Normal",
    default_temp: "Chilled",
  });
  const mat5 = await post("materials", {
    name: "Clove Bud Oil",
    type: "Essential Oil",
    hazard_class: "Flammable",
    default_temp: "Ambient",
  });

  // ─── 3. Warehouse Zones ───────────────────────────────
  const zoneAmb = await post("warehouse_zones", {
    name: "AMB-A",
    temp_min: 15,
    temp_max: 30,
    hazard_class_allowed: "Normal",
  });
  const zoneCold = await post("warehouse_zones", {
    name: "COLD-B",
    temp_min: 2,
    temp_max: 8,
    hazard_class_allowed: "Normal",
  });
  const zoneFrz = await post("warehouse_zones", {
    name: "FRZ-C",
    temp_min: -25,
    temp_max: -4,
    hazard_class_allowed: "Normal",
  });
  const zoneHaz = await post("warehouse_zones", {
    name: "HAZ-D",
    temp_min: -25,
    temp_max: 30,
    hazard_class_allowed: "Flammable",
  });

  // ─── 4. Warehouse Bins ────────────────────────────────
  if (zoneAmb) {
    for (let i = 1; i <= 6; i++) {
      await post("warehouse_bins", {
        name: `AMB-A-0${i}`,
        capacity_drums: 20,
        occupied_drums: i <= 3 ? Math.floor(Math.random() * 15) + 2 : 0,
        zone_id: zoneAmb.id,
      });
    }
  }
  if (zoneCold) {
    for (let i = 1; i <= 6; i++) {
      await post("warehouse_bins", {
        name: `COLD-B-0${i}`,
        capacity_drums: 15,
        occupied_drums: i <= 2 ? Math.floor(Math.random() * 10) + 1 : 0,
        zone_id: zoneCold.id,
      });
    }
  }
  if (zoneFrz) {
    for (let i = 1; i <= 4; i++) {
      await post("warehouse_bins", {
        name: `FRZ-C-0${i}`,
        capacity_drums: 12,
        occupied_drums: i === 1 ? 8 : 0,
        zone_id: zoneFrz.id,
      });
    }
  }
  if (zoneHaz) {
    for (let i = 1; i <= 6; i++) {
      await post("warehouse_bins", {
        name: `HAZ-D-0${i}`,
        capacity_drums: 10,
        occupied_drums: i <= 3 ? Math.floor(Math.random() * 6) + 1 : 0,
        zone_id: zoneHaz.id,
      });
    }
  }

  // ─── 5. Inbound Receipts ──────────────────────────────
  const rec1 = await post("inbound_receipts", {
    supplier_id: sup1?.id,
    material_id: mat1?.id,
    quantity: 150,
    unit: "kg",
    arrival_date: "2026-05-27",
    batch_reference: "BGR-24-LVA",
    temperature_requirement: "Ambient",
    hazard_class: "Flammable",
    status: "QC Released",
  });
  const rec2 = await post("inbound_receipts", {
    supplier_id: sup2?.id,
    material_id: mat2?.id,
    quantity: 500,
    unit: "kg",
    arrival_date: "2026-05-28",
    batch_reference: "JCF-CIT-0526",
    temperature_requirement: "-20 to -4°C",
    hazard_class: "Flammable",
    status: "Pending QC",
  });
  const rec3 = await post("inbound_receipts", {
    supplier_id: sup3?.id,
    material_id: mat3?.id,
    quantity: 25,
    unit: "kg",
    arrival_date: "2026-05-28",
    batch_reference: "IND-99-SAN",
    temperature_requirement: "Ambient",
    hazard_class: "Normal",
    status: "Processing",
  });
  const rec4 = await post("inbound_receipts", {
    supplier_id: sup1?.id,
    material_id: mat4?.id,
    quantity: 30,
    unit: "kg",
    arrival_date: "2026-05-29",
    batch_reference: "FLB-RS-0529",
    temperature_requirement: "Chilled",
    hazard_class: "Normal",
    status: "Pending QC",
  });
  const rec5 = await post("inbound_receipts", {
    supplier_id: sup1?.id,
    material_id: mat5?.id,
    quantity: 200,
    unit: "kg",
    arrival_date: "2026-05-29",
    batch_reference: "KTA-CLV-0529",
    temperature_requirement: "Ambient",
    hazard_class: "Flammable",
    status: "Awaiting Intake",
  });

  // ─── 6. QC Inspections (for released receipts) ────────
  if (rec1) {
    await post("qc_inspections", {
      receipt_id: rec1.id,
      ai_color_score: 92,
      ai_defect_risk: 0.08,
      ai_foreign_matter_risk: 0.05,
      ai_recommendation: "Pass",
      human_decision: "QC Released",
      lot_number_generated: "LOT-2026-049",
      comments: "Approved. Excellent quality batch.",
    });
  }

  // ─── 7. Lots (for released receipts) ──────────────────
  if (rec1 && mat1) {
    await post("lots", {
      lot_number: "LOT-2026-049",
      quantity: 150,
      status: "Stored",
      receipt_id: rec1.id,
      material_id: mat1.id,
    });
  }

  console.log("\n🎉 Seed complete! Your DaaS is ready for the demo.");
}

main().catch(console.error);
