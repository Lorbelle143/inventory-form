import { useState, useRef } from 'react';

interface DocumentScannerProps {
  onDocumentsChange: (files: File[]) => void;
  maxDocuments?: number;
}

export default function DocumentScanner({ onDocumentsChange, maxDocuments = 4 }: DocumentScannerProps) {
  const [documents, setDocuments] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    addDocuments(files);
  };

  const addDocuments = (newFiles: File[]) => {
    const remainingSlots = maxDocuments - documents.length;
    const filesToAdd = newFiles.slice(0, remainingSlots);

    if (filesToAdd.length === 0) {
      alert(`Maximum ${maxDocuments} documents allowed`);
      return;
    }

    // Validate file sizes (10MB for PDFs, 5MB for images)
    const oversizedFiles = filesToAdd.filter(f => {
      const maxSize = f.type === 'application/pdf' ? 10 * 1024 * 1024 : 5 * 1024 * 1024;
      return f.size > maxSize;
    });
    
    if (oversizedFiles.length > 0) {
      alert('Some files are too large. Maximum 5MB for images, 10MB for PDFs.');
      return;
    }

    const updatedDocuments = [...documents, ...filesToAdd];
    setDocuments(updatedDocuments);
    onDocumentsChange(updatedDocuments);

    // Create previews
    filesToAdd.forEach(file => {
      if (file.type === 'application/pdf') {
        // For PDFs, show a PDF icon instead of preview
        setPreviews(prev => [...prev, 'PDF']);
      } else {
        // For images, create preview
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreviews(prev => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      }
    });
  };

  const removeDocument = (index: number) => {
    const updatedDocuments = documents.filter((_, i) => i !== index);
    const updatedPreviews = previews.filter((_, i) => i !== index);
    setDocuments(updatedDocuments);
    setPreviews(updatedPreviews);
    onDocumentsChange(updatedDocuments);
  };

  const openCamera = () => {
    cameraInputRef.current?.click();
  };

  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800">
          Documents ({documents.length}/{maxDocuments})
        </h3>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={openCamera}
            disabled={documents.length >= maxDocuments}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Scan/Camera
          </button>
          <button
            type="button"
            onClick={openFilePicker}
            disabled={documents.length >= maxDocuments}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            Upload Files
          </button>
        </div>
      </div>

      {/* Hidden file inputs */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,application/pdf"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Document previews */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {documents.map((doc, index) => (
          <div key={index} className="relative group">
            <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden border-2 border-gray-300">
              {doc.type === 'application/pdf' ? (
                // PDF Preview
                <div className="w-full h-full flex flex-col items-center justify-center bg-red-50">
                  <svg className="w-16 h-16 text-red-600 mb-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                  </svg>
                  <p className="text-xs font-bold text-red-600">PDF</p>
                  <p className="text-xs text-gray-600 px-2 text-center truncate w-full">{doc.name}</p>
                </div>
              ) : (
                // Image Preview
                <img
                  src={previews[index]}
                  alt={`Document ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              )}
            </div>
            <button
              type="button"
              onClick={() => removeDocument(index)}
              className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition shadow-lg"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <p className="text-xs text-center text-gray-600 mt-1 font-medium">
              {doc.type === 'application/pdf' ? '📄 PDF' : '📷 Image'} {index + 1}
            </p>
          </div>
        ))}

        {/* Empty slots */}
        {Array.from({ length: maxDocuments - documents.length }).map((_, index) => (
          <div
            key={`empty-${index}`}
            className="aspect-square bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center"
          >
            <div className="text-center text-gray-400">
              <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <p className="text-xs">Empty</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <p className="text-sm text-blue-800">
          <strong>📸 Tips:</strong>
        </p>
        <ul className="text-xs text-blue-700 mt-1 space-y-1">
          <li>• Use "Scan/Camera" to take photos directly</li>
          <li>• Use "Upload Files" to select images or PDFs</li>
          <li>• Maximum {maxDocuments} documents (Optional)</li>
          <li>• Images: 5MB max (JPG, PNG)</li>
          <li>• PDFs: 10MB max</li>
          <li>• You can submit without documents and upload later</li>
        </ul>
      </div>
    </div>
  );
}
