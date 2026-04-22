import { Link } from 'react-router-dom';
import './AppCard.css';

const AppCard = ({ app }) => {
  const previewImage = app.screenshots?.[0]?.image_url;

  return (
    <Link to={`/app/${app.id}`} className="app-card-link">
      <article className="app-card">
        {/* Верхний блок - изображение */}
        <div className="preview-wrap">
          {previewImage ? (
            <img src={previewImage} alt="" className="preview-img" />
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