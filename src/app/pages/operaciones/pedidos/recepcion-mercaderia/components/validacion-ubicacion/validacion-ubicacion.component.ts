/// <reference types="@types/googlemaps" />

import { Component, EventEmitter, OnInit, Output, ViewChild, ElementRef } from '@angular/core';
import { Platform, ModalController } from '@ionic/angular';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Sucursal } from 'src/app/domains/empresarial/sucursal/sucursal.model';
import { SucursalService } from 'src/app/domains/empresarial/sucursal/sucursal.service';
import { CargandoService } from 'src/app/services/cargando.service';
import { GeoLocationService } from 'src/app/services/geo-location.service';
import { NotificacionService, TipoNotificacion } from 'src/app/services/notificacion.service';
import { ModalService } from 'src/app/services/modal.service';
import { GenericListDialogComponent, GenericListDialogData, TableData } from 'src/app/components/generic-list-dialog/generic-list-dialog.component';
import { SucursalesAllGQL } from 'src/app/domains/empresarial/sucursal/graphql/sucursalesAllQuery';
import { SucursalesByNombreConFiltrosGQL } from 'src/app/domains/empresarial/sucursal/graphql/sucursalesByNombreConFiltrosQuery';

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-validacion-ubicacion',
  templateUrl: './validacion-ubicacion.component.html',
  styleUrls: ['./validacion-ubicacion.component.scss']
})
export class ValidacionUbicacionComponent implements OnInit {

  @ViewChild('mapContainer', { static: false }) mapContainer: ElementRef;
  @Output() ubicacionValidada = new EventEmitter<Sucursal>();

  map: any;
  userPosition: { lat: number; lng: number };
  isLoading = false;
  isInSucursal = false;
  selectedSucursal: Sucursal;
  isWeb = false;
  sucursales: Sucursal[] = [];
  showManualSelector = false;

  constructor(
    private geoLocation: GeoLocationService,
    private sucursalService: SucursalService,
    private notificacionService: NotificacionService,
    private cargandoService: CargandoService,
    private platform: Platform,
    private modalService: ModalService,
    private modalController: ModalController
  ) {
    this.isWeb = this.platform.platforms().includes('mobileweb');
  }

  ngOnInit() {
    this.cargarSucursales();
    if (this.isWeb) {
      this.showManualSelector = true;
    } else {
      this.validarUbicacion();
    }
  }

  private async cargarSucursales() {
    try {
      // Cargar solo sucursales activas usando el filtro
      (await this.sucursalService.onGetSucursalesByFiltros({
        deposito: true,
        activo: true,
        page: 0,
        size: 1000
      })).subscribe((sucursales) => {
        this.sucursales = sucursales;
        console.log('Sucursales cargadas:', this.sucursales);
      });
    } catch (error) {
      console.error('Error al cargar sucursales:', error);
      this.notificacionService.open('Error al cargar sucursales', TipoNotificacion.DANGER, 3);
    }
  }

  async validarUbicacion() {
    if (this.isWeb) {
      return; // En web usamos selector manual
    }

    this.isLoading = true;
    
    try {
      const location = await this.geoLocation.getCurrentLocation();
      if (location) {
        this.userPosition = { lat: location.latitude, lng: location.longitude };
        this.initializeMap();
        await this.verificarSucursal();
      } else {
        this.notificacionService.open('No se pudo obtener la ubicación', TipoNotificacion.DANGER, 3);
      }
    } catch (error) {
      this.notificacionService.open('Error al obtener ubicación', TipoNotificacion.DANGER, 3);
    } finally {
      this.isLoading = false;
    }
  }

  private initializeMap() {
    if (this.mapContainer && this.userPosition) {
      const mapOptions = {
        center: this.userPosition,
        zoom: 19
      };
      
      this.map = new google.maps.Map(
        this.mapContainer.nativeElement,
        mapOptions
      );

      // Marcador de la posición del usuario
      new google.maps.Marker({
        position: this.userPosition,
        map: this.map,
        title: 'Tu ubicación',
        icon: {
          url: 'assets/icon/user-location.png',
          scaledSize: new google.maps.Size(32, 32)
        }
      });
    }
  }

