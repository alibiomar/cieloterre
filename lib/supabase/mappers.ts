import type { Tables } from './database.types'
import type { Property } from '@/lib/cieloterre-data'

export function publicMediaUrl(value: unknown, fallback: string): string {
  if (typeof value !== 'string' || !value.trim()) return fallback
  const image = value.trim()
  if (/^(https?:)?\/\//i.test(image) || image.startsWith('/')) return image
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  return supabaseUrl
    ? `${supabaseUrl.replace(/\/$/, '')}/storage/v1/object/public/public-media/${image.replace(/^\/+/, '')}`
    : fallback
}

const TRANSACTION_LABELS: Record<string, Property['transaction']> = {
  rent: 'À louer',
  new: 'Neuf',
  sale: 'À vendre',
}

export function toPropertyCard(property: Tables<'properties'> & { property_images?: { path: string; sort_order: number }[] }): Property {
  const transaction = TRANSACTION_LABELS[property.transaction_type] ?? 'À vendre'
  const cover = publicMediaUrl(property.cover_path, '/cieloterre-hero.png')
  const gallery = Array.isArray(property.property_images)
    ? [...property.property_images]
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((img) => publicMediaUrl(img.path, ''))
        .filter(Boolean)
    : []
  const images = gallery.length ? gallery : [cover]

  return {
    id: property.id,
    slug: property.slug,
    title: property.title,
    location: property.neighborhood ?? property.city,
    city: property.city,
    type: property.property_type,
    transaction,
    price: `${Number(property.price).toLocaleString('fr-FR')} TND`,
    numericPrice: Number(property.price),
    area: Number(property.area_m2),
    bedrooms: property.bedrooms,
    bathrooms: property.bathrooms,
    features: property.features ?? [],
    image: cover,
    images,
    ref: property.slug.toUpperCase(),
    description: property.description ?? '',
  }
}
