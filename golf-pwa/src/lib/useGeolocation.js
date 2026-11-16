import { useEffect, useState } from 'react';

// Live-Position über die Geolocation-API des Browsers.
export function useGeolocation(enabled) {
  const [state, setState] = useState({ status: 'idle', pos: null, accuracy: null, error: null });

  useEffect(() => {
    if (!enabled) return undefined;
    if (!('geolocation' in navigator)) {
      setState({ status: 'unsupported', pos: null, accuracy: null, error: 'Dieses Gerät unterstützt kein GPS im Browser.' });
      return undefined;
    }
    setState((s) => ({ ...s, status: 'searching', error: null }));
    const id = navigator.geolocation.watchPosition(
      (p) => setState({ status: 'ok', pos: { lat: p.coords.latitude, lng: p.coords.longitude }, accuracy: p.coords.accuracy, error: null }),
      (e) => setState((s) => ({
        ...s,
        status: 'error',
        error: e.code === 1
          ? 'Standortzugriff verweigert. Bitte in den Browser-Einstellungen erlauben.'
          : e.code === 3 ? 'Kein GPS-Signal – bitte kurz warten.' : 'Standort nicht verfügbar.',
      })),
      { enableHighAccuracy: true, maximumAge: 2000, timeout: 20000 }
    );
    return () => navigator.geolocation.clearWatch(id);
  }, [enabled]);

  return state;
}
