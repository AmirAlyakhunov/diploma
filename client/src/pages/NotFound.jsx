import { Link } from 'react-router-dom';
import './NotFound.css';

const NotFound = ({ message = 'Страница не найдена' }) => {
  return (
    <div className="not-found">
      <div className="not-found-content">
        <div className="not-found-emoji">
          ╮ (. ❛ ᴗ ❛.) ╭
        </div>
        <div className="not-found-text">
          {message}
        </div>
        <Link to="/" className="not-found-button">
          На главную
        </Link>
      </div>
    </div>
  );
};

export default NotFound;