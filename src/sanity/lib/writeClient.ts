import { createClient } from "next-sanity";
import { apiVersion, dataset, projectId } from "../env";

/**
 * Server-side write client. Requires SANITY_WRITE_TOKEN (Editor-level).
 * Do NOT import this from client components — the token is secret.
 */
export function getWriteClient() {
  const token = process.env.SANITY_WRITE_TOKEN;
  if (!token) {
    throw new Error(
      "SANITY_WRITE_TOKEN is not set — cannot publish to Sanity from the bot"
    );
  }
  return createClient({
    projectId,
    dataset,
    apiVersion,
    token,
    useCdn: false,
  });
}
