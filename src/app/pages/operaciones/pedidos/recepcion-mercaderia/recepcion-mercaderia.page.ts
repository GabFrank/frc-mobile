import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ActionSheetController, ModalController, AlertController } from '@ionic/angular';
import { Router } from '@angular/router';
import { PedidoService } from '../services/pedido.service';
import { Proveedor } from '../../../personas/proveedor/proveedor.model';
import { ProveedorService } from '../../../personas/proveedor/proveedor.service';
import { NotaRecepcion } from '../../../../domains/operaciones/pedido/nota-recepcion.model';
import { Sucursal } from '../../../../domains/empresarial/sucursal/sucursal.model';
import { Observable } from 'rxjs';
import { ValidacionUbicacionComponent } from './components/validacion-ubicacion/validacion-ubicacion.component';
import { ConfirmacionNotaComponent } from './components/confirmacion-nota/confirmacion-nota.component';
import { NotificacionService, TipoNotificacion } from '../../../../services/notificacion.service';
import { CargandoService } from '../../../../services/cargando.service';
import { ModalService } from '../../../../services/modal.service';
import { GenericListDialogComponent, GenericListDialogData, TableData } from '../../../../components/generic-list-dialog/generic-list-dialog.component';
import { NotasPendientesPageQuery } from '../graphql/notasPendientes';

@Component({
  selector: 'app-recepcion-mercaderia',
  templateUrl: './recepcion-mercaderia.page.html',
  styleUrls: ['./recepcion-mercaderia.page.scss'],
})
export class RecepcionMercaderiaPage implements OnInit {
  recepcionForm: FormGroup;
  selectedProveedor: Proveedor | null = null;
  selectedNotas: NotaRecepcion[] = [];
  puedeIniciarRecepcion = false;
  sucursalValidada: Sucursal | null = null;
  ubicacionValidada = false;
  
  constructor(
    private formBuilder: FormBuilder,
    private pedidoService: PedidoService,
    private proveedorService: ProveedorService,
    private actionSheetController: ActionSheetController,
    private modalController: ModalController,
    private alertController: AlertController,
    private router: Router,
    private notificacionService: NotificacionService,
    private cargandoService: CargandoService,
    private modalService: ModalService,
    private notasPendientesPageQuery: NotasPendientesPageQuery
  ) {
    this.recepcionForm = this.formBuilder.group({
      proveedorId: [''],
      numeroNota: ['']
    });
  }

  ngOnInit() {
    // Verificar si se pasó una sucursal desde la página de selección
    const navigation = this.router.getCurrentNavigation();
    if (navigation?.extras?.state) {
      const state = navigation.extras.state as any;
      if (state.sucursal && state.esNuevaRecepcion) {
        this.sucursalValidada = state.sucursal;
        this.ubicacionValidada = true;
        this.updatePuedeIniciar();
      }
    }
  }

  async openSearchModal() {
    if (!this.ubicacionValidada) {
      this.notificacionService.open('Debes validar tu ubicación primero', TipoNotificacion.DANGER, 3);
      return;
    }

    const tableData: TableData[] = [
      { id: 'numero', nombre: 'Número', width: 3, orientation: 'vertical' },
      { id: 'fecha', nombre: 'Fecha', width: 4, pipe: 'date', pipeArgs: 'shortDate', orientation: 'vertical' },
      { id: 'estado', nombre: 'Estado', width: 3, orientation: 'vertical' },
      { id: 'pedido.proveedor.persona.nombre', nombre: 'Proveedor' },
    ];

    const dialogData: GenericListDialogData = {
      titulo: 'Seleccionar Notas de Recepción',
      tableData: tableData,
      search: true,
      inicialSearch: true,
      query: this.notasPendientesPageQuery,
      queryParams: { 
        sucursalId: this.sucursalValidada?.id || 1, 
        proveedorId: this.recepcionForm.get('proveedorId')?.value || null 
      },
      texto: this.recepcionForm.get('numeroNota')?.value || '',
      paginator: true
    };

    try {
      const result = await this.modalService.openModal(GenericListDialogComponent, dialogData);
      if (result.data) {
        this.addNotaToList(result.data);
      }
    } catch (error) {
      console.error('Error al abrir modal de notas:', error);
    }
  }

  async openProveedorSearchModal() {
    const tableData: TableData[] = [
      { id: 'id', nombre: 'ID', width: 2 },
      { id: 'persona.nombre', nombre: 'Nombre', width: 8 },
      { id: 'persona.documento', nombre: 'Documento', width: 5 },
      { id: 'persona.telefono', nombre: 'Teléfono', width: 5 }
    ];

    const dialogData: GenericListDialogData = {
      titulo: 'Seleccionar Proveedor',
      tableData: tableData,
      search: true,
      inicialSearch: true,
      query: this.proveedorService.proveedorSearchPage,
      inicialData: { texto: this.recepcionForm.get('proveedorId')?.value || '', page: 0, size: 20 },
      paginator: true
    };

    try {
      const result = await this.modalService.openModal(GenericListDialogComponent, dialogData);
      if (result.data) {
        this.selectedProveedor = result.data;
        this.recepcionForm.patchValue({ proveedorId: this.selectedProveedor.id });
        this.notificacionService.open(
          `Proveedor seleccionado: ${this.selectedProveedor.persona.nombre}`,
          TipoNotificacion.SUCCESS,
          2
        );
      }
    } catch (error) {
      console.error('Error al abrir modal de proveedores:', error);
    }
  }

