import { Location } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  NgZone,
  OnInit,
  ViewChild
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Sucursal } from 'src/app/domains/empresarial/sucursal/sucursal.model';
import { SucursalService } from 'src/app/domains/empresarial/sucursal/sucursal.service';
import { GeoLocationService, GeoProgress, GeoResult } from 'src/app/services/geo-location.service';
import * as L from 'leaflet';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'assets/marker-icon-2x.png',
  iconUrl: 'assets/marker-icon.png',
  shadowUrl: 'assets/marker-shadow.png',
});

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-localizacion-marcacion',
  templateUrl: './localizacion-marcacion.component.html',
  styleUrls: ['./localizacion-marcacion.component.scss']
})
export class LocalizacionMarcacionComponent implements OnInit {

  @ViewChild('mapContainer', { static: false }) mapContainer: ElementRef;

  map: L.Map;
  userPosition: { lat: number; lng: number };
  isLoading = null;
  isInBodega = false;
  selectedBodega: Sucursal;
  distanciaMetros: number | null = null;
  mapReady = false;

  gpsAccuracy: number | null = null;
  gpsMessage = '';
  gpsStatus: string = '';
  gpsReadingsCollected = 0;
  gpsReadingsNeeded = 5;
  gpsError = false;

  private userIcon = L.divIcon({
    className: 'custom-div-icon',
    html: `<div style='background-color: #4285F4; width: 20px; height: 20px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 2px 10px rgba(0,0,0,0.3);'></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10]
  });

  constructor(
    private route: ActivatedRoute,
    private location: Location,
    private geoLocation: GeoLocationService,
    private sucursalService: SucursalService,
    private router: Router,
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit() {
    this.route.paramMap.pipe(untilDestroyed(this)).subscribe(() => {
      this.loadLocation();
    });
  }

  private async loadLocation() {
    this.isLoading = true;
    this.gpsError = false;
    this.gpsMessage = '';
    this.gpsAccuracy = null;
    this.gpsReadingsCollected = 0;
    this.mapReady = false;

    const result = await this.geoLocation.getCurrentLocation(
      (progress: GeoProgress) => {
        this.ngZone.run(() => {
          this.gpsStatus = progress.status;
          this.gpsMessage = progress.message;
          this.gpsAccuracy = progress.currentAccuracy;
          this.gpsReadingsCollected = progress.readingsCollected;
          this.gpsReadingsNeeded = progress.totalReadingsNeeded;

          if (progress.status === 'error') {
            this.gpsError = true;
          }
          this.cdr.detectChanges();
        });
      }
    );

    this.isLoading = false;

    if (!result) {
      this.gpsError = true;
      this.gpsMessage = this.gpsMessage || 'No se pudo obtener la ubicación. Verifique que el GPS esté activo con ubicación precisa.';
      this.cdr.detectChanges();
      return;
    }

    this.gpsAccuracy = result.accuracy;
    this.userPosition = { lat: result.latitude, lng: result.longitude };
    this.cdr.detectChanges();

    setTimeout(() => {
      this.initMap();
      this.evaluateSucursales(result);
    }, 100);
  }

  private initMap() {
    if (!this.mapContainer?.nativeElement) {
      console.error('Map container not available');
      return;
    }

    this.map = L.map(this.mapContainer.nativeElement, {
      center: [this.userPosition.lat, this.userPosition.lng],
      zoom: 19,
      zoomControl: true
    });

    L.tileLayer('https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
      attribution: '&copy; Google Maps',
      maxZoom: 21
    }).addTo(this.map);

    L.marker([this.userPosition.lat, this.userPosition.lng], {
      icon: this.userIcon
    }).addTo(this.map)
      .bindPopup(`Estás aquí (±${this.gpsAccuracy?.toFixed(0) || '?'}m)`)
      .openPopup();

    if (this.gpsAccuracy) {
      L.circle([this.userPosition.lat, this.userPosition.lng], {
        radius: this.gpsAccuracy,
        color: '#4285F4',
        fillColor: '#4285F430',
        fillOpacity: 0.2,
        weight: 1
      }).addTo(this.map);
    }

    this.mapReady = true;
    this.cdr.detectChanges();

    setTimeout(() => {
      if (this.map) {
        this.map.invalidateSize();
      }
    }, 300);
  }

  private async evaluateSucursales(geoResult: GeoResult) {
    (await this.sucursalService.onGetAllSucursales()).subscribe(sucRes => {
      if (!sucRes?.length || !this.userPosition) return;

      const sucursalesConDistancia = sucRes
        .filter(s => s.localizacion != null)
        .map(s => {
          const sucLoc = s.localizacion.split(',');
          const distanciaMetros = this.geoLocation.calculateDistanceMeters(
            +sucLoc[0], +sucLoc[1],
            this.userPosition.lat, this.userPosition.lng
          );
          return { sucursal: s, distancia: distanciaMetros };
        });

      sucursalesConDistancia.sort((a, b) => a.distancia - b.distancia);

      if (sucursalesConDistancia.length > 0) {
        const masCercana = sucursalesConDistancia[0];
        this.distanciaMetros = Math.round(masCercana.distancia);

        const radioSucursal = 20;
        const isMatch = this.geoLocation.checkIfLocationMatches(
          +masCercana.sucursal.localizacion.split(',')[0],
          +masCercana.sucursal.localizacion.split(',')[1],
          this.userPosition.lat, this.userPosition.lng,
          radioSucursal, geoResult.accuracy
        );

        if (isMatch) {
          this.selectedBodega = masCercana.sucursal;
          this.isInBodega = true;
        } else {
          this.isInBodega = false;
        }
      }
    });
  }

  getAccuracyColor(): string {
    if (!this.gpsAccuracy) return 'medium';
    if (this.gpsAccuracy <= GeoLocationService.MAX_ACCURACY) return 'success';
    if (this.gpsAccuracy <= 50) return 'warning';
    return 'danger';
  }

  getAccuracyLabel(): string {
    if (!this.gpsAccuracy) return '';
    if (this.gpsAccuracy <= GeoLocationService.MAX_ACCURACY) return 'Excelente';
    if (this.gpsAccuracy <= 50) return 'Aceptable';
    return 'Baja';
  }

  onTryAgain() {
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
    this.mapReady = false;
    this.isInBodega = false;
    this.selectedBodega = null;
    this.distanciaMetros = null;
    this.userPosition = null;
    this.loadLocation();
  }

  onConfirmar() {
    this.router.navigate(['identificacion/' + this.selectedBodega?.id], {
      relativeTo: this.route,
      queryParamsHandling: 'preserve'
    });
  }

  onBack() {
    this.location.back();
  }
}
