import { Component, OnInit } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { ActionSheetController, NavController } from '@ionic/angular';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { MainService } from 'src/app/services/main.service';
import { Usuario } from 'src/app/domains/personas/usuario.model';
import { UsuarioService } from 'src/app/services/usuario.service';

@Component({
  selector: 'app-informaciones-personales-dashboard',
  templateUrl: './informaciones-personales-dashboard.component.html',
  styleUrls: ['./informaciones-personales-dashboard.component.scss'],
})
export class InformacionesPersonalesDashboardComponent implements OnInit {
  src = "";
  fullNameControl = new FormControl('', [Validators.required]);
  emailControl = new FormControl('', [Validators.email]);
  phoneControl = new FormControl('', [
    Validators.required,
    Validators.pattern(/^\d{4}-?\d{3}-?\d{3}$/), // Paraguayan phone number pattern
  ]);
  birthDateControl = new FormControl('', [Validators.required]);
  selectedUsuario: Usuario;

  constructor(
    private navCtrl: NavController,
    private actionSheetController: ActionSheetController,
    private mainService: MainService,
    private usuarioService: UsuarioService
    ) { }

  ngOnInit() {
    if (this.mainService.usuarioActual != null) {
      (this.usuarioService.onGetUsuario(this.mainService.usuarioActual.id)).subscribe(res => {
        this.selectedUsuario = res;
        this.fullNameControl.setValue(this.selectedUsuario?.persona?.nombre)
        this.emailControl.setValue(this.selectedUsuario?.email)
        this.phoneControl.setValue(this.selectedUsuario?.persona?.telefono)
        this.birthDateControl.setValue(this.selectedUsuario?.persona?.nacimiento)
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

  saveProfile() {

  }

  async captureImage(source: CameraSource) {
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.DataUrl, // Change this to DataUrl
        source,
      });

      // Update the avatar image src with the local URL of the saved image
      this.src = image.dataUrl;

    } catch (error) {
      console.error('Error capturing or saving image:', error);
    }
  }
}

