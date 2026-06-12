import {
  ChangeDetectionStrategy,
  Component,
  Input,
} from '@angular/core';

@Component({
  selector: 'app-seccion-accordion',
  templateUrl: './seccion-accordion.component.html',
  styleUrls: ['./seccion-accordion.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SeccionAccordionComponent {
  @Input() valor = '';
  @Input() icono = '';
  @Input() titulo = '';
  @Input() subtitulo = '';
}
