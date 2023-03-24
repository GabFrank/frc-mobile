import { Component, OnInit, isDevMode } from '@angular/core';
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

// import { App, URLOpenListenerEvent } from '@capacitor/app';


// declare let window: any; // Don't forget this part!


@UntilDestroy()
@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  providers: [PhotoViewer, AppVersion]

})
export class AppComponent implements OnInit {

  statusSub;
  online = false;
  puedeVerInventario = false;
  currentVersion = null;

  optionZbar: any;
  scannedOutput: any;

  isFarma = false;

  isDev = false;

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
    private fingerprintService: FingerprintAuthService
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

    this.statusSub = connectionStatusSub
      .pipe(untilDestroyed(this))
      .subscribe(async (res) => {
        let loading = await this.cargandoService.open('Conectando al servidor..')
        if (res == true) {
          this.cargandoService.close(loading)
          this.notificacionService.open('Servidor conectado', TipoNotificacion.SUCCESS, 2)
          this.online = true;
        } else if (res == false) {
          this.online = false;
          this.notificacionService.open('No se puede acceder al servidor', TipoNotificacion.DANGER, 2)
        } else {
          this.cargandoService.close(loading)
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

  onIpChange(){
    this.modalService.openModal(ChangeServerIpDialogComponent).then(res => {
      if(res==true){
        window.location.reload()
      }
    })
  }

  openInfoPersonales(){
  }

  openMisFinanzas(){

  }
}
