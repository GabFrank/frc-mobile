import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ViewWillEnter } from '@ionic/angular';
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common';
import { UntilDestroy } from '@ngneat/until-destroy';
import { untilDestroyed } from '@ngneat/until-destroy';
import { UntypedFormControl } from '@angular/forms';
import { forkJoin, of, from } from 'rxjs';
import { catchError, switchMap, tap, take } from 'rxjs/operators';

import { Transferencia, TransferenciaItem, TransferenciaItemInput, TransferenciaEstado, TipoTransferencia, EtapaTransferencia } from '../transferencia.model';
import { TransferenciaService } from '../transferencia.service';
import { CargandoService } from 'src/app/services/cargando.service';
import { MainService } from 'src/app/services/main.service';
import { NotificacionService, TipoNotificacion } from 'src/app/services/notificacion.service';
import { DialogoService } from 'src/app/services/dialogo.service';
import { ModalService } from 'src/app/services/modal.service';
import { MenuActionService, ActionMenuData } from 'src/app/services/menu-action.service';
import { ProductoService } from '../../producto/producto.service';
import { Sucursal } from 'src/app/domains/empresarial/sucursal/sucursal.model';
import { SucursalService } from 'src/app/domains/empresarial/sucursal/sucursal.service';
import { GenericListDialogComponent, TableData, GenericListDialogData } from 'src/app/components/generic-list-dialog/generic-list-dialog.component';
import { PdfViewerService } from 'src/app/services/pdf-viewer.service';

enum OpcionesMostrar {
  TODOS = 'TODOS',
  MIOS = 'MIOS'
}

