import { supabase, isSupabaseConfigured, formatSupabaseError } from './supabaseClient';

export const MEDIA_BUCKET = 'tour-media';
const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];

export interface UploadResult {
  url: string;
  storagePath: string;
  error?: string;
}

/**
 * Validates file size and MIME type before sending to Supabase Storage
 */
export function validateMediaFile(file: File, type: 'image' | 'video'): { valid: boolean; error?: string } {
  if (type === 'image') {
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      return {
        valid: false,
        error: `Unsupported image format (${file.type}). Please upload JPG, PNG, WebP, or AVIF.`,
      };
    }
    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      return {
        valid: false,
        error: `File size exceeds the 10MB limit (${(file.size / (1024 * 1024)).toFixed(1)}MB). Please compress before uploading.`,
      };
    }
  } else if (type === 'video') {
    if (!ALLOWED_VIDEO_TYPES.includes(file.type)) {
      return {
        valid: false,
        error: `Unsupported video format (${file.type}). Please upload MP4 or WebM.`,
      };
    }
    if (file.size > 50 * 1024 * 1024) {
      return {
        valid: false,
        error: `Video size exceeds the 50MB limit. For large videos, please link via YouTube or Vimeo URL.`,
      };
    }
  }

  return { valid: true };
}

/**
 * Uploads a tour media file to the 'tour-media' public bucket
 */
export async function uploadTourMedia(
  file: File,
  folder: string = 'tours'
): Promise<UploadResult> {
  const isVideo = file.type.startsWith('video/');
  const validation = validateMediaFile(file, isVideo ? 'video' : 'image');
  if (!validation.valid) {
    return { url: '', storagePath: '', error: validation.error };
  }

  // If Supabase is not configured yet (e.g. testing in sandbox without keys), generate an object URL
  if (!isSupabaseConfigured()) {
    const objectUrl = URL.createObjectURL(file);
    return {
      url: objectUrl,
      storagePath: `local/${Date.now()}-${file.name}`,
    };
  }

  try {
    const fileExt = file.name.split('.').pop() || 'jpg';
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const storagePath = `${folder}/${Date.now()}-${Math.random().toString(36).substring(2, 8)}-${cleanFileName}`;

    const { error: uploadError } = await supabase.storage
      .from(MEDIA_BUCKET)
      .upload(storagePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      return {
        url: '',
        storagePath: '',
        error: formatSupabaseError(uploadError),
      };
    }

    // Retrieve public URL from Supabase Storage
    const { data: publicData } = supabase.storage
      .from(MEDIA_BUCKET)
      .getPublicUrl(storagePath);

    return {
      url: publicData.publicUrl,
      storagePath,
    };
  } catch (err) {
    return {
      url: '',
      storagePath: '',
      error: formatSupabaseError(err),
    };
  }
}

/**
 * Removes an image or video from Supabase Storage
 */
export async function deleteTourMedia(storagePath: string): Promise<{ success: boolean; error?: string }> {
  if (!storagePath || storagePath.startsWith('local/')) {
    return { success: true };
  }

  if (!isSupabaseConfigured()) {
    return { success: true };
  }

  try {
    const { error } = await supabase.storage
      .from(MEDIA_BUCKET)
      .remove([storagePath]);

    if (error) {
      return { success: false, error: formatSupabaseError(error) };
    }
    return { success: true };
  } catch (err) {
    return { success: false, error: formatSupabaseError(err) };
  }
}

/**
 * Generates an optimized image URL using Supabase Storage image transformation when available
 */
export function getOptimizedImageUrl(
  originalUrl: string,
  options?: { width?: number; height?: number; quality?: number }
): string {
  if (!originalUrl) return '';

  // If it's an Unsplash URL, apply Unsplash params
  if (originalUrl.includes('images.unsplash.com')) {
    const url = new URL(originalUrl);
    if (options?.width) url.searchParams.set('w', options.width.toString());
    if (options?.height) url.searchParams.set('h', options.height.toString());
    if (options?.quality) url.searchParams.set('q', options.quality.toString());
    return url.toString();
  }

  // If it's a Supabase Storage URL, we can leverage render/image transformation if Pro/Enabled
  if (originalUrl.includes('/storage/v1/object/public/')) {
    if (options?.width) {
      return `${originalUrl}?width=${options.width}&quality=${options.quality || 80}`;
    }
  }

  return originalUrl;
}

export interface StorageFileItem {
  id: string;
  name: string;
  url: string;
  storagePath: string;
  sizeBytes: number;
  createdAt: string;
  metadata?: Record<string, unknown>;
}

/**
 * Lists uploaded media files stored in the 'tour-media' bucket
 */
export async function listStorageMedia(folder: string = 'tours'): Promise<StorageFileItem[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }

  try {
    const { data, error } = await supabase.storage
      .from(MEDIA_BUCKET)
      .list(folder, { limit: 100, sortBy: { column: 'created_at', order: 'desc' } });

    if (error || !data) {
      return [];
    }

    return data
      .filter((item) => item.name !== '.emptyFolderPlaceholder')
      .map((item) => {
        const storagePath = `${folder}/${item.name}`;
        const { data: publicData } = supabase.storage.from(MEDIA_BUCKET).getPublicUrl(storagePath);
        return {
          id: item.id || storagePath,
          name: item.name,
          url: publicData.publicUrl,
          storagePath,
          sizeBytes: (item.metadata as any)?.size || 0,
          createdAt: item.created_at || new Date().toISOString(),
          metadata: item.metadata as Record<string, unknown> | undefined,
        };
      });
  } catch (err) {
    console.warn('Failed to list storage media:', err);
    return [];
  }
}

