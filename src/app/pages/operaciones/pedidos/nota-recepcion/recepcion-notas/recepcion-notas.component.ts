import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { Location } from '@angular/common';
import { Router } from '@angular/router';
import { BarcodeScanner } from '@awesome-cordova-plugins/barcode-scanner/ngx';
import { TipoEntidad } from 'src/app/domains/enums/tipo-entidad.enum';
import { CargandoService } from 'src/app/services/cargando.service';
import { MainService } from 'src/app/services/main.service';
import {
  NotificacionService,
  TipoNotificacion
} from 'src/app/services/notificacion.service';
import { Sucursal } from 'src/app/domains/empresarial/sucursal/sucursal.model';
import { SucursalService } from 'src/app/domains/empresarial/sucursal/sucursal.service';
import { FormControl } from '@angular/forms';
import { NotaRecepcion } from '../nota-recepcion.model';
import { NotaRecepcionService } from '../nota-recepcion.service';
import {
  GenericListDialogComponent,
  GenericListDialogData,
  TableData
} from 'src/app/components/generic-list-dialog/generic-list-dialog.component';
import { ModalService, ModalSize } from 'src/app/services/modal.service';
import { ProveedoresSearchByPersonaGQL } from 'src/app/pages/personas/proveedor/graphql/proveedorSearchByPersona';
import { ProveedoresSearchByPersonaPageGQL } from 'src/app/pages/personas/proveedor/graphql/proveedorSearchByPersonaPage';
import { Proveedor } from 'src/app/pages/personas/proveedor/proveedor.model';
import { DialogoService } from 'src/app/services/dialogo.service';
import { NotaRecepcionInfoDialogComponent } from '../nota-recepcion-info-dialog/nota-recepcion-info-dialog.component';
import { IonInput } from '@ionic/angular';
import { RecepcionMercaderiaService } from '../../recepcion-mercaderia/recepcion-mercaderia.service';
import { MonedaService } from '../../../moneda/moneda.service';
import { Moneda } from '../../../moneda/moneda.model';
import { first } from 'rxjs/operators';

@Component({
  selector: 'app-recepcion-notas',
  templateUrl: './recepcion-notas.component.html',
  styleUrls: ['./recepcion-notas.component.scss'],
  providers: [BarcodeScanner]
})
export class RecepcionNotasComponent implements OnInit {
  @ViewChild('numeroNotaInput', { static: false, read: IonInput })
  numeroNotaInput: IonInput;

  numeroNotaControl = new FormControl();
  buscarProveedorControl = new FormControl();
  selectedSucursal: Sucursal;
  notaRecepcionList: NotaRecepcion[] = [];
  selectedProveedor: Proveedor;
  constructor(
    private _location: Location,
    private barcodeScanner: BarcodeScanner,
    private cargandoService: CargandoService,
    private notificacionService: NotificacionService,
    private mainService: MainService,
    private router: Router,
    private sucursalService: SucursalService,
    private notaRecepcionService: NotaRecepcionService,
    private modalService: ModalService,
    public proveedorSearchPage: ProveedoresSearchByPersonaPageGQL,
    private dialogService: DialogoService,
    private recepcionMercaderiaService: RecepcionMercaderiaService,
    private monedaService: MonedaService
  ) { }

  ngOnInit() {
    console.log(this.mainService.isDev);

    this.onVerificarSucursal();
  }

  async onVerificarSucursal() {
    let loading = await this.cargandoService.open('Abriendo camara...');
    setTimeout(() => {
      this.cargandoService.close(loading);
    }, 1000);
    if (!this.mainService.isDev) {
      this.barcodeScanner
        .scan()
        .then(async (barcodeData) => {
          this.notificacionService.open(
            'Escaneado con éxito!',
            TipoNotificacion.SUCCESS,
            1
          );
          let codigo: string = barcodeData.text;
          let arr = codigo.split('-');
          let prefix = arr[2];
          let sucId: number = +arr[1];
          (await this.sucursalService.onGetSucursal(sucId)).subscribe(
            (sucRes) => {
              if (sucRes != null) {
                this.selectedSucursal = sucRes;
              }
            }
          );
        })
        .catch((err) => {
          this.notificacionService.openAlgoSalioMal();
          return false || this.mainService.isDev;
        });
    } else {
      (await this.sucursalService.onGetSucursal(1)).subscribe((sucRes) => {
        if (sucRes != null) {
          this.selectedSucursal = sucRes;
        }
      });
    }
  }

