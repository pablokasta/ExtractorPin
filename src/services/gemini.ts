import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface ExtractedData {
  vouchers: string[];
}

export async function extractVouchersFromPDF(base64PDF: string): Promise<string[]> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [
          {
            text: "Extract all 10-digit voucher numbers from this PDF. These numbers are usually highlighted or large inside individual 'ficha hotspot' boxes or rectangles. Format each number as 'XXXXX-XXXXX' (5 digits, a hyphen, and 5 digits). Return them as a list of strings.",
          },
          {
            inlineData: {
              mimeType: "application/pdf",
              data: base64PDF,
            },
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            vouchers: {
              type: Type.ARRAY,
              items: {
                type: Type.STRING,
                description: "A voucher number in XXXXX-XXXXX format",
              },
            },
          },
          required: ["vouchers"],
        },
      },
    });

    const result = JSON.parse(response.text) as ExtractedData;
    return result.vouchers;
  } catch (error) {
    console.error("Error extracting vouchers:", error);
    throw error;
  }
}
