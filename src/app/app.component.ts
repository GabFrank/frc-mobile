import { Component, OnDestroy, OnInit, isDevMode } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { PhotoViewer } from '@awesome-cordova-plugins/photo-viewer/ngx';
import { ActionSheetController, MenuController, Platform, PopoverController, ToastController } from '@ionic/angular';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import {
  NotificacionService,
  TipoNotificacion
} from 'src/app/services/notificacion.service';
import { ServerConnectionService } from './services/server-connection.service';
import { ChangeServerIpDialogComponent } from './components/change-server-ip-dialog/change-server-ip-dialog.component';
import { LoginComponent } from './dialog/login/login.component';
import { CargandoService } from './services/cargando.service';
import { LoginService } from './services/login.service';
import { MainService } from './services/main.service';
import { ModalService } from './services/modal.service';
import { AppVersion } from '@awesome-cordova-plugins/app-version/ngx';
import { FingerprintAuthService } from './services/fingerprint-auth.service';
import {
  getAvailableAppVersion,
  getCurrentAppVersion,
  performImmediateUpdate
} from './services/update-service.service';
import { PushNotificationsService } from './services/push-notifications.service';
import { PaginationStateService } from './services/pagination-state.service';
import { descodificarQr } from './generic/utils/qrUtils';
import { stringToInteger } from './generic/utils/numbersUtils';
import { VentaCreditoService } from './graphql/financiero/venta-credito/venta-credito.service';
import { BarcodeScannerService } from './services/barcode-scanner.service';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';
import { timer } from 'rxjs';
import { Channel, ChannelService } from './services/channel.service';
import { NotificacionService as NotificacionesUsuarioService } from './pages/notificaciones/notificacion.service';
import { RoleService } from './domains/personas/roles/role.service';
import { CajaService } from './pages/operaciones/caja/caja.service';
import { PdvCaja } from './pages/operaciones/caja/caja.model';
import { VentaTarjetaService } from './pages/operaciones/venta-tarjeta/venta-tarjeta.service';
import { VentaTarjetaQrService } from './pages/operaciones/venta-tarjeta/services/venta-tarjeta-qr.service';

export class Pageable {
  getPageNumber: number;
  getPageSize: number;
}

export class PageInfo<T> {
  getTotalPages: number;
  getTotalElements: number;
  getNumberOfElements: number;
  isFirst: boolean;
  isLast: boolean;
  hasNext: boolean;
  hasPrevious: boolean;
  getPageable: Pageable;
  getContent: T[];
}

@UntilDestroy()
@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  providers: [PhotoViewer, AppVersion]
})
export class AppComponent implements OnInit, OnDestroy {
  statusSub;
  online = false;
  puedeVerInventario = false;
  currentVersion = null;
  currentChannel: Channel = 'stable';

  isFarma = false;

  isDev = false;

  hasPagination = false;
  isHomeRoute = true;
  showFooter = true;

  fabMenuOpen = false;
  marcacionRoute: string[] = ['/marcacion'];
  conteoNoLeidas = 0;
  puedeAccederCaja = false;
  ventaTarjetaHabilitada = false;

  loadingOpen = false; // track loading dialog state
  dialog: any;
  intervalID;

  constructor(
    private menu: MenuController,
    public mainService: MainService,
    public loginService: LoginService,
    private popoverController: PopoverController,
    private cargandoService: CargandoService,
    private notificacionService: NotificacionService,
    private modalService: ModalService,
    private photoViewer: PhotoViewer,
    public appVersion: AppVersion,
    private platfform: Platform,
    private fingerprintService: FingerprintAuthService,
    private pushNotificacionService: PushNotificationsService,
    private paginationStateService: PaginationStateService,
    private barcodeScannerService: BarcodeScannerService,
    private ventaCreditoService: VentaCreditoService,
    private router: Router,
    public channelService: ChannelService,
    private actionSheetCtrl: ActionSheetController,
    private toastCtrl: ToastController,
    private notificacionesUsuarioService: NotificacionesUsuarioService,
    private serverConnectionService: ServerConnectionService,
    private roleService: RoleService,
    private cajaService: CajaService,
    private ventaTarjetaService: VentaTarjetaService,
    private ventaTarjetaQrService: VentaTarjetaQrService
  ) {
    this.isDev = isDevMode();

    this.platfform.ready().then((res) => {
      appVersion.getVersionNumber().then((res) => {
        this.currentVersion = res;
        this.currentChannel = this.channelService.detectCurrentChannel(res);
      });
    });

    this.isFarma = localStorage.getItem('serverIp').includes('158');
    this.searchUpdate();
    this.intervalID = setInterval(this.searchUpdate, 50000); // 5000 milliseconds = 5 seconds
  }
  ngOnDestroy(): void {
    clearInterval(this.intervalID);
  }

