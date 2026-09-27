/*
 *   Copyright (c) 2026
 *   All rights reserved.
 */
/**
 * Full-page reload, one hop removed from window.location.
 *
 * jsdom's Location object is non-configurable — neither the `location`
 * binding nor its `reload` method can be spied — so tests that need to
 * observe a reload mock this module instead.
 */
export function reloadPage(): void {
  window.location.reload()
}
