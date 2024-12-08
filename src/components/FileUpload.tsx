import React, { useCallback, useState } from 'react';
import { Upload, AlertCircle, CheckCircle2 } from 'lucide-react';
import { cn } from '../utils/cn';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  className?: string;
}

export function FileUpload({ onFileSelect, className }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const validateFile = (file: File): boolean => {
    setError(null);
    
    if (file.type !== "text/csv") {
      setError("Please upload a CSV file");
      return false;
    }
    
    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      setError("File size should be less than 5MB");
      return false;
    }
    
    return true;
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const processFile = async (file: File) => {
    if (!validateFile(file)) return;
    
    setIsUploading(true);
    setUploadSuccess(false);
    
    try {
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 1000));
      onFileSelect(file);
      setUploadSuccess(true);
    } catch (err) {
      setError("Error processing file. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      processFile(file);
    }
  }, [onFileSelect]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  }, [onFileSelect]);

  return (
    <div
      className={cn(
        "relative border-2 border-dashed rounded-lg p-6",
        isDragging ? "border-accent bg-accent/5" : "border-gray-200",
        error ? "border-red-300 bg-red-50" : "",
        uploadSuccess ? "border-green-300 bg-green-50" : "",
        className
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input
        type="file"
        accept=".csv"
        onChange={handleFileSelect}
        className="hidden"
        id="file-upload"
      />
      <label
        htmlFor="file-upload"
        className="cursor-pointer flex flex-col items-center gap-4"
      >
        {error ? (
          <AlertCircle className="h-8 w-8 text-red-500" />
        ) : uploadSuccess ? (
          <CheckCircle2 className="h-8 w-8 text-green-500" />
        ) : (
          <Upload className={cn("h-8 w-8", isDragging ? "text-accent" : "text-tertiary")} />
        )}
        
        <div>
          {error ? (
            <p className="text-sm text-red-600 font-medium">{error}</p>
          ) : uploadSuccess ? (
            <p className="text-sm text-green-600 font-medium">File uploaded successfully!</p>
          ) : (
            <>
              <p className="text-sm mb-1 text-secondary">
                {isDragging ? "Drop your file here" : "Drop your CSV file here or click to browse"}
              </p>
              <p className="text-xs text-tertiary">
                Required columns: name, location, latitude, longitude
              </p>
            </>
          )}
        </div>
      </label>

      {isUploading && (
        <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-secondary">Processing file...</p>
          </div>
        </div>
      )}
    </div>
  );
}