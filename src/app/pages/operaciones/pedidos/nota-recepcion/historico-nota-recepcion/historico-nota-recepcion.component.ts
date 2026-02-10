import { Component, OnInit } from '@angular/core';
import { RecepcionMercaderia } from '../../recepcion-mercaderia/recepcion-mercaderia.model';
import { MainService } from 'src/app/services/main.service';
import { RecepcionMercaderiaService } from '../../recepcion-mercaderia/recepcion-mercaderia.service';
import { PageInfo } from 'src/app/app.component';
import { Location } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { BarcodeScanner } from '@awesome-cordova-plugins/barcode-scanner/ngx';
import { QrGeneratorComponent } from 'src/app/components/qr-generator/qr-generator.component';
import { PopOverService, PopoverSize } from 'src/app/services/pop-over.service';
import { codificarQr, QrData } from 'src/app/generic/utils/qrUtils';
import { TipoEntidad } from 'src/app/domains/enums/tipo-entidad.enum';

@Component({
  selector: 'app-historico-nota-recepcion',
  templateUrl: './historico-nota-recepcion.component.html',
  styleUrls: ['./historico-nota-recepcion.component.scss'],
  providers: [BarcodeScanner]
})
export class HistoricoNotaRecepcionComponent implements OnInit {
  recepcionMercaderiaList: RecepcionMercaderia[];
  pageIndex = 0;
  pageSize = 5;
  selectedPageInfo: PageInfo<RecepcionMercaderia>;
  constructor(
    private mainService: MainService,
    private recepcionMercaderiaService: RecepcionMercaderiaService,
    private _location: Location,
    private router: Router,
    private route: ActivatedRoute,
    private popoverService: PopOverService
  ) {}

  ngOnInit() {
    setTimeout(() => {
      this.onSearchRecepcionMercaderia();
    }, 500);
  }

  async onSearchRecepcionMercaderia() {
    (
      await this.recepcionMercaderiaService.onGetRecepcionMercaderiaListPorUsuarioId(
        this.mainService.usuarioActual.id,
        this.pageIndex,
        this.pageSize
      )
    ).subscribe((res) => {
      console.log(res);

      this.selectedPageInfo = res;
      // Calcular cantNotas desde las notas asociadas
      this.recepcionMercaderiaList = res.getContent.map(rm => {
        rm.cantNotas = rm.notas?.length || 0;
        return rm;
      });
    });
  }

  onItemClick(recepcionMercaderia: RecepcionMercaderia) {
    this.router.navigate([
      '/operaciones/pedidos/recepcion-producto',
      recepcionMercaderia.id
    ]);
  }

  onBack() {
    this._location.back();
  }

  handlePagination(e) {
    this.pageIndex = e - 1;
    this.onSearchRecepcionMercaderia();
  }

  onShare(recepcionMercaderia: RecepcionMercaderia) {
    let codigo = new QrData();
    codigo.tipoEntidad = TipoEntidad.RECEPCION_MERCADERIA;
    codigo.idCentral = recepcionMercaderia?.id;
    codigo.idOrigen = recepcionMercaderia?.id;
    codigo.sucursalId = recepcionMercaderia?.sucursalRecepcion?.id;
    this.popoverService.open(
      QrGeneratorComponent,
      codificarQr(codigo),
      PopoverSize.XS
    );
  }
}
