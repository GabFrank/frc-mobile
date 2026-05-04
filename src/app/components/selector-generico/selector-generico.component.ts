import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
} from '@angular/core';

export interface OpcionSeleccion {
  valor: unknown;
  texto: string;
}

@Component({
  selector: 'app-selector-generico',
  templateUrl: './selector-generico.component.html',
  styleUrls: ['./selector-generico.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SelectorGenericoComponent implements OnChanges {
  @Input() etiqueta = '';
  @Input() placeholder = '';
  @Input() opciones: OpcionSeleccion[] = [];
  @Input() valor: unknown = null;
  @Input() interfaz: 'action-sheet' | 'alert' | 'popover' = 'action-sheet';

  @Output() valorChange = new EventEmitter<unknown>();

  valorInterno: unknown = null;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['valor']) {
      this.valorInterno = this.valor;
    }
  }

  alCambiarValor(evento: CustomEvent): void {
    this.valorInterno = evento.detail.value;
    this.valorChange.emit(this.valorInterno);
  }
}
