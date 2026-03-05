import { Location } from '@angular/common';
import {
  Component,
  ElementRef,
  OnInit,
  ViewChild
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Sucursal } from 'src/app/domains/empresarial/sucursal/sucursal.model';
import { SucursalService } from 'src/app/domains/empresarial/sucursal/sucursal.service';
import { GeoLocationService } from 'src/app/services/geo-location.service';
import * as L from 'leaflet';

// Fix para el icono por defecto de Leaflet
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

  // Icono personalizado para la posición del usuario
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
    private router: Router
  ) { }

  ngOnInit() {
    this.route.paramMap.pipe(untilDestroyed(this)).subscribe((res) => {
      this.isLoading = true;
      this.geoLocation
        .getCurrentLocation()
        .then((res2: { latitude: number; longitude: number }) => {
          this.isLoading = false;
          if (!res2) {
            console.error('No se pudo obtener la ubicación');
            return;
          }
          this.userPosition = { lat: res2.latitude, lng: res2.longitude };

          // Inicializar mapa con Leaflet + Google Maps tiles
          this.map = L.map(this.mapContainer.nativeElement, {
            center: [this.userPosition.lat, this.userPosition.lng],
            zoom: 19,
            zoomControl: true
          });

          // Google Maps tiles (muestra nombres de comercios)
          L.tileLayer('https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
            attribution: '&copy; Google Maps',
            maxZoom: 21
          }).addTo(this.map);

          // Marcador de posición del usuario
          L.marker([this.userPosition.lat, this.userPosition.lng], {
            icon: this.userIcon
          }).addTo(this.map)
            .bindPopup('Estás aquí')
            .openPopup();

          console.log('mostrando mapa');

          // Forzar recálculo del tamaño del mapa
          setTimeout(() => {
            if (this.map) {
              this.map.invalidateSize();
            }
          }, 300);
        })
        .catch(err => {
          this.isLoading = false;
          console.error('Error obteniendo ubicación:', err);
        })
        .finally(async () => {
          (await this.sucursalService.onGetAllSucursales()).subscribe(
            sucRes => {
              if (sucRes?.length > 0) {
                if (!this.userPosition) {
                  return;
                }
                let sucursalesConDistancia = sucRes.filter(s => s.localizacion != null).map(s => {
                  let sucLoc = s.localizacion.split(',');
                  let d = this.geoLocation.calculateDistance(
                    +sucLoc[0],
                    +sucLoc[1],
                    this.userPosition.lat,
                    this.userPosition.lng
                  );
                  return { sucursal: s, distancia: d * 1000 }; // metros
                });

                // Ordenar por distancia para encontrar la más cercana
                sucursalesConDistancia.sort((a, b) => a.distancia - b.distancia);

                if (sucursalesConDistancia.length > 0) {
                  const masCercana = sucursalesConDistancia[0];
                  this.distanciaMetros = Math.round(masCercana.distancia);

                  // Si la más cercana está dentro del radio de 0.03 (aprox 3km en el check original)
                  // Pero para "En sucursal" usualmente se usa algo más corto.
                  // Respetaré el 0.03 original del usuario para isInBodega
                  // Reducir tolerancia a 30 metros (antes 100 metros)
                  if (masCercana.distancia <= 30) {
                    this.selectedBodega = masCercana.sucursal;
                    this.isInBodega = true;
                  } else {
                    this.isInBodega = false;
                  }
                }
              }
            }
          );
        });
    });
  }

  onTryAgain() {
    // Destruir mapa anterior si existe
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
    this.ngOnInit();
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

