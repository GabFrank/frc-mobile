import { Component, OnInit } from '@angular/core';
import { NativeBiometric } from '@capgo/capacitor-native-biometric';
import { NotificacionService, TipoNotificacion } from 'src/app/services/notificacion.service';
import { MainService } from 'src/app/services/main.service';

@Component({
  selector: 'app-huella-digital',
  templateUrl: './huella-digital.component.html',
  styleUrls: ['./huella-digital.component.scss'],
})
export class HuellaDigitalComponent implements OnInit {
  private static readonly BIOMETRIC_SERVER = 'franco-system';

  isBiometricAvailable = false;
  isBiometricEnabled = false;
  hasCredentials = false;
  loading = false;
  usuarioNombre: string = '';

  constructor(
    private notificacionService: NotificacionService,
    private mainService: MainService,
  ) { }

  async ngOnInit() {
    this.usuarioNombre = this.mainService.usuarioActual?.persona?.nombre || '';
    await this.checkBiometricStatus();
  }

  async checkBiometricStatus() {
    try {
      const result = await NativeBiometric.isAvailable();
      this.isBiometricAvailable = result.isAvailable;
    } catch {
      this.isBiometricAvailable = false;
    }
    const storedPref = localStorage.getItem('biometricEnabled');
    this.isBiometricEnabled = storedPref === 'true';
    this.hasCredentials = localStorage.getItem('biometricHasCredentials') === 'true';
  }

  async onToggleBiometric(event: any) {
    const newValue = event.detail.checked;
    if (this.loading) {
      return;
    }
    this.loading = true;

    if (newValue) {
      await this.enableBiometric();
    } else {
      await this.disableBiometric();
    }

    this.loading = false;
  }

  private async enableBiometric() {
    try {
      const result = await NativeBiometric.isAvailable();
      if (!result.isAvailable) {
        this.isBiometricEnabled = false;
        this.notificacionService.open(
          'El sensor biométrico no está disponible en este dispositivo.',
          TipoNotificacion.DANGER,
          5
        );
        return;
      }
      await NativeBiometric.verifyIdentity({
        reason: 'Verificar identidad para activar huella digital',
        title: 'Activar Huella Digital',
        subtitle: 'Coloca tu huella para confirmar',
        maxAttempts: 3,
      });
      localStorage.setItem('biometricEnabled', 'true');
      this.isBiometricEnabled = true;

      if (!this.hasCredentials && this.mainService.usuarioActual?.id) {
        const token = localStorage.getItem('token');
        if (token) {
          await NativeBiometric.setCredentials({
            username: this.mainService.usuarioActual.id.toString(),
            password: token,
            server: HuellaDigitalComponent.BIOMETRIC_SERVER
          });
          this.hasCredentials = true;
          localStorage.setItem('biometricHasCredentials', 'true');
        }
      }

      this.notificacionService.open(
        'Huella digital activada correctamente.',
        TipoNotificacion.SUCCESS,
        3
      );
    } catch (error: any) {
      this.isBiometricEnabled = false;
      console.log('Error activando biométrico:', error);
      this.notificacionService.open(
        'No se pudo activar la huella digital. Intenta de nuevo.',
        TipoNotificacion.DANGER,
        5
      );
    }
  }

  private async disableBiometric() {
    try {
      if (this.hasCredentials) {
        await NativeBiometric.deleteCredentials({
          server: HuellaDigitalComponent.BIOMETRIC_SERVER,
        });
        this.hasCredentials = false;
        localStorage.setItem('biometricHasCredentials', 'false');
      }

      localStorage.setItem('biometricEnabled', 'false');
      this.isBiometricEnabled = false;
      this.notificacionService.open(
        'Huella digital desactivada. Deberás usar usuario y contraseña para iniciar sesión.',
        TipoNotificacion.SUCCESS,
        4
      );
    } catch (error: any) {
      console.log('Error desactivando biométrico:', error);
      localStorage.setItem('biometricEnabled', 'false');
      this.isBiometricEnabled = false;
      this.notificacionService.open(
        'Huella digital desactivada.',
        TipoNotificacion.SUCCESS,
        3
      );
    }
  }
}
