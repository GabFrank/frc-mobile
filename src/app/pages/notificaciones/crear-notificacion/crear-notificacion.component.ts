import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { NotificacionService, TipoNotificacion } from 'src/app/services/notificacion.service';
import { NotificacionService as NotificacionPageService } from '../notificacion.service';
import { Usuario } from '../models/usuario.model';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-crear-notificacion',
  templateUrl: './crear-notificacion.component.html',
  styleUrls: ['./crear-notificacion.component.scss'],
})
export class CrearNotificacionComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private notificacionService = inject(NotificacionService);
  private notificacionPageService = inject(NotificacionPageService);

  form: FormGroup;
  usuariosDisponibles: Usuario[] = [];
  usuariosFiltrados: Usuario[] = [];
  usuariosSeleccionados: number[] = [];
  cargando = false;
  guardando = false;

  tipoEnvio: 'TODOS' | 'ESPECIFICOS' = 'TODOS';
  mostrarBusquedaUsuarios = false;
  textoBusqueda = '';

  constructor() {
    this.initForm();
  }

  ngOnInit() {
    this.cargarUsuarios();
  }

  private initForm() {
    this.form = this.fb.group({
      titulo: ['', [Validators.required]],
      mensaje: ['', [Validators.required]]
    });
  }

  cargarUsuarios() {
    this.cargando = true;
    this.notificacionPageService.obtenerUsuariosActivos()
      .subscribe({
        next: (usuarios) => {
          this.usuariosDisponibles = usuarios;
          this.filtrarUsuarios();
          this.cargando = false;
        },
        error: (err) => {
          console.error('Error al cargar usuarios', err);
          this.notificacionService.openAlgoSalioMal('Error al cargar usuarios');
          this.cargando = false;
        }
      });
  }

  cambiarTipoEnvio(event: any) {
    this.tipoEnvio = event.detail.value;
    if (this.tipoEnvio === 'TODOS') {
      this.usuariosSeleccionados = [];
      this.mostrarBusquedaUsuarios = false;
    } else {
      this.mostrarBusquedaUsuarios = true;
    }
  }
  filtrarUsuarios() {
    if (!this.textoBusqueda) {
      this.usuariosFiltrados = this.usuariosDisponibles;
    } else {
      const texto = this.textoBusqueda.toLowerCase();
      this.usuariosFiltrados = this.usuariosDisponibles.filter(u =>
        u.nickname.toLowerCase().includes(texto) ||
        (u.persona?.nombre && u.persona.nombre.toLowerCase().includes(texto))
      );
    }
  }

  toggleUsuario(usuarioId: number) {
    const index = this.usuariosSeleccionados.indexOf(usuarioId);
    if (index === -1) {
      this.usuariosSeleccionados.push(usuarioId);
    } else {
      this.usuariosSeleccionados.splice(index, 1);
    }
  }

  esUsuarioSeleccionado(usuarioId: number): boolean {
    return this.usuariosSeleccionados.includes(usuarioId);
  }

  onTituloInput(event: any) {
    const input = event.target as HTMLInputElement;
    const value = input.value;
    input.value = value.toUpperCase();
    this.form.get('titulo').setValue(value.toUpperCase(), { emitEvent: false });
  }

  enviar() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { titulo, mensaje } = this.form.value;

    if (this.tipoEnvio === 'ESPECIFICOS' && this.usuariosSeleccionados.length === 0) {
      this.notificacionService.warn('Debe seleccionar al menos un usuario');
      return;
    }

    this.guardando = true;
    const usuariosIds = this.tipoEnvio === 'ESPECIFICOS' ? this.usuariosSeleccionados : null;

    this.notificacionPageService.enviarNotificacionPersonalizada(titulo.toUpperCase(), mensaje, this.tipoEnvio, usuariosIds)
      .pipe(finalize(() => this.guardando = false))
      .subscribe({
        next: (res) => {
          if (res) {
            this.notificacionService.success('Notificación enviada correctamente');
            this.router.navigate(['/notificacion']);
          } else {
            this.notificacionService.openAlgoSalioMal('No se pudo enviar la notificación');
          }
        },
        error: (err) => {
          console.error('Error al enviar notificación', err);
          this.notificacionService.openAlgoSalioMal('Error al enviar notificación');
        }
      });
  }
}

