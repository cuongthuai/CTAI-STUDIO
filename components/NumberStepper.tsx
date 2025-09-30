import React from 'react';

interface NumberStepperProps {
  value: number;
  onChange: (newValue: number) => void;
  min?: number;
  max?: number;
  label: string;
  disabled?: boolean;
}

export const NumberStepper: React.FC<NumberStepperProps> = ({ value, onChange, min = 1, max = 4, label, disabled = false }) => {
  const handleIncrement = () => {
    if (value < max) {
      onChange(value + 1);
    }
  };

  const handleDecrement = () => {
    if (value > min) {
      onChange(value - 1);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let newValue = parseInt(e.target.value, 10);
    if (isNaN(newValue)) {
      newValue = min;
    }
    if (newValue < min) newValue = min;
    if (newValue > max) newValue = max;
    onChange(newValue);
  };
  
  const decrementButtonStyles = (value <= min || disabled) ? {...styles.button, ...styles.buttonDisabled} : styles.button;
  const incrementButtonStyles = (value >= max || disabled) ? {...styles.button, ...styles.buttonDisabled} : styles.button;

  return (
    <div style={{...styles.container, ...(disabled ? styles.containerDisabled : {})}}>
      <label htmlFor="number-stepper-input" style={styles.label}>{label}</label>
      <div style={styles.stepper}>
        <button onClick={handleDecrement} disabled={value <= min || disabled} style={decrementButtonStyles} aria-label="Giảm số lượng">-</button>
        <input 
          id="number-stepper-input" 
          type="number" 
          value={value} 
          onChange={handleInputChange} 
          min={min} 
          max={max} 
          style={styles.input} 
          aria-label={label}
          disabled={disabled}
        />
        <button onClick={handleIncrement} disabled={value >= max || disabled} style={incrementButtonStyles} aria-label="Tăng số lượng">+</button>
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    transition: 'opacity 0.2s ease-in-out',
  },
  containerDisabled: {
    opacity: 0.6,
    cursor: 'not-allowed',
  },
  label: {
    fontSize: '1.1rem',
    fontWeight: 500,
    color: '#D1D5DB',
  },
  stepper: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: '#374151',
    borderRadius: '0.5rem',
    border: '1px solid #4B5563',
  },
  button: {
    background: 'transparent',
    border: 'none',
    color: '#F9FAFB',
    fontSize: '1.5rem',
    fontWeight: 'bold',
    cursor: 'pointer',
    width: '44px',
    height: '44px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background-color 0.2s',
  },
  buttonDisabled: {
    cursor: 'not-allowed',
    color: '#9CA3AF',
  },
  input: {
    width: '50px',
    height: '44px',
    textAlign: 'center',
    border: 'none',
    borderLeft: '1px solid #4B5563',
    borderRight: '1px solid #4B5563',
    background: 'transparent',
    color: '#F9FAFB',
    fontSize: '1.1rem',
    fontWeight: 500,
    WebkitAppearance: 'none',
    margin: 0,
    MozAppearance: 'textfield' as const,
  },
};
