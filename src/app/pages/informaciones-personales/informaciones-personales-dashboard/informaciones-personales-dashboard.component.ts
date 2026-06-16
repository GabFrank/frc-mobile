import { Component, OnInit } from '@angular/core';
import { UntypedFormControl, Validators } from '@angular/forms';
import { ModalController, NavController } from '@ionic/angular';
import { MainService } from 'src/app/services/main.service';
import { Usuario } from 'src/app/domains/personas/usuario.model';
import { UsuarioService } from 'src/app/services/usuario.service';
import { FaceRecognitionService } from 'src/app/services/face-recognition.service';
import { CapturaPerfilFacialComponent } from '../captura-perfil-facial/captura-perfil-facial.component';

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
    private modalController: ModalController,
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
        await this.cargarFotoPerfil();
      })
    }
  }

  goBack() {
    this.navCtrl.back();
  }

  async actualizarFotoPerfil(): Promise<void> {
    if (!this.selectedUsuario?.id) {
      return;
    }

    const modal = await this.modalController.create({
      component: CapturaPerfilFacialComponent,
      componentProps: {
        usuarioId: this.selectedUsuario.id,
      },
    });

    await modal.present();
    const { data } = await modal.onDidDismiss();
    if (data?.actualizada) {
      if (data.fotoFrontal) {
        this.src = data.fotoFrontal;
      }
      await this.cargarFotoPerfil();
    }
  }

  private async cargarFotoPerfil(): Promise<void> {
    if (!this.selectedUsuario?.id) {
      return;
    }
    (await this.usuarioService.onGetUsuarioImages(this.selectedUsuario.id, 'perfil', false))
      .subscribe(imgs => {
        if (imgs && imgs.length > 0) {
          this.src = imgs[0];
        }
      });
  }
}
