import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NotificacionService } from '../notificacion.service';
import { BehaviorSubject, Observable, combineLatest, merge, Subject, timer } from 'rxjs';
import { map, switchMap, debounceTime, startWith, takeUntil } from 'rxjs/operators';
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
  private readonly ruta = inject(ActivatedRoute);
  private readonly notificacionService = inject(NotificacionService);

  public comentarioInput = new FormControl('');
  private readonly refrescar$ = new BehaviorSubject<void>(undefined);
  private readonly mostrarTodos$ = new BehaviorSubject<boolean>(false);
  private readonly comentariosPendientes$ = new BehaviorSubject<NotificacionComentario[]>([]);
  private readonly destruir$ = new Subject<void>();

  public notificacionId$: Observable<number>;
  public usuariosConAcceso$: Observable<Usuario[]>;
  public fichasUsuarios$: Observable<Usuario[]>;
  public portadaData$: Observable<{ usuarios: Usuario[], conteoOcultos: number }>;
  public comentariosProcesados$: Observable<any[]>;
  public sugerenciasProcesadas$: Observable<any[]>;

  public mostrarSugerencias = false;

  ngOnInit() {
    this.notificacionId$ = this.ruta.paramMap.pipe(
      map(params => Number(params.get('id')))
    );

    this.usuariosConAcceso$ = this.notificacionId$.pipe(
      switchMap(id => this.notificacionService.usuariosConAcceso(id)),
      map(usuarios => usuarios.map(u => ({ ...u, avatarUrl: this.obtenerAvatar(u) })))
    );

    this.fichasUsuarios$ = combineLatest([this.usuariosConAcceso$, this.mostrarTodos$]).pipe(
      map(([usuarios, mostrarTodos]) => mostrarTodos ? usuarios : usuarios.slice(0, 5))
    );

    this.portadaData$ = this.usuariosConAcceso$.pipe(
      map(usuarios => ({
        usuarios: usuarios.slice(0, 5),
        conteoOcultos: Math.max(0, usuarios.length - 5)
      }))
    );

    const polling$ = timer(0, 3000).pipe(map(() => undefined));

    const servidor$ = combineLatest([
      this.notificacionId$,
      merge(this.refrescar$, polling$)
    ]).pipe(
      switchMap(([id]) => this.notificacionService.comentarios(id))
    );

    this.comentariosProcesados$ = combineLatest([
      servidor$,
      this.comentariosPendientes$
    ]).pipe(
      map(([servidor, pendientes]) => {
        const todos = [...servidor, ...pendientes];
        return todos.map(c => ({
          ...c,
          avatarUrl: this.obtenerAvatar(c.usuario),
          textoFormateado: this.formatearTexto(c.comentario)
        }));
      })
    );
    this.sugerenciasProcesadas$ = combineLatest([
      this.comentarioInput.valueChanges.pipe(startWith(''), debounceTime(100)),
      this.usuariosConAcceso$
    ]).pipe(
      map(([valor, usuarios]) => {
        const val = valor || '';
        const ultimoAt = val.lastIndexOf('@');
        if (ultimoAt !== -1) {
          const busqueda = val.substring(ultimoAt + 1).toLowerCase();
          if (!busqueda.includes(' ')) {
            const filtrados = usuarios.filter(u =>
              u.nickname?.toLowerCase().includes(busqueda) ||
              u.persona?.nombre?.toLowerCase().includes(busqueda)
            ).slice(0, 5);
            this.mostrarSugerencias = filtrados.length > 0;
            return filtrados;
          }
        }
        this.mostrarSugerencias = false;
        return [];
      })
    );
  }

  ngOnDestroy() {
    this.destruir$.next();
    this.destruir$.complete();
  }

  public alternarMostrarTodos() {
    this.mostrarTodos$.next(!this.mostrarTodos$.value);
  }

  public seleccionarUsuario(usuario: Usuario) {
    const valorActual = this.comentarioInput.value || '';
    const ultimoAt = valorActual.lastIndexOf('@');
    if (ultimoAt !== -1) {
      const prefijo = valorActual.substring(0, ultimoAt);
      const valorNuevo = `${prefijo}@${usuario.nickname} `;
      this.comentarioInput.setValue(valorNuevo);
      this.mostrarSugerencias = false;
      document.getElementById('commentInput')?.focus();
    }
  }

  public enviarComentario() {
    const texto = this.comentarioInput.value || '';
    if (texto.trim().length === 0) return;

    const idTemporal = -Date.now();
    const comentarioTemp: NotificacionComentario = {
      id: idTemporal,
      comentario: texto,
      creadoEn: new Date(),
      actualizadoEn: new Date(),
      usuario: { id: 0, nickname: 'Yo' } as any
    };
    this.comentariosPendientes$.next([...this.comentariosPendientes$.value, comentarioTemp]);
    this.comentarioInput.reset();

    const notificacionId = Number(this.ruta.snapshot.paramMap.get('id'));
    this.notificacionService.crearComentario(notificacionId, texto).subscribe({
      next: () => {
        this.limpiarPendiente(idTemporal);
        this.refrescar$.next();
      },
      error: (err) => {
        console.error('Error enviando comentario', err);
        this.limpiarPendiente(idTemporal);
      }
    });
  }

  private limpiarPendiente(id: number) {
    const restantes = this.comentariosPendientes$.value.filter(c => c.id !== id);
    this.comentariosPendientes$.next(restantes);
  }
  private obtenerAvatar(usuario: any): string {
    return usuario?.persona?.imagenes || `https://ui-avatars.com/api/?name=${usuario?.nickname}&background=random`;
  }

  private formatearTexto(texto: string): string {
    if (!texto) return '';
    let formateado = texto
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\n/g, '<br>');

    formateado = formateado.replace(
      /@([a-zA-Z0-9_]+)/g,
      '<span class="mention" style="color: var(--ion-color-primary); font-weight: bold;">@$1</span>'
    );
    return formateado;
  }

  public identificarPorId(indice: number, elemento: any): number {
    return elemento.id;
  }
}
