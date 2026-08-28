import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import type { SeoRouteId } from '@/seo/routes'
import { usePublicPath } from '@/seo/usePublicPath'
import { LeafTile, Wordmark } from '../Brand'
import { useLanding } from '../useLanding'
import type { LandingMessageKey } from '../useLanding'
import { openCookiePreferences } from '../analytics/cookiePreferences'
import { ReviewDirectoryLinks } from '../ReviewDirectoryLinks'

/**
 * Footer link targets, resolved per locale at render time (usePublicPath):
 * `hash` → landing-section anchor on the locale homepage; `route` → an SEO
 * registry page; `legal` → a policy document; `to` → an app path (not
 * localized); `href` → external (mailto).
 */
type FooterLink = { key: LandingMessageKey } & (
  { hash: string } | { route: SeoRouteId } | { legal: string } | { to: string } | { href: string }
)

const PRODUCT_LINKS: FooterLink[] = [
  { key: 'landing_fp_advisor', hash: 'advisor' },
  { key: 'landing_fp_workflows', hash: 'workflows' },
  { key: 'landing_fp_templates', hash: 'product' },
  { key: 'landing_nav_pricing', route: 'pricing' },
  { key: 'landing_fp_beta', hash: 'start' },
]

const RESOURCE_LINKS: FooterLink[] = [
  { key: 'landing_nav_guides', route: 'guides' },
  { key: 'landing_fr_help', route: 'help' },
  { key: 'landing_fr_faq', route: 'faq' },
  { key: 'landing_fr_blog', route: 'blog' },
  { key: 'landing_fr_status', route: 'status' },
  { key: 'landing_fr_changelog', route: 'changelog' },
]

const COMPANY_LINKS: FooterLink[] = [
  { key: 'landing_fc_about', route: 'about' },
  { key: 'landing_fc_contact', route: 'contact' },
  { key: 'landing_foot_vs_hrdownloads', route: 'vsHrdownloads' },
  { key: 'landing_foot_vs_sixfifty', route: 'vsSixfifty' },
  { key: 'landing_fc_openapp', to: '/app/welcome' },
]

/* The five most-visited policies (content migration); the rest live behind
   the "View all policies" link to the legal hub, which indexes all 26. */
const LEGAL_LINKS: FooterLink[] = [
  { key: 'landing_fl_privacy', legal: 'privacy' },
  { key: 'landing_fl_terms', legal: 'terms' },
  { key: 'landing_fl_cookie', legal: 'cookies' },
  { key: 'landing_fl_disclaimer', legal: 'disclaimer' },
  { key: 'landing_fl_access', legal: 'accessibility' },
]

const LINK_CLASS = 'text-sm text-text-2 transition-opacity hover:opacity-80'

export function Footer() {
  const { lt, t, L } = useLanding()
  const { p, legalDoc, home } = usePublicPath()

  const renderLinks = (links: FooterLink[]) => (
    <div className="grid gap-2.5">
      {links.map((link) => {
        if ('href' in link) {
          return (
            <a key={link.key} href={link.href} className={LINK_CLASS}>
              {lt(link.key)}
            </a>
          )
        }
        if ('hash' in link) {
          return (
            <a key={link.key} href={home(link.hash)} className={LINK_CLASS}>
              {lt(link.key)}
            </a>
          )
        }
        const to =
          'route' in link ? p(link.route) : 'legal' in link ? legalDoc(link.legal) : link.to
        return (
          <Link key={link.key} to={to} className={LINK_CLASS}>
            {lt(link.key)}
          </Link>
        )
      })}
    </div>
  )

  return (
    <footer className="border-t border-border bg-bg">
      {/* Two flex regions (brand, link columns) rather than one 5-column auto-fit
          grid: the brand block's min-w-[220px] could exceed an auto-fit track's
          computed width at in-between viewport sizes, overflowing text into the
          neighboring column. Splitting them lets the whole link-column group
          wrap onto its own row instead. */}
      <div className="mx-auto flex max-w-[1200px] flex-wrap gap-8 px-4 py-10 sm:px-6 sm:py-12">
        <div className="min-w-0 flex-1 basis-[220px]">
          <div className="flex items-center gap-2.5">
            <LeafTile variant="footer" />
            <Wordmark />
          </div>
          <p className="mt-3 max-w-[42ch] text-sm leading-[1.6] text-text-2">
            {lt('landing_foot_desc')}
          </p>
          {/* Standing disclaimer — prototype's footer variant, verbatim */}
          <p className="mt-2.5 max-w-[42ch] text-xs leading-[1.55] text-text-3">
            {lt('landing_foot_disclaimer')}
          </p>
          <div className="mt-4 flex flex-wrap gap-2.5 text-xs text-text-3">
            <span>{lt('landing_trust_ottawa')}</span>
            <span>·</span>
            <span>{lt('landing_trust_pipeda')}</span>
            <span>·</span>
            <span>{lt('landing_trust_bilingual')}</span>
          </div>
          <p className="mt-3.5 max-w-[42ch] text-sm text-text-2">
            {lt('landing_foot_support_prompt')}{' '}
            <a
              href="mailto:support@dutiva.ca"
              className="font-medium text-gold-strong transition-opacity hover:opacity-80"
            >
              {lt('landing_foot_support_email')}
            </a>
          </p>
          <ReviewDirectoryLinks className="mt-3 grid gap-2" />
        </div>

        <div className="marketing-auto-grid marketing-auto-grid--140 min-w-0 flex-3 basis-full gap-8 sm:basis-[480px]">
          <div>
            <FooterHeading>{lt('landing_foot_product')}</FooterHeading>
            {renderLinks(PRODUCT_LINKS)}
          </div>
          <div>
            <FooterHeading>{lt('landing_foot_resources')}</FooterHeading>
            {renderLinks(RESOURCE_LINKS)}
          </div>
          <div>
            <FooterHeading>{lt('landing_foot_company')}</FooterHeading>
            {renderLinks(COMPANY_LINKS)}
          </div>
          <div>
            <FooterHeading>{lt('landing_foot_legal')}</FooterHeading>
            {renderLinks(LEGAL_LINKS)}
            <Link
              to={p('legal')}
              className="mt-2.5 inline-flex items-center gap-1.5 text-sm font-semibold text-gold-strong transition-opacity hover:opacity-80"
            >
              {t('legalHub_viewAll')}
              <ArrowRight size={14} />
            </Link>
            {/* Reopens the consent banner so a prior analytics choice can be
                changed — the revocable-consent control the Cookie Policy
                promises. A button, not a link: it opens UI, not a page. */}
            <button
              type="button"
              onClick={openCookiePreferences}
              className={`mt-2.5 block text-left ${LINK_CLASS}`}
            >
              {L('Cookie preferences', 'Préférences de témoins')}
            </button>
          </div>
        </div>
      </div>
      <div className="border-t border-border">
        {/* Last row on the page, so it pays the bottom inset — body can't:
            padding there would push the app's 100dvh frame past the viewport
            and leave the workspace scrolling. */}
        <div className="mx-auto max-w-[1200px] px-4 py-4 pb-[calc(1rem_+_env(safe-area-inset-bottom))] text-xs text-text-3 sm:px-6">
          {lt('landing_foot_copyright')}
        </div>
      </div>
    </footer>
  )
}

function FooterHeading({ children }: { readonly children: string }) {
  return (
    <div className="mb-3 text-xs font-semibold tracking-[0.2em] uppercase text-text-3">
      {children}
    </div>
  )
}
