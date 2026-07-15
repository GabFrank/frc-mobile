import { Location } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { first } from 'rxjs/operators';
import { Sucursal } from 'src/app/domains/empresarial/sucursal/sucursal.model';
import { SucursalService } from 'src/app/domains/empresarial/sucursal/sucursal.service';
import { Proveedor } from 'src/app/pages/personas/proveedor/proveedor.model';
import { ProveedorService } from 'src/app/pages/personas/proveedor/proveedor.service';
import { BarcodeScannerService } from 'src/app/services/barcode-scanner.service';
import { MainService } from 'src/app/services/main.service';
import { NotificacionService } from 'src/app/services/notificacion.service';
import { PdfViewerService } from 'src/app/services/pdf-viewer.service';
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
export class RetiroProveedorComponent implements OnInit {
  proveedorTexto: string;
  proveedoresList: Proveedor[] = [];
  selectedProveedor: Proveedor;
  buscandoProveedor = false;

  sucursales: Sucursal[] = [];
  selectedSucursalId: number | null = null; // null = Todas

  permitirManual = true; // config: verificar caja sin escanear

  consolidado: RetiroProveedorConsolidado;
  cajas: RetiroCajaView[] = [];
  verificadasCount = 0;
  cargando = false;

  guardando = false;
  resultados: RetiroDevolucionResultado[] = [];

  constructor(
    private _location: Location,
    private router: Router,
    private retiroProveedorService: RetiroProveedorService,
    private proveedorService: ProveedorService,
    private barcodeScanner: BarcodeScannerService,
    private notificacionService: NotificacionService,
    private mainService: MainService,
    private sucursalService: SucursalService,
    private pdfViewerService: PdfViewerService
  ) {}

  async ngOnInit() {
    (await this.sucursalService.onGetAllSucursales())
      .pipe(untilDestroyed(this))
      .subscribe((res) => {
        this.sucursales = (res || []).filter(
          (s) => s.nombre != 'SERVIDOR' && s.nombre != 'COMPRAS'
        );
      });
    (await this.retiroProveedorService.onGetConfiguracion())
      .pipe(untilDestroyed(this))
      .subscribe((cfg) => {
        // Default liberar (true) si la config no vino.
        this.permitirManual = cfg?.retiroPermitirSeleccionManual !== false;
      });
  }

  /** Verificacion manual (sin escanear), si la config lo permite. */
  onToggleManual(caja: RetiroCajaView) {
    if (!this.permitirManual) return;
    if (caja.verificada) {
      caja.verificada = false;
      this.verificadasCount = Math.max(0, this.verificadasCount - 1);
    } else {
      caja.verificada = true;
      this.verificadasCount++;
    }
  }

  onSucursalChange(ev: any) {
    const val = ev?.detail?.value;
    this.selectedSucursalId = val == null ? null : +val;
    if (this.selectedProveedor != null) this.cargarConsolidado();
  }

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
    (await this.retiroProveedorService.onGetConsolidado(
      this.selectedProveedor.id,
      this.selectedSucursalId ?? undefined
    ))
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
          const okIds = this.resultados.filter((r) => r.ok).map((r) => r.id);
          const ok = okIds.length;
          const total = this.resultados.length;
          if (total > 0 && ok === total) {
            this.notificacionService.success(`Retiro confirmado (${ok}/${total})`);
          } else if (ok > 0) {
            this.notificacionService.warn(`Retiro parcial: ${ok}/${total} devoluciones`);
          } else {
            this.notificacionService.danger('No se pudo retirar ninguna devolucion');
          }
          if (ok > 0) {
            // Sacar de la lista las cajas ya retiradas para no re-enviarlas
            // (evita el doble submit) y recalcular el conteo verificado.
            this.cajas = this.cajas.filter((c) => !okIds.includes(c.devolucionId));
            this.verificadasCount = this.cajas.filter((c) => c.verificada).length;
            // Bajar el comprobante para compartir con el proveedor.
            this.descargarRemito(okIds);
            // Si ya no quedan cajas pendientes, ir al historial de retiros.
            if (this.cajas.length === 0) {
              this.router.navigate(['/operaciones/devolucion/historial-retiros']);
            }
          }
        },
        () => {
          this.guardando = false;
          this.notificacionService.danger('No se pudo confirmar el retiro');
        }
      );
  }

  private async descargarRemito(devolucionIds: number[]) {
    (await this.retiroProveedorService.onGetRemito(devolucionIds))
      .pipe(first(), untilDestroyed(this))
      .subscribe(
        async (base64) => {
          if (base64) {
            await this.pdfViewerService.openPdfFromBase64(
              base64,
              `comprobante_retiro_${devolucionIds.join('-')}.pdf`
            );
          }
        },
        () => this.notificacionService.warn('No se pudo generar el comprobante')
      );
  }

  onBack() {
    this._location.back();
  }
}
