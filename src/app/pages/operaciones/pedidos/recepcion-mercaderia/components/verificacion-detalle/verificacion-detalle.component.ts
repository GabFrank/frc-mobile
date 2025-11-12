import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { RecepcionMercaderiaItemVariacionInput } from 'src/app/pages/operaciones/pedidos/graphql/saveRecepcionMercaderiaItem';
import { RecepcionMercaderiaItemVariacionService } from 'src/app/pages/operaciones/pedidos/recepcion-mercaderia-item-variacion.service';
import { RecepcionMercaderiaItem, MetodoVerificacion, MotivoVerificacionManual, MotivoRechazoFisico } from 'src/app/domains/operaciones/pedido/recepcion-mercaderia-item.model';
import { Presentacion } from 'src/app/domains/productos/presentacion.model';
import { PresentacionService } from 'src/app/services/presentacion/presentacion.service';
import { dateToString } from 'src/app/generic/utils/dateUtils';
import { debounceTime } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { PopOverService, PopoverSize } from 'src/app/services/pop-over.service';
import { WheelDatePickerModalComponent } from 'src/app/components/wheel-date-picker-modal/wheel-date-picker-modal.component';
import { DialogoService } from 'src/app/services/dialogo.service';
import { ModalController } from '@ionic/angular';

// Interface para el output del evento verificar
interface VerificacionProductoOutput {
  id: number;
  recepcionMercaderiaId: number;
  usuarioId: number;
  observaciones?: string;
  metodoVerificacion: MetodoVerificacion;
  variaciones: RecepcionMercaderiaItemVariacionInput[];
}

@Component({
  selector: 'app-verificacion-detalle',
  templateUrl: './verificacion-detalle.component.html',
  styleUrls: ['./verificacion-detalle.component.scss']
})
export class VerificacionDetalleComponent implements OnInit, OnDestroy {

  @Input() item: RecepcionMercaderiaItem;
  @Input() sucursalId: number;
  @Input() recepcionId: number;
  @Input() readOnly: boolean = false; // Nuevo parámetro para modo solo lectura
  @Output() verificarProducto = new EventEmitter<VerificacionProductoOutput>();
  @Output() cancelar = new EventEmitter<void>();

  verificacionForm: FormGroup;
  presentaciones: Presentacion[] = [];
  isLoadingPresentaciones = false;

  // Totales y resumen
  cantidadEsperada: number;
  cantidadRecibidaTotal: number = 0;
  cantidadRechazadaTotal: number = 0;
  diferenciaCantidad: number = 0;
  diferenciaColor: string;

  // Enums para el template
  motivosRechazo = Object.values(MotivoRechazoFisico);

  // Propiedades computadas para el template (evitar getters en HTML)
  productoDescripcion: string;
  productoCodigo: string;
  motivosRechazoFormateados: string[];
  presentacionPorDefecto: Presentacion | null = null;
  cantidadPorPresentacionPorDefecto: number = 0;
  cantidadRecibidaEnUnidades: number = 0;
  cantidadRechazadaEnUnidades: number = 0;
  diferenciaEnUnidades: number = 0;

  private formSubscription: Subscription;

  constructor(
    private fb: FormBuilder,
    private presentacionService: PresentacionService,
    private popOverService: PopOverService,
    private dialogoService: DialogoService,
    private modalController: ModalController,
    private recepcionMercaderiaItemVariacionService: RecepcionMercaderiaItemVariacionService
  ) {}

  ngOnInit() {
    this.cantidadEsperada = this.item.notaRecepcionItem.cantidadEnNota || 0;
    
    this.initComputedProperties();
    this.initForm();
    this.subscribeToFormChanges();
    
    // Cargar presentaciones primero, luego configurar el modo
    this.cargarPresentaciones().then(() => {
      // Configurar formulario según el modo después de cargar presentaciones
      if (this.readOnly) {
        this.configurarModoSoloLectura();
      } else {
        // NUEVO: En modo edición, también cargar variaciones existentes
        this.cargarVariacionesExistentes();
      }
    });
  }