@UntilDestroy()
@Component({
  selector: 'app-edit-transferencia-producto',
  templateUrl: './edit-transferenci-producto.component.html',
  styleUrls: ['./edit-transferenci-producto.component.scss']
})
export class EditTransferenciaProductoComponent implements OnInit, ViewWillEnter {
  selectedTransferencia: Transferencia;
  transferenciaId: number;
  mostrarControl = new UntypedFormControl(OpcionesMostrar.TODOS);
  opcionesMostrarList = Object.values(OpcionesMostrar);
  sucursalOrigen: Sucursal;
  sucursalDestino: Sucursal;
  responsableNombreText: string = '';
  private isNavigatingToGestion: boolean = false;
  private isChangingSucursales: boolean = false;
  private productosVencidosYaAgregados: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private transferenciaService: TransferenciaService,
    private cargandoService: CargandoService,
    private menuAction: MenuActionService,
    private modalService: ModalService,
    private _location: Location,
    private dialogoService: DialogoService,
    private menuActionService: MenuActionService,
    public mainService: MainService,
    private notificacionService: NotificacionService,
    private router: Router,
    private productoService: ProductoService,
    private cdr: ChangeDetectorRef,
    private sucursalService: SucursalService,
    private pdfViewerService: PdfViewerService
  ) { }

  ngOnInit() {
    this.isNavigatingToGestion = false;
    const navigation = this.router.getCurrentNavigation();
    let productoData = null;
    let productosVencidos = null;
    let fromEdit = false;

    if (navigation?.extras?.state) {
      const state = navigation.extras.state as any;
      this.sucursalOrigen = state.sucursalOrigen;
      this.sucursalDestino = state.sucursalDestino;
      productoData = state.productoData;
      if (state.productosVencidos !== null && !state.fromEdit) {
        productosVencidos = state.productosVencidos;
      }
      fromEdit = state.fromEdit;
    } else {
      const historyState = (window.history as any).state;
      if (historyState && historyState.sucursalOrigen) {
        this.sucursalOrigen = historyState.sucursalOrigen;
        this.sucursalDestino = historyState.sucursalDestino;
        fromEdit = historyState.fromEdit || false;
      }
    }

    this.route.paramMap.pipe(untilDestroyed(this)).subscribe((res) => {
      const idParam = res.get('id');
      if (idParam && idParam !== 'new') {
        this.transferenciaId = +idParam;

        if (!fromEdit && productosVencidos && productosVencidos.length > 0) {
          const storageKey = `productosVencidosAgregados_${this.transferenciaId}`;
          this.buscarTransferencia(this.transferenciaId, productosVencidos);
        } else {
          this.buscarTransferencia(this.transferenciaId);
          if (productoData) {
            setTimeout(async () => {
              await this.agregarProductoDesdeData(productoData);
            }, 500);
          }
        }
      } else {
        if (!this.sucursalOrigen || !this.sucursalDestino) {
          this.notificacionService.open('Cargando transferencia...', TipoNotificacion.NEUTRAL, 1);
        } else {
          this.crearTransferencia(productoData);
        }
      }
    });
  }

  ionViewWillEnter() {
    this.isNavigatingToGestion = false;
  }

  async buscarTransferencia(id: number, productosVencidos?: any[]) {
    (await this.transferenciaService.onGetTransferencia(id))
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (res) => {
          if (res != null) {
            this.selectedTransferencia = res;
            if (this.selectedTransferencia.transferenciaItemList == null) {
              this.selectedTransferencia.transferenciaItemList = [];
            }
            this.responsableNombreText = this.selectedTransferencia?.usuarioPreTransferencia?.persona?.nombre || '';
            this.onGetTransferenciaItems(this.transferenciaId);

            const storageKey = `productosVencidosAgregados_${id}`;
            const yaAgregados = sessionStorage.getItem(storageKey) === 'true';

            if (productosVencidos && productosVencidos.length > 0 && !yaAgregados) {
              setTimeout(async () => {
                await this.agregarProductosVencidos(productosVencidos);
                sessionStorage.setItem(storageKey, 'true');
              }, 1500);
            } else if (yaAgregados) {
            }
          }
        },
        error: (error) => {
          this.notificacionService.open('Error al cargar la transferencia', TipoNotificacion.DANGER, 2);
        }
      });
  }

  async onGetTransferenciaItems(id: number, page: number = 0) {
    (await this.transferenciaService.onGetTransferenciaItensPorTransferenciaId(id, page, 5))
      .pipe(untilDestroyed(this))
      .subscribe((res) => {
        if (res != null && res.getContent) {
          if (this.selectedTransferencia.transferenciaItemList == null) {
            this.selectedTransferencia.transferenciaItemList = [];
          }
          if (page === 0) {
            this.selectedTransferencia.transferenciaItemList = res.getContent;
          } else {
            this.selectedTransferencia.transferenciaItemList =
              this.selectedTransferencia.transferenciaItemList.concat(res.getContent);
          }
          this.cdr.detectChanges();
        } else {
        }
      });
  }

  onAddProducto() {
    if (!this.selectedTransferencia?.id) {
      this.notificacionService.open('No hay transferencia seleccionada', TipoNotificacion.DANGER, 2);
      return;
    }

    if (this.isNavigatingToGestion) {
      this.isNavigatingToGestion = false;
    }

    if (!this.selectedTransferencia?.sucursalOrigen || !this.selectedTransferencia?.sucursalDestino) {
      this.notificacionService.open('Faltan datos de sucursales', TipoNotificacion.DANGER, 2);
      return;
    }

    this.isNavigatingToGestion = true;
    this.router.navigate(['transferencias', 'gestion-productos'], {
      state: {
        sucursalOrigen: this.selectedTransferencia.sucursalOrigen,
        sucursalDestino: this.selectedTransferencia.sucursalDestino,
        transferenciaId: this.selectedTransferencia.id
      }
    });
  }

  async onDeleteProducto(transferenciaItem: TransferenciaItem, index: number) {
    (await this.transferenciaService.onDeleteTransferenciaItem(transferenciaItem.id))
      .pipe(untilDestroyed(this))
      .subscribe((res2) => {
        if (res2) {
          this.selectedTransferencia.transferenciaItemList.splice(index, 1);
          this.cdr.detectChanges();
        }
      });
  }

  onEditProducto(transferenciaItem: TransferenciaItem, index: number) {
    this.notificacionService.open('Funcionalidad de edición en desarrollo', TipoNotificacion.NEUTRAL, 2);
  }

  openFilterMenu() {
    this.menuActionService
      .presentActionSheet([
        { texto: 'Todos', role: OpcionesMostrar.TODOS },
        { texto: 'Mios', role: OpcionesMostrar.MIOS }
      ])
      .then((res) => {
        let role = res.role;
        if (role != null) this.mostrarControl.setValue(role);
      });
  }

  onRefresh() {
    this.buscarTransferencia(this.transferenciaId);
  }

  onBack() {
    if (this.transferenciaId) {
      this.router.navigate(['transferencias', 'list', 'info', this.transferenciaId], {
        state: {
          productosVencidos: null,
          productoData: null
        }
      });
    } else {
      this.router.navigate(['transferencias']);
    }
  }

  onMenuClick() {
    let menu: ActionMenuData[] = [
      { texto: 'Actualizar datos', role: 'actualizar' },
      { texto: 'Imprimir', role: 'imprimir' }
    ];
    if (
      this.selectedTransferencia?.estado === TransferenciaEstado.ABIERTA &&
      this.selectedTransferencia?.etapa === EtapaTransferencia.PRE_TRANSFERENCIA_CREACION
    ) {
      menu.push({ texto: 'Cambiar sucursales', role: 'cambiar-sucursales' });
    }
    if (this.selectedTransferencia?.estado === TransferenciaEstado.ABIERTA) {
      menu.push({ texto: 'Finalizar', role: 'finalizar' });
    }

    this.menuActionService.presentActionSheet(menu).then((res) => {
      let role = res.role;
      if (role == 'actualizar') {
        this.onRefresh();
      } else if (role === 'cambiar-sucursales') {
        this.onCambiarSucursales();
      } else if (role == 'finalizar') {
        this.onFinalizar();
      } else if (role === 'imprimir') {
        this.onImprimir();
      }
    });
  }
  async onImprimir() {
    (await this.transferenciaService.onImprimirTransferencia(this.transferenciaId))
      .pipe(untilDestroyed(this))
      .subscribe(async (res) => {
        if (res) {
          await this.pdfViewerService.openPdfFromBase64(res, `transferencia_${this.transferenciaId}.pdf`);
        }
      });
  }
  onFinalizar() {
    if (this.selectedTransferencia?.estado === TransferenciaEstado.ABIERTA) {
      this.transferenciaService.onFinalizar(this.selectedTransferencia)
        .pipe(untilDestroyed(this))
        .subscribe((res) => {
          if (res) {
            this.selectedTransferencia.estado = TransferenciaEstado.EN_ORIGEN;
            this.buscarTransferencia(this.transferenciaId);

            if (this.transferenciaId) {
              const storageKey = `productosVencidosAgregados_${this.transferenciaId}`;
              sessionStorage.removeItem(storageKey);

              this.router.navigate(['transferencias', 'list', 'info', this.transferenciaId], {
                state: {
                  productosVencidos: null,
                  productoData: null,
                  fromEdit: null
                },
                replaceUrl: true
              });
            }
          }
        });
    }
  }

  async onCargarMas() {
    if (this.selectedTransferencia?.transferenciaItemList == null) return;
    let page = Math.floor((this.selectedTransferencia.transferenciaItemList.length - 1) / 5) + 1;
    await this.onGetTransferenciaItems(this.transferenciaId, page);
  }

  async onCargarMenos() {
    if (this.selectedTransferencia?.transferenciaItemList == null) return;
    let length = this.selectedTransferencia.transferenciaItemList.length;
    let sobra = length - 4;
    if (sobra > 0) {
      this.selectedTransferencia.transferenciaItemList.splice(length - sobra, sobra - 1);
    }
  }

  private async crearTransferencia(productoData?: any) {
    if (!this.sucursalOrigen?.id || !this.sucursalDestino?.id) {
      this.notificacionService.open('No se recibieron datos de sucursales', TipoNotificacion.DANGER, 2);
      this.onBack();
      return;
    }

    const transferenciaInput = {
      sucursalOrigenId: this.sucursalOrigen.id,
      sucursalDestinoId: this.sucursalDestino.id,
      estado: TransferenciaEstado.ABIERTA,
      tipo: TipoTransferencia.MANUAL,
      etapa: EtapaTransferencia.PRE_TRANSFERENCIA_CREACION
    };

    (await this.transferenciaService.onSaveTransferencia(transferenciaInput))
      .pipe(untilDestroyed(this))
      .subscribe({
        next: async (res) => {
          if (res != null) {
            this.transferenciaId = res.id;
            this.selectedTransferencia = res;
            if (this.selectedTransferencia.transferenciaItemList == null) {
              this.selectedTransferencia.transferenciaItemList = [];
            }
            this.responsableNombreText = this.selectedTransferencia?.usuarioPreTransferencia?.persona?.nombre || '';
            const navigationExtras: any = { replaceUrl: true };
            if (productoData) {
              navigationExtras.state = {
                sucursalOrigen: this.sucursalOrigen,
                sucursalDestino: this.sucursalDestino,
                productoData: productoData
              };
            }
            this.router.navigate(['transferencias', 'edit', this.transferenciaId], navigationExtras);
            if (productoData) {
              setTimeout(async () => {
                await this.agregarProductoDesdeData(productoData);
              }, 100);
            } else {
              this.onGetTransferenciaItems(this.transferenciaId);
            }
          }
        },
        error: (error) => {
          this.notificacionService.open('Error al crear la transferencia', TipoNotificacion.DANGER, 2);
          this.onBack();
        }
      });
  }

  private async agregarProductoDesdeData(productoData: any) {
    if (!productoData.presentacion || !productoData.cantidad) {
      return;
    }
    let vencimientoStr = null;
    if (productoData.vencimiento) {
      const fecha = new Date(productoData.vencimiento);
      if (!isNaN(fecha.getTime())) {
        vencimientoStr = fecha.toISOString().split('T')[0];
      }
    }

    const transferenciaItemInput: Partial<TransferenciaItemInput> = {
      transferenciaId: this.transferenciaId,
      presentacionPreTransferenciaId: productoData.presentacion.id,
      cantidadPreTransferencia: productoData.cantidad,
      vencimientoPreTransferencia: vencimientoStr,
      observacionPreTransferencia: productoData.observacion || null,
      activo: true,
      poseeVencimiento: !!productoData.vencimiento
    };

    (await this.transferenciaService.onSaveTransferenciaItem(transferenciaItemInput as TransferenciaItemInput))
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (res) => {
          if (res != null) {
            this.notificacionService.open('Producto agregado a la transferencia', TipoNotificacion.SUCCESS, 2);
            if (!this.selectedTransferencia) {
              this.buscarTransferencia(this.transferenciaId);
            } else {
              if (this.selectedTransferencia.transferenciaItemList == null) {
                this.selectedTransferencia.transferenciaItemList = [];
              }
              if (this.selectedTransferencia.transferenciaItemList.length > 4) {
                this.selectedTransferencia.transferenciaItemList.pop();
              }
              this.selectedTransferencia.transferenciaItemList.unshift(res);
              this.cdr.detectChanges();
            }
            setTimeout(() => {
              this.onGetTransferenciaItems(this.transferenciaId);
            }, 500);
          }
        },
        error: (error) => {
          this.notificacionService.open('Error al guardar el producto', TipoNotificacion.DANGER, 2);
        }
      });
  }

  private async agregarProductosVencidos(productosVencidos: any[]) {
    if (!productosVencidos || productosVencidos.length === 0) {
      return;
    }

    if (!this.transferenciaId) {
      this.notificacionService.open('Error: No se pudo identificar la transferencia', TipoNotificacion.DANGER, 2);
      return;
    }

    const loading = await this.cargandoService.open('Agregando productos vencidos...');

    const loadingTimeout = setTimeout(() => {
      this.cargandoService.close(loading);
      this.notificacionService.open('Tiempo de espera agotado al agregar productos', TipoNotificacion.WARN, 3);
    }, 30000);

    try {
      const productosValidos = productosVencidos.filter(item => {
        const tienePresentacion = item.presentacion && item.presentacion.id;
        const tieneCantidad = item.cantidad && item.cantidad > 0;
        if (!tienePresentacion || !tieneCantidad) {
        }
        return tienePresentacion && tieneCantidad;
      });

      if (productosValidos.length === 0) {
        clearTimeout(loadingTimeout);
        this.cargandoService.close(loading);
        this.notificacionService.open('No hay productos válidos para agregar', TipoNotificacion.WARN, 2);
        return;
      }

      const transferenciaItemInputs: TransferenciaItemInput[] = productosValidos.map(item => {
        let vencimientoStr = null;
        if (item.vencimiento) {
          const fecha = new Date(item.vencimiento);
          if (!isNaN(fecha.getTime())) {
            vencimientoStr = fecha.toISOString().split('T')[0];
          }
        }

        return {
          id: null,
          transferenciaId: this.transferenciaId,
          presentacionPreTransferenciaId: item.presentacion.id,
          presentacionPreparacionId: null,
          presentacionTransporteId: null,
          presentacionRecepcionId: null,
          cantidadPreTransferencia: item.cantidad,
          cantidadPreparacion: 0,
          cantidadTransporte: 0,
          cantidadRecepcion: 0,
          observacionPreTransferencia: null,
          observacionPreparacion: null,
          observacionTransporte: null,
          observacionRecepcion: null,
          vencimientoPreTransferencia: vencimientoStr,
          vencimientoPreparacion: null,
          vencimientoTransporte: null,
          vencimientoRecepcion: null,
          motivoModificacionPreTransferencia: null,
          motivoModificacionPreparacion: null,
          motivoModificacionTransporte: null,
          motivoModificacionRecepcion: null,
          motivoRechazoPreTransferencia: null,
          motivoRechazoPreparacion: null,
          motivoRechazoTransporte: null,
          motivoRechazoRecepcion: null,
          activo: true,
          poseeVencimiento: !!item.vencimiento,
          usuarioId: this.mainService.usuarioActual?.id,
          creadoEn: null
        } as TransferenciaItemInput;
      });
      const observables = transferenciaItemInputs.map((input, index) => {
        return from(this.transferenciaService.onSaveTransferenciaItem(input)).pipe(
          switchMap(obs => {
            return obs.pipe(
              take(1),
              tap(value => {
              }),
              catchError(error => {
                return of(null);
              })
            );
          }),
          catchError(error => {
            return of(null);
          })
        );
      });

      forkJoin(observables)
        .pipe(untilDestroyed(this))
        .subscribe({
          next: (results) => {
            clearTimeout(loadingTimeout);
            this.cargandoService.close(loading);
            const exitosos = results.filter(r => r != null).length;
            const fallidos = results.length - exitosos;

            if (exitosos > 0) {
              this.notificacionService.open(
                `${exitosos} producto${exitosos !== 1 ? 's' : ''} agregado${exitosos !== 1 ? 's' : ''} a la transferencia${fallidos > 0 ? ` (${fallidos} fallido${fallidos !== 1 ? 's' : ''})` : ''}`,
                fallidos > 0 ? TipoNotificacion.WARN : TipoNotificacion.SUCCESS,
                3
              );
            } else {
              this.notificacionService.open('No se pudo agregar ningún producto', TipoNotificacion.DANGER, 3);
            }
            setTimeout(() => {
              this.onGetTransferenciaItems(this.transferenciaId);
            }, 500);
          },
          error: (error) => {
            clearTimeout(loadingTimeout);
            this.cargandoService.close(loading);
            this.notificacionService.open('Error al agregar productos', TipoNotificacion.DANGER, 3);
            setTimeout(() => {
              this.onGetTransferenciaItems(this.transferenciaId);
            }, 500);
          },
          complete: () => {
          }
        });
    } catch (error) {
      clearTimeout(loadingTimeout);
      this.cargandoService.close(loading);
      this.notificacionService.open('Error al agregar productos vencidos', TipoNotificacion.DANGER, 2);
    }
  }

  private async onCambiarSucursales() {
    if (this.isChangingSucursales) {
      return;
    }
    if (
      !this.selectedTransferencia ||
      this.selectedTransferencia.estado !== TransferenciaEstado.ABIERTA ||
      this.selectedTransferencia.etapa !== EtapaTransferencia.PRE_TRANSFERENCIA_CREACION
    ) {
      this.notificacionService.open(
        'Solo se puede cambiar sucursales en la etapa de creación',
        TipoNotificacion.WARN,
        2
      );
      return;
    }

    this.isChangingSucursales = true;

    try {
      (await this.sucursalService.onGetAllSucursales())
        .pipe(untilDestroyed(this))
        .subscribe(async (sucursales) => {
          this.isChangingSucursales = false;

          const allSucursales = (sucursales || []).filter((s) => s.id != 0);
          if (allSucursales.length === 0) {
            this.notificacionService.open('No hay sucursales disponibles', TipoNotificacion.DANGER, 2);
            return;
          }

          const tableData: TableData[] = [
            { id: 'id', nombre: 'Id', width: 20 },
            { id: 'nombre', nombre: 'Nombre', width: 80 }
          ];

          const origenData: GenericListDialogData = {
            tableData,
            titulo: 'Seleccione sucursal origen',
            search: true,
            inicialData: allSucursales
          };

          const origenResult = await this.modalService.openModal(GenericListDialogComponent, origenData);
          const nuevaSucursalOrigen: Sucursal | null = origenResult?.data || null;
          if (!nuevaSucursalOrigen) {
            return;
          }

          const sucursalesDestino = allSucursales.filter((s) => s.id !== nuevaSucursalOrigen.id);
          if (sucursalesDestino.length === 0) {
            this.notificacionService.open('No hay sucursales destino disponibles', TipoNotificacion.DANGER, 2);
            return;
          }

          const destinoData: GenericListDialogData = {
            tableData,
            titulo: 'Seleccione sucursal destino',
            search: true,
            inicialData: sucursalesDestino
          };

          const destinoResult = await this.modalService.openModal(GenericListDialogComponent, destinoData);
          const nuevaSucursalDestino: Sucursal | null = destinoResult?.data || null;
          if (!nuevaSucursalDestino) {
            return;
          }

          if (nuevaSucursalDestino.id === nuevaSucursalOrigen.id) {
            this.notificacionService.open(
              'La sucursal destino no puede ser igual a la origen',
              TipoNotificacion.WARN,
              2
            );
            return;
          }

          const input = {
            id: this.selectedTransferencia.id,
            sucursalOrigenId: nuevaSucursalOrigen.id,
            sucursalDestinoId: nuevaSucursalDestino.id,
            estado: this.selectedTransferencia.estado,
            tipo: this.selectedTransferencia.tipo,
            etapa: this.selectedTransferencia.etapa
          };

          (await this.transferenciaService.onSaveTransferencia(input))
            .pipe(untilDestroyed(this))
            .subscribe((resActualizada) => {
              if (resActualizada) {
                this.selectedTransferencia = {
                  ...this.selectedTransferencia,
                  sucursalOrigen: nuevaSucursalOrigen,
                  sucursalDestino: nuevaSucursalDestino
                } as Transferencia;
                this.sucursalOrigen = nuevaSucursalOrigen;
                this.sucursalDestino = nuevaSucursalDestino;

                this.buscarTransferencia(this.transferenciaId);

                this.notificacionService.open('Sucursales actualizadas', TipoNotificacion.SUCCESS, 2);
              }
            });
        });
    } catch (error) {
      this.isChangingSucursales = false;
      this.notificacionService.open('Error al cambiar sucursales', TipoNotificacion.DANGER, 2);
    }
  }
}