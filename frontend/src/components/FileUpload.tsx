'use client';

import React, { useCallback, useState } from 'react';
import { useDropzone, FileWithPath } from 'react-dropzone';
import { UploadCloud, File as FileIcon, Loader2 } from 'lucide-react';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  isLoading?: boolean;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect, isLoading = false }) => {
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: FileWithPath[]) => {
    if (acceptedFiles && acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      // Basic validation (can be expanded)
      if (file.type.startsWith('image/')) {
        setSelectedFileName(file.name);
        onFileSelect(file);
      } else {
        alert("Please upload a valid image file (e.g., JPG, PNG).");
        setSelectedFileName(null);
      }
    }
  }, [onFileSelect]);

  const { getRootProps, getInputProps, isDragActive, isDragAccept, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': [],
      'image/png': [],
      'image/webp': [],
      'image/gif': [],
      // Add other image types as needed
    },
    multiple: false,
  });

  let borderColorClass = 'border-gray-600 hover:border-purple-500';
  if (isDragAccept) borderColorClass = 'border-green-500';
  if (isDragReject) borderColorClass = 'border-red-500';

  return (
    <section className="w-full max-w-2xl mx-auto p-4 md:p-8 my-8">
      <div
        {...getRootProps()}
        className={`relative flex flex-col items-center justify-center w-full h-64 p-8 border-2 ${borderColorClass} border-dashed rounded-xl cursor-pointer transition-colors duration-200 ease-in-out bg-gray-800 shadow-lg`}
      >
        <input {...getInputProps()} />
        {isLoading ? (
          <>
            <Loader2 className="w-16 h-16 text-purple-400 animate-spin mb-4" />
            <p className="text-lg text-gray-300">Processing image...</p>
          </>
        ) : selectedFileName ? (
          <>
            <FileIcon className="w-16 h-16 text-green-400 mb-3" />
            <p className="text-lg font-medium text-gray-200">{selectedFileName}</p>
            <p className="text-sm text-gray-400 mt-1">File selected. Drag another or click to replace.</p>
          </>
        ) : (
          <>
            <UploadCloud className={`w-16 h-16 mb-4 ${isDragActive ? 'text-purple-400 animate-bounce' : 'text-gray-500'}`} />
            <p className="text-xl font-semibold text-gray-300 text-center">
              {isDragActive ? "Drop the image here..." : "Drag & drop an image here, or click to select"}
            </p>
            <p className="text-sm text-gray-500 mt-2">Supports: JPG, PNG, WEBP, GIF</p>
            {isDragReject && <p className="text-red-500 mt-2 text-sm">Invalid file type.</p>}
          </>
        )}
      </div>
    </section>
  );
};

export default FileUpload;
