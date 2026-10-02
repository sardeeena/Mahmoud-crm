import React, { useState, useEffect, useRef } from 'react';
import {
  Image as ImageIcon,
  Upload,
  Trash2,
  Copy,
  Check,
  ExternalLink,
  Film,
  Search,
  Filter,
  RefreshCw,
  AlertCircle,
  HardDrive,
  FileCheck,
  AlertTriangle,
} from 'lucide-react';
import {
  listStorageMedia,
  uploadTourMedia,
  deleteTourMedia,
  StorageFileItem,
  MEDIA_BUCKET
} from '../../services/storageService';
import { isSupabaseConfigured } from '../../services/supabaseClient';
import { useToast } from '../../contexts/ToastContext';

export const AdminMediaLibrary: React.FC = () => {
  const { showToast } = useToast();
  const [mediaItems, setMediaItems] = useState<StorageFileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'image' | 'video'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<StorageFileItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchMedia = async () => {
    setLoading(true);
    setUploadError(null);
    try {
      const items = await listStorageMedia('tours');
      setMediaItems(items);
    } catch (err: any) {
      console.warn('Failed to load media items:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedia();
  }, []);

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    setUploadError(null);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const res = await uploadTourMedia(file, 'tours');
        if (res.error) {
          setUploadError(res.error);
          break;
        }
      }
      await fetchMedia();
    } catch (err: any) {
      setUploadError(err?.message || 'Failed to upload file');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDelete = (item: StorageFileItem) => {
    setItemToDelete(item);
  };

  const confirmDeleteItem = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);
    const res = await deleteTourMedia(itemToDelete.storagePath);
    if (res.success) {
      setMediaItems((prev) => prev.filter((i) => i.id !== itemToDelete.id));
      showToast(`Media "${itemToDelete.name}" deleted successfully.`, 'success');
    } else {
      showToast(`Failed to delete: ${res.error || 'Unknown storage error'}`, 'error');
    }
    setItemToDelete(null);
    setIsDeleting(false);
  };

  const copyUrl = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredItems = mediaItems.filter((item) => {
    const isVideo = item.name.endsWith('.mp4') || item.name.endsWith('.webm') || item.name.endsWith('.mov');
    if (filterType === 'image' && isVideo) return false;
    if (filterType === 'video' && !isVideo) return false;
    if (searchQuery.trim()) {
      return item.name.toLowerCase().includes(searchQuery.toLowerCase());
    }
    return true;
  });

  const formatBytes = (bytes: number): string => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-white tracking-tight">
            Supabase Media Library
          </h1>
          <p className="text-xs text-stone-400 mt-1">
            Store, browse, and manage high-resolution tour photos, video clips, and promotional banners in the <code className="text-[#2dd4bf] font-mono">{MEDIA_BUCKET}</code> bucket.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={fetchMedia}
            disabled={loading}
            className="p-2 bg-stone-900 border border-stone-800 text-stone-300 hover:text-white rounded text-xs transition-colors cursor-pointer"
            title="Refresh library"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="inline-flex items-center space-x-1.5 px-4 py-2 bg-[#0A6C74] hover:bg-[#08565C] text-white rounded text-xs font-semibold shadow transition-colors cursor-pointer disabled:opacity-50"
          >
            <Upload className="w-4 h-4" />
            <span>{uploading ? 'Uploading...' : 'Upload Media'}</span>
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => handleFileUpload(e.target.files)}
            multiple
            accept="image/*,video/mp4,video/webm"
            className="hidden"
          />
        </div>
      </div>

      {/* Upload Banner / Dropzone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragOver(false);
          handleFileUpload(e.dataTransfer.files);
        }}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
          isDragOver
            ? 'border-[#0A6C74] bg-[#0A6C74]/10'
            : 'border-stone-800 hover:border-stone-700 bg-stone-950/60'
        }`}
      >
        <div className="max-w-md mx-auto space-y-2">
          <div className="w-12 h-12 rounded-full bg-stone-900 flex items-center justify-center mx-auto text-[#2dd4bf]">
            <Upload className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-semibold text-white">
            Drag and drop images or videos here, or click to browse
          </h3>
          <p className="text-xs text-stone-400">
            Supports JPG, PNG, WebP, AVIF (up to 10MB) and MP4/WebM videos (up to 50MB). Files are uploaded to Supabase Storage and served via public CDN.
          </p>
        </div>
      </div>

      {/* Error alert */}
      {uploadError && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-300 rounded text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{uploadError}</span>
        </div>
      )}

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-stone-950 border border-stone-800 rounded-lg p-3 text-xs">
        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 text-stone-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search filename..."
            className="w-full pl-9 pr-3 py-1.5 bg-stone-900 border border-stone-800 rounded text-stone-200 placeholder-stone-500 focus:outline-none focus:border-[#0A6C74]"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <span className="text-stone-400 text-xs hidden sm:inline">Filter:</span>
          <div className="inline-flex rounded border border-stone-800 bg-stone-900 p-0.5">
            <button
              type="button"
              onClick={() => setFilterType('all')}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                filterType === 'all' ? 'bg-[#0A6C74] text-white' : 'text-stone-400 hover:text-white'
              }`}
            >
              All ({mediaItems.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterType('image')}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                filterType === 'image' ? 'bg-[#0A6C74] text-white' : 'text-stone-400 hover:text-white'
              }`}
            >
              Images
            </button>
            <button
              type="button"
              onClick={() => setFilterType('video')}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                filterType === 'video' ? 'bg-[#0A6C74] text-white' : 'text-stone-400 hover:text-white'
              }`}
            >
              Videos
            </button>
          </div>
        </div>
      </div>

      {/* Media Grid */}
      {loading ? (
        <div className="p-12 text-center text-stone-400">
          <div className="w-8 h-8 border-2 border-[#0A6C74] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs">Connecting to Supabase Storage bucket...</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="bg-stone-950 border border-stone-800 rounded-xl p-12 text-center text-stone-400 space-y-2">
          <ImageIcon className="w-8 h-8 text-stone-600 mx-auto" />
          <p className="text-sm font-semibold text-stone-300">
            {mediaItems.length === 0 ? 'No files uploaded yet in the "tour-media" bucket' : 'No media matches your search'}
          </p>
          <p className="text-xs text-stone-500">
            {mediaItems.length === 0
              ? 'Upload your first high-resolution excursion photo or video above.'
              : 'Try clearing your search query or filter.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filteredItems.map((item) => {
            const isVideo = item.name.endsWith('.mp4') || item.name.endsWith('.webm') || item.name.endsWith('.mov');

            return (
              <div
                key={item.id}
                className="bg-stone-950 border border-stone-800 hover:border-stone-700 rounded-lg overflow-hidden group transition-all flex flex-col justify-between"
              >
                {/* Thumbnail */}
                <div className="aspect-square bg-stone-900 relative overflow-hidden flex items-center justify-center">
                  {isVideo ? (
                    <div className="text-center p-3">
                      <Film className="w-8 h-8 text-[#2dd4bf] mx-auto mb-1" />
                      <span className="text-[10px] text-stone-400 font-mono block">Video File</span>
                    </div>
                  ) : (
                    <img
                      src={item.url}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                  )}

                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2">
                    <button
                      type="button"
                      onClick={() => copyUrl(item.url, item.id)}
                      className="p-1.5 bg-stone-850 hover:bg-stone-700 text-white rounded text-xs transition-colors cursor-pointer"
                      title="Copy Public CDN URL"
                    >
                      {copiedId === item.id ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 bg-stone-850 hover:bg-stone-700 text-white rounded text-xs transition-colors"
                      title="Open full size"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                    <button
                      type="button"
                      onClick={() => handleDelete(item)}
                      className="p-1.5 bg-red-950 hover:bg-red-800 text-red-200 rounded text-xs transition-colors cursor-pointer"
                      title="Delete from bucket"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Metadata */}
                <div className="p-2.5 text-xs space-y-1">
                  <p className="text-stone-200 font-medium truncate text-[11px]" title={item.name}>
                    {item.name}
                  </p>
                  <div className="flex items-center justify-between text-[10px] text-stone-500 font-mono">
                    <span>{formatBytes(item.sizeBytes)}</span>
                    <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Media Confirmation Modal */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-stone-800 rounded-xl max-w-sm w-full p-6 space-y-4 shadow-2xl text-xs">
            <div className="flex items-center space-x-2.5 text-amber-400">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <h3 className="text-sm font-bold text-white">Delete Media File</h3>
            </div>
            <p className="text-stone-300 leading-relaxed">
              Are you sure you want to delete <strong className="text-white break-all">"{itemToDelete.name}"</strong> from Supabase Storage bucket <code className="text-[#2dd4bf] font-mono">tour-media</code>?
            </p>
            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-stone-800">
              <button
                type="button"
                onClick={() => setItemToDelete(null)}
                disabled={isDeleting}
                className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteItem}
                disabled={isDeleting}
                className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded font-semibold disabled:opacity-50 cursor-pointer"
              >
                {isDeleting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
