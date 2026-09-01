import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

export function AdminActionDropdown({
  label = 'Buka menu aksi',
  items = [],
  align = 'right',
  onOpenChange,
}) {
  const [isOpen, setOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const buttonRef = useRef(null);
  const menuRef = useRef(null);

  useEffect(() => {
    onOpenChange?.(isOpen);
  }, [isOpen, onOpenChange]);

  useEffect(() => {
    if (!isOpen) return undefined;

    function updatePosition() {
      const button = buttonRef.current;
      if (!button) return;

      const rect = button.getBoundingClientRect();
      const menuWidth = 210;
      const itemHeight = 40;
      const menuPadding = 8;
      const gap = 8;

      const calculatedHeight = items.length * itemHeight + menuPadding * 2;
      const menuHeight = Math.min(360, Math.max(48, calculatedHeight));

      const leftTarget = align === 'left'
        ? rect.left
        : rect.right - menuWidth;

      const left = Math.max(
        12,
        Math.min(window.innerWidth - menuWidth - 12, leftTarget),
      );

      const spaceBelow = window.innerHeight - rect.bottom - gap - 12;
      const spaceAbove = rect.top - gap - 12;
      const shouldOpenUp = spaceBelow < menuHeight && spaceAbove > spaceBelow;

      const topTarget = shouldOpenUp
        ? rect.top - menuHeight - gap
        : rect.bottom + gap;

      const top = Math.max(
        12,
        Math.min(window.innerHeight - menuHeight - 12, topTarget),
      );

      setPosition({ top, left });
    }

    function closeActions(event) {
      const clickedTrigger = buttonRef.current?.contains(event.target);
      const clickedMenu = menuRef.current?.contains(event.target);

      if (!clickedTrigger && !clickedMenu) {
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
  }, [align, isOpen, items.length]);

  function handleSelect(item) {
    if (item.disabled) return;

    setOpen(false);
    item.onSelect?.();
  }

  const menu = isOpen ? (
    <div
      ref={menuRef}
      className="admin-action-dropdown-popover"
      role="menu"
      style={{
        position: 'fixed',
        top: `${position.top}px`,
        left: `${position.left}px`,
        zIndex: 99999,
        width: '210px',
        maxHeight: '360px',
        overflowY: 'auto',
        display: 'grid',
        gap: '2px',
        padding: '8px',
        boxSizing: 'border-box',
      }}
    >
      {items.map((item, index) => {
        const className = item.tone === 'danger'
          ? 'is-danger'
          : item.className || '';

        const key = item.id || `${item.label}-${index}`;

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
              style={{ minHeight: '38px' }}
            >
              {item.icon ? (
                <span className="admin-action-dropdown-icon">
                  {item.icon}
                </span>
              ) : null}

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
            style={{
              minHeight: '38px',
              width: '100%',
            }}
          >
            {item.icon ? (
              <span className="admin-action-dropdown-icon">
                {item.icon}
              </span>
            ) : null}

            <span>{item.label}</span>

            {item.addon ? <small>{item.addon}</small> : null}
          </button>
        );
      })}
    </div>
  ) : null;

  return (
    <div
      className="admin-action-dropdown"
      onClick={(event) => event.stopPropagation()}
    >
      <button
        type="button"
        className="admin-action-dropdown-trigger"
        ref={buttonRef}
        aria-label={label}
        aria-expanded={isOpen}
        onClick={() => setOpen((current) => !current)}
      />

      {menu && typeof document !== 'undefined'
        ? createPortal(menu, document.body)
        : null}
    </div>
  );
}