  private async verificarSucursal() {
    try {
      if (this.sucursales?.length > 0) {
        this.selectedSucursal = this.sucursales.find((sucursal) => {
          if (sucursal.localizacion != null) {
            const sucLoc = sucursal.localizacion.split(',');
            const targetLat = +sucLoc[0];
            const targetLng = +sucLoc[1];
            
            // Radio de 30 metros (0.03 km) para validar ubicación
            const match = this.geoLocation.checkIfLocationMatches(
              targetLat,
              targetLng,
              this.userPosition.lat,
              this.userPosition.lng,
              0.03
            );
            
            if (match) {
              // Agregar marcador de la sucursal al mapa
              this.agregarMarcadorSucursal(targetLat, targetLng, sucursal.nombre);
            }
            
            return match;
          }
          return false;
        });

        this.isInSucursal = this.selectedSucursal != null;
        
        if (this.isInSucursal) {
          this.notificacionService.open(
            `Ubicación validada: ${this.selectedSucursal.nombre}`,
            TipoNotificacion.SUCCESS,
            2
          );
        }
      }
    } catch (error) {
      console.error('Error al verificar sucursal:', error);
      this.notificacionService.open('Error al verificar sucursal', TipoNotificacion.DANGER, 3);
    }
  }

  private agregarMarcadorSucursal(lat: number, lng: number, nombre: string) {
    if (this.map) {
      new google.maps.Marker({
        position: { lat, lng },
        map: this.map,
        title: nombre,
        icon: {
          url: 'assets/icon/store-location.png',
          scaledSize: new google.maps.Size(32, 32)
        }
      });
    }
  }

  async onSeleccionarSucursalDesdeLista() {
    console.log('onSeleccionarSucursalDesdeLista llamado');
    console.log('Sucursales disponibles:', this.sucursales);
    
    const tableData: TableData[] = [
      { id: 'id', nombre: 'ID', width: 2 },
      { id: 'nombre', nombre: 'Nombre', width: 8 },
      { id: 'ciudad.descripcion', nombre: 'Ciudad', width: 10 }
    ];

    const dialogData: GenericListDialogData = {
      titulo: 'Seleccionar Sucursal',
      tableData: tableData,
      inicialData: this.sucursales
    };

    try {
      const result = await this.modalService.openModal(GenericListDialogComponent, dialogData);
      console.log('Resultado del modal de sucursales:', result);
      
      if (result.data) {
        this.selectedSucursal = result.data;
        this.isInSucursal = true;
        
        console.log('Sucursal seleccionada:', this.selectedSucursal);
        console.log('isInSucursal actualizado a:', this.isInSucursal);
        
        this.notificacionService.open(
          `Sucursal seleccionada: ${this.selectedSucursal.nombre}`,
          TipoNotificacion.SUCCESS,
          2
        );
      }
    } catch (error) {
      console.error('Error al abrir modal de sucursales:', error);
    }
  }

  onConfirmarUbicacion() {
    console.log('onConfirmarUbicacion llamado');
    console.log('isInSucursal:', this.isInSucursal);
    console.log('selectedSucursal:', this.selectedSucursal);
    
    if (this.isInSucursal && this.selectedSucursal) {
      console.log('Confirmando ubicación para sucursal:', this.selectedSucursal.nombre);
      // Cerrar el modal y devolver la sucursal seleccionada
      this.modalController.dismiss(this.selectedSucursal);
    } else {
      console.log('No se puede confirmar ubicación - condiciones no cumplidas');
    }
  }

  onCancelar() {
    // Cerrar el modal sin devolver datos
    this.modalController.dismiss();
  }

  onReintentar() {
    this.validarUbicacion();
  }

  onCambiarAModoManual() {
    this.showManualSelector = true;
    this.isInSucursal = false;
    this.selectedSucursal = null;
  }

  onCambiarAGPS() {
    this.showManualSelector = false;
    this.validarUbicacion();
  }

  clearSucursal() {
    this.selectedSucursal = null;
    this.isInSucursal = false;
    this.notificacionService.open('Sucursal removida', TipoNotificacion.SUCCESS, 2);
  }
} 