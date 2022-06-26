import { Router } from '@angular/router';
import { ModalService } from './services/modal.service';
import { NotificacionService, TipoNotificacion } from 'src/app/services/notificacion.service';
import { CargandoService } from './services/cargando.service';
import { Component, NgZone, OnInit } from '@angular/core';
import { MenuController, PopoverController } from '@ionic/angular';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { LoginComponent } from './dialog/login/login.component';
import { LoginService } from './services/login.service';
import { MainService } from './services/main.service';
import { connectionStatusSub } from './app.module';
// import { App, URLOpenListenerEvent } from '@capacitor/app';


declare let window: any; // Don't forget this part!


@UntilDestroy()
@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent implements OnInit {

  statusSub;
  online = false;
  puedeVerInventario = false;

  optionZbar: any;
  scannedOutput: any;

  constructor(
    private menu: MenuController,
    public mainService: MainService,
    public loginService: LoginService,
    private popoverController: PopoverController,
    private cargandoService: CargandoService,
    private notificacionService: NotificacionService,
    private modalService: ModalService,
    // private zone: NgZone,
    // private router: Router

    // platform: Platform, statusBar: StatusBar, splashScreen: SplashScreen
  ) {
    this.optionZbar = {
      flash: 'off',
      drawSight: false
    }
    // this.initializeApp();
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
          console.log(loading)
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
}
