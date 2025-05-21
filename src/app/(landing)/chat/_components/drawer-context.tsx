"use client";

import { createContext, useContext, useState, useEffect, useRef } from "react";
import type { ReactNode } from "react";

interface DrawerContextType {
  isOpen: boolean;
  isWaitingForEmail: boolean;
  openDrawer: (isAutomatic?: boolean) => void;
  closeDrawer: () => void;
  toggleDrawer: () => void;
  setIsWaitingForEmail: (value: boolean) => void;
  isAIWriting: boolean;
  registrationSuccess: boolean;
  setRegistrationSuccess: (value: boolean) => void;
}

const DrawerContext = createContext<DrawerContextType | undefined>(undefined);

/**
 * Provider component for managing drawer state across components
 */
export function DrawerProvider({
  children,
  chatStatus,
}: {
  children: ReactNode;
  chatStatus?: "ready" | "streaming" | "submitted" | "error";
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isWaitingForEmail, setIsWaitingForEmail] = useState(false);
  const [isAutomaticOpen, setIsAutomaticOpen] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);

  // Track when the drawer was last closed
  const lastCloseTimeRef = useRef(0);

  // Check if AI is writing based on the status passed from parent
  const isAIWriting = chatStatus === "streaming" || chatStatus === "submitted";

  // Auto-close drawer if it was opened automatically
  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null;

    if (isOpen && isAutomaticOpen) {
      timeoutId = setTimeout(() => {
        setIsOpen(false);
        setIsAutomaticOpen(false);
      }, 8000); // Close after 8 seconds if opened automatically
    }

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [isOpen, isAutomaticOpen]);

  // Reset success state when drawer closes
  useEffect(() => {
    if (!isOpen && registrationSuccess) {
      // Reset the success state after a short delay so the animation completes first
      const timeoutId = setTimeout(() => {
        setRegistrationSuccess(false);
      }, 500);

      return () => clearTimeout(timeoutId);
    }
  }, [isOpen, registrationSuccess]);

  const openDrawer = (isAutomatic = false) => {
    // Only open if AI is not writing and not too soon after closing
    const timeSinceClose = Date.now() - lastCloseTimeRef.current;

    // Don't open if we just closed within the last 2 seconds
    if (timeSinceClose < 2000) {
      return;
    }

    if (!isAIWriting) {
      setIsOpen(true);
      setIsAutomaticOpen(isAutomatic);
    }
  };

  const closeDrawer = () => {
    // Record the time we closed
    lastCloseTimeRef.current = Date.now();

    // Force set all states to false to ensure closing
    setIsOpen(false);
    setIsAutomaticOpen(false);
    setIsWaitingForEmail(false);

    // Add a secondary force close after a small delay to ensure it happens
    setTimeout(() => {
      setIsOpen(false);
    }, 50);
  };

  const toggleDrawer = () => {
    // Only toggle if AI is not writing
    if (!isAIWriting) {
      if (!isOpen) {
        // Opening
        openDrawer(false);
      } else {
        // Closing
        closeDrawer();
      }
    } else if (isOpen) {
      // If AI is writing and drawer is open, close it
      closeDrawer();
    }
  };

  return (
    <DrawerContext.Provider
      value={{
        isOpen,
        isWaitingForEmail,
        openDrawer,
        closeDrawer,
        toggleDrawer,
        setIsWaitingForEmail,
        isAIWriting,
        registrationSuccess,
        setRegistrationSuccess,
      }}
    >
      {children}
    </DrawerContext.Provider>
  );
}

/**
 * Hook to use drawer context
 */
export function useDrawer(): DrawerContextType {
  const context = useContext(DrawerContext);
  if (context === undefined) {
    throw new Error("useDrawer must be used within a DrawerProvider");
  }
  return context;
}
