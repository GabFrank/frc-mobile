import { PreRegistroFuncionarioComponent } from './../../pages/funcionario/pre-registro-funcionario/pre-registro-funcionario.component';
import { ModalService } from './../../services/modal.service';
import { NotificacionService, TipoNotificacion } from 'src/app/services/notificacion.service';
import { Usuario } from './../../domains/personas/usuario.model';
import { AlertController, Platform, ToastController } from '@ionic/angular';
import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { LoginService } from 'src/app/services/login.service';
import { ChangeServerIpDialogComponent } from 'src/app/components/change-server-ip-dialog/change-server-ip-dialog.component';
import { BiometricAuthError, NativeBiometric } from '@capgo/capacitor-native-biometric';

@UntilDestroy()
@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnInit {
  private static readonly BIOMETRIC_SERVER = 'franco-system';
  private static readonly BIOMETRIC_MAX_ATTEMPTS = 3;
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
  loading = false;
  isDismissing = false;

  constructor(private loginService: LoginService,
    private notificacionService: NotificacionService,
    private modalService: ModalService,
    private platform: Platform,
    private toastController: ToastController,
    private alertController: AlertController
  ) { }

  async ngOnInit() {
    const biometricPref = localStorage.getItem('biometricEnabled');
    const isBiometricDisabled = biometricPref === 'false';

    if (!isBiometricDisabled) {
      NativeBiometric.isAvailable().then(res => {
        this.isBiometricAvailable = res.isAvailable;
      }).catch(() => {
        this.isBiometricAvailable = false;
      });
    } else {
      this.isBiometricAvailable = false;
    }

    this.formGroup = new UntypedFormGroup({
      'usuario': this.usuarioControl,
      'password': this.passwordControl
    })

    const justLoggedOut = sessionStorage.getItem('justLoggedOut');
    if (justLoggedOut) {
      sessionStorage.removeItem('justLoggedOut');
    } else if (localStorage.getItem('biometricEnabled') === 'true' && localStorage.getItem('biometricHasCredentials') === 'true') {
      setTimeout(() => {
        if (!this.isDismissing && !this.loading) {
          this.performBiometricLogin();
        }
      }, 500);
    }
  }

  async performBiometricLogin() {
    try {
      const isAvailable = await NativeBiometric.isAvailable();
      if (isAvailable.isAvailable) {
        const credentials = await NativeBiometric.getCredentials({ server: LoginComponent.BIOMETRIC_SERVER });
        if (!credentials?.password) {
          localStorage.setItem('biometricHasCredentials', 'false');
          return;
        }

        localStorage.setItem('biometricHasCredentials', 'true');

        await NativeBiometric.verifyIdentity({
          reason: 'Inicia sesión con tu huella',
          title: 'Inicio de sesión biométrico',
          subtitle: 'Autenticación requerida',
          maxAttempts: LoginComponent.BIOMETRIC_MAX_ATTEMPTS,
        });

        this.loading = true;
        (await this.loginService.biometricLogin(credentials.password))
          .pipe(untilDestroyed(this))
          .subscribe(res => {
            this.loading = false;
            if (res?.error == null && res?.usuario != null) {
              this.onSelectUsuarioAndDismiss(res.usuario);
            } else {
              this.error = res?.error?.error?.message || "No se pudo validar la sesión biométrica.";
              this.notificacionService.open(this.error, TipoNotificacion.DANGER, 5);
            }
          }, () => this.loading = false);
      }
    } catch (error: any) {
      console.log('Biometric login not possible or cancelled:', error);
      if (this.isBiometricLockoutError(error)) {
        this.isBiometricAvailable = false;
        this.error = 'Sensor bloqueado por múltiples intentos fallidos.';
        this.notificacionService.open(this.error, TipoNotificacion.DANGER, 5);
      }
    }
  }

  async onLogin() {
    if (this.loading || this.isDismissing) return;
    this.error = null;
    let usuario: string = this.usuarioControl.value;
    if (usuario[usuario.length - 1] == ' ') {
      usuario = usuario.substring(0, usuario.length - 2);
    }
    this.loading = true;
    (await this.loginService.login(usuario, this.passwordControl.value))
      .pipe(untilDestroyed(this))
      .subscribe(res => {
        this.loading = false;
        if (res.error == null) {
          this.handlePostLoginBiometric(res.usuario.id, localStorage.getItem('token')).then(() => {
            this.onSelectUsuarioAndDismiss(res.usuario)
          });
        } else {
          this.error = res.error['message'] || "Error al iniciar sesión";
          this.notificacionService.open(this.error, TipoNotificacion.DANGER, 10)
        }
      }, (err) => {
        this.loading = false;
        this.error = "Error de conexión";
        this.notificacionService.open(this.error, TipoNotificacion.DANGER, 10);
      })
  }

  onSelectUsuarioAndDismiss(usuario: Usuario) {
    if (this.isDismissing) return;
    this.isDismissing = true;
    this.selectedUsuario = usuario;
    setTimeout(() => {
      this.modalService.closeModal(usuario)
    }, 200);
  }

  onSolicitarNuevoUsuario() {
    if (this.isDismissing) return;
    this.isDismissing = true;
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

  async handlePostLoginBiometric(userId: number, token: string) {
    const biometricPref = localStorage.getItem('biometricEnabled');

    if (biometricPref === null) {
      let isAvailable: any;
      try {
        isAvailable = await NativeBiometric.isAvailable();
      } catch {
        return;
      }
      if (!isAvailable?.isAvailable) return;

      const alert = await this.alertController.create({
        header: 'Configurar Huella',
        message: '¿Deseas activar el inicio de sesión con huella digital para entrar más rápido la próxima vez?',
        buttons: [
          {
            text: 'No, gracias',
            role: 'cancel'
          },
          {
            text: 'Sí, activar',
            role: 'confirm'
          }
        ]
      });
      await alert.present();
      const result = await alert.onDidDismiss();

      if (result.role === 'confirm') {
        try {
          await NativeBiometric.verifyIdentity({
            reason: 'Confirma tu huella para activar el acceso rápido',
            title: 'Activar Huella Digital',
            subtitle: 'Autenticación requerida',
            maxAttempts: LoginComponent.BIOMETRIC_MAX_ATTEMPTS,
          });

          if (!token) {
            this.notificacionService.warn('No se pudo activar la huella: token no disponible');
            return;
          }

          // Guardar credenciales PRIMERO
          await NativeBiometric.setCredentials({
            username: userId.toString(),
            password: token,
            server: LoginComponent.BIOMETRIC_SERVER
          });

          // Solo DESPUES de que las credenciales se guardaron exitosamente, marcar como habilitado
          localStorage.setItem('biometricEnabled', 'true');
          localStorage.setItem('biometricHasCredentials', 'true');
          this.notificacionService.success('Huella activada correctamente');
        } catch (error) {
          console.log('Error activating biometrics:', error);
          // NO setear biometricEnabled - dejarlo como null para que pregunte de nuevo la proxima vez
          this.notificacionService.warn('No se pudo activar la huella');
        }
      } else {
        localStorage.setItem('biometricEnabled', 'false');
      }
    } else if (biometricPref === 'true') {
      await this.syncBiometricCredentialsForOwner(userId, token);
    }
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

  private isBiometricLockoutError(error: any): boolean {
    const code = Number(error?.code);
    return (
      code === BiometricAuthError.USER_LOCKOUT ||
      code === BiometricAuthError.USER_TEMPORARY_LOCKOUT
    );
  }

  private async syncBiometricCredentialsForOwner(userId: number, token: string) {
    if (!token) {
      return;
    }

    const biometricPref = localStorage.getItem('biometricEnabled');
    if (biometricPref !== 'true') {
      return;
    }

    try {
      const ownerId = await this.loginService.getBiometricOwnerUserId();
      if (ownerId != null && ownerId !== userId) {
        return;
      }

      try {
        const existingCredentials = await NativeBiometric.getCredentials({
          server: LoginComponent.BIOMETRIC_SERVER
        });
        if (existingCredentials?.username && +existingCredentials.username !== userId && ownerId !== userId) {
          return;
        }
      } catch {
      }

      // Guardar credenciales primero, luego marcar en localStorage
      await NativeBiometric.setCredentials({
        username: userId.toString(),
        password: token,
        server: LoginComponent.BIOMETRIC_SERVER
      });
      localStorage.setItem('biometricHasCredentials', 'true');
    } catch (err) {
      console.log('Error saving biometric credentials:', err);
    }
  }
}