  clearProveedor() {
    this.selectedProveedor = null;
    this.recepcionForm.patchValue({ proveedorId: '' });
    this.notificacionService.open('Proveedor removido', TipoNotificacion.SUCCESS, 2);
  }

  addNotaToList(nota: NotaRecepcion) {
    if (!this.selectedNotas.find(n => n.id === nota.id)) {
      this.selectedNotas.push(nota);
      
      // Si no hay proveedor seleccionado, tomar el proveedor de la nota
      if (!this.selectedProveedor) {
        const proveedor = nota.pedido?.proveedor || nota.compra?.proveedor;
        if (proveedor) {
          this.selectedProveedor = proveedor;
          this.recepcionForm.patchValue({ proveedorId: proveedor.id });
          this.notificacionService.open(
            `Proveedor automáticamente seleccionado: ${proveedor.persona.nombre}`,
            TipoNotificacion.NEUTRAL,
            3
          );
        }
      }
      
      this.updatePuedeIniciar();
    }
  }

  removeNotaFromList(nota: NotaRecepcion) {
    this.selectedNotas = this.selectedNotas.filter(n => n.id !== nota.id);
    this.updatePuedeIniciar();
  }

  private updatePuedeIniciar() {
    this.puedeIniciarRecepcion = this.ubicacionValidada && this.selectedNotas.length > 0;
  }

  async onValidarUbicacion() {
    const modal = await this.modalController.create({
      component: ValidacionUbicacionComponent,
      componentProps: {},
      backdropDismiss: false
    });

    modal.onDidDismiss().then((result) => {
      if (result.data) {
        this.sucursalValidada = result.data;
        this.ubicacionValidada = true;
        this.updatePuedeIniciar();
        this.notificacionService.open(
          `Ubicación validada: ${this.sucursalValidada.nombre}`,
          TipoNotificacion.SUCCESS,
          2
        );
      }
    });

    return await modal.present();
  }

  async onIniciarRecepcion() {
    if (!this.ubicacionValidada || !this.sucursalValidada) {
      this.notificacionService.open('Debes validar tu ubicación primero', TipoNotificacion.DANGER, 3);
      return;
    }

    if (this.selectedNotas.length === 0) {
      this.notificacionService.open('Debes seleccionar al menos una nota', TipoNotificacion.DANGER, 3);
      return;
    }

    // Mostrar diálogo de confirmación
    const alert = await this.alertController.create({
      header: 'Confirmar Inicio de Recepción',
      message: `¿Estás seguro de que quieres iniciar la recepción de ${this.selectedNotas.length} nota(s) en ${this.sucursalValidada.nombre}?`,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Confirmar',
          handler: () => {
            this.procesarInicioRecepcion();
          }
        }
      ]
    });

    await alert.present();
  }

  private async procesarInicioRecepcion() {
    const loading = await this.cargandoService.open('Iniciando recepción...');

    try {
      const input = {
        proveedorId: this.selectedProveedor?.id || null,
        sucursalId: this.sucursalValidada.id,
        fecha: new Date().toISOString(),
        monedaId: 1, // TODO: Obtener moneda por defecto o del usuario
        cotizacion: 1, // TODO: Obtener cotización actual
        usuarioId: 1, // TODO: Obtener ID del usuario actual
        notaRecepcionIds: this.selectedNotas.map(n => n.id)
      };

      const resultObservable = await this.pedidoService.iniciarRecepcion(input);
      
      resultObservable.subscribe({
        next: (result) => {
          if (result) {
            this.notificacionService.open('Recepción iniciada exitosamente', TipoNotificacion.SUCCESS, 2);
            
            // Navegar a la siguiente pantalla (RecepcionAgrupadaPage)
            setTimeout(() => {
              this.router.navigate(['/operaciones/pedidos/recepcion-agrupada'], {
                state: { 
                  recepcionId: result?.id || 1, // TODO: Obtener ID real del resultado
                  sucursal: this.sucursalValidada,
                  notas: this.selectedNotas
                }
              });
            }, 1000);
          }
        },
        error: (error) => {
          console.error('Error al iniciar recepción:', error);
          this.notificacionService.open('Error al iniciar la recepción', TipoNotificacion.DANGER, 3);
        }
      });
    } catch (error) {
      console.error('Error al iniciar recepción:', error);
      this.notificacionService.open('Error al iniciar la recepción', TipoNotificacion.DANGER, 3);
    } finally {
      this.cargandoService.close(loading);
    }
  }
}