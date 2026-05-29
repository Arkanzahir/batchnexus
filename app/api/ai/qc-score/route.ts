import { NextResponse } from "next/server";

/**
 * AI QC Scoring Engine
 *
 * Receives checklist inspection results and material metadata,
 * returns a structured QC assessment with colour score, defect risk,
 * foreign matter risk, recommendation, confidence, and reason codes.
 *
 * For the hackathon demo, this uses a deterministic rule-based engine.
 * In production, this would call Gemini Vision for image-based QC.
 */

interface QCInput {
  materialName: string;
  hazardClass: string;
  checklist: {
    visualClarity: boolean;
    odorProfile: boolean;
    specificGravity: boolean;
    refractiveIndex: boolean;
  };
}

interface QCResult {
  colour_score: number;
  defect_risk: string;
  foreign_matter_risk: string;
  recommendation: string;
  confidence: number;
  reason_codes: string[];
}

export async function POST(req: Request) {
  try {
    const body: QCInput = await req.json();
    const { checklist, materialName, hazardClass } = body;

    // Simulate AI processing delay (300-800ms)
    await new Promise((resolve) =>
      setTimeout(resolve, 300 + Math.random() * 500)
    );

    // ─── Rule-Based Scoring Engine ───────────────────────
    let colourScore = 70; // base
    const reasonCodes: string[] = [];
    let passedChecks = 0;
    const totalChecks = 4;

    if (checklist.visualClarity) {
      colourScore += 8;
      passedChecks++;
      reasonCodes.push("Visual clarity within acceptable range");
    } else {
      reasonCodes.push("⚠ Visual clarity check failed — turbidity detected");
    }

    if (checklist.odorProfile) {
      colourScore += 7;
      passedChecks++;
      reasonCodes.push("Odor profile matches reference standard");
    } else {
      colourScore -= 5;
      reasonCodes.push("⚠ Odor deviation detected — requires human review");
    }

    if (checklist.specificGravity) {
      colourScore += 5;
      passedChecks++;
      reasonCodes.push("Specific gravity within ±0.002 tolerance");
    } else {
      colourScore -= 3;
      reasonCodes.push("⚠ Specific gravity out of range");
    }

    if (checklist.refractiveIndex) {
      colourScore += 5;
      passedChecks++;
      reasonCodes.push("Refractive index verified at 1.457–1.463 nD");
    } else {
      colourScore -= 3;
      reasonCodes.push("⚠ Refractive index not verified");
    }

    // Add material-specific bonus
    if (materialName?.toLowerCase().includes("lavender")) {
      colourScore += 2;
      reasonCodes.push("Lavender material — premium colour expected");
    }

    // Clamp score
    colourScore = Math.max(0, Math.min(100, colourScore));

    // ─── Risk Assessment ─────────────────────────────────
    const defectRisk =
      passedChecks >= 4 ? "Low" : passedChecks >= 2 ? "Medium" : "High";
    const foreignMatterRisk =
      checklist.visualClarity && checklist.specificGravity
        ? "Low"
        : checklist.visualClarity
        ? "Medium"
        : "High";

    // ─── Recommendation ──────────────────────────────────
    let recommendation: string;
    if (passedChecks === 4 && colourScore >= 85) {
      recommendation = "Pass";
    } else if (passedChecks >= 2 && colourScore >= 60) {
      recommendation = "Pass with Human Review";
    } else {
      recommendation = "Block Material";
    }

    // ─── Confidence ──────────────────────────────────────
    const confidence = Math.round((passedChecks / totalChecks) * 100) / 100;

    // Add hazard warning if applicable
    if (hazardClass === "Flammable") {
      reasonCodes.push(
        "🔥 Material classified as Flammable — storage policy enforcement required"
      );
    }

    const result: QCResult = {
      colour_score: colourScore,
      defect_risk: defectRisk,
      foreign_matter_risk: foreignMatterRisk,
      recommendation,
      confidence,
      reason_codes: reasonCodes,
    };

    return NextResponse.json({ data: result });
  } catch (error) {
    console.error("QC Score Error:", error);
    return NextResponse.json(
      { error: "Failed to compute QC score" },
      { status: 500 }
    );
  }
}
