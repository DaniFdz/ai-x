import { Type } from "@sinclair/typebox";
import { executeBird } from "../bird.js";

export const getNewsTool = {
  name: "get_news",
  label: "Get News",
  description:
    "Get trending news and topics from Twitter/X Explore tabs. Can filter to AI-curated news. Use for broad 'what's happening' questions.",
  parameters: Type.Object({
    aiOnly: Type.Optional(
      Type.Boolean({ description: "Only AI-curated news items. Default true." })
    ),
    withTweets: Type.Optional(
      Type.Boolean({ description: "Include related tweets per news item. Default false." })
    ),
    count: Type.Optional(
      Type.Number({ description: "Number of news items. Default 10." })
    ),
  }),
  async execute(
    _toolCallId: string,
    params: { aiOnly?: boolean; withTweets?: boolean; count?: number }
  ) {
    const aiOnly = params.aiOnly !== false;
    const withTweets = params.withTweets === true;
    const count = params.count || 10;
    const args = ["news", "-n", String(count)];
    if (aiOnly) args.push("--ai-only");
    if (withTweets) args.push("--with-tweets");
    const result = await executeBird(args);
    return { content: [{ type: "text" as const, text: result }], details: {} };
  },
};
