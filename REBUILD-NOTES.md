# Refonte du site public CieloTerre

Le CRM (`app/crm`, `components/crm`), l'API (`app/api`), l'authentification (`app/auth`),
`proxy.ts` et toute la couche Supabase existante sont inchangés.

## Ce qui a changé
- `app/(site)/…` : toutes les pages publiques (mêmes URLs qu'avant), avec un layout commun
  (en-tête, pied de page, polices Jost + Newsreader).
- `components/site/…` : nouveaux composants (cartes, catalogue, galerie, formulaires…).
- `components/site-chrome.tsx` : nouvel en-tête / pied de page. `PageShell` est conservé
  pour les pages /auth.
- `app/globals.css` : l'ancien CSS (utilisé par le CRM) est conservé ; le nouveau design
  est ajouté dans un espace de noms `.ct` / `--c-*`.
- `lib/site-config.ts` : téléphone, email, bureaux, navigation (à modifier ici).
- `lib/supabase/facets.ts`, `lib/catalog-params.ts`, `lib/format.ts`, `lib/use-favorites.ts`.
- Correctif : fuite d'écouteur `storage` dans `lib/favorites.ts`.

## Supprimés (devenus inutiles)
Anciens `components/{a-propos,acheter,agences,agents,biens,conseils,contact,favoris,
gestion-locative,immobilier,louer,neuf,vendre}`, `page-sections`, `property-ui`,
`property-search`, `ScrollExpand`, `TextLoop`. La dépendance `gsap` n'est plus utilisée.

## À vérifier de votre côté
- Loyers : affichés « / mois » pour les biens « À louer ».
- Pages légales : textes génériques, à compléter avec vos informations officielles.
- `public/videos/givingKey.mp4` pèse 11 Mo : le compresser (~2 Mo) accélérera le site.
- Le catalogue charge jusqu'à 100 biens par requête, puis pagine (12 par page).
