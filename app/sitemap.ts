import type { MetadataRoute } from 'next'
import {
  getPublishedProperties,
  getPublicAgencies,
  getPublicAgents,
  getPublicArticles,
} from '@/lib/supabase/queries'

const BASE_URL = 'https://cieloterre.tn'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    '/',
    '/acheter',
    '/louer',
    '/vendre',
    '/gestion-locative',
    '/neuf',
    '/biens',
    '/agences',
    '/agents',
    '/conseils',
    '/a-propos',
    '/contact',
    '/favoris',
  ].map((path) => ({
    url: `${BASE_URL}${path}`,
    lastModified: new Date(),
    changeFrequency: path === '/' ? 'daily' : 'weekly',
    priority: path === '/' ? 1.0 : 0.8,
  }))

  const cityRoutes: MetadataRoute.Sitemap = [
    'la-marsa',
    'carthage',
    'gammarth',
    'sidi-bou-said',
    'lac-2',
    'la-soukra',
    'hammamet',
    'sousse',
    'djerba',
  ].map((city) => ({
    url: `${BASE_URL}/immobilier/${city}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.7,
  }))

  let propertyRoutes: MetadataRoute.Sitemap = []
  let agencyRoutes: MetadataRoute.Sitemap = []
  let agentRoutes: MetadataRoute.Sitemap = []
  let articleRoutes: MetadataRoute.Sitemap = []

  try {
    const [properties, agencies, agents, articles] = await Promise.allSettled([
      getPublishedProperties({ limit: 100 }),
      getPublicAgencies(),
      getPublicAgents(),
      getPublicArticles(),
    ])

    if (properties.status === 'fulfilled') {
      propertyRoutes = properties.value.map((p) => ({
        url: `${BASE_URL}/biens/${p.slug}`,
        lastModified: p.updated_at ? new Date(p.updated_at) : new Date(),
        changeFrequency: 'daily',
        priority: 0.9,
      }))
    }

    if (agencies.status === 'fulfilled') {
      agencyRoutes = agencies.value.map((a) => ({
        url: `${BASE_URL}/agences/${a.slug}`,
        lastModified: new Date(),
        changeFrequency: 'monthly',
        priority: 0.7,
      }))
    }

    if (agents.status === 'fulfilled') {
      agentRoutes = agents.value.map((a) => ({
        url: `${BASE_URL}/agents/${a.slug}`,
        lastModified: new Date(),
        changeFrequency: 'monthly',
        priority: 0.6,
      }))
    }

    if (articles.status === 'fulfilled') {
      articleRoutes = articles.value.map((art) => ({
        url: `${BASE_URL}/conseils/${art.slug}`,
        lastModified: new Date(),
        changeFrequency: 'monthly',
        priority: 0.7,
      }))
    }
  } catch (err) {
    console.warn('[sitemap] Error generating dynamic routes:', err)
  }

  return [
    ...staticRoutes,
    ...cityRoutes,
    ...propertyRoutes,
    ...agencyRoutes,
    ...agentRoutes,
    ...articleRoutes,
  ]
}