  onSearchProveeodr() {
    let tableData: TableData[] = [
      {
        id: 'id',
        nombre: 'Id',
        width: 100,
        nested: false
      },
      {
        id: 'persona',
        nombre: 'Nombre',
        width: 100,
        nested: true,
        nestedId: 'nombre'
      }
    ];
    let data: GenericListDialogData = {
      tableData: tableData,
      titulo: 'Lista de proveedores',
      search: true,
      texto: this.buscarProveedorControl.value?.toUpperCase(),
      query: this.proveedorSearchPage,
      paginator: true
    };

    this.modalService
      .openModal(GenericListDialogComponent, data)
      .then((res) => {
        if (res?.data != null) {
          this.selectedProveedor = res.data;
          this.buscarProveedorControl.setValue(null);
        }
      });
  }

  async onAddNumeroNota() {
    if (
      this.selectedProveedor != null &&
      this.numeroNotaControl.value != null
    ) {
      // Validar que tenemos sucursal seleccionada
      if (!this.selectedSucursal) {
        this.notificacionService.warn('Debe seleccionar una sucursal antes de buscar notas');
        return;
      }

      (
        await this.notaRecepcionService.onGetNotaRecepcionPorProveedorAndNumero(
          this.selectedProveedor.id,
          this.numeroNotaControl.value
        )
      ).subscribe(async (res) => {
        if (res?.length == 1) {
          const nota = res[0];
          
          // Verificar si ya existe una recepción activa para esta nota en esta sucursal
          try {
            const recepcionActivaObs = await this.recepcionMercaderiaService.onVerificarRecepcionActivaPorNotaYSucursal(
              nota.id,
              this.selectedSucursal.id
            );
            const recepcionActiva = await recepcionActivaObs.pipe(first()).toPromise();
            
            if (recepcionActiva) {
              // Ya existe una recepción (activa o finalizada)
              let mensaje: string;
              if (recepcionActiva.estado === 'FINALIZADA') {
                mensaje = `Esta nota ya fue recibida y finalizada (Recepción ID: ${recepcionActiva.id}) en ${this.selectedSucursal.nombre}. ` +
                          `Si necesita hacer correcciones, use la opción 'Reabrir recepción' en lugar de agregar esta nota. ` +
                          `Crear una nueva recepción duplicaría movimientos de stock y costos.`;
              } else {
                mensaje = `Esta nota ya tiene una recepción en proceso (ID: ${recepcionActiva.id}, Estado: ${recepcionActiva.estado}) en ${this.selectedSucursal.nombre}. ` +
                          `Debe finalizar o cancelar la recepción existente antes de agregar esta nota.`;
              }
              this.notificacionService.warn(mensaje);
              setTimeout(() => {
                this.numeroNotaInput?.setFocus();
              }, 1000);
              return;
            }
          } catch (error) {
            console.error('Error al verificar recepción activa:', error);
            // Continuar con el flujo normal si hay error en la verificación
          }

          // No hay recepción activa, proceder con el diálogo
          this.modalService
            .openModal(
              NotaRecepcionInfoDialogComponent,
              {
                notaRecepcion: nota
              },
              ModalSize.MEDIUM
            )
            .then((dialogRes) => {
              if (dialogRes?.data?.agregar) {
                this.notaRecepcionList.push(nota);
                this.numeroNotaControl.setValue(null);
                setTimeout(() => {
                  this.numeroNotaInput?.setFocus();
                }, 1000);
              }
            });
        } else if (res?.length == 0) {
          setTimeout(() => {
            this.numeroNotaInput.setFocus();
          }, 1000);
        }
      });
    }
  }

