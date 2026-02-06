import { credentialsTool } from "./credentials.js";
import { searchTwitterTool } from "./search-twitter.js";
import { readTimelineTool } from "./read-timeline.js";
import { readTweetTool } from "./read-tweet.js";
import { getUserTweetsTool } from "./get-user-tweets.js";
import { getNewsTool } from "./get-news.js";
import { followUserTool } from "./follow-user.js";
import { userMemoryTool } from "./user-memory.js";

export const tools = [
  credentialsTool,
  searchTwitterTool,
  readTimelineTool,
  readTweetTool,
  getUserTweetsTool,
  getNewsTool,
  followUserTool,
  userMemoryTool,
];
