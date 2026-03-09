import { Component, OnInit } from '@angular/core';
import { UntilDestroy } from '@ngneat/until-destroy';

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-caja',
  templateUrl: './caja.component.html',
  styleUrls: ['./caja.component.scss'],
  providers: []
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

  abrirCaja(){

  }

  buscarCaja(){

  }

  buscarHistoricoDeCajas(){

  }

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

  //       });
  //   });
  // }
}

