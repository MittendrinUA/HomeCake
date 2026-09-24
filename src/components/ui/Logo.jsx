import React from 'react';

const Logo = ({ size = 24, textColor = "#E0BFB8", iconColor = "#E0BFB8", className = "", showText = true }) => {
  return (
    <div className={`flex items-center justify-center gap-2 ${className}`}>
      <div style={{ width: size, height: size, flexShrink: 0 }}>
        <svg viewBox="0 0 24 24" fill="none" stroke={iconColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" transform="rotate(45)">
          <path d="M12 22v-5"/>
          <path d="M9 17h6"/>
          <path d="M12 17c-3-2-4.5-5-4.5-8.5C7.5 4 12 2 12 2s4.5 2 4.5 6.5C16.5 12 15 15 12 17z"/>
          <path d="M12 17c-1.5-2-2-5-2-8.5C10 5 12 3 12 3s2 2 2 5.5C14 12 13.5 15 12 17z"/>
        </svg>
      </div>
      {showText && (
        <span style={{ fontFamily: '"Great Vibes", cursive', color: textColor, fontSize: size * 1.5, lineHeight: 0.8, fontWeight: 'normal', paddingBottom: size * 0.1 }}>
          Whisked
        </span>
      )}
    </div>
  );
};

export default Logo;
