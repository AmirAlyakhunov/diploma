import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { addToCollection, removeFromCollection, isInCollection } from '../utils/collectionUtils';
import AuthModal from './AuthModal';
import './AppScreenshotModal.css';

const AppScreenshotModal = ({ appName, screenshots, selectedIndex, onClose, appLogo }) => {
  const [currentIndex, setCurrentIndex] = useState(selectedIndex);
  const [copyStatus, setCopyStatus] = useState('default');
  const [isLiked, setIsLiked] = useState(false);
  const [likeLoading, setLikeLoading] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  
  const { user } = useAuth();

  // Динамическое название из текущего скриншота (для поиска)
  const currentAppName = screenshots[currentIndex]?.apps?.name || appName;

  useEffect(() => {
    setCurrentIndex(selectedIndex);
    setCopyStatus('default');
    // Сбрасываем состояние лайка при смене скриншота
    setIsLiked(false);
    setLikeLoading(false);
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
  const logoUrl = currentScreenshot?.apps?.logo_url || appLogo;

  // Проверяем, добавлен ли текущий скриншот в коллекцию пользователя
  useEffect(() => {
    const checkIfLiked = async () => {
      if (!user || !currentScreenshot?.id) {
        setIsLiked(false);
        return;
      }

      try {
        const liked = await isInCollection(currentScreenshot.id, user.id);
        setIsLiked(liked);
      } catch (error) {
        console.error('Ошибка при проверке коллекции:', error);
        setIsLiked(false);
      }
    };

    checkIfLiked();
  }, [currentScreenshot?.id, user]);

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

  const handleLike = async () => {
    if (!user) {
      // Открываем модальное окно авторизации
      setShowAuthModal(true);
      return;
    }

    if (!currentScreenshot?.id) return;

    setLikeLoading(true);
    try {
      if (isLiked) {
        // Удаляем из коллекции
        const result = await removeFromCollection(currentScreenshot.id, user.id);
        if (result.success) {
          setIsLiked(false);
        } else {
          console.error('Ошибка при удаления из коллекции:', result.error);
        }
      } else {
        // Добавляем в коллекцию
        const appId = currentScreenshot.apps?.id || null;
        const result = await addToCollection(currentScreenshot.id, appId, user.id);
        if (result.success) {
          setIsLiked(true);
        } else if (result.error === 'Скриншот уже в коллекции') {
          setIsLiked(true); // На случай рассинхронизации
        } else {
          console.error('Ошибка при добавлении в коллекцию:', result.error);
        }
      }
    } catch (error) {
      console.error('Ошибка при обработке лайка:', error);
    } finally {
      setLikeLoading(false);
    }
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
          <span className="material-symbols-rounded">
            arrow_back
          </span>
        </button>
      )}

      <div className="modal-window" onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          {logoUrl && (
            <img src={logoUrl} alt={`${currentAppName} logo`} className="modal-logo" />
          )}
          <h3>{currentAppName}</h3>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close modal">
            <span className="material-symbols-rounded">
              close
            </span>
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
          <button
            type="button"
            className={`like-button ${isLiked ? 'liked' : ''}`}
            onClick={handleLike}
            disabled={likeLoading}
            aria-label={isLiked ? 'Убрать из коллекции' : 'Добавить в коллекцию'}
          >
            <span className="like-button-text">
              {isLiked ? 'Сохранено в профиле' : 'Сохранить в профиль'}
            </span>
          </button>
            <button type="button" className="copy-button" onClick={handleCopyImage}>
            {copyStatus === 'copied'
              ? 'Скопировано'
              : copyStatus === 'error'
                ? 'Ошибка копирования'
                : 'Копировать'}
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
          <span className="material-symbols-rounded">
            arrow_forward
          </span>
        </button>
      )}

      {showAuthModal && (
        <AuthModal onClose={() => setShowAuthModal(false)} />
      )}
    </div>
  );
};

export default AppScreenshotModal;
