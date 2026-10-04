import React, { useState } from 'react';
import { motion } from 'framer-motion';

const AnimatedLoadingLogo = ({ size = 48 }) => {
  const [floating, setFloating] = useState(false);

  return (
    <motion.div 
        className="flex items-center justify-center"
        animate={floating ? { y: [0, -8, 0] } : { y: 0 }}
        transition={floating ? { repeat: Infinity, duration: 1.5, ease: "easeInOut" } : {}}
    >
      <div style={{ 
        fontFamily: "'Outfit', sans-serif",
        fontSize: size, 
        fontWeight: 800,
        letterSpacing: '-0.5px',
        display: 'flex',
        overflow: 'visible'
      }}>
        <motion.span 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
          style={{ color: "#F4EFEA" }}
        >
          Whisk
        </motion.span>
        
        <motion.span
          initial={{ x: 80, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ 
            type: "spring", 
            stiffness: 400, 
            damping: 10,
            delay: 0.15 
          }}
          onAnimationComplete={() => {
            setFloating(true);
          }}
          style={{ color: "#D4AF37" }}
        >
          ed
        </motion.span>
      </div>
    </motion.div>
  );
};

export default AnimatedLoadingLogo;
