// lib/backgroundLocation.ts
import { registerPlugin } from '@capacitor/core';

// Define plugin interface manually (because plugin has no TS types)
export interface BackgroundGeolocationPlugin {
  start(): Promise<void>;
  stop(): Promise<void>;
  addListener(
    eventName: 'onLocation',
    listenerFunc: (location: {
      latitude: number;
      longitude: number;
      accuracy: number;
    }) => void
  ): Promise<{ remove: () => void }>;

  addListener(
    eventName: 'onError',
    listenerFunc: (error: any) => void
  ): Promise<{ remove: () => void }>;
}

// Register plugin with interface
const BackgroundGeolocation = registerPlugin<BackgroundGeolocationPlugin>(
  'BackgroundGeolocation'
);

// Start background tracking
export const startBackgroundLocation = async () => {
  try {
    await BackgroundGeolocation.start();
    console.log('[BG] Started');

    // OnLocation event
    const locationListener = await BackgroundGeolocation.addListener(
      'onLocation',
      async (location) => {
        console.log('[BG] Location:', location);

        // Send to Next.js API
        await fetch('/api/track-loc', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            lat: location.latitude,
            lng: location.longitude,
            accuracy: location.accuracy,
            timestamp: new Date(),
          }),
        });
      }
    );

    const errorListener = await BackgroundGeolocation.addListener(
      'onError',
      (err) => console.error('[BG] Error:', err)
    );

    return { locationListener, errorListener };
  } catch (err) {
    console.error('[BG] Start Error:', err);
  }
};

// Stop tracking
export const stopBackgroundLocation = async () => {
  try {
    await BackgroundGeolocation.stop();
    console.log('[BG] Stopped');
  } catch (err) {
    console.error('[BG] Stop Error:', err);
  }
};
