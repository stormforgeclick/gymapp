import { createClient } from "@supabase/supabase-js";
import "dotenv/config";
import OpenAI from "openai";

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

const BATCH_SIZE = 50;

type Table =
  | "categories"
  | "equipment"
  | "muscle_groups"
  | "targets"
  | "exercise_names";

type Translation = {
  id: string;
  translation: string;
};

async function translateBatch(
  data: { id: string; name_en: string }[],
  context: string
): Promise<Translation[]> {
  const response = await openai.responses.create({
    model: "gpt-5-mini",
    input: [
      {
        role: "system",
        content: `
You are a professional translator specializing in gym and fitness terminology.

Translate the provided English text into natural Mexican Spanish.

Context: ${context}

Rules:
- Preserve the meaning.
- Use terminology commonly used in Mexican gyms.
- Do not translate exercise terminology literally when it sounds unnatural.
- Keep terminology consistent.
- Keep translations concise when possible.
- Do not add explanations.
- Return ONLY valid JSON.
- The JSON must be an array of objects with:
  "id": string
  "translation": string
        `,
      },
      {
        role: "user",
        content: JSON.stringify(
          data.map((item) => ({
            id: item.id,
            text: item.name_en,
          }))
        ),
      },
    ],
  });

  try {
    return JSON.parse(response.output_text);
  } catch {
    console.error("OpenAI returned invalid JSON:");
    console.error(response.output_text);

    throw new Error("Invalid translation response");
  }
}

async function translateTable(
  table: Table,
  context: string,
  batchSize?: number
) {
  console.log(`\n========== ${table} ==========`);

  const { data, error } = await supabase
    .from(table)
    .select("id, name_en")
    .is("name_es", null);

  if (error) {
    throw error;
  }

  if (!data?.length) {
    console.log(`No ${table} need translation.`);
    return;
  }

  console.log(`Found ${data.length} records.`);

  const size = batchSize ?? data.length;
  const totalBatches = Math.ceil(data.length / size);

  for (let i = 0; i < data.length; i += size) {
    const batch = data.slice(i, i + size);
    const batchNumber = Math.floor(i / size) + 1;

    console.log(`\n--- Batch ${batchNumber}/${totalBatches} ---`);

    console.log(
      `Translating ${i + 1}-${i + batch.length} of ${data.length}...`
    );

    const translations = await translateBatch(batch, context);

    if (translations.length !== batch.length) {
      console.warn(
        `⚠ Expected ${batch.length} translations but received ${translations.length}.`
      );
    }

    for (const translation of translations) {
      const original = batch.find((item) => item.id === translation.id);

      if (!original) {
        console.warn(`⚠ Translation returned an unknown ID: ${translation.id}`);
        continue;
      }

      const { data: updated, error } = await supabase
        .from(table)
        .update({
          name_es: translation.translation,
        })
        .eq("id", translation.id)
        .select("id, name_en, name_es")
        .single();

      if (error) {
        console.error(`Failed to update ${translation.id}:`, error.message);
        continue;
      }

      console.log(`✓ ${updated.name_en} → ${updated.name_es}`);
    }

    console.log(`✓ Batch ${batchNumber}/${totalBatches} completed.`);
  }

  console.log(`✓ ${table} completed.`);
}

async function main() {
  await translateTable("categories", "Gym exercise categories");

  await translateTable("equipment", "Gym equipment");

  await translateTable("muscle_groups", "Muscle groups targeted by exercises");

  await translateTable(
    "targets",
    "Exercise target muscles or training targets"
  );

  // Exercise names are processed in batches of 50.
  await translateTable(
    "exercise_names",
    "Names of gym and fitness exercises",
    BATCH_SIZE
  );

  console.log("\n✓ All translations completed.");
}

main().catch((error) => {
  console.error("\nTranslation failed:");
  console.error(error);
  process.exit(1);
});
