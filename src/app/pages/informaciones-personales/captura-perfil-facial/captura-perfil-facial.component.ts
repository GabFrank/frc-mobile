import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Input,
  OnInit,
  inject,
} from '@angular/core';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { ModalController } from '@ionic/angular';
import { CapturaFacial, FaceRecognitionService } from 'src/app/services/face-recognition.service';
import { NotificacionService } from 'src/app/services/notificacion.service';
import { UsuarioService } from 'src/app/services/usuario.service';
import { construirGaleriaDesdeCapturas, serializarGaleriaFacial } from 'src/app/services/embedding-galeria.util';
import { timeout, take } from 'rxjs/operators';

@Component({
  selector: 'app-captura-perfil-facial',
  templateUrl: './captura-perfil-facial.component.html',
  styleUrls: ['./captura-perfil-facial.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CapturaPerfilFacialComponent implements OnInit {
  @Input() usuarioId: number;

  private readonly modalController = inject(ModalController);
  private readonly faceRecognitionService = inject(FaceRecognitionService);
  private readonly usuarioService = inject(UsuarioService);
  private readonly notificacionService = inject(NotificacionService);
  private readonly cdr = inject(ChangeDetectorRef);

  paso = 1;
  capturas: CapturaFacial[] = [];
  procesando = false;
  previewUrl: string | null = null;
  instruccionActual = '';
  textoBoton = 'Capturar foto';

  readonly pasos = [1, 2, 3];

  private readonly instrucciones = [
    '',
    'Paso 1/3: Gire su rostro ligeramente a la IZQUIERDA',
    'Paso 2/3: Gire su rostro ligeramente a la DERECHA',
    'Paso 3/3: Mire de FRENTE a la cámara',
  ];

  ngOnInit(): void {
    this.faceRecognitionService.init();
    this.actualizarTextosPaso();
  }

  cerrar(): void {
    this.modalController.dismiss();
  }

  async capturar(): Promise<void> {
    if (this.procesando || !this.usuarioId) {
      return;
    }

    this.procesando = true;
    this.cdr.markForCheck();

    try {
      const image = await Camera.getPhoto({
        quality: 85,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera,
      });

      if (!image.dataUrl) {
        this.notificacionService.warn('No se pudo obtener la imagen.');
        return;
      }

      const imagenOptimizada = await this.faceRecognitionService.prepararImagen(image.dataUrl);
      const resultado = await this.faceRecognitionService.getDescriptorConScore(imagenOptimizada);
      if (!resultado) {
        this.notificacionService.warn('No se detectó rostro. Intente de nuevo con mejor luz.');
        return;
      }

      this.capturas = [
        ...this.capturas,
        {
          imageBase64: imagenOptimizada,
          embedding: resultado.embedding,
          score: resultado.score,
        },
      ];
      this.previewUrl = imagenOptimizada;

      if (this.paso < 3) {
        this.paso++;
        this.actualizarTextosPaso();
        return;
      }

      await this.guardarPerfil();
    } catch (error) {
      if ((error as { message?: string })?.message !== 'User cancelled photos app') {
        console.error('Error en captura de perfil facial:', error);
        this.notificacionService.danger('Error al capturar la foto.');
      }
    } finally {
      this.procesando = false;
      this.cdr.markForCheck();
    }
  }

  private actualizarTextosPaso(): void {
    this.instruccionActual = this.instrucciones[this.paso] ?? this.instrucciones[3];
    this.textoBoton = this.paso === 3 ? 'Capturar y guardar' : 'Capturar foto';
  }

  private async guardarPerfil(): Promise<void> {
    const galeria = construirGaleriaDesdeCapturas(this.capturas);
    if (!galeria) {
      this.notificacionService.warn('Las fotos no tienen calidad suficiente. Repita las 3 capturas.');
      this.reiniciarCapturas();
      return;
    }

    const fotoFrontal = this.capturas[this.capturas.length - 1].imageBase64;

    try {
      const observable = await this.usuarioService.onSaveUsuarioImage(
        this.usuarioId,
        'perfil',
        fotoFrontal,
        galeria.master,
        false,
        serializarGaleriaFacial(galeria)
      );

      const ok = await observable.pipe(timeout(60000), take(1)).toPromise();
      if (ok) {
        this.notificacionService.success('Foto de perfil actualizada correctamente');
        await this.modalController.dismiss({ actualizada: true, fotoFrontal });
      } else {
        this.notificacionService.danger('No se pudo guardar la foto de perfil.');
      }
    } catch (error) {
      console.error('Error al guardar perfil facial:', error);
      this.notificacionService.danger('No se pudo guardar la foto de perfil. Verifique su conexión.');
    }
  }

  private reiniciarCapturas(): void {
    this.paso = 1;
    this.capturas = [];
    this.previewUrl = null;
    this.actualizarTextosPaso();
    this.cdr.markForCheck();
  }
}
