/**
 * 🎭 NKH Restaurant Management System - Animation Variants
 * Appetite-inducing animations and micro-interactions
 */

import { Variants } from 'framer-motion';

// 🎬 Core Animation Variants
export const animationVariants = {
  // Basic entrance animations
  fadeIn: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
    transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] }
  } as Variants,

  slideIn: {
    initial: { x: -100, opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: 100, opacity: 0 },
    transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] }
  } as Variants,

  scaleIn: {
    initial: { scale: 0.8, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    exit: { scale: 0.8, opacity: 0 },
    transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] }
  } as Variants,

  // 🍽️ Food-Specific Animations
  foodHover: {
    hover: { 
      scale: 1.05, 
      boxShadow: '0 20px 40px rgba(245, 158, 11, 0.2)',
      filter: 'saturate(1.2) brightness(1.05)',
      transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] }
    },
    tap: { scale: 0.98 }
  } as Variants,

  appetiteGlow: {
    animate: {
      boxShadow: [
        '0 0 20px rgba(245, 158, 11, 0.3)',
        '0 0 30px rgba(245, 158, 11, 0.5)',
        '0 0 20px rgba(245, 158, 11, 0.3)'
      ],
      transition: { duration: 2, repeat: Infinity, ease: 'easeInOut' }
    }
  } as Variants,

  // 🛎️ Restaurant Operations
  orderPulse: {
    animate: {
      scale: [1, 1.02, 1],
      transition: { duration: 1.5, repeat: Infinity, ease: 'easeInOut' }
    }
  } as Variants,

  kitchenUrgent: {
    animate: {
      backgroundColor: [
        'rgba(239, 68, 68, 0.1)',
        'rgba(239, 68, 68, 0.2)',
        'rgba(239, 68, 68, 0.1)'
      ],
      transition: { duration: 1, repeat: Infinity }
    }
  } as Variants,

  // 📱 Mobile Touch Feedback
  touchFeedback: {
    tap: { 
      scale: 0.95,
      transition: { duration: 0.1 }
    },
    hover: {
      scale: 1.02,
      transition: { duration: 0.2 }
    }
  } as Variants,

  // 🎯 Success States
  successBounce: {
    initial: { scale: 0 },
    animate: { 
      scale: [0, 1.2, 1],
      transition: { 
        duration: 0.6, 
        times: [0, 0.6, 1],
        ease: [0.68, -0.55, 0.265, 1.55]
      }
    }
  } as Variants,

  // 🌊 Stagger Animations
  staggerContainer: {
    animate: {
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  } as Variants,

  staggerItem: {
    initial: { opacity: 0, y: 20 },
    animate: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] }
    }
  } as Variants,

  // 🎪 Page Transitions
  pageTransition: {
    initial: { opacity: 0, x: 100 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -100 },
    transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] }
  } as Variants,

  // 🔄 Loading States
  loadingSpinner: {
    animate: {
      rotate: 360,
      transition: { duration: 1, repeat: Infinity, ease: 'linear' }
    }
  } as Variants,

  loadingPulse: {
    animate: {
      opacity: [0.5, 1, 0.5],
      transition: { duration: 1.5, repeat: Infinity, ease: 'easeInOut' }
    }
  } as Variants,

  // 🎨 Background Animations
  gradientShift: {
    animate: {
      backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
      transition: { duration: 3, repeat: Infinity, ease: 'linear' }
    }
  } as Variants,

  // 🍳 Kitchen Timer Animation
  timerTick: {
    animate: {
      scale: [1, 1.1, 1],
      transition: { duration: 1, repeat: Infinity }
    }
  } as Variants,

  // 🛒 Cart Animations
  addToCart: {
    initial: { scale: 1, rotate: 0 },
    animate: { 
      scale: [1, 1.2, 1],
      rotate: [0, 10, -10, 0],
      transition: { duration: 0.5, ease: [0.68, -0.55, 0.265, 1.55] }
    }
  } as Variants,

  // 🎊 Celebration Animation
  celebration: {
    animate: {
      y: [0, -20, 0],
      rotate: [0, 5, -5, 0],
      scale: [1, 1.1, 1],
      transition: { 
        duration: 0.8, 
        repeat: 2,
        ease: [0.68, -0.55, 0.265, 1.55]
      }
    }
  } as Variants,
};

