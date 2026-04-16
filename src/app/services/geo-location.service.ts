import { Injectable } from '@angular/core';
import { Geolocation } from '@capacitor/geolocation';
import { Capacitor, registerPlugin } from '@capacitor/core';

export interface GeoResult {
  latitude: number;
  longitude: number;
  accuracy: number;
}

export type GeoStatus = 'warming' | 'reading' | 'done' | 'error';

export interface GeoProgress {
  status: GeoStatus;
  currentAccuracy: number | null;
  readingsCollected: number;
  totalReadingsNeeded: number;
  message: string;
}

interface NativeLocationPlugin {
  getCurrentPosition(options: {
    warmupMs: number;
    maxTimeMs: number;
    maxAccuracy: number;
  }): Promise<{ latitude: number; longitude: number; accuracy: number; readingsUsed: number }>;
}

const NativeLocation = registerPlugin<NativeLocationPlugin>('NativeLocation');

@Injectable({
  providedIn: 'root'
})
export class GeoLocationService {

  static readonly MAX_ACCURACY = 20;
  static readonly WARMUP_MS = 2000;
  static readonly MAX_TIME_MS = 8000;
  static readonly MIN_READINGS = 5;

  constructor() { }

  async getCurrentLocation(
    onProgress?: (progress: GeoProgress) => void
  ): Promise<GeoResult | null> {
    const permStatus = await Geolocation.checkPermissions();
    if (permStatus.location !== 'granted') {
      const req = await Geolocation.requestPermissions();
      if (req.location !== 'granted') {
        onProgress?.({
          status: 'error', currentAccuracy: null,
          readingsCollected: 0, totalReadingsNeeded: GeoLocationService.MIN_READINGS,
          message: 'Permiso de ubicación denegado'
        });
        return null;
      }
    }

    if (Capacitor.isNativePlatform()) {
      try {
        return await this.getNativeLocation(onProgress);
      } catch (e) {
        console.warn('NativeLocation falló, usando Capacitor Geolocation', e);
      }
    }
    return await this.getCapacitorLocation(onProgress);
  }

  private async getNativeLocation(
    onProgress?: (progress: GeoProgress) => void
  ): Promise<GeoResult | null> {

    onProgress?.({
      status: 'warming', currentAccuracy: null,
      readingsCollected: 0, totalReadingsNeeded: GeoLocationService.MIN_READINGS,
      message: 'Activando GPS de alta precisión...'
    });

    try {
      const result = await NativeLocation.getCurrentPosition({
        warmupMs: GeoLocationService.WARMUP_MS,
        maxTimeMs: GeoLocationService.MAX_TIME_MS,
        maxAccuracy: GeoLocationService.MAX_ACCURACY
      });

      onProgress?.({
        status: 'done', currentAccuracy: result.accuracy,
        readingsCollected: result.readingsUsed, totalReadingsNeeded: GeoLocationService.MIN_READINGS,
        message: `Ubicación obtenida: ±${result.accuracy.toFixed(0)}m`
      });

      return {
        latitude: result.latitude,
        longitude: result.longitude,
        accuracy: result.accuracy
      };
    } catch (e) {
      onProgress?.({
        status: 'error', currentAccuracy: null,
        readingsCollected: 0, totalReadingsNeeded: GeoLocationService.MIN_READINGS,
        message: 'No se pudo obtener ubicación. Verifique GPS activo con ubicación precisa.'
      });
      throw e;
    }
  }

