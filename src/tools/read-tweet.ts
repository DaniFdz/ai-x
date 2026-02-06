import { Type } from "@sinclair/typebox";
import { executeBird } from "../bird.js";

export const readTweetTool = {
  name: "read_tweet",
  label: "Read Tweet",
  description:
    "Read a specific tweet or its full conversation thread. Use for diving deeper into a tweet, reading replies, or following a discussion.",
  parameters: Type.Object({
    tweetUrlOrId: Type.String({ description: "Tweet URL or tweet ID to read." }),
    thread: Type.Optional(
      Type.Boolean({ description: "Fetch full conversation thread. Default false." })
    ),
    replies: Type.Optional(
      Type.Boolean({ description: "Fetch replies to the tweet. Default false." })
    ),
  }),
  async execute(
    _toolCallId: string,
    params: { tweetUrlOrId: string; thread?: boolean; replies?: boolean }
  ) {
    const { tweetUrlOrId } = params;
    let result: string;

    if (params.replies) {
      result = await executeBird(["replies", tweetUrlOrId, "-n", "20"]);
    } else if (params.thread) {
      result = await executeBird(["thread", tweetUrlOrId]);
    } else {
      result = await executeBird(["read", tweetUrlOrId]);
    }

    return { content: [{ type: "text" as const, text: result }], details: {} };
  },
};
