import React, { useCallback, useState } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/app/utils/cn';

interface ImageUploaderProps {
  value?: string | null;
  onChange: (file: File | null, preview?: string | null) => void;
  accept?: string;
  maxSize?: number; // in MB
  className?: string;
  placeholder?: string;
}

export function ImageUploader({
  value,
  onChange,
  accept = 'image/*',
  maxSize = 5,
  className,
  placeholder = 'Click to upload or drag and drop'
}: ImageUploaderProps) {
  const [preview, setPreview] = useState<string | null>(value || null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback((file: File) => {
    setError(null);
    
    // Validate file size
    if (file.size > maxSize * 1024 * 1024) {
      setError(`File size must be less than ${maxSize}MB`);
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      const previewUrl = e.target?.result as string;
      setPreview(previewUrl);
      onChange(file, previewUrl);
    };
    reader.readAsDataURL(file);
  }, [maxSize, onChange]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFile(files[0]);
    }
  }, [handleFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  }, [handleFile]);

  const handleRemove = useCallback(() => {
    setPreview(null);
    setError(null);
    onChange(null, null);
  }, [onChange]);

  return (
    <div className={cn('w-full', className)}>
      <div
        className={cn(
          'relative border-2 border-dashed rounded-2xl transition-all duration-200',
          isDragging ? 'border-fuchsia-400 bg-fuchsia-500/10' : 'border-white/20 hover:border-white/40',
          preview ? 'p-2' : 'p-8',
          'bg-white/5 backdrop-blur-sm'
        )}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        {preview ? (
          <div className="relative group">
            <img
              src={preview}
              alt="Preview"
              className="w-full h-48 object-cover rounded-xl"
            />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center">
              <button
                type="button"
                onClick={handleRemove}
                className="p-2 bg-rose-500 text-white rounded-full hover:bg-rose-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center">
            <div className="mx-auto w-12 h-12 text-gray-400 mb-4">
              {isDragging ? (
                <Upload className="w-full h-full" />
              ) : (
                <ImageIcon className="w-full h-full" />
              )}
            </div>
            <div className="text-sm text-gray-300 mb-2">{placeholder}</div>
            <div className="text-xs text-gray-500">
              PNG, JPG, GIF up to {maxSize}MB
            </div>
          </div>
        )}

        <input
          type="file"
          accept={accept}
          onChange={handleFileInput}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
      </div>

      {error && (
        <div className="mt-2 text-sm text-rose-400">{error}</div>
      )}
    </div>
  );
}

export default ImageUploader;
