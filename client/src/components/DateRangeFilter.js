import React from "react";

const DateRangeFilter = ({ options, onChange }) => {
  const [active, setActive] = React.useState("All");

  const handleClick = (option) => {
    setActive(option);
    onChange(option);
  };

  return (
    <div className="flex flex-wrap gap-2 bg-gray-100 p-1 rounded-lg">
      {options.map((option) => (
        <button
          key={option}
          onClick={() => handleClick(option)}
          className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${
            active === option
              ? "bg-white text-brand-primary shadow-sm"
              : "text-gray-500 hover:text-gray-700 hover:bg-gray-200/50"
          }`}
        >
          {option}
        </button>
      ))}
    </div>
  );
};

export default DateRangeFilter;