// 🎯 Animation Presets for Different Components
export const componentAnimations = {
  button: {
    whileHover: { scale: 1.02 },
    whileTap: { scale: 0.98 },
    transition: { duration: 0.2 }
  },

  card: {
    whileHover: { 
      y: -4,
      boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)'
    },
    transition: { duration: 0.3 }
  },

  foodCard: {
    whileHover: { 
      scale: 1.03,
      boxShadow: '0 20px 40px rgba(245, 158, 11, 0.2)',
      filter: 'saturate(1.2)'
    },
    transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] }
  },

  modal: {
    initial: { opacity: 0, scale: 0.9 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.9 },
    transition: { duration: 0.3 }
  },

  drawer: {
    initial: { x: '100%' },
    animate: { x: 0 },
    exit: { x: '100%' },
    transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] }
  },

  notification: {
    initial: { opacity: 0, y: -50, scale: 0.3 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: -50, scale: 0.3 },
    transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] }
  }
};

// 🌊 Spring Configurations
export const springConfigs = {
  gentle: { type: 'spring', stiffness: 120, damping: 14 },
  wobbly: { type: 'spring', stiffness: 180, damping: 12 },
  stiff: { type: 'spring', stiffness: 400, damping: 30 },
  slow: { type: 'spring', stiffness: 60, damping: 15 },
  appetite: { type: 'spring', stiffness: 200, damping: 20 },
};

// 🎭 Custom Easing Functions
export const easingFunctions = {
  appetite: [0.16, 1, 0.3, 1] as const,
  bounce: [0.68, -0.55, 0.265, 1.55] as const,
  smooth: [0.4, 0, 0.2, 1] as const,
  sharp: [0.4, 0, 1, 1] as const,
  elastic: [0.68, -0.55, 0.265, 1.55] as const,
};

// 🎪 Complex Animation Sequences
export const animationSequences = {
  orderComplete: {
    initial: { scale: 0, opacity: 0 },
    animate: {
      scale: [0, 1.2, 1],
      opacity: [0, 1, 1],
      rotate: [0, 360, 360],
      transition: {
        duration: 1.2,
        times: [0, 0.6, 1],
        ease: [0.68, -0.55, 0.265, 1.55]
      }
    }
  },

  kitchenAlert: {
    animate: {
      scale: [1, 1.05, 1],
      backgroundColor: [
        'rgba(239, 68, 68, 0.1)',
        'rgba(239, 68, 68, 0.3)',
        'rgba(239, 68, 68, 0.1)'
      ],
      transition: {
        duration: 0.8,
        repeat: Infinity,
        ease: 'easeInOut'
      }
    }
  },

  loyaltyReward: {
    initial: { scale: 0, rotate: -180 },
    animate: {
      scale: [0, 1.3, 1],
      rotate: [-180, 0, 0],
      transition: {
        duration: 0.8,
        ease: [0.68, -0.55, 0.265, 1.55]
      }
    }
  }
};

// 🎯 Utility Functions
export const createStaggerAnimation = (delay: number = 0.1) => ({
  animate: {
    transition: {
      staggerChildren: delay,
      delayChildren: 0.2
    }
  }
});

export const createFadeInUp = (delay: number = 0) => ({
  initial: { opacity: 0, y: 20 },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: { 
      delay,
      duration: 0.4, 
      ease: [0.16, 1, 0.3, 1] 
    }
  }
});

export const createScaleIn = (delay: number = 0) => ({
  initial: { scale: 0.8, opacity: 0 },
  animate: { 
    scale: 1, 
    opacity: 1,
    transition: { 
      delay,
      duration: 0.3, 
      ease: [0.16, 1, 0.3, 1] 
    }
  }
});