  private initComputedProperties() {
    this.productoDescripcion = this.item.notaRecepcionItem.producto.descripcion;
    this.productoCodigo = this.item.notaRecepcionItem.producto.codigoPrincipal;
    this.motivosRechazoFormateados = this.motivosRechazo.map(motivo => 
      motivo.replace('_', ' ').toLowerCase()
    );
    
    // Inicializar información de presentación por defecto
    if (this.item.notaRecepcionItem.presentacionEnNota) {
      this.presentacionPorDefecto = this.item.notaRecepcionItem.presentacionEnNota;
      this.cantidadPorPresentacionPorDefecto = this.item.notaRecepcionItem.presentacionEnNota.cantidad || 0;
    }
  }

  ngOnDestroy() {
    if (this.formSubscription) {
      this.formSubscription.unsubscribe();
    }
  }

  private initForm() {
    this.verificacionForm = this.fb.group({
      observaciones: [''],
      variaciones: this.fb.array([])
    });
    // No agregar variación automáticamente, se cargarán en cargarVariacionesExistentes()
  }

  // NUEVA FUNCIONALIDAD: Configurar formulario en modo solo lectura
  private configurarModoSoloLectura() {
    // Deshabilitar todo el formulario
    this.verificacionForm.disable();
    
    // Cargar datos existentes del item
    this.cargarDatosExistentes();
  }

  // NUEVA FUNCIONALIDAD: Cargar datos existentes del item
  private cargarDatosExistentes() {
    // Cargar observaciones
    if (this.item.observaciones) {
      this.verificacionForm.patchValue({
        observaciones: this.item.observaciones
      });
    }
    
    // Cargar variaciones existentes
    this.cargarVariacionesExistentes();
  }

  // NUEVA FUNCIONALIDAD: Cargar variaciones existentes
  private async cargarVariacionesExistentes() {
    try {
      // Limpiar el array de variaciones existente
      const cantidadAntes = this.variacionesArray.length;
      while (this.variacionesArray.length > 0) {
        this.variacionesArray.removeAt(0);
      }
      
      if (this.item.variaciones && this.item.variaciones.length > 0) {
        // El item ya tiene variaciones cargadas
        this.item.variaciones.forEach((variacion, index) => {
          // encontrar presentacion en presentaciones
          const presentacionEnPresentaciones = this.presentaciones.find(p => p.id === variacion.presentacion.id || p.id === this.item.notaRecepcionItem.presentacionEnNota.id);
          
          // Crear un nuevo FormGroup para cada variación
          const variacionForm = this.fb.group({
            presentacion: [presentacionEnPresentaciones, Validators.required],
            cantidad: [variacion.cantidad || 0, [Validators.required, Validators.min(0)]],
            vencimiento: [variacion.vencimiento || this.item.vencimientoRecibido],
            lote: [variacion.lote || this.item.lote || ''],
            rechazado: [variacion.rechazado || false],
            motivoRechazo: [variacion.motivoRechazo || null]
          });
          
          this.variacionesArray.push(variacionForm);
        });
      } else {
        // No hay variaciones, crear una por defecto con los datos del item principal
        
        // ✅ BUSCAR la presentación en la lista para mantener la referencia correcta
        const presentacionPorDefecto = this.presentaciones.find(p => p.id === this.item.notaRecepcionItem.presentacionEnNota?.id);
        
        const variacionForm = this.fb.group({
          presentacion: [presentacionPorDefecto, Validators.required],
          cantidad: [this.item.cantidadRecibida || 0, [Validators.required, Validators.min(0)]],
          vencimiento: [this.item.vencimientoRecibido],
          lote: [this.item.lote || ''],
          rechazado: [false],
          motivoRechazo: [null]
        });
        
        this.variacionesArray.push(variacionForm);
      }
      
      // Recalcular totales después de cargar las variaciones
      this.calcularTotales();
      
    } catch (error) {
      // En caso de error, crear una variación por defecto
      if (this.variacionesArray.length === 0) {
        
        // ✅ BUSCAR la presentación en la lista para mantener la referencia correcta
        const presentacionPorDefecto = this.presentaciones.find(p => p.id === this.item.notaRecepcionItem.presentacionEnNota?.id);
        
        const variacionForm = this.fb.group({
          presentacion: [presentacionPorDefecto, Validators.required],
          cantidad: [this.item.cantidadRecibida || 0, [Validators.required, Validators.min(0)]],
          vencimiento: [this.item.vencimientoRecibido],
          lote: [this.item.lote || ''],
          rechazado: [false],
          motivoRechazo: [null]
        });
        
        this.variacionesArray.push(variacionForm);
        this.calcularTotales();
      }
    }
  }

