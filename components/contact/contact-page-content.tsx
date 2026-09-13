import { Clock, Mail, MapPin, Phone } from "lucide-react";
import { ContactBanner } from "@/components/page-sections";
import { LeadForm, PageIntro } from "@/components/property-ui";

const agencies = [
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
];

export function ContactPageContent() {
  return (
    <div className="mx-auto max-w-[1100px]">
      <div className="grid gap-12 lg:grid-cols-[1fr_.8fr] lg:items-start">
        <div>
          <PageIntro
            eyebrow="Nous trouver"
            title={
              <>
                Parlons de votre <em>prochaine adresse.</em>
              </>
            }
          >
            Que vous cherchiez à acheter, louer ou confier un bien, nos conseillers vous accompagnent avec discernement et discrétion.
          </PageIntro>

          {/* Quick contact channels */}
          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            <a
              href="tel:+21671740100"
              className="luxury-card flex items-center gap-3.5 p-4 transition-colors hover:border-primary"
            >
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-surface text-primary">
                <Phone size={18} />
              </span>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-accent">Téléphone</p>
                <p className="text-sm font-semibold text-foreground">+216 71 740 100</p>
              </div>
            </a>

            <a
              href="mailto:contact@cieloterre.tn"
              className="luxury-card flex items-center gap-3.5 p-4 transition-colors hover:border-primary"
            >
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-surface text-primary">
                <Mail size={18} />
              </span>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-accent">Email direct</p>
                <p className="text-sm font-semibold text-foreground">contact@cieloterre.tn</p>
              </div>
            </a>
          </div>

          <div className="mt-6 flex items-center gap-2.5 rounded-2xl border border-cool-light bg-surface/50 px-5 py-3.5 text-xs text-soft-foreground">
            <Clock size={16} className="text-primary shrink-0" />
            <span>Nos agences vous accueillent du lundi au samedi, de 09h00 à 19h00 sur rendez-vous.</span>
          </div>

          {/* Agency list */}
          <div className="mt-10">
            <h3 className="font-serif text-2xl text-foreground">Nos bureaux en Tunisie</h3>
            <div className="mt-4 space-y-3">
              {agencies.map((agency) => (
                <div
                  key={agency.city}
                  className="rounded-2xl border border-cool-light bg-background p-4 text-xs leading-relaxed"
                >
                  <p className="font-bold text-foreground flex items-center gap-1.5">
                    <MapPin size={13} className="text-accent" /> {agency.city}
                  </p>
                  <p className="mt-1 text-soft-foreground">{agency.address}</p>
                  <p className="mt-1.5 font-medium text-primary">{agency.phone}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div>
          <LeadForm title="Écrire à notre équipe" />
        </div>
      </div>

      <div className="mt-20">
        <ContactBanner
          title="Un premier échange, simplement."
          text="Laissez vos coordonnées et quelques mots sur votre projet. Nous vous répondrons avec l’attention qu’il mérite."
        />
      </div>
    </div>
  );
}

