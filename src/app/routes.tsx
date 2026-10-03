/*
 *   Copyright (c) 2026
 *   All rights reserved.
 */
/* oxlint-disable react/only-export-components -- route table, not a component
   module: the lazy() wrappers here don't participate in fast refresh. */
import { Suspense, lazy } from 'react'
import { Outlet, redirect, useLocation } from 'react-router-dom'
import type { RouteObject } from 'react-router-dom'
import { ForcedLangProvider } from '@/i18n/ForcedLangProvider'
import type { Lang } from '@/i18n/core'
import { langOfPath, seoRoute } from '@/seo/routes'
import type { SeoRouteId } from '@/seo/routes'
import { appViewRoutes, demoViewRoutes, frDemoViewRoutes } from './appViews'
import { RouteErrorPage } from './RouteErrorPage'

/* Route-level code splitting: marketing visitors never download the app
   workspace, and vice versa. Suspense fallbacks stay empty — each surface
   paints its own bg via the surface classes, so there is nothing to flash. */
const LandingPage = lazy(() =>
  import('@/features/marketing/LandingPage').then((m) => ({ default: m.LandingPage })),
)
/* Marketing subpages (dutiva.ca content migration) — split per route like the views. */
/* prettier-ignore */ const AboutPage = lazy(() => import('@/features/marketing/pages/AboutPage').then((m) => ({ default: m.AboutPage })))
/* prettier-ignore */ const FaqPage = lazy(() => import('@/features/marketing/pages/FaqPage').then((m) => ({ default: m.FaqPage })))
/* prettier-ignore */ const BlogIndexPage = lazy(() => import('@/features/marketing/pages/BlogIndexPage').then((m) => ({ default: m.BlogIndexPage })))
/* prettier-ignore */ const TemplateUsagePage = lazy(() => import('@/features/marketing/pages/TemplateUsagePage').then((m) => ({ default: m.TemplateUsagePage })))
/* prettier-ignore */ const KnownLimitationsPage = lazy(() => import('@/features/marketing/pages/KnownLimitationsPage').then((m) => ({ default: m.KnownLimitationsPage })))
/* prettier-ignore */ const LegalHubPage = lazy(() => import('@/features/marketing/pages/LegalHubPage').then((m) => ({ default: m.LegalHubPage })))
/* prettier-ignore */ const PolicyPage = lazy(() => import('@/features/marketing/pages/PolicyPage').then((m) => ({ default: m.PolicyPage })))
/* prettier-ignore */ const HelpCenterPage = lazy(() => import('@/features/marketing/pages/HelpCenterPage').then((m) => ({ default: m.HelpCenterPage })))
/* prettier-ignore */ const HelpArticlePage = lazy(() => import('@/features/marketing/pages/HelpArticlePage').then((m) => ({ default: m.HelpArticlePage })))
/* prettier-ignore */ const ContactPage = lazy(() => import('@/features/marketing/pages/ContactPage').then((m) => ({ default: m.ContactPage })))
/* prettier-ignore */ const StatusPage = lazy(() => import('@/features/marketing/pages/StatusPage').then((m) => ({ default: m.StatusPage })))
/* prettier-ignore */ const ChangelogPage = lazy(() => import('@/features/marketing/pages/ChangelogPage').then((m) => ({ default: m.ChangelogPage })))
/* prettier-ignore */ const VsHrdownloadsPage = lazy(() => import('@/features/marketing/pages/ComparisonPage').then((m) => ({ default: m.VsHrdownloadsPage })))
/* prettier-ignore */ const VsSixfiftyPage = lazy(() => import('@/features/marketing/pages/ComparisonPage').then((m) => ({ default: m.VsSixfiftyPage })))
/* prettier-ignore */ const JurisdictionToolPage = lazy(() => import('@/features/marketing/pages/JurisdictionToolPage').then((m) => ({ default: m.JurisdictionToolPage })))
/* prettier-ignore */ const InvestorsPage = lazy(() => import('@/features/marketing/pages/InvestorsPage').then((m) => ({ default: m.InvestorsPage })))
/* prettier-ignore */ const PricingShell = lazy(() => import('@/features/marketing/pages/PricingShell').then((m) => ({ default: m.PricingShell })))
/* prettier-ignore */ const TemplatesPage = lazy(() => import('@/features/marketing/pages/TemplatesPage').then((m) => ({ default: m.TemplatesPage })))
/* prettier-ignore */ const GuidesIndexPage = lazy(() => import('@/features/marketing/pages/GuidesIndexPage').then((m) => ({ default: m.GuidesIndexPage })))
/* prettier-ignore */ const GuideArticlePage = lazy(() => import('@/features/marketing/pages/ArticlePage').then((m) => ({ default: m.GuideArticlePage })))
/* prettier-ignore */ const BlogArticlePage = lazy(() => import('@/features/marketing/pages/ArticlePage').then((m) => ({ default: m.BlogArticlePage })))
/* prettier-ignore */ const NotFoundPage = lazy(() => import('@/features/marketing/pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage })))
/* Consent banner — lazy so the GA4/consent machinery stays out of the eager
   marketing chunk (same discipline the vite config uses for supabase/GA4). */
/* prettier-ignore */ const ConsentBanner = lazy(() => import('@/features/marketing/analytics/ConsentBanner').then((m) => ({ default: m.ConsentBanner })))
/* prettier-ignore */ const TrustedSiteLoader = lazy(() => import('@/features/marketing/analytics/TrustedSiteLoader').then((m) => ({ default: m.TrustedSiteLoader })))
/* App surface (providers + shell) — one lazy chunk, see appSurface.tsx. */
/* prettier-ignore */ const AppWelcome = lazy(() => import('./appSurface').then((m) => ({ default: m.AppWelcome })))
/* prettier-ignore */ const AppAuthConfirm = lazy(() => import('./appSurface').then((m) => ({ default: m.AppAuthConfirm })))
/* prettier-ignore */ const Workspace = lazy(() => import('./appSurface').then((m) => ({ default: m.Workspace })))
/* prettier-ignore */ const PublicDemoWorkspace = lazy(() => import('./appSurface').then((m) => ({ default: m.PublicDemoWorkspace })))
/* Careers surface (public job board + candidate portal) — see careersSurface.tsx. */
/* prettier-ignore */ const CareersSurface = lazy(() => import('./careersSurface').then((m) => ({ default: m.CareersSurface })))
/* prettier-ignore */ const CareersPortalSurface = lazy(() => import('./careersSurface').then((m) => ({ default: m.CareersPortalSurface })))
/* prettier-ignore */ const JobBoardPage = lazy(() => import('@/features/careers/JobBoardPage').then((m) => ({ default: m.JobBoardPage })))
/* prettier-ignore */ const JobDetailPage = lazy(() => import('@/features/careers/JobDetailPage').then((m) => ({ default: m.JobDetailPage })))
/* prettier-ignore */ const CandidatePortalHome = lazy(() => import('@/features/careers/portal/PortalHome').then((m) => ({ default: m.PortalHome })))
/* prettier-ignore */ const CandidateProfilePage = lazy(() => import('@/features/careers/portal/CandidateProfilePage').then((m) => ({ default: m.CandidateProfilePage })))
/* prettier-ignore */ const ApplicationsPage = lazy(() => import('@/features/careers/portal/ApplicationsPage').then((m) => ({ default: m.ApplicationsPage })))
/* prettier-ignore */ const ApplyToJobPage = lazy(() => import('@/features/careers/portal/ApplyToJobPage').then((m) => ({ default: m.ApplyToJobPage })))
/* prettier-ignore */ const PortalAiToolsPage = lazy(() => import('@/features/careers/portal/PortalAiToolsPage').then((m) => ({ default: m.PortalAiToolsPage })))
/* prettier-ignore */ const PortalSettingsPage = lazy(() => import('@/features/careers/portal/PortalSettingsPage').then((m) => ({ default: m.PortalSettingsPage })))
/* prettier-ignore */ const EmployerDoorPage = lazy(() => import('@/features/careers/portal/EmployerDoorPage').then((m) => ({ default: m.EmployerDoorPage })))
/* prettier-ignore */ const ExternalSigningView = lazy(() => import('@/features/app/documents/screens/ExternalSigningView').then((m) => ({ default: m.ExternalSigningView })))
/* Invest surface — standalone invite-only portal (/invest), see investSurface.tsx. */
/* prettier-ignore */ const InvestPortalSurface = lazy(() => import('./investSurface').then((m) => ({ default: m.InvestPortalSurface })))
/* prettier-ignore */ const InvestHomePage = lazy(() => import('@/features/invest/portal/InvestHomePage').then((m) => ({ default: m.InvestHomePage })))
/* prettier-ignore */ const InvestPortfolioPage = lazy(() => import('@/features/invest/portal/InvestPortfolioPage').then((m) => ({ default: m.InvestPortfolioPage })))
/* prettier-ignore */ const InvestOrdersPage = lazy(() => import('@/features/invest/portal/InvestOrdersPage').then((m) => ({ default: m.InvestOrdersPage })))
/* prettier-ignore */ const InvestSignalsPage = lazy(() => import('@/features/invest/portal/InvestSignalsPage').then((m) => ({ default: m.InvestSignalsPage })))
/* prettier-ignore */ const InvestStrategiesPage = lazy(() => import('@/features/invest/portal/InvestStrategiesPage').then((m) => ({ default: m.InvestStrategiesPage })))
/* prettier-ignore */ const InvestNotificationsPage = lazy(() => import('@/features/invest/portal/InvestNotificationsPage').then((m) => ({ default: m.InvestNotificationsPage })))
/* prettier-ignore */ const InvestSettingsPage = lazy(() => import('@/features/invest/portal/InvestSettingsPage').then((m) => ({ default: m.InvestSettingsPage })))
/* prettier-ignore */ const InvestLegalPage = lazy(() => import('@/features/invest/portal/InvestLegalPage').then((m) => ({ default: m.InvestLegalPage })))
/* prettier-ignore */ const InvestPortalLayout = lazy(() => import('@/features/invest/portal/InvestPortalLayout').then((m) => ({ default: m.InvestPortalLayout })))
/* Health surface — standalone invite-only wellness portal (/health), see healthSurface.tsx. */
/* prettier-ignore */ const HealthPortalSurface = lazy(() => import('./healthSurface').then((m) => ({ default: m.HealthPortalSurface })))
/* prettier-ignore */ const HealthHomePage = lazy(() => import('@/features/health/portal/HealthHomePage').then((m) => ({ default: m.HealthHomePage })))
/* prettier-ignore */ const HealthCheckInPage = lazy(() => import('@/features/health/portal/HealthCheckInPage').then((m) => ({ default: m.HealthCheckInPage })))
/* prettier-ignore */ const HealthJournalPage = lazy(() => import('@/features/health/portal/HealthJournalPage').then((m) => ({ default: m.HealthJournalPage })))
/* prettier-ignore */ const HealthInsightsPage = lazy(() => import('@/features/health/portal/HealthInsightsPage').then((m) => ({ default: m.HealthInsightsPage })))
/* prettier-ignore */ const HealthResourcesPage = lazy(() => import('@/features/health/portal/HealthResourcesPage').then((m) => ({ default: m.HealthResourcesPage })))
/* prettier-ignore */ const HealthLegalPage = lazy(() => import('@/features/health/portal/HealthLegalPage').then((m) => ({ default: m.HealthLegalPage })))
/* prettier-ignore */ const HealthPortalLayout = lazy(() => import('@/features/health/portal/HealthPortalLayout').then((m) => ({ default: m.HealthPortalLayout })))
/* PR surface — standalone invite-only communications portal (/pr), see prSurface.tsx. */
/* prettier-ignore */ const PrPortalSurface = lazy(() => import('./prSurface').then((m) => ({ default: m.PrPortalSurface })))
/* prettier-ignore */ const PrHomePage = lazy(() => import('@/features/pr/portal/PrHomePage').then((m) => ({ default: m.PrHomePage })))
/* prettier-ignore */ const PrCampaignsPage = lazy(() => import('@/features/pr/portal/PrCampaignsPage').then((m) => ({ default: m.PrCampaignsPage })))
/* prettier-ignore */ const PrContentPage = lazy(() => import('@/features/pr/portal/PrContentPage').then((m) => ({ default: m.PrContentPage })))
/* prettier-ignore */ const PrMediaPage = lazy(() => import('@/features/pr/portal/PrMediaPage').then((m) => ({ default: m.PrMediaPage })))
/* prettier-ignore */ const PrSeoPage = lazy(() => import('@/features/pr/portal/PrSeoPage').then((m) => ({ default: m.PrSeoPage })))
/* prettier-ignore */ const PrAnswersPage = lazy(() => import('@/features/pr/portal/PrAnswersPage').then((m) => ({ default: m.PrAnswersPage })))
/* prettier-ignore */ const PrMentionsPage = lazy(() => import('@/features/pr/portal/PrMentionsPage').then((m) => ({ default: m.PrMentionsPage })))
/* prettier-ignore */ const PrLegalPage = lazy(() => import('@/features/pr/portal/PrLegalPage').then((m) => ({ default: m.PrLegalPage })))
/* prettier-ignore */ const PrPortalLayout = lazy(() => import('@/features/pr/portal/PrPortalLayout').then((m) => ({ default: m.PrPortalLayout })))

/**
 * Layout wrapper for the public marketing surface: the URL decides the
 * language (see ForcedLangProvider), one wrapper per locale tree.
 */
function PublicShell({ lang }: { readonly lang: Lang }) {
  return (
    <ForcedLangProvider lang={lang}>
      <Suspense fallback={null}>
        <Outlet />
      </Suspense>
      {/* Site-wide on the public surface, inside the language provider so its
          copy is localized. Renders nothing until the visitor owes a choice. */}
      <Suspense fallback={null}>
        <ConsentBanner />
      </Suspense>
      <Suspense fallback={null}>
        <TrustedSiteLoader />
      </Suspense>
    </ForcedLangProvider>
  )
}

/**
 * Public routes for one locale, with pathnames from the SEO route registry
 * (src/seo/routes.ts) — English at the site's original unprefixed URLs,
 * French under /fr with localized slugs. The registry is the single source
 * of truth; adding a page means adding it there first.
 */
function publicRoutes(lang: Lang): RouteObject {
  const p = (id: SeoRouteId) => seoRoute(id).path[lang]
  return {
    element: <PublicShell lang={lang} />,
    children: [
      { path: p('home'), element: <LandingPage /> },
      { path: p('about'), element: <AboutPage /> },
      { path: p('faq'), element: <FaqPage /> },
      { path: p('blog'), element: <BlogIndexPage /> },
      /* :slug is the locale's own slug (FR uses the localized frSlug). */
      { path: `${p('blog')}/:slug`, element: <BlogArticlePage /> },
      { path: p('pricing'), element: <PricingShell /> },
      { path: p('templates'), element: <TemplatesPage /> },
      { path: p('guides'), element: <GuidesIndexPage /> },
      /* Ranked above `${p('guides')}/:slug` by React Router's static-segment
         precedence, so the product how-to keeps its dedicated page. */
      { path: p('templateUsage'), element: <TemplateUsagePage /> },
      { path: `${p('guides')}/:slug`, element: <GuideArticlePage /> },
      { path: p('knownLimitations'), element: <KnownLimitationsPage /> },
      { path: p('legal'), element: <LegalHubPage /> },
      /* :slug is the locale's own slug (FR uses the localized frSlug). */
      { path: `${p('legal')}/:slug`, element: <PolicyPage /> },
      { path: p('help'), element: <HelpCenterPage /> },
      { path: `${p('help')}/:slug`, element: <HelpArticlePage /> },
      { path: p('contact'), element: <ContactPage /> },
      /* Crawlers that treat JSON-LD `email` as a relative URL invent this
         path. Serve Contact (canonical still /contact) so "page load" checks
         get 200 instead of a 404 or a 308 they do not follow. Not in the
         SEO registry — vercel.json rewrites here; X-Robots-Tag is noindex. */
      {
        path: lang === 'fr' ? '/fr/support@dutiva.ca' : '/support@dutiva.ca',
        element: <ContactPage />,
      },
      { path: p('status'), element: <StatusPage /> },
      { path: p('changelog'), element: <ChangelogPage /> },
      { path: p('vsHrdownloads'), element: <VsHrdownloadsPage /> },
      { path: p('vsSixfifty'), element: <VsSixfiftyPage /> },
      { path: p('jurisdictionTool'), element: <JurisdictionToolPage /> },
      { path: p('investors'), element: <InvestorsPage /> },
    ],
  }
}

/** Catch-all: a real 404 page (noindex), localized by URL prefix. The static
    host serves dist/404.html with a 404 status for unknown URLs; this route
    covers client-side navigations to broken links. */
function NotFoundRoute() {
  const { pathname } = useLocation()
  return (
    <ForcedLangProvider lang={langOfPath(pathname)}>
      <Suspense fallback={null}>
        <NotFoundPage />
      </Suspense>
      <Suspense fallback={null}>
        <TrustedSiteLoader />
      </Suspense>
    </ForcedLangProvider>
  )
}

/**
 * Route map (see CONVENTIONS.md):
 *   /  /about /faq /blog /pricing /templates /guides
 *   /guides/template-usage /known-limitations /legal /legal/:slug
 *   /help /help/:slug /contact /status /changelog /vs/hrdownloads /vs/sixfifty   public marketing surface (English)
 *   /fr /fr/a-propos …     the same pages in French (localized slugs,
 *                          see src/seo/routes.ts)
 *   /app/welcome           app entry stage — sign-in gate (invite-only)
 *   /app/auth/confirm      magic-link landing — verifies the token, then enters
 *   /app                   workspace shell → redirects to /app/home
 *                          (gated: RequireAdminSession bounces anyone who
 *                          isn't the one allowed account back to /app/welcome)
 *   /app/<view>            the 16 workspace views
 *   /app/cases/:caseId     case detail
 *   /app/employees/:employeeId  employee profile
 *   /careers               public job board — browse active postings
 *   /careers/jobs/:postingId   job detail (public, no login)
 *   /fr/carrieres          French job board (URL-scoped language)
 *   /fr/carrieres/jobs/:postingId   job detail (French)
 *   /careers/portal         candidate portal (auth required, preference-scoped language)
 *   /careers/portal/profile    candidate profile editor
 *   /careers/portal/applications   track submitted applications
 *   /careers/portal/ai-tools   standalone AI tools (application or pasted job context)
 *   /careers/portal/settings   language, theme, sign-out, delete-data
 *   /careers/portal/jobs/:postingId/apply   apply to a role with optional AI
 *   /investors & /fr/investisseurs   public door to the invest portal
 *   /invest                 invest portal — standalone shell, shared auth,
 *                           gated by an invest_access grant (invite-only)
 *   /invest/portfolio       accounts + positions + price updates
 *   /invest/orders          order log — record, execute, cancel
 *   /invest/signals         agent-emitted signals with acknowledge/dismiss
 *   /invest/strategies      rules-based agent strategies + run history
 *   /health                 health portal — standalone shell, shared auth,
 *                           gated by a health_access grant (invite-only);
 *                           non-clinical self-tracking + journal
 *   /health/check-in        daily mood/energy check-in + history
 *   /health/journal         private journal entries
 *   /health/insights        trends derived from the user's own check-ins
 *   /health/resources       crisis + support resources (real services)
 *   /pr                     PR portal — standalone shell, shared auth,
 *                           gated by a pr_access grant (invite-only);
 *                           communications desk: campaigns, content,
 *                           media contacts, SEO tracking, coverage log
 *   /pr/campaigns           campaigns across social/search/press/etc.
 *   /pr/content             content desk — posts, releases, ad copy, briefs
 *   /pr/media               media-contact list (outlets, beats, emails)
 *   /pr/seo                 keyword position tracker (manual snapshots)
 *   /pr/answers             GEO tracker — brand presence in AI answers
 *   /pr/mentions            coverage/mentions log with tone tagging
 *   /employer & /fr/employeur   employer door — sign-in → org bootstrap → /app
 *   /sign/:token               external Dutiva Signature (no login)
 *   /fr/sign/:token            external signing (French UI)
 *   *                      404 (noindex)
 */
export const routes: RouteObject[] = [
  {
    /* Pathless root: it exists only to hang one error boundary over every
       route, so a render error anywhere shows the branded recovery page
       instead of React Router's built-in developer stack trace. */
    element: <Outlet />,
    errorElement: <RouteErrorPage />,
    children: routeTree(),
  },
]

function routeTree(): RouteObject[] {
  return [
    publicRoutes('en'),
    publicRoutes('fr'),
    {
      path: '/app/welcome',
      element: (
        <Suspense fallback={null}>
          <AppWelcome />
        </Suspense>
      ),
    },
    {
      path: '/app/auth/confirm',
      element: (
        <Suspense fallback={null}>
          <AppAuthConfirm />
        </Suspense>
      ),
    },
    {
      path: '/sign/:token',
      element: (
        <ForcedLangProvider lang="en">
          <Suspense fallback={null}>
            <ExternalSigningView />
          </Suspense>
        </ForcedLangProvider>
      ),
    },
    {
      path: '/fr/sign/:token',
      element: (
        <ForcedLangProvider lang="fr">
          <Suspense fallback={null}>
            <ExternalSigningView />
          </Suspense>
        </ForcedLangProvider>
      ),
    },
    {
      path: '/demo',
      element: (
        <Suspense fallback={null}>
          <PublicDemoWorkspace root="/demo" />
        </Suspense>
      ),
      children: [{ index: true, loader: () => redirect('/demo/home') }, ...demoViewRoutes],
    },
    {
      path: '/fr/demo',
      element: (
        <Suspense fallback={null}>
          <PublicDemoWorkspace root="/fr/demo" />
        </Suspense>
      ),
      children: [{ index: true, loader: () => redirect('/fr/demo/home') }, ...frDemoViewRoutes],
    },
    {
      path: '/app',
      element: (
        <Suspense fallback={null}>
          <Workspace />
        </Suspense>
      ),
      children: [{ index: true, loader: () => redirect('/app/home') }, ...appViewRoutes],
    },
    {
      path: '/careers',
      element: (
        <Suspense fallback={null}>
          <CareersSurface lang="en" />
        </Suspense>
      ),
      children: [
        { index: true, element: <JobBoardPage /> },
        { path: 'jobs/:postingId', element: <JobDetailPage /> },
      ],
    },
    {
      path: '/fr/carrieres',
      element: (
        <Suspense fallback={null}>
          <CareersSurface lang="fr" />
        </Suspense>
      ),
      children: [
        { index: true, element: <JobBoardPage /> },
        { path: 'jobs/:postingId', element: <JobDetailPage /> },
      ],
    },
    /* The employer door — same public careers chrome, but the sign-in leads
       into the /app production workspace (org bootstrap or claimed invite). */
    {
      path: '/employer',
      element: (
        <Suspense fallback={null}>
          <CareersSurface lang="en" />
        </Suspense>
      ),
      children: [{ index: true, element: <EmployerDoorPage /> }],
    },
    {
      path: '/fr/employeur',
      element: (
        <Suspense fallback={null}>
          <CareersSurface lang="fr" />
        </Suspense>
      ),
      children: [{ index: true, element: <EmployerDoorPage /> }],
    },
    {
      path: '/careers/portal',
      element: (
        <Suspense fallback={null}>
          <CareersPortalSurface />
        </Suspense>
      ),
      children: [
        { index: true, element: <CandidatePortalHome /> },
        { path: 'profile', element: <CandidateProfilePage /> },
        { path: 'applications', element: <ApplicationsPage /> },
        { path: 'ai-tools', element: <PortalAiToolsPage /> },
        { path: 'settings', element: <PortalSettingsPage /> },
        { path: 'jobs/:postingId/apply', element: <ApplyToJobPage /> },
      ],
    },
    /* Standalone invest portal — shared auth + invest_access grant, own
       shell. Invite-only; no demo mode. */
    {
      path: '/invest',
      element: (
        <Suspense fallback={null}>
          <InvestPortalSurface />
        </Suspense>
      ),
      children: [
        /* Public legal pages — outside the gated layout so the sign-in
           wall's footer links work for signed-out visitors. */
        { path: 'legal/:slug', element: <InvestLegalPage /> },
        {
          element: <InvestPortalLayout />,
          children: [
            { index: true, element: <InvestHomePage /> },
            { path: 'portfolio', element: <InvestPortfolioPage /> },
            { path: 'orders', element: <InvestOrdersPage /> },
            { path: 'signals', element: <InvestSignalsPage /> },
            { path: 'strategies', element: <InvestStrategiesPage /> },
            { path: 'notifications', element: <InvestNotificationsPage /> },
            { path: 'settings', element: <InvestSettingsPage /> },
          ],
        },
      ],
    },
    /* Standalone health portal — shared auth + health_access grant, own
       shell. Invite-only; a self-tracking/reflection tool, not a clinical
       or crisis service (see the wellness notice legal doc). */
    {
      path: '/health',
      element: (
        <Suspense fallback={null}>
          <HealthPortalSurface />
        </Suspense>
      ),
      children: [
        /* Public legal pages — outside the gated layout so the sign-in
           wall's footer links work for signed-out visitors. */
        { path: 'legal/:slug', element: <HealthLegalPage /> },
        {
          element: <HealthPortalLayout />,
          children: [
            { index: true, element: <HealthHomePage /> },
            { path: 'check-in', element: <HealthCheckInPage /> },
            { path: 'journal', element: <HealthJournalPage /> },
            { path: 'insights', element: <HealthInsightsPage /> },
            { path: 'resources', element: <HealthResourcesPage /> },
          ],
        },
      ],
    },
    /* Standalone PR portal — shared auth + pr_access grant, own shell.
       Invite-only; a planning/tracking desk for the communications
       function — it records intent, it never publishes anything. */
    {
      path: '/pr',
      element: (
        <Suspense fallback={null}>
          <PrPortalSurface />
        </Suspense>
      ),
      children: [
        /* Public legal pages — outside the gated layout so the sign-in
           wall's footer links work for signed-out visitors. */
        { path: 'legal/:slug', element: <PrLegalPage /> },
        {
          element: <PrPortalLayout />,
          children: [
            { index: true, element: <PrHomePage /> },
            { path: 'campaigns', element: <PrCampaignsPage /> },
            { path: 'content', element: <PrContentPage /> },
            { path: 'media', element: <PrMediaPage /> },
            { path: 'seo', element: <PrSeoPage /> },
            { path: 'answers', element: <PrAnswersPage /> },
            { path: 'mentions', element: <PrMentionsPage /> },
          ],
        },
      ],
    },
    { path: '*', element: <NotFoundRoute /> },
  ]
}
