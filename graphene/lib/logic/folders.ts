import { verifyFirebaseToken } from '../auth/verifyToken';
import { getUserFolders, addUserFolder, updateUserFolder, deleteUserFolder } from '../services/db';
import { Folder, ApiResponse } from '../models/types';

export async function getFolders(token: string): Promise<ApiResponse<Folder[]>> {
  const decodedToken = await verifyFirebaseToken(token);
  return await getUserFolders(decodedToken.uid);
}

export async function createFolder(token: string, folderName: string): Promise<ApiResponse<Folder>> {
  const decodedToken = await verifyFirebaseToken(token);
  return await addUserFolder(decodedToken.uid, folderName);
}

export async function updateFolder(token: string, folderId: string, newName: string): Promise<ApiResponse<Folder>> {
  const decodedToken = await verifyFirebaseToken(token);
  return await updateUserFolder(decodedToken.uid, folderId, newName);
}

export async function removeFolder(token: string, folderId: string): Promise<ApiResponse<void>> {
  const decodedToken = await verifyFirebaseToken(token);
  return await deleteUserFolder(decodedToken.uid, folderId);
}

