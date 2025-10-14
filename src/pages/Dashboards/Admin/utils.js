// src/pages/Admin/utils.js

/**
 * Converts a File object to a Base64 string for storage in Firestore.
 * Enforces a size limit of 800KB.
 * @param {File} file - The file to convert.
 * @returns {Promise<string>} - The Base64 string of the file.
 */
export const fileToBase64 = (file) =>
  new Promise((resolve, reject) => {
    if (!file) return resolve("");
    
    // File size check (800KB limit)
    const MAX_SIZE = 800000;
    if (file.size > MAX_SIZE) {
      reject(new Error("File size exceeds 800KB limit for Firestore"));
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });