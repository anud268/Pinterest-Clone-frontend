import { useId, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useDismiss } from '../../lib/hooks'

/**
 * Accessible dropdown menu.
 * `trigger` receives props to spread on the trigger button.
 * `items`: [{ label, icon, onSelect | to | href, danger, hidden }] or 'divider'.
 */
export default function Menu({ trigger, items, align = 'right', placement = 'bottom', onOpenChange, className = '' }) {
  const [open, setOpenState] = useState(false)
  const triggerRef = useRef(null)
  const menuRef = useRef(null)
  const id = useId()

  const setOpen = (value) => {
    setOpenState(value)
    onOpenChange?.(value)
  }

  const close = ({ viaKeyboard } = {}) => {
    setOpen(false)
    if (viaKeyboard) triggerRef.current?.focus()
  }

  useDismiss(open, close, [triggerRef, menuRef])

  const visible = items.filter((item) => item && !item.hidden)

  const focusItem = (index) => {
    const nodes = menuRef.current?.querySelectorAll('[role="menuitem"]')
    if (!nodes?.length) return
    nodes[(index + nodes.length) % nodes.length].focus()
  }

  const openMenu = (focusIndex = 0) => {
    setOpen(true)
    requestAnimationFrame(() => focusItem(focusIndex))
  }

  const onMenuKeyDown = (event) => {
    const nodes = [...(menuRef.current?.querySelectorAll('[role="menuitem"]') ?? [])]
    const current = nodes.indexOf(document.activeElement)
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      focusItem(current + 1)
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      focusItem(current - 1)
    } else if (event.key === 'Home') {
      event.preventDefault()
      focusItem(0)
    } else if (event.key === 'End') {
      event.preventDefault()
      focusItem(nodes.length - 1)
    } else if (event.key === 'Tab') {
      close()
    }
  }

  const select = (item) => {
    close({ viaKeyboard: true })
    item.onSelect?.()
  }

  const itemClass = (item) =>
    `flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold outline-none transition-colors cursor-pointer hover:bg-surface focus-visible:bg-surface focus-visible:outline-none ${
      item.danger ? 'text-danger' : 'text-ink'
    }`

  return (
    <div className={`relative ${className}`}>
      {trigger({
        ref: triggerRef,
        'aria-haspopup': 'menu',
        'aria-expanded': open,
        'aria-controls': open ? id : undefined,
        onClick: (event) => {
          event.preventDefault()
          event.stopPropagation()
          open ? close() : openMenu()
        },
        onKeyDown: (event) => {
          if (event.key === 'ArrowDown') {
            event.preventDefault()
            openMenu(0)
          } else if (event.key === 'ArrowUp') {
            event.preventDefault()
            openMenu(-1)
          }
        },
      })}
      {open && (
        <div
          ref={menuRef}
          id={id}
          role="menu"
          onKeyDown={onMenuKeyDown}
          onClick={(event) => event.stopPropagation()}
          className={`absolute z-50 min-w-52 animate-pop-in rounded-2xl border border-line bg-white p-1.5 shadow-pop ${
            align === 'right' ? 'right-0' : 'left-0'
          } ${placement === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'}`}
        >
          {visible.map((item, index) =>
            item === 'divider' ? (
              <div key={`divider-${index}`} role="separator" className="my-1 h-px bg-line" />
            ) : item.to ? (
              <Link key={item.label} to={item.to} role="menuitem" tabIndex={-1} className={itemClass(item)} onClick={() => close()}>
                {item.icon && <span className="text-lg text-ink-muted" aria-hidden="true">{item.icon}</span>}
                {item.label}
              </Link>
            ) : item.href ? (
              <a
                key={item.label}
                href={item.href}
                role="menuitem"
                tabIndex={-1}
                className={itemClass(item)}
                onClick={() => close()}
                {...(item.download ? { download: '' } : { target: '_blank', rel: 'noopener noreferrer' })}
              >
                {item.icon && <span className="text-lg text-ink-muted" aria-hidden="true">{item.icon}</span>}
                {item.label}
              </a>
            ) : (
              <button key={item.label} type="button" role="menuitem" tabIndex={-1} className={itemClass(item)} onClick={() => select(item)}>
                {item.icon && <span className={`text-lg ${item.danger ? 'text-danger' : 'text-ink-muted'}`} aria-hidden="true">{item.icon}</span>}
                {item.label}
              </button>
            ),
          )}
        </div>
      )}
    </div>
  )
}
