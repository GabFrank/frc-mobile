import { PreRegistroFuncionarioComponent } from './../../pages/funcionario/pre-registro-funcionario/pre-registro-funcionario.component';
import { PreRegistroFuncionario } from './../../pages/funcionario/funcionario.model';
import { ModalService } from './../../services/modal.service';
import { Router } from '@angular/router';
import { NotificacionService, TipoNotificacion } from 'src/app/services/notificacion.service';
import { CargandoService } from './../../services/cargando.service';
import { Usuario } from './../../domains/personas/usuario.model';
import { Platform, PopoverController, ToastController } from '@ionic/angular';
import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { LoginService } from 'src/app/services/login.service';
import { ChangeServerIpDialogComponent } from 'src/app/components/change-server-ip-dialog/change-server-ip-dialog.component';

@UntilDestroy()
@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnInit {
  @ViewChild('nickname', { static: false }) nicknameInput: ElementRef;
  @ViewChild('password', { static: false }) passwordInput: ElementRef;

  selectedUsuario: Usuario = null;
  usuarioControl = new FormControl(null, Validators.required)
  passwordControl = new FormControl(null, Validators.required)
  formGroup: FormGroup;
  showPassword = false;
  msg = "Bienvenido/a";
  subscription;
  error = null;
  activateDev = 0;

  constructor(private loginService: LoginService,
    private popoverController: PopoverController,
    private cargandoService: CargandoService,
    private notificacionService: NotificacionService,
    private router: Router,
    private modalService: ModalService,
    private platform: Platform,
    private toastController: ToastController
  ) { }

  async ngOnInit() {
    this.formGroup = new FormGroup({
      'usuario': this.usuarioControl,
      'password': this.passwordControl
    })

    this.loginService.isAuthenticated()
      .pipe(untilDestroyed(this))
      .subscribe(async res => {
        if (res != null) {
          this.onSelectUsuarioAndDismiss(res)
        }
      })
  }

  async onLogin() {
    this.error = null;
    let usuario: string = this.usuarioControl.value;
    if (usuario[usuario.length - 1] == ' ') {
      usuario = usuario.substring(0, usuario.length - 2);
    }
    (await this.loginService.login(usuario, this.passwordControl.value))
      .pipe(untilDestroyed(this))
      .subscribe(res => {
        if (res.error == null) {
          this.onSelectUsuarioAndDismiss(res.usuario)
        } else {
          this.error = res.error['message'];
          this.notificacionService.open(this.error, TipoNotificacion.DANGER, 10)
        }
      })
  }

  onSelectUsuarioAndDismiss(usuario: Usuario) {
    this.selectedUsuario = usuario;
    setTimeout(() => {
      this.modalService.closeModal(null)
    }, 2000);
  }

  onSolicitarNuevoUsuario() {
    this.modalService.closeModal(null)
    setTimeout(() => {
      this.modalService.openModal(PreRegistroFuncionarioComponent)
    }, 1000);
  }

  ionViewDidEnter() {
    this.subscription = this.platform.backButton.subscribeWithPriority(9999, () => {
    })
  }

  ionViewWillLeave() {
    this.subscription.unsubscribe();
  }

  async onDev() {
    this.activateDev++;
    if (this.activateDev > 4 && this.activateDev < 8) {
      const t = await this.toastController.create({
        message: `Faltan ${8 - this.activateDev} para el DEV MODE`,
        duration: 1
      });
      t.present();
    } else if (this.activateDev == 8) {
      this.modalService.openModal(ChangeServerIpDialogComponent).then(res => {
        if (res == true) {
          window.location.reload()
        }
      })
    }
  }

}
