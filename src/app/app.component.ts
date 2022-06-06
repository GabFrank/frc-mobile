import { ModalService } from './services/modal.service';
import { NotificacionService, TipoNotificacion } from 'src/app/services/notificacion.service';
import { InventarioService } from './pages/inventario/inventario.service';
import { ActivatedRoute } from '@angular/router';
import { CargandoService } from './services/cargando.service';
import { Component, OnInit } from '@angular/core';
import { MenuController, Platform, PopoverController } from '@ionic/angular';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { LoginComponent } from './dialog/login/login.component';
import { LoginService } from './services/login.service';
import { MainService } from './services/main.service';
import { connectionStatusSub } from './app.module';
import { BarcodeFormat } from './components/qr-scanner-dialog/scanner.service';
import { platform } from 'os';

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

  optionZbar:any;
  scannedOutput:any;

  constructor(
    private menu: MenuController,
    public mainService: MainService,
    public loginService: LoginService,
    private popoverController: PopoverController,
    private cargandoService: CargandoService,
    private notificacionService: NotificacionService,
    private modalService: ModalService

    // platform: Platform, statusBar: StatusBar, splashScreen: SplashScreen
  ) {
    this.optionZbar = {
      flash: 'off',
      drawSight: false
    }
  }

  openInventario() {
  }

  ngOnInit(): void {
    this.showLoginPop();

    this.statusSub = connectionStatusSub
      .pipe(untilDestroyed(this))
      .subscribe((res) => {
        if (res==true) {
          this.cargandoService.close()
          this.notificacionService.open('Servidor conectado', TipoNotificacion.SUCCESS, 2)
          this.online = true;
        } else if(res==false) {
          this.online = false;
          this.notificacionService.open('No se puede acceder al servidor', TipoNotificacion.DANGER, 2)
          this.cargandoService.open('Conectando al servidor..', true)
        }
      });

  }

  openMenu() {
    // this.menu.open();
  }

  closeMenu() {
    this.menu.close();
  }

  onSalir() {
    this.cargandoService.open("Saliendo...")
    setTimeout(() => {
      this.cargandoService.close()
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
