"use client";
import React from 'react';
import { motion, AnimatePresence, Variants, Transition } from 'framer-motion';
import styles from './loader.module.css';

interface LoaderProps {
  isLoading: boolean;
}

const Loader: React.FC<LoaderProps> = ({ isLoading }) => {
  const dotCount = 8; // Dots from 4 corners and 4 sides
  const radius = 60; // Radius for central ring formation

  const dotVariants: Variants = {
    initial: (index: number) => {
      const isCorner = index % 2 === 0;
      const offset = isCorner ? 1000 : 700; // Corners go further out
      return {
        x: (index % 2 === 0 ? (index < 4 ? -offset : offset) : 0),
        y: (index < 2 || index >= 6 ? -offset : index >= 2 && index < 6 ? offset : 0),
        opacity: 0,
        scale: 0.3,
        rotate: 0,
      };
    },
    animate: (index: number) => ({
      x: Math.cos((index / dotCount) * 2 * Math.PI) * radius,
      y: Math.sin((index / dotCount) * 2 * Math.PI) * radius,
      opacity: 1,
      scale: 1,
      transition: {
        duration: 1.5,
        ease: [0.68, -0.55, 0.265, 1.55], // Elastic easing for convergence
        delay: index * 0.1,
      } as Transition,
    }),
    ring: (index: number) => ({
      x: Math.cos((index / dotCount) * 2 * Math.PI + Math.PI / 4) * radius,
      y: Math.sin((index / dotCount) * 2 * Math.PI + Math.PI / 4) * radius,
      scale: [1, 1.4, 1], // Subtle scale pulse
      opacity: [1, 0.6, 1], // Subtle opacity pulse
      rotate: [0, 360], // Individual dot spin on its own axis
      transition: {
        duration: 1.5, // Ring rotation speed
        rotate: {
          duration: 1, // Faster individual spin (1s per 360°)
          repeat: Infinity,
          repeatType: 'loop',
          ease: 'linear', // Smooth spin
        },
        x: { duration: 1.5, repeat: Infinity, repeatType: 'loop', ease: 'easeInOut' },
        y: { duration: 1.5, repeat: Infinity, repeatType: 'loop', ease: 'easeInOut' },
        scale: { duration: 1.5, repeat: Infinity, repeatType: 'loop', ease: 'easeInOut' },
        opacity: { duration: 1.5, repeat: Infinity, repeatType: 'loop', ease: 'easeInOut' },
      } as Transition,
    }),
    exit: {
      opacity: 0,
      scale: 0.3,
      x: 0,
      y: 0,
      transition: {
        duration: 0.8,
        ease: 'easeOut',
      } as Transition,
    },
  };

  const coreVariants: Variants = {
    initial: { scale: 0, opacity: 0 },
    animate: {
      scale: [1, 1.3, 1], // Pronounced pulse
      opacity: 1,
      transition: {
        duration: 1.5, // Sync with ring rotation
        repeat: Infinity,
        ease: 'easeInOut',
      } as Transition,
    },
    exit: { scale: 0, opacity: 0, transition: { duration: 0.8 } },
  };

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          className={styles.loaderContainer}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className={styles.dotWrapper}>
            {Array.from({ length: dotCount }).map((_, index) => (
              <motion.div
                key={index}
                className={styles.dot}
                custom={index}
                variants={dotVariants}
                initial="initial"
                animate={['animate', 'ring']}
                exit="exit"
              />
            ))}
          </div>
          <motion.div
            className={styles.loaderCore}
            variants={coreVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Loader;