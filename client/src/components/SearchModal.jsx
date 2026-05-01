import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import './SearchModal.css';

const SearchResultItem = ({ app, onAppSelect, onSmartSearch, query, isSmartSearch }) => {
  const handleClick = () => {
    if (isSmartSearch) {
      onSmartSearch(query);
    } else {
      onAppSelect(app.id);
    }
  };

  return (
    <div className="search-result-item" onClick={handleClick}>
      {isSmartSearch ? (
        <div className="smart-search-icon">
          <span class="material-symbols-rounded">
            wand_stars
          </span>
        </div>
      ) : (
        <img src={app.logo_url} alt={app.name} className="app-avatar" />
      )}
      <div className="result-info">
        <div className="result-name">{isSmartSearch ? "Найти по-умному" : app.name}</div>
        <div className="result-description">
          {isSmartSearch ? 'Поиск по описанию и тексту на скриншоте' : (app.description || '')}
        </div>
      </div>
    </div>
  );
};

const SearchModal = ({ show, onClose, onSmartSearch }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showLoading, setShowLoading] = useState(false);
  const inputRef = useRef();
  const navigate = useNavigate();

  useEffect(() => {
    if (show && inputRef.current) {
      inputRef.current.focus();
    }
  }, [show]);

  const searchApps = useCallback(async (searchQuery) => {
    if (!searchQuery.trim()) {
      setResults([]);
      setLoading(false);
      setShowLoading(false);
      return;
    }
    
    setLoading(true);
    // Show loading indicator only after 300ms to prevent flicker
    const loadingTimeout = setTimeout(() => {
      setShowLoading(true);
    }, 300);
    
    try {
      const response = await fetch(`/search/apps?query=${encodeURIComponent(searchQuery)}&limit=10`);
      const data = await response.json();
      setResults(data);
    } catch (err) {
      console.error('Search error:', err);
      setResults([]);
    } finally {
      clearTimeout(loadingTimeout);
      setLoading(false);
      setShowLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchApps(query);
    }, 200); // debounce 200ms
    return () => clearTimeout(timeoutId);
  }, [query, searchApps]);

  // Block scroll when modal is open
  useEffect(() => {
    if (!show) return;
    
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [show]);

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!show) return null;

  return (
    <div className="search-modal-backdrop" onClick={handleBackdropClick}>
      <div className="search-modal">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Поиск"
          className="search-input"
        />
        <div className="search-results">
          {/* Always show results (previous results stay visible during loading) */}
          {results.map((app) => (
            <SearchResultItem
              key={app.id}
              app={app}
              onAppSelect={(id) => { navigate(`/app/${id}`); onClose(); }}
              onSmartSearch={onSmartSearch}
              query={query}
            />
          ))}
          
          {/* Smart search item (only when query is not empty) */}
          {query.trim() && (
            <SearchResultItem
              isSmartSearch
              onAppSelect={(id) => { navigate(`/app/${id}`); onClose(); }}
              onSmartSearch={(searchQuery) => {
                onClose();
                onSmartSearch(searchQuery);
              }}
              query={query}
            />
          )}
          
          {/* Loading indicator (only shown after delay) */}
          {showLoading && (
            <div className="loading">
              <div className="loading-spinner"></div>
              <div>Поиск...</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchModal;