import { TipoEntidad } from './../../../domains/enums/tipo-entidad.enum';
import { codificarQr, QrData } from './../../../generic/utils/qrUtils';
import { QrGeneratorComponent } from './../../../components/qr-generator/qr-generator.component';
import {
  NotificacionService,
  TipoNotificacion
} from 'src/app/services/notificacion.service';
import { MainService } from 'src/app/services/main.service';
import { UntypedFormControl } from '@angular/forms';
import { DialogoService } from 'src/app/services/dialogo.service';
import { Zona } from 'src/app/domains/zona/zona.model';
import {
  EditInventarioItemDialogComponent,
  InventarioItemData
} from './../edit-inventario-item-dialog/edit-inventario-item-dialog.component';
import {
  PopOverService,
  PopoverSize
} from './../../../services/pop-over.service';
import { SearchProductoDialogComponent } from './../../producto/search-producto-dialog/search-producto-dialog.component';
import { SelectZonaDialogComponent } from './../select-zona-dialog/select-zona-dialog.component';
import { ModalService } from './../../../services/modal.service';
import { ActionMenuData } from './../../../services/menu-action.service';
import { MenuActionService } from 'src/app/services/menu-action.service';
import {
  InventarioProducto,
  InventarioProductoItem,
  InventarioProductoItemInput
} from './../inventario.model';
import { Sector } from './../../../domains/sector/sector.model';
import { CargandoService } from './../../../services/cargando.service';
import { UntilDestroy } from '@ngneat/until-destroy';
import { untilDestroyed } from '@ngneat/until-destroy';
import { InventarioService } from './../inventario.service';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Inventario } from '../inventario.model';
import { SectorService } from 'src/app/domains/sector/sector.service';
import { Location } from '@angular/common';
import { Usuario } from 'src/app/domains/personas/usuario.model';
import { ProductoService } from '../../producto/producto.service';
import { TransferenciaService } from '../../transferencias/transferencia.service';
import { EtapaTransferencia } from '../../transferencias/transferencia.model';

export class InventarioData {
  sector: Sector;
  inventarioProducto: InventarioProducto[];
  concluido: boolean;
}

enum OpcionesMostrar {
  TODOS = 'TODOS',
  MIOS = 'MIOS'
}

@UntilDestroy()
@Component({
  selector: 'app-edit-inventario',
  templateUrl: './edit-inventario.component.html',
  styleUrls: ['./edit-inventario.component.scss']
})
export class EditInventarioComponent implements OnInit {
  selectedInventario: Inventario;
  sectorList: Sector[] = [];
  inventarioDataList: InventarioData[] = [];
  inventarioId;
  mostrarControl = new UntypedFormControl(OpcionesMostrar.MIOS);
  opcionesMostrarList = Object.values(OpcionesMostrar);
  selectedResponsable: Usuario;
  isAddZona = false;
  activeAccordionId: string | undefined;
  cantidadTransferenciasActivas: number = 0;

  constructor(
    private route: ActivatedRoute,
    private inventarioService: InventarioService,
    private cargandoService: CargandoService,
    private sectorSerice: SectorService,
    private menuAction: MenuActionService,
    private modalService: ModalService,
    private _location: Location,
    private popoverService: PopOverService,
    private dialogoService: DialogoService,
    private menuActionService: MenuActionService,
    public mainService: MainService,
    private notificacionService: NotificacionService,
    private router: Router,
    private productoService: ProductoService,
    private transferenciaService: TransferenciaService
  ) {}

  ngOnInit() {
    this.selectedResponsable = this.mainService.usuarioActual;
    this.route.paramMap.pipe(untilDestroyed(this)).subscribe((res) => {
      this.inventarioId = res.get('id');
      if (this.inventarioId != null) {
        this.buscarInventario(this.inventarioId);
      }
    });
  }

  async buscarInventario(id) {
    const currentAccordionId = this.activeAccordionId;
    
    const mostrarNotificacion = this.route.snapshot.queryParams['mostrarNotificacion'] === 'true';
  
    const loading = await this.cargandoService.open(null, false);
    
    (await this.inventarioService.onGetInventario(id, false))
      .pipe(untilDestroyed(this))
      .subscribe((res) => {
        if (res != null) {
          this.selectedInventario = res;
          this.ordenarZonas();
          
         
          setTimeout(() => {
            this.cargandoService.close(loading);
          }, 300);
         
          this.onGetSectores(this.selectedInventario.sucursal.id, false);
          this.cargarCantidadTransferenciasActivas(false);
  
          if (currentAccordionId) {
            setTimeout(() => {
              this.activeAccordionId = currentAccordionId;
            }, 1);
          }
          
          
          if (mostrarNotificacion) {
            this.verificarTransferenciasPendientes();
            this.router.navigate([], {
              relativeTo: this.route,
              queryParams: {},
              replaceUrl: true
            });
          }
        } else {
          this.cargandoService.close(loading);
        }
      });
  }

