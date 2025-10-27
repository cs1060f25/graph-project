import fs from "fs";
import path from "path";
import admin from "firebase-admin";

import {
  sanitizeRecentPaper,
  sanitizeRecentQuery,
  validateRecentPaper,
  validateRecentQuery
} from "./schemas.js";

function ensureServiceAccount(serviceAccountPath) {
  const resolvedPath = path.resolve(serviceAccountPath);
  if (!fs.existsSync(resolvedPath)) {
    throw new Error(`Firebase service account file not found at ${resolvedPath}`);
  }
  return resolvedPath;
}

let firebaseInitialized = false;

export default class FirebaseCache {
  constructor({ serviceAccountPath } = {}) {
    if (!serviceAccountPath) {
      throw new Error("serviceAccountPath is required for FirebaseCache");
    }

    const resolvedPath = ensureServiceAccount(serviceAccountPath);

    if (!firebaseInitialized) {
      const serviceAccount = JSON.parse(fs.readFileSync(resolvedPath, "utf-8"));

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });

      firebaseInitialized = true;
    }

    this.db = admin.firestore();
  }

  getUserCacheRef(userId) {
    if (!userId) {
      throw new Error("userId is required for cache operations");
    }
    return this.db.collection("user-cache").doc(userId);
  }

  async addRecentPaper(userId, paperData) {
    validateRecentPaper(paperData);
    const sanitized = sanitizeRecentPaper(paperData);

    const userRef = this.getUserCacheRef(userId);
    await userRef.collection("recentPapers").doc(sanitized.paperId).set({
      ...sanitized,
      updatedAt: new Date().toISOString()
    });
  }

  async getRecentPapers(userId, { limit = 10 } = {}) {
    const snapshot = await this.getUserCacheRef(userId)
      .collection("recentPapers")
      .orderBy("updatedAt", "desc")
      .limit(limit)
      .get();

    return snapshot.docs.map((doc) => doc.data());
  }

  async addRecentQuery(userId, queryData) {
    validateRecentQuery(queryData);
    const sanitized = sanitizeRecentQuery(queryData);

    const docId = `${sanitized.type}-${sanitized.query}`;

    const userRef = this.getUserCacheRef(userId);
    await userRef.collection("recentQueries").doc(docId).set({
      ...sanitized,
      updatedAt: new Date().toISOString()
    });
  }

  async getRecentQueries(userId, { limit = 10 } = {}) {
    const snapshot = await this.getUserCacheRef(userId)
      .collection("recentQueries")
      .orderBy("updatedAt", "desc")
      .limit(limit)
      .get();

    return snapshot.docs.map((doc) => doc.data());
  }
}