  get variacionesArray(): FormArray {
    return this.verificacionForm.get('variaciones') as FormArray;
  }

  createVariacionFormGroup(): FormGroup {
    return this.fb.group({
      presentacion: [null, Validators.required],
      cantidad: [0, [Validators.required, Validators.min(0)]], // FASE 6: Siempre inicializar en 0
      vencimiento: [null],
      lote: [''],
      rechazado: [false],
      motivoRechazo: [null as MotivoRechazoFisico | null]
    }, { validators: this.validarVariacion.bind(this) });
  }

  addVariacion() {
    const variacionForm = this.createVariacionFormGroup();


    
    // Si es la primera variación, establecer valores por defecto
    if (this.variacionesArray.length === 0) {
      // ✅ BUSCAR la presentación en la lista de presentaciones para mantener la referencia correcta
      const presentacionPorDefecto = this.presentaciones.find(p => p.id === this.item.notaRecepcionItem.presentacionEnNota?.id);
      
      variacionForm.patchValue({
        presentacion: presentacionPorDefecto, // Usar la referencia de la lista
        vencimiento: this.item.vencimientoRecibido || null,
        lote: this.item.lote || ''
      });
      
      // FASE 6: La cantidad se mantiene en 0 para recepción a ciegas
      // No se pre-carga con la cantidad esperada
    } else {
      // Para variaciones adicionales:
      // 1. Cargar la presentación original (buscando en la lista)
      const presentacionOriginal = this.presentaciones.find(p => p.id === this.item.notaRecepcionItem.presentacionEnNota?.id);
      variacionForm.patchValue({
        presentacion: presentacionOriginal
      });
      
      // 2. Cantidad inicial en 0 (FASE 6: recepción a ciegas)
      variacionForm.patchValue({
        cantidad: 0
      });
      
      // 3. Obtener la fecha de vencimiento y lote de la variación anterior
      const variacionAnterior = this.getVariacionAnterior();
      if (variacionAnterior) {
        const vencimientoAnterior = variacionAnterior.get('vencimiento')?.value;
        const loteAnterior = variacionAnterior.get('lote')?.value;
        
        if (vencimientoAnterior) {
          // ✅ La presentación ya está establecida arriba, no sobrescribir
          variacionForm.patchValue({
            vencimiento: vencimientoAnterior
          });
        }
        
        if (loteAnterior) {
          variacionForm.patchValue({
            lote: loteAnterior
          });
        }
      }
    }
    
    this.variacionesArray.push(variacionForm);
    this.calcularTotales();
  }

  /**
   * Calcula la cantidad restante disponible para nuevas variaciones
   */
  private calcularCantidadRestante(): number {
    const cantidadUsada = this.variacionesArray.controls.reduce((total, control) => {
      const cantidad = control.get('cantidad')?.value || 0;
      return total + cantidad;
    }, 0);
    return Math.max(0, this.cantidadEsperada - cantidadUsada);
  }

  /**
   * Obtiene la variación anterior para copiar valores
   */
  private getVariacionAnterior(): any {
    if (this.variacionesArray.length > 0) {
      return this.variacionesArray.at(this.variacionesArray.length - 1);
    }
    return null;
  }

  /**
   * Valida que la cantidad total no exceda la cantidad esperada
   */
  private validarCantidadTotal(): boolean {
    const cantidadTotal = this.variacionesArray.controls.reduce((total, control) => {
      const cantidad = control.get('cantidad')?.value || 0;
      return total + cantidad;
    }, 0);
    
    const esValida = cantidadTotal <= this.cantidadEsperada;
    
    return esValida;
  }

