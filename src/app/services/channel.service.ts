import { Injectable } from '@angular/core';
import { Browser } from '@capacitor/browser';

export type Channel = 'alpha' | 'beta' | 'stable';

@Injectable({ providedIn: 'root' })
export class ChannelService {
  // web: página de opt-in de programas de testing (alpha/beta) en Play Store.
  private readonly OPT_IN_URL =
    'https://play.google.com/apps/testing/com.sistemasinformaticos.frc';
  // android: ficha de la app en Play Store (para volver a stable / desinscribirse).
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
    const url = target === 'stable' ? this.STORE_URL : this.OPT_IN_URL;
    await Browser.open({ url });
  }
}
