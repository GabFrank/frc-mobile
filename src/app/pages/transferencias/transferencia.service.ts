import { GetTransferenciasPorUsuarioGQL } from './graphql/getTransferenciasPorUsuario';
import { NotificacionService, TipoNotificacion } from 'src/app/services/notificacion.service';
import { DialogoService } from 'src/app/services/dialogo.service';
import { GenericCrudService } from './../../generic/generic-crud.service';
import { Injectable } from '@angular/core';
import { untilDestroyed, UntilDestroy } from '@ngneat/until-destroy';
import { Observable } from 'rxjs';
import { MainService } from 'src/app/services/main.service';
import { DeleteTransferenciaGQL } from './graphql/deleteTransferencia';
import { DeleteTransferenciaItemGQL } from './graphql/deleteTransferenciaItem';
import { FinalizarTransferenciaGQL } from './graphql/finalizarTransferencia';
import { GetTransferenciaGQL } from './graphql/getTransferencia';
import { GetTransferenciaPorFechaGQL } from './graphql/getTransferenciaPorFecha';
import { PrepararTransferenciaGQL } from './graphql/prepararTransferencia';
import { SaveTransferenciaGQL } from './graphql/saveTransferencia';
import { SaveTransferenciaItemGQL } from './graphql/saveTransferenciaItem';
import { Transferencia, TransferenciaItem, TransferenciaEstado, EtapaTransferencia } from './transferencia.model';
import { GetTransferenciaItensPorTransferenciaIdGQL } from './graphql/getTransferenciaItensPorTransferenciaId';
import { PageInfo } from 'src/app/app.component';
import { GetTransferenciaItensWithFilterGQL } from './graphql/getTransferenciaItensWithFilter';

@UntilDestroy()
@Injectable({
  providedIn: 'root'
})
export class TransferenciaService {

  constructor(
    private genericCrudService: GenericCrudService,
    private getTransferencia: GetTransferenciaGQL,
    private saveTransferencia: SaveTransferenciaGQL,
    private deleteTransfencia: DeleteTransferenciaGQL,
    private saveTransferenciaItem: SaveTransferenciaItemGQL,
    private deleteTransferenciaItem: DeleteTransferenciaItemGQL,
    private finalizarTransferencia: FinalizarTransferenciaGQL,
    private prepararTransferencia: PrepararTransferenciaGQL,
    private getTransferenciasPorFecha: GetTransferenciaPorFechaGQL,
    private mainService: MainService,
    private dialogoService: DialogoService,
    private notificacionService: NotificacionService,
    private transferenciasPorUsuario: GetTransferenciasPorUsuarioGQL,
    private transferenciaItemPorTransferenciaId: GetTransferenciaItensPorTransferenciaIdGQL,
    private transferenciaItemPorTransferenciaIdWithFilter: GetTransferenciaItensWithFilterGQL
  ) { }

  async onGetTrasferenciasPorFecha(inicio, fin) {
    return await this.genericCrudService.onGetByFecha(this.getTransferenciasPorFecha, inicio, fin);
  }

  async onGetTransferencia(id): Promise<Observable<Transferencia>> {
    return await this.genericCrudService.onGetById(this.getTransferencia, id);
  }

  async onSaveTransferencia(input): Promise<Observable<Transferencia>> {
    input.usuarioPreTransferenciaId = this.mainService.usuarioActual.id;
    return await this.genericCrudService.onSave(this.saveTransferencia, input);
  }

  async onDeleteTransferencia(id): Promise<Observable<boolean>> {
    return await this.genericCrudService.onDelete(this.deleteTransfencia, id, 'Realmente  desea eliminar esta transferencia?')
  }

  async onGetTransferenciaItensPorTransferenciaId(id, page?, size?): Promise<Observable<PageInfo<TransferenciaItem>>> {
    return await this.genericCrudService.onGetById(this.transferenciaItemPorTransferenciaId, id, page, size);
  }

  async onGetTransferenciaItensWithFilters(id, name?, page?, size?): Promise<Observable<PageInfo<TransferenciaItem>>> {
    return await this.genericCrudService.onCustomGet(this.transferenciaItemPorTransferenciaIdWithFilter, {id, name, page, size});
  }

