import { Component, OnInit } from '@angular/core';
import { BarcodeScanner } from '@awesome-cordova-plugins/barcode-scanner/ngx';
import { UntilDestroy } from '@ngneat/until-destroy';

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-caja',
  templateUrl: './caja.component.html',
  styleUrls: ['./caja.component.scss'],
  providers: [BarcodeScanner]
})
export class CajaComponent implements OnInit {

  // tentativas = 0;
  // dialog: any;

  constructor(
    // private cajaService: CajaService,
    // private router: Router,
    // private route: ActivatedRoute,
    // private sucursalService: SucursalService,
    // private mainService: MainService,
    // private modalService: ModalService
  ) { }

  ngOnInit() { }

  // async buscarCaja() {
  //   (await this.cajaService.onGetByUsuarioIdAndAbierto(this.mainService.usuarioActual?.id)).subscribe(res => {
  //     console.log(res);
  //     if (res.length > 0) {
  //       console.log(res);

  //       let data: GenericListDialogData = {
  //         titulo: 'Lista de cajas',
  //         tableData: [
  //           {
  //             id: 'id',
  //             nombre: 'ID',
  //             width: 3
  //           },
  //           {
  //             id: 'sucursal',
  //             nombre: 'Sucursal',
  //             nested: true,
  //             nestedId: 'nombre',
  //             width: 9
  //           },
  //           {
  //             id: 'fechaApertura',
  //             nombre: 'Fecha de apertura',
  //             width: 12
  //           }
  //         ],
  //         inicialData: res,
  //         search: false
  //       }

  //       this.modalService.openModal(GenericListDialogComponent, data).then(res => {
  //         if (res != null) {
  //           this.cajaService.selectedCaja = res['data'];
  //           this.router.navigate(['info'], { relativeTo: this.route });
  //         }
  //       })

  //     }
  //   })
  // }

  // async abrirCaja() {
  //   this.cajaService.selectedCaja = null;
  //   let selectedConteo: Conteo;
  //   let selectedMaletin: Maletin;
  //   let selectedSucursal: Sucursal;

  //   // (await this.sucursalService.onGetAllSucursales()).subscribe(res => {
  //   //   if (res.length > 0) {
  //   //     res = res.filter(s => s.id != 0)
  //   //     let data: GenericListDialogData = {
  //   //       titulo: 'Lista de sucursales',
  //   //       tableData: [
  //   //         {
  //   //           id: 'id',
  //   //           nombre: 'ID',
  //   //           width: 3
  //   //         },
  //   //         {
  //   //           id: 'nombre',
  //   //           nombre: 'Sucursal',
  //   //           width: 9
  //   //         }
  //   //       ],
  //   //       inicialData: res,
  //   //       search: false
  //   //     }
  //   //     this.modalService.openModal(GenericListDialogComponent, data).then(async sucursalRes => {
  //   //       if (sucursalRes['data'] != null) {
  //   //         selectedSucursal = sucursalRes['data'];
  //   //         selectedMaletin = (await this.modalService.openModal(BuscarMaletinDialogComponent))['data'];
  //   //         if (selectedMaletin != null) {
  //   //           selectedConteo = (await this.modalService.openModal(AdicionarConteoDialogComponent))['data']['conteo'];
  //   //           if (selectedConteo != null) {
  //   //             let newCaja = new PdvCaja;
  //   //             newCaja.maletin = selectedMaletin;
  //   //             newCaja.usuario = this.mainService.usuarioActual;
  //   //             newCaja.sucursalId = selectedSucursal.id;
  //   //             (await this.cajaService.onAbrirCaja(newCaja.toInput(), selectedConteo.toInput(), selectedConteo.toInpuList())).subscribe(saveRes => {
  //   //               if (saveRes != null) {
  //   //                 console.log('exito');
  //   //               }
  //   //             })
  //   //           }
  //   //         }
  //   //       }
  //   //     })
  //   //   }
  //   // })
  // }

  // async buscarHistoricoDeCajas() {
  //   (await this.cajaService.onGetByUsuarioId(this.mainService.usuarioActual?.id)).subscribe(res => {
  //     if (res.length > 0) {
  //       let data: GenericListDialogData = {
  //         titulo: 'Lista de cajas',
  //         tableData: [
  //           {
  //             id: 'id',
  //             nombre: 'ID',
  //             width: 3
  //           },
  //           {
  //             id: 'sucursal',
  //             nombre: 'Sucursal',
  //             nested: true,
  //             nestedId: 'nombre',
  //             width: 9
  //           },
  //           {
  //             id: 'fechaApertura',
  //             nombre: 'Fecha de apertura',
  //             width: 12
  //           },
  //           {
  //             id: 'fechaCierre',
  //             nombre: 'Fecha de cierre',
  //             width: 12
  //           }
  //         ],
  //         inicialData: res,
  //         search: false
  //       }
  //       this.modalService.openModal(GenericListDialogComponent, data).then(async res => {
  //         if (res != null) {
  //           this.cajaService.selectedCaja = res['data'];
  //           (await this.cajaService.onGetById(this.cajaService.selectedCaja?.id, this.cajaService.selectedCaja?.sucursal?.id)).subscribe(res2 => {
  //             if (res2 != null) {
  //               this.cajaService.selectedCaja = res2;
  //               this.router.navigate(['info'], { relativeTo: this.route });
  //             }
  //           })
  //         }
  //       })
  //     }
  //   })
  // }

  // async verificarMaletin(maletin: Maletin) {
  //   (await this.maletinService
  //     .onGetPorDescripcion(maletin.descripcion, this.cajaService.selectedCaja.sucursal.id)).pipe(untilDestroyed(this))
  //     .subscribe((res) => {
  //       if (res != null) {
  //         let maletinEncontrado: Maletin = res;
  //         if (maletinEncontrado.abierto == true) {
  //           this.notificacionService.warn('Este maletín está siendo utilizado')
  //           this.seleccionarMaletin(null);
  //         } else {
  //           this.notificacionService.success('Verificado con éxito')
  //           this.seleccionarMaletin(maletinEncontrado);
  //         }
  //       } else {
  //         this.notificacionService.danger('Maletín no encontrado')
  //         this.seleccionarMaletin(null);
  //       }
  //     });
  // }":true,"valor":1,"moneda":{"id":"2","denominacion":"REAL","__typename":"Moneda"},"__typename":"MonedaBilletes"}},{"cantidad":1,"monedaBilletes":{"id":"16","flotante":true,"papel":true,"activo":true,"valor":10,"moneda":{"id":"2","denominacion":"REAL","__typename":"Moneda"},"__typename":"MonedaBilletes"}},{"cantidad":1,"monedaBilletes":{"id":"24","flotante":true,"papel":true,"activo":true,"valor":20,"moneda":{"id":"3","denominacion":"DOLAR","__typename":"Moneda"},"__typename":"MonedaBilletes"}},{"cantidad":1,"monedaBilletes":{"id":"25","flotante":true,"papel":true,"activo":true,"valor":50,"moneda":{"id":"3","denominacion":"DOLAR","__typename":"Moneda"},"__typename":"MonedaBilletes"}},{"cantidad":1,"monedaBilletes":{"id":"26","flotante":true,"papel":true,"activo":true,"valor":100,"moneda":{"id":"3","denominacion":"DOLAR","__typename":"Moneda"},"__typename":"MonedaBilletes"}}]}-undefined

}