  /**
   * Validador personalizado para cada variación
   */
  private validarVariacion(formGroup: FormGroup): { [key: string]: any } | null {
    const presentacion = formGroup.get('presentacion')?.value;
    const cantidad = formGroup.get('cantidad')?.value;
    const vencimiento = formGroup.get('vencimiento')?.value;
    const rechazado = formGroup.get('rechazado')?.value;
    const motivoRechazo = formGroup.get('motivoRechazo')?.value;
    
    const errors: { [key: string]: any } = {};
    
    // Validar presentación (siempre obligatoria)
    if (!presentacion) {
      errors['presentacionRequerida'] = true;
    }
    
    // Validar cantidad (siempre obligatoria)
    if (cantidad === null || cantidad === undefined || cantidad < 0) {
      errors['cantidadRequerida'] = true;
    }
    
    // Validar vencimiento si el producto lo requiere
    if (this.item.notaRecepcionItem.producto.vencimiento && !vencimiento) {
      errors['vencimientoRequerido'] = true;
    }
    
    // Si está rechazado, validar motivo de rechazo
    if (rechazado && !motivoRechazo) {
      errors['motivoRechazoRequerido'] = true;
    }
    
    return Object.keys(errors).length > 0 ? errors : null;
  }

  /**
   * Valida todas las variaciones y retorna un resumen de errores
   */
  private validarTodasLasVariaciones(): { esValido: boolean; errores: string[] } {
    const errores: string[] = [];
    
    this.variacionesArray.controls.forEach((control, index) => {
      const variacion = control.value;
      const numeroVariacion = index + 1;
      
      // Validar presentación
      if (!variacion.presentacion) {
        errores.push(`Variación ${numeroVariacion}: Presentación es obligatoria`);
      }
      
      // Validar cantidad
      if (variacion.cantidad === null || variacion.cantidad === undefined || variacion.cantidad < 0) {
        errores.push(`Variación ${numeroVariacion}: Cantidad es obligatoria y debe ser mayor o igual a 0`);
      }
      
      // Validar vencimiento si el producto lo requiere
      if (this.item.notaRecepcionItem.producto.vencimiento && !variacion.vencimiento) {
        errores.push(`Variación ${numeroVariacion}: Fecha de vencimiento es obligatoria`);
      }
      
      // Si está rechazado, validar motivo
      if (variacion.rechazado && !variacion.motivoRechazo) {
        errores.push(`Variación ${numeroVariacion}: Motivo de rechazo es obligatorio cuando la variación está rechazada`);
      }
    });
    
    return {
      esValido: errores.length === 0,
      errores: errores
    };
  }

  /**
   * Maneja el cambio de presentación en una variación
   */
  onPresentacionChange(index: number) {
    const variacionControl = this.variacionesArray.at(index);
    const presentacion = variacionControl.get('presentacion')?.value;
    
    if (presentacion) {
      // Ajustar la cantidad basándose en la presentación seleccionada
      this.ajustarCantidadPorPresentacion(index, presentacion);
    }
  }

  /**
   * Ajusta la cantidad de una variación basándose en la presentación seleccionada
   */
  private ajustarCantidadPorPresentacion(index: number, presentacion: Presentacion) {
    const variacionControl = this.variacionesArray.at(index);
    
    // Calcular la cantidad basándose en la presentación seleccionada
    const cantidadCalculada = this.calcularCantidadPorPresentacion(presentacion);
    
    variacionControl.patchValue({
      cantidad: cantidadCalculada
    });
    
    this.calcularTotales();
  }

  /**
   * Calcula la cantidad basándose en la presentación seleccionada
   * cantidad = cantidadEsperada / presentacion.cantidad
   */
  private calcularCantidadPorPresentacion(presentacion: Presentacion): number {
    if (!presentacion || !presentacion.cantidad || presentacion.cantidad <= 0) {
      return this.cantidadEsperada; // Si no hay cantidad en presentación, usar cantidad esperada
    }
    
    // Calcular cuántas unidades de la presentación equivalen a la cantidad esperada
    const cantidadCalculada = this.cantidadEsperada / presentacion.cantidad;
    
    // Redondear a 2 decimales para evitar problemas de precisión
    return Math.round(cantidadCalculada * 100) / 100;
  }

