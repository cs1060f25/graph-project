// Schema definitions and validators for the Firebase-backed cache DB.

const isNonEmptyString = (value) => typeof value === "string" && value.trim().length > 0;

const isIsoDateString = (value) => {
  if (!isNonEmptyString(value)) return false;
  const date = new Date(value);
  return !Number.isNaN(date.getTime());
};

export const recentPaperSchema = {
  paperId: { type: "string", required: true },
  title: { type: "string", required: true },
  summary: { type: "string", required: false },
  authors: { type: "array", required: true },
  publishedAt: { type: "date", required: true },
  source: { type: "string", required: true },
  userActions: { type: "object", required: false }
};

export const recentQuerySchema = {
  query: { type: "string", required: true },
  type: { type: "string", required: true },
  performedAt: { type: "date", required: true },
  filters: { type: "object", required: false },
  resultsCount: { type: "number", required: false }
};

const schemaValidators = {
  string: isNonEmptyString,
  date: isIsoDateString,
  array: (value) => Array.isArray(value),
  object: (value) => value !== null && typeof value === "object" && !Array.isArray(value),
  number: (value) => typeof value === "number" && Number.isFinite(value)
};

function validateAgainstSchema(data, schema, entityName) {
  if (!schema || typeof schema !== "object") {
    throw new Error(`Unknown schema for ${entityName}`);
  }

  const errors = [];

  Object.entries(schema).forEach(([field, definition]) => {
    const value = data[field];
    const { required, type } = definition;

    if (required && (value === undefined || value === null || value === "")) {
      errors.push(`${field} is required`);
      return;
    }

    if (value !== undefined && value !== null) {
      const validator = schemaValidators[type];
      if (!validator) {
        errors.push(`${field} has unsupported type ${type}`);
      } else if (!validator(value)) {
        errors.push(`${field} must be a valid ${type}`);
      }
    }
  });

  if (errors.length) {
    const error = new Error(`${entityName} validation failed: ${errors.join(", ")}`);
    error.details = errors;
    throw error;
  }

  return true;
}

export function validateRecentPaper(data) {
  return validateAgainstSchema(data, recentPaperSchema, "recentPaper");
}

export function validateRecentQuery(data) {
  return validateAgainstSchema(data, recentQuerySchema, "recentQuery");
}

export function sanitizeRecentPaper(data) {
  return extractFields(data, recentPaperSchema);
}

export function sanitizeRecentQuery(data) {
  return extractFields(data, recentQuerySchema);
}

function extractFields(data, schema) {
  return Object.keys(schema).reduce((acc, field) => {
    if (data[field] !== undefined) {
      acc[field] = data[field];
    }
    return acc;
  }, {});
}

