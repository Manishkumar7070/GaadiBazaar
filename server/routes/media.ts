import express from 'express';
import multer from 'multer';
import rateLimit from 'express-rate-limit';
import { imageProcessor } from '../../src/services/image.service.server';
import { getSupabaseClient } from '../clients';
import { serverLogger } from '../logger';
import { rateLimitHandler } from '../middleware/rate-limit-monitor';

const router = express.Router();
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

// Anti-abuse: Limit file uploads to prevent storage exhaustion or DoS attacks
const uploadLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 15, // Max 15 file upload requests per IP per 10 minutes
  message: { error: "Too many upload requests. Please wait before attempting to upload more files." },
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
});

router.get('/debug-bucket', async (req, res) => {
  try {
    const bucket = (req.query.bucket as string) || 'vehicles';
    const supabase = getSupabaseClient();
    
    serverLogger.info('Debugging/Diagnosing bucket storage', { bucket });

    const results: any = {
      bucket,
      bucketsList: null,
      bucketExists: false,
      bucketInfo: null,
      error: null,
      permissionsTest: null
    };

    // 1. List buckets to see what exists and verify key permissions
    try {
      const { data: buckets, error: listError } = await supabase.storage.listBuckets();
      if (listError) {
        results.error = `Error listing buckets: ${listError.message}`;
      } else {
        results.bucketsList = buckets;
        results.bucketExists = buckets ? buckets.some((b: any) => b.name === bucket) : false;
        if (results.bucketExists) {
          results.bucketInfo = buckets.find((b: any) => b.name === bucket);
        }
      }
    } catch (listErr: any) {
      results.error = `Exception listing buckets: ${listErr.message}`;
    }

    // 2. Query some files inside the bucket to check read permission
    if (results.bucketExists) {
      try {
        const { data: files, error: listFilesError } = await supabase.storage
          .from(bucket)
          .list('', { limit: 5 });
        
        if (listFilesError) {
          results.permissionsTest = {
            canList: false,
            error: listFilesError.message
          };
        } else {
          results.permissionsTest = {
            canList: true,
            filesCount: files ? files.length : 0,
            sampleFiles: files ? files.slice(0, 3).map((f: any) => f.name) : []
          };
        }
      } catch (listFileErr: any) {
        results.permissionsTest = {
          canList: false,
          error: `Exception: ${listFileErr.message}`
        };
      }
    }

    res.json(results);
  } catch (error: any) {
    serverLogger.error('Debug bucket route error', { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

router.post('/upload', uploadLimiter, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { bucket, path, userId } = req.body;
    if (!bucket || !path || !userId) {
      return res.status(400).json({ error: 'Missing required parameters: bucket, path, or userId' });
    }

    serverLogger.info('Processing upload request', { userId, bucket, path, mimeType: req.file.mimetype });

    const supabase = getSupabaseClient();

    // Auto-create bucket if missing
    try {
      const { data: buckets, error: listError } = await supabase.storage.listBuckets();
      if (!listError && buckets) {
        const bucketExists = buckets.some((b: any) => b.name === bucket);
        if (!bucketExists) {
          serverLogger.info(`Storage bucket "${bucket}" does not exist. Creating public bucket...`);
          const { error: createError } = await supabase.storage.createBucket(bucket, {
            public: true,
            fileSizeLimit: 104857600 // 100MB
          });
          if (createError) {
            serverLogger.warn(`Failed to create bucket "${bucket}": ${createError.message}`);
          } else {
            serverLogger.info(`Successfully created public bucket: "${bucket}"`);
          }
        }
      }
    } catch (bucketCheckErr: any) {
      serverLogger.warn('Error checking/creating bucket, continuing with upload anyway', { error: bucketCheckErr.message });
    }

    let uploadBuffer = req.file.buffer;
    let uploadContentType = req.file.mimetype;
    let finalPath = path;

    // Analyze path: ensure folder prefix if path doesn't already contain userId
    let cleanPath = path;
    if (!path.startsWith(`${userId}/`)) {
      cleanPath = `${userId}/${path}`;
    }

    // Optimize image if it is an image
    if (req.file.mimetype.startsWith('image/')) {
      try {
        const { data: optimizedBuffer } = await imageProcessor.optimize(req.file.buffer);
        uploadBuffer = optimizedBuffer;
        uploadContentType = 'image/webp';
        
        // Rewrite path to use .webp extension
        const fileName = cleanPath.split('/').pop() || 'image.webp';
        const rawName = fileName.replace(/\.[^/.]+$/, "");
        const dirPath = cleanPath.substring(0, cleanPath.lastIndexOf('/'));
        finalPath = dirPath ? `${dirPath}/${rawName}.webp` : `${rawName}.webp`;
      } catch (err: any) {
        serverLogger.warn('Image optimization failed, uploading raw', { error: err.message });
        finalPath = cleanPath;
      }
    } else {
      finalPath = cleanPath;
    }

    serverLogger.info('Uploading to Supabase storage', { bucket, finalPath });

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(finalPath, uploadBuffer, {
        contentType: uploadContentType,
        cacheControl: '3600',
        upsert: true // allow overwriting to prevent duplicate errors
      });

    if (error) {
      serverLogger.error('Supabase storage upload error', { error });
      return res.status(500).json({ error: error.message });
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path);

    res.json({ url: publicUrl });
  } catch (error: any) {
    serverLogger.error('Upload route error', { error: error.message });
    res.status(500).json({ error: 'Failed to process and upload file: ' + error.message });
  }
});

export default router;
