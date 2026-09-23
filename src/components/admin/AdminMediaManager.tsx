import React, { useState, useRef } from 'react';
import {
  Upload,
  Image as ImageIcon,
  Trash2,
  Star,
  Check,
  Video,
  ExternalLink,
  MoveUp,
  MoveDown,
  AlertCircle,
  FileText,
  Plus
} from 'lucide-react';
import { uploadTourMedia, deleteTourMedia } from '../../services/storageService';
import { DbTourImage, DbTourVideo } from '../../types/database';

interface AdminMediaManagerProps {
  images: Array<Partial<DbTourImage>>;
  videos: Array<Partial<DbTourVideo>>;
  onImagesChange: (images: Array<Partial<DbTourImage>>) => void;
  onVideosChange: (videos: Array<Partial<DbTourVideo>>) => void;
}

export const AdminMediaManager: React.FC<AdminMediaManagerProps> = ({
  images,
  videos,
  onImagesChange,
  onVideosChange,
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [newVideoUrl, setNewVideoUrl] = useState('');
  const [newVideoTitle, setNewVideoTitle] = useState('');
  const [newVideoProvider, setNewVideoProvider] = useState<'youtube' | 'vimeo' | 'storage' | 'direct'>('youtube');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // File upload handler
  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setIsUploading(true);
    setUploadError(null);

    const uploadedList: Array<Partial<DbTourImage>> = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const result = await uploadTourMedia(file, 'tours');
      if (result.error) {
        setUploadError(result.error);
        break;
      }

      uploadedList.push({
        id: `img-${Date.now()}-${i}`,
        image_url: result.url,
        storage_path: result.storagePath,
        alt_text: file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '),
        caption: '',
        is_primary: images.length === 0 && i === 0,
        sort_order: images.length + i + 1,
      });
    }

    if (uploadedList.length > 0) {
      onImagesChange([...images, ...uploadedList]);
    }

    setIsUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const setPrimaryImage = (index: number) => {
    const updated = images.map((img, idx) => ({
      ...img,
      is_primary: idx === index,
    }));
    onImagesChange(updated);
  };

  const removeImage = async (index: number) => {
    const target = images[index];
    if (target.storage_path) {
      await deleteTourMedia(target.storage_path);
    }
    const updated = images.filter((_, idx) => idx !== index);
    if (updated.length > 0 && !updated.some((i) => i.is_primary)) {
      updated[0].is_primary = true;
    }
    onImagesChange(updated);
  };

  const moveImage = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= images.length) return;
    const copy = [...images];
    const temp = copy[index];
    copy[index] = copy[targetIdx];
    copy[targetIdx] = temp;
    onImagesChange(copy);
  };

  const updateImageField = (index: number, field: 'alt_text' | 'caption', val: string) => {
    const updated = [...images];
    updated[index] = { ...updated[index], [field]: val };
    onImagesChange(updated);
  };

  // Video Management
  const addVideo = () => {
    if (!newVideoUrl.trim()) return;
    const newVid: Partial<DbTourVideo> = {
      id: `vid-${Date.now()}`,
      video_url: newVideoUrl.trim(),
      title: newVideoTitle.trim() || 'Tour Experience Video',
      provider: newVideoProvider,
      is_primary: videos.length === 0,
      sort_order: videos.length + 1,
    };
    onVideosChange([...videos, newVid]);
    setNewVideoUrl('');
    setNewVideoTitle('');
  };

  const removeVideo = (index: number) => {
    onVideosChange(videos.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-8">
      {/* IMAGES SECTION */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <ImageIcon className="w-4 h-4 text-[#2dd4bf]" />
              <span>Tour Photography Gallery ({images.length})</span>
            </h3>
            <p className="text-xs text-stone-400">
              Files are stored in the <code className="text-[#2dd4bf]">tour-media</code> Supabase Storage bucket. The first image marked as "Cover" serves as the primary hero image.
            </p>
          </div>

          <div className="text-right text-[11px] text-stone-400">
            <span>Recommended: 1600x1060px • JPG/WebP • Max 10MB</span>
          </div>
        </div>

        {/* Drag and Drop Uploader */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            handleFileUpload(e.dataTransfer.files);
          }}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
            dragOver
              ? 'border-[#2dd4bf] bg-[#0A6C74]/10'
              : 'border-stone-700 hover:border-stone-500 bg-stone-950/60'
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => handleFileUpload(e.target.files)}
            multiple
            accept="image/jpeg,image/png,image/webp,image/avif"
            className="hidden"
          />

          <div className="flex flex-col items-center justify-center space-y-2">
            <div className="w-10 h-10 rounded-full bg-stone-900 border border-stone-800 flex items-center justify-center text-stone-300">
              <Upload className="w-5 h-5 text-[#2dd4bf]" />
            </div>
            <div>
              <p className="text-xs font-semibold text-white">
                {isUploading ? 'Uploading to Supabase Storage...' : 'Click to browse or drag photos here'}
              </p>
              <p className="text-[11px] text-stone-400">
                Supports multiple uploads with automated bucket key generation
              </p>
            </div>
          </div>
        </div>

        {uploadError && (
          <div className="p-3 bg-red-950/60 border border-red-800 rounded text-xs text-red-300 flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{uploadError}</span>
          </div>
        )}

        {/* Image Grid with Reordering & Meta Editor */}
        {images.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
            {images.map((img, idx) => (
              <div
                key={img.id || idx}
                className={`bg-stone-950 border rounded-lg overflow-hidden flex flex-col justify-between transition-all ${
                  img.is_primary ? 'border-[#0A6C74] ring-1 ring-[#0A6C74]' : 'border-stone-800'
                }`}
              >
                {/* Image Preview & Primary Badge */}
                <div className="relative aspect-video bg-stone-900">
                  <img
                    src={img.image_url}
                    alt={img.alt_text || 'Tour preview'}
                    className="w-full h-full object-cover"
                  />

                  {img.is_primary && (
                    <span className="absolute top-2 left-2 px-2 py-0.5 bg-[#0A6C74] text-white text-[10px] font-bold rounded shadow flex items-center space-x-1">
                      <Star className="w-3 h-3 fill-current" />
                      <span>Primary Cover</span>
                    </span>
                  )}

                  {/* Ordering & delete overlay */}
                  <div className="absolute top-2 right-2 flex items-center space-x-1 bg-black/60 backdrop-blur-xs p-1 rounded">
                    {idx > 0 && (
                      <button
                        type="button"
                        onClick={() => moveImage(idx, 'up')}
                        className="p-1 hover:text-white text-stone-300"
                        title="Move Left"
                      >
                        <MoveUp className="w-3.5 h-3.5 rotate-[-90deg]" />
                      </button>
                    )}
                    {idx < images.length - 1 && (
                      <button
                        type="button"
                        onClick={() => moveImage(idx, 'down')}
                        className="p-1 hover:text-white text-stone-300"
                        title="Move Right"
                      >
                        <MoveDown className="w-3.5 h-3.5 rotate-[-90deg]" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => removeImage(idx)}
                      className="p-1 hover:text-red-400 text-stone-400"
                      title="Remove image"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Metadata inputs */}
                <div className="p-3 space-y-2 text-xs">
                  <div>
                    <label className="text-[10px] uppercase font-semibold text-stone-400 block mb-0.5">
                      Alt Text (SEO & Accessibility)
                    </label>
                    <input
                      type="text"
                      value={img.alt_text || ''}
                      onChange={(e) => updateImageField(idx, 'alt_text', e.target.value)}
                      placeholder="e.g. Snorkelers over coral reef at Giftun"
                      className="w-full px-2 py-1 bg-stone-900 border border-stone-800 rounded text-stone-200 placeholder-stone-600 focus:outline-none focus:border-[#0A6C74] text-xs"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-semibold text-stone-400 block mb-0.5">
                      Caption (Optional)
                    </label>
                    <input
                      type="text"
                      value={img.caption || ''}
                      onChange={(e) => updateImageField(idx, 'caption', e.target.value)}
                      placeholder="e.g. Shallow turquoise lagoon at Orange Bay"
                      className="w-full px-2 py-1 bg-stone-900 border border-stone-800 rounded text-stone-200 placeholder-stone-600 focus:outline-none focus:border-[#0A6C74] text-xs"
                    />
                  </div>

                  {!img.is_primary && (
                    <button
                      type="button"
                      onClick={() => setPrimaryImage(idx)}
                      className="w-full mt-2 py-1 px-2 bg-stone-900 hover:bg-stone-800 text-stone-300 rounded text-[11px] font-medium transition-colors flex items-center justify-center space-x-1"
                    >
                      <Star className="w-3 h-3 text-amber-400" />
                      <span>Set as Primary Cover</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* VIDEOS SECTION */}
      <div className="pt-6 border-t border-stone-800 space-y-4">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center space-x-2">
            <Video className="w-4 h-4 text-sky-400" />
            <span>Tour Video Experiences</span>
          </h3>
          <p className="text-xs text-stone-400">
            Add YouTube or Vimeo URLs, or link direct video recordings stored in Supabase Storage.
          </p>
        </div>

        {/* Video Add Row */}
        <div className="bg-stone-950 p-4 rounded-lg border border-stone-800 grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
          <div className="md:col-span-2">
            <label className="text-[10px] font-semibold text-stone-400 uppercase block mb-1">
              Video URL (YouTube / Vimeo / Direct)
            </label>
            <input
              type="text"
              value={newVideoUrl}
              onChange={(e) => setNewVideoUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              className="w-full px-3 py-1.5 bg-stone-900 border border-stone-800 rounded text-white text-xs focus:outline-none focus:border-[#0A6C74]"
            />
          </div>

          <div>
            <label className="text-[10px] font-semibold text-stone-400 uppercase block mb-1">
              Title / Description
            </label>
            <input
              type="text"
              value={newVideoTitle}
              onChange={(e) => setNewVideoTitle(e.target.value)}
              placeholder="e.g. 4K Drone Tour Reel"
              className="w-full px-3 py-1.5 bg-stone-900 border border-stone-800 rounded text-white text-xs focus:outline-none focus:border-[#0A6C74]"
            />
          </div>

          <div className="flex items-end">
            <button
              type="button"
              onClick={addVideo}
              className="w-full py-1.5 px-3 bg-[#0A6C74] hover:bg-[#08565C] text-white rounded text-xs font-semibold flex items-center justify-center space-x-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Attach Video</span>
            </button>
          </div>
        </div>

        {/* Attached Videos List */}
        {videos.length > 0 && (
          <div className="space-y-2">
            {videos.map((vid, idx) => (
              <div
                key={vid.id || idx}
                className="p-3 bg-stone-950 border border-stone-800 rounded-md flex items-center justify-between text-xs"
              >
                <div className="flex items-center space-x-3">
                  <Video className="w-4 h-4 text-sky-400 shrink-0" />
                  <div>
                    <span className="font-semibold text-white block">{vid.title}</span>
                    <a
                      href={vid.video_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-stone-400 hover:text-white flex items-center space-x-1"
                    >
                      <span className="truncate max-w-sm">{vid.video_url}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => removeVideo(idx)}
                  className="p-1.5 text-stone-400 hover:text-red-400 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
