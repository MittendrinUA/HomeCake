import React from 'react';

const Logo = ({ size = 24, textColor = "#E0BFB8", iconColor = "#E0BFB8", className = "", showText = true }) => {
  return (
    <div className={`flex items-center justify-center gap-2 ${className}`}>
      <div style={{ 
        flexShrink: 0, 
        fontFamily: '"Great Vibes", cursive', 
        color: iconColor, 
        fontSize: size * 2, 
        lineHeight: 0.8, 
        fontWeight: 'normal',
        paddingBottom: size * 0.1
      }}>
        W
      </div>
      {showText && (
        <span style={{ fontFamily: '"Great Vibes", cursive', color: textColor, fontSize: size * 1.5, lineHeight: 0.8, fontWeight: 'normal', paddingBottom: size * 0.1, marginLeft: '-0.3rem' }}>
          hisked
        </span>
      )}
    </div>
  );
};

export default Logo;
