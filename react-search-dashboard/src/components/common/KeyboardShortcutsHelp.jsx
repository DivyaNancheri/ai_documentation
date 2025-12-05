import { useState } from 'react';
import './KeyboardShortcutsHelp.css';

const KeyboardShortcutsHelp = () => {
  const [isOpen, setIsOpen] = useState(false);

  const shortcuts = [
    { keys: ['Ctrl', 'Enter'], description: 'Execute search' },
    { keys: ['Ctrl', 'R'], description: 'Clear search form' },
    { keys: ['Ctrl', 'S'], description: 'Save current search' },
    { keys: ['Ctrl', 'K'], description: 'Focus search field' },
    { keys: ['Ctrl', 'E'], description: 'Export results' },
    { keys: ['Esc'], description: 'Close dialogs/dropdowns' },
    { keys: ['Tab'], description: 'Navigate between fields' },
  ];

  return (
    <>
      <button
        className="shortcuts-help-btn"
        onClick={() => setIsOpen(true)}
        title="Keyboard shortcuts"
        aria-label="Show keyboard shortcuts"
      >
        ⌨️
      </button>

      {isOpen && (
        <div className="shortcuts-modal-overlay" onClick={() => setIsOpen(false)}>
          <div className="shortcuts-modal" onClick={(e) => e.stopPropagation()}>
            <div className="shortcuts-header">
              <h3>⌨️ Keyboard Shortcuts</h3>
              <button
                className="shortcuts-close"
                onClick={() => setIsOpen(false)}
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <div className="shortcuts-content">
              {shortcuts.map((shortcut, index) => (
                <div key={index} className="shortcut-item">
                  <div className="shortcut-keys">
                    {shortcut.keys.map((key, i) => (
                      <span key={i}>
                        <kbd>{key}</kbd>
                        {i < shortcut.keys.length - 1 && <span className="key-separator">+</span>}
                      </span>
                    ))}
                  </div>
                  <div className="shortcut-description">{shortcut.description}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default KeyboardShortcutsHelp;