  removeVariacion(index: number) {
    if (this.variacionesArray.length > 1) {
      const variacionControl = this.variacionesArray.at(index);
      const variacion = variacionControl.value;
      
      console.log('🗑️ [VerificacionDetalleComponent] Intentando eliminar variación:', variacion);
      
      // Verificar si la variación ya existe en la base de datos
      if (variacion.id) {
        console.log('🗑️ [VerificacionDetalleComponent] Variación existente en BD, eliminando inmediatamente...');
        
        // Eliminar la variación de la base de datos inmediatamente
        this.recepcionMercaderiaItemVariacionService.deleteVariacion(variacion.id).subscribe({
          next: (success) => {
            if (success) {
              console.log('✅ [VerificacionDetalleComponent] Variación eliminada de la BD correctamente');
              // Remover la variación del formulario
              this.variacionesArray.removeAt(index);
              // Recalcular totales después de la eliminación
              this.calcularTotales();
            } else {
              console.error('❌ [VerificacionDetalleComponent] Error al eliminar variación de la BD');
              // Mostrar mensaje de error al usuario
              console.error('Error al eliminar la variación. Intente nuevamente.');
            }
          },
          error: (error) => {
            console.error('❌ [VerificacionDetalleComponent] Error en la petición de eliminación:', error);
            console.error('Error de conexión al eliminar la variación.');
          }
        });
      } else {
        console.log('🗑️ [VerificacionDetalleComponent] Variación nueva, removiendo del formulario...');
        // Es una variación nueva, removerla directamente del formulario
        this.variacionesArray.removeAt(index);
        // Recalcular totales después de la operación
        this.calcularTotales();
        console.log('✅ [VerificacionDetalleComponent] Variación nueva removida del formulario');
      }
    }
  }

    private async cargarPresentaciones(): Promise<void> {
    return new Promise((resolve, reject) => {
    try {
      this.isLoadingPresentaciones = true;
        this.presentacionService.onGetPresentacionesPorProductoId(this.item.notaRecepcionItem.producto.id).then(result => {
          result.subscribe({
        next: (presentaciones) => {
          this.presentaciones = presentaciones;
          
              // Actualizar propiedades computadas de presentación por defecto
              if (this.item.notaRecepcionItem.presentacionEnNota) {
            const presentacionPorDefecto = this.presentaciones.find(
              p => p.id === this.item.notaRecepcionItem.presentacionEnNota?.id
            );
            if (presentacionPorDefecto) {
              this.presentacionPorDefecto = presentacionPorDefecto;
              this.cantidadPorPresentacionPorDefecto = presentacionPorDefecto.cantidad || 0;
            }
          }
          
          this.isLoadingPresentaciones = false;
              resolve();
        },
        error: (error) => {
              this.isLoadingPresentaciones = false;
              reject(error);
            }
          });
        }).catch(error => {
          this.isLoadingPresentaciones = false;
          reject(error);
      });
    } catch (error) {
      this.isLoadingPresentaciones = false;
        reject(error);
    }
    });
  }

  private subscribeToFormChanges() {
    this.formSubscription = this.verificacionForm.get('variaciones').valueChanges.pipe(
      debounceTime(300)
    ).subscribe(() => {
      this.calcularTotales();
    });
  }

  private calcularTotales() {
    let recibida = 0;
    let rechazada = 0;
    
    this.variacionesArray.controls.forEach((control, index) => {
      const variacion = control.value;
      const cantidad = variacion.cantidad || 0;
      const presentacion = variacion.presentacion;
      
      if (presentacion && presentacion.cantidad && presentacion.cantidad > 0) {
        // Convertir la cantidad de la variación a unidades base
        const cantidadEnUnidades = cantidad * presentacion.cantidad;
        
        if (variacion.rechazado) {
          rechazada += cantidadEnUnidades;
        } else {
          recibida += cantidadEnUnidades;
        }
      } else {
        // Si no hay presentación o cantidad, usar la cantidad directa
        if (variacion.rechazado) {
          rechazada += cantidad;
        } else {
          recibida += cantidad;
        }
      }
    });

    this.cantidadRecibidaTotal = Math.round(recibida * 100) / 100;
    this.cantidadRechazadaTotal = Math.round(rechazada * 100) / 100;
    this.diferenciaCantidad = (recibida + rechazada) - this.cantidadEsperada;
    
    // Actualizar propiedades computadas para cantidades en unidades base
    this.cantidadRecibidaEnUnidades = Math.round(recibida * 100) / 100;
    this.cantidadRechazadaEnUnidades = Math.round(rechazada * 100) / 100;
    this.diferenciaEnUnidades = this.diferenciaCantidad;
    
    this.setDiferenciaColor();
  }
  
