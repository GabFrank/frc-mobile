import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TipoMarcacion, Jornada, EstadoJornada } from '../../models/marcacion.model';
import { MarcacionService } from '../../service/marcacion.service';
import { MainService } from 'src/app/services/main.service';
import { UsuarioService } from 'src/app/services/usuario.service';

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-tipo-marcacion',
  templateUrl: './tipo-marcacion.component.html',
  styleUrls: ['./tipo-marcacion.component.scss']
})
export class TipoMarcacionComponent implements OnInit {

  jornadasHoy: Jornada[] = [];
  ultimaJornada: Jornada | null = null;
  usuarioIdentificado: any = null;
  isLoading = true;

  usuarioId: number | null = null;
  entradaDisabled = false;
  salidaAlmuerzoDisabled = false;
  entradaAlmuerzoDisabled = false;
  salidaDisabled = false;

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

      // Si es ADMIN y no viene con un usuarioId específico, mandarlo a ingresar persona
      if (this.mainService.usuarioActual?.nickname?.toUpperCase() === 'ADMIN' && !qUsuarioId) {
        this.router.navigate(['ingreso-persona'], { relativeTo: this.route });
        return;
      }

      this.cargarEstadoJornadas();
    });
  }

  ionViewWillEnter() {
    this.cargarEstadoJornadas();
  }

  async cargarEstadoJornadas() {
    if (!this.usuarioId) return;
    this.isLoading = true;
    const hoy = new Date();
    const inicio = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate()).toISOString();
    const fin = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), 23, 59, 59).toISOString();

    try {
      (await this.marcacionService.onGetJornadasPorUsuario(this.usuarioId, inicio, fin))
        .pipe(untilDestroyed(this))
        .subscribe({
          next: (jornadas) => {
            this.jornadasHoy = jornadas || [];
            this.actualizarEstadoBotones();
            this.isLoading = false;
          },
          error: (err) => {
            console.error('Error al cargar jornadas', err);
            this.isLoading = false;
            this.resetearBotones();
          }
        });
    } catch (err) {
      console.error('Error al cargar jornadas', err);
      this.isLoading = false;
      this.resetearBotones();
    }
  }

  actualizarEstadoBotones() {
    this.resetearBotones();

    if (this.jornadasHoy.length === 0) {
      this.salidaAlmuerzoDisabled = true;
      this.entradaAlmuerzoDisabled = true;
      this.salidaDisabled = true;
      return;
    }

    this.ultimaJornada = [...this.jornadasHoy].sort((a, b) => a.id - b.id)[this.jornadasHoy.length - 1];
    const j = this.ultimaJornada;

    if (j.estado === EstadoJornada.NORMAL || j.marcacionSalida) {
      this.entradaDisabled = false;
      this.salidaAlmuerzoDisabled = true;
      this.entradaAlmuerzoDisabled = true;
      this.salidaDisabled = true;
      return;
    }

    if (j.marcacionEntrada) {
      this.entradaDisabled = true;

      if (!j.marcacionSalidaAlmuerzo) {
        this.salidaAlmuerzoDisabled = false;
        this.entradaAlmuerzoDisabled = true;
        this.salidaDisabled = false;
      } else if (!j.marcacionEntradaAlmuerzo) {
        this.salidaAlmuerzoDisabled = true;
        this.entradaAlmuerzoDisabled = false;
        this.salidaDisabled = true;
      } else if (!j.marcacionSalida) {
        this.salidaAlmuerzoDisabled = true;
        this.entradaAlmuerzoDisabled = true;
        this.salidaDisabled = false;
      }
    } else {
      this.entradaDisabled = false;
      this.salidaAlmuerzoDisabled = true;
      this.entradaAlmuerzoDisabled = true;
      this.salidaDisabled = true;
    }
  }

  getHoraMarcacion(tipo: 'ENTRADA' | 'SALIDA_ALMUERZO' | 'ENTRADA_ALMUERZO' | 'SALIDA'): string | null {
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
  }

  onLocalizacion(tipo: string, esSalidaAlmuerzo: boolean = false) {
    this.router.navigate(['localizacion/true'], {
      relativeTo: this.route,
      queryParams: { tipo, esSalidaAlmuerzo, usuarioId: this.usuarioId }
    });
  }

  async cargarDatosUsuario() {
    if (!this.usuarioId) return;
    this.usuarioService.onGetUsuario(this.usuarioId).subscribe(res => {
      this.usuarioIdentificado = res;
    });
  }

  onCambiarUsuario() {
    this.router.navigate(['ingreso-persona'], { relativeTo: this.route });
  }
}
