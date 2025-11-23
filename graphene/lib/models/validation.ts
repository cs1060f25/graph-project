import { ApiResponse } from './types';

export function createResponse<T>(success: boolean, data: T | null = null, error: string | null = null): ApiResponse<T> {
  return { success, data: data || undefined, error: error || undefined };
}

export function validateUserId(uid: string) {
  if (!uid || typeof uid !== 'string' || uid.trim().length === 0) {
    return { isValid: false, error: "User ID is required and must be a non-empty string" };
  }
  return { isValid: true, error: null };
}

export function validatePaperData(paperData: any) {
  if (!paperData || typeof paperData !== 'object') {
    return { isValid: false, error: "Paper data is required and must be an object" };
  }

  const requiredFields = ['title', 'authors', 'link'];
  const missingFields = requiredFields.filter(field => !paperData[field]);
  
  if (missingFields.length > 0) {
    return { isValid: false, error: `Missing required fields: ${missingFields.join(', ')}` };
  }

  if (paperData.starred !== undefined && typeof paperData.starred !== 'boolean') {
    return { isValid: false, error: "starred must be a boolean" };
  }

  if (paperData.folderId !== undefined && paperData.folderId !== null && typeof paperData.folderId !== 'string') {
    return { isValid: false, error: "folderId must be a string or null" };
  }

  if (paperData.abstract !== undefined && typeof paperData.abstract !== 'string') {
    return { isValid: false, error: "abstract must be a string" };
  }

  if (paperData.publishedDate !== undefined && paperData.publishedDate !== null && typeof paperData.publishedDate !== 'string' && typeof paperData.publishedDate !== 'number') {
    return { isValid: false, error: "publishedDate must be a string or number" };
  }

  return { isValid: true, error: null };
}

export function validatePaperUpdate(updateData: any) {
  if (!updateData || typeof updateData !== 'object') {
    return { isValid: false, error: "Update data is required and must be an object" };
  }

  const allowedFields = ['title', 'authors', 'link', 'abstract', 'publishedDate', 'starred', 'folderId'];
  const providedFields = Object.keys(updateData);
  const hasValidField = providedFields.some(field => allowedFields.includes(field));

  if (!hasValidField) {
    return { isValid: false, error: `At least one of the following fields must be provided: ${allowedFields.join(', ')}` };
  }

  if (updateData.title !== undefined && (!updateData.title || typeof updateData.title !== 'string')) {
    return { isValid: false, error: "title must be a non-empty string" };
  }

  if (updateData.authors !== undefined && (!Array.isArray(updateData.authors) || updateData.authors.length === 0)) {
    return { isValid: false, error: "authors must be a non-empty array" };
  }

  if (updateData.link !== undefined && (!updateData.link || typeof updateData.link !== 'string')) {
    return { isValid: false, error: "link must be a non-empty string" };
  }

  if (updateData.starred !== undefined && typeof updateData.starred !== 'boolean') {
    return { isValid: false, error: "starred must be a boolean" };
  }

  if (updateData.folderId !== undefined && updateData.folderId !== null && typeof updateData.folderId !== 'string') {
    return { isValid: false, error: "folderId must be a string or null" };
  }

  if (updateData.abstract !== undefined && typeof updateData.abstract !== 'string') {
    return { isValid: false, error: "abstract must be a string" };
  }

  if (updateData.publishedDate !== undefined && updateData.publishedDate !== null && typeof updateData.publishedDate !== 'string' && typeof updateData.publishedDate !== 'number') {
    return { isValid: false, error: "publishedDate must be a string or number" };
  }

  return { isValid: true, error: null };
}

export function validateFolderName(folderName: string) {
  if (!folderName || typeof folderName !== 'string' || folderName.trim().length === 0) {
    return { isValid: false, error: "Folder name is required and must be a non-empty string" };
  }
  return { isValid: true, error: null };
}

