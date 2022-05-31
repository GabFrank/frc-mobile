import { NotificacionService, TipoNotificacion } from 'src/app/services/notificacion.service';
import { CargandoService } from './../../services/cargando.service';
import { Usuario } from './../../domains/personas/usuario.model';
import { PopoverController } from '@ionic/angular';
import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { LoginService } from 'src/app/services/login.service';

@UntilDestroy()
@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnInit {
  selectedUsuario: Usuario = null;
  usuarioControl = new FormControl(null, Validators.required)
  passwordControl = new FormControl(null, Validators.required)
  formGroup: FormGroup;
  showPassword = false;
  msg = "Bienvenido/a"
  error = null;
  constructor(private loginService: LoginService,
    private popoverController: PopoverController,
    private cargandoService: CargandoService,
    private notificacionService: NotificacionService
    ) { }

  async ngOnInit() {
    this.cargandoService.open("Inicializando...", true)
    this.formGroup = new FormGroup({
      'usuario': this.usuarioControl,
      'password': this.passwordControl
    })

    this.loginService.isAuthenticated()
      .pipe(untilDestroyed(this))
      .subscribe(async res => {
        if (res != null) {
          this.onSelectUsuarioAndDismiss(res)
        }
      })

    await this.cargandoService.close()

  }

  onLogin() {
    this.error = null;
    this.cargandoService.open("Entrando al sistema....")
    this.loginService.login(this.usuarioControl.value, this.passwordControl.value)
      .pipe(untilDestroyed(this))
      .subscribe(res => {
        this.cargandoService.close()
        if (res.error == null) {
          this.onSelectUsuarioAndDismiss(res.usuario)
        } else {
          this.error = res.error['message'];
          this.notificacionService.open(this.error, TipoNotificacion.DANGER, 10)
        }
      })
  }

  onSelectUsuarioAndDismiss(usuario: Usuario) {
    this.selectedUsuario = usuario;
    setTimeout(() => {
      this.popoverController.dismiss()
    }, 2000);
  }

}