  searchUpdate() {
    let currentVersion;
    let latestVersion;
    getCurrentAppVersion().then((res) => {
      currentVersion = res;
      getAvailableAppVersion().then((res2) => {
        latestVersion = res2;
        if (+currentVersion < +latestVersion) {
          performImmediateUpdate().then((res3) => {
            this.notificacionService.success('Nueva version instalada');
          });
        }
      });
    });
  }

  openInventario() {}

  async openChannelSelector() {
    const current = this.channelService.getChannelLabel(this.currentChannel);
    const sheet = await this.actionSheetCtrl.create({
      header: 'Canal de actualizaciones',
      subHeader:
        `Canal actual: ${current} (v${this.currentVersion ?? '?'}). Al cambiar, Play Store propagará la versión del nuevo canal al dispositivo en ~15 minutos.`,
      buttons: [
        {
          text: 'Alpha (pruebas internas)',
          icon: 'flask-outline',
          handler: () => {
            this.selectChannel('alpha');
          }
        },
        {
          text: 'Beta (producción piloto)',
          icon: 'rocket-outline',
          handler: () => {
            this.selectChannel('beta');
          }
        },
        {
          text: 'Stable (producción)',
          icon: 'shield-checkmark-outline',
          handler: () => {
            this.selectChannel('stable');
          }
        },
        { text: 'Cancelar', role: 'cancel' }
      ]
    });
    await sheet.present();
  }

  private async selectChannel(target: Channel) {
    await this.channelService.openPlayStoreOptIn(target);
    const messages: Record<Channel, string> = {
      alpha:
        'Se abrió Play Store. Si tu correo está invitado al programa alpha, tocá "Unirme". Tras unirse, Play Store bajará la versión alpha en ~15 min.',
      beta:
        'Se abrió Play Store. Si tu correo está invitado al programa beta, tocá "Unirme". Tras unirse, Play Store bajará la versión beta en ~15 min.',
      stable:
        'Para volver a stable, tocá "Abandonar el programa" en Play Store y luego desinstalá y reinstalá la app.'
    };
    const toast = await this.toastCtrl.create({
      message: messages[target],
      duration: 6000,
      position: 'bottom',
      color: 'medium'
    });
    await toast.present();
  }

  /**
   * Fuerza que la status bar NO se superponga al WebView (evita que el header
   * rojo quede detras de los iconos del sistema wifi/bateria) y le da un fondo
   * solido con iconos claros. Solo aplica en plataforma nativa.
   */
  private async initStatusBar(): Promise<void> {
    if (!Capacitor.isNativePlatform()) {
      return;
    }
    try {
      await StatusBar.setOverlaysWebView({ overlay: false });
      await StatusBar.setBackgroundColor({ color: '#000000' });
      await StatusBar.setStyle({ style: Style.Dark });
    } catch (e) {
      // no-op: plugin no disponible / plataforma web
    }
  }

  async ngOnInit(): Promise<void> {
    this.initStatusBar();
    this.pushNotificacionService.initPush();
    this.updateFabPosition(this.router.url);
    this.actualizarMarcacionRoute();
    this.actualizarPermisosUsuario();
    this.actualizarVentaTarjetaHabilitada();

    this.mainService.authenticationSub
      .pipe(untilDestroyed(this))
      .subscribe(() => {
        this.actualizarMarcacionRoute();
        this.actualizarPermisosUsuario();
        this.actualizarVentaTarjetaHabilitada();
      });

    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        untilDestroyed(this)
      )
      .subscribe(event => this.updateFabPosition(event.urlAfterRedirects));

