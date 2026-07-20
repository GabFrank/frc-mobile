import { Component, OnInit } from '@angular/core';
import { UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { VentaTarjetaService } from '../venta-tarjeta.service';
import { VentaTarjeta, VentaTarjetaEstado, VentaTarjetaInput } from '../venta-tarjeta.model';
import { MainService } from 'src/app/services/main.service';
import { NotificacionService, TipoNotificacion } from 'src/app/services/notificacion.service';
import { CargandoService } from 'src/app/services/cargando.service';
import { DialogoService } from 'src/app/services/dialogo.service';

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-add-venta-tarjeta',
  templateUrl: './add-venta-tarjeta.component.html',
  styleUrls: ['./add-venta-tarjeta.component.scss']
})
export class RegistroVentaTarjetaComponent implements OnInit {

  form = new UntypedFormGroup({
    codigoAutorizacion: new UntypedFormControl(null, [Validators.required]),
    numeroBoleta: new UntypedFormControl(null, [Validators.required]),
    monto: new UntypedFormControl({ value: null, disabled: true })
  });

  ventaId: number;
  ventaTarjetaId: number;
  cajaId: number;
  sucursalId: number;
  fotoPreview: string = null;
  procesandoOcr = false;
  guardando = false;
  cargandoRegistro = false;

  registroPendiente: VentaTarjeta = null;
  private montoEscaneado: number = null;

  get simboloMoneda(): string {
    return this.registroPendiente?.terminalPos?.moneda?.simbolo || 'Gs.';
  }

  get esGuaranies(): boolean {
    return !this.registroPendiente?.terminalPos?.moneda
      || this.simboloMoneda === 'Gs.'
      || this.simboloMoneda === '₲';
  }

  private ajustarValidadoresPorMoneda() {
    const boletaControl = this.form.get('numeroBoleta');
    if (this.esGuaranies) {
      boletaControl.setValidators([Validators.required]);
    } else {
      boletaControl.clearValidators();
    }
    boletaControl.updateValueAndValidity();
  }

  constructor(
    private ventaTarjetaService: VentaTarjetaService,
    private mainService: MainService,
    private notificacionService: NotificacionService,
    private cargandoService: CargandoService,
    private dialogoService: DialogoService,
    private router: Router,
    private route: ActivatedRoute,
    private location: Location
  ) {}

  ngOnInit() {
    const state = history.state;
    this.ventaId = state?.ventaId;
    this.ventaTarjetaId = state?.ventaTarjetaId;
    this.cajaId = state?.cajaId;
    this.sucursalId = state?.sucursalId;

    if (state?.monto) {
      this.form.get('monto').setValue(state.monto);
    }

    if (!this.ventaId || !this.cajaId) {
      this.notificacionService.open('Datos de venta no encontrados. Escanee el QR nuevamente.', TipoNotificacion.DANGER, 4);
      this.location.back();
      return;
    }

    this.cargarRegistroPendiente();
  }

  private cargarRegistroPendiente() {
    this.cargandoRegistro = true;
    const consulta$ = this.ventaTarjetaId
      ? this.ventaTarjetaService.onGetPorId(this.ventaTarjetaId, this.sucursalId)
      : this.ventaTarjetaService.onGetPorVentaId(this.ventaId, this.sucursalId);

    consulta$
      .pipe(untilDestroyed(this))
      .subscribe(registro => {
        this.cargandoRegistro = false;
        if (registro) {
          this.registroPendiente = registro;
          if (!this.form.get('monto').value && registro.monto) {
            this.form.get('monto').setValue(registro.monto);
          }
          this.ajustarValidadoresPorMoneda();
        }
      }, () => {
        this.cargandoRegistro = false;
      });
  }

  async tomarFoto() {
    await this.capturarImagen(CameraSource.Camera);
  }

  async seleccionarDeGaleria() {
    await this.capturarImagen(CameraSource.Photos);
  }

  private async capturarImagen(source: CameraSource) {
    try {
      const photo = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source
      });

