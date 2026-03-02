import { Injectable } from '@angular/core';
import { Geolocation } from '@capacitor/geolocation';

@Injectable({
  providedIn: 'root'
})
export class GeoLocationService {

  constructor() { }

  async getCurrentLocation(): Promise<{ latitude: number; longitude: number; accuracy: number } | null> {
    return new Promise(async (resolve) => {
      let bestResult: { latitude: number; longitude: number; accuracy: number } | null = null;
      let watchId: string | null = null;
      const DESIRED_ACCURACY = 50; // metros
      const TIMEOUT = 15000; // 15 segundos máximo de espera

      // Timeout: si no se consigue la precisión deseada, devolver la mejor lectura disponible
      const timeoutId = setTimeout(async () => {
        if (watchId) {
          await Geolocation.clearWatch({ id: watchId });
        }
        if (bestResult) {
          console.log(`Timeout alcanzado. Mejor precisión obtenida: ${bestResult.accuracy}m`);
          resolve(bestResult);
        } else {
          // Fallback: intentar getCurrentPosition como último recurso
          try {
            const coords = await Geolocation.getCurrentPosition({ enableHighAccuracy: true });
            resolve({
              latitude: coords.coords.latitude,
              longitude: coords.coords.longitude,
              accuracy: coords.coords.accuracy
            });
          } catch (e) {
            console.error('Error getting location (fallback)', e);
            resolve(null);
          }
        }
      }, TIMEOUT);

      try {
        watchId = await Geolocation.watchPosition(
          { enableHighAccuracy: true },
          (position, err) => {
            if (err) {
              console.error('watchPosition error:', err);
              return;
            }
            if (position) {
              const accuracy = position.coords.accuracy;
              console.log(`Lectura GPS - Lat: ${position.coords.latitude}, Lng: ${position.coords.longitude}, Precisión: ${accuracy}m`);

              // Guardar si es la mejor lectura hasta ahora
              if (!bestResult || accuracy < bestResult.accuracy) {
                bestResult = {
                  latitude: position.coords.latitude,
                  longitude: position.coords.longitude,
                  accuracy: accuracy
                };
              }

              // Si la precisión es suficiente, resolver inmediatamente
              if (accuracy <= DESIRED_ACCURACY) {
                clearTimeout(timeoutId);
                Geolocation.clearWatch({ id: watchId }).then(() => {
                  console.log(`Ubicación precisa obtenida: ${accuracy}m`);
                  resolve(bestResult);
                });
              }
            }
          }
        );
      } catch (e) {
        clearTimeout(timeoutId);
        console.error('Error starting watchPosition', e);
        // Fallback a getCurrentPosition
        try {
          const coords = await Geolocation.getCurrentPosition({ enableHighAccuracy: true, timeout: 10000 });
          resolve({
            latitude: coords.coords.latitude,
            longitude: coords.coords.longitude,
            accuracy: coords.coords.accuracy
          });
        } catch (e2) {
          console.error('Error getting location (fallback 2)', e2);
          resolve(null);
        }
      }
    });
  }

  checkIfLocationMatches(targetLat: number, targetLng: number, currentLat: number, currentLng: number, radius: number): boolean {
    const earthRadiusKm = 6371;

    const dLat = this.degreesToRadians(currentLat - targetLat);
    const dLng = this.degreesToRadians(currentLng - targetLng);

    const lat1 = this.degreesToRadians(targetLat);
    const lat2 = this.degreesToRadians(currentLat);

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.sin(dLng / 2) * Math.sin(dLng / 2) * Math.cos(lat1) * Math.cos(lat2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = earthRadiusKm * c;

    return distance <= radius;
  }

  private degreesToRadians(degrees: number) {
    return degrees * Math.PI / 180;
  }
}
