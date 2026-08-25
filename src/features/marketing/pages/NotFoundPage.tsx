import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { Seo } from '@/seo/Seo'
import { usePublicPath } from '@/seo/usePublicPath'
import { MarketingPageShell } from './MarketingPage'

/**
 * Bilingual 404 page. Served with a real 404 status by the static host for
 * unknown URLs (dist/404.html, see scripts/prerender.mjs) and rendered by
 * the router's catch-all for client-side navigations. Always noindex.
 */
export function NotFoundPage() {
  const { L } = useI18n()
  const { p, home } = usePublicPath()
  return (
    <MarketingPageShell>
      <Seo
        page={{
          title: { en: 'Page not found | Dutiva', fr: 'Page introuvable | Dutiva' },
          description: {
            en: 'This page does not exist or may have moved.',
            fr: 'Cette page n’existe pas ou a peut-être été déplacée.',
          },
          path: { en: '/', fr: '/fr' },
          indexable: false,
        }}
      />
      <section className="mx-auto max-w-[840px] px-6 pt-20 pb-24 text-center">
        <span className="badge">404</span>
        <h1 className="mt-5 font-display text-[clamp(2.125rem,4vw,3.25rem)] leading-[1.08] font-semibold tracking-[-0.02em] text-text">
          {L('Page not found.', 'Page introuvable.')}
        </h1>
        <p className="mx-auto mt-4 max-w-[62ch] text-lg leading-[1.6] text-text-2">
          {L(
            'The page you are looking for does not exist or may have moved. These links can get you back on track:',
            'La page que vous cherchez n’existe pas ou a peut-être été déplacée. Ces liens peuvent vous remettre sur la bonne voie :',
          )}
        </p>
        <nav
          aria-label={L('Suggested pages', 'Pages suggérées')}
          className="mt-8 flex flex-wrap justify-center gap-3"
        >
          <Link to={home()} className="gold-button pill-button">
            {L('Go to the homepage', 'Aller à la page d’accueil')}
            <ArrowRight size={15} />
          </Link>
          <Link to={p('help')} className="ghost-button pill-button">
            {L('Help Centre', 'Centre d’aide')}
          </Link>
          <Link to={p('guides')} className="ghost-button pill-button">
            {L('Browse the guides', 'Consulter les guides')}
          </Link>
          <Link to={p('faq')} className="ghost-button pill-button">
            {L('FAQ', 'FAQ')}
          </Link>
          <Link to={p('contact')} className="ghost-button pill-button">
            {L('Contact support', 'Contacter le soutien')}
          </Link>
          <Link to={p('legal')} className="ghost-button pill-button">
            {L('Legal & compliance documents', 'Documents juridiques et de conformité')}
          </Link>
        </nav>
        <p className="mx-auto mt-8 max-w-[52ch] text-sm text-text-3">
          {L(
            'If you followed a link from another site, the address may be out of date.',
            'Si vous avez suivi un lien depuis un autre site, l’adresse est peut-être périmée.',
          )}
        </p>
      </section>
    </MarketingPageShell>
  )
}