      this.fotoPreview = photo.dataUrl;
      await this.procesarOcr(photo.dataUrl);
    } catch (err) {
      if (err?.message !== 'User cancelled photos app') {
        this.notificacionService.open('No se pudo acceder a la cámara', TipoNotificacion.DANGER, 3);
      }
    }
  }

  private preprocessImageForOcr(dataUrl: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const MIN_WIDTH = 1200;
        const scale = img.width < MIN_WIDTH ? Math.ceil(MIN_WIDTH / img.width) : 1;
        const canvas = document.createElement('canvas');
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror = reject;
      img.src = dataUrl;
    });
  }

  private async procesarOcr(dataUrl: string) {
    this.procesandoOcr = true;
    const loading = await this.cargandoService.open('Procesando imagen...', false);
    try {
      const processedDataUrl = await this.preprocessImageForOcr(dataUrl);
      console.log('[OCR] Iniciando reconocimiento...');
      const { createWorker } = await import('tesseract.js');
      const worker = await createWorker('spa');
      const { data: { text } } = await worker.recognize(processedDataUrl);
      await worker.terminate();
      console.log('[OCR] Texto crudo:\n---\n' + text + '\n---');
      this.extraerCampos(text);
    } catch (err) {
      console.error('OCR error:', err);
      this.notificacionService.open(
        'No se pudo procesar la imagen. Complete los campos manualmente.',
        TipoNotificacion.WARN,
        4
      );
    } finally {
      this.cargandoService.close(loading);
      this.procesandoOcr = false;
    }
  }

  private extraerCampos(texto: string) {
    let authMatch: RegExpMatchArray | null;

    if (this.esGuaranies) {
      // Guaraníes: patrones locales
      authMatch = texto.match(/c\.?\s*aut(?:orizaci[oó]n)?\s*[,:\s#]+([\d.,]{4,15})/i)
        || texto.match(/autorizaci[oó]n\s*[,:\s#]+([\d.,]{4,15})/i);
    } else {
      // Reales y otras monedas: sinónimos típicos de POS brasileño/extranjero
      authMatch = texto.match(/cod\.?\s*trans\.?\s*[,.:\s]+([\d.,]{4,15})/i)
        || texto.match(/aut\.?\s*pag\.?\s*[,.:\s]+([\d.,]{4,15})/i)
        || texto.match(/autorizaci[oó]n\s*[,.:\s]+([\d.,]{4,15})/i)
        || texto.match(/autoriza[cç][aã]o\s*[,.:\s]+([\d.,]{4,15})/i)
        || texto.match(/c[oó]d\.?\s*aut(?:or)?\.?\s*[,.:\s]+([\d.,]{4,15})/i)
        || texto.match(/(?:nsu|aut|auth)\s*[,:\s#]+([\d.,]{4,15})/i);
    }

    console.log('[OCR] authMatch:', authMatch?.[0], '→ valor:', authMatch?.[1]);
    if (authMatch) {
      // Eliminar comas/puntos que el OCR haya insertado erróneamente dentro del código
      const authValor = authMatch[1].replace(/[.,]/g, '').trim();
      this.form.get('codigoAutorizacion').setValue(authValor);
    }

    // Boleta: solo relevante para guaraníes
    let boletaMatch: RegExpMatchArray | null = null;
    if (this.esGuaranies) {
      // Permite espacios internos (OCR frecuentemente los inserta en números largos)
      boletaMatch = texto.match(/boleta\s*[:\s#]\s*(\d+(?:\s\d+){0,4})/i)
        || texto.match(/(?:n[rú]o?|ticket|comprobante|recibo)\s*[:\s#]\s*(\d+(?:\s\d+){0,4})/i);
      const boletaValor = boletaMatch ? boletaMatch[1].replace(/\s+/g, '') : null;
      console.log('[OCR] boletaMatch:', boletaMatch?.[0], '→ valor:', boletaValor);
      if (boletaValor && boletaValor.length >= 4) {
        this.form.get('numeroBoleta').setValue(boletaValor);
      }
    }

    // Monto escaneado — solo para auditoría, no modifica el campo del formulario
    this.montoEscaneado = null;
    if (this.esGuaranies) {
      const guaraniMatch = texto.match(/g\s*s?\s*[.\s]\s*([\d.]+)/i)
        || texto.match(/(?:total|monto|importe)\s*[:\s]\s*([\d.]+)/i);
      if (guaraniMatch) {
        const valor = parseInt(guaraniMatch[1].replace(/\./g, ''), 10);
        if (!isNaN(valor) && valor > 0) this.montoEscaneado = valor;
      }
    } else {
      const esBRL = this.simboloMoneda === 'R$' || this.simboloMoneda === 'BRL';
      const montoMatch = texto.match(/(?:total|monto|importe|valor)\s*[:\s]?\s*([\d.,]+)/i);
      if (montoMatch) {
        let raw = montoMatch[1];
        raw = esBRL ? raw.replace(/\./g, '').replace(',', '.') : raw.replace(/,/g, '');
        const valor = parseFloat(raw);
        if (!isNaN(valor) && valor > 0) this.montoEscaneado = valor;
      }
    }

    const hayDatos = authMatch || boletaMatch;
    if (hayDatos) {
      this.notificacionService.open('Campos extraídos. Verifique antes de guardar.', TipoNotificacion.SUCCESS, 4);
    } else {
      this.notificacionService.open('No se pudieron extraer campos. Complete manualmente.', TipoNotificacion.WARN, 4);
    }
  }

  async guardar() {
    if (!this.fotoPreview) {
      this.notificacionService.open('Debe tomar la foto del comprobante antes de guardar', TipoNotificacion.WARN, 4);
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.notificacionService.open('Complete los campos requeridos', TipoNotificacion.WARN, 3);
      return;
    }

    if (this.montoEscaneado != null) {
      const montoOriginal = Number(this.registroPendiente?.monto ?? history.state?.monto);
      const tolerancia = this.esGuaranies ? 1 : 0.01;
      if (Math.abs(this.montoEscaneado - montoOriginal) > tolerancia) {
        const simbolo = this.simboloMoneda;
        const fmtOriginal = this.esGuaranies
          ? `${Math.round(montoOriginal).toLocaleString()} ${simbolo}`
          : `${simbolo} ${montoOriginal.toFixed(2)}`;
        const fmtEscaneado = this.esGuaranies
          ? `${Math.round(this.montoEscaneado).toLocaleString()} ${simbolo}`
          : `${simbolo} ${this.montoEscaneado.toFixed(2)}`;
        const resultado = await this.dialogoService.open(
          'Monto diferente',
          `El monto escaneado del ticket (${fmtEscaneado}) no coincide con el monto original de la venta (${fmtOriginal}). ¿Desea continuar de todas formas?`
        );
        if (resultado?.role !== 'aceptar') return;
      }
    }

    this.guardando = true;
    const usuarioId = this.mainService.usuarioActual?.id;

    if (this.registroPendiente?.id) {
      // Actualizar el registro pendiente creado por el desktop
      const input: VentaTarjetaInput = {
        id: this.registroPendiente.id,
        sucursalId: this.sucursalId,
        codigoAutorizacion: this.form.get('codigoAutorizacion').value,
        numeroBoleta: this.form.get('numeroBoleta').value,
        monto: this.registroPendiente.monto,
        montoEscaneado: this.montoEscaneado ?? undefined,
        estado: VentaTarjetaEstado.COMPLETADO,
        usuarioId
      };

      this.ventaTarjetaService.onUpdate(input)
        .pipe(untilDestroyed(this))
        .subscribe(res => {
          this.guardando = false;
          if (res?.id) {
            this.notificacionService.open('Venta con tarjeta registrada correctamente', TipoNotificacion.SUCCESS, 3);
            this.router.navigate(['../'], { relativeTo: this.route });
          } else {
            this.notificacionService.open('Error al guardar. Intente nuevamente.', TipoNotificacion.DANGER, 3);
          }
        }, () => {
          this.guardando = false;
          this.notificacionService.open('Error de conexión', TipoNotificacion.DANGER, 3);
        });
    } else {
      // No existe registro previo (el cajero omitió el QR): crear directo como COMPLETADO
      const input: VentaTarjetaInput = {
        sucursalId: this.sucursalId,
        ventaId: this.ventaId,
        cajaId: this.cajaId,
        codigoAutorizacion: this.form.get('codigoAutorizacion').value,
        numeroBoleta: this.form.get('numeroBoleta').value,
        monto: history.state?.monto,
        montoEscaneado: this.montoEscaneado ?? undefined,
        estado: VentaTarjetaEstado.COMPLETADO,
        usuarioId
      };

      this.ventaTarjetaService.onSave(input)
        .pipe(untilDestroyed(this))
        .subscribe(res => {
          this.guardando = false;
          if (res?.id) {
            this.notificacionService.open('Venta con tarjeta registrada correctamente', TipoNotificacion.SUCCESS, 3);
            this.router.navigate(['../'], { relativeTo: this.route });
          } else {
            this.notificacionService.open('Error al guardar. Intente nuevamente.', TipoNotificacion.DANGER, 3);
          }
        }, () => {
          this.guardando = false;
          this.notificacionService.open('Error de conexión', TipoNotificacion.DANGER, 3);
        });
    }
  }

  onBack() {
    this.location.back();
  }
}
