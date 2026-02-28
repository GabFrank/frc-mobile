import { ChangeDetectionStrategy, Component, OnInit, inject, ChangeDetectorRef, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { MediaUploadService } from '../../../services/media-upload.service';
import { AudioRecordingService } from '../../../services/audio-recording.service';
import { ActivatedRoute } from '@angular/router';
import { NotificacionService } from '../notificacion.service';
import { BehaviorSubject, Observable, combineLatest, merge, Subject, timer } from 'rxjs';
import { map, switchMap, debounceTime, startWith, takeUntil, shareReplay } from 'rxjs/operators';
import { Usuario } from '../models/usuario.model';
import { NotificacionComentario } from '../models/notificacion-comentario.model';
import { FormControl } from '@angular/forms';

interface ComentarioProcesado extends NotificacionComentario {
  avatarUrl: string;
  textoFormateado: string;
  tipoMedia?: string;
  isPlaying?: boolean;
  audioProgress?: number;
  audioDuration?: string;
}

interface UsuarioProcesado extends Usuario {
  avatarUrl: string;
}

@Component({
  selector: 'app-comentarios',
  templateUrl: './comentarios.component.html',
  styleUrls: ['./comentarios.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ComentariosComponent implements OnInit, OnDestroy {
  private readonly ruta = inject(ActivatedRoute);
  private readonly notificacionService = inject(NotificacionService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly mediaUploadService = inject(MediaUploadService);
  private readonly audioRecordingService = inject(AudioRecordingService);

  @ViewChild('fileInput') fileInput?: ElementRef<HTMLInputElement>;
  @ViewChild('cameraInput') cameraInput?: ElementRef<HTMLInputElement>;

  public comentarioInput = new FormControl('');
  private readonly refrescar$ = new BehaviorSubject<void>(undefined);
  public selectedFile: File | null = null;
  public filePreview: string | null = null;
  public isUploading = false;
  public uploadProgress = 0;
  public enviando = false;

  readonly estadoGrabacion$ = this.audioRecordingService.estado$;
  readonly duracionFormateada$ = this.audioRecordingService.duracionFormateada$;
  private readonly mostrarTodos$ = new BehaviorSubject<boolean>(false);
  private readonly comentariosPendientes$ = new BehaviorSubject<NotificacionComentario[]>([]);
  private readonly destruir$ = new Subject<void>();

  public notificacionId$: Observable<number>;
  public usuariosConAcceso$: Observable<UsuarioProcesado[]>;
  public fichasUsuarios$: Observable<UsuarioProcesado[]>;
  public portadaData$: Observable<{ usuarios: UsuarioProcesado[], conteoOcultos: number }>;
  public comentariosProcesados$: Observable<ComentarioProcesado[]>;
  public sugerenciasProcesadas$: Observable<UsuarioProcesado[] | null>;
  private readonly comentarioParaResponder$ = new BehaviorSubject<ComentarioProcesado | null>(null);
  public respuestaActiva$ = this.comentarioParaResponder$.asObservable();
  private idComentarioScrolleado: string | null = null;

  ngOnInit() {
    this.notificacionId$ = this.ruta.paramMap.pipe(
      map(params => Number(params.get('id')))
    );

    this.usuariosConAcceso$ = this.notificacionId$.pipe(
      switchMap(id => this.notificacionService.usuariosConAcceso(id)),
      map(usuarios => usuarios.map(u => ({ ...u, avatarUrl: this.obtenerAvatar(u) }))),
      shareReplay(1)
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
          textoFormateado: this.formatearTexto(c.comentario),
          tipoMedia: this.obtenerTipoMedia(c.mediaUrl)
        }));
      })
    );
    this.sugerenciasProcesadas$ = combineLatest([
      this.comentarioInput.valueChanges.pipe(startWith(''), debounceTime(100)),
      this.usuariosConAcceso$.pipe(startWith([]))
    ]).pipe(
      map(([valor, usuarios]) => {
        const texto = (valor || '').toString();
        const ultimoAt = texto.lastIndexOf('@');

        if (ultimoAt !== -1) {
          const busqueda = texto.substring(ultimoAt + 1).toLowerCase();
          if (!busqueda.includes(' ')) {
            const filtrados = usuarios.filter(u =>
              u.nickname?.toLowerCase().includes(busqueda) ||
              u.persona?.nombre?.toLowerCase().includes(busqueda)
            ).slice(0, 5);
            return filtrados.length > 0 ? filtrados : null;
          }
        }
        return null;
      })
    );
    this.comentariosProcesados$.pipe(
      takeUntil(this.destruir$),
    ).subscribe((comentarios) => {
      const comentarioId = this.ruta.snapshot.queryParamMap.get('comentarioId');
      if (comentarioId && this.idComentarioScrolleado !== comentarioId && comentarios.length > 0) {
        setTimeout(() => {
          const elemento = document.getElementById(`comentario-${comentarioId}`);
          if (elemento) {
            this.idComentarioScrolleado = comentarioId;
            elemento.scrollIntoView({ behavior: 'smooth', block: 'center' });
            elemento.classList.add('highlight-comment');
            setTimeout(() => elemento.classList.remove('highlight-comment'), 3000);
          }
        }, 500);
      }
    });
  }

  ngOnDestroy() {
    this.audioRecordingService.destruir();
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
      document.getElementById('commentInput')?.focus();
    }
  }

  public responderAComentario(comentario: ComentarioProcesado) {
    this.comentarioParaResponder$.next(comentario);

    const valorActual = this.comentarioInput.value || '';
    const mencion = `@${comentario.usuario.nickname} `;

    if (!valorActual.includes(mencion)) {
      this.comentarioInput.setValue(mencion + valorActual);
    }

    this.cdr.markForCheck();
    setTimeout(() => {
      const input = document.getElementById('commentInput');
      if (input) input.focus();
    }, 100);
  }

  public cancelarRespuesta() {
    this.comentarioParaResponder$.next(null);
    this.cdr.markForCheck();
  }

  public enviarComentario() {
    const texto = this.comentarioInput.value || '';
    const estadoGrabacion = this.audioRecordingService.obtenerEstadoActual();

    if ((texto.trim().length === 0 && !this.selectedFile && !estadoGrabacion.audioGrabado) || this.enviando || this.isUploading) return;

    this.enviando = true;
    this.cdr.markForCheck();

    if (this.selectedFile) {
      this.subirMediaYEnviar(this.selectedFile, texto);
    } else if (estadoGrabacion.audioGrabado) {
      const audioFile = new File([estadoGrabacion.audioGrabado], `audio_${Date.now()}.webm`, { type: 'audio/webm' });
      this.subirMediaYEnviar(audioFile, 'Mensaje de voz');
    } else {
      this.procesarEnvio(texto);
    }
  }

  private subirMediaYEnviar(archivo: File, texto: string) {
    this.isUploading = true;
    this.uploadProgress = 0;
    this.cdr.markForCheck();

    this.mediaUploadService.subirArchivo(archivo).subscribe({
      next: (url) => {
        this.isUploading = false;
        this.procesarEnvio(texto, url);
      },
      error: (err) => {
        console.error('Error subiendo archivo', err);
        this.isUploading = false;
        this.enviando = false;
        this.cdr.markForCheck();
      }
    });

    this.mediaUploadService.progreso$.pipe(takeUntil(this.destruir$)).subscribe(p => {
      this.uploadProgress = p.progreso;
      this.cdr.markForCheck();
    });
  }

  private procesarEnvio(texto: string, mediaUrl?: string) {
    const comentarioFinal = texto || (mediaUrl ? 'Archivo adjunto' : '');
    const padre = this.comentarioParaResponder$.value;
    const idTemporal = -Date.now();

    const comentarioTemp: NotificacionComentario = {
      id: idTemporal,
      comentario: comentarioFinal,
      creadoEn: new Date(),
      actualizadoEn: new Date(),
      usuario: { id: 0, nickname: 'Yo' } as any,
      comentarioPadre: padre || undefined,
      mediaUrl: mediaUrl
    };

    this.comentariosPendientes$.next([...this.comentariosPendientes$.value, comentarioTemp]);
    this.comentarioInput.reset();
    this.cancelarRespuesta();
    this.removeFile();
    this.audioRecordingService.eliminarAudioGrabado();
    this.enviando = false;
    this.cdr.markForCheck();

    const notificacionId = Number(this.ruta.snapshot.paramMap.get('id'));
    this.notificacionService.crearComentario(notificacionId, comentarioFinal, padre?.id, mediaUrl).subscribe({
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

  triggerFileInput(): void {
    this.fileInput?.nativeElement.click();
  }

  triggerCamera(): void {
    this.cameraInput?.nativeElement.click();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        this.filePreview = reader.result as string;
        this.cdr.markForCheck();
      };
      reader.readAsDataURL(this.selectedFile);
    }
  }

  removeFile(): void {
    this.selectedFile = null;
    this.filePreview = null;
    if (this.fileInput) this.fileInput.nativeElement.value = '';
    if (this.cameraInput) this.cameraInput.nativeElement.value = '';
    this.cdr.markForCheck();
  }

  async startRecording(): Promise<void> {
    await this.audioRecordingService.iniciarGrabacion();
    this.cdr.markForCheck();
  }

  stopRecording(): void {
    this.audioRecordingService.detenerGrabacion();
    this.cdr.markForCheck();
  }

  cancelRecording(): void {
    this.audioRecordingService.cancelarGrabacion();
    this.cdr.markForCheck();
  }

  removeRecordedAudio(): void {
    this.audioRecordingService.eliminarAudioGrabado();
    this.cdr.markForCheck();
  }


  private limpiarPendiente(id: number) {
    const restantes = this.comentariosPendientes$.value.filter(c => c.id !== id);
    this.comentariosPendientes$.next(restantes);
  }
  private obtenerAvatar(usuario: any): string {
    return usuario?.persona?.imagenes || `https://ui-avatars.com/api/?name=${usuario?.nickname}&background=random`;
  }

  private obtenerTipoMedia(url?: string): string {
    if (!url) return '';
    const ext = url.split('.').pop()?.toLowerCase().split('?')[0] || '';
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return 'imagen';
    if (['mp4', 'mov', 'avi'].includes(ext)) return 'video';
    if (['mp3', 'wav', 'm4a', 'ogg', 'webm'].includes(ext)) return 'audio';
    if (['pdf'].includes(ext)) return 'pdf';
    return 'archivo';
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

  private audioActual: HTMLAudioElement | null = null;
  private comentarioActual: ComentarioProcesado | null = null;

  toggleAudio(event: Event, c: ComentarioProcesado): void {
    event.stopPropagation();
    const audio = (event.target as HTMLElement).closest('.whatsapp-audio')?.querySelector('audio') as HTMLAudioElement;
    if (!audio) return;
    if (this.audioActual && this.audioActual !== audio) {
      this.audioActual.pause();
      if (this.comentarioActual) this.comentarioActual.isPlaying = false;
    }
    if (audio.paused) {
      audio.play(); c.isPlaying = true;
      this.audioActual = audio; this.comentarioActual = c;
    } else {
      audio.pause(); c.isPlaying = false;
    }
    this.cdr.markForCheck();
  }

  onAudioTime(e: Event, c: ComentarioProcesado): void {
    const a = e.target as HTMLAudioElement;
    if (a.duration) {
      c.audioProgress = (a.currentTime / a.duration) * 100;
      c.audioDuration = this.formatTime(a.duration - a.currentTime);
      this.cdr.markForCheck();
    }
  }

  onAudioLoad(e: Event, c: ComentarioProcesado): void {
    c.audioDuration = this.formatTime((e.target as HTMLAudioElement).duration);
    this.cdr.markForCheck();
  }

  onAudioEnd(c: ComentarioProcesado): void {
    c.isPlaying = false; c.audioProgress = 0;
    this.audioActual = null; this.comentarioActual = null;
    this.cdr.markForCheck();
  }

  private formatTime(s: number): string {
    if (!s || isNaN(s)) return '0:00';
    return `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, '0')}`;
  }
}
