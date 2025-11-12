import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { Sucursal } from 'src/app/domains/empresarial/sucursal/sucursal.model';
import { NotaRecepcion } from 'src/app/domains/operaciones/pedido/nota-recepcion.model';
import { Proveedor } from 'src/app/pages/personas/proveedor/proveedor.model';

@Component({
  selector: 'app-confirmacion-nota',
  templateUrl: './confirmacion-nota.component.html',
  styleUrls: ['./confirmacion-nota.component.scss']
})
export class ConfirmacionNotaComponent implements OnInit {

  @Input() nota: NotaRecepcion;
  @Input() proveedor: Proveedor;
  @Input() sucursal: Sucursal;
  @Output() confirmar = new EventEmitter<void>();
  @Output() cancelar = new EventEmitter<void>();

  fechaFormateada: string = '';

  constructor() { }

  ngOnInit() {
    if (this.nota) {
      this.fechaFormateada = this.getFechaFormateada(this.nota.fecha);
    }
  }

  onConfirmar() {
    this.confirmar.emit();
  }

  onCancelar() {
    this.cancelar.emit();
  }

  getFechaFormateada(fecha: Date): string {
    if (!fecha) return '';
    return new Date(fecha).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  getEstadoColor(estado: string): string {
    switch (estado) {
      case 'PENDIENTE':
        return '#f57c00';
      case 'EN_PROCESO':
        return '#2196f3';
      case 'FINALIZADA':
        return '#43a047';
      case 'CANCELADA':
        return '#f44336';
      default:
        return '#999';
    }
  }
} 