import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface StatePopupProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'success' | 'error';
  message: string;
}

export function StatePopup({ isOpen, onClose, type, message }: StatePopupProps) {
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className="fixed inset-0 flex items-center justify-center z-50"
          onClick={onClose}
        >
          <motion.div
            className="bg-white rounded-lg shadow-lg p-6 max-w-sm w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center">
              <div className={`mb-4 ${type === 'success' ? 'text-green-500' : 'text-red-500'}`}>
                {type === 'success' ? (
                  <svg
                    className="w-12 h-12 mx-auto"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-12 h-12 mx-auto"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                )}
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {type === 'success' ? 'Succès !' : 'Erreur !'}
              </h3>
              <p className="text-gray-600">
                {message}
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

