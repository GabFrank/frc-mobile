/// <reference types="@types/googlemaps" />

import { Location } from '@angular/common';
import {
  AfterViewInit,
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

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-localizacion-marcacion',
  templateUrl: './localizacion-marcacion.component.html',
  styleUrls: ['./localizacion-marcacion.component.scss']
})
export class LocalizacionMarcacionComponent implements OnInit {

  @ViewChild('mapContainer', { static: false }) mapContainer: ElementRef;

  map: any;
  userPosition: { lat: number; lng: number };
  isLoading = null;
  isInBodega = false;
  selectedBodega: Sucursal;

  constructor(
    private route: ActivatedRoute,
    private location: Location,
    private geoLocation: GeoLocationService,
    private sucursalService: SucursalService,
    private router: Router
  ) {}

  ngOnInit() {
    this.route.paramMap.pipe(untilDestroyed(this)).subscribe((res) => {
      this.isLoading = true;
      this.geoLocation
        .getCurrentLocation()
        .then((res2: { latitude: number; longitude: number }) => {
          this.isLoading = false;
          this.userPosition = { lat: res2.latitude, lng: res2.longitude }; // Replace with actual position
          const mapOptions = {
            center: this.userPosition,
            zoom: 19
          };
          this.map = new google.maps.Map(
            this.mapContainer.nativeElement,
            mapOptions
          );
          new google.maps.Marker({
            position: this.userPosition,
            map: this.map,
            title: 'You are here!'
          });
          console.log('mostrando mapa');
        })
        .then(async () => {
          (await this.sucursalService.onGetAllSucursales()).subscribe(
            sucRes => {
              if (sucRes?.length > 0) {
                console.log(sucRes);
                this.selectedBodega = sucRes.find((s) => {
                  if (s.localizacion != null) {
                    let sucLoc = s.localizacion.split(',');
                    console.log(sucLoc);

                    let match = this.geoLocation.checkIfLocationMatches(
                      +sucLoc[0],
                      +sucLoc[1],
                      this.userPosition.lat,
                      this.userPosition.lng,
                      0.03
                    );
                    console.log(match);
                    return match;

                  }
                });
                if (this.selectedBodega != null) {
                  this.isInBodega = true;
                } else {
                  this.isInBodega = false;
                }
              }
            }
          );
        });
    });
  }

  onTryAgain() {
    this.ngOnInit();
  }

  onConfirmar() {
    this.router.navigate(['identificacion/'+this.selectedBodega?.id], { relativeTo: this.route });
  }

  onBack() {
    this.location.back();
  }
}
