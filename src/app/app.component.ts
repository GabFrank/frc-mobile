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
import { UpdateServiceService } from './services/update-service.service';
import { log } from 'console';

// import { App, URLOpenListenerEvent } from '@capacitor/app';


// declare let window: any; // Don't forget this part!


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
    private updateService: UpdateServiceService
  ) {

    this.isDev = isDevMode()

    this.optionZbar = {
      flash: 'off',
      drawSight: false
    }
    appVersion.getVersionNumber().then(res => {
      this.currentVersion = res
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
    this.updateService.getCurrentAppVersion().then(res => {
      currentVersion = res;
      this.updateService.getAvailableAppVersion().then(res2 => {
        latestVersion = res2;
        if(+currentVersion < +latestVersion && !isDevMode()){
          this.updateService.performImmediateUpdate().then(res3 => {
            this.notificacionService.success("Nueva version instalada")
          })
        }
      })
    })

  }

  // initializeApp() {
  //   App.addListener('appUrlOpen', (event: URLOpenListenerEvent) => {
  //     this.zone.run(() => {
  //       // Example url: https://beerswift.app/tabs/tab2
  //       // slug = /tabs/tab2
  //       console.log(event)
  //       const slug = event.url.split(".app").pop();
  //       if (slug) {
  //         this.router.navigateByUrl(slug);
  //       }
  //       // If no match, do nothing - let regular routing
  //       // logic take over
  //     });
  //   });
  // }

  openInventario() {

  }

  async ngOnInit(): Promise<void> {


    this.showLoginPop();

    // this.statusSub = connectionStatusSub
    //   .pipe(untilDestroyed(this))
    //   .subscribe(async (res) => {
    //     if (res == true) {

    //     }
    //   });


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
