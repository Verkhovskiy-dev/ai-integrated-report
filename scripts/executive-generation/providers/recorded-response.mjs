import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { hashJson } from "../contracts.mjs";

const sha256 = value => createHash("sha256").update(value).digest("hex");

/**
 * Replays a previously recorded actual response without contacting a model.
 * Both the prompt and response must match the immutable source run manifest.
 */
export async function createRecordedResponseProvider(responsePath, manifestPath) {
  const responseText = await readFile(responsePath, "utf8");
  const manifestText = await readFile(manifestPath, "utf8");
  const response = JSON.parse(responseText);
  const manifest = JSON.parse(manifestText);
  if (hashJson(response) !== manifest.response_sha256) {
    throw new Error("recorded provider response hash mismatch");
  }
  return async ({ prompt, batchId }) => {
    const promptSha256 = sha256(prompt);
    if (promptSha256 !== manifest.prompt_sha256) {
      throw new Error("recorded provider prompt hash mismatch");
    }
    if (batchId !== manifest.batch_id) {
      throw new Error("recorded provider batch mismatch");
    }
    return {
      response: structuredClone(response),
      receipt: {
        provider: "recorded-actual-response-replay",
        actual_inference: false,
        original_provider: manifest.provider?.provider || "unknown",
        original_model_requested: manifest.provider?.model_requested || null,
        original_tool_call_count: manifest.provider?.tool_call_count,
        source_run_manifest_sha256: sha256(manifestText),
        source_prompt_sha256: manifest.prompt_sha256,
        source_response_sha256: manifest.response_sha256,
      },
    };
  };
}
