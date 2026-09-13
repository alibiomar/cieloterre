import { PageShell } from "@/components/site-chrome";
import { AboutPageContent } from "@/components/a-propos/about-page-content";

export default function AboutPage() {
  return (
    <PageShell>
      <AboutPageContent />
    </PageShell>
  );
}
export const metadata = { title: "À propos de CieloTerre" };
