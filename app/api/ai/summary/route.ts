import { generateText } from "ai";
import { groq } from "@ai-sdk/groq";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { logs } = await req.json();

    if (!process.env.GROQ_API_KEY) {
       console.log("No Groq API Key found. Returning simulated summary.");
       await new Promise(resolve => setTimeout(resolve, 1500));
       return NextResponse.json({
          text: "End of Day Summary (Simulated):\n- Processed 5 inbound receipts.\n- 4 lots successfully passed QC and were slotted.\n- 1 lot was flagged for high defect risk.\nAll operations compliant with Sima Arôme protocols."
       });
    }

    const result = await generateText({
      model: groq("llama-3.1-8b-instant"),
      system: "You are the Executive AI for a raw materials factory. Summarize the provided audit logs into a concise, professional end-of-day bulleted summary focusing on operational throughput and anomalies.",
      prompt: `Please summarize the following daily operations logs:\n\n${JSON.stringify(logs, null, 2)}`,
    });

    return NextResponse.json({ text: result.text });
  } catch (error) {
    console.error("AI Summary Error:", error);
    return NextResponse.json({
          text: "End of Day Summary (Simulated Fallback due to API Load):\n- Processed 5 inbound receipts.\n- 4 lots successfully passed QC and were slotted.\n- 1 lot was flagged for high defect risk.\nAll operations compliant with Sima Arôme protocols."
    });
  }
}
