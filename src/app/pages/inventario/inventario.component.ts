import { untilDestroyed, UntilDestroy } from '@ngneat/until-destroy';
import { DialogoService } from './../../services/dialogo.service';
import { InventarioService } from './inventario.service';
import { CargandoService } from './../../services/cargando.service';
import { ScannerService } from './../../services/scanner.service';
import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { until } from 'protractor';

@UntilDestroy()
@Component({
  selector: 'app-inventario',
  templateUrl: './inventario.component.html',
  styleUrls: ['./inventario.component.scss'],
})
export class InventarioComponent implements OnInit {

  codigo = '858354309'
  key; //un numero random utilizado para iniciar el inventario, si el inventario no es iniciado el router va a devolver ese numero y se cambiara para que proximamente al iniciar inventario este vuelva a llamar on init
  constructor(private scannerService: ScannerService,
    private cargandoService: CargandoService,
    private inventarioService: InventarioService,
    private dialog: DialogoService,
    private router: Router,
    private activatedRoute: ActivatedRoute
  ) { }

  async ngOnInit() {
    // this.scannerService.scanBarcode(BarcodeFormat.QR_CODE)
    //   .pipe(untilDestroyed(this))
    //   .subscribe(res => {
    //     if (res.text != null) {
    //       this.cargandoService.open('Creando sesion de inventario con código ' + res.text)
    //     }
    //   })




  }

}
