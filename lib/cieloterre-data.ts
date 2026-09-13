export type Property = { id?: string; slug: string; title: string; location: string; city: string; features: string[]; type: string; transaction: 'À vendre' | 'À louer' | 'Neuf'; price: string; numericPrice: number; area: number; bedrooms: number; bathrooms: number; image: string; images?: string[]; ref: string; description: string }
export type Agent = { slug: string; name: string; role: string; city: string; languages: string[]; image: string; bio: string; phone?: string; email?: string }
export type Agency = { slug: string; name: string; city: string; address: string; phone: string; image: string; agents: number; email?: string; website?: string; description?: string }
export type Article = { slug: string; category: string; title: string; excerpt: string; image: string; readTime: string; body?: string }

export const properties: Property[] = []
export const agents: Agent[] = []
export const agencies: Agency[] = []
export const articles: Article[] = []
export const destinations: string[] = []
export const getProperty = (_slug: string): Property | undefined => undefined
export const getAgent = (_slug: string): Agent | undefined => undefined
export const getAgency = (_slug: string): Agency | undefined => undefined
export const getArticle = (_slug: string): Article | undefined => undefined
export const slugify = (value: string) => value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-')
export const titleForCity = (city: string) => city.replace(/-/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
