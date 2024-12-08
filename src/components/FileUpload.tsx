import React, { useCallback, useState } from 'react';
import { Upload, AlertCircle, CheckCircle2, FileDown } from 'lucide-react';
import { cn } from '../lib/utils';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  className?: string;
}

interface FileError {
  type: 'format' | 'size' | 'empty' | 'columns' | 'process';
  message: string;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const REQUIRED_COLUMNS = ['name', 'location', 'latitude', 'longitude'];

export function FileUpload({ onFileSelect, className }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<FileError | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const validateFile = async (file: File): Promise<boolean> => {
    setError(null);
    
    if (!file) {
      setError({ type: 'empty', message: "No file selected" });
      return false;
    }
    
    if (!file.type && !file.name.endsWith('.csv')) {
      setError({ type: 'format', message: "Please upload a CSV file" });
      return false;
    }
    
    if (file.size > MAX_FILE_SIZE) {
      setError({ 
        type: 'size', 
        message: `File size should be less than ${MAX_FILE_SIZE / (1024 * 1024)}MB` 
      });
      return false;
    }

    try {
      // Check CSV structure
      const text = await file.text();
      const lines = text.trim().split('\n');
      
      if (lines.length < 2) {
        setError({ type: 'empty', message: "CSV file is empty" });
        return false;
      }

      const headers = lines[0].toLowerCase().split(',').map(h => h.trim());
      const missingColumns = REQUIRED_COLUMNS.filter(col => !headers.includes(col));

      if (missingColumns.length > 0) {
        setError({
          type: 'columns',
          message: `Missing required columns: ${missingColumns.join(', ')}`
        });
        return false;
      }
    } catch (err) {
      setError({ type: 'process', message: "Failed to read CSV file" });
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
    setIsUploading(true);
    setUploadSuccess(false);
    
    try {
      if (await validateFile(file)) {
        onFileSelect(file);
        setUploadSuccess(true);
      }
    } catch (err) {
      setError({ 
        type: 'process', 
        message: "Error processing file. Please try again." 
      });
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
        
        <div className="text-center">
          {error ? (
            <>
              <p className="text-sm text-red-600 font-medium mb-1">{error.message}</p>
              <p className="text-xs text-red-500">
                {error.type === 'columns' && "Download the sample CSV for reference"}
              </p>
            </>
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
        <div className="absolute inset-0 bg-white/80 backdrop-blur-[1px] flex items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-secondary">Processing file...</p>
          </div>
        </div>
      )}
    </div>
  );
}