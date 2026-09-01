/*
 *   Copyright (c) 2026
 *   All rights reserved.
 */
import type { Page } from '@playwright/test'

/**
 * Hermetic e2e must not fetch TrustedSite (or its S3 assets). Production loads
 * it from the public marketing shell; the suite aborts those hosts so a
 * floating widget cannot flake clicks or trip style-src via injected inline CSS.
 */
export async function blockTrustedSite(page: Page): Promise<void> {
  await page.route(
    /https:\/\/(cdn\.ywxi\.net|www\.trustedsite\.com|trustedsite\.com|s3-us-west-2\.amazonaws\.com)\//,
    (route) => route.abort(),
  )
}
