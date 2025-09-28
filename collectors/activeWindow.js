import activeWindow from 'active-window';

/**
 * Gets the current active window title and application name using the active-window library.
 * This function runs in the secure Electron Main Process.
 * @returns {Promise<{title: string, app: string}>} The active window information.
 */
export async function getActiveWindowInfo() {
  return new Promise((resolve) => {
    // activeWindow provides information via callback
    activeWindow((window) => {
      if (window) {
        // activeWindow returns different structures on different OS (e.g., app name vs process name)
        const info = {
          title: window.title || 'Unknown Title',
          app: window.app || window.process || 'Unknown Application',
        };
        resolve(info);
      } else {
        resolve({ title: 'Desktop', app: 'Operating System' });
      }
    }, 100, 1); // Only check once

    // Fallback in case activeWindow fails to find a window
    setTimeout(() => {
        resolve({ title: 'Inactive/Locked', app: 'System' });
    }, 500);
  });
}
