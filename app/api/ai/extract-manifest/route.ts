import { generateObject } from "ai";
import { google } from "@ai-sdk/google";
import { z } from "zod";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { imageUrl } = await req.json();

    // If no API key is provided, or for the hackathon safe-demo, return mock data
    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY || imageUrl === 'dummy-manifest.jpg') {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      return NextResponse.json({
        data: {
          supplierCode: "mock-sup-1",
          materialType: "mock-mat-1",
          quantity: 500,
          temperatureRequirement: "Ambient",
          batchReference: "DO-2026-X99"
        }
      });
    }

    // Extract structured data from the Delivery Order / Manifest image
    const { object } = await generateObject({
      model: google("models/gemini-1.5-pro-latest"),
      system: "You are an AI assistant that extracts data from botanical delivery manifests and certificates of analysis. Extract the supplier code, material type, quantity, and temperature requirement from the document.",
      schema: z.object({
        supplierCode: z.string().describe("The code or name of the supplier"),
        materialType: z.string().describe("The type of material (e.g., 'Leaf', 'Root', 'Patchouli')"),
        quantity: z.number().describe("The total quantity in KG"),
        temperatureRequirement: z.enum(["Ambient", "Chilled", "Frozen"]).describe("The required storage temperature"),
        batchReference: z.string().describe("The supplier's batch reference number, if any"),
      }),
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: "Extract the data from this delivery manifest." },
            { type: "image", image: imageUrl },
          ],
        },
      ],
    });

    return NextResponse.json({ data: object });
  } catch (error) {
    console.error("Extraction Error:", error);
    return NextResponse.json({ error: "Failed to extract data from manifest" }, { status: 500 });
  }
}
