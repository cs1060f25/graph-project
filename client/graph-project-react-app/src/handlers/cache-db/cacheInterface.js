import FirebaseCache from "./FirebaseCache.js";

function requireUserId(userId, context) {
  if (!userId || typeof userId !== "string") {
    throw new Error(`${context} requires userId and it must be a non-empty string`);
  }
}

function requirePayload(payload, fields, context) {
  if (!payload || typeof payload !== "object") {
    throw new Error(`${context} requires a payload object`);
  }
  fields.forEach(({ key, message }) => {
    if (payload[key] === undefined || payload[key] === null) {
      throw new Error(message);
    }
  });
}

export default function createCacheInterface({ serviceAccountPath, cacheClient } = {}) {
  const client = cacheClient || new FirebaseCache({ serviceAccountPath });

  async function addRecentPaper(userId, paper) {
    requireUserId(userId, "addRecentPaper");
    if (!paper || typeof paper !== "object") {
      throw new Error("addRecentPaper requires a paper object");
    }
    return client.addRecentPaper(userId, paper);
  }

  async function getRecentPapers(userId, options) {
    requireUserId(userId, "getRecentPapers");
    return client.getRecentPapers(userId, options);
  }

  async function addRecentQuery(userId, query) {
    requireUserId(userId, "addRecentQuery");
    if (!query || typeof query !== "object") {
      throw new Error("addRecentQuery requires a query object");
    }
    return client.addRecentQuery(userId, query);
  }

  async function getRecentQueries(userId, options) {
    requireUserId(userId, "getRecentQueries");
    return client.getRecentQueries(userId, options);
  }

  async function paperSavedListener(payload) {
    requirePayload(payload, [
      { key: "userId", message: "paperSavedListener requires userId and paper" },
      { key: "paper", message: "paperSavedListener requires userId and paper" }
    ], "paperSavedListener");

    return addRecentPaper(payload.userId, payload.paper);
  }

  async function queryListener(payload) {
    requirePayload(payload, [
      { key: "userId", message: "queryListener requires userId and query" },
      { key: "query", message: "queryListener requires userId and query" }
    ], "queryListener");

    return addRecentQuery(payload.userId, payload.query);
  }

  return {
    addRecentPaper,
    getRecentPapers,
    addRecentQuery,
    getRecentQueries,
    paperSavedListener,
    queryListener
  };
}
