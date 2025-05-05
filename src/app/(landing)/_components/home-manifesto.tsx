"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { manifestoItems } from "../_data/manifestoItems";

export function HomeManifesto() {
  const [activeIndex, setActiveIndex] = useState(0); // Start with 01 selected

  const handleItemClick = (index: number) => {
    setActiveIndex(index);
  };

  // Auto-rotate through manifesto items every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % manifestoItems.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const renderNumberNavigation = () => {
    return (
      <div className="flex space-x-4 md:space-x-6 mb-8 justify-center md:justify-start">
        {manifestoItems.map((_, index) => {
          const number = (index + 1).toString().padStart(2, "0");
          const isActive = index === activeIndex;
          
          return (
            <button
              key={index}
              onClick={() => handleItemClick(index)}
              className={`text-lg md:text-xl transition-all duration-300 ${
                isActive 
                  ? "text-[#FF7043] font-bold" 
                  : "text-gray-500 hover:text-gray-300"
              }`}
              aria-label={`View manifesto point ${index + 1}`}
            >
              {number}
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <div className="w-full bg-white py-16 md:py-24">
      <div className="container mx-auto px-4 md:px-8 max-w-5xl h-[500px] md:h-[600px] flex flex-col relative">
        <h2 className="text-4xl md:text-5xl font-bold text-center mb-8 text-[#6B4F2B]">
          Our Manifesto
        </h2>
        <div className="flex flex-col h-full justify-between">
          {renderNumberNavigation()}
          
          <AnimatePresence mode="wait">
            <motion.div
              key={activeIndex}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="mt-6"
            >
              <div className="flex items-start gap-4">
                {manifestoItems[activeIndex]?.icon && (() => {
                  const Icon = manifestoItems[activeIndex].icon;
                  return (
                    <div className="flex-shrink-0 bg-[#FF7043]/10 rounded-full p-3">
                      <Icon className="h-8 w-8 text-[#FF7043]" />
                    </div>
                  );
                })()}
                <div>
                  <div className="text-sm font-medium text-[#FF7043]"></div>
                  <h3 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 text-[#6B4F2B]">
                    {manifestoItems[activeIndex]?.title || ""}
                  </h3>
                  <p className="text-lg md:text-xl whitespace-pre-line max-w-3xl text-[#6B4F2B]/80">
                    {manifestoItems[activeIndex]?.description || ""}
                  </p>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
          
          {/* Progress indicator - only visible on desktop */}
          <div className="mt-auto pb-6 hidden md:block">
            <div className="w-32 h-1 bg-[#FF7043] rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
