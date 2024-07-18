import { Injectable } from '@angular/core';
import { Geolocation } from '@capacitor/geolocation';

@Injectable({
  providedIn: 'root'
})
export class GeoLocationService {

  constructor() {}

  async getCurrentLocation() {
    try {
      const coordinates = await Geolocation.getCurrentPosition({enableHighAccuracy: true});
      return {
        latitude: coordinates.coords.latitude,
        longitude: coordinates.coords.longitude
      };
    } catch (e) {
      console.error('Error getting location', e);
      return null;
    }
  }

  checkIfLocationMatches(targetLat: number, targetLng: number, currentLat: number, currentLng: number, radius: number): boolean {
    const earthRadiusKm = 6371;

    const dLat = this.degreesToRadians(currentLat - targetLat);
    const dLng = this.degreesToRadians(currentLng - targetLng);

    const lat1 = this.degreesToRadians(targetLat);
    const lat2 = this.degreesToRadians(currentLat);

    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.sin(dLng/2) * Math.sin(dLng/2) * Math.cos(lat1) * Math.cos(lat2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = earthRadiusKm * c;

    return distance <= radius;
  }

  private degreesToRadians(degrees: number) {
    return degrees * Math.PI / 180;
  }}
