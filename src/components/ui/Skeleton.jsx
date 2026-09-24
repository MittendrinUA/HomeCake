import React from 'react';
import { motion } from 'framer-motion';

export const Skeleton = ({ className, ...props }) => {
  return (
    <motion.div
      initial={{ opacity: 0.5 }}
      animate={{ opacity: 1 }}
      transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut", repeatType: "reverse" }}
      className={`bg-[#1E1919] border border-[#2A2323] rounded-[32px] ${className}`}
      {...props}
    />
  );
};
