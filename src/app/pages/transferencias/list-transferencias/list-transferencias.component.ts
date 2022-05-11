import { Router, ActivatedRoute } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { MainService } from './../../../services/main.service';
import { TransferenciaService } from './../transferencia.service';
import { Transferencia } from './../transferencia.model';
import { Component, OnInit } from '@angular/core';

@UntilDestroy()
@Component({
  selector: 'app-list-transferencias',
  templateUrl: './list-transferencias.component.html',
  styleUrls: ['./list-transferencias.component.scss'],
})
export class ListTransferenciasComponent implements OnInit {

  transferenciaList: Transferencia[]

  constructor(
    private transferenciaService: TransferenciaService,
    private mainService: MainService,
    private router: Router,
    private route: ActivatedRoute
  ) { }

  ngOnInit() {
    this.verificarUsuario()
  }

  onGetTransferencias() {
    this.transferenciaService.onGetTrasnferenciasPorUsuario(this.mainService?.usuarioActual?.id)
      .pipe(untilDestroyed(this))
      .subscribe(res => {
        if (res != null) {
          this.transferenciaList = res;
        }
      })
  }

  verificarUsuario(){
    if(this.mainService?.usuarioActual!=null){
      this.onGetTransferencias()
    } else {
      setTimeout(() => {
        this.verificarUsuario()
      }, 1000);
    }
  }

  onItemClick(item: Transferencia){
    this.router.navigate(['info', item.id], { relativeTo: this.route });
  }

}
