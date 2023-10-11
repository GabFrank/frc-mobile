import { Component, OnDestroy, OnInit, isDevMode } from '@angular/core';
import { PhotoViewer } from '@awesome-cordova-plugins/photo-viewer/ngx';
import { MenuController, Platform, PopoverController } from '@ionic/angular';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { NotificacionService, TipoNotificacion } from 'src/app/services/notificacion.service';
import { connectionStatusSub } from './app.module';
import { ChangeServerIpDialogComponent } from './components/change-server-ip-dialog/change-server-ip-dialog.component';
import { LoginComponent } from './dialog/login/login.component';
import { CargandoService } from './services/cargando.service';
import { LoginService } from './services/login.service';
import { MainService } from './services/main.service';
import { ModalService } from './services/modal.service';
import { AppVersion } from '@awesome-cordova-plugins/app-version/ngx';
import { FingerprintAuthService } from './services/fingerprint-auth.service';
import { getAvailableAppVersion, getCurrentAppVersion, performImmediateUpdate } from './services/update-service.service';

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

  optionZbar: any;
  scannedOutput: any;

  isFarma = false;

  isDev = false;

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
  ) {

    this.isDev = isDevMode()

    this.optionZbar = {
      flash: 'off',
      drawSight: false
    }

    this.platfform.ready().then(res => {
      appVersion.getVersionNumber().then(res => {
        this.currentVersion = res
      })
    })

    this.isFarma = localStorage.getItem('serverIp').includes('158')
    this.searchUpdate()
    this.intervalID = setInterval(this.searchUpdate, 50000); // 5000 milliseconds = 5 seconds

  }
  ngOnDestroy(): void {
    this.statusSub?.unsubscribe();
    clearInterval(this.intervalID);
  }



  searchUpdate() {
    let currentVersion;
    let latestVersion;
    getCurrentAppVersion().then(res => {
      currentVersion = res;
      getAvailableAppVersion().then(res2 => {
        latestVersion = res2;
        if(+currentVersion < +latestVersion){
          performImmediateUpdate().then(res3 => {
            this.notificacionService.success("Nueva version instalada")
          })
        }
      })
    })

  }

  openInventario() {

  }

  async ngOnInit(): Promise<void> {


    this.showLoginPop();


    this.statusSub = connectionStatusSub.pipe(untilDestroyed(this)).subscribe(async (res) => {
      if (res === true) {
        if (this.loadingOpen) { // only close if loading dialog is open
          if(this.dialog!=null) this.cargandoService.close(this.dialog);
          this.notificacionService.open('Servidor conectado', TipoNotificacion.SUCCESS, 2);
          this.loadingOpen = false; // set loading state to closed
        }
        this.online = true;
      } else if (res === false) {
        this.online = false;
        if (!this.loadingOpen) { // only open if loading dialog is not already open
          this.dialog = await this.cargandoService.open('No se puede acceder al servidor');
          this.loadingOpen = true; // set loading state to open
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

  openMenu() {
    // this.menu.open();
  }

  closeMenu() {
    this.menu.close();
  }

  async onSalir() {
    let loading = await this.cargandoService.open("Saliendo...")
    setTimeout(() => {
      this.cargandoService.close(loading)
      this.loginService.logOut();
      this.showLoginPop()
      this.menu.close();
    }, 1000);
  }

  async showLoginPop() {
    // const pop = await this.popoverController.create({
    //   component: LoginComponent,
    //   cssClass: 'my-custom-class',
    //   translucent: true,
    //   backdropDismiss: false
    // });
    // await pop.present();
    this.modalService.openModal(LoginComponent)
  }

  openTransferencias() {

  }

  onAvatarClick() {

  }

  onIpChange() {
    this.modalService.openModal(ChangeServerIpDialogComponent).then(res => {
      if (res == true) {
        window.location.reload()
      }
    })
  }
}
