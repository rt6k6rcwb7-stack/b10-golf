// Feste Verbindung zur B10-Datenbank (Supabase).
// Adresse und anon key dürfen öffentlich sein: Lesen und Schreiben erlaubt die Datenbank
// nur mit dem Gruppen-Code, den jedes Gerät einmal eingibt – der steht NICHT hier.
// Optional beim Build überschreibbar über VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY.
export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://yobxplfvrdrgakglmgfw.supabase.co';
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
