import { TipoEntidad } from './../../../domains/enums/tipo-entidad.enum';
import { codificarQr, QrData } from './../../../generic/utils/qrUtils';
import { QrGeneratorComponent } from './../../../components/qr-generator/qr-generator.component';
import { ImagePopoverComponent } from 'src/app/components/image-popover/image-popover.component';
import { BarcodeScanner } from '@awesome-cordova-plugins/barcode-scanner/ngx';
import { NotificacionService, TipoNotificacion } from 'src/app/services/notificacion.service';
import { MainService } from 'src/app/services/main.service';
import { FormControl } from '@angular/forms';
import { DialogoService } from 'src/app/services/dialogo.service';
import { Zona } from 'src/app/domains/zona/zona.model';
import { EditInventarioItemDialogComponent, InventarioItemData } from './../edit-inventario-item-dialog/edit-inventario-item-dialog.component';
import { PopOverService, PopoverSize } from './../../../services/pop-over.service';
import { SearchProductoDialogComponent } from './../../producto/search-producto-dialog/search-producto-dialog.component';
import { SelectZonaDialogComponent } from './../select-zona-dialog/select-zona-dialog.component';
import { ModalService } from './../../../services/modal.service';
import { ActionMenuData } from './../../../services/menu-action.service';
import { MenuActionService } from 'src/app/services/menu-action.service';
import { InventarioProducto, InventarioProductoItem, InventarioProductoItemInput } from './../inventario.model';
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
import { Platform } from '@ionic/angular';

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
  styleUrls: ['./edit-inventario.component.scss'],
})
export class EditInventarioComponent implements OnInit {


