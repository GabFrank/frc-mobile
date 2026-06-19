import { Component, OnDestroy, OnInit } from '@angular/core';
import { Location } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { UsuarioService } from 'src/app/services/usuario.service';
import { NotificacionService } from 'src/app/services/notificacion.service';
import { ReconocimientoFacialHelperService } from 'src/app/services/reconocimiento-facial-helper.service';
import { CamaraService } from 'src/app/services/camara.service';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Usuario } from 'src/app/domains/personas/usuario.model';

type ModoIngreso = 'id' | 'camara';

@UntilDestroy()
@Component({
  selector: 'app-ingreso-persona',
  templateUrl: './ingreso-persona.component.html',
  styleUrls: ['./ingreso-persona.component.scss']
})
export class IngresoPersonaComponent implements OnInit, OnDestroy {

  personaIdInput = '';
  sucursalId: number;
  isLoading = false;
  modo: ModoIngreso = 'id';

  cameraActive = false;
  videoElement: HTMLVideoElement | null = null;
  searchMessage = 'Mire a la cámara para identificarse';
  similarityPercent: number | null = null;

  private hitsConsecutivos = 0;
  private busquedaApiEnCurso = false;
  private ultimaBusquedaApi = 0;

  private busquedaLoopActivo = false;
  private busquedaProcesandoFrame = false;
  private busquedaLoopTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly INTERVALO_LOOP_MS = 400;
  private readonly INTERVALO_MIN_API_MS = 700;
  private readonly HITS_PARA_CONFIRMAR = 2;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private location: Location,
    private usuarioService: UsuarioService,
    private notificacionService: NotificacionService,
    private faceHelper: ReconocimientoFacialHelperService,
    private camaraService: CamaraService
  ) { }

  ngOnInit() {
    this.route.paramMap.pipe(untilDestroyed(this)).subscribe(res => {
      const sucId = res.get('sucId');
      if (sucId) {
        this.sucursalId = +sucId;
      }
    });
  }

  ionViewWillEnter() {
    this.personaIdInput = '';
    this.isLoading = false;
    if (this.modo === 'camara') {
      void this.iniciarBusquedaCamara();
    }
  }

  ionViewWillLeave() {
    this.detenerCamara();
  }

  ngOnDestroy() {
    this.detenerCamara();
  }

  onModoChange(modo: ModoIngreso | string) {
    const nuevoModo = modo as ModoIngreso;
    if (this.modo === nuevoModo) {
      return;
    }
    this.detenerCamara();
    this.modo = nuevoModo;
    this.hitsConsecutivos = 0;
    this.similarityPercent = null;
    if (modo === 'camara') {
      void this.iniciarBusquedaCamara();
    }
  }

  onSiguiente() {
    if (this.isLoading) return;
    if (!this.personaIdInput) {
      this.notificacionService.warn('Debe ingresar un ID de persona');
      return;
    }

    this.isLoading = true;
    this.usuarioService.onGetUsuarioPorPersonaId(+this.personaIdInput).pipe(untilDestroyed(this)).subscribe({
      next: (usuario: Usuario) => {
        this.isLoading = false;
        if (usuario?.id) {
          this.navegarConUsuario(usuario.id);
        } else {
          this.notificacionService.danger('No se encontró un usuario para el ID de persona ingresado');
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.notificacionService.danger('Error al buscar el usuario');
        console.error(err);
      }
    });
  }

  private async iniciarBusquedaCamara(): Promise<void> {
    this.detenerBusquedaContinua();
    this.isLoading = true;
    this.searchMessage = 'Cargando modelos de reconocimiento...';
    try {
      await this.faceHelper.inicializarMotorFacial();
      this.videoElement = await this.esperarVideoElement();
      if (!this.videoElement) {
        throw new Error('No se encontró el elemento de video');
      }

      const stream = await this.camaraService.iniciarCamara();
      this.videoElement.srcObject = stream;
      this.videoElement.muted = true;
      this.videoElement.playsInline = true;
      await this.videoElement.play();
      await this.esperarVideoListo(this.videoElement);
      this.cameraActive = true;
      this.busquedaLoopActivo = true;
      this.searchMessage = 'Mire a la cámara para identificarse';
      this.isLoading = false;
      void this.bucleBusquedaContinua();
    } catch (err) {
      console.error('Error al iniciar cámara de búsqueda:', err);
      this.isLoading = false;
      this.notificacionService.danger('No se pudo acceder a la cámara.');
      this.modo = 'id';
    }
  }

  private detenerBusquedaContinua(): void {
    this.busquedaLoopActivo = false;
    this.busquedaApiEnCurso = false;
    this.hitsConsecutivos = 0;
    if (this.busquedaLoopTimer) {
      clearTimeout(this.busquedaLoopTimer);
      this.busquedaLoopTimer = null;
    }
  }

  private async bucleBusquedaContinua(): Promise<void> {
    if (!this.busquedaLoopActivo || !this.videoElement || this.modo !== 'camara') {
      return;
    }

    const video = this.videoElement;
    if (video.paused || video.ended) {
      this.busquedaLoopTimer = setTimeout(() => this.bucleBusquedaContinua(), 100);
      return;
    }

    const ahora = Date.now();
    if (!this.busquedaApiEnCurso && !this.busquedaProcesandoFrame && ahora - this.ultimaBusquedaApi >= this.INTERVALO_MIN_API_MS) {
      this.busquedaProcesandoFrame = true;
      try {
        const evaluacion = await this.faceHelper.evaluarFrameBusqueda(video);
        this.searchMessage = evaluacion.mensaje;

        if (!evaluacion.rostroDetectado) {
          this.hitsConsecutivos = 0;
          this.similarityPercent = null;
        } else if (!evaluacion.embedding) {
          this.hitsConsecutivos = 0;
          this.similarityPercent = null;
        } else {
          this.busquedaApiEnCurso = true;
          this.searchMessage = 'Buscando coincidencia...';

          const resultado = await this.faceHelper.buscarYValidarUsuario(evaluacion.embedding);
          this.ultimaBusquedaApi = Date.now();
          this.busquedaApiEnCurso = false;

          if (resultado) {
            const pct = Math.round(resultado.similitudBackend * 100);
            this.similarityPercent = pct;

            if (resultado.confiable) {
              this.hitsConsecutivos++;
              this.searchMessage = `Identificando... ${resultado.usuario.persona?.nombre} (${pct}%)`;

              if (this.hitsConsecutivos >= this.HITS_PARA_CONFIRMAR) {
                this.detenerBusquedaContinua();
                this.detenerCamara();
                this.navegarConUsuario(+resultado.usuario.id);
                return;
              }
            } else {
              this.hitsConsecutivos = 0;
              this.searchMessage = `Sin coincidencia (${pct}%). ¿Está enrolado en el sistema?`;
            }
          } else {
            this.hitsConsecutivos = 0;
            this.similarityPercent = null;
            this.searchMessage = 'Rostro detectado. No hay usuarios enrolados en el servidor.';
          }
        }
      } catch (e) {
        console.error('Error en búsqueda continua:', e);
        this.busquedaApiEnCurso = false;
        this.hitsConsecutivos = 0;
        this.similarityPercent = null;
        this.searchMessage = 'Error en la búsqueda. Reintentando...';
      } finally {
        this.busquedaProcesandoFrame = false;
      }
    }

    if (this.busquedaLoopActivo) {
      this.busquedaLoopTimer = setTimeout(() => this.bucleBusquedaContinua(), this.INTERVALO_LOOP_MS);
    }
  }

  private navegarConUsuario(usuarioId: number) {
    this.router.navigate(['/marcacion'], {
      queryParams: { usuarioId },
      queryParamsHandling: 'merge'
    });
  }

  detenerCamara() {
    this.detenerBusquedaContinua();
    this.cameraActive = false;
    this.camaraService.detenerCamara(this.videoElement);
  }

  onBack() {
    this.detenerCamara();
    this.location.back();
  }

  private async esperarVideoElement(maxAttempts = 15): Promise<HTMLVideoElement | null> {
    for (let i = 0; i < maxAttempts; i++) {
      const video = document.getElementById('ingreso-camera-feed') as HTMLVideoElement | null;
      if (video) {
        return video;
      }
      await new Promise(resolve => requestAnimationFrame(() => resolve(null)));
    }
    return null;
  }

  private esperarVideoListo(video: HTMLVideoElement): Promise<void> {
    if (video.readyState >= 2 && video.videoWidth > 0) {
      return Promise.resolve();
    }
    return new Promise((resolve) => {
      const onReady = () => {
        video.removeEventListener('loadeddata', onReady);
        resolve();
      };
      video.addEventListener('loadeddata', onReady, { once: true });
    });
  }
}
