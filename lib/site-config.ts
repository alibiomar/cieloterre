/**
 * Single source of truth for contact details and navigation on the public site.
 * Edit here instead of hunting through components.
 */
export const SITE = {
  name: "CieloTerre",
  url: "https://cieloterre.tn",
  phone: "+216 71 740 100",
  phoneHref: "tel:+21671740100",
  email: "contact@cieloterre.tn",
  hours: "Du lundi au samedi, de 9 h à 19 h, sur rendez-vous",
  offices: [
    {
      city: "La Marsa",
      address: "Avenue Habib Bourguiba, La Marsa, 2070 Tunis",
      phone: "+216 71 740 100",
      email: "marsa@cieloterre.tn",
    },
    {
      city: "Les Berges du Lac 2",
      address: "Rue de la Bourse, Les Berges du Lac 2, 1053 Tunis",
      phone: "+216 71 960 200",
      email: "lac@cieloterre.tn",
    },
    {
      city: "Sousse",
      address: "Boulevard 14 Janvier, 4039 Sousse",
      phone: "+216 73 220 300",
      email: "sousse@cieloterre.tn",
    },
  ],
} as const;

export const NAV = [
  { label: "Acheter", href: "/acheter" },
  { label: "Louer", href: "/louer" },
  { label: "Neuf", href: "/neuf" },
  { label: "Vendre", href: "/vendre" },
  { label: "Agences", href: "/agences" },
  { label: "Conseils", href: "/conseils" },
] as const;

export const FOOTER_GROUPS = [
  {
    title: "Chercher",
    links: [
      { label: "Acheter", href: "/acheter" },
      { label: "Louer", href: "/louer" },
      { label: "Programmes neufs", href: "/neuf" },
      { label: "Tous les biens", href: "/biens" },
      { label: "Mes favoris", href: "/favoris" },
    ],
  },
  {
    title: "Confier",
    links: [
      { label: "Vendre un bien", href: "/vendre" },
      { label: "Gestion locative", href: "/gestion-locative" },
      { label: "Estimer mon bien", href: "/vendre#estimation" },
    ],
  },
  {
    title: "CieloTerre",
    links: [
      { label: "À propos", href: "/a-propos" },
      { label: "Nos agences", href: "/agences" },
      { label: "Nos conseillers", href: "/agents" },
      { label: "Conseils", href: "/conseils" },
      { label: "Contact", href: "/contact" },
    ],
  },
] as const;

export const POPULAR_CITIES = [
  "La Marsa",
  "Carthage",
  "Gammarth",
  "Sidi Bou Said",
  "Lac 2",
  "La Soukra",
  "Hammamet",
  "Sousse",
  "Djerba",
] as const;
