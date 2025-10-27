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

function wrapFirebaseError(context, error) {
  if (!(error instanceof Error)) {
    return new Error(`${context} failed`);
  }

  const cause = error.cause instanceof Error ? error.cause : error;
  const wrapped = new Error(`${context} failed: ${error.message}`);
  wrapped.cause = cause;
  if (error.code || (cause && cause.code)) {
    wrapped.code = error.code || cause.code;
  }
  return wrapped;
}

export default function createCacheInterface({ serviceAccountPath, cacheClient } = {}) {
  const client = cacheClient || new FirebaseCache({ serviceAccountPath });

  async function addRecentPaper(userId, paper) {
    requireUserId(userId, "addRecentPaper");
    if (!paper || typeof paper !== "object") {
      throw new Error("addRecentPaper requires a paper object");
    }
    try {
      return await client.addRecentPaper(userId, paper);
    } catch (error) {
      throw wrapFirebaseError("addRecentPaper", error);
    }
  }

  async function getRecentPapers(userId, options) {
    requireUserId(userId, "getRecentPapers");
    try {
      return await client.getRecentPapers(userId, options);
    } catch (error) {
      throw wrapFirebaseError("getRecentPapers", error);
    }
  }

  async function addRecentQuery(userId, query) {
    requireUserId(userId, "addRecentQuery");
    if (!query || typeof query !== "object") {
      throw new Error("addRecentQuery requires a query object");
    }
    try {
      return await client.addRecentQuery(userId, query);
    } catch (error) {
      throw wrapFirebaseError("addRecentQuery", error);
    }
  }

  async function getRecentQueries(userId, options) {
    requireUserId(userId, "getRecentQueries");
    try {
      return await client.getRecentQueries(userId, options);
    } catch (error) {
      throw wrapFirebaseError("getRecentQueries", error);
    }
  }

  async function paperSavedListener(payload) {
    requirePayload(payload, [
      { key: "userId", message: "paperSavedListener requires userId and paper" },
      { key: "paper", message: "paperSavedListener requires userId and paper" }
    ], "paperSavedListener");

    try {
      return await addRecentPaper(payload.userId, payload.paper);
    } catch (error) {
      throw wrapFirebaseError("paperSavedListener", error);
    }
  }

  async function queryListener(payload) {
    requirePayload(payload, [
      { key: "userId", message: "queryListener requires userId and query" },
      { key: "query", message: "queryListener requires userId and query" }
    ], "queryListener");

    try {
      return await addRecentQuery(payload.userId, payload.query);
    } catch (error) {
      throw wrapFirebaseError("queryListener", error);
    }
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
