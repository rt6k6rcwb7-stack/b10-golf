// Alle Runden lokal im Browser (LocalStorage).
const ROUNDS_KEY = 'golf.rounds.v1';
const ACTIVE_KEY = 'golf.activeRoundId.v1';

function read(key, fallback) {
  try {
    const v = localStorage.getItem(key);
    return v == null ? fallback : JSON.parse(v);
  } catch {
    return fallback;
  }
}
function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* Speicher voll oder gesperrt – App läuft im Speicher weiter */
  }
}

export const loadRounds = () => read(ROUNDS_KEY, []);
export const saveRounds = (rounds) => write(ROUNDS_KEY, rounds);
export const loadActiveId = () => read(ACTIVE_KEY, null);
export const saveActiveId = (id) => write(ACTIVE_KEY, id);