  private setDiferenciaColor() {
    if (this.diferenciaCantidad === 0) {
      this.diferenciaColor = '#43a047'; // Verde
    } else if (this.diferenciaCantidad > 0) {
      this.diferenciaColor = '#f57c00'; // Naranja
    } else {
      this.diferenciaColor = '#f44336'; // Rojo
    }
  }

  onVerificar() {
    // En modo solo lectura, no permitir verificación
    if (this.readOnly) {
      return;
    }
    
    // Validar todas las variaciones
    const validacionVariaciones = this.validarTodasLasVariaciones();
    if (!validacionVariaciones.esValido) {
      this.verificacionForm.markAllAsTouched();
      return;
    }
    
    // FASE 6: Implementar flujo de validación por discrepancia de cantidad
    this.validarDiscrepanciaCantidad();
  }

  /**
   * FASE 6: Valida si hay discrepancia entre la cantidad total y la esperada
   */
  private async validarDiscrepanciaCantidad() {
    const cantidadTotal = this.cantidadRecibidaTotal + this.cantidadRechazadaTotal;
    const hayDiscrepancia = Math.abs(cantidadTotal - this.cantidadEsperada) > 0.01; // Tolerancia de 0.01

    if (hayDiscrepancia) {
      const resultado = await this.mostrarDialogoDiscrepancia(cantidadTotal);
      
      if (resultado === 'volver') {
        // El usuario eligió "Volver a Contar", cerrar diálogo y permitir corrección
        return;
      } else if (resultado === 'confirmar') {
        // El usuario eligió "Confirmar y Rechazar Faltante"
        await this.crearVariacionRechazoFaltante();
      }
    } else {
      // No hay discrepancia, proceder con la verificación
      this.procesarVerificacion();
    }
  }

  /**
   * FASE 6: Muestra el diálogo de discrepancia de cantidad
   */
  private async mostrarDialogoDiscrepancia(cantidadTotal: number): Promise<'volver' | 'confirmar' | null> {
    try {
      const resultado = await this.dialogoService.confirmarDiscrepanciaCantidad(cantidadTotal, this.cantidadEsperada);
      return resultado;
    } catch (error) {
      return null;
    }
  }

