import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { Platform } from '@ionic/angular';
import { BarcodeScanner } from '@awesome-cordova-plugins/barcode-scanner/ngx';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CargandoService } from 'src/app/services/cargando.service';
import { NotificacionService, TipoNotificacion } from 'src/app/services/notificacion.service';

@Component({
  selector: 'app-qr-scanner',
  templateUrl: './qr-scanner.component.html',
  styleUrls: ['./qr-scanner.component.scss'],
  providers: [BarcodeScanner]
})
export class QrScannerComponent implements OnInit {

  @Input() title: string = 'Escanear Código QR';
  @Input() placeholder: string = 'Ingresa el código manualmente';
  @Output() codigoEscaneado = new EventEmitter<string>();
  @Output() cancelar = new EventEmitter<void>();

  isWeb = false;
  codigoForm: FormGroup;
  showManualInput = false;

  constructor(
    private platform: Platform,
    private barcodeScanner: BarcodeScanner,
    private notificacionService: NotificacionService,
    private cargandoService: CargandoService,
    private fb: FormBuilder
  ) {
    this.isWeb = this.platform.platforms().includes('mobileweb');
    this.initForm();
  }

  ngOnInit() {
    if (this.isWeb) {
      this.showManualInput = true;
    }
  }

  private initForm() {
    this.codigoForm = this.fb.group({
      codigo: ['', [Validators.required, Validators.minLength(3)]]
    });
  }

  async onScanQR() {
    if (this.isWeb) {
      this.showManualInput = true;
      return;
    }

    let loading = await this.cargandoService.open('Abriendo cámara...');
    
    try {
      const barcodeData = await this.barcodeScanner.scan();
      this.notificacionService.open('Escaneado con éxito!', TipoNotificacion.SUCCESS, 2);
      this.codigoEscaneado.emit(barcodeData.text);
    } catch (error) {
      this.notificacionService.open('Error al escanear', TipoNotificacion.DANGER, 3);
      console.error('Error scanning:', error);
    } finally {
      this.cargandoService.close(loading);
    }
  }

  onIngresarCodigoManual() {
    if (this.codigoForm.valid) {
      const codigo = this.codigoForm.get('codigo').value;
      this.codigoEscaneado.emit(codigo.toUpperCase());
    }
  }

  onCancelar() {
    this.cancelar.emit();
  }

  onCambiarAModoManual() {
    this.showManualInput = true;
  }

  onCambiarACamara() {
    this.showManualInput = false;
    this.onScanQR();
  }
} 