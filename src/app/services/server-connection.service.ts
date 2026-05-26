import { Injectable } from '@angular/core';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { distinctUntilChanged } from 'rxjs/operators';
/**
 * Traduce eventos del WebSocket de suscripciones GraphQL a un estado de UI estable.
 * Evita falsos "servidor offline" al abrir cámara nativa o pasar la app a segundo plano.
 */
@Injectable({
  providedIn: 'root',
})
export class ServerConnectionService {
  private static readonly OFFLINE_DEBOUNCE_MS = 2500;
  private static readonly RESUME_GRACE_MS = 2000;

  private readonly reachableSubject = new BehaviorSubject<boolean | null>(null);
  private webSocketConnected = false;
  private nativeScannerActive = false;
  private appInBackground = false;
  private resumeGraceUntil = 0;
  private offlineDebounceTimer: ReturnType<typeof setTimeout> | null = null;

  /** Estado para toolbar y diálogo de conexión (null = aún sin primer evento). */
  readonly serverReachable$: Observable<boolean | null> = this.reachableSubject.asObservable().pipe(
    distinctUntilChanged()
  );

  constructor() {
    this.listenAppLifecycle();
  }

  setNativeScannerActive(active: boolean): void {
    this.nativeScannerActive = active;
    if (!active && this.webSocketConnected) {
      this.publishReachable(true);
      return;
    }
    if (active) {
      this.clearOfflineDebounce();
    }
  }

  private listenAppLifecycle(): void {
    if (!Capacitor.isNativePlatform()) {
      return;
    }
    App.addListener('appStateChange', ({ isActive }) => {
      this.appInBackground = !isActive;
      if (isActive) {
        this.resumeGraceUntil = Date.now() + ServerConnectionService.RESUME_GRACE_MS;
        this.clearOfflineDebounce();
        if (this.webSocketConnected) {
          this.publishReachable(true);
        }
      } else {
        this.clearOfflineDebounce();
      }
    });
  }

  onWebSocketConnected(): void {
    this.webSocketConnected = true;
    this.clearOfflineDebounce();
    this.publishReachable(true);
  }

  onWebSocketDisconnected(): void {
    this.webSocketConnected = false;
    this.clearOfflineDebounce();

    if (this.shouldSuppressOfflineUi()) {
      return;
    }

    this.offlineDebounceTimer = setTimeout(() => {
      this.offlineDebounceTimer = null;
      if (!this.webSocketConnected && !this.shouldSuppressOfflineUi()) {
        this.publishReachable(false);
      }
    }, ServerConnectionService.OFFLINE_DEBOUNCE_MS);
  }

  private shouldSuppressOfflineUi(): boolean {
    return (
      this.nativeScannerActive ||
      this.appInBackground ||
      Date.now() < this.resumeGraceUntil
    );
  }

  private clearOfflineDebounce(): void {
    if (this.offlineDebounceTimer != null) {
      clearTimeout(this.offlineDebounceTimer);
      this.offlineDebounceTimer = null;
    }
  }

  private publishReachable(reachable: boolean): void {
    this.reachableSubject.next(reachable);
  }
}