    this.paginationStateService.hasPagination$
      .pipe(untilDestroyed(this))
      .subscribe(val => this.hasPagination = val);

    this.iniciarConteoNotificaciones();

    this.showLoginPop();

    this.statusSub = this.serverConnectionService.serverReachable$
      .pipe(untilDestroyed(this))
      .subscribe(async (reachable) => {
        if (reachable === true) {
          if (this.loadingOpen) {
            if (this.dialog != null) {
              this.cargandoService.close(this.dialog);
            }
            this.notificacionService.open(
              'Servidor conectado',
              TipoNotificacion.SUCCESS,
              2
            );
            this.loadingOpen = false;
          }
          this.online = true;
        } else if (reachable === false) {
          this.online = false;
          if (!this.loadingOpen) {
            this.dialog = await this.cargandoService.open(
              'No se puede acceder al servidor'
            );
            this.loadingOpen = true;
          }
        }
      });

    console.log('Initializing HomePage');

    // Request permission to use push notifications
    // iOS will prompt user and return if they granted permission or not
    // Android will just grant without prompting
    // PushNotifications.requestPermissions().then(result => {
    //   if (result.receive === 'granted') {
    //     // Register with Apple / Google to receive push via APNS/FCM
    //     PushNotifications.register();
    //   } else {
    //     // Show some error
    //   }
    // });

    // // On success, we should be able to receive notifications
    // PushNotifications.addListener('registration',
    //   (token: Token) => {
    //     alert('Push registration success, token: ' + token.value);
    //   }
    // );

    // // Some issue with our setup and push will not work
    // PushNotifications.addListener('registrationError',
    //   (error: any) => {
    //     alert('Error on registration: ' + JSON.stringify(error));
    //   }
    // );

    // // Show us the notification payload if the app is open on our device
    // PushNotifications.addListener('pushNotificationReceived',
    //   (notification: PushNotificationSchema) => {
    //     alert('Push received: ' + JSON.stringify(notification));
    //   }
    // );