  async onGetSectores(id, showLoading: boolean = true) {
    (await this.sectorSerice.onGetSectores(id, showLoading))
      .pipe(untilDestroyed(this))
      .subscribe((res) => {
        console.log(res);
        this.sectorList = res;
      });
  }

  async onAddZona() {
    let arrAux: Sector[] = this.sectorList;
    let filteredZonas: Zona[] = [];

    (await this.inventarioService.onGetInventario(this.selectedInventario.id))
      .pipe(untilDestroyed(this))
      .subscribe((res) => {
        if (res != null) this.selectedInventario = res;
        this.selectedInventario.inventarioProductoList.forEach((ip) => {
          filteredZonas.push(ip?.zona);
        });
        arrAux.forEach((s) => {
          s.zonaList = s.zonaList.filter(
            (z) => filteredZonas.find((fz) => fz.id == z.id) == null
          );
        });
        this.modalService
          .openModal(SelectZonaDialogComponent, arrAux)
          .then(async (res) => {
            if (res.data != null) {
              let selectedZona = res.data;
              let inventarioProducto = new InventarioProducto();
              inventarioProducto.concluido = false;
              inventarioProducto.inventario = this.selectedInventario;
              inventarioProducto.zona = selectedZona;
              (
                await this.inventarioService.onSaveInventarioProducto(
                  inventarioProducto.toInput()
                )
              )
                .pipe(untilDestroyed(this))
                .subscribe((res) => {
                  if (res != null) {
                    this.buscarInventario(this.inventarioId);
                    setTimeout(() => {
                      this.activeAccordionId = res.id.toString();
                    }, 100);
                  }
                });
            }
          });
      });
  }

  onFinalizarZona(invPro: InventarioProducto, i) {
    let aux = new InventarioProducto();
    invPro = Object.assign(aux, invPro);
    this.dialogoService
      .open(
        'Atención',
        `Usted esta finalizando la zona ${invPro?.zona?.descripcion}. Desea continuar?`
      )
      .then(async (res) => {
        if (res.role == 'aceptar') {
          invPro.inventario = this.selectedInventario;
          invPro.concluido = true;
          (
            await this.inventarioService.onSaveInventarioProducto(
              invPro.toInput()
            )
          )
            .pipe(untilDestroyed(this))
            .subscribe((res2) => {
              this.selectedInventario.inventarioProductoList[i] = invPro;
              this.ordenarZonas();
            });
        }
      });
  }

  onReabrirZona(invPro: InventarioProducto, i) {
    let aux = new InventarioProducto();
    invPro = Object.assign(aux, invPro);
    if (this.verificarAbiertos()) {
      this.dialogoService
        .open(
          'Atención',
          `Usted esta reabriendo la zona ${invPro?.zona?.descripcion}. Desea continuar?`
        )
        .then(async (res) => {
          if (res.role == 'aceptar') {
            invPro.inventario = this.selectedInventario;
            invPro.concluido = false;
            (
              await this.inventarioService.onSaveInventarioProducto(
                invPro.toInput()
              )
            )
              .pipe(untilDestroyed(this))
              .subscribe((res2) => {
                this.selectedInventario.inventarioProductoList[i] = invPro;
                this.ordenarZonas();
              });
          }
        });
    } else {
      this.notificacionService.open(
        'Ya tenes una zona abierta. Despues de concluirla podrás iniciar el inventario de otra',
        TipoNotificacion.WARN,
        3
      );
    }
  }

  verificarAbiertos(): boolean {
    return (
      this.selectedInventario.inventarioProductoList.find(
        (e) => e.concluido == false
      ) == null
    );
  }

  ordenarZonas() {
    this.selectedInventario.inventarioProductoList =
      this.selectedInventario.inventarioProductoList.sort((a, b) => {
        if (a.concluido == true && b.concluido != true) {
          return 1;
        } else {
          return -1;
        }
      });
  }

