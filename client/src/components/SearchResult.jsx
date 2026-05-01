import { Link } from 'react-router-dom';
import './SearchResult.css';

const SearchResult = ({ screenshot }) => {
  return (
    <Link to={`/app/${screenshot.apps?.id}`} className="search-result-link">
      <article className="search-result">
        <div className="screenshot-wrap">
          <img src={screenshot.image_url} alt="" className="screenshot-img" />
        </div>
        <div className="app-info">
          <div className="app-info-text">
            <span className="app-name">{screenshot.apps?.name}</span>
            {screenshot.apps?.description && (
              <p className="app-description">{screenshot.apps.description}</p>
            )}
          </div>
        </div>
      </article>
    </Link>
  );
};

export default SearchResult;