    // // Method called when tapping on a notification
    // PushNotifications.addListener('pushNotificationActionPerformed',
    //   (notification: ActionPerformed) => {
    //     alert('Push action performed: ' + JSON.stringify(notification));
    //   }
    // );
  }

  private iniciarConteoNotificaciones(): void {
    this.notificacionesUsuarioService.conteoNoLeidas$
      .pipe(untilDestroyed(this))
      .subscribe(count => {
        this.conteoNoLeidas = count;
      });

    timer(0, 5000)
      .pipe(untilDestroyed(this))
      .subscribe(() => {
        if (this.loginService.usuarioActual) {
          this.notificacionesUsuarioService.refrescarConteoNoLeidas();
        }
      });

    this.mainService.authenticationSub
      .pipe(untilDestroyed(this))
      .subscribe(authenticated => {
        if (authenticated) {
          this.notificacionesUsuarioService.refrescarConteoNoLeidas();
        } else {
          this.notificacionesUsuarioService.resetConteoNoLeidas();
        }
      });
  }

  openMenu() {
    // this.menu.open();
  }

  closeMenu() {
    this.menu.close();
  }

  async onSalir() {
    await this.loginService.logOut();
    this.actualizarMarcacionRoute();
    this.showLoginPop();
    this.menu.close();
  }

  async showLoginPop() {
    this.modalService.openModal(LoginComponent);
  }

  openTransferencias() {}

  onAvatarClick() {}

  onIpChange() {
    this.modalService.openModal(ChangeServerIpDialogComponent).then((res) => {
      if (res == true) {
        window.location.reload();
      }
    });
  }

  toggleFabMenu() {
    this.fabMenuOpen = !this.fabMenuOpen;
  }

  private updateFabPosition(url: string) {
    const normalizedUrl = url.split('?')[0].split('#')[0];
    this.isHomeRoute = normalizedUrl === '' || normalizedUrl === '/';
    if (!this.isHomeRoute) {
      this.fabMenuOpen = false;
    }
    this.showFooter = !(
      normalizedUrl.includes('/producto/mostrar-precio') ||
      normalizedUrl.includes('/producto/precio-config')
    );
  }

  private actualizarMarcacionRoute(): void {
    const isAdmin = this.mainService.usuarioActual?.nickname?.toUpperCase() === 'ADMIN';
    this.marcacionRoute = isAdmin ? ['/marcacion/ingreso-persona'] : ['/marcacion'];
  }

  private actualizarPermisosUsuario(): void {
    this.puedeAccederCaja = this.roleService.puedeAccederCaja(
      this.loginService.usuarioActual?.roles
    );
  }

  private actualizarVentaTarjetaHabilitada(): void {
    if (!this.mainService.usuarioActual?.id) {
      this.ventaTarjetaHabilitada = false;
      return;
    }
    this.ventaTarjetaService.onGetConfiguracionHabilitada()
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (habilitado) => this.ventaTarjetaHabilitada = habilitado,
        error: () => this.ventaTarjetaHabilitada = false
      });
  }

  openPagarScanner() {
    this.toggleFabMenu();
    this.barcodeScannerService
      .scan()
      .pipe(untilDestroyed(this))
      .subscribe(async (res) => {
        if (res.cancelled || !res.text) {
          return;
        }

        if (!res.text.startsWith('frc-')) {
          this.notificacionService.open('QR no válido para este sistema', TipoNotificacion.DANGER, 3);
          return;
        }

        const qrData = descodificarQr(res.text);

        if (qrData.tipoEntidad === 'VT') {
          await this.procesarQrVentaTarjeta(res.text);
          return;
        }

        let idCliente = qrData.idOrigen;
        let timestamp = stringToInteger(qrData.timestamp);
        let sucursalId = qrData.sucursalId;
        let secretKey = qrData.data;
        (
          await this.ventaCreditoService.onVentaCreditoQrAuth(
            this.mainService.usuarioActual?.persona?.id,
            timestamp,
            sucursalId,
            secretKey
          )
        )
          .pipe(untilDestroyed(this))
          .subscribe({
            next: () => {
              this.notificacionService.success('Convenio confirmado con éxito');
            },
            error: (err) => {
              console.error(err);
              this.notificacionService.warn('Error al confirmar');
            }
          });
      });
  }

  private async procesarQrVentaTarjeta(texto: string): Promise<void> {
    const usuarioId = this.mainService.usuarioActual?.id;
    if (!usuarioId) {
      this.notificacionService.open('No hay usuario autenticado', TipoNotificacion.DANGER, 3);
      return;
    }

    const cajaActual = await this.resolverCajaActual(usuarioId);
    if (!cajaActual) {
      this.notificacionService.open(
        'No tiene una caja abierta. Debe abrir una caja antes de registrar ventas con tarjeta.',
        TipoNotificacion.DANGER,
        4
      );
      return;
    }

    const resultado = this.ventaTarjetaQrService.procesarQrVenta(texto, cajaActual);

    if (!resultado.ok) {
      const duracion = resultado.motivo === 'caja-distinta' ? 4 : 3;
      this.notificacionService.open(resultado.mensaje, TipoNotificacion.DANGER, duracion);
      return;
    }

    const { ventaId, cajaId, monto, sucursalId, ventaTarjetaId } = resultado.navigation;
    this.router.navigate(['/operaciones/venta-tarjeta/registro'], {
      state: { ventaId, cajaId, monto, sucursalId, ventaTarjetaId }
    });
  }

  private async resolverCajaActual(usuarioId: number): Promise<PdvCaja | null> {
    if (this.cajaService.selectedCaja?.activo) {
      return this.cajaService.selectedCaja;
    }

    return new Promise<PdvCaja | null>((resolve) => {
      this.cajaService.onGetByUsuarioIdAndAbierto(usuarioId).then((obs) => {
        obs.pipe(untilDestroyed(this)).subscribe({
          next: (cajas: PdvCaja[]) => {
            if (!cajas || cajas.length === 0) {
              resolve(null);
              return;
            }
            this.cajaService.selectedCaja = cajas[0];
            resolve(cajas[0]);
          },
          error: () => resolve(null)
        });
      });
    });
  }
}
