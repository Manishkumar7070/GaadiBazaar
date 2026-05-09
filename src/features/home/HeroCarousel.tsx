import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const CAR_IMAGES = [
  {
    url: '/src/assets/images/regenerated_image_1778243138905.png',
    title: 'Range Rover Sport',
    subtitle: 'The pinnacle of luxury SUVs'
  },
  {
    url: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?q=80&w=1600&auto=format&fit=crop',
    title: 'BMW M8 Competition',
    subtitle: 'Uncompromising performance'
  },
  {
    url: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=1600&auto=format&fit=crop',
    title: 'Porsche 911 GT3',
    subtitle: 'Born on the racetrack'
  },
  {
    url: 'https://images.unsplash.com/photo-1583121274602-3e2820c69888?q=80&w=1600&auto=format&fit=crop',
    title: 'Audi RS e-tron GT',
    subtitle: 'Sustainable future of speed'
  }
];

const HeroCarousel = () => {
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);

  const nextSlide = useCallback(() => {
    setDirection(1);
    setCurrentIndex((prevIndex) => (prevIndex + 1) % CAR_IMAGES.length);
  }, []);

  const prevSlide = useCallback(() => {
    setDirection(-1);
    setCurrentIndex((prevIndex) => (prevIndex - 1 + CAR_IMAGES.length) % CAR_IMAGES.length);
  }, []);

  useEffect(() => {
    const timer = setInterval(nextSlide, 6000);
    return () => clearInterval(timer);
  }, [nextSlide]);

  const variants: any = {
    enter: (direction: number) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0,
      scale: 1.1
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.8,
        ease: [0.16, 1, 0.3, 1]
      }
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 1000 : -1000,
      opacity: 0,
      scale: 0.9,
      transition: {
        duration: 0.8,
        ease: [0.16, 1, 0.3, 1]
      }
    })
  };

  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* Background Images */}
      <AnimatePresence initial={false} custom={direction}>
        <motion.div
          key={currentIndex}
          custom={direction}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          className="absolute inset-0"
        >
          <div className="absolute inset-0 bg-black/40 z-10" />
          <img
            src={CAR_IMAGES[currentIndex].url}
            alt={CAR_IMAGES[currentIndex].title}
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          
          {/* Content Overlay */}
          <div className="absolute bottom-16 sm:bottom-20 left-6 sm:left-12 md:left-24 z-20 max-w-[80%] sm:max-w-2xl text-white">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="space-y-1 sm:space-y-2"
            >
              <p className="text-primary font-black uppercase tracking-[0.2em] sm:tracking-[0.3em] text-[10px] sm:text-xs">Featured Legend</p>
              <h2 className="text-2xl sm:text-4xl md:text-6xl font-[1000] tracking-tighter leading-none italic uppercase">
                {CAR_IMAGES[currentIndex].title}
              </h2>
              <p className="hidden sm:block text-white/60 text-sm sm:text-lg font-medium italic">
                {CAR_IMAGES[currentIndex].subtitle}
              </p>
              
              <div className="pt-2 sm:pt-6">
                <Button 
                  onClick={() => navigate('/buy')}
                  className="h-10 sm:h-14 px-4 sm:px-8 bg-primary hover:bg-primary/90 text-slate-950 rounded-xl sm:rounded-2xl font-black uppercase tracking-widest transition-all hover:scale-105 active:scale-95 group shadow-xl shadow-primary/20"
                >
                  <ArrowRight size={16} className="sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation Controls */}
      <div className="absolute inset-0 z-30 flex items-center justify-between px-4 sm:px-6 pointer-events-none">
        <Button
          variant="ghost"
          size="icon"
          onClick={prevSlide}
          className="w-10 h-10 sm:w-14 sm:h-14 rounded-full bg-black/20 sm:bg-white/10 backdrop-blur-md text-white border border-white/20 hover:bg-white/20 pointer-events-auto transition-all"
        >
          <ChevronLeft size={18} className="sm:w-6 sm:h-6" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={nextSlide}
          className="w-10 h-10 sm:w-14 sm:h-14 rounded-full bg-black/20 sm:bg-white/10 backdrop-blur-md text-white border border-white/20 hover:bg-white/20 pointer-events-auto transition-all"
        >
          <ChevronRight size={18} className="sm:w-6 sm:h-6" />
        </Button>
      </div>

      {/* Pagination Dots */}
      <div className="absolute bottom-8 sm:bottom-12 left-1/2 -translate-x-1/2 z-30 flex gap-2 sm:gap-3">
        {CAR_IMAGES.map((_, index) => (
          <button
            key={index}
            onClick={() => {
              setDirection(index > currentIndex ? 1 : -1);
              setCurrentIndex(index);
            }}
            className={cn(
              "h-1 sm:h-1.5 rounded-full transition-all duration-500",
              currentIndex === index ? "w-6 sm:w-8 bg-primary" : "w-1.5 sm:w-2 bg-white/40 hover:bg-white/60"
            )}
          />
        ))}
      </div>
    </div>
  );
};

export default HeroCarousel;
