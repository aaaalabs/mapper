import React, { useCallback } from 'react';
import { Upload, FileUp } from 'lucide-react';
import { cn } from '../utils/cn';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  className?: string;
}

export function FileUpload({ onFileSelect, className }: FileUploadProps) {
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files[0];
    if (file && file.type === "text/csv") {
      onFileSelect(file);
    }
  }, [onFileSelect]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
  }, [onFileSelect]);

  return (
    <div
      className={cn(
        "border-2 border-dashed border-tertiary/30 rounded-lg p-8 text-center hover:border-accent transition-colors bg-background-white shadow-soft",
        className
      )}
      onDragOver={handleDragOver}
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
        <div className="bg-background p-4 rounded-full">
          <FileUp className="w-8 h-8 text-accent-alt" />
        </div>
        <div>
          <p className="text-lg font-semibold text-primary mb-2">Drop your CSV file here</p>
          <p className="text-sm text-secondary">or click to browse</p>
        </div>
      </label>
    </div>
  );
}