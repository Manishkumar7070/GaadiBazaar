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
    const backendLog: string[] = [];
    try {
      // First, attempt to upload via the server-side proxy which uses high-privilege Service Role keys
      // and auto-creates buckets as needed, supporting both images (with server WebP optimization) and videos.
      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('bucket', bucket);
        formData.append('path', path);
        
        let uid = 'anonymous';
        // Get user ID from Supabase session directly
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          uid = session.user.id;
        }
        formData.append('userId', uid);

        const response = await fetch('/api/media/upload', {
          method: 'POST',
          body: formData,
        });

        if (response.ok) {
          const result = await response.json();
          return result.url;
        } else {
          const errMsg = await response.text();
          backendLog.push(`Backend upload returned HTTP status ${response.status}: ${errMsg || 'No response body'}`);
          console.error('[StorageService] Server-side upload failed:', errMsg);
        }
      } catch (backendErr: any) {
        backendLog.push(`Backend upload threw exception: ${backendErr.message || backendErr}`);
        console.error('[StorageService] Server-side upload exception:', backendErr);
      }

      // Fallback/Direct upload logic
      console.warn('[StorageService] Falling back to direct client-side Supabase upload...');
      let fileToUpload = file;
      if (file.type.startsWith('image/')) {
        fileToUpload = await this.optimizeImage(file);
      }

      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(path, fileToUpload, {
          cacheControl: '3600',
          upsert: true
        });

      if (error) {
        console.error('[StorageService] Direct client-side error:', error);
        // Handle specific bucket-not-found error
        if (error.message?.toLowerCase().includes('bucket not found')) {
          const errMsg = `Storage bucket "${bucket}" not found. ACTION REQUIRED: Please log in to your Supabase Dashboard and create a "Public" bucket named "${bucket}" in the Storage section. (Client upload fallback failed too: ${error.message})`;
          console.error(errMsg);
          throw new Error(errMsg);
        } else if (error.message?.toLowerCase().includes('row-level security') || error.message?.toLowerCase().includes('policy')) {
          const errMsg = `Row-Level Security (RLS) policy violation on bucket "${bucket}". Please check your Supabase Storage Policies. (Client upload fallback failed too: ${error.message})`;
          console.error(errMsg);
          throw new Error(errMsg);
        }
        throw new Error(`Direct upload failed: ${error.message} (Backend log: ${backendLog.join(' | ')})`);
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(data.path);

      return publicUrl;
    } catch (error: any) {
      console.error('[StorageService] Ultimate upload failure detail:', {
        file: { name: file.name, size: file.size, type: file.type },
        bucket,
        path,
        errorMsg: error.message || error,
        backendLog
      });
      throw new Error(`Upload completely failed for ${file.name}. Ensure storage is configured. Error: ${error.message || error}`);
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
