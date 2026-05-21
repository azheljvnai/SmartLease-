/** Spark plan: no Firebase Storage. Optional small images stored as data URLs in Firestore (max ~500KB). */

const MAX_BYTES = 500_000;

export function isFileUploadEnabled(): boolean {
  return import.meta.env.VITE_ENABLE_FILE_UPLOAD === 'true';
}

export async function fileToDataUrl(file: File): Promise<string> {
  if (file.size > MAX_BYTES) {
    throw new Error('Image must be under 500KB. Upgrade to Blaze for Firebase Storage uploads.');
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Could not read file'));
    reader.readAsDataURL(file);
  });
}
