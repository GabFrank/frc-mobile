import { Component, OnInit } from '@angular/core';
import { UntypedFormControl, Validators } from '@angular/forms';
import { ActionSheetController, NavController } from '@ionic/angular';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { MainService } from 'src/app/services/main.service';
import { Usuario } from 'src/app/domains/personas/usuario.model';
import { UsuarioService } from 'src/app/services/usuario.service';
import { FaceRecognitionService } from 'src/app/services/face-recognition.service';

@Component({
  selector: 'app-informaciones-personales-dashboard',
  templateUrl: './informaciones-personales-dashboard.component.html',
  styleUrls: ['./informaciones-personales-dashboard.component.scss'],
})
export class InformacionesPersonalesDashboardComponent implements OnInit {
  src = "";
  fullNameControl = new UntypedFormControl('', [Validators.required]);
  emailControl = new UntypedFormControl('', [Validators.email]);
  phoneControl = new UntypedFormControl('', [
    Validators.required,
    Validators.pattern(/^\d{4}-?\d{3}-?\d{3}$/),
  ]);
  birthDateControl = new UntypedFormControl('', [Validators.required]);
  selectedUsuario: Usuario;

  constructor(
    private navCtrl: NavController,
    private actionSheetController: ActionSheetController,
    private mainService: MainService,
    private usuarioService: UsuarioService,
    private faceRecognitionService: FaceRecognitionService
  ) { }

  ngOnInit() {
    this.faceRecognitionService.init();
    if (this.mainService.usuarioActual != null) {
      (this.usuarioService.onGetUsuario(this.mainService.usuarioActual.id)).subscribe(async res => {
        this.selectedUsuario = res;
        this.fullNameControl.setValue(this.selectedUsuario?.persona?.nombre)
        this.emailControl.setValue(this.selectedUsuario?.email)
        this.phoneControl.setValue(this.selectedUsuario?.persona?.telefono)
        this.birthDateControl.setValue(this.selectedUsuario?.persona?.nacimiento);

        (await this.usuarioService.onGetUsuarioImages(this.selectedUsuario.id, 'perfil')).subscribe(imgs => {
          if (imgs && imgs.length > 0) {
            this.src = imgs[0];
          }
        })
      })
    }
  }

  async presentActionSheet() {
    const actionSheet = await this.actionSheetController.create({
      header: 'Seleccione una opción',
      buttons: [
        {
          text: 'Tomar foto',
          icon: 'camera',
          handler: () => {
            this.captureImage(CameraSource.Camera)
          },
        },
        {
          text: 'Elegir foto existente',
          icon: 'image',
          handler: () => {
            this.captureImage(CameraSource.Photos)
          },
        },
      ],
    });
    await actionSheet.present();
  }

  goBack() {
    this.navCtrl.back();
  }

  async saveProfile() {
    if (this.src != null && this.src != "") {
      let embedding: number[] = null;
      try {
        const descriptor = await this.faceRecognitionService.getDescriptor(this.src);
        if (descriptor) {
          embedding = descriptor;
        }
      } catch (e) {
        console.error("Error generating embedding", e);
      }

      (await this.usuarioService.onSaveUsuarioImage(this.selectedUsuario.id, 'perfil', this.src, embedding)).subscribe(res => {

      })
    }
  }

  async captureImage(source: CameraSource) {
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source,
      });

      this.src = image.dataUrl;

    } catch (error) {
      console.error('Error capturing or saving image:', error);
    }
  }
}

