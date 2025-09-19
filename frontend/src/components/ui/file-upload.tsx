import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileUploadProps {
  onFilesChange: (files: File[]) => void;
  files: File[];
  maxFiles?: number;
  accept?: Record<string, string[]>;
  className?: string;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  onFilesChange,
  files,
  maxFiles = 5,
  accept = { 'application/pdf': ['.pdf'] },
  className,
}) => {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const newFiles = [...files, ...acceptedFiles].slice(0, maxFiles);
      onFilesChange(newFiles);
    },
    [files, maxFiles, onFilesChange]
  );

  const removeFile = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index);
    onFilesChange(newFiles);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    maxFiles: maxFiles - files.length,
  });

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={cn('w-full space-y-4', className)}>
      <div
        {...getRootProps()}
        className={cn(
          'relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-300',
          'bg-gradient-to-br from-card/50 to-card/80 backdrop-blur-sm',
          'hover:from-card/70 hover:to-card/90',
          isDragActive
            ? 'border-primary bg-primary/5 scale-102'
            : 'border-border hover:border-primary/50',
          files.length >= maxFiles && 'opacity-50 cursor-not-allowed'
        )}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-4">
          <div className={cn(
            'p-4 rounded-full transition-all duration-300',
            'bg-gradient-to-br from-primary/10 to-primary/20',
            isDragActive && 'animate-glow-pulse'
          )}>
            <Upload className={cn(
              'h-8 w-8 transition-colors',
              isDragActive ? 'text-primary' : 'text-muted-foreground'
            )} />
          </div>
          <div>
            <p className="text-lg font-semibold mb-2">
              {isDragActive ? 'Drop your files here' : 'Upload PDF documents'}
            </p>
            <p className="text-sm text-muted-foreground">
              Drag and drop PDF files here, or click to browse
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Maximum {maxFiles} files • PDF format only
            </p>
          </div>
        </div>
      </div>

      {files.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-foreground">Selected Files</h4>
          {files.map((file, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 rounded-lg bg-card/50 border border-border"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded bg-primary/10">
                  <FileText className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(file.size)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => removeFile(index)}
                className="p-1 rounded-full hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};