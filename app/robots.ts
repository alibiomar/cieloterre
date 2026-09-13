import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/crm/', '/api/', '/auth/'],
    },
    sitemap: 'https://cieloterre.tn/sitemap.xml',
  }
}