  selectedInventario: Inventario;
  sectorList: Sector[] = []
  inventarioDataList: InventarioData[] = [];
  inventarioId;
  mostrarControl = new FormControl(OpcionesMostrar.MIOS)
  opcionesMostrarList = Object.values(OpcionesMostrar)
  selectedResponsable: Usuario;
  isAddZona = false;

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
  ) {
  }

  ngOnInit() {
    this.selectedResponsable = this.mainService.usuarioActual;
    this.route.paramMap
      .pipe(untilDestroyed(this))
      .subscribe(res => {
        this.inventarioId = res.get('id')
        if (this.inventarioId != null) {
          this.buscarInventario(this.inventarioId)
        }
      })


  }

  async buscarInventario(id) {
    (await this.inventarioService.onGetInventario(id)).pipe(untilDestroyed(this))
      .subscribe(res => {
        if (res != null) {
          this.selectedInventario = res;
          this.onGetSectores(this.selectedInventario.sucursal.id)
          this.ordenarZonas()
        }
      })
  }

  async onGetSectores(id) {
    (await this.sectorSerice.onGetSectores(id))
      .pipe(untilDestroyed(this))
      .subscribe(res => {
        console.log(res)
        this.sectorList = res;
      })
  }

  async onAddZona() {
    let arrAux: Sector[] = this.sectorList;
    let filteredZonas: Zona[] = [];

    (await this.inventarioService.onGetInventario(this.selectedInventario.id))
      .pipe(untilDestroyed(this))
      .subscribe(res => {
        if (res != null) this.selectedInventario = res;
        this.selectedInventario.inventarioProductoList.forEach(ip => {
          filteredZonas.push(ip?.zona)
        })
        arrAux.forEach(s => {
          s.zonaList = s.zonaList.filter(z => filteredZonas.find(fz => fz.id == z.id) == null)
        })
        this.modalService.openModal(SelectZonaDialogComponent, arrAux).then(async res => {
          if (res.data != null) {
            let selectedZona = res.data;
            let inventarioProducto = new InventarioProducto()
            inventarioProducto.concluido = false;
            inventarioProducto.inventario = this.selectedInventario
            inventarioProducto.zona = selectedZona
              ; (await this.inventarioService.onSaveInventarioProducto(inventarioProducto.toInput()))
                .pipe(untilDestroyed(this))
                .subscribe(res => {
                  if (res != null) {
                    this.buscarInventario(this.inventarioId)
                  }
                })
          }
        })
      })

  }

  onFinalizarZona(invPro: InventarioProducto, i) {
    let aux = new InventarioProducto;
    invPro = Object.assign(aux, invPro);
    this.dialogoService.open('Atención', `Usted esta finalizando la zona ${invPro?.zona?.descripcion}. Desea continuar?`).then(async res => {
      if (res.role == 'aceptar') {
        invPro.inventario = this.selectedInventario;
        invPro.concluido = true;
        (await this.inventarioService.onSaveInventarioProducto(invPro.toInput()))
          .pipe(untilDestroyed(this))
          .subscribe(res2 => {
            this.selectedInventario.inventarioProductoList[i] = invPro;
            this.ordenarZonas()
          })
      }
    })
  }

  onReabrirZona(invPro: InventarioProducto, i) {
    let aux = new InventarioProducto;
    invPro = Object.assign(aux, invPro);
    if (this.verificarAbiertos()) {
      this.dialogoService.open('Atención', `Usted esta reabriendo la zona ${invPro?.zona?.descripcion}. Desea continuar?`).then(async res => {
        if (res.role == 'aceptar') {
          invPro.inventario = this.selectedInventario;
          invPro.concluido = false;
          (await this.inventarioService.onSaveInventarioProducto(invPro.toInput()))
            .pipe(untilDestroyed(this))
            .subscribe(res2 => {
              this.selectedInventario.inventarioProductoList[i] = invPro;
              this.ordenarZonas()
            })
        }
      })
    } else {
      this.notificacionService.open('Ya tenes una zona abierta. Despues de concluirla podrás iniciar el inventario de otra', TipoNotificacion.WARN, 3)
    }
  }

  verificarAbiertos(): boolean {
    return this.selectedInventario.inventarioProductoList.find(e => e.concluido == false) == null;
  }

  ordenarZonas() {
    this.selectedInventario.inventarioProductoList = this.selectedInventario.inventarioProductoList.sort((a, b) => {
      if (a.concluido == true && b.concluido != true) {
        return 1;
      } else {
        return -1
      }
    })
  }

  onAddProducto(invPro, i) {
    this.modalService.openModal(SearchProductoDialogComponent).then(res => {
      if (res?.data) {
        let selectedPresentacion = res.data['presentacion'];
        let selectedProducto = res.data['producto'];
        let data: InventarioItemData = {
          inventarioProducto: invPro,
          producto: selectedProducto,
          presentacion: selectedPresentacion,
          inventarioProductoItem: null,
          peso: res.data['peso']
        }
        this.modalService.openModal(EditInventarioItemDialogComponent, data).then(async (res2: any) => {
          if (res2.data != null) {
            let invProItemAux: InventarioProductoItemInput = res2.data;
            (await this.productoService.onGetStockPorSucursal(data.producto?.id, this.selectedInventario.sucursal.id))
              .pipe(untilDestroyed(this))
              .subscribe(stockResponse => {
                if (stockResponse != null) {
                  invProItemAux.cantidadFisica = stockResponse;
                  console.log(stockResponse)
                }
              });
            (await this.inventarioService.onSaveInventarioProductoItem(invProItemAux))
              .pipe(untilDestroyed(this))
              .subscribe(res3 => {
                if (res3 != null) {
                  console.log(res3);
                  this.selectedInventario.inventarioProductoList.forEach(i => {
                    if (i.inventarioProductoItemList == null) i.inventarioProductoItemList = []
                    if (i.inventarioProductoItemList.length > 4) i.inventarioProductoItemList.pop()
                    i.inventarioProductoItemList.unshift(res3)
                  })
                }
              })
          }
        })
      }
    })
  }

  onEditProducto(invProItem: InventarioProductoItem, index, invPro: InventarioProducto) {
    let selectedPresentacion = invProItem?.presentacion;
    let selectedProducto = invProItem?.presentacion?.producto;
    let data: InventarioItemData = {
      inventarioProducto: invPro,
      producto: selectedProducto,
      presentacion: selectedPresentacion,
      inventarioProductoItem: invProItem
    }
    this.modalService.openModal(EditInventarioItemDialogComponent, data).then(async res2 => {
      if (res2.data != null) {
        (await this.inventarioService.onSaveInventarioProductoItem(res2.data))
          .pipe(untilDestroyed(this))
          .subscribe(res3 => {
            if (res3 != null) {
              this.selectedInventario.inventarioProductoList.forEach(i => {
                if (i.inventarioProductoItemList == null) i.inventarioProductoItemList = []
                i.inventarioProductoItemList[index] = res3
              })
            }
          })
      }
    })
  }

  openFilterMenu() {
    this.menuActionService.presentActionSheet([
      { texto: 'Todos', role: OpcionesMostrar.TODOS },
      { texto: 'Mios', role: OpcionesMostrar.MIOS },
    ]).then(res => {
      let role = res.role;
      if (role != null) this.mostrarControl.setValue(role)
    })
  }

  onRefresh() {
    this.ngOnInit()
  }

  onBack() {
    this._location.back()
  }

  onMenuClick() {
    let menu: ActionMenuData[] = [
      { texto: 'Actualizar datos', role: 'actualizar' },
      { texto: 'Resumen', role: 'resumen' },
      { texto: 'Compartir', role: 'compartir' }
    ]
    this.menuActionService.presentActionSheet(menu).then(res => {
      let role = res.role;
      if (role == 'actualizar') {
        this.ngOnInit()
      } else if (role == 'resumen') {
        this.router.navigate(['finalizar'], { relativeTo: this.route });
      } else if (role == 'compartir') {
        let codigo = new QrData;
        codigo.sucursalId = this.selectedInventario?.sucursal?.id;
        codigo.tipoEntidad = TipoEntidad.INVENTARIO;
        codigo.idCentral = this.selectedInventario?.id;
        this.popoverService.open(QrGeneratorComponent, codificarQr(codigo), PopoverSize.XS)
      }

    })
  }

  async onGetProductosItemList(invPro: InventarioProducto, index) {
    if (invPro.inventarioProductoItemList == null) {
      (await this.inventarioService.onGetInventarioProItem(invPro.id, 0)).pipe(untilDestroyed(this)).subscribe(res => {
        if (res != null) {
          this.selectedInventario.inventarioProductoList[index].inventarioProductoItemList = res;
        }
      })
    }
  }

  async onCargarMas(invPro: InventarioProducto, index) {
    let page = Math.floor((invPro.inventarioProductoItemList.length - 1) / 5) + 1;
    (await this.inventarioService.onGetInventarioProItem(invPro.id, page)).pipe(untilDestroyed(this)).subscribe(res => {
      console.log(res);
      if (res != null) {
        this.selectedInventario.inventarioProductoList[index].inventarioProductoItemList = this.selectedInventario.inventarioProductoList[index].inventarioProductoItemList.concat(res);
      }
    })
  }

  async onCargarMenos(invPro: InventarioProducto, index) {
    let length = this.selectedInventario.inventarioProductoList[index].inventarioProductoItemList.length;
    let sobra = length - 4;
    this.selectedInventario.inventarioProductoList[index].inventarioProductoItemList.splice(length-sobra, sobra-1)
  }


}



