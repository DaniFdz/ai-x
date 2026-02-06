import { Type } from "@sinclair/typebox";
import { executeBird } from "../bird.js";

export const readTimelineTool = {
  name: "read_timeline",
  label: "Read Timeline",
  description:
    "Read the user's Twitter/X home timeline. Returns recent tweets from accounts the user follows. Use 'following' mode for chronological tweets or default for the algorithmic 'For You' feed.",
  parameters: Type.Object({
    following: Type.Optional(
      Type.Boolean({
        description: "If true, chronological 'Following' timeline. Default true.",
      })
    ),
    count: Type.Optional(
      Type.Number({ description: "Number of tweets. Default 20, max 50." })
    ),
  }),
  async execute(_toolCallId: string, params: { following?: boolean; count?: number }) {
    const following = params.following !== false;
    const count = Math.min(params.count || 20, 50);
    const args = ["home", "-n", String(count)];
    if (following) args.push("--following");
    const result = await executeBird(args);
    return { content: [{ type: "text" as const, text: result }], details: {} };
  },
};
