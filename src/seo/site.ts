/*
 *   Copyright (c) 2026
 *   All rights reserved.
 */
/**
 * Canonical site identity — the single source of truth for the production
 * origin and the verified organization facts used across metadata, JSON-LD,
 * the sitemap, robots.txt, and llms.txt. Nothing else in the codebase should
 * hard-code `https://dutiva.ca`.
 *
 * `VITE_SITE_ORIGIN` exists so a future domain change (or a self-hosted
 * staging origin) is a one-variable edit; when unset, the production apex
 * domain is used. Only ever set it to an origin you control — it is baked
 * into every canonical URL at build time.
 */

const RAW_ORIGIN: string | undefined = import.meta.env?.VITE_SITE_ORIGIN

/** Production canonical origin (https, apex host, no trailing slash). */
export const SITE_ORIGIN: string = (RAW_ORIGIN || 'https://dutiva.ca').replace(/\/+$/, '')

/** Absolute canonical URL for a root-relative pathname. */
export function absoluteUrl(pathname: string): string {
  return `${SITE_ORIGIN}${pathname === '/' ? '/' : pathname}`
}

/**
 * Verified organization facts only (see docs/SEO_GEO_IMPLEMENTATION.md).
 * Do not add addresses, founding dates, ratings, or other properties here
 * unless they are real, public, and visible on the site. Social profiles
 * belong only when published on the site (currently the founder's LinkedIn
 * on `FOUNDER`).
 */
export const ORG = {
  /** Registered legal name. */
  legalName: 'Dutiva Canada Inc.',
  /** Brand / trade name. */
  name: 'Dutiva',
  /** Public support contact, visible in the site footer. */
  supportEmail: 'support@dutiva.ca',
  /** Public legal contact, visible on /legal. */
  legalEmail: 'legal@dutiva.ca',
  /** Brand mark shipped in /public — also used as the JSON-LD logo. */
  logoPath: '/brand/dutiva-leaf.png',
  logoWidth: 1275,
  logoHeight: 1275,
} as const

/**
 * Founder identity published on `/` and `/about` (and in JSON-LD). Name,
 * title, LinkedIn, and photo path are never re-typed in components.
 */
export const FOUNDER = {
  name: 'Martin Constantineau',
  jobTitle: { en: 'Founder & CEO', fr: 'Fondateur et chef de la direction' },
  linkedinUrl: 'https://www.linkedin.com/in/martinconstantineau/',
  photoPath: '/brand/martin-constantineau.jpg',
} as const

/** One-sentence positioning, kept consistent across pages, schema, and llms.txt. */
export const ORG_DESCRIPTION = {
  en: 'Dutiva Canada Inc. provides AI-assisted HR compliance software for Canadian employers — practical, jurisdiction-specific guidance and workplace documentation across the employee lifecycle. Dutiva does not provide legal advice.',
  fr: 'Dutiva Canada Inc. offre un logiciel de conformité RH assisté par l’IA pour les employeurs canadiens — un accompagnement pratique, adapté à la province ou au régime applicable, et de la documentation en milieu de travail pour tout le cycle de vie de l’employé. Dutiva ne fournit pas de conseils juridiques.',
} as const

/** Default social-share images (1200×630), one per locale. */
export const OG_IMAGE = {
  en: {
    path: '/brand/og-dutiva-en.png',
    alt: 'Dutiva — HR compliance software for Canadian employers',
  },
  fr: {
    path: '/brand/og-dutiva-fr.png',
    alt: 'Dutiva — Logiciel de conformité RH pour les employeurs canadiens',
  },
  width: 1200,
  height: 630,
} as const
