import React from 'react';

type TooltipProps = {
  text: string;
  position?: 'right' | 'left';
};

const Tooltip: React.FC<TooltipProps> = ({ text, position = 'right' }) => {
  let tooltipPositionClasses = '';
  let arrowPositionClasses = '';

  switch (position) {
    case 'right':
      tooltipPositionClasses = 'left-full top-1/2 transform -translate-y-1/2 ml-6';
      arrowPositionClasses = 'left-0 top-1/2 transform -translate-y-1/2 -ml-[0.78rem] border-l border-b';
      break;
    case 'left':
      tooltipPositionClasses = 'right-full top-1/2 transform -translate-y-1/2 mr-10';
      arrowPositionClasses = 'right-0 top-1/2 transform -translate-y-1/2 -mr-[0.78rem] border-r border-t';
      break;
    default:
      break;
  }

  return (
    <div className="relative group">
      <div className={`absolute z-40 hidden px-1 min-w-48 max-w-56 text-sm text-gray-darker border border-gray-light bg-white shadow-lg opacity-0 group-hover:block group-hover:opacity-100 transition-opacity duration-300 ${tooltipPositionClasses}`}>
        <div className="w-full h-full p-1.5 text-center">{text}</div>
        <div className={`absolute w-6 h-6 bg-white transform rotate-45 border-gray-light ${arrowPositionClasses}`}></div>
      </div>
    </div>
  );
};

export default Tooltip;
