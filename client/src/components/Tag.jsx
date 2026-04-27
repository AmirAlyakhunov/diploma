import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Tag.css';

const Tag = ({ 
  label, 
  type = 'default', 
  size = 'medium', 
  href, 
  onClick, 
  className = '', 
  children,
  isResource = false,
  resourceLinks = []
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleClick = (e) => {
    if (isResource) {
      e.preventDefault();
      setDropdownOpen(!dropdownOpen);
    } else if (onClick) {
      onClick(e);
    } else if (href) {
      navigate(href);
    }
  };

  const tagClasses = `tag tag--${type} tag--${size} ${className} ${isResource ? 'tag--resources' : ''}`;

  // For resource tags, we render a button with dropdown
  if (isResource) {
    return (
      <div className="tag-wrapper" ref={dropdownRef}>
        <button className={tagClasses} onClick={handleClick}>
          {label || children}
          <span className="material-symbols-rounded" style={{ fontSize: '28px' }}>
            {dropdownOpen ? 'arrow_drop_up' : 'arrow_drop_down'}
          </span>
        </button>
        
        {dropdownOpen && (
          <div className="tag-dropdown">
            {resourceLinks.map((link, index) => (
              <a
                key={index}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="tag-dropdown-item"
              >
                <span className="tag-dropdown-item-icon material-symbols-rounded">
                  {link.icon || 'link'}
                </span>
                <span className="tag-dropdown-item-label">{link.label}</span>
              </a>
            ))}
          </div>
        )}
      </div>
    );
  }

  // For regular tags, render as Link if href is provided, otherwise as button
  if (href) {
    return (
      <Link to={href} className={tagClasses}>
        {label || children}
      </Link>
    );
  }

  return (
    <button className={tagClasses} onClick={handleClick}>
      {label || children}
    </button>
  );
};

export default Tag;