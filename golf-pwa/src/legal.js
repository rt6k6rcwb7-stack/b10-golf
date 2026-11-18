// Angaben für Impressum und Datenschutzerklärung.
// Platzhalter in [[…]] müssen vor der Veröffentlichung ersetzt werden – solange sie drinstehen,
// zeigt die App auf beiden Seiten einen deutlichen Hinweis.
export const OPERATOR = {
  name: '[[Vor- und Nachname]]',
  street: '[[Straße Hausnummer]]',
  city: '[[PLZ Ort]]',
  email: '[[E-Mail-Adresse]]',
};

// Dienste, die die App tatsächlich nutzt (für die Datenschutzerklärung)
export const SERVICES = {
  hosting: {
    name: 'GitHub Pages',
    company: 'GitHub, Inc., 88 Colin P. Kelly Jr. Street, San Francisco, CA 94107, USA',
    privacy: 'https://docs.github.com/de/site-policy/privacy-policies/github-general-privacy-statement',
  },
  database: {
    name: 'Supabase',
    company: 'Supabase, Inc. (USA)',
    region: 'Rechenzentrum in Irland (Amazon Web Services, Region eu-west-1)',
    privacy: 'https://supabase.com/privacy',
  },
  email: {
    name: 'Brevo',
    company: 'Sendinblue SAS (Brevo), 106 boulevard Haussmann, 75008 Paris, Frankreich',
    privacy: 'https://www.brevo.com/de/legal/privacypolicy/',
  },
};

export const LEGAL_UPDATED = 'November 2026';

export const hasPlaceholders = () => Object.values(OPERATOR).some((v) => /\[\[/.test(v));
