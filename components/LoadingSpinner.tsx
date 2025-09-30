
import React from 'react';

const LoadingSpinner: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center space-y-4">
      <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-indigo-500"></div>
      <p className="text-indigo-400 font-medium">Generating brilliant ideas...</p>
    </div>
  );
};

export default LoadingSpinner;
