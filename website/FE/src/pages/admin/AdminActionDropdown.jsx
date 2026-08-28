import { useEffect, useRef, useState } from 'react';

export function AdminActionDropdown({ label = 'Buka menu aksi', items = [], align = 'right', onOpenChange }) {
  const [isOpen, setOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const buttonRef = useRef(null);

  useEffect(() => {
    onOpenChange?.(isOpen);
  }, [isOpen, onOpenChange]);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    function updatePosition() {
      const button = buttonRef.current;
      if (!button) return;

      const rect = button.getBoundingClientRect();
      const menuWidth = 190;
      const gap = 8;
      const leftTarget = align === 'left' ? rect.left : rect.right - menuWidth;
      const left = Math.max(12, Math.min(window.innerWidth - menuWidth - 12, leftTarget));
      const top = Math.max(12, Math.min(window.innerHeight - 12, rect.bottom + gap));

      setPosition({ top, left });
    }

    function closeActions(event) {
      if (
        !event.target.closest?.('.admin-action-dropdown-trigger')
        && !event.target.closest?.('.admin-action-dropdown-popover')
      ) {
        setOpen(false);
      }
    }

    function closeWithEscape(event) {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    }

    updatePosition();
    document.addEventListener('mousedown', closeActions);
    document.addEventListener('keydown', closeWithEscape);
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    return () => {
      document.removeEventListener('mousedown', closeActions);
      document.removeEventListener('keydown', closeWithEscape);
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [align, isOpen]);

  function handleSelect(item) {
    if (item.disabled) return;
    setOpen(false);
    item.onSelect?.();
  }

  return (
    <div className="admin-action-dropdown" onClick={(event) => event.stopPropagation()}>
      <button
        type="button"
        className="admin-action-dropdown-trigger"
        ref={buttonRef}
        aria-label={label}
        aria-expanded={isOpen}
        onClick={() => setOpen((current) => !current)}
      />

      {isOpen ? (
        <div
          className="admin-action-dropdown-popover"
          role="menu"
          style={{
            top: `${position.top}px`,
            left: `${position.left}px`,
          }}
        >
          {items.map((item, index) => {
            const className = item.tone === 'danger' ? 'is-danger' : item.className || '';
            const key = item.id || item.label || index;

            if (item.href) {
              return (
                <a
                  href={item.href}
                  role="menuitem"
                  className={className}
                  aria-disabled={item.disabled || undefined}
                  onClick={(event) => {
                    if (item.disabled) {
                      event.preventDefault();
                      return;
                    }
                    setOpen(false);
                    item.onSelect?.();
                  }}
                  key={key}
                >
                  {item.icon ? <span className="admin-action-dropdown-icon">{item.icon}</span> : null}
                  <span>{item.label}</span>
                  {item.addon ? <small>{item.addon}</small> : null}
                </a>
              );
            }

            return (
              <button
                type="button"
                role="menuitem"
                className={className}
                disabled={item.disabled}
                onClick={() => handleSelect(item)}
                key={key}
              >
                {item.icon ? <span className="admin-action-dropdown-icon">{item.icon}</span> : null}
                <span>{item.label}</span>
                {item.addon ? <small>{item.addon}</small> : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
