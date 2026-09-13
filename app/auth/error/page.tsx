import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const ERROR_MESSAGES: Record<string, { title: string; body: string }> = {
  access_blocked: {
    title: "Accès suspendu",
    body: "Votre accès à l'espace professionnel a été suspendu par un administrateur. Contactez votre agence pour plus d'informations.",
  },
  staff_only: {
    title: "Accès réservé à l'équipe",
    body: "Ce compte n'est pas rattaché à l'équipe CieloTerre. Connectez-vous avec un compte autorisé.",
  },
};

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ error: string }>;
}) {
  const params = await searchParams;
  // `error` comes from the URL, so it is attacker-controlled. Render it only
  // when it looks like a Supabase error code, never as free text someone can
  // choose — otherwise this card will happily display their phishing copy.
  const code = params?.error;
  const isErrorCode =
    typeof code === "string" && /^[a-z0-9_]{1,64}$/.test(code);
  const known = isErrorCode ? ERROR_MESSAGES[code] : undefined;

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">
                {known?.title ?? "Oups, quelque chose s'est mal passé."}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {known?.body ??
                  (isErrorCode
                    ? `Code erreur : ${code}`
                    : "Une erreur non identifiée est survenue.")}
              </p>
              <Link
                href="/auth/login"
                className="mt-6 inline-flex rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-accent"
              >
                Retour à la connexion
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
