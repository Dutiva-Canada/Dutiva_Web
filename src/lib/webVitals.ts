/**
 * Core Web Vitals for the public marketing surface — consent-gated and sent
 * through the first-party support analytics sink (docs/SUPPORT_ANALYTICS.md).
 * Inert in dev, tests, and when Supabase is unset (same gates as trackEvent).
 */
import { onCLS, onFCP, onINP, onLCP, onTTFB, type Metric } from 'web-vitals'
import { langOfPath } from '@/seo/routes'
import { trackEvent } from '@/features/support/analytics/supportAnalytics'

type WebVitalName = 'LCP' | 'INP' | 'CLS' | 'TTFB' | 'FCP'

function metricName(metric: Metric): WebVitalName {
  return metric.name as WebVitalName
}

function reportMetric(metric: Metric): void {
  trackEvent({
    event_type: 'web_vital',
    web_vital_name: metricName(metric),
    web_vital_value: metric.value,
    web_vital_rating: metric.rating,
    page_path: window.location.pathname.slice(0, 200),
    locale: langOfPath(window.location.pathname),
  })
}

/** Register Core Web Vitals listeners once per page load. */
export function installWebVitalsReporting(): void {
  if (typeof window === 'undefined') return
  onLCP(reportMetric)
  onINP(reportMetric)
  onCLS(reportMetric)
  onTTFB(reportMetric)
  onFCP(reportMetric)
}
