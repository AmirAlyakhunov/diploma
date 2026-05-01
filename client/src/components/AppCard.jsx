import { Link } from 'react-router-dom';
import { useState } from 'react';
import './AppCard.css';

const AppCard = ({ app }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  const targetIndices = [0, 19, 39, 59]; // zero‑based
  const allScreenshots = app.screenshots || [];
  const screenshots = targetIndices
    .map(idx => allScreenshots[idx])
    .filter(Boolean);
  const totalSlides = screenshots.length;

  const goToSlide = (index) => {
    if (index >= 0 && index < totalSlides) {
      setCurrentSlide(index);
    }
  };

  const goNext = () => {
    if (currentSlide < totalSlides - 1) {
      setCurrentSlide(currentSlide + 1);
    }
  };

  const goPrev = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  return (
    <Link to={`/app/${app.id}`} className="app-card-link">
      <article
        className="app-card"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Верхний блок - слайдер с изображениями */}
        <div className="preview-wrap">
          {screenshots.length > 0 ? (
            <div className="slider-container">
              <div
                className="slider-track"
                style={{ transform: `translateX(-${currentSlide * 100}%)` }}
              >
                {screenshots.map((screenshot, index) => (
                  <div key={index} className="slide">
                    <img
                      src={screenshot.image_url}
                      alt=""
                      className="preview-img"
                    />
                  </div>
                ))}
              </div>

              {/* Индикаторы (точки) */}
              {isHovered && totalSlides > 1 && (
                <div className="slider-dots">
                  {screenshots.map((_, index) => (
                    <button
                      key={index}
                      className={`dot ${index === currentSlide ? 'active' : ''}`}
                      onClick={(e) => {
                        e.preventDefault();
                        goToSlide(index);
                      }}
                      aria-label={`Go to slide ${index + 1}`}
                    />
                  ))}
                </div>
              )}

              {/* Стрелка назад */}
              {isHovered && totalSlides > 1 && currentSlide > 0 && (
                <button
                  className="slider-arrow prev"
                  onClick={(e) => {
                    e.preventDefault();
                    goPrev();
                  }}
                  aria-label="Previous slide"
                >
                  <span className="material-symbols-rounded">
                    arrow_back
                  </span>
                </button>
              )}

              {/* Стрелка вперед */}
              {isHovered && totalSlides > 1 && currentSlide < totalSlides - 1 && (
                <button
                  className="slider-arrow next"
                  onClick={(e) => {
                    e.preventDefault();
                    goNext();
                  }}
                  aria-label="Next slide"
                >
                  <span className="material-symbols-rounded">
                    arrow_forward
                  </span>
                </button>
              )}
            </div>
          ) : (
            <div className="placeholder">No screenshots</div>
          )}
        </div>

        {/* Нижний блок - информация о приложении */}
        <div className="app-info-container">
          <div className="app-info-row">
            <img src={app.logo_url} alt="" className="app-card-logo" />
            <div className="app-text-container">
              <h3 className="app-name">{app.name}</h3>
              <p className="app-desc">{app.description}</p>
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
};

export default AppCard;