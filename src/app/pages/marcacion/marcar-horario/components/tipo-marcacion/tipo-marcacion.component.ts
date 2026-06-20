import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { EstadoMarcacionUsuario, Jornada } from '../../models/marcacion.model';
import { MarcacionService } from '../../service/marcacion.service';
import { MainService } from 'src/app/services/main.service';
import { UsuarioService } from 'src/app/services/usuario.service';
import { Usuario } from 'src/app/domains/personas/usuario.model';

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-tipo-marcacion',
  templateUrl: './tipo-marcacion.component.html',
  styleUrls: ['./tipo-marcacion.component.scss']
})
export class TipoMarcacionComponent implements OnInit {

  jornadasHoy: Jornada[] = [];
  ultimaJornada: Jornada | null = null;
  usuarioIdentificado: Usuario | null = null;
  isLoading = false;

  usuarioId: number | null = null;
  entradaDisabled = false;
  salidaAlmuerzoDisabled = false;
  entradaAlmuerzoDisabled = false;
  salidaDisabled = false;

  horaEntrada: string | null = null;
  horaSalidaAlmuerzo: string | null = null;
  horaEntradaAlmuerzo: string | null = null;
  horaSalida: string | null = null;

  isAdmin = false;
  nombreUsuario = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private marcacionService: MarcacionService,
    public mainService: MainService,
    private usuarioService: UsuarioService
  ) { }

  ngOnInit() {
    this.route.queryParamMap.pipe(untilDestroyed(this)).subscribe(params => {
      const qUsuarioId = params.get('usuarioId');
      if (qUsuarioId) {
        this.usuarioId = +qUsuarioId;
        this.cargarDatosUsuario();
      } else {
        this.usuarioId = this.mainService.usuarioActual.id;
        this.usuarioIdentificado = this.mainService.usuarioActual;
      }
      this.actualizarInformacionUsuario();
      this.cargarEstadoJornadas();
    });
  }

  ionViewWillEnter() {
    const qUsuarioId = this.route.snapshot.queryParamMap.get('usuarioId');
    if (this.mainService.usuarioActual?.nickname?.toUpperCase() === 'ADMIN' && !qUsuarioId) {
      return;
    }
    this.cargarEstadoJornadas();
  }

  async cargarEstadoJornadas() {
    if (!this.usuarioId || this.isLoading) return;
    this.isLoading = true;

    try {
      (await this.marcacionService.onGetEstadoMarcacionUsuario(this.usuarioId))
        .pipe(untilDestroyed(this))
        .subscribe({
          next: (estado) => {
            this.aplicarEstadoMarcacion(estado);
            this.isLoading = false;
          },
          error: (err) => {
            console.error('Error al cargar estado de marcación', err);
            this.isLoading = false;
            this.resetearBotones();
          }
        });
    } catch (err) {
      console.error('Error al cargar estado de marcación', err);
      this.isLoading = false;
      this.resetearBotones();
    }
  }

  private aplicarEstadoMarcacion(estado: EstadoMarcacionUsuario | null | undefined) {
    this.resetearBotones();
    if (!estado) {
      this.ultimaJornada = null;
      this.jornadasHoy = [];
      this.entradaDisabled = false;
      this.salidaAlmuerzoDisabled = true;
      this.entradaAlmuerzoDisabled = true;
      this.salidaDisabled = true;
      return;
    }

    this.ultimaJornada = estado.jornadaRelevante ?? null;
    this.jornadasHoy = this.ultimaJornada ? [this.ultimaJornada] : [];

    this.entradaDisabled = !estado.puedeMarcarEntrada;
    this.salidaDisabled = !estado.puedeMarcarSalida;
    this.salidaAlmuerzoDisabled = !estado.puedeMarcarSalidaAlmuerzo;
    this.entradaAlmuerzoDisabled = !estado.puedeMarcarEntradaAlmuerzo;

    this.actualizarHorasMarcacion();
  }

  private actualizarHorasMarcacion() {
    this.horaEntrada = this.getHoraMarcacion('ENTRADA');
    this.horaSalidaAlmuerzo = this.getHoraMarcacion('SALIDA_ALMUERZO');
    this.horaEntradaAlmuerzo = this.getHoraMarcacion('ENTRADA_ALMUERZO');
    this.horaSalida = this.getHoraMarcacion('SALIDA');
  }

  private getHoraMarcacion(tipo: 'ENTRADA' | 'SALIDA_ALMUERZO' | 'ENTRADA_ALMUERZO' | 'SALIDA'): string | null {
    if (!this.ultimaJornada) return null;
    let marcacion = null;
    switch (tipo) {
      case 'ENTRADA': marcacion = this.ultimaJornada.marcacionEntrada; break;
      case 'SALIDA_ALMUERZO': marcacion = this.ultimaJornada.marcacionSalidaAlmuerzo; break;
      case 'ENTRADA_ALMUERZO': marcacion = this.ultimaJornada.marcacionEntradaAlmuerzo; break;
      case 'SALIDA': marcacion = this.ultimaJornada.marcacionSalida; break;
    }

    if (!marcacion) return null;
    const fecha = marcacion.tipo === 'ENTRADA' ? marcacion.fechaEntrada : marcacion.fechaSalida;
    if (!fecha) return null;

    const date = new Date(fecha);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  resetearBotones() {
    this.entradaDisabled = false;
    this.salidaAlmuerzoDisabled = false;
    this.entradaAlmuerzoDisabled = false;
    this.salidaDisabled = false;
    this.horaEntrada = null;
    this.horaSalidaAlmuerzo = null;
    this.horaEntradaAlmuerzo = null;
    this.horaSalida = null;
  }

  private actualizarInformacionUsuario() {
    this.isAdmin = this.mainService.usuarioActual?.nickname?.toUpperCase() === 'ADMIN';
    this.nombreUsuario = this.usuarioIdentificado?.persona?.nombreCompleto || this.usuarioIdentificado?.nickname || '';
  }

  onLocalizacion(tipo: string, esSalidaAlmuerzo: boolean = false) {
    const isLoggedAsAdmin = this.mainService.usuarioActual?.nickname?.toUpperCase() === 'ADMIN';
    const sucursalPersistida = this.marcacionService.obtenerSucursalPersistida();
    if (isLoggedAsAdmin && sucursalPersistida) {
      this.router.navigate(['/marcacion/localizacion/true/identificacion/' + sucursalPersistida.id], {
        queryParams: { tipo, esSalidaAlmuerzo, usuarioId: this.usuarioId },
        queryParamsHandling: 'merge'
      });
      return;
    }
    this.router.navigate(['localizacion/true'], {
      relativeTo: this.route,
      queryParams: { tipo, esSalidaAlmuerzo, usuarioId: this.usuarioId }
    });
  }

  async cargarDatosUsuario() {
    if (!this.usuarioId) return;
    this.usuarioService.onGetUsuario(this.usuarioId).pipe(untilDestroyed(this)).subscribe((res: Usuario) => {
      this.usuarioIdentificado = res;
      this.actualizarInformacionUsuario();
    });
  }

  onCambiarUsuario() {
    this.router.navigate(['ingreso-persona'], { relativeTo: this.route });
  }
}
