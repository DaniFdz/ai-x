import { Type } from "@sinclair/typebox";
import { executeBird } from "../bird.js";

export const searchTwitterTool = {
  name: "search_twitter",
  label: "Search Twitter",
  description:
    "Search Twitter/X for tweets matching a query. Supports operators like 'from:user', quoted phrases, and boolean logic. Use for topic research, finding discussions, and discovering content.",
  parameters: Type.Object({
    query: Type.String({
      description:
        "Search query. Supports Twitter search operators like 'from:username', quoted exact phrases, OR, etc.",
    }),
    count: Type.Optional(
      Type.Number({ description: "Number of results. Default 10, max 50." })
    ),
  }),
  async execute(_toolCallId: string, params: { query: string; count?: number }) {
    const count = Math.min(params.count || 10, 50);
    const result = await executeBird(["search", params.query, "-n", String(count)]);
    return { content: [{ type: "text" as const, text: result }], details: {} };
  },
};
