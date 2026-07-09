import { Location } from '@angular/common';
import { Component } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { first } from 'rxjs/operators';
import { Proveedor } from 'src/app/pages/personas/proveedor/proveedor.model';
import { ProveedorService } from 'src/app/pages/personas/proveedor/proveedor.service';
import { BarcodeScannerService } from 'src/app/services/barcode-scanner.service';
import { MainService } from 'src/app/services/main.service';
import { NotificacionService } from 'src/app/services/notificacion.service';
import {
  RetiroBloqueResultado,
  RetiroCajaView,
  RetiroDevolucionResultado,
  RetiroProveedorConsolidado,
} from './retiro-proveedor.model';
import { RetiroProveedorService } from './retiro-proveedor.service';

@UntilDestroy()
@Component({
  selector: 'app-retiro-proveedor',
  templateUrl: './retiro-proveedor.component.html',
  styleUrls: ['./retiro-proveedor.component.scss'],
})
export class RetiroProveedorComponent {
  proveedorTexto: string;
  proveedoresList: Proveedor[] = [];
  selectedProveedor: Proveedor;
  buscandoProveedor = false;

  consolidado: RetiroProveedorConsolidado;
  cajas: RetiroCajaView[] = [];
  verificadasCount = 0;
  cargando = false;

  guardando = false;
  resultados: RetiroDevolucionResultado[] = [];

  constructor(
    private _location: Location,
    private retiroProveedorService: RetiroProveedorService,
    private proveedorService: ProveedorService,
    private barcodeScanner: BarcodeScannerService,
    private notificacionService: NotificacionService,
    private mainService: MainService
  ) {}

  async onBuscarProveedor() {
    const texto = this.proveedorTexto?.trim();
    if (!texto) {
      this.notificacionService.warn('Ingrese un nombre o documento');
      return;
    }
    this.buscandoProveedor = true;
    (await this.proveedorService.onSearch(texto))
      .pipe(untilDestroyed(this))
      .subscribe((res) => {
        this.buscandoProveedor = false;
        this.proveedoresList = res || [];
        if (this.proveedoresList.length === 0) {
          this.notificacionService.warn('Proveedor no encontrado');
        }
      });
  }

  onSelectProveedor(proveedor: Proveedor) {
    this.selectedProveedor = proveedor;
    this.proveedoresList = [];
    this.cargarConsolidado();
  }

  onQuitarProveedor() {
    this.selectedProveedor = null;
    this.consolidado = null;
    this.cajas = [];
    this.verificadasCount = 0;
    this.resultados = [];
  }

  async cargarConsolidado() {
    if (this.selectedProveedor == null) return;
    this.cargando = true;
    this.consolidado = null;
    this.cajas = [];
    this.verificadasCount = 0;
    this.resultados = [];
    (await this.retiroProveedorService.onGetConsolidado(this.selectedProveedor.id))
      .pipe(first(), untilDestroyed(this))
      .subscribe(
        (res: RetiroProveedorConsolidado) => {
          this.cargando = false;
          this.consolidado = res;
          this.cajas = this.aplanarCajas(res);
          if (this.cajas.length === 0) {
            this.notificacionService.warn('No hay cajas pendientes de retiro');
          }
        },
        () => {
          this.cargando = false;
        }
      );
  }

  /**
   * Aplana las cajas de todos los grupos/sucursales en una unica lista,
   * conservando el nombre de la sucursal de origen y agregando el flag de
   * verificacion en false.
   */
  private aplanarCajas(consolidado: RetiroProveedorConsolidado): RetiroCajaView[] {
    if (consolidado?.grupos == null) return [];
    const cajas: RetiroCajaView[] = [];
    for (const grupo of consolidado.grupos) {
      for (const caja of grupo.cajas || []) {
        cajas.push({
          ...caja,
          sucursalNombre: grupo.sucursalNombre,
          verificada: false,
        });
      }
    }
    return cajas;
  }

  onEscanearCaja() {
    this.barcodeScanner.scan().subscribe((res) => {
      if (!res.cancelled && res.text != null && res.text !== '') {
        this.verificarCaja(res.text.trim());
      }
    });
  }

  private verificarCaja(identificador: string) {
    const caja = this.cajas.find((c) => c.identificador === identificador);
    if (caja == null) {
      this.notificacionService.warn(`Caja ${identificador} no pertenece a este retiro`);
      return;
    }
    if (caja.verificada) {
      this.notificacionService.warn(`Caja ${identificador} ya estaba verificada`);
      return;
    }
    caja.verificada = true;
    this.verificadasCount++;
    this.notificacionService.success(`Caja ${identificador} verificada`);
  }

  private devolucionIdsVerificados(): number[] {
    const ids = this.cajas
      .filter((c) => c.verificada)
      .map((c) => c.devolucionId);
    return Array.from(new Set(ids));
  }

  async onConfirmarRetiro() {
    const devolucionIds = this.devolucionIdsVerificados();
    if (devolucionIds.length === 0) {
      this.notificacionService.warn('Verifique al menos una caja antes de confirmar');
      return;
    }

    const usuarioId =
      this.mainService.usuarioActual?.id ?? +localStorage.getItem('usuarioId');

    this.guardando = true;
    this.resultados = [];
    (await this.retiroProveedorService.onRetirarEnBloque(devolucionIds, usuarioId))
      .pipe(first(), untilDestroyed(this))
      .subscribe(
        (res: RetiroBloqueResultado) => {
          this.guardando = false;
          this.resultados = res?.resultados || [];
          const ok = this.resultados.filter((r) => r.ok).length;
          const total = this.resultados.length;
          if (total > 0 && ok === total) {
            this.notificacionService.success(`Retiro confirmado (${ok}/${total})`);
          } else if (ok > 0) {
            this.notificacionService.warn(`Retiro parcial: ${ok}/${total} devoluciones`);
          } else {
            this.notificacionService.danger('No se pudo retirar ninguna devolucion');
          }
        },
        () => {
          this.guardando = false;
          this.notificacionService.danger('No se pudo confirmar el retiro');
        }
      );
  }

  onBack() {
    this._location.back();
  }
}
