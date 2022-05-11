import { InventarioService } from './pages/inventario/inventario.service';
import { ActivatedRoute } from '@angular/router';
import { CargandoService } from './services/cargando.service';
import { Component, OnInit } from '@angular/core';
import { MenuController, PopoverController } from '@ionic/angular';
import { UntilDestroy } from '@ngneat/until-destroy';
import { LoginComponent } from './dialog/login/login.component';
import { LoginService } from './services/login.service';
import { MainService } from './services/main.service';

@UntilDestroy()
@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent implements OnInit {

  constructor(
    private menu: MenuController,
    private mainService: MainService,
    private loginService: LoginService,
    private popoverController: PopoverController,
    private cargandoService: CargandoService,
    private activatedRoute: ActivatedRoute,
    private inventarioService: InventarioService
    // platform: Platform, statusBar: StatusBar, splashScreen: SplashScreen
  ) {
  }

  openInventario(){
    this.inventarioService.crearInventario()
  }

  ngOnInit(): void {
    this.showLoginPop();
  }

  openMenu() {
    this.menu.open();
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
    const pop = await this.popoverController.create({
      component: LoginComponent,
      cssClass: 'my-custom-class',
      translucent: true,
      backdropDismiss: false
    });
    await pop.present();
  }

  openTransferencias(){

  }
}
