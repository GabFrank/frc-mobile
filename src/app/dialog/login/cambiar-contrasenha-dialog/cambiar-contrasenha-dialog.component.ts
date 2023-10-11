import { Component, Input, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Usuario } from 'src/app/domains/personas/usuario.model';
import { UsuarioSearchGQL } from 'src/app/graphql/personas/usuario/graphql/usuarioSearch';
import { CargandoService } from 'src/app/services/cargando.service';
import { PopOverService } from 'src/app/services/pop-over.service';
import { UsuarioService } from 'src/app/services/usuario.service';

@UntilDestroy()
@Component({
  selector: 'app-cambiar-contrasenha-dialog',
  templateUrl: './cambiar-contrasenha-dialog.component.html',
  styleUrls: ['./cambiar-contrasenha-dialog.component.scss'],
})
export class CambiarContrasenhaDialogComponent implements OnInit {

  @Input()
  data;

  formGroup: FormGroup;
  password1Control = new FormControl(null, [Validators.required, Validators.minLength(3)])
  password2Control = new FormControl(null, [Validators.required, Validators.minLength(3)])
  isError = false;

  showPassword1 = false
  showPassword2 = false

  selectedUsuario = new Usuario;

  constructor(
    private popoverService: PopOverService,
    private usuarioService: UsuarioService,
    private cargandoService: CargandoService
  ) {

  }

  async ngOnInit() {
    this.formGroup = new FormGroup({
      'pass1': this.password1Control,
      'pass2': this.password2Control
    })

    this.formGroup.valueChanges.pipe(untilDestroyed(this)).subscribe(res => {
      if (this.password2Control.value != null && this.password1Control.value != this.password2Control.value) {
        this.isError = true;
      } else {
        this.isError = false;
      }
    })
    let loading = await this.cargandoService.open('Cargando...')
    setTimeout(() => {
      if (this.data != null) {
        this.selectedUsuario = Object.assign(this.selectedUsuario, this.data)
      } else {
        this.popoverService.close(null)
      }
      this.cargandoService.close(loading)
    }, 500);
  }

  onCancel() {
    this.popoverService.close(null)
  }

  async onAceptar() {
    this.selectedUsuario.password = this.password1Control.value;
    (await this.usuarioService.onSaveUsuario(this.selectedUsuario.toInput()))
      .pipe(untilDestroyed(this))
      .subscribe(res => {
        if (res != null) {
          console.log(res)
          this.popoverService.close(res)
        }
      })
  }

  onLogin(){

  }

}
