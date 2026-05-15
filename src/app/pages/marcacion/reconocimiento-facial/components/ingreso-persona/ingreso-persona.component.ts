import { Component, OnInit } from '@angular/core';
import { Location } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { UsuarioService } from 'src/app/services/usuario.service';
import { NotificacionService } from 'src/app/services/notificacion.service';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Usuario } from 'src/app/domains/personas/usuario.model';

@UntilDestroy()
@Component({
  selector: 'app-ingreso-persona',
  templateUrl: './ingreso-persona.component.html',
  styleUrls: ['./ingreso-persona.component.scss']
})
export class IngresoPersonaComponent implements OnInit {

  personaIdInput: string = '';
  sucursalId: number;
  isLoading = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private location: Location,
    private usuarioService: UsuarioService,
    private notificacionService: NotificacionService
  ) { }

  ngOnInit() {
    this.route.paramMap.pipe(untilDestroyed(this)).subscribe(res => {
      this.sucursalId = +res.get('sucId');
    });
  }

  ionViewWillEnter() {
    this.personaIdInput = '';
    this.isLoading = false;
  }

  onSiguiente() {
    if (this.isLoading) return;
    if (!this.personaIdInput) {
      this.notificacionService.warn('Debe ingresar un ID de persona');
      return;
    }

    this.isLoading = true;
    this.usuarioService.onGetUsuarioPorPersonaId(+this.personaIdInput).pipe(untilDestroyed(this)).subscribe({
      next: (usuario: Usuario) => {
        this.isLoading = false;
        if (usuario && usuario.id) {
          this.router.navigate(['/marcacion'], {
            queryParams: { usuarioId: usuario.id },
            queryParamsHandling: 'merge'
          });
        } else {
          this.notificacionService.danger('No se encontró un usuario para el ID de persona ingresado');
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.notificacionService.danger('Error al buscar el usuario');
        console.error(err);
      }
    });
  }

  onBack() {
    this.location.back();
  }
}
