import { supabase } from '@/lib/supabase';
import imageCompression from 'browser-image-compression';

export const storageService = {
  async optimizeImage(file: File): Promise<File> {
    const options = {
      maxSizeMB: 0.8,
      maxWidthOrHeight: 1920,
      useWebWorker: true,
      fileType: 'image/webp'
    };
    try {
      const compressedBlob = await imageCompression(file, options);
      return new File([compressedBlob], file.name.replace(/\.[^/.]+$/, "") + ".webp", {
        type: 'image/webp',
      });
    } catch (error) {
      console.error('Image optimization error:', error);
      return file; // Fallback to original file
    }
  },

  async uploadFile(file: File, bucket: string, path: string): Promise<string> {
    try {
      // Auto-optimize if it's an image
      let fileToUpload = file;
      if (file.type.startsWith('image/')) {
        fileToUpload = await this.optimizeImage(file);
      }

      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(path, fileToUpload, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        // Handle specific bucket-not-found error
        if (error.message?.toLowerCase().includes('bucket not found')) {
          const errMsg = `Storage bucket "${bucket}" not found. ACTION REQUIRED: Please log in to your Supabase Dashboard and create a "Public" bucket named "${bucket}" in the Storage section.`;
          console.error(errMsg);
          throw new Error(errMsg);
        }
        throw error;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(data.path);

      return publicUrl;
    } catch (error) {
      console.error('Storage upload error:', error);
      throw error;
    }
  },

  async deleteFile(bucket: string, path: string): Promise<void> {
    try {
      const { error } = await supabase.storage
        .from(bucket)
        .remove([path]);

      if (error) throw error;
    } catch (error) {
      console.error('Storage delete error:', error);
      throw error;
    }
  }
};
