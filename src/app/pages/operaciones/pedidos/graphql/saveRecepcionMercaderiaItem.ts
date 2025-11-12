import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { saveRecepcionMercaderiaItem } from './pedidos-mutations.graphql';
import { Usuario } from "src/app/domains/personas/usuario.model";
import { MetodoVerificacion, MotivoVerificacionManual, MotivoRechazoFisico } from "src/app/domains/operaciones/pedido/recepcion-mercaderia-item.model";

export interface RecepcionMercaderiaItemInput {
    id: number;
    recepcionMercaderiaId: number;
    notaRecepcionItemDistribucionId?: number;
    usuarioId: number;
    observaciones?: string;
    metodoVerificacion: MetodoVerificacion;
    motivoVerificacionManual?: MotivoVerificacionManual;
    variaciones: RecepcionMercaderiaItemVariacionInput[];
}

export interface RecepcionMercaderiaItemVariacionInput {
    presentacionId?: number;
    cantidad: number;
    vencimiento?: string; // Formato YYYY-MM-DD
    lote?: string;
    rechazado: boolean;
    motivoRechazo?: MotivoRechazoFisico;
}

export interface RecepcionMercaderiaItem {
  id: number;
  cantidadRecibida: number;
  metodoVerificacion: string;
  motivoVerificacionManual?: string;
}

@Injectable({ providedIn: 'root' })
export class SaveRecepcionMercaderiaItemMutation extends Mutation<{ data: RecepcionMercaderiaItem }> {
  override document = saveRecepcionMercaderiaItem;
} 