  /**
   * FASE 6: Crea una variación de rechazo para la cantidad faltante
   */
  private async crearVariacionRechazoFaltante() {
    console.log('🚀 [VerificacionDetalleComponent] ===== INICIANDO CREAR VARIACIÓN RECHAZO FALTANTE =====');
    console.log('🔍 [VerificacionDetalleComponent] Cantidad total actual:', this.cantidadRecibidaTotal + this.cantidadRechazadaTotal);
    console.log('🔍 [VerificacionDetalleComponent] Cantidad esperada:', this.cantidadEsperada);
    
    const cantidadTotal = this.cantidadRecibidaTotal + this.cantidadRechazadaTotal;
    const cantidadFaltante = this.cantidadEsperada - cantidadTotal;
    console.log('🔍 [VerificacionDetalleComponent] Cantidad faltante calculada:', cantidadFaltante);
    
    if (cantidadFaltante > 0) {
      console.log('✅ [VerificacionDetalleComponent] Hay cantidad faltante, creando variación de rechazo...');
      
      // NUEVA LÓGICA: Seleccionar la mejor presentación para la variación de rechazo
      let presentacionParaRechazo = this.presentacionPorDefecto;
      
      // 1. Intentar usar presentación con unidad base 1 (ideal para rechazo)
      const presentacionUnidadBase = this.presentaciones.find(p => p.cantidad === 1);
      if (presentacionUnidadBase) {
        presentacionParaRechazo = presentacionUnidadBase;
        console.log('✅ [VerificacionDetalleComponent] Usando presentación con unidad base 1:', presentacionUnidadBase.descripcion);
      } else {
        // 2. Si no hay presentación con unidad base 1, usar la de la variación anterior
        if (this.variacionesArray.length > 0) {
          const variacionAnterior = this.variacionesArray.at(this.variacionesArray.length - 1);
          const presentacionAnterior = variacionAnterior.get('presentacion')?.value;
          if (presentacionAnterior) {
            presentacionParaRechazo = presentacionAnterior;
            console.log('✅ [VerificacionDetalleComponent] Usando presentación de variación anterior:', presentacionAnterior.descripcion);
          }
        }
        
        // 3. Si no hay variación anterior, mantener la presentación por defecto
        if (!presentacionParaRechazo) {
          presentacionParaRechazo = this.presentacionPorDefecto;
          console.log('✅ [VerificacionDetalleComponent] Usando presentación por defecto:', this.presentacionPorDefecto?.descripcion);
        }
      }
      
      // Crear nueva variación con la cantidad faltante
      const variacionRechazo = this.fb.group({
        presentacion: [presentacionParaRechazo, Validators.required],
        cantidad: [cantidadFaltante, [Validators.required, Validators.min(0)]],
        vencimiento: [null],
        lote: [''],
        rechazado: [true],
        motivoRechazo: [null as MotivoRechazoFisico | null, Validators.required] // Requerido para variaciones rechazadas
      });
      console.log('✅ [VerificacionDetalleComponent] Variación de rechazo creada:', variacionRechazo.value);

      // Abrir diálogo para seleccionar motivo de rechazo
      console.log('🔍 [VerificacionDetalleComponent] Abriendo diálogo de selección de motivo de rechazo...');
      const motivoRechazo = await this.seleccionarMotivoRechazo();
      console.log('🔍 [VerificacionDetalleComponent] Resultado del diálogo de motivo de rechazo:', motivoRechazo);
      console.log('🔍 [VerificacionDetalleComponent] Tipo de motivoRechazo:', typeof motivoRechazo);
      console.log('🔍 [VerificacionDetalleComponent] ¿Es motivoRechazo truthy?', !!motivoRechazo);
      
      if (motivoRechazo) {
        console.log('✅ [VerificacionDetalleComponent] Motivo de rechazo válido, procediendo...');
        variacionRechazo.patchValue({ motivoRechazo: motivoRechazo });
        console.log('✅ [VerificacionDetalleComponent] Variación de rechazo actualizada:', variacionRechazo.value);
        
        this.variacionesArray.push(variacionRechazo);
        console.log('✅ [VerificacionDetalleComponent] Variación de rechazo agregada al array. Total variaciones:', this.variacionesArray.length);
        
        this.calcularTotales();
        console.log('✅ [VerificacionDetalleComponent] Totales recalculados');
        
        // Proceder con la verificación
        console.log('🚀 [VerificacionDetalleComponent] Iniciando procesarVerificacion...');
        this.procesarVerificacion();
      } else {
        console.log('❌ [VerificacionDetalleComponent] No se recibió motivo de rechazo válido, abortando...');
        // No proceder si no hay motivo de rechazo
        return;
      }
    } else {
      // No hay cantidad faltante, proceder directamente
      this.procesarVerificacion();
    }
  }

    /**
   * FASE 6: Permite al usuario seleccionar un motivo de rechazo
   */
   private async seleccionarMotivoRechazo(): Promise<MotivoRechazoFisico | null> {
     try {
       const motivoRechazo = await this.dialogoService.seleccionarMotivoRechazo();
      console.log('🔍 [VerificacionDetalleComponent] Motivo de rechazo seleccionado:', motivoRechazo, 'tipo:', typeof motivoRechazo);
      
      // Verificar que el motivoRechazo sea válido
      if (motivoRechazo && Object.values(MotivoRechazoFisico).includes(motivoRechazo)) {
       return motivoRechazo;
      } else {
        console.warn('⚠️ [VerificacionDetalleComponent] Motivo de rechazo inválido recibido:', motivoRechazo);
        return null;
      }
     } catch (error) {
      console.error('❌ [VerificacionDetalleComponent] Error al seleccionar motivo de rechazo:', error);
       return null;
     }
   }

