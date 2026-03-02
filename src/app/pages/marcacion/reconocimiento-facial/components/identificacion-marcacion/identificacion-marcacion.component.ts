import { Location } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { SucursalService } from 'src/app/domains/empresarial/sucursal/sucursal.service';
import { DialogoService } from 'src/app/services/dialogo.service';
import { GeoLocationService } from 'src/app/services/geo-location.service';
import { MainService } from 'src/app/services/main.service';
import { UsuarioService } from 'src/app/services/usuario.service';
import { FaceRecognitionService } from 'src/app/services/face-recognition.service';
import { MarcacionService } from '../../../marcar-horario/service/marcacion.service';
import { Marcacion, MarcacionInput, TipoMarcacion, Jornada } from '../../../marcar-horario/models/marcacion.model';
import { Result } from '@vladmandic/human';

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-identificacion-marcacion',
  templateUrl: './identificacion-marcacion.component.html',
  styleUrls: ['./identificacion-marcacion.component.scss']
})
export class IdentificacionMarcacionComponent implements OnInit, OnDestroy {
  cantidadImagenes = 3;
  userImageList: string[];
  sucursalId: number;
  tipo: TipoMarcacion = TipoMarcacion.ENTRADA;
  esSalidaAlmuerzo = false;
  jornadaActual: Jornada | null = null;
  isLoading = false;
  detection: Result | null = null;
  cameraActive = false;
  videoElement: HTMLVideoElement;

  constructor(
    private usuarioService: UsuarioService,
    private route: ActivatedRoute,
    private mainService: MainService,
    private location: Location,
    private dialog: DialogoService,
    private faceRecognitionService: FaceRecognitionService,
    private marcacionService: MarcacionService,
    private geoLocation: GeoLocationService,
    private router: Router
  ) { }

  async ngOnInit(): Promise<void> {
    this.route.paramMap.pipe(untilDestroyed(this)).subscribe(async (res) => {
      this.sucursalId = +res.get('sucId');
      // Obtener el tipo de marcación de los parámetros de consulta o estado
      this.tipo = (this.route.snapshot.queryParamMap.get('tipo') as TipoMarcacion) || TipoMarcacion.ENTRADA;
      this.esSalidaAlmuerzo = this.route.snapshot.queryParamMap.get('esSalidaAlmuerzo') === 'true';
      this.verificarMarcacionActiva();
    });

    await this.faceRecognitionService.init();

    setTimeout(async () => {
      (
        await this.usuarioService.getIsUserFaceAuth(
          this.mainService.usuarioActual.id
        )
      ).subscribe(async (res) => {
        if (res != null) {
          this.cantidadImagenes = res;
          if (this.cantidadImagenes < 3) {
            (
              await this.usuarioService.onGetUsuarioImages(
                this.mainService.usuarioActual.id,
                'auth'
              )
            ).subscribe((userImageList) => {
              this.userImageList = [...userImageList];
            });
          } else {
            // Si ya tiene las imágenes registradas, activamos la cámara para verificación
            this.startCamera();
          }
        }
      });
    }, 500);
  }