  onAddProducto(invPro, i) {
    console.log(this.selectedInventario);
    let data = {
      sucursal: this.selectedInventario.sucursal,
      sucursalId: +this.selectedInventario.sucursal.id,
      isInventario: true,
      inventarioId: this.selectedInventario.id,
      inventarioProductoId: invPro.id
    };
    this.modalService
      .openModal(SearchProductoDialogComponent, { data })
      .then((searchResult) => {
        if (searchResult?.data) {
          if (searchResult.data.id && (searchResult.data.revisado !== undefined || searchResult.data.verificado !== undefined)) {
            const itemVerificado = searchResult.data as InventarioProductoItem;

            if (!invPro.inventarioProductoItemList) {
              invPro.inventarioProductoItemList = [];
            }
            invPro.inventarioProductoItemList.unshift(itemVerificado);
            invPro.inventarioProductoItemList = [...invPro.inventarioProductoItemList];

            const invProIdStr = invPro.id?.toString();
            this.activeAccordionId = undefined;
            setTimeout(() => {
              this.activeAccordionId = invProIdStr;
            }, 100);

          } else if (searchResult.data.presentacion && searchResult.data.producto) {
            let selectedPresentacion = searchResult.data['presentacion'];
            let selectedProducto = searchResult.data['producto'];
            let editDialogData: InventarioItemData = {
              inventarioProducto: invPro,
              producto: selectedProducto,
              presentacion: selectedPresentacion,
              inventarioProductoItem: null,
              peso: searchResult.data['peso']
            };
            this.modalService
              .openModal(EditInventarioItemDialogComponent, editDialogData)
              .then(async (editDialogResult: any) => {
                if (editDialogResult.data != null) {
                  let invProItemInput: InventarioProductoItemInput = editDialogResult.data;
                  const loading = await this.cargandoService.open();
                  (await this.inventarioService.onSaveInventarioProductoItem(invProItemInput))
                    .pipe(untilDestroyed(this))
                    .subscribe(
                      (itemGuardado) => {
                        this.cargandoService.close(loading);
                        if (itemGuardado) {
                          if (!invPro.inventarioProductoItemList) {
                            invPro.inventarioProductoItemList = [];
                          }
                          invPro.inventarioProductoItemList.unshift(itemGuardado);
                          invPro.inventarioProductoItemList = [...invPro.inventarioProductoItemList];

                          const invProIdStr = invPro.id?.toString();
                          this.activeAccordionId = undefined;
                          setTimeout(() => {
                            this.activeAccordionId = invProIdStr;
                          }, 100);
                        } else {
                          this.notificacionService.open('No se pudo añadir el ítem.', TipoNotificacion.WARN, 3);
                        }
                      },
                      (error) => {
                        this.cargandoService.close(loading);
                        this.notificacionService.danger('Error al añadir ítem: ' + (error?.message || 'Error desconocido'));
                      }
                    );
                }
              });
          }
        }
      });
  }

  async onDeleteProducto(
    invProItem: InventarioProductoItem,
    index,
    invPro: InventarioProducto
  ) {
    (
      await this.inventarioService.onDeleteInventarioProductoItem(
        invProItem.id,
        invProItem.presentacion.producto.descripcion
      )
    ).subscribe((res) => {
      if (res) {
        this.selectedInventario.inventarioProductoList.forEach((i) => {
          this.selectedInventario.inventarioProductoList.forEach((i) => {
            if (i.inventarioProductoItemList == null)
              i.inventarioProductoItemList = [];
            if (i.id == invPro.id)
              i.inventarioProductoItemList.splice(index, 1);
          });
        });
      }
    });
  }

  onEditProducto(
    invProItem: InventarioProductoItem,
    index,
    invPro: InventarioProducto
  ) {
    let selectedPresentacion = invProItem?.presentacion;
    let selectedProducto = invProItem?.presentacion?.producto;
    
    if (selectedProducto && selectedProducto.vencimiento === undefined && invProItem.vencimiento !== null) {
      selectedProducto.vencimiento = true;
    }
    
    let data: InventarioItemData = {
      inventarioProducto: invPro,
      producto: selectedProducto,
      presentacion: selectedPresentacion,
      inventarioProductoItem: invProItem
    };
    this.modalService
      .openModal(EditInventarioItemDialogComponent, data)
      .then(async (res2) => {
        if (res2.data != null) {
          (await this.inventarioService.onSaveInventarioProductoItem(res2.data))
            .pipe(untilDestroyed(this))
            .subscribe((res3) => {
              if (res3 != null) {
                this.selectedInventario.inventarioProductoList.forEach((i) => {
                  if (i.inventarioProductoItemList == null)
                    i.inventarioProductoItemList = [];
                  if (i.id == invPro.id)
                    i.inventarioProductoItemList[index] = res3;
                });
                
                const invProIdStr = invPro.id?.toString();
                this.activeAccordionId = undefined;
                setTimeout(() => {
                  this.activeAccordionId = invProIdStr;
                }, 100);
              }
            });
        }
      });
  }

  openFilterMenu() {
    this.menuActionService
      .presentActionSheet([
        { texto: 'Todos', role: OpcionesMostrar.TODOS },
        { texto: 'Mios', role: OpcionesMostrar.MIOS }
      ])
      .then((res) => {
        const role = res.role;
        if (role === OpcionesMostrar.TODOS || role === OpcionesMostrar.MIOS) {
          this.mostrarControl.setValue(role);
        }
      });
  }

  onRefresh() {
    this.ngOnInit();
  }

  onBack() {
    this._location.back();
  }

