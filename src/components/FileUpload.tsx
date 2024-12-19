import React, { useCallback, useState } from 'react';
import { Upload, AlertCircle, CheckCircle2, FileDown } from 'lucide-react';
import { cn } from '../lib/utils';
import { trackEvent, ANALYTICS_EVENTS } from '../services/analytics';

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
    console.log('Validating file:', { 
      name: file.name, 
      type: file.type, 
      size: file.size 
    });
    
    if (!file) {
      const errorMsg = "No file selected";
      console.error(errorMsg);
      setError({ type: 'empty', message: errorMsg });
      return false;
    }
    
    if (!file.type && !file.name.endsWith('.csv')) {
      const errorMsg = "Please upload a CSV file";
      console.error(errorMsg, { fileType: file.type });
      setError({ type: 'format', message: errorMsg });
      return false;
    }
    
    if (file.size > MAX_FILE_SIZE) {
      const errorMsg = `File size should be less than ${MAX_FILE_SIZE / (1024 * 1024)}MB`;
      console.error(errorMsg, { fileSize: file.size });
      setError({ type: 'size', message: errorMsg });
      return false;
    }

    try {
      // Check CSV structure
      const text = await file.text();
      const lines = text.trim().split('\n');
      console.log('CSV structure:', { 
        totalLines: lines.length,
        firstLine: lines[0]
      });
      
      if (lines.length < 2) {
        const errorMsg = "CSV file is empty";
        console.error(errorMsg);
        setError({ type: 'empty', message: errorMsg });
        return false;
      }

      const headers = lines[0]
        .toLowerCase()
        .split(',')
        .map(h => h.trim().replace(/^["']|["']$/g, '')); // Remove quotes and trim whitespace
      console.log('CSV headers:', headers);
      
      const missingColumns = REQUIRED_COLUMNS.filter(col => !headers.includes(col));
      
      if (missingColumns.length > 0) {
        const errorMsg = `Missing required columns: ${missingColumns.join(', ')}`;
        console.error(errorMsg, { 
          required: REQUIRED_COLUMNS,
          found: headers 
        });
        setError({ type: 'columns', message: errorMsg });
        return false;
      }
    } catch (err) {
      const errorMsg = "Failed to read CSV file";
      console.error(errorMsg, err);
      setError({ type: 'process', message: errorMsg });
      return false;
    }
    
    console.log('File validation successful');
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
      await trackEvent({
        event_name: ANALYTICS_EVENTS.MAP_CREATION.STARTED,
        event_data: { filename: file.name, fileSize: file.size }
      });

      if (await validateFile(file)) {
        onFileSelect(file);
        setUploadSuccess(true);
        
        await trackEvent({
          event_name: ANALYTICS_EVENTS.MAP_CREATION.COMPLETED,
          event_data: { filename: file.name, fileSize: file.size }
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Error processing file. Please try again.";
      setError({ 
        type: 'process', 
        message: errorMessage 
      });
      
      await trackEvent({
        event_name: ANALYTICS_EVENTS.MAP_CREATION.ERROR,
        event_data: { error: errorMessage }
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