  async onSaveTransferenciaItem(input): Promise<Observable<TransferenciaItem>> {
    return await this.genericCrudService.onSave(this.saveTransferenciaItem, input);
  }

  async onDeleteTransferenciaItem(id): Promise<Observable<boolean>> {
    return await this.genericCrudService.onDelete(this.deleteTransferenciaItem, id, 'Realmente desea eliminar este item')
  }

  async onGetTrasnferenciasPorUsuario(id): Promise<Observable<Transferencia[]>> {
    return await this.genericCrudService.onGetById(this.transferenciasPorUsuario, id)
  }

  onFinalizar(transferencia: Transferencia): Observable<boolean> {
    return new Observable(obs => {
      if (transferencia.estado == TransferenciaEstado.ABIERTA) {
        this.dialogoService.open('Realmente desea finalizar esta transferencia?', 'Una vez finalizada, la transferencia estara disponible para ser preparada', true).then(res => {
          if (res) {
            this.finalizarTransferencia.mutate({
              id: transferencia.id,
              usuarioId: this.mainService.usuarioActual.id
            }, { fetchPolicy: 'no-cache', errorPolicy: 'all' })
              .pipe(untilDestroyed(this))
              .subscribe(res => {
                if (res.errors == null) {
                  obs.next(true)
                  this.notificacionService.openGuardadoConExito()
                } else {
                  obs.next(false)
                  this.notificacionService.openAlgoSalioMal()
                }
              })
          }
        })

      }
    })
  }

  onAvanzarEtapa(transferencia: Transferencia, etapa: EtapaTransferencia): Observable<boolean> {
    let texto = ''
    if (etapa == EtapaTransferencia.PRE_TRANSFERENCIA_ORIGEN) {
      texto = 'Estas iniciando la etapa de preparación de productos, verifique con cuidado cada item';
    } else if (etapa == EtapaTransferencia.PREPARACION_MERCADERIA) {
      texto = 'Estas iniciando la etapa de preparación de productos, verifique con cuidado cada item';
    } else if (etapa == EtapaTransferencia.PREPARACION_MERCADERIA_CONCLUIDA) {
      texto = 'Estas culminando la etapa de preparación de productos, aguardando transporte';
    } else if (etapa == EtapaTransferencia.TRANSPORTE_VERIFICACION) {
      texto = 'Estas iniciando la etapa de verificación de productos para su transporte';
    } else if (etapa == EtapaTransferencia.TRANSPORTE_EN_CAMINO) {
      texto = 'Estas iniciando la etapa de transporte de la sucursal de origen a sucursal de destino, al aceptar, se dara de baja en stock';
    } else if (etapa == EtapaTransferencia.TRANSPORTE_EN_DESTINO) {
      texto = 'Estas culminando la entrega de productos a la sucursal de destino, aguarde su verificación';
    } else if (etapa == EtapaTransferencia.RECEPCION_EN_VERIFICACION) {
      texto = 'Estas iniciando la etapa de recepción de productos, verifique con cuidado cada item';
    } else if (etapa == EtapaTransferencia.RECEPCION_CONCLUIDA) {
      texto = 'Estas culminando la etapa de recepción, al aceptar, las mercaderias van a ser cargadas en stock';
    }
    return new Observable(obs => {
      this.dialogoService.open('Atención, revise los datos antes de proceder.', texto).then(res => {
        if (res.role=='aceptar') {
          this.prepararTransferencia.mutate({
            id: transferencia.id,
            etapa,
            usuarioId: this.mainService.usuarioActual.id
          }, { fetchPolicy: 'no-cache', errorPolicy: 'all' })
            .pipe(untilDestroyed(this))
            .subscribe(res => {
              if (res.errors == null) {
                obs.next(true)
                this.notificacionService.openGuardadoConExito()
              } else {
                obs.next(false)
                this.notificacionService.openAlgoSalioMal()
              }
            })
        }
      })
    })
  }
}
