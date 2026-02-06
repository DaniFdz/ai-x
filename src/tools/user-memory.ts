import { Type } from "@sinclair/typebox";
import { readMemory, saveMemory, type UserMemory } from "../config.js";

export const userMemoryTool = {
  name: "user_memory",
  label: "User Memory",
  description:
    "Read or update the persistent user profile to personalize responses. Use 'read' at conversation start to load preferences. Use 'update' to record learned interests, preferred accounts, summary style, and personality notes.",
  parameters: Type.Object({
    action: Type.String({ description: "Action: 'read' or 'update'" }),
    updates: Type.Optional(
      Type.Object({
        addInterests: Type.Optional(Type.Array(Type.String(), { description: "Topics to add." })),
        removeInterests: Type.Optional(
          Type.Array(Type.String(), { description: "Topics to remove." })
        ),
        addPreferredAccounts: Type.Optional(
          Type.Array(Type.String(), { description: "Handles to add." })
        ),
        removePreferredAccounts: Type.Optional(
          Type.Array(Type.String(), { description: "Handles to remove." })
        ),
        summaryStyle: Type.Optional(
          Type.String({ description: "Preferred depth: 'brief', 'balanced', or 'detailed'." })
        ),
        addNotes: Type.Optional(
          Type.Array(Type.String(), { description: "Free-form notes about the user." })
        ),
      })
    ),
  }),
  async execute(
    _toolCallId: string,
    params: {
      action: string;
      updates?: {
        addInterests?: string[];
        removeInterests?: string[];
        addPreferredAccounts?: string[];
        removePreferredAccounts?: string[];
        summaryStyle?: string;
        addNotes?: string[];
      };
    }
  ) {
    if (params.action === "read") {
      return {
        content: [{ type: "text" as const, text: JSON.stringify(readMemory()) }],
        details: {},
      };
    }

    if (params.action === "update") {
      const updates = params.updates || {};
      const memory = readMemory();

      if (updates.addInterests) {
        for (const item of updates.addInterests) {
          if (!memory.interests.includes(item)) memory.interests.push(item);
        }
      }
      if (updates.removeInterests) {
        memory.interests = memory.interests.filter((i) => !updates.removeInterests!.includes(i));
      }
      if (updates.addPreferredAccounts) {
        for (const item of updates.addPreferredAccounts) {
          if (!memory.preferredAccounts.includes(item)) memory.preferredAccounts.push(item);
        }
      }
      if (updates.removePreferredAccounts) {
        memory.preferredAccounts = memory.preferredAccounts.filter(
          (a) => !updates.removePreferredAccounts!.includes(a)
        );
      }
      if (updates.summaryStyle) {
        memory.summaryStyle = updates.summaryStyle as UserMemory["summaryStyle"];
      }
      if (updates.addNotes) {
        memory.notes.push(...updates.addNotes);
      }

      saveMemory(memory);
      return {
        content: [{ type: "text" as const, text: JSON.stringify({ updated: true, memory }) }],
        details: {},
      };
    }

    return {
      content: [{ type: "text" as const, text: JSON.stringify({ error: "Use 'read' or 'update'." }) }],
      details: {},
    };
  },
};
