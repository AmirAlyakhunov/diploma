import './SegmentBoxTag.css';

const SegmentBoxTag = ({ label, active, onClick }) => {
  return (
    <button
      className={`segmentbox-tag ${active ? 'active' : ''}`}
      onClick={onClick}
      type="button"
    >
      {label}
    </button>
  );
};

export default SegmentBoxTag;