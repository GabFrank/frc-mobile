import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { ActivatedRoute } from '@angular/router';
import { TransferenciaService } from './../transferencia.service';
import { Transferencia } from './../transferencia.model';
import { Component, OnInit } from '@angular/core';
import {Location} from '@angular/common';


@UntilDestroy()
@Component({
  selector: 'app-info-transferencia',
  templateUrl: './info-transferencia.component.html',
  styleUrls: ['./info-transferencia.component.scss'],
})
export class InfoTransferenciaComponent implements OnInit {

  selectedTransferencia: Transferencia;

  constructor(private transferenciaService: TransferenciaService, private route: ActivatedRoute, private _location: Location) { }

  ngOnInit() {
    this.route.paramMap.subscribe(res => {
      this.buscarTransferencia(res.get('id'))
    });
  }

  buscarTransferencia(id){
    if(id!=null){
      this.transferenciaService.onGetTransferencia(id)
        .pipe(untilDestroyed(this))
        .subscribe(res => {
          if(res!=null){
            this.selectedTransferencia = res;
            console.log(res)
          }
        })
    }
  }

  onBack(){
    this._location.back()
  }

}