  delelteNotaFromList(nota, i) {
    this.dialogService
      .open('Atención!!', 'Realmente desea eliminar este item de la lista?')
      .then((res) => {
        if (res.role == 'aceptar') {
          this.notaRecepcionList.splice(i, 1);
          setTimeout(() => {
            this.numeroNotaInput?.setFocus();
          }, 1000);
        }
      });
  }

  onNotaRecepcionClick(notaRecepcion: NotaRecepcion, index?) {
    this.modalService
      .openModal(
        NotaRecepcionInfoDialogComponent,
        {
          notaRecepcion: notaRecepcion,
          index
        },
        ModalSize.MEDIUM
      )
      .then((dialogRes) => {
        if (dialogRes?.data?.eliminar) {
          this.notaRecepcionList.splice(index, 1);
          setTimeout(() => {
            this.numeroNotaInput?.setFocus();
          }, 1000);
        }
      });
  }

  onBorrarProveedor() {
    this.dialogService
      .open(
        'Atención!!',
        'Realmente desea cambiar de proveedor?. Las notas agregadas serán eliminadas.'
      )
      .then((res) => {
        if (res.role == 'aceptar') {
          this.selectedProveedor = null;
          this.notaRecepcionList = [];
        }
      });
  }

  async onIniciarRecepcion() {
    const dialogResult = await this.dialogService.open('Atención!!', 'Realmente desea iniciar la recepción de notas?');
    if (dialogResult.role === 'aceptar') {
      try {
        // Validar que tenemos todos los datos necesarios
        if (!this.selectedProveedor || !this.selectedSucursal || !this.mainService.usuarioActual) {
          this.notificacionService.warn('Faltan datos requeridos para iniciar la recepción');
          return;
        }

        if (!this.notaRecepcionList || this.notaRecepcionList.length === 0) {
          this.notificacionService.warn('Debe agregar al menos una nota de recepción');
          return;
        }

        // Obtener moneda (usar la primera disponible o una por defecto)
        const monedasObs = await this.monedaService.onGetAll();
        const monedas = await monedasObs.pipe(first()).toPromise();
        let monedaId: number;
        if (monedas && monedas.length > 0) {
          // Buscar moneda Guaraníes (Gs) o usar la primera
          const monedaGs = monedas.find(m => m.denominacion?.toUpperCase().includes('GUARANI') || m.denominacion?.toUpperCase().includes('GS'));
          monedaId = monedaGs?.id || monedas[0].id;
        } else {
          this.notificacionService.warn('No se encontró moneda disponible');
          return;
        }

        // Obtener IDs de las notas
        const notaRecepcionIds = this.notaRecepcionList.map(nota => nota.id);

        // Llamar al método iniciarRecepcion que crea la recepción, asocia notas y pre-crea items
        (await this.recepcionMercaderiaService.onIniciarRecepcion(
          this.selectedSucursal.id,
          notaRecepcionIds,
          this.selectedProveedor.id,
          monedaId,
          this.mainService.usuarioActual.id,
          1.0 // cotizacion por defecto
        )).subscribe({
          next: (recepcionMercaderia) => {
            if (recepcionMercaderia != null) {
              console.log('Recepción iniciada exitosamente:', recepcionMercaderia);
              this.notificacionService.openGuardadoConExito();
              this.router.navigate(['/operaciones/pedidos/recepcion-producto', recepcionMercaderia.id]);
            }
          },
          error: (error) => {
            console.error('Error al iniciar recepción:', error);
            this.notificacionService.openAlgoSalioMal();
          }
        });
      } catch (error) {
        console.error('Error during save operation:', error);
        this.notificacionService.openAlgoSalioMal();
      }
    }
  }

  onSolicitarPago() { }

  onBack() {
    this._location.back();
  }
}
