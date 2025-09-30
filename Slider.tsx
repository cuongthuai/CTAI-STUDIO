import React from 'react';

interface SliderProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Slider: React.FC<SliderProps> = (props) => {
  const value = Number(props.value || 0);
  const min = Number(props.min || 0);
  const max = Number(props.max || 100);
  const progress = ((value - min) / (max - min)) * 100;
  
  const sliderStyle: React.CSSProperties = {
    WebkitAppearance: 'none',
    appearance: 'none',
    width: '100%',
    height: '8px',
    background: `linear-gradient(to right, #F97316 ${progress}%, #4B5563 ${progress}%)`,
    borderRadius: '5px',
    outline: 'none',
    transition: 'opacity .2s',
  };

  return (
    <input
      type="range"
      style={sliderStyle}
      {...props}
    />
  );
};