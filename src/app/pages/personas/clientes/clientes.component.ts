import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { IonicModule, NavController, ToastController } from '@ionic/angular';
import { ClienteService } from './cliente.service';
import { TipoCliente, PersonaInput, ClienteInput } from './model/cliente.model';
import { LoginService } from 'src/app/services/login.service';
import { firstValueFrom, of } from 'rxjs';

@Component({
  selector: 'app-clientes',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IonicModule
  ],
  templateUrl: './clientes.component.html',
  styleUrls: ['./clientes.component.scss'],
  changeDetection: ChangeDetectionStrategy.Default,
  host: {
    class: 'ion-page'
  }
})
export class ClientesComponent implements OnInit {
  private fb = inject(FormBuilder);
  private clienteService = inject(ClienteService);
  private navCtrl = inject(NavController);
  private toastCtrl = inject(ToastController);
  public loginService = inject(LoginService);

  clienteForm: FormGroup = this.fb.group({
    nombre: ['', [Validators.required, Validators.minLength(3)]],
    apodo: [''],
    documento: ['', [Validators.required]],
    telefono: ['', [Validators.required]],
    direccion: [''],
    nacimiento: [''],
    email: ['', [Validators.email]],
    tipo: [TipoCliente.NORMAL, [Validators.required]],
    credito: [{ value: 0, disabled: true }]
  });

  ngOnInit() {
    this.verificarPermisos();
  }

  verificarPermisos() {
    const roles = this.loginService.usuarioActual?.roles || [];
    if (roles.includes('ADMIN')) {
      this.clienteForm.get('credito')?.enable();
    }

    const rolesPermitidosTipo = [
      'VER PERSONAS',
      'EDITAR PERSONAS',
      'VER USUARIOS',
      'EDITAR USUARIOS',
      'ADMIN',
      'VER FUNCIONARIOS',
      'CREAR FUNCIONARIOS',
      'EDITAR FUNCIONARIOS'
    ];

    const tienePermisoTipo = roles.some(r => rolesPermitidosTipo.includes(r));

    if (!tienePermisoTipo) {
      this.clienteForm.get('tipo')?.setValue(TipoCliente.NORMAL);
      this.clienteForm.get('tipo')?.disable();
    }
  }

  async registrar() {
    if (this.clienteForm.invalid) {
      const toast = await this.toastCtrl.create({
        message: 'Por favor complete los campos obligatorios.',
        duration: 2000,
        color: 'warning'
      });
      await toast.present();
      return;
    }

    const value = this.clienteForm.getRawValue();

    const personaInput: PersonaInput = {
      nombre: value.nombre?.toUpperCase(),
      apodo: value.apodo?.toUpperCase(),
      documento: value.documento?.toUpperCase(),
      telefono: value.telefono?.toUpperCase(),
      direccion: value.direccion?.toUpperCase(),
      nacimiento: value.nacimiento ? this.formatearFecha(value.nacimiento) : undefined,
      email: value.email?.toUpperCase(),
      usuarioId: +localStorage.getItem('usuarioId'),
      isCliente: true
    };

    try {
      const personaObs$ = await this.clienteService.onSavePersona(personaInput);
      const persona: any = await firstValueFrom(personaObs$);

      if (persona && persona.id) {
        const clienteInput: ClienteInput = {
          tipo: value.tipo,
          personaId: +persona.id,
          credito: value.credito,
          nombre: value.nombre?.toUpperCase(),
          direccion: value.direccion?.toUpperCase(),
          documento: value.documento?.toUpperCase()
        };

        const clienteObs$ = await this.clienteService.onSave(clienteInput);
        const cliente: any = await firstValueFrom(clienteObs$);

        if (cliente && cliente.id) {
          const toast = await this.toastCtrl.create({
            message: 'CLIENTE REGISTRADO EXITOSAMENTE.',
            duration: 2000,
            color: 'success'
          });
          await toast.present();
          this.navCtrl.back();
        }
      } else {
        throw new Error('NO SE PUDO GUARDAR LA INFORMACIÓN DE LA PERSONA.');
      }
    } catch (err: any) {
      console.error(err);
      const toast = await this.toastCtrl.create({
        message: 'ERROR: ' + (err.message || 'NO SE PUDO COMPLETAR EL REGISTRO.'),
        duration: 3000,
        color: 'danger'
      });
      await toast.present();
    }
  }

  private formatearFecha(fecha: string): string {
    if (!fecha) return '';
    return fecha.split('T')[0];
  }

  volver() {
    this.navCtrl.back();
  }
}
