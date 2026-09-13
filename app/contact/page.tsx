import { PageShell } from "@/components/site-chrome";
import { ContactPageContent } from "@/components/contact/contact-page-content";

export default function ContactPage() {
  return (
    <PageShell>
      <ContactPageContent />
    </PageShell>
  );
}
export const metadata = { title: "Contactez CieloTerre" };
