import { PreRegistroFuncionarioComponent } from './../../pages/funcionario/pre-registro-funcionario/pre-registro-funcionario.component';
import { PreRegistroFuncionario } from './../../pages/funcionario/funcionario.model';
import { ModalService, ModalSize } from './../../services/modal.service';
import { Router } from '@angular/router';
import { NotificacionService, TipoNotificacion } from 'src/app/services/notificacion.service';
import { CargandoService } from './../../services/cargando.service';
import { Usuario } from './../../domains/personas/usuario.model';
import { Platform, PopoverController, ToastController } from '@ionic/angular';
import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { LoginService } from 'src/app/services/login.service';
import { ChangeServerIpDialogComponent } from 'src/app/components/change-server-ip-dialog/change-server-ip-dialog.component';
import { NativeBiometric } from 'capacitor-native-biometric';
import { serverAdress } from 'src/environments/environment';

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
  usuarioControl = new UntypedFormControl(null, Validators.required)
  passwordControl = new UntypedFormControl(null, Validators.required)
  formGroup: UntypedFormGroup;
  showPassword = false;
  msg = "Bienvenido/a";
  subscription;
  error = null;
  activateDev = 0;
  isBiometricAvailable = false;
  isHardwareAvailable = false;

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
    this.checkBiometricAvailability();

    this.formGroup = new UntypedFormGroup({
      'usuario': this.usuarioControl,
      'password': this.passwordControl
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
          if (this.isHardwareAvailable) {
            NativeBiometric.setCredentials({
              username: usuario,
              password: this.passwordControl.value,
              server: 'franco-system-auth',
            }).then(() => localStorage.setItem('hasBiometrics', 'true'))
              .catch(err => console.error('Error saving credentials', err));
          }

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

  async checkBiometricAvailability() {
    try {
      const result = await NativeBiometric.isAvailable();
      this.isHardwareAvailable = result.isAvailable;
      const hasPreviousLogin = localStorage.getItem('hasBiometrics') === 'true';
      this.isBiometricAvailable = this.isHardwareAvailable && hasPreviousLogin;
      if (this.isBiometricAvailable) {
        this.performBiometricAuth();
      }
    } catch (error) {
      console.error('Biometric check failed', error);
    }
  }

  onBiometric() {
    this.performBiometricAuth();
  }

  async performBiometricAuth() {
    try {
      await NativeBiometric.verifyIdentity({
        reason: 'Por favor, autentíquese para continuar',
        title: 'Autenticación Biométrica',
        subtitle: 'Use su huella o FaceID',
        description: 'Coloque su dedo en el sensor'
      });

      const credentials = await NativeBiometric.getCredentials({
        server: 'franco-system-auth',
      });

      if (credentials && credentials.username && credentials.password) {
        this.loginWithBiometrics(credentials.username, credentials.password);
      } else {
        this.notificacionService.open('No hay credenciales guardadas. Inicie sesión manualmente primero.', TipoNotificacion.WARN, 5);
      }

    } catch (error) {
      console.error('Biometric auth failed', error);
    }
  }

  loginWithBiometrics(username: string, password: string) {
    this.loginService.login(username, password)
      .then(observable => {
        observable
          .pipe(untilDestroyed(this))
          .subscribe(res => {
            if (res.error == null && res.usuario) {
              this.onSelectUsuarioAndDismiss(res.usuario);
            } else {
              this.notificacionService.open('Error al iniciar sesión con biometría', TipoNotificacion.DANGER, 5);
            }
          }, err => {
            console.error('Login observable error:', err);
          });
      })
      .catch(err => {
        console.error('Login promise error:', err);
      });
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
