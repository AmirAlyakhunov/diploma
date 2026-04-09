import { Link } from 'react-router-dom';
import './AppCard.css';

const AppCard = ({ app }) => {
  const previewImage = app.screenshots?.[0]?.image_url;

  return (
    <Link to={`/app/${app.id}`} className="app-card-link">
      <article className="app-card">
        <div className="preview-wrap">
          {previewImage ? (
            <img src={previewImage} alt="" className="preview-img" />
          ) : (
            <div className="placeholder">No screenshots</div>
          )}
        </div>

        <div className="app-info">
          <div className="app-main-row">
            <img src={app.logo_url} alt="" className="app-logo" />
            <h3 className="app-name">{app.name}</h3>
          </div>
          <p className="app-desc">{app.description}</p>
        </div>
      </article>
    </Link>
  );
};

export default AppCard;