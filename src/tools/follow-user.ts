import { Type } from "@sinclair/typebox";
import { executeBird } from "../bird.js";

export const followUserTool = {
  name: "follow_user",
  label: "Follow User",
  description:
    "Follow a Twitter/X user. CRITICAL: Only use this tool when the user EXPLICITLY asks to follow someone. Never call this proactively or suggest following users unprompted.",
  parameters: Type.Object({
    handle: Type.String({ description: "Twitter handle with @ prefix, e.g. '@karpathy'." }),
  }),
  async execute(_toolCallId: string, params: { handle: string }) {
    const result = await executeBird(["follow", params.handle]);
    return { content: [{ type: "text" as const, text: result }], details: {} };
  },
};
