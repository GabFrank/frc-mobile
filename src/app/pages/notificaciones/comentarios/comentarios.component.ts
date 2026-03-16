import { ChangeDetectionStrategy, Component, OnInit, inject, ChangeDetectorRef, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { MediaUploadService } from '../../../services/media-upload.service';
import { AudioRecordingService } from '../../../services/audio-recording.service';
import { ActivatedRoute } from '@angular/router';
import { NotificacionService } from '../notificacion.service';
import { BehaviorSubject, Observable, combineLatest, merge, Subject, timer } from 'rxjs';
import { map, switchMap, debounceTime, startWith, takeUntil, shareReplay } from 'rxjs/operators';
import { Usuario } from '../models/usuario.model';
import { NotificacionComentario } from '../models/notificacion-comentario.model';
import { UsuarioService } from '../../../services/usuario.service';
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
  private readonly usuarioService = inject(UsuarioService);

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
  private avatarCache = new Map<number, string>();

  ngOnInit() {
    this.notificacionId$ = this.ruta.paramMap.pipe(
      map(params => Number(params.get('id')))
    );

    this.usuariosConAcceso$ = this.notificacionId$.pipe(
      switchMap(id => this.notificacionService.usuariosConAcceso(id)),
      switchMap(async usuarios => {
        const result: UsuarioProcesado[] = [];
        for (const u of usuarios) {
          result.push({ ...u, avatarUrl: await this.obtenerAvatarAsync(u) });
        }
        return result;
      }),
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
      switchMap(async ([servidor, pendientes]) => {
        const todos = [...servidor, ...pendientes];
        const result: ComentarioProcesado[] = [];
        for (const c of todos) {
          result.push({
            ...c,
            avatarUrl: await this.obtenerAvatarAsync(c.usuario),
            textoFormateado: this.formatearTexto(c.comentario),
            tipoMedia: this.obtenerTipoMedia(c.mediaUrl)
          });
        }
        return result;
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
    // Detener cualquier audio en reproducción
    if (this.audioActual) {
      this.audioActual.pause();
      this.audioActual.currentTime = 0;
      this.audioActual = null;
    }
    if (this.comentarioActual) {
      this.comentarioActual.isPlaying = false;
      this.comentarioActual = null;
    }
    // Resetear el servicio sin destruir los subjects (es singleton)
    this.audioRecordingService.resetear();
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
      const mimetype = estadoGrabacion.audioGrabado.type || 'audio/webm';
      const extension = mimetype.includes('mp4') ? 'm4a' : 'webm';
      const audioFile = new File([estadoGrabacion.audioGrabado], `audio_${Date.now()}.${extension}`, { type: mimetype });
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
        this.procesarEnvio(texto, url);
      },
      error: (err) => {
        console.error('Error subiendo archivo', err);
        this.isUploading = false;
        this.enviando = false;
        this.cdr.markForCheck();
      }
    });

    const sub = this.mediaUploadService.progreso$.pipe(takeUntil(this.destruir$)).subscribe(p => {
      this.uploadProgress = p.progreso;
      this.cdr.markForCheck();
      if (p.estado === 'completado' || p.estado === 'error' || p.estado === 'inactivo') {
        if (p.progreso === 100 || p.estado === 'error') {
          this.isUploading = false;
          this.cdr.markForCheck();
        }
        setTimeout(() => sub.unsubscribe(), 500);
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
    try {
      if (this.audioActual) {
        this.audioActual.pause();
        this.audioActual.currentTime = 0;
        if (this.comentarioActual) this.comentarioActual.isPlaying = false;
        this.audioActual = null;
        this.comentarioActual = null;
      }

      document.querySelectorAll('audio').forEach(a => {
        a.pause();
        a.currentTime = 0;
      });
      await new Promise(r => setTimeout(r, 200));

      await this.audioRecordingService.iniciarGrabacion();
      this.cdr.markForCheck();
    } catch (error) {
      alert('No se pudo iniciar la grabación. Verifique los permisos de micrófono. ' + (error?.toString() || ''));
      console.error('Error startRecording:', error);
    }
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

  private procesarEnvio(texto: string, mediaUrl?: string) {
    this.isUploading = false;
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

  private limpiarPendiente(id: number) {
    const restantes = this.comentariosPendientes$.value.filter(c => c.id !== id);
    this.comentariosPendientes$.next(restantes);
  }

  private async obtenerAvatarAsync(usuario: any): Promise<string> {
    const avatarStr = usuario?.persona?.imagenes;
    if (avatarStr && avatarStr.trim().length > 0) {
      if (avatarStr.startsWith('http') || avatarStr.startsWith('data:')) return avatarStr;

      if (this.avatarCache.has(usuario.id)) {
        return this.avatarCache.get(usuario.id)!;
      }

      try {
        const obs = await this.usuarioService.onGetUsuarioImages(usuario.id, 'perfil');
        return new Promise<string>(resolve => {
          const sub = obs.subscribe((imgs: string[]) => {
            if (imgs && imgs.length > 0) {
              const url = imgs[0];
              this.avatarCache.set(usuario.id, url);
              resolve(url);
            } else {
              const dec = `https://ui-avatars.com/api/?name=${usuario?.nickname}&background=random`;
              this.avatarCache.set(usuario.id, dec);
              resolve(dec);
            }
            if (sub) sub.unsubscribe();
          });
        });
      } catch (e) {
        return `https://ui-avatars.com/api/?name=${usuario?.nickname}&background=random`;
      }
    }
    return `https://ui-avatars.com/api/?name=${usuario?.nickname}&background=random`;
  }

  private obtenerTipoMedia(url?: string): string {
    if (!url) return '';
    const ext = url.split('.').pop()?.toLowerCase().split('?')[0] || '';
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return 'imagen';
    if (['mp4', 'mov', 'avi'].includes(ext)) return 'video';
    if (['mp3', 'wav', 'm4a', 'ogg', 'webm', 'aac'].includes(ext)) return 'audio';
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
    event.preventDefault();
    const audio = (event.target as HTMLElement).closest('.whatsapp-audio')?.querySelector('audio') as HTMLAudioElement;
    if (!audio) return;

    // Si hay otro audio sonando, detenerlo completamente
    if (this.audioActual && this.audioActual !== audio) {
      this.audioActual.pause();
      this.audioActual.currentTime = 0;
      if (this.comentarioActual) {
        this.comentarioActual.isPlaying = false;
        this.comentarioActual.audioProgress = 0;
      }
      this.audioActual = null;
      this.comentarioActual = null;
    }

    if (audio.paused) {
      // Asegurar que empiece desde el inicio si ya terminó
      if (audio.ended) {
        audio.currentTime = 0;
      }
      audio.play().catch(e => console.error('Error reproduciendo audio', e));
      c.isPlaying = true;
      this.audioActual = audio;
      this.comentarioActual = c;
    } else {
      audio.pause();
      c.isPlaying = false;
    }
    this.cdr.markForCheck();
  }

  onAudioTime(e: Event, c: ComentarioProcesado): void {
    const a = e.target as HTMLAudioElement;
    if (a.duration && a.duration !== Infinity && !isNaN(a.duration)) {
      c.audioProgress = (a.currentTime / a.duration) * 100;
      c.audioDuration = this.formatTime(a.duration - a.currentTime);
    } else {
      // Si la duración falla, mostramos el tiempo progresivo de reproducción (común webm)
      c.audioProgress = 50;
      c.audioDuration = this.formatTime(a.currentTime);
    }

    // Auto-fix: a veces webm no lanza "ended" apropiadamente en moviles al finalizar
    if (a.currentTime > 0 && Math.abs(a.duration - a.currentTime) < 0.2) {
      this.onAudioEnd(c);
      a.pause();
      a.currentTime = 0;
    }

    this.cdr.markForCheck();
  }

  onAudioLoad(e: Event, c: ComentarioProcesado): void {
    const a = e.target as HTMLAudioElement;
    if (a.duration && a.duration !== Infinity && !isNaN(a.duration)) {
      c.audioDuration = this.formatTime(a.duration);
    } else {
      c.audioDuration = '0:00';
    }
    this.cdr.markForCheck();
  }

  onAudioEnd(c: ComentarioProcesado): void {
    c.isPlaying = false;
    c.audioProgress = 0;
    if (this.audioActual) {
      this.audioActual.pause();
      this.audioActual.currentTime = 0;
    }
    this.audioActual = null;
    this.comentarioActual = null;
    this.cdr.markForCheck();
  }

  private formatTime(s: number): string {
    if (!s || isNaN(s) || s === Infinity) return '0:00';
    return `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, '0')}`;
  }
}
