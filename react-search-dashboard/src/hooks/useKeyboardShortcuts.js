import { useEffect } from 'react';

/**
 * Custom hook for keyboard shortcuts
 * @param {Object} shortcuts - Object mapping key combinations to callbacks
 * Example: { 'ctrl+k': () => focusSearch(), 'ctrl+s': () => save() }
 */
export const useKeyboardShortcuts = (shortcuts) => {
  useEffect(() => {
    const handleKeyDown = (event) => {
      // Build key combination string
      const keys = [];
      if (event.ctrlKey || event.metaKey) keys.push('ctrl');
      if (event.shiftKey) keys.push('shift');
      if (event.altKey) keys.push('alt');
      keys.push(event.key.toLowerCase());
      
      const combination = keys.join('+');
      
      // Check if this combination has a handler
      if (shortcuts[combination]) {
        event.preventDefault();
        shortcuts[combination](event);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);
};

/**
 * Hook specifically for search page shortcuts
 */
export const useSearchShortcuts = ({
  onSearch,
  onClear,
  onSave,
  onFocusSearch,
  onExport
}) => {
  useKeyboardShortcuts({
    'ctrl+enter': onSearch,
    'ctrl+r': onClear,
    'ctrl+s': onSave,
    'ctrl+k': onFocusSearch,
    'ctrl+e': onExport,
    'escape': (e) => {
      // Close any open dropdowns or modals
      if (document.activeElement) {
        document.activeElement.blur();
      }
    }
  });
};