  /**
   * FASE 6: Procesa la verificación después de validar discrepancias
   */
  private procesarVerificacion() {
    const formValue = this.verificacionForm.value;
      
    const variacionesInput: RecepcionMercaderiaItemVariacionInput[] = formValue.variaciones.map((v, index) => {
      const variacionInput = {
        presentacionId: v.presentacion?.id,
        cantidad: v.cantidad,
        vencimiento: v.vencimiento ? dateToString(v.vencimiento) : null,
        lote: v.lote,
        rechazado: v.rechazado,
        motivoRechazo: v.rechazado ? v.motivoRechazo : null
      };
      
      return variacionInput;
    });

    const finalInput: VerificacionProductoOutput = {
      id: this.item.id,
      recepcionMercaderiaId: this.recepcionId,
      usuarioId: 1, // TODO: Obtener del servicio de autenticación
      observaciones: formValue.observaciones,
      metodoVerificacion: MetodoVerificacion.MANUAL, // TODO: Determinar lógicamente
      variaciones: variacionesInput
    };
    
    // Cerrar el modal con los datos de verificación
    this.modalController.dismiss({
      verificacion: finalInput
    });
  }

  onCancelar() {
    // Cerrar el modal indicando que se canceló
    this.modalController.dismiss({
      cancelado: true
    });
  }

  /**
   * Abre el popover del date picker para seleccionar fecha de vencimiento
   * FASE 6: Implementa validación de fechas de vencimiento
   */
  async openDatePicker(formControl: any, event: any, title: string = 'Seleccionar Fecha') {
    // Si no hay fecha seleccionada, usar la fecha actual
    let fechaInicial = formControl.value;
    if (!fechaInicial) {
      fechaInicial = new Date();
    }

    const config = { 
      selectedDate: fechaInicial,
      showMonthAsNumber: true,
      enableFutureDates: true,
      minYear: new Date().getFullYear() - 5,
      maxYear: new Date().getFullYear() + 20
    };
    
    const result = await this.popOverService.open(
      WheelDatePickerModalComponent, 
      config, 
      PopoverSize.XS
    );
    
    if (result && result.data) {
      const fechaSeleccionada = result.data;
      
      // FASE 6: Validar la fecha de vencimiento seleccionada
      const accionUsuario = await this.validarFechaVencimiento(fechaSeleccionada);
      
      if (accionUsuario === 'continuar') {
        // El usuario eligió continuar, asignar la fecha
        formControl.setValue(fechaSeleccionada);
      } else {
        // El usuario eligió cambiar fecha, volver a abrir el date picker
        await this.openDatePicker(formControl, event, title);
      }
    }
  }

  /**
   * FASE 6: Valida la fecha de vencimiento seleccionada
   * @param fechaVencimiento Fecha a validar
   * @returns Promise con la acción del usuario
   */
  private async validarFechaVencimiento(fechaVencimiento: Date): Promise<'continuar' | 'cambiar'> {
    try {
      return await this.dialogoService.validarFechaVencimiento(fechaVencimiento);
    } catch (error) {
      // En caso de error, continuar con la fecha seleccionada
      return 'continuar';
    }
  }

  // --- Métodos para el Template ---
  
  /**
   * Obtiene la información de presentación para una variación específica
   * Evita usar funciones directamente en HTML
   */
  getPresentacionInfo(index: number): { nombre: string; cantidad: number } {
    const variacionControl = this.variacionesArray.at(index);
    const presentacion = variacionControl.get('presentacion')?.value;
    
    if (presentacion) {
      return {
        nombre: presentacion.descripcion,
        cantidad: presentacion.cantidad || 0
      };
    }
    
    return {
      nombre: 'Sin presentación',
      cantidad: 0
    };
  }

  /**
   * Obtiene la información de cantidad para una variación específica
   * Incluye la cantidad ingresada y la cantidad en unidades base
   */
  getCantidadInfo(index: number): { cantidadIngresada: number; cantidadEnUnidades: number; presentacion: string } {
    const variacionControl = this.variacionesArray.at(index);
    const cantidad = variacionControl.get('cantidad')?.value || 0;
    const presentacion = variacionControl.get('presentacion')?.value;
    
    if (presentacion && presentacion.cantidad && presentacion.cantidad > 0) {
      const cantidadEnUnidades = cantidad * presentacion.cantidad;
      return {
        cantidadIngresada: cantidad,
        cantidadEnUnidades: Math.round(cantidadEnUnidades * 100) / 100,
        presentacion: presentacion.descripcion
      };
    }
    
    return {
      cantidadIngresada: cantidad,
      cantidadEnUnidades: cantidad,
      presentacion: 'Sin presentación'
    };
  }
} 