  async verificarMarcacionActiva() {
    const hoy = new Date();
    const inicio = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate()).toISOString();
    const fin = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), 23, 59, 59).toISOString();

    (await this.marcacionService.onGetJornadasPorUsuario(this.mainService.usuarioActual.id, inicio, fin))
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (jornadas) => {
          if (jornadas && jornadas.length > 0) {
            this.jornadaActual = [...jornadas].sort((a, b) => a.id - b.id)[jornadas.length - 1];
          }
        },
        error: (err) => console.error('Error al verificar jornada', err)
      });
  }

  async startCamera() {
    this.cameraActive = true;
    setTimeout(() => {
      this.videoElement = document.getElementById('camera-feed') as HTMLVideoElement;
      if (this.videoElement) {
        navigator.mediaDevices
          .getUserMedia({ video: { facingMode: 'user' } })
          .then((stream) => {
            this.videoElement.srcObject = stream;
            this.videoElement.play();
            this.detectFace();
          })
          .catch((err) => {
            console.error('Error al acceder a la cámara:', err);
            this.dialog.open('Error', 'No se pudo acceder a la cámara.');
          });
      }
    }, 100);
  }

  async detectFace() {
    if (!this.cameraActive || !this.videoElement) return;

    try {
      const result = await this.faceRecognitionService.detect(this.videoElement);
      this.detection = result;

      if (result.face && result.face.length > 0 && result.face[0].score > 0.6) {
      }
    } catch (e) {
      console.error('Error en detección:', e);
    }

    if (this.cameraActive) {
      requestAnimationFrame(() => this.detectFace());
    }
  }

  async onMarcar() {
    if (!this.validarMarcacion()) return;

    this.isLoading = true;
    try {
      const embedding = this.detection.face[0].embedding as unknown as number[];
      const location = await this.geoLocation.getCurrentLocation();

      const input: MarcacionInput = {
        usuarioId: this.mainService.usuarioActual.id,
        tipo: this.tipo,
        sucursalId: this.sucursalId,
        embedding: embedding,
        latitud: location.latitude,
        longitud: location.longitude,
        precisionGps: location.accuracy,
        distanciaSucursalMetros: 0,
        esSalidaAlmuerzo: this.esSalidaAlmuerzo
      };

      (await this.marcacionService.onSaveMarcacion(input)).subscribe({
        next: (res) => {
          this.isLoading = false;
          this.stopCamera();
          this.dialog.open('Éxito', 'Marcación realizada correctamente.').then(() => {
            this.router.navigate(['/home']);
          });
        },
        error: (err) => {
          this.isLoading = false;
          console.error('Error al marcar:', err);
          this.dialog.open('Error', 'Error al realizar la marcación: ' + (err.message || 'Error desconocido'));
        }
      });

    } catch (e) {
      this.isLoading = false;
      this.dialog.open('Error', 'Error obteniendo ubicación o procesando marcación.');
    }
  }

  validarMarcacion(): boolean {
    if (!this.detection || !this.detection.face || this.detection.face.length === 0) {
      this.dialog.open('Atención', 'No se detectó ningún rostro. Por favor, asegúrese de estar frente a la cámara.');
      return false;
    }

    if (this.tipo === TipoMarcacion.SALIDA) {
      if (!this.jornadaActual || !this.jornadaActual.marcacionEntrada) {
        this.dialog.open('Atención', 'No puede registrar una salida sin haber registrado una entrada.');
        return false;
      }
      if (this.jornadaActual.marcacionSalida) {
        this.dialog.open('Atención', 'Ya ha registrado su salida definitiva del día.');
        return false;
      }
      if (this.esSalidaAlmuerzo && this.jornadaActual.marcacionSalidaAlmuerzo) {
        this.dialog.open('Atención', 'Ya ha registrado su salida al almuerzo.');
        return false;
      }
    } else if (this.tipo === TipoMarcacion.ENTRADA) {
      if (this.jornadaActual) {
        if (this.jornadaActual.marcacionSalida) {
          this.dialog.open('Atención', 'Ya ha registrado su salida definitiva del día.');
          return false;
        }
        if (this.jornadaActual.marcacionEntrada && !this.jornadaActual.marcacionSalidaAlmuerzo) {
          this.dialog.open('Atención', 'Ya tiene una entrada activa.');
          return false;
        }
        if (this.jornadaActual.marcacionEntradaAlmuerzo) {
          this.dialog.open('Atención', 'Ya ha registrado su retorno del almuerzo.');
          return false;
        }
      }
    }

    return true;
  }

  stopCamera() {
    this.cameraActive = false;
    if (this.videoElement && this.videoElement.srcObject) {
      const tracks = (this.videoElement.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
    }
  }

  onBack() {
    this.stopCamera();
    this.location.back();
  }

  ngOnDestroy() {
    this.stopCamera();
  }

  async onFileChange(event) {
    if (event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0];
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        let base64String: string = reader.result as string;
        (
          await this.usuarioService.onSaveUsuarioImage(
            this.mainService.usuarioActual.id,
            'auth',
            base64String
          )
        ).subscribe((res) => {
          console.log(res);
        });
      };
    }
  }

  deleteImage(index: number) {
    this.dialog
      .open('Atención!!', 'Estas seguro que queres eliminar esta imagen?', true)
      .then((res) => {
        if (res?.role == 'aceptar') {
          this.userImageList.splice(index, 1);
        }
      });
  }

  onCargarImagen() { }
}
