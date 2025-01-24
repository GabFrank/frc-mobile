  import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
  import { Sucursal } from 'src/app/domains/empresarial/sucursal/sucursal.model';
  import { SucursalService } from 'src/app/domains/empresarial/sucursal/sucursal.service';
  import { NotificacionService } from 'src/app/services/notificacion.service';
  import { ProductoService } from '../producto.service';
  import { FormControl, FormGroup, Validators } from '@angular/forms';
  import { ModalController } from '@ionic/angular';
  import { ModalService } from 'src/app/services/modal.service';
  import { ProductoControlDialogComponent } from '../producto-control-dialog/producto-control-dialog.component';
  import { CalendarModal, CalendarModalOptions } from 'ion7-calendar';
import { TransferenciaService } from '../../transferencias/transferencia.service';

  @Component({
    selector: 'app-producto-control',
    templateUrl: './producto-control.component.html',
    styleUrls: ['./producto-control.component.scss'],
  })

  export class ProductoControlComponent implements OnInit {
    form: FormGroup;
    selectedRange: { fechaInicio: string; fechaFin: string } = { fechaInicio: '', fechaFin: '' };
    sucursales: Sucursal[] = [];
    pagActual = 1;
    productosFiltrados: any[] = [];
    allProductos: any[] = [];

    constructor(
      private sucursalService: SucursalService,
      private productoService: ProductoService,
      private notificacionService: NotificacionService,
      private modalCtrl: ModalController,
      private modalService: ModalService,
      private transferenciaService: TransferenciaService,
    ) {}

    ngOnInit() {
      this.form = new FormGroup({
        dateRange: new FormControl(null, Validators.required),
        sucursalSelect: new FormControl(null, Validators.required),
        verificarFilter: new FormControl('todos'),
      });
      this.form.get('verificarFilter')?.valueChanges.subscribe(() => {
        this.setFilter();
      });
      this.getSucursales();
    }

    async openCalendar() {
      const options: CalendarModalOptions = {
        pickMode: 'range',
        title: 'SELECCIONAR FECHA',
        monthFormat: 'MMMM yyyy',
        format: 'YYYY-MM-DD HH:mm',
        doneLabel: 'LISTO',
        weekdays: ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'],
        canBackwardsSelected: true,
        closeIcon: true,
        weekStart: 1,
        defaultScrollTo: new Date(),
      };

      const myCalendar = await this.modalCtrl.create({
        component: CalendarModal,
        backdropDismiss: false,
        cssClass: 'myCalendar-class',
        componentProps: { options }
      });

      myCalendar.present();

      const event: any = await myCalendar.onDidDismiss();
      const date = event.data;
      if (date) {
        this.selectedRange = { fechaInicio: date.from.string, fechaFin: date.to.string };
        this.form.get('dateRange')?.setValue(date);
      }
    }

    getSucursales() {
      this.sucursalService.onGetAllSucursales().then(observable => {
        observable.subscribe({
          next: (data) => {
            this.sucursales = data;
          },
          error: (error) => {
            console.error('Error al obtener las sucursales', error);
          }
        });
      });
    }

    async onSucursalSelected(sucId: number) {
      const dateRange = this.form.get('dateRange')?.value;

      if (!dateRange) {
        console.warn('Rango de fecha no seleccionado');
        this.notificacionService.warn('Debes seleccionar un rango de fechas');
        return;
      }

      const fechaInicio = new Date(dateRange.from.string);
      const fechaFin = new Date(dateRange.to.string);

      await this.onSearchProductoVencido(sucId, fechaInicio, fechaFin);
    }

    onCheck(index: number, slidingItem: any) {
      const producto = this.productosFiltrados[index];
      if (!producto) {
        this.notificacionService.openAlgoSalioMal();
        return;
      }
      producto.verificado = true;

      this.transferenciaService.onVerificarProducto(producto.id, true).subscribe({
        next: (success) => {
          if (success) {
            this.notificacionService.openGuardadoConExito();

            const sucId = this.form.get('sucursalSelect')?.value;
            const dateRange = this.form.get('dateRange')?.value;

            if (sucId && dateRange) {
              const fechaInicio = new Date(dateRange.from.string);
              const fechaFin = new Date(dateRange.to.string);
              this.onSearchProductoVencido(sucId, fechaInicio, fechaFin);
            } else {
              this.notificacionService.openAlgoSalioMal();
            }
          }
          slidingItem.close();
        },
        error: (err) => {
          console.error('Error verifying product:', err);
          this.notificacionService.openAlgoSalioMal();
          slidingItem.close();
        },
      });
    }

    setFilter() {
      const verificarFilter = this.form.get('verificarFilter')?.value || 'todos';

      if (!this.selectedRange.fechaInicio || !this.selectedRange.fechaFin) {
        this.notificacionService.warn('Debe seleccionar un rango de fechas válido');
        return;
      }

      const fromDate = new Date(this.selectedRange.fechaInicio);
      const toDate = new Date(this.selectedRange.fechaFin);
      toDate.setHours(23, 59, 59, 999);

      this.productosFiltrados =
        this.allProductos.filter((producto) => {
          const fechaProducto = new Date(producto.vencimiento);
          const cumpleFecha = 
          fechaProducto >= fromDate && fechaProducto <= toDate;
          const cumpleVerificacion =
            verificarFilter === 'todos' ||
            (verificarFilter === 'verificado' && producto.verificado === true) ||
            (verificarFilter === 'noVerificado' && producto.verificado === false);

          return cumpleFecha && cumpleVerificacion;
        });
      this.pagActual = 1;
    }

    async openModal(producto: any) {
      const res =
        await this.modalService.openModal(ProductoControlDialogComponent, { 
          producto, 
          onlyView: false, 
        });

      if (res?.data?.productoActualizado) {
        const productoActualizado = res.data.productoActualizado

        const indexAll = 
        this.allProductos.findIndex(p => p.id === productoActualizado.id);
        if (indexAll !== -1) {
          this.allProductos[indexAll] = 
          { ...this.allProductos[indexAll], ...productoActualizado };
        }
        const indexFiltered = 
        this.productosFiltrados.findIndex(p => p.id === productoActualizado.id);
        if (indexFiltered !== -1) {
          this.productosFiltrados[indexFiltered] = 
          { ...this.productosFiltrados[indexFiltered], ...productoActualizado };
        }
        this.setFilter();
        this.notificacionService.success('Producto actualizado con éxito');
      }
    }

    async openOnlyView(producto: any) {
      try {
        const productoDetalle = this.productosFiltrados.find(p => p.id === producto.id);

        if (!productoDetalle) {
          this.notificacionService.danger('No se pudo cargar el detalle del producto');
          return;
        }
        await this.modalService.openModal(ProductoControlDialogComponent, {
          producto: productoDetalle,
          onlyView: true,
        });
      } catch (error) {
        console.error('Error al abrir el modal de detalles:', error);
        this.notificacionService.danger('Ocurrió un error al cargar el detalle del producto');
      }
    }
    
    async onBuscarProductos() {
      const dateRange = this.form.get('dateRange')?.value;
      const sucId = this.form.get('sucursalSelect')?.value;

      if (!sucId || !dateRange) {
        this.notificacionService.danger('Debe seleccionar una sucursal y una fecha');
        return;
      }
      this.setFilter();

      const fechaInicio = new Date(dateRange.from.string);
      const fechaFin = new Date(dateRange.to.string);

      await this.onSearchProductoVencido(sucId, fechaInicio, fechaFin);

      if (this.productosFiltrados.length === 0) {
        this.notificacionService.warn('No se encontraron productos');
      }
    }
    
    async onSearchProductoVencido(sucId: number, fechaInicio: Date, fechaFin: Date) {
      try {
        const result = await this.productoService.onFindProductoVencido(
          sucId,
          fechaInicio,
          fechaFin
        ).toPromise();

        if (result && result.data && result.data.length > 0) {
          console.log('Productos vencidos encontrados:', result.data);

          this.allProductos = result.data.map((item: any) => {

            const existingProduct =
              this.allProductos.find((p) => p.id === item.transferenciaItem.id);

            return {
              id: item.transferenciaItem.id,
              descripcion: item.producto.descripcion,
              img: item.producto.imagenPrincipal,
              vencimiento: item.transferenciaItem.vencimientoRecepcion,
              cantidad: item.transferenciaItem.cantidadRecepcion,
              sucursal: item.transferenciaItem.sucursalDestino,
              verificado:
                  existingProduct ? existingProduct.verificado :
                  item.transferenciaItem.vencimientoVerificado || false,
            };
          });

          this.setFilter();
          this.notificacionService.success('Productos encontrados');
        } else {
          console.log('No se encontraron productos vencidos');
          this.notificacionService.warn('No se encontraron productos');
        }
      } catch (error) {
        console.error('Error al buscar productos vencidos:', error);
        this.notificacionService.danger('Error al buscar productos');
      }
    }

  }
