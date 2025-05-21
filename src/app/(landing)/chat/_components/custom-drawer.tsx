"use client";

import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";
import { useDrawer } from "./drawer-context";

interface CustomDrawerProps {
  isOpen: boolean;
  children: ReactNode;
  className?: string;
}

/**
 * A custom drawer component that slides up from behind the input
 * without using the shadcn Drawer component
 */
export function CustomDrawer({
  isOpen,
  children,
  className,
}: CustomDrawerProps) {
  // Use ref to track drawer state
  const drawerRef = useRef<HTMLDivElement>(null);
  const { closeDrawer } = useDrawer();

  // Force update the drawer state when isOpen changes
  useEffect(() => {
    if (drawerRef.current) {
      if (!isOpen) {
        drawerRef.current.style.height = "0";
      } else {
        drawerRef.current.style.height = "200px";
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      ref={drawerRef}
      className={cn(
        "fixed right-1/2 bottom-18 w-full max-w-xl translate-x-1/2 transition-all duration-300 ease-in-out",
        isOpen ? "h-[200px]" : "h-0",
        className
      )}
    >
      <div className="h-full overflow-hidden rounded-t-2xl bg-white relative">
        {/* Emergency close button */}
        <Button
          size="sm"
          variant="ghost"
          className="absolute top-2 right-2 rounded-full p-2 h-6 w-6"
          onClick={() => {
            if (drawerRef.current) {
              drawerRef.current.style.height = "0";
            }
            closeDrawer();
          }}
        >
          ✕
        </Button>
        <div className="p-10">{children}</div>
      </div>
    </div>
  );
}

/**
 * Content for the registration drawer with state management
 */
export function AskRegistrationDrawerContent({
  onConfirmRegistration,
}: {
  onClose?: () => void;
  onConfirmRegistration?: () => void;
}) {
  const {
    closeDrawer,
    isWaitingForEmail,
    setIsWaitingForEmail,
    registrationSuccess,
  } = useDrawer();

  // Handle Yes button click
  const handleYesClick = () => {
    setIsWaitingForEmail(true);
    if (onConfirmRegistration) {
      onConfirmRegistration();
    }
  };

  // Handle No button click - with multiple approaches to ensure it works
  const handleNoClick = () => {
    // First use the context method
    closeDrawer();

    // Delay and try again to be extra sure
    setTimeout(() => {
      closeDrawer();

      // Also directly set CSS to hide it (backup approach)
      const drawerElement = document.querySelector('[class*="bottom-18"]');
      if (drawerElement) {
        (drawerElement as HTMLElement).style.height = "0";
      }
    }, 100);
  };

  // Show success message if email was saved
  if (registrationSuccess) {
    return (
      <>
        <h2 className="mb-4 text-center font-semibold text-lg">
          Merci de t'être inscrit !
        </h2>
        <p className="text-center text-sm text-gray-500">
          Tu recevras bientôt des nouvelles de Neiji
        </p>
      </>
    );
  }

  // Show email prompt if user clicked Yes
  if (isWaitingForEmail) {
    return (
      <>
        <h2 className="mb-4 text-center font-semibold text-lg">
          Entre ton email dans le champ ci-dessous
        </h2>
        <p className="text-center text-sm text-gray-500">
          Utilise la barre de message pour saisir ton email
        </p>
      </>
    );
  }

  // Show initial registration question
  return (
    <>
      <h2 className="mb-4 text-center font-semibold text-lg">
        Veux-tu t'inscrire ?
      </h2>
      <div className="flex justify-center gap-4">
        <Button
          className="bg-orange-400 text-white hover:bg-orange-500"
          onClick={handleYesClick}
        >
          Oui
        </Button>
        <Button
          className="bg-orange-400 text-white hover:bg-orange-500"
          onClick={handleNoClick}
        >
          Non
        </Button>
      </div>
    </>
  );
}