  onMenuClick() {
    const textoTransferencias = this.cantidadTransferenciasActivas > 0 
      ? `Transferencias activas (${this.cantidadTransferenciasActivas})`
      : 'Transferencias activas';
    
    let menu: ActionMenuData[] = [
      { texto: this.selectedInventario?.estado == 'ABIERTO' ? 'Finalizar' : 'Resumen', role: 'resumen' },
      { texto: 'Actualizar datos', role: 'actualizar' },
      { texto: 'Compartir', role: 'compartir' },
      { texto: 'Zonas y sectores', role: 'zonas' },
      { texto: textoTransferencias, role : 'transferencias'}
    ];
    this.menuActionService.presentActionSheet(menu).then((res) => {
      let role = res.role;
      if (role == 'actualizar') {
        this.ngOnInit();
      } else if (role == 'resumen') {
        if (this.selectedInventario?.estado === 'ABIERTO' && !this.verificarAbiertos()) {
          this.notificacionService.warn(
            'Primero debes finalizar la zona, antes de finalizar el inventario.',
          );
          return;
        }
        this.router.navigate(['finalizar'], { relativeTo: this.route });
      } else if (role == 'compartir') {
        let codigo = new QrData();
        codigo.sucursalId = this.selectedInventario?.sucursal?.id;
        codigo.tipoEntidad = TipoEntidad.INVENTARIO;
        codigo.idCentral = this.selectedInventario?.id;
        this.popoverService.open(
          QrGeneratorComponent,
          codificarQr(codigo),
          PopoverSize.XS
        );
      } else if(role == 'zonas'){
        this.router.navigate(['gestion-zona-sector', this.selectedInventario.sucursal.id], { relativeTo: this.route });
      } else if(role == 'transferencias'){
        this.router.navigate(['/transferencias/list/filtradas', this.selectedInventario.sucursal.id, EtapaTransferencia.TRANSPORTE_EN_CAMINO]);
      }
    });
  }

  async verificarTransferenciasPendientes() {
    if (!this.selectedInventario?.sucursal?.id) {
      return;
    }

    (await this.transferenciaService.onGetTransferenciasWithFilters({
      sucursalDestinoId: +this.selectedInventario.sucursal.id,
      etapa: EtapaTransferencia.TRANSPORTE_EN_CAMINO,
      page: 0,
      size: 1
    }, false))
      .pipe(untilDestroyed(this))
      .subscribe((res) => {
        if (res != null && res.getContent && res.getContent.length > 0) {
         this.notificacionService.open('Hay transferencias pendientes a ser concluidas', TipoNotificacion.WARN, 6);
        }
      });
  }

  async cargarCantidadTransferenciasActivas(showLoading: boolean = true) {
    if (!this.selectedInventario?.sucursal?.id) {
      this.cantidadTransferenciasActivas = 0;
      return;
    }

    (await this.transferenciaService.onGetTransferenciasWithFilters({
      sucursalDestinoId: +this.selectedInventario.sucursal.id,
      etapa: EtapaTransferencia.TRANSPORTE_EN_CAMINO,
      page: 0,
      size: 1
    }, showLoading))
      .pipe(untilDestroyed(this))
      .subscribe((res) => {
        if (res != null && res.getTotalElements !== undefined) {
          this.cantidadTransferenciasActivas = res.getTotalElements || 0;
        } else {
          this.cantidadTransferenciasActivas = 0;
        }
      });
  }

  async onGetProductosItemList(invPro: InventarioProducto, index) {
    if (invPro.inventarioProductoItemList == null) {
      (await this.inventarioService.onGetInventarioProItem(invPro.id, 0))
        .pipe(untilDestroyed(this))
        .subscribe((res) => {
          if (res != null) {
            this.selectedInventario.inventarioProductoList[
              index
            ].inventarioProductoItemList = res;
          }
        });
    }
  }

  async onCargarMas(invPro: InventarioProducto, index) {
    let page =
      Math.floor((invPro.inventarioProductoItemList.length - 1) / 5) + 1;
    (await this.inventarioService.onGetInventarioProItem(invPro.id, page))
      .pipe(untilDestroyed(this))
      .subscribe((res) => {
        console.log(res);
        if (res != null) {
          this.selectedInventario.inventarioProductoList[
            index
          ].inventarioProductoItemList =
            this.selectedInventario.inventarioProductoList[
              index
            ].inventarioProductoItemList.concat(res);
        }
      });
  }

  async onCargarMenos(invPro: InventarioProducto, index) {
    let length =
      this.selectedInventario.inventarioProductoList[index]
        .inventarioProductoItemList.length;
    let sobra = length - 4;
    this.selectedInventario.inventarioProductoList[
      index
    ].inventarioProductoItemList.splice(length - sobra, sobra - 1);
  }
}
