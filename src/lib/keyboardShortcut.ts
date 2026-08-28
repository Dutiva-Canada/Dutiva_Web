/** Platform-aware modifier label for shortcut hints (⌘ on Apple, Ctrl elsewhere). */
export function modKeyLabel(): string {
  if (typeof navigator === 'undefined') return 'Ctrl'
  const platform = navigator.platform ?? ''
  return /Mac|iPhone|iPad|iPod/.test(platform) ? '⌘' : 'Ctrl'
}

export function searchShortcutLabel(): string {
  return `${modKeyLabel()}K`
}

/** Sidebar expand/collapse — Ctrl+\ on Windows/Linux, ⌘\ on macOS. */
export function sidebarToggleShortcutLabel(): string {
  return `${modKeyLabel()}\\`
}
