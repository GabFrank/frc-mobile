import { Injectable } from '@angular/core';
import { Browser } from '@capacitor/browser';

export type Channel = 'alpha' | 'beta' | 'stable';

@Injectable({ providedIn: 'root' })
export class ChannelService {
  // Alpha → Internal testing (Play Console). Requiere estar en la email list
  // "alpha". ID numérico del track internal testing.
  private readonly ALPHA_OPT_IN_URL =
    'https://play.google.com/apps/internaltest/4701535382290616522';
  // Beta → Open testing. Abierto a cualquier cuenta Google. El URL web muestra
  // directamente la página de opt-in con el botón "Aderir ao teste beta".
  private readonly BETA_OPT_IN_URL =
    'https://play.google.com/apps/testing/com.sistemasinformaticos.frc';
  // Stable → ficha pública de la app. Mismo URL que beta — Play Store detecta
  // automáticamente si el usuario está en un programa y muestra el botón
  // "Abandonar" para volver a stable.
  private readonly STORE_URL =
    'https://play.google.com/store/apps/details?id=com.sistemasinformaticos.frc';

  detectCurrentChannel(versionName: string | null | undefined): Channel {
    if (!versionName) return 'stable';
    if (/-alpha\./i.test(versionName)) return 'alpha';
    if (/-beta\./i.test(versionName)) return 'beta';
    return 'stable';
  }

  getChannelLabel(channel: Channel): string {
    switch (channel) {
      case 'alpha': return 'Alpha';
      case 'beta': return 'Beta';
      case 'stable': return 'Stable';
    }
  }

  async openPlayStoreOptIn(target: Channel): Promise<void> {
    let url: string;
    switch (target) {
      case 'alpha':
        url = this.ALPHA_OPT_IN_URL;
        break;
      case 'beta':
        url = this.BETA_OPT_IN_URL;
        break;
      case 'stable':
        url = this.STORE_URL;
        break;
    }
    await Browser.open({ url });
  }
}
