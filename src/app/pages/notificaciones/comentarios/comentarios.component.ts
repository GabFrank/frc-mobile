import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NotificacionService } from '../notificacion.service';
import { BehaviorSubject, Observable, combineLatest, of, timer, merge } from 'rxjs';
import { map, switchMap, tap } from 'rxjs/operators';
import { Usuario } from '../models/usuario.model';
import { NotificacionComentario } from '../models/notificacion-comentario.model';
import { FormControl } from '@angular/forms';

@Component({
  selector: 'app-comentarios',
  templateUrl: './comentarios.component.html',
  styleUrls: ['./comentarios.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ComentariosComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly notificacionService = inject(NotificacionService);

  public notificacionId$: Observable<number>;
  public usuarios$: Observable<Usuario[]>;
  public comentarios$: Observable<NotificacionComentario[]>;
  public refresh$ = new BehaviorSubject<void>(undefined);
  public comentarioInput = new FormControl('');

  public pendingComments: NotificacionComentario[] = [];
  private userColorsCache = new Map<number, string>();

  public limiteDestinatarios = 5;
  public mostrarTodos = false;

  ngOnInit() {
    this.notificacionId$ = this.route.paramMap.pipe(
      map(params => Number(params.get('id')))
    );

    this.usuarios$ = this.notificacionId$.pipe(
      switchMap(id => this.notificacionService.usuariosConAcceso(id))
    );

    const polling$ = timer(0, 3000).pipe(
      map(() => undefined)
    );

    this.comentarios$ = combineLatest([
      this.notificacionId$,
      merge(this.refresh$, polling$)
    ]).pipe(
      switchMap(([id]) => this.notificacionService.comentarios(id)),
      map(serverComments => {
        return [...serverComments, ...this.pendingComments];
      })
    );
  }

  toggleMostrarTodos() {
    this.mostrarTodos = !this.mostrarTodos;
  }

  avatar(usuario: Usuario): string {
    return usuario.persona?.imagenes || `https://ui-avatars.com/api/?name=${usuario.nickname}&background=random`;
  }

  destinatariosChips(usuarios: Usuario[]) {
    if (this.mostrarTodos) {
      return usuarios;
    }
    return usuarios.slice(0, this.limiteDestinatarios);
  }

  destinatariosHero(usuarios: Usuario[]) {
    return usuarios.slice(0, 5);
  }

  conteoOcultosHero(usuarios: Usuario[]): number {
    return Math.max(0, usuarios.length - 5);
  }

  getUserColor(usuarioId: number): string {
    if (!this.userColorsCache.has(usuarioId)) {
      const colors = [
        '#f44336', '#43a047', '#e53935', '#66bb6a', '#d32f2f', '#388e3c',
        '#ef5350', '#81c784', '#c62828', '#2e7d32', '#ff5252', '#4caf50',
        '#b71c1c', '#1b5e20', '#ff1744', '#00e676',
      ];
      this.userColorsCache.set(usuarioId, colors[usuarioId % colors.length]);
    }
    return this.userColorsCache.get(usuarioId)!;
  }

  formatComentario(texto: string): string {
    if (!texto) return '';
    let formatted = texto
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\n/g, '<br>');
    formatted = formatted.replace(
      /@([a-zA-Z0-9_]+)/g,
      '<span class="mention" style="color: var(--ion-color-primary); font-weight: bold;">@$1</span>'
    );
    return formatted;
  }

  enviarComentario() {
    const comentario = this.comentarioInput.value || '';
    if (comentario.trim().length === 0) return;

    const tempId = -Date.now();
    const tempComment: NotificacionComentario = {
      id: tempId,
      comentario: comentario,
      creadoEn: new Date(),
      actualizadoEn: new Date(),
      usuario: {
        id: 0,
        nickname: 'Yo',
      } as any
    };
    this.pendingComments.push(tempComment);
    this.refresh$.next();
    this.comentarioInput.reset();

    const notificacionId = Number(this.route.snapshot.paramMap.get('id'));
    this.notificacionService.crearComentario(notificacionId, comentario).subscribe({
      next: () => {
        this.pendingComments = this.pendingComments.filter(c => c.id !== tempId);
        this.refresh$.next();
      },
      error: (err) => {
        console.error('Error enviando comentario', err);
        this.pendingComments = this.pendingComments.filter(c => c.id !== tempId);
        this.refresh$.next();
      }
    });
  }

  trackById(index: number, item: any): number {
    return item.id;
  }
}
