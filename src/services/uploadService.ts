// ========== src/services/uploadService.ts ==========
import { auth } from '../config/firebase';

// ============================================================
// CONSTANTES
// ============================================================
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// ============================================================
// UPLOAD IMAGE UNIQUE
// ============================================================
export const uploadImage = async (file: File, folder: string = 'profiles'): Promise<string> => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('Non authentifié');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('userId', user.uid);
    formData.append('folder', folder);

    console.log(`📤 Upload vers: ${API_URL}/api/upload`);
    console.log(`📁 Dossier: ${folder}`);

    const response = await fetch(`${API_URL}/api/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erreur lors de l\'upload');
    }

    const result = await response.json();
    console.log('✅ Upload réussi:', result.data.url);
    return result.data.url;
  } catch (error) {
    console.error('❌ Erreur upload:', error);
    throw error;
  }
};

// ============================================================
// UPLOAD MULTIPLE IMAGES
// ============================================================
export const uploadMultipleImages = async (files: File[], folder: string = 'posts'): Promise<string[]> => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('Non authentifié');

    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });
    formData.append('userId', user.uid);
    formData.append('folder', folder);

    console.log(`📤 Upload multiple vers: ${API_URL}/api/upload/multiple`);
    console.log(`📁 Dossier: ${folder}`);
    console.log(`📸 Nombre de fichiers: ${files.length}`);

    const response = await fetch(`${API_URL}/api/upload/multiple`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erreur lors de l\'upload');
    }

    const result = await response.json();
    const urls = result.data.map((item: any) => item.url);
    console.log(`✅ Upload multiple réussi: ${urls.length} fichiers`);
    return urls;
  } catch (error) {
    console.error('❌ Erreur upload multiple:', error);
    throw error;
  }
};

// ============================================================
// UPLOAD PHOTO DE PROFIL
// ============================================================
export const uploadProfilePhoto = async (file: File): Promise<string> => {
  return uploadImage(file, 'profiles');
};

// ============================================================
// UPLOAD PHOTO DE COUVERTURE
// ============================================================
export const uploadCoverPhoto = async (file: File): Promise<string> => {
  return uploadImage(file, 'covers');
};

// ============================================================
// UPLOAD IMAGES DE POST
// ============================================================
export const uploadPostImages = async (files: File[]): Promise<string[]> => {
  return uploadMultipleImages(files, 'posts');
};

// ============================================================
// LISTER LES IMAGES D'UN UTILISATEUR
// ============================================================
export const listUserImages = async (folder: string = 'profiles'): Promise<any[]> => {
  try {
    const user = auth.currentUser;
    if (!user) return [];

    const response = await fetch(`${API_URL}/api/uploads/${user.uid}?folder=${folder}`);
    const result = await response.json();
    return result.data || [];
  } catch (error) {
    console.error('❌ Erreur liste:', error);
    return [];
  }
};

// ============================================================
// SUPPRIMER UNE IMAGE
// ============================================================
export const deleteImage = async (filename: string, folder: string = 'profiles'): Promise<void> => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('Non authentifié');

    const response = await fetch(
      `${API_URL}/api/upload/${filename}?userId=${user.uid}&folder=${folder}`,
      { method: 'DELETE' }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erreur lors de la suppression');
    }

    console.log('✅ Image supprimée:', filename);
  } catch (error) {
    console.error('❌ Erreur suppression:', error);
    throw error;
  }
};

export default {
  uploadImage,
  uploadMultipleImages,
  uploadProfilePhoto,
  uploadCoverPhoto,
  uploadPostImages,
  listUserImages,
  deleteImage,
};