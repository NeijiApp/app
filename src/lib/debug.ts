// Mode debug pour le système de conversation
export const DEBUG_CONVERSATION = true;

export const debugLog = (category: string, message: string, ...args: any[]) => {
  if (DEBUG_CONVERSATION) {
    console.log(`${category} ${message}`, ...args);
  }
};

export const debugError = (category: string, message: string, error: any) => {
  if (DEBUG_CONVERSATION) {
    console.error(`${category} ${message}`, error);
  }
};
