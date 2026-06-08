/**
 * Smoke test: verifies ANTHROPIC_API_KEY from .env.local or .env.
 * Does not print the key.
 */
import dotenv from "dotenv";
import Anthropic from "@anthropic-ai/sdk";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
process.chdir(root);

const envLocal = join(root, ".env.local");
const envFile = join(root, ".env");
if (existsSync(envLocal)) dotenv.config({ path: envLocal });
dotenv.config({ path: envFile });

const key = process.env.ANTHROPIC_API_KEY?.trim();
if (!key) {
  console.error("FAIL: ANTHROPIC_API_KEY is missing. Add it to .env or .env.local");
  process.exit(1);
}

const client = new Anthropic({ apiKey: key });

try {
  const msg = await client.messages.create({
    // Cheapest current model for smoke tests (see Anthropic models overview)
    model: process.env.ANTHROPIC_MODEL?.trim() || "claude-haiku-4-5",
    max_tokens: 32,
    messages: [{ role: "user", content: "Reply with exactly the word: ok" }],
  });
  const text =
    msg.content[0]?.type === "text" ? msg.content[0].text : JSON.stringify(msg.content[0]);
  console.log("PASS: Anthropic API responded.");
  console.log("Model:", msg.model);
  console.log("Snippet:", text.slice(0, 120).replace(/\s+/g, " "));
} catch (err) {
  console.error("FAIL:", err.message || err);
  if (err.status) console.error("HTTP status:", err.status);
  process.exit(1);
}
