import { useEffect, useState } from 'react';
import './AppScreenshotModal.css';

const AppScreenshotModal = ({ appName, screenshots, selectedIndex, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(selectedIndex);
  const [copyStatus, setCopyStatus] = useState('default');

  // Динамическое название из текущего скриншота (для поиска)
  const currentAppName = screenshots[currentIndex]?.apps?.name || appName;

  useEffect(() => {
    setCurrentIndex(selectedIndex);
    setCopyStatus('default');
  }, [selectedIndex]);

  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.code === 'Escape') {
        onClose();
      }

      if (event.code === 'ArrowRight' && currentIndex < screenshots.length - 1) {
        setCurrentIndex((current) => Math.min(current + 1, screenshots.length - 1));
      }

      if (event.code === 'ArrowLeft' && currentIndex > 0) {
        setCurrentIndex((current) => Math.max(current - 1, 0));
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, onClose, screenshots.length]);


  const currentScreenshot = screenshots[currentIndex];

  const handleCopyImage = async () => {
    if (!currentScreenshot) return;

    if (!navigator.clipboard || !window.ClipboardItem) {
      window.alert('Ваш браузер не поддерживает копирование изображений напрямую.');
      return;
    }

    try {
      const response = await fetch(currentScreenshot.image_url);
      const blob = await response.blob();
      await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
      setCopyStatus('copied');
      setTimeout(() => setCopyStatus('default'), 2000);
    } catch (error) {
      console.error(error);
      setCopyStatus('error');
      setTimeout(() => setCopyStatus('default'), 2000);
    }
  };

  const handlePrev = () => {
    setCurrentIndex((current) => Math.max(current - 1, 0));
  };

  const handleNext = () => {
    setCurrentIndex((current) => Math.min(current + 1, screenshots.length - 1));
  };

  if (!currentScreenshot) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      {currentIndex > 0 && (
        <button
          type="button"
          className="modal-side-nav modal-side-prev"
          onClick={(event) => {
            event.stopPropagation();
            handlePrev();
          }}
          aria-label="Previous screenshot"
        >
          ‹
        </button>
      )}

      <div className="modal-window" onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <h3>{currentAppName}</h3>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close modal">
            ×
          </button>
        </div>

        <div className="modal-body">
          <img
            src={currentScreenshot.image_url}
            alt={currentScreenshot.alt || currentAppName}
            className="modal-image"
            draggable={false}
          />
        </div>

        <div className="modal-footer">
          <button type="button" className="copy-button" onClick={handleCopyImage}>
            {copyStatus === 'copied'
              ? 'Скопировано'
              : copyStatus === 'error'
              ? 'Ошибка копирования'
              : 'Копировать изображение'}
          </button>
        </div>
      </div>

      {currentIndex < screenshots.length - 1 && (
        <button
          type="button"
          className="modal-side-nav modal-side-next"
          onClick={(event) => {
            event.stopPropagation();
            handleNext();
          }}
          aria-label="Next screenshot"
        >
          ›
        </button>
      )}
    </div>
  );
};

export default AppScreenshotModal;
