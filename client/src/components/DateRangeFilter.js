import React from 'react';
import '../styles/DateRangeFilter.css';

const DateRangeFilter = ({ options, onChange }) => {
  const [active, setActive] = React.useState('All');

  const handleClick = (option) => {
    setActive(option);
    onChange(option);
  };

  return (
    <div className="date-filter-container">
      {options.map((option) => (
        <button
          key={option}
          className={`date-filter-btn ${active === option ? 'active' : ''}`}
          onClick={() => handleClick(option)}
        >
          {option}
        </button>
      ))}
    </div>
  );
};

export default DateRangeFilter;