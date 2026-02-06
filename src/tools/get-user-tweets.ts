import { Type } from "@sinclair/typebox";
import { executeBird } from "../bird.js";

export const getUserTweetsTool = {
  name: "get_user_tweets",
  label: "User Tweets",
  description:
    "Get recent tweets from a specific Twitter/X user's profile. Use when the user asks about what a specific person has been posting.",
  parameters: Type.Object({
    handle: Type.String({ description: "Twitter handle with @ prefix, e.g. '@karpathy'." }),
    count: Type.Optional(
      Type.Number({ description: "Number of tweets. Default 10, max 50." })
    ),
  }),
  async execute(_toolCallId: string, params: { handle: string; count?: number }) {
    const count = Math.min(params.count || 10, 50);
    const result = await executeBird(["user-tweets", params.handle, "-n", String(count)]);
    return { content: [{ type: "text" as const, text: result }], details: {} };
  },
};
