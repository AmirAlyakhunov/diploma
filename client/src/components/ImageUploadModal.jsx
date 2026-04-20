import { useState, useRef, useEffect } from 'react';
import './ImageUploadModal.css';

const ImageUploadModal = ({ isOpen, onClose, onSearch }) => {
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef(null);

  // Обработка вставки из буфера обмена
  useEffect(() => {
    const handlePaste = async (e) => {
      if (!isOpen) return;
      
      const items = e.clipboardData?.items;
      if (!items) return;

      for (const item of items) {
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) {
            handleFile(file);
          }
          break;
        }
      }
    };

    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, [isOpen]);

  const handleFile = (file) => {
    if (!file || !file.type.startsWith('image/')) return;
    
    setImage(file);
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target.result);
    reader.readAsDataURL(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleSearch = async () => {
    if (!image) return;
    
    setIsLoading(true);
    try {
      await onSearch(image);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setImage(null);
    setPreview(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>Поиск по изображению</h2>
        
        {preview ? (
          <>
            <img src={preview} alt="Preview" className="preview-image" />
            <div className="modal-actions">
              <button 
                className="search-btn" 
                onClick={handleSearch}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <span className="loading-spinner"></span>
                    Поиск...
                  </>
                ) : '🔍 Искать'}
              </button>
              <button className="cancel-btn" onClick={() => { setImage(null); setPreview(null); }}>
                Выбрать другое
              </button>
            </div>
          </>
        ) : (
          <div
            className={`drop-zone ${isDragOver ? 'drag-over' : ''}`}
            onClick={() => fileInputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <div className="icon">📷</div>
            <p><strong>Перетащите изображение сюда</strong></p>
            <p>или нажмите для выбора файла</p>
            <p className="hint">Также можно нажать Ctrl+V для вставки из буфера обмена</p>
          </div>
        )}
        
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          accept="image/*"
          style={{ display: 'none' }}
        />
      </div>
    </div>
  );
};

export default ImageUploadModal;