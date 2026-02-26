// src/api/cloudinaryService.js
import { Platform } from 'react-native';

const CLOUDINARY_URL = 'https://api.cloudinary.com/v1_1/dlaij1gcp/image/upload';
const UPLOAD_PRESET = 'rn_unsigned';
const CLOUD_NAME = 'dlaij1gcp';

/**
 * Uploads an image file to Cloudinary using the native fetch API.
 * @param {object} image - The image object from the image picker (e.g., { uri, type, fileName }).
 * @returns {Promise<string>} A promise that resolves with the secure URL of the uploaded image.
 * @throws {Error} If the upload fails.
 */
export const uploadToCloudinary = async (image) => {
  console.log('📤 [Cloudinary Service] Attempting to upload...');
  if (!image || !image.uri) {
    throw new Error('Invalid image file provided for upload.');
  }

  // Handle iOS file URI and ensure correct file type/name
  const uri = image.uri;
  const type = image.type || `image/${uri.split('.').pop()}`;
  const name = image.fileName || `photo_${Date.now()}.${uri.split('.').pop()}`;

  const formData = new FormData();
  formData.append('file', {
    uri: Platform.OS === 'ios' ? uri.replace('file://', '') : uri,
    type: type,
    name: name,
  });
  formData.append('upload_preset', UPLOAD_PRESET);
  formData.append('cloud_name', CLOUD_NAME);

  try {
    const response = await fetch(CLOUDINARY_URL, {
      method: 'POST',
      body: formData, // 'Content-Type' header is automatically set by fetch for FormData
    });

    const data = await response.json();

    if (!response.ok) {
      const errorMessage = data.error?.message || `Cloudinary returned a non-200 status: ${response.status}`;
      console.error('❌ [Cloudinary Service] Upload failed:', errorMessage);
      throw new Error(errorMessage);
    }

    console.log('✅ [Cloudinary Service] Upload successful:', data.secure_url);
    return data.secure_url;
  } catch (error) {
    console.error('❌ [Cloudinary Service] A critical error occurred during upload:', error);
    throw error;
  }
};