import { PreRegistroFuncionarioComponent } from './../../pages/funcionario/pre-registro-funcionario/pre-registro-funcionario.component';
import { ModalService } from './../../services/modal.service';
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
import { NativeBiometric } from '@capgo/capacitor-native-biometric';

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
    NativeBiometric.isAvailable().then(res => {
      this.isBiometricAvailable = res.isAvailable;
    }).catch(() => {
      this.isBiometricAvailable = false;
    });

    this.formGroup = new UntypedFormGroup({
      'usuario': this.usuarioControl,
      'password': this.passwordControl
    })

    const justLoggedOut = sessionStorage.getItem('justLoggedOut');
    if (justLoggedOut) {
      sessionStorage.removeItem('justLoggedOut');
    } else {
      this.performBiometricLogin();
    }
  }

  async performBiometricLogin() {
    try {
      const isAvailable = await NativeBiometric.isAvailable();
      if (isAvailable.isAvailable) {
        const credentials = await NativeBiometric.getCredentials({ server: 'franco-system' });
        if (credentials && credentials.username && credentials.password) {
          await NativeBiometric.verifyIdentity({
            reason: 'Inicia sesión con tu huella',
            title: 'Inicio de sesión biométrico',
            subtitle: 'Autenticación requerida',
          });

          const storedToken = credentials.password;
          const storedUsuarioId = credentials.username;

          if (!isNaN(+storedUsuarioId)) {
            localStorage.setItem('token', storedToken);
            localStorage.setItem('usuarioId', storedUsuarioId);
            this.loginService.isAuthenticated()
              .pipe(untilDestroyed(this))
              .subscribe(res => {
                if (res) {
                  this.onSelectUsuarioAndDismiss(res);
                } else {
                  this.error = "Token biométrico expirado o no válido.";
                  this.notificacionService.open(this.error, TipoNotificacion.DANGER, 5);
                }
              });
          } else {
            this.error = "Sesión biométrica antigua. Inicia manualmente.";
            this.notificacionService.open(this.error, TipoNotificacion.DANGER, 5);
          }
        }
      }
    } catch (error: any) {
      console.log('Biometric login not possible or cancelled:', error);
      const errStr = (JSON.stringify(error) + (error.message || '')).toLowerCase();
      // Si el sensor se bloquea por muchos intentos (iOS/Android)
      if (errStr.includes('too many') || errStr.includes('lockout') || errStr.includes('intentos') || errStr.includes('bloquea')) {
        this.isBiometricAvailable = false;
        this.error = "Sensor bloqueado por múltiples intentos fallidos.";
        this.notificacionService.open(this.error, TipoNotificacion.DANGER, 5);
      }
    }
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
          NativeBiometric.setCredentials({
            username: res.usuario.id.toString(),
            password: localStorage.getItem('token'),
            server: 'franco-system'
          }).catch(err => console.log('Error saving credentials:', err));

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
