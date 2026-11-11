import { supabase } from '../lib/supabase';

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

export const storageService = {
  /**
   * Validate file mime-type and maximum size before attempting upload.
   */
  validateImageFile(file: File | Blob): void {
    if (file.type && !ALLOWED_IMAGE_TYPES.includes(file.type)) {
      throw new Error(
        `Invalid file format (${file.type}). Permitted formats: JPEG, PNG, WebP, SVG.`
      );
    }
    if (file.size > MAX_FILE_SIZE) {
      throw new Error(
        `File size (${(file.size / (1024 * 1024)).toFixed(2)} MB) exceeds maximum allowed 5 MB limit.`
      );
    }
  },

  /**
   * Extract internal storage path from a Supabase Storage public CDN URL.
   */
  extractPathFromUrl(bucket: 'restaurant-assets' | 'product-images', url: string): string | null {
    if (!url || typeof url !== 'string') return null;
    const marker = `/storage/v1/object/public/${bucket}/`;
    const idx = url.indexOf(marker);
    if (idx !== -1) {
      return url.substring(idx + marker.length);
    }
    return null;
  },

  /**
   * Upload an image to the 'product-images' bucket under the restaurant tenant directory.
   * Path convention: [restaurantId]/[timestamp]_[filename]
   */
  async uploadProductImage(
    restaurantId: string,
    file: File | Blob,
    filename: string
  ): Promise<string> {
    this.validateImageFile(file);

    const cleanFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
    const path = `${restaurantId}/${Date.now()}_${cleanFilename}`;

    const { error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(path, file, {
        cacheControl: '3600',
        upsert: true,
      });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from('product-images')
      .getPublicUrl(path);

    return data.publicUrl;
  },

  /**
   * Replace an existing product image by uploading the new image and purging the old asset.
   */
  async replaceProductImage(
    restaurantId: string,
    file: File | Blob,
    oldUrl: string | null | undefined,
    filename: string
  ): Promise<string> {
    const newUrl = await this.uploadProductImage(restaurantId, file, filename);

    if (oldUrl) {
      const oldPath = this.extractPathFromUrl('product-images', oldUrl);
      if (oldPath) {
        // Attempt cleanup in background, ignore not-found errors
        this.deleteFile('product-images', oldPath).catch((err) => {
          console.warn('Could not remove previous asset:', err);
        });
      }
    }

    return newUrl;
  },

  /**
   * Upload a branding asset (logo or banner) to 'restaurant-assets' bucket.
   * Path convention: [restaurantId]/[type]_[timestamp].[ext]
   */
  async uploadRestaurantAsset(
    restaurantId: string,
    file: File | Blob,
    type: 'logo' | 'banner',
    extension = 'png'
  ): Promise<string> {
    this.validateImageFile(file);

    const path = `${restaurantId}/${type}_${Date.now()}.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from('restaurant-assets')
      .upload(path, file, {
        cacheControl: '3600',
        upsert: true,
      });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from('restaurant-assets')
      .getPublicUrl(path);

    return data.publicUrl;
  },

  /**
   * Retrieve the public URL for any asset stored in CafeOS buckets.
   */
  getPublicUrl(
    bucket: 'restaurant-assets' | 'product-images',
    path: string
  ): string {
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  },

  /**
   * Delete an asset from storage.
   */
  async deleteFile(
    bucket: 'restaurant-assets' | 'product-images',
    path: string
  ): Promise<void> {
    const { error } = await supabase.storage.from(bucket).remove([path]);
    if (error) throw error;
  },
};

export default storageService;
