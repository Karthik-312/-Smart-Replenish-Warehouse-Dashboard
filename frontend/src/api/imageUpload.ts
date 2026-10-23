const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME as string | undefined;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET as string | undefined;

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

/** False when Cloudinary is unconfigured, in which case the UI offers a URL field instead. */
export function isUploadConfigured(): boolean {
  return Boolean(CLOUD_NAME && UPLOAD_PRESET);
}

/**
 * Uploads straight from the browser to Cloudinary using an unsigned preset, so no
 * image bytes pass through our backend. Returns the hosted URL to store on the item.
 */
export async function uploadImage(file: File): Promise<string> {
  if (!isUploadConfigured()) {
    throw new Error('Image upload is not configured.');
  }
  if (!file.type.startsWith('image/')) {
    throw new Error('That file is not an image.');
  }
  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error('Image is larger than 5 MB.');
  }

  const body = new FormData();
  body.append('file', file);
  body.append('upload_preset', UPLOAD_PRESET!);

  const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
    method: 'POST',
    body,
  });

  if (!response.ok) {
    throw new Error('Upload failed. Check your Cloudinary upload preset is unsigned.');
  }

  const data = await response.json();
  if (!data.secure_url) throw new Error('Upload succeeded but returned no URL.');
  return data.secure_url as string;
}
