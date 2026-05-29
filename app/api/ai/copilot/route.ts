import { generateText, tool } from "ai";
import { google } from "@ai-sdk/google";
import { z } from "zod";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    // Example Copilot implementation with function calling (tools)
    const result = await generateText({
      model: google("models/gemini-1.5-flash-latest"),
      system: "You are the Sima Arôme Ops Copilot. You assist warehouse operators and managers in tracking lots, checking QC statuses, and managing inventory. You have access to real-time DaaS data via tools.",
      messages,
      tools: {
        getLotsStatus: tool({
          description: "Get the count of lots currently in a specific status (e.g., 'Blocked', 'QC Released').",
          parameters: z.object({
            status: z.string().describe("The status to query (e.g., 'Blocked', 'Stored')"),
          }),
          execute: async ({ status }) => {
            // In a real implementation, you would fetch from the DaaS API:
            // const res = await fetch(`${process.env.NEXT_PUBLIC_BUILDPAD_DAAS_URL}/api/items/lots?aggregate={"count":["id"]}&filter={"status":{"_eq":"${status}"}}`);
            
            // Mocking for now to demonstrate the architecture
            return { count: status === 'Blocked' ? 3 : 15, status };
          },
        }),
      },
      maxSteps: 3,
    });

    return NextResponse.json({ text: result.text });
  } catch (error) {
    console.error("Copilot Error:", error);
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 });
  }
}
