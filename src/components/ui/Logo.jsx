import React from 'react';

const Logo = ({ size = 24, textColor = "#F4EFEA", iconColor = "#D4AF37", className = "", showText = true }) => {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div style={{ 
        fontFamily: "'Outfit', sans-serif",
        fontSize: size, 
        fontWeight: 800,
        letterSpacing: '-0.5px',
        display: 'flex'
      }}>
        {showText ? (
          <>
            <span style={{ color: textColor }}>Whisk</span>
            <span style={{ color: iconColor }}>ed</span>
          </>
        ) : (
          <>
            <span style={{ color: textColor }}>W</span>
            <span style={{ color: iconColor }}>e</span>
          </>
        )}
      </div>
    </div>
  );
};

export default Logo;
