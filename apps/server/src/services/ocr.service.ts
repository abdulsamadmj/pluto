import { type ScanExtraction, scanExtractionSchema } from "@repo/validators";
import OpenAI from "openai";
import { env } from "../../env";

const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });

/**
 * JSON schema handed to OpenAI Structured Outputs. Strict mode requires every
 * property to be listed in `required` and `additionalProperties: false`, so
 * "optional" fields are expressed as nullable — the model returns `null` for
 * anything it can't read. This mirrors `scanExtractionSchema` in @repo/validators.
 */
const EXTRACTION_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    name: { type: ["string", "null"], description: "Product / device name" },
    brand: { type: ["string", "null"], description: "Manufacturer / brand" },
    category: {
      type: ["string", "null"],
      description:
        "Device category, e.g. Laptop, Phone, TV, Tablet, Headphones, Smartwatch, Camera, Console, Monitor, Appliance",
    },
    model: { type: ["string", "null"], description: "Model name or number" },
    serialNumber: { type: ["string", "null"], description: "Serial number" },
    purchaseDate: {
      type: ["string", "null"],
      description: "Purchase date as YYYY-MM-DD",
    },
    purchasePrice: {
      type: ["integer", "null"],
      description: "Purchase price as a whole number (no currency symbol)",
    },
    retailer: {
      type: ["string", "null"],
      description: "Store / retailer the device was bought from",
    },
    warrantyMonths: {
      type: ["integer", "null"],
      description: "Warranty length in whole months (e.g. '1 year' -> 12)",
    },
    warrantyProvider: {
      type: ["string", "null"],
      description: "Who provides the warranty, e.g. AppleCare+, manufacturer",
    },
  },
  required: [
    "name",
    "brand",
    "category",
    "model",
    "serialNumber",
    "purchaseDate",
    "purchasePrice",
    "retailer",
    "warrantyMonths",
    "warrantyProvider",
  ],
} as const;

const SYSTEM_PROMPT =
  "You read photos of product warranty cards and purchase receipts and extract structured device details. " +
  "Only fill a field when you can read it confidently from the image; otherwise return null for that field. " +
  "Normalize the purchase date to YYYY-MM-DD. Express warranty length in whole months (convert years, e.g. '2 years' -> 24). " +
  "Strip currency symbols and thousands separators from the price and return a whole number. Do not guess or invent values.";

/**
 * Sends the scanned image to OpenAI's vision model and returns the device
 * fields it could extract. Never throws — on any failure (API, parsing,
 * validation) it returns an empty object so the caller can still save the
 * image and fall back to manual entry.
 */
export async function extractWarrantyFields(
  base64: string,
  mime: string
): Promise<ScanExtraction> {
  try {
    const completion = await openai.chat.completions.create({
      model: env.OPENAI_MODEL,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Extract the device and warranty details from this image.",
            },
            {
              type: "image_url",
              image_url: { url: `data:${mime};base64,${base64}` },
            },
          ],
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "warranty_extraction",
          strict: true,
          schema: EXTRACTION_JSON_SCHEMA,
        },
      },
    });

    const raw = completion.choices[0]?.message.content;
    if (!raw) return {};

    const parsed = scanExtractionSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : {};
  } catch (err) {
    console.error("[ocr] warranty card extraction failed:", err);
    return {};
  }
}