  private async getCapacitorLocation(
    onProgress?: (progress: GeoProgress) => void
  ): Promise<GeoResult | null> {
    return new Promise(async (resolve) => {
      let watchId: string | null = null;
      const readings: GeoResult[] = [];
      let isWarmingUp = true;
      let resolved = false;

      const finish = async (result: GeoResult | null) => {
        if (resolved) return;
        resolved = true;
        clearTimeout(hardTimeoutId);
        if (watchId) {
          try { await Geolocation.clearWatch({ id: watchId }); } catch (_) { }
        }
        resolve(result);
      };

      const totalTimeout = GeoLocationService.WARMUP_MS + GeoLocationService.MAX_TIME_MS;

      const hardTimeoutId = setTimeout(async () => {
        if (resolved) return;
        if (readings.length > 0) {
          const avg = this.averageReadings(readings);
          onProgress?.({
            status: 'done', currentAccuracy: avg.accuracy,
            readingsCollected: readings.length, totalReadingsNeeded: GeoLocationService.MIN_READINGS,
            message: `Ubicación obtenida: ±${avg.accuracy.toFixed(0)}m (${readings.length} lecturas)`
          });
          finish(avg);
        } else {
          onProgress?.({
            status: 'error', currentAccuracy: null,
            readingsCollected: 0, totalReadingsNeeded: GeoLocationService.MIN_READINGS,
            message: 'No se pudo obtener ubicación. Verifique GPS activo.'
          });
          finish(null);
        }
      }, totalTimeout);

      onProgress?.({
        status: 'warming', currentAccuracy: null,
        readingsCollected: 0, totalReadingsNeeded: GeoLocationService.MIN_READINGS,
        message: 'Activando GPS...'
      });

      try {
        watchId = await Geolocation.watchPosition(
          { enableHighAccuracy: true },
          (position, err) => {
            if (resolved || err || !position) return;

            const acc = position.coords.accuracy;
            const reading: GeoResult = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: acc
            };

            if (isWarmingUp) {
              onProgress?.({
                status: 'warming', currentAccuracy: acc,
                readingsCollected: 0, totalReadingsNeeded: GeoLocationService.MIN_READINGS,
                message: `Activando GPS... Precisión: ${acc.toFixed(0)}m`
              });
              return;
            }

            if (acc > 80) return;

            readings.push(reading);
            onProgress?.({
              status: 'reading', currentAccuracy: acc,
              readingsCollected: readings.length, totalReadingsNeeded: GeoLocationService.MIN_READINGS,
              message: `Lectura ${readings.length}/${GeoLocationService.MIN_READINGS} - Precisión: ${acc.toFixed(0)}m`
            });

            if (readings.length >= 3 && acc <= GeoLocationService.MAX_ACCURACY) {
              const avg = this.averageReadings(readings);
              onProgress?.({
                status: 'done', currentAccuracy: avg.accuracy,
                readingsCollected: readings.length, totalReadingsNeeded: GeoLocationService.MIN_READINGS,
                message: `Ubicación obtenida: ±${avg.accuracy.toFixed(0)}m`
              });
              finish(avg);
            }
          }
        );

        setTimeout(() => {
          isWarmingUp = false;
          if (!resolved) {
            onProgress?.({
              status: 'reading', currentAccuracy: null,
              readingsCollected: 0, totalReadingsNeeded: GeoLocationService.MIN_READINGS,
              message: 'GPS listo. Recolectando lecturas...'
            });
          }
        }, GeoLocationService.WARMUP_MS);

      } catch (e) {
        clearTimeout(hardTimeoutId);
        onProgress?.({
          status: 'error', currentAccuracy: null,
          readingsCollected: 0, totalReadingsNeeded: GeoLocationService.MIN_READINGS,
          message: 'Error al iniciar GPS.'
        });
        finish(null);
      }
    });
  }

  private averageReadings(readings: GeoResult[]): GeoResult {
    const sorted = [...readings].sort((a, b) => a.accuracy - b.accuracy);
    const count = Math.min(sorted.length, Math.max(3, Math.ceil(sorted.length * 0.6)));
    const best = sorted.slice(0, count);

    const sumLat = best.reduce((s, r) => s + r.latitude, 0);
    const sumLng = best.reduce((s, r) => s + r.longitude, 0);
    const sumAcc = best.reduce((s, r) => s + r.accuracy, 0);

    return {
      latitude: sumLat / count,
      longitude: sumLng / count,
      accuracy: sumAcc / count
    };
  }

  checkIfLocationMatches(
    targetLat: number, targetLng: number,
    currentLat: number, currentLng: number,
    radiusMeters: number, gpsAccuracy: number
  ): boolean {
    const distanceMeters = this.calculateDistanceMeters(targetLat, targetLng, currentLat, currentLng);
    return distanceMeters <= radiusMeters;
  }

  calculateDistance(targetLat: number, targetLng: number, currentLat: number, currentLng: number): number {
    const earthRadiusKm = 6371;
    const dLat = this.degreesToRadians(currentLat - targetLat);
    const dLng = this.degreesToRadians(currentLng - targetLng);
    const lat1 = this.degreesToRadians(targetLat);
    const lat2 = this.degreesToRadians(currentLat);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.sin(dLng / 2) * Math.sin(dLng / 2) * Math.cos(lat1) * Math.cos(lat2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return earthRadiusKm * c;
  }

  calculateDistanceMeters(targetLat: number, targetLng: number, currentLat: number, currentLng: number): number {
    return this.calculateDistance(targetLat, targetLng, currentLat, currentLng) * 1000;
  }

  private degreesToRadians(degrees: number) {
    return degrees * Math.PI / 180;
  }
}
