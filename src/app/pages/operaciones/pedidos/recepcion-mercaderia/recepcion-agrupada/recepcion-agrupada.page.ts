import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ModalController, AlertController } from '@ionic/angular';
import { FormBuilder, FormGroup } from '@angular/forms';
// ELIMINAR: import { ProductoAgrupadoDTO } from '../../graphql/productosAgrupadosPorNotas';
import { PedidoService } from '../../services/pedido.service';
import { NotificacionService, TipoNotificacion } from '../../../../../services/notificacion.service';
import { CargandoService } from '../../../../../services/cargando.service';
import { QrScannerComponent } from '../components/qr-scanner/qr-scanner.component';
import { VerificacionDetalleComponent } from '../components/verificacion-detalle/verificacion-detalle.component';
import { RecepcionMercaderiaItemInput } from '../../graphql/saveRecepcionMercaderiaItem';
import { ItemsPaginacionService, PaginatedResponse } from '../../services/items-paginacion.service';
import { PaginacionComponent } from '../../components/paginacion/paginacion.component';
import { RecepcionMercaderiaItem } from '../../../../../domains/operaciones/pedido/recepcion-mercaderia-item.model';
import { EstadoVerificacion } from '../../../../../domains/operaciones/pedido/recepcion-mercaderia-item.model';
import { MetodoVerificacion } from '../../../../../domains/operaciones/pedido/recepcion-mercaderia-item.model';
import { Sucursal } from 'src/app/domains/empresarial/sucursal/sucursal.model';
import { NotaRecepcion } from 'src/app/domains/operaciones/pedido/nota-recepcion.model';
import { RecepcionMercaderia } from '../../../../../domains/operaciones/pedido/recepcion-mercaderia.model';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { SearchProductoDialogComponent } from '../../../../producto/search-producto-dialog/search-producto-dialog.component';
import { MenuActionService, ActionMenuData } from '../../../../../services/menu-action.service';

// NUEVA INTERFAZ: ProductoAgrupado para la UI (sin DTO del backend)
interface ProductoAgrupado {
  producto: {
    id: number;
    nombre: string;
    imagen?: string;
  };
  cantidadTotalEsperada: number;
  itemsPendientes: RecepcionMercaderiaItem[];
  estadoVerificacion: EstadoVerificacion;
  // Propiedades computadas para evitar funciones en HTML
  cantidadRecibidaTotal: number;
  cantidadRechazadaTotal: number;
  estadoVerificacionTexto: string;
}

@Component({
  selector: 'app-recepcion-agrupada',
  templateUrl: './recepcion-agrupada.page.html',
  styleUrls: ['./recepcion-agrupada.page.scss']
})
export class RecepcionAgrupadaPage implements OnInit, OnDestroy {

  recepcionId: number;
  sucursal: Sucursal;
  recepcionMercaderia: RecepcionMercaderia;
  
  // NUEVA ARQUITECTURA: Usar RecepcionMercaderiaItem[] directamente
  itemsPendientes: RecepcionMercaderiaItem[] = [];
  productosAgrupados: ProductoAgrupado[] = [];
  
  isLoading = false;
  searchForm: FormGroup;
  
  // Propiedades de paginación
  paginatedResponse: PaginatedResponse<any> | null = null;
  currentPage = 0;
  pageSize = 20;
  totalElements = 0;

  // Propiedades para filtros
  filtroTexto = '';
  filtroEstado: EstadoVerificacion[] = [EstadoVerificacion.VERIFICADO, EstadoVerificacion.VERIFICADO_CON_DIFERENCIA, EstadoVerificacion.RECHAZADO]; // Default: todos excepto PENDIENTE
  
  // Propiedades computadas para evitar funciones en HTML
  nombreEstadoFiltro: string = 'Múltiples';
  tituloHistorial: string = 'Verificados';
  
  // Propiedades para el sumario de la recepción
  sumarioRecepcion: any = null;
  
  // Subject para debounce del filtro
  private filtroSubject = new Subject<string>();
  private filtroSubscription: Subscription;

  // Propiedades para paneles expandibles
  recepcionInfoExpanded: boolean = false;
  sumarioInfoExpanded: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private pedidoService: PedidoService,
    private itemsPaginacionService: ItemsPaginacionService,
    private notificacionService: NotificacionService,
    private cargandoService: CargandoService,
    private modalController: ModalController,
    private alertController: AlertController,
    private fb: FormBuilder,
    private menuActionService: MenuActionService
  ) {
    this.initForm();
    this.initFiltroDebounce();
    this.actualizarPropiedadesComputadas(); // Inicializar propiedades computadas
  }

  ngOnInit() {
    console.log('🚀 [RecepcionAgrupadaPage] ngOnInit iniciado - NUEVA ARQUITECTURA');
    
    // Obtener recepcionId de los parámetros de ruta o del state de navegación
    const routeParams = this.route.snapshot.params['id'];
    const queryParams = this.route.snapshot.queryParams['recepcionId'];
    const navigationState = this.router.getCurrentNavigation()?.extras?.state?.['recepcionId'];
    
    console.log('🔍 [RecepcionAgrupadaPage] Route params:', routeParams);
    console.log('🔍 [RecepcionAgrupadaPage] Query params:', queryParams);
    console.log('🔍 [RecepcionAgrupadaPage] Navigation state:', navigationState);
    
    this.recepcionId = routeParams || queryParams || navigationState;
    
    console.log('🔍 [RecepcionAgrupadaPage] RecepcionId final:', this.recepcionId);
    console.log('🔍 [RecepcionAgrupadaPage] Tipo de recepcionId:', typeof this.recepcionId);

    if (this.recepcionId) {
      console.log('✅ [RecepcionAgrupadaPage] RecepcionId válido, cargando datos con NUEVA ARQUITECTURA...');
      // NUEVA ARQUITECTURA: Solo cargar items de recepción (ya están pre-creados)
      this.cargarRecepcionMercaderia();
      this.cargarItemsRecepcion();
      this.cargarSumarioRecepcion();
    } else {
      console.error('❌ [RecepcionAgrupadaPage] No se pudo obtener recepcionId');
      this.notificacionService.open(
        'No se pudo obtener el ID de la recepción',
        TipoNotificacion.DANGER,
        3
      );
      this.onVolver();
    }
  }

  private initForm() {
    this.searchForm = this.fb.group({
      searchText: ['']
    });
    
    // Suscribirse a cambios en el filtro de búsqueda
    this.searchForm.get('searchText')?.valueChanges.subscribe(value => {
      this.filtroTexto = value;
      this.filtroSubject.next(value);
    });
  }

  private initFiltroDebounce() {
    // Aplicar debounce de 500ms para evitar demasiadas llamadas al backend
    this.filtroSubscription = this.filtroSubject.pipe(
      debounceTime(500),
      distinctUntilChanged()
    ).subscribe(value => {
      this.currentPage = 0; // Volver a la primera página
      this.cargarItemsRecepcion(); // Recargar con el nuevo filtro
    });
  }

  ngOnDestroy() {
    // Limpiar suscripciones
    if (this.filtroSubscription) {
      this.filtroSubscription.unsubscribe();
    }
    this.filtroSubject.complete();
  }

  // NUEVA ARQUITECTURA: Cargar items de recepción directamente
  private async cargarItemsRecepcion() {
    try {
      this.isLoading = true;
      console.log('🔄 [RecepcionAgrupadaPage] Cargando HISTORIAL de items verificados con NUEVA ARQUITECTURA...');
      
      // NUEVA ARQUITECTURA: Usar la query que obtiene items con los estados filtrados
      this.pedidoService.getRecepcionItemsPaginados(
        this.recepcionId, 
        this.currentPage, 
        this.pageSize, 
        this.filtroTexto,
        this.filtroEstado // Usar el filtro de estado configurado
      ).then(result => {
        result.subscribe({
          next: (response: any) => {
            if (response) {
              const pageData = response;
              const items: RecepcionMercaderiaItem[] = pageData.getContent || [];
              
              console.log('✅ [RecepcionAgrupadaPage] Items verificados cargados para historial:', items.length);
              
              // NUEVA ARQUITECTURA: Asignar items verificados para mostrar en historial
              this.itemsPendientes = items; // Renombrar variable más adelante
              
              if (this.itemsPendientes.length > 0) {
                // NUEVA ARQUITECTURA: Agrupar items por producto para la UI del historial
                this.agruparItemsPorProducto();
              } else {
                this.productosAgrupados = [];
              }
              
              // Actualizar información de paginación
              this.totalElements = pageData.getTotalElements || 0;
              this.paginatedResponse = {
                content: this.productosAgrupados,
                totalElements: this.totalElements,
                totalPages: pageData.getTotalPages || 0,
                size: this.pageSize,
                number: this.currentPage,
                first: pageData.isFirst || false,
                last: pageData.isLast || false,
                numberOfElements: this.productosAgrupados.length
              };
            } else {
              this.productosAgrupados = [];
              this.totalElements = 0;
            }
            this.isLoading = false;
          },
          error: (error) => {
            console.error('❌ [RecepcionAgrupadaPage] Error al cargar historial de items verificados:', error);
            this.notificacionService.open(
              'Error al cargar historial de recepción',
              TipoNotificacion.DANGER,
              3
            );
            this.isLoading = false;
          }
        });
      }).catch(error => {
        console.error('❌ [RecepcionAgrupadaPage] Error al obtener Observable:', error);
        this.notificacionService.open(
          'Error al obtener historial de recepción',
          TipoNotificacion.DANGER,
          3
        );
        this.isLoading = false;
      });
    } catch (error) {
      console.error('❌ [RecepcionAgrupadaPage] Error en cargarItemsRecepcion:', error);
      this.notificacionService.open(
        'Error al cargar historial de recepción',
        TipoNotificacion.DANGER,
        3
      );
      this.isLoading = false;
    }
  }

  // NUEVA ARQUITECTURA: Agrupar items por producto para la UI
  private agruparItemsPorProducto() {
    const productosMap = new Map<number, ProductoAgrupado>();
    
    this.itemsPendientes.forEach(item => {
      const productoId = item.notaRecepcionItem.producto.id;
      
      if (!productosMap.has(productoId)) {
        // NUEVA ARQUITECTURA: Crear agrupación basada en RecepcionMercaderiaItem
        const productoAgrupado: ProductoAgrupado = {
          producto: {
            id: productoId,
            nombre: item.notaRecepcionItem.producto.descripcion,
            imagen: item.notaRecepcionItem.producto.imagenPrincipal
          },
          cantidadTotalEsperada: item.notaRecepcionItem.cantidadEnNota || 0,
          itemsPendientes: [item], // NUEVO: Guardar referencia a los items
          estadoVerificacion: item.estadoVerificacion,
          // Calcular propiedades computadas
          cantidadRecibidaTotal: this.calcularCantidadRecibidaTotal([item]),
          cantidadRechazadaTotal: this.calcularCantidadRechazadaTotal([item]),
          estadoVerificacionTexto: this.obtenerEstadoVerificacionTexto(item.estadoVerificacion, item)
        };
        
        productosMap.set(productoId, productoAgrupado);
      } else {
        // Si ya existe, agregar el item a la lista y sumar cantidades
        const existente = productosMap.get(productoId)!;
        existente.itemsPendientes.push(item);
        existente.cantidadTotalEsperada += (item.notaRecepcionItem.cantidadEnNota || 0);
        
        // Recalcular propiedades computadas con todos los items
        existente.cantidadRecibidaTotal = this.calcularCantidadRecibidaTotal(existente.itemsPendientes);
        existente.cantidadRechazadaTotal = this.calcularCantidadRechazadaTotal(existente.itemsPendientes);
        // Para el texto del estado, usar el primer item del grupo
        existente.estadoVerificacionTexto = this.obtenerEstadoVerificacionTexto(existente.estadoVerificacion, existente.itemsPendientes[0]);
      }
    });
    
    this.productosAgrupados = Array.from(productosMap.values());
    
    console.log('✅ [RecepcionAgrupadaPage] Productos agrupados:', this.productosAgrupados.length);
    
    // Actualizar paginación
    if (this.paginatedResponse) {
      this.paginatedResponse.numberOfElements = this.productosAgrupados.length;
    }
  }

  // NUEVA ARQUITECTURA: Buscar producto por código en items pendientes
  async onEscanearCodigo() {
    const modal = await this.modalController.create({
      component: QrScannerComponent,
      componentProps: {
        title: 'Escanear Código de Producto',
        placeholder: 'Ingresa el código del producto manualmente'
      }
    });

    modal.onDidDismiss().then(async (result) => {
      if (result.data) {
        const codigo = result.data;
        console.log('🔍 [RecepcionAgrupadaPage] Código escaneado:', codigo);
        
        // NUEVA ARQUITECTURA: Buscar en items pendientes usando query separada
        await this.buscarProductoPorCodigoEnPendientes(codigo);
      }
    });

    return await modal.present();
  }

  // NUEVA ARQUITECTURA: Buscar producto por código
  private async buscarProductoPorCodigo(codigo: string) {
    // NUEVA ARQUITECTURA: Buscar en items pendientes directamente
    const itemPendiente = this.itemsPendientes.find(item => 
      item.notaRecepcionItem.producto.id.toString() === codigo || 
      item.notaRecepcionItem.producto.descripcion.toLowerCase().includes(codigo.toLowerCase())
    );

    if (itemPendiente) {
      this.notificacionService.open(`Producto encontrado: ${itemPendiente.notaRecepcionItem.producto.descripcion}`, TipoNotificacion.SUCCESS, 2);
      
      // FASE 6: Flujo secuencial - abrir verificación inmediatamente
      await this.verificacionDetallada(itemPendiente);
    } else {
      this.notificacionService.open('Producto no encontrado en la sesión de recepción', TipoNotificacion.DANGER, 3);
    }
  }

  // NUEVA ARQUITECTURA: Buscar producto por código en items pendientes
  private async buscarProductoPorCodigoEnPendientes(codigo: string) {
    try {
      console.log('🔍 [RecepcionAgrupadaPage] Buscando producto por código en items pendientes:', codigo);
      
      // Usar query paginada para buscar items pendientes
      this.pedidoService.getRecepcionItemsPaginados(
        this.recepcionId, 
        0, // Primera página
        100, // Buscar en muchos items
        '', // Sin filtro de texto
        [EstadoVerificacion.PENDIENTE] // Solo items pendientes
      ).then(result => {
        result.subscribe({
          next: async (response: any) => {
            if (response) {
              const pageData = response;
              const itemsPendientes: RecepcionMercaderiaItem[] = pageData.getContent || [];
              
              // Buscar producto por código en items pendientes
              const itemPendiente = itemsPendientes.find(item => 
                item.notaRecepcionItem.producto.id.toString() === codigo || 
                item.notaRecepcionItem.producto.descripcion.toLowerCase().includes(codigo.toLowerCase())
              );

              if (itemPendiente) {
                this.notificacionService.open(`Producto encontrado: ${itemPendiente.notaRecepcionItem.producto.descripcion}`, TipoNotificacion.SUCCESS, 2);
                
                // FASE 6: Flujo secuencial - abrir verificación inmediatamente
                await this.verificacionDetallada(itemPendiente);
              } else {
                this.notificacionService.open('Producto no encontrado en la sesión de recepción', TipoNotificacion.DANGER, 3);
              }
            } else {
              this.notificacionService.open('No se encontraron items pendientes', TipoNotificacion.WARN, 3);
            }
          },
          error: (error) => {
            console.error('❌ [RecepcionAgrupadaPage] Error al buscar items pendientes por código:', error);
            this.notificacionService.open('Error al buscar el producto', TipoNotificacion.DANGER, 3);
          }
        });
      }).catch(error => {
        console.error('❌ [RecepcionAgrupadaPage] Error al obtener items pendientes por código:', error);
        this.notificacionService.open('Error al buscar el producto', TipoNotificacion.DANGER, 3);
      });
    } catch (error) {
      console.error('❌ [RecepcionAgrupadaPage] Error en buscarProductoPorCodigoEnPendientes:', error);
      this.notificacionService.open('Error al buscar el producto', TipoNotificacion.DANGER, 3);
    }
  }

  // NUEVA ARQUITECTURA: Búsqueda manual de productos
  async onBusquedaManual() {
    const modal = await this.modalController.create({
      component: SearchProductoDialogComponent,
      componentProps: {
        data: {
          recepcionId: this.recepcionId,
          sucursalId: this.sucursal?.id || 1,
          mostrarPrecio: false
        }
      },
      backdropDismiss: false
    });

    modal.onDidDismiss().then(async result => {
      if (result.data) {
        const productoSeleccionado = result.data;
        console.log('🔍 [RecepcionAgrupadaPage] Producto seleccionado:', productoSeleccionado);
        
        // Validar que el producto tenga ID
        if (!productoSeleccionado.id) {
          console.error('❌ [RecepcionAgrupadaPage] Producto seleccionado sin ID:', productoSeleccionado);
          this.notificacionService.open(
            'Error: Producto seleccionado sin ID válido', 
            TipoNotificacion.DANGER, 
            3
          );
          return;
        }
        
        // FASE 6: Flujo secuencial - buscar y abrir verificación inmediatamente
        await this.buscarProductoEnItemsPendientes(productoSeleccionado.id);
      }
    });

    return await modal.present();
  }

  // NUEVA ARQUITECTURA: Buscar producto en items pendientes
  private async buscarProductoEnItemsPendientes(productoId: number) {
    console.log('🔍 [RecepcionAgrupadaPage] Buscando producto en items pendientes:', { recepcionId: this.recepcionId, productoId });
    
    // FASE 6: Flujo secuencial - buscar directamente en items pendientes
    await this.buscarItemsPendientesPorProducto(productoId);
  }

  // NUEVA ARQUITECTURA: Buscar items pendientes por producto
  private async buscarItemsPendientesPorProducto(productoId: number) {
    try {
      console.log('🔍 [RecepcionAgrupadaPage] Buscando items pendientes para producto:', productoId);
      
      // Usar query paginada para buscar items pendientes del producto específico
      this.pedidoService.getRecepcionItemsPaginados(
        this.recepcionId, 
        0, // Primera página
        100, // Buscar en muchos items
        '', // Sin filtro de texto
        [EstadoVerificacion.PENDIENTE] // Solo items pendientes
      ).then(result => {
        result.subscribe({
          next: async (response: any) => {
            if (response) {
              const pageData = response;
              const itemsPendientes: RecepcionMercaderiaItem[] = pageData.getContent || [];
              
              // Buscar el item pendiente del producto específico
              const itemPendiente = itemsPendientes.find(item => 
                item.notaRecepcionItem.producto.id === productoId
              );
              
              if (itemPendiente) {
                console.log('✅ [RecepcionAgrupadaPage] Item pendiente encontrado:', itemPendiente);
                
                this.notificacionService.open(
                  `Producto encontrado: ${itemPendiente.notaRecepcionItem.producto.descripcion}`, 
                  TipoNotificacion.SUCCESS, 
                  2
                );
                
                // FASE 6: Flujo secuencial - abrir verificación inmediatamente
                await this.verificacionDetallada(itemPendiente);
                
              } else {
                this.notificacionService.open(
                  'El producto no se encuentra o ya ha sido verificado en esta recepción', 
                  TipoNotificacion.WARN, 
                  3
                );
              }
            } else {
              this.notificacionService.open(
                'No se encontraron items pendientes para este producto', 
                TipoNotificacion.WARN, 
                3
              );
            }
          },
          error: (error) => {
            console.error('❌ [RecepcionAgrupadaPage] Error al buscar items pendientes:', error);
            this.notificacionService.open(
              'Error al buscar el producto en la recepción', 
              TipoNotificacion.DANGER, 
              3
            );
          }
        });
      }).catch(error => {
        console.error('❌ [RecepcionAgrupadaPage] Error al obtener items pendientes:', error);
        this.notificacionService.open(
          'Error al buscar el producto en la recepción', 
          TipoNotificacion.DANGER, 
          3
        );
      });
    } catch (error) {
      console.error('❌ [RecepcionAgrupadaPage] Error en buscarItemsPendientesPorProducto:', error);
      this.notificacionService.open(
        'Error al buscar el producto en la recepción', 
        TipoNotificacion.DANGER, 
        3
      );
    }
  }

  // NUEVA ARQUITECTURA: Verificación detallada con RecepcionMercaderiaItem
  private async verificacionDetallada(item: RecepcionMercaderiaItem, readOnly: boolean = false) {
    console.log('🔍 [RecepcionAgrupadaPage] Abriendo verificación detallada para item:', item, 'Modo solo lectura:', readOnly);
    
    const modal = await this.modalController.create({
      component: VerificacionDetalleComponent,
      componentProps: {
        // NUEVA ARQUITECTURA: Pasar el item completo en lugar de ProductoAgrupadoDTO
        item: item,
        sucursalId: this.sucursal?.id || 1,
        recepcionId: this.recepcionId,
        readOnly: readOnly // Nuevo parámetro para modo solo lectura
      },
      backdropDismiss: false
    });

    // ESCUCHAR CUANDO SE CIERRE EL MODAL CON DATOS
    modal.onDidDismiss().then((result) => {
      console.log('📡 [RecepcionAgrupadaPage] Modal cerrado con resultado:', result);
      
      if (result.data && result.data.verificacion) {
        console.log('📤 [RecepcionAgrupadaPage] Datos de verificación recibidos del modal:', result.data.verificacion);
        console.log('📤 [RecepcionAgrupadaPage] Cantidad de variaciones recibidas:', result.data.verificacion.variaciones?.length || 0);
        
        // Procesar la verificación
        this.procesarVerificacionDetallada(result.data.verificacion, item);
      } else if (result.data && result.data.cancelado) {
        console.log('❌ [RecepcionAgrupadaPage] Verificación cancelada');
      }
    });

    return await modal.present();
  }

  // NUEVA ARQUITECTURA: Procesar verificación con item específico
  private async procesarVerificacionDetallada(input: RecepcionMercaderiaItemInput, item: RecepcionMercaderiaItem) {
    try {
      this.isLoading = true;
      console.log('💾 [RecepcionAgrupadaPage] Guardando verificación detallada:', input);

      // NUEVA ARQUITECTURA: Asegurar que el input tenga el ID del item
      if (!input.id) {
        input.id = item.id;
      }

      const result = await this.pedidoService.saveRecepcionMercaderiaItem(input);
      result.subscribe({
        next: async (response: any) => {
          if (response) {
            console.log('✅ [RecepcionAgrupadaPage] Verificación guardada exitosamente:', response);
            
            // NUEVA ARQUITECTURA: Actualizar estado del item
            await this.actualizarEstadoItemVerificado(item.id);
            
            // FASE 6: Recargar automáticamente los datos para mostrar el item verificado
            await this.cargarItemsRecepcion();
            
            // Recargar el sumario para mostrar el progreso actualizado
            await this.cargarSumarioRecepcion();
            
            this.notificacionService.open(
              'Verificación guardada exitosamente',
              TipoNotificacion.SUCCESS,
              3
            );
            
            // FASE 6: Mostrar mensaje de recarga automática
            setTimeout(() => {
              this.notificacionService.open(
                'Recargando datos automáticamente...',
                TipoNotificacion.NEUTRAL,
                2
              );
            }, 1000);
          } else {
            console.error('❌ [RecepcionAgrupadaPage] Error en respuesta de guardado:', response);
            this.notificacionService.open(
              'Error al guardar la verificación',
              TipoNotificacion.DANGER,
              3
            );
          }
        },
        error: (error) => {
          console.error('❌ [RecepcionAgrupadaPage] Error al guardar verificación:', error);
          this.notificacionService.open(
            'Error al guardar la verificación',
            TipoNotificacion.DANGER,
            3
          );
        }
      });
    } catch (error) {
      console.error('❌ [RecepcionAgrupadaPage] Error en procesarVerificacionDetallada:', error);
      this.notificacionService.open(
        'Error al procesar la verificación',
        TipoNotificacion.DANGER,
        3
      );
    } finally {
      this.isLoading = false;
    }
  }

  // NUEVA ARQUITECTURA: Actualizar estado del item verificado
  private async actualizarEstadoItemVerificado(itemId: number) {
    try {
      console.log('🔄 [RecepcionAgrupadaPage] Actualizando estado del item:', itemId);
      
      // FASE 6: No es necesario actualizar la lista local aquí
      // porque vamos a recargar todos los datos desde el backend
      console.log('✅ [RecepcionAgrupadaPage] Item marcado para recarga automática');
      
    } catch (error) {
      console.error('❌ [RecepcionAgrupadaPage] Error al actualizar estado del item:', error);
    }
  }

  // NUEVA ARQUITECTURA: Verificar producto desde la lista
  async onVerificarProducto(producto: ProductoAgrupado, metodo: MetodoVerificacion) {
    console.log('🔍 [RecepcionAgrupadaPage] Verificando producto:', producto, 'Método:', metodo);
    
    if (metodo === MetodoVerificacion.MANUAL) {
      // Mostrar advertencia para verificación manual
      await this.mostrarAdvertenciaVerificacionManual(producto);
    } else {
      // Verificación con escáner - abrir directamente
      if (producto.itemsPendientes.length > 0) {
        this.verificacionDetallada(producto.itemsPendientes[0]);
      }
    }
  }

  // NUEVA ARQUITECTURA: Mostrar advertencia para verificación manual
  private async mostrarAdvertenciaVerificacionManual(producto: ProductoAgrupado) {
    const alert = await this.alertController.create({
      header: '⚠️ Verificación Manual',
      message: `Estás por realizar una verificación MANUAL para "${producto.producto.nombre}". 
      
      ⚠️ **ADVERTENCIA**: La verificación manual es responsabilidad tuya. Asegúrate de que el producto sea correcto antes de proceder.`,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
          cssClass: 'alert-button-cancel'
        },
        {
          text: 'Continuar',
          cssClass: 'alert-button-confirm',
          handler: () => {
            if (producto.itemsPendientes.length > 0) {
              this.verificacionDetallada(producto.itemsPendientes[0]);
            }
          }
        }
      ]
    });

    await alert.present();
  }

  // NUEVA ARQUITECTURA: Mostrar menú de opciones al hacer click en un item
  async onItemClick(producto: ProductoAgrupado) {
    // Determinar opciones según el estado de la recepción
    let opciones: ActionMenuData[] = [];
    
    if (this.recepcionMercaderia?.estado === 'EN_PROCESO') {
      // En proceso: permitir editar y eliminar
      opciones = [
        {
          texto: 'Editar',
          role: 'editar',
          enabled: true
        },
        {
          texto: 'Eliminar',
          role: 'eliminar',
          enabled: true,
          class: 'btn-eliminar'
        }
      ];
    } else if (this.recepcionMercaderia?.estado === 'FINALIZADA' || this.recepcionMercaderia?.estado === 'CANCELADA') {
      // Finalizada o cancelada: solo ver detalles
      opciones = [
        {
          texto: 'Ver Detalles',
          role: 'ver_detalles',
          enabled: true
        }
      ];
    } else {
      // Estado pendiente: no hay acciones disponibles
      opciones = [
        {
          texto: 'No hay acciones disponibles',
          role: 'sin_accion',
          enabled: false
        }
      ];
    }

    try {
      const result = await this.menuActionService.presentActionSheet(opciones);
      
      if (result.role) {
        const action = result.role;
        
        switch (action) {
          case 'editar':
            await this.editarVerificacion(producto);
            break;
          case 'eliminar':
            await this.eliminarVerificacion(producto);
            break;
          case 'ver_detalles':
            await this.verDetallesVerificacion(producto);
            break;
        }
      }
    } catch (error) {
      console.error('❌ [RecepcionAgrupadaPage] Error al mostrar menú de opciones:', error);
    }
  }

  // NUEVA ARQUITECTURA: Editar verificación de un producto
  private async editarVerificacion(producto: ProductoAgrupado) {
    console.log('✏️ [RecepcionAgrupadaPage] Editando verificación de:', producto.producto.nombre);
    
    if (producto.itemsPendientes.length > 0) {
      // Usar el primer item para editar (asumiendo que todos tienen la misma verificación)
      const itemParaEditar = producto.itemsPendientes[0];
      
      // Abrir modal de verificación en modo edición
      await this.verificacionDetallada(itemParaEditar, false); // false = modo edición
    } else {
      this.notificacionService.open(
        'No se encontraron items para editar',
        TipoNotificacion.WARN,
        3
      );
    }
  }

  // NUEVA ARQUITECTURA: Ver detalles de verificación (solo lectura)
  private async verDetallesVerificacion(producto: ProductoAgrupado) {
    console.log('👁️ [RecepcionAgrupadaPage] Viendo detalles de verificación de:', producto.producto.nombre);
    
    if (producto.itemsPendientes.length > 0) {
      // Usar el primer item para ver detalles
      const itemParaVer = producto.itemsPendientes[0];
      
      // Abrir modal de verificación en modo solo lectura
      await this.verificacionDetallada(itemParaVer, true); // true = modo solo lectura
    } else {
      this.notificacionService.open(
        'No se encontraron items para ver',
        TipoNotificacion.WARN,
        3
      );
    }
  }

  // NUEVA ARQUITECTURA: Eliminar verificación de un producto
  private async eliminarVerificacion(producto: ProductoAgrupado) {
    console.log('🗑️ [RecepcionAgrupadaPage] Eliminando verificación de:', producto.producto.nombre);
    
    const alert = await this.alertController.create({
      header: '⚠️ Confirmar Eliminación',
      message: `¿Estás seguro de que deseas eliminar la verificación de "${producto.producto.nombre}"?
      
      Esta acción:
      • Eliminará todas las variaciones registradas
      • Marcará el item como PENDIENTE nuevamente
      • No se puede deshacer`,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
          cssClass: 'alert-button-cancel'
        },
        {
          text: 'Eliminar',
          cssClass: 'alert-button-danger',
          handler: async () => {
            await this.procesarEliminacionVerificacion(producto);
          }
        }
      ]
    });

    await alert.present();
  }

  // NUEVA ARQUITECTURA: Calcular cantidad total recibida para un grupo de items
  private calcularCantidadRecibidaTotal(items: RecepcionMercaderiaItem[]): number {
    let total = 0;
    items.forEach(item => {
      if (item.cantidadRecibida) {
        total += item.cantidadRecibida;
      }
    });
    return Math.round(total * 100) / 100;
  }

  // NUEVA ARQUITECTURA: Calcular cantidad total rechazada para un grupo de items
  private calcularCantidadRechazadaTotal(items: RecepcionMercaderiaItem[]): number {
    let total = 0;
    items.forEach(item => {
      if (item.cantidadRechazada) {
        total += item.cantidadRechazada;
      }
    });
    return Math.round(total * 100) / 100;
  }

  // NUEVA ARQUITECTURA: Obtener texto del estado de verificación con lógica inteligente
  private obtenerEstadoVerificacionTexto(estado: EstadoVerificacion, item?: RecepcionMercaderiaItem): string {
    switch (estado) {
      case EstadoVerificacion.VERIFICADO:
        return 'Verificado';
      case EstadoVerificacion.VERIFICADO_CON_DIFERENCIA:
        if (item && item.cantidadRecibida > 0 && item.cantidadRechazada > 0) {
          return 'Verificado con Rechazo Parcial';
        }
        return 'Verificado con Diferencia';
      case EstadoVerificacion.RECHAZADO:
        if (item && item.cantidadRecibida > 0) {
          return 'Rechazado Parcialmente';
        }
        return 'Rechazado';
      case EstadoVerificacion.PENDIENTE:
        return 'Pendiente';
      default:
        return 'Desconocido';
    }
  }

  // NUEVA ARQUITECTURA: Procesar la eliminación de verificación
  private async procesarEliminacionVerificacion(producto: ProductoAgrupado) {
    try {
      this.isLoading = true;
      console.log('🗑️ [RecepcionAgrupadaPage] Procesando eliminación de verificación...');
      
      if (producto.itemsPendientes.length === 0) {
        this.notificacionService.open(
          'No hay items para eliminar',
          TipoNotificacion.WARN,
          3
        );
        return;
      }
      
      // Obtener el primer item para eliminar
      const itemParaEliminar = producto.itemsPendientes[0];
      
      console.log('🗑️ [RecepcionAgrupadaPage] Eliminando verificación del item:', itemParaEliminar.id);
      console.log('🗑️ [RecepcionAgrupadaPage] Producto:', producto.producto.nombre);
      
      // Obtener el ID del RecepcionMercaderiaItem directamente
      const recepcionMercaderiaItemId = itemParaEliminar.id;
      
      if (!recepcionMercaderiaItemId) {
        console.error('❌ [RecepcionAgrupadaPage] No se pudo obtener recepcionMercaderiaItemId');
        this.notificacionService.open(
          'Error: No se pudo identificar el item a eliminar',
          TipoNotificacion.DANGER,
          3
        );
        return;
      }
      
      console.log('🗑️ [RecepcionAgrupadaPage] Parámetros:', { recepcionMercaderiaItemId });
      console.log('🗑️ [RecepcionAgrupadaPage] Tipo de ID:', typeof recepcionMercaderiaItemId);
      
      // Llamar al backend para resetear la verificación (eliminar variaciones y resetear estado)
      console.log('🗑️ [RecepcionAgrupadaPage] Llamando a pedidoService.resetearVerificacion...');
      console.log('🗑️ [RecepcionAgrupadaPage] ID a enviar:', recepcionMercaderiaItemId);
      
      try {
        console.log('🗑️ [RecepcionAgrupadaPage] Iniciando llamada GraphQL...');
        
        // El método devuelve un Observable, necesitamos suscribirnos
        const resultadoObservable = await this.pedidoService.resetearVerificacion(recepcionMercaderiaItemId);
        console.log('🗑️ [RecepcionAgrupadaPage] Observable recibido:', resultadoObservable);
        console.log('🗑️ [RecepcionAgrupadaPage] ¿Es Observable?', resultadoObservable && typeof resultadoObservable.subscribe === 'function');
        
        if (resultadoObservable && typeof resultadoObservable.subscribe === 'function') {
          // Suscribirse al Observable para obtener el resultado real
          resultadoObservable.subscribe({
            next: (resultado: any) => {
              console.log('🗑️ [RecepcionAgrupadaPage] Resultado real del backend:', resultado);
              console.log('🗑️ [RecepcionAgrupadaPage] Tipo de resultado:', typeof resultado);
              
              if (resultado && resultado.data !== undefined) {
                const resultadoFinal = resultado.data;
                console.log('🗑️ [RecepcionAgrupadaPage] Resultado final extraído:', resultadoFinal);
                
                if (resultadoFinal) {
                  console.log('✅ [RecepcionAgrupadaPage] Verificación eliminada exitosamente');
                  this.notificacionService.open(
                    `Verificación de "${producto.producto.nombre}" eliminada exitosamente`,
                    TipoNotificacion.SUCCESS,
                    3
                  );
                  
                  // Recargar datos para reflejar el cambio
                  console.log('🔄 [RecepcionAgrupadaPage] Recargando datos...');
                  this.cargarItemsRecepcion();
                  this.cargarSumarioRecepcion();
                  console.log('✅ [RecepcionAgrupadaPage] Datos recargados exitosamente');
                } else {
                  console.warn('⚠️ [RecepcionAgrupadaPage] No se pudo eliminar la verificación');
                  this.notificacionService.open(
                    'No se pudo eliminar la verificación',
                    TipoNotificacion.WARN,
                    3
                  );
                }
              } else {
                console.warn('⚠️ [RecepcionAgrupadaPage] Respuesta del backend sin estructura esperada:', resultado);
                this.notificacionService.open(
                  'Respuesta inesperada del backend',
                  TipoNotificacion.WARN,
                  3
                );
              }
            },
            error: (error: any) => {
              console.error('❌ [RecepcionAgrupadaPage] Error en la suscripción GraphQL:', error);
              this.notificacionService.open(
                'Error al procesar la respuesta del backend',
                TipoNotificacion.DANGER,
                3
              );
            }
          });
        } else {
          console.error('❌ [RecepcionAgrupadaPage] No se recibió un Observable válido');
          this.notificacionService.open(
            'Error en la comunicación con el backend',
            TipoNotificacion.DANGER,
            3
          );
        }
      } catch (error) {
        console.error('❌ [RecepcionAgrupadaPage] Error en la llamada al backend:', error);
        this.notificacionService.open(
          'Error al comunicarse con el backend',
          TipoNotificacion.DANGER,
          3
        );
      }
      
    } catch (error) {
      console.error('❌ [RecepcionAgrupadaPage] Error al eliminar verificación:', error);
      this.notificacionService.open(
        'Error al eliminar la verificación',
        TipoNotificacion.DANGER,
        3
      );
    } finally {
      this.isLoading = false;
    }
  }

  // NUEVA ARQUITECTURA: Cambiar página
  onPageChange(page: number) {
    this.currentPage = page;
    this.cargarItemsRecepcion();
  }

  // NUEVA ARQUITECTURA: Cambiar tamaño de página
  onPageSizeChange(size: number) {
    this.pageSize = size;
    this.currentPage = 0;
    this.cargarItemsRecepcion();
  }

  // NUEVA ARQUITECTURA: Finalizar recepción
  async onFinalizarRecepcion() {
    try {
      console.log('🔍 [RecepcionAgrupadaPage] Verificando progreso de recepción...');
      
      // Verificar que todos los items estén verificados consultando items pendientes
      const result = await this.pedidoService.getRecepcionItemsPaginados(
        this.recepcionId, 
        0, // Primera página
        1000, // Buscar en muchos items
        '', // Sin filtro de texto
        [EstadoVerificacion.PENDIENTE] // Solo items pendientes
      );
      
      result.subscribe({
        next: (response: any) => {
          if (response) {
            const pageData = response;
            const itemsPendientes: RecepcionMercaderiaItem[] = pageData.getContent || [];
            
            if (itemsPendientes.length > 0) {
              this.notificacionService.open(
                `Aún hay ${itemsPendientes.length} productos pendientes de verificar`,
                TipoNotificacion.WARN,
                3
              );
              return;
            }
            
            // No hay items pendientes, se puede finalizar
            this.procesarFinalizacion();
          }
        },
        error: (error) => {
          console.error('❌ [RecepcionAgrupadaPage] Error al verificar progreso:', error);
          this.notificacionService.open(
            'Error al verificar el progreso de la recepción',
            TipoNotificacion.DANGER,
            3
          );
        }
      });
    } catch (error) {
      console.error('❌ [RecepcionAgrupadaPage] Error en onFinalizarRecepcion:', error);
      this.notificacionService.open(
        'Error al verificar el progreso de la recepción',
        TipoNotificacion.DANGER,
        3
      );
    }
  }

  // NUEVA ARQUITECTURA: Procesar finalización
  private async procesarFinalizacion() {
    try {
      console.log('🚀 [RecepcionAgrupadaPage] Procesando finalización de recepción...');
      
      // TODO: Implementar finalización de recepción
      this.notificacionService.open(
        'Funcionalidad de finalización en desarrollo',
        TipoNotificacion.NEUTRAL,
        3
      );
    } catch (error) {
      console.error('❌ [RecepcionAgrupadaPage] Error en procesarFinalizacion:', error);
      this.notificacionService.open(
        'Error al finalizar la recepción',
        TipoNotificacion.DANGER,
        3
      );
    }
  }

  // NUEVA ARQUITECTURA: Volver
  onVolver() {
    this.router.navigate(['/operaciones/pedidos/recepcion-mercaderia']);
  }

  // NUEVA ARQUITECTURA: Cargar recepción de mercadería
  private async cargarRecepcionMercaderia() {
    try {
      const result = await this.pedidoService.getRecepcionMercaderia(this.recepcionId);
      result.subscribe({
        next: (response: any) => {
          if (response) {
            this.recepcionMercaderia = response;
            this.sucursal = response.sucursalRecepcion;
            console.log('✅ [RecepcionAgrupadaPage] Recepción cargada:', this.recepcionMercaderia);
          }
        },
        error: (error) => {
          console.error('❌ [RecepcionAgrupadaPage] Error al cargar recepción:', error);
        }
      });
    } catch (error) {
      console.error('❌ [RecepcionAgrupadaPage] Error en cargarRecepcionMercaderia:', error);
    }
  }

  // NUEVA ARQUITECTURA: Cargar sumario de recepción
  private async cargarSumarioRecepcion() {
    try {
      const result = await this.pedidoService.obtenerSumarioRecepcion(this.recepcionId);
      result.subscribe({
        next: (response: any) => {
          if (response) {
            this.sumarioRecepcion = response;
            console.log('✅ [RecepcionAgrupadaPage] Sumario cargado:', this.sumarioRecepcion);
          }
        },
        error: (error) => {
          console.error('❌ [RecepcionAgrupadaPage] Error al cargar sumario:', error);
        }
      });
    } catch (error) {
      console.error('❌ [RecepcionAgrupadaPage] Error en cargarSumarioRecepcion:', error);
    }
  }

  // NUEVA ARQUITECTURA: Alternar panel de información de recepción
  toggleRecepcionInfo(): void {
    this.recepcionInfoExpanded = !this.recepcionInfoExpanded;
  }

  // NUEVA ARQUITECTURA: Alternar panel de sumario
  toggleSumarioInfo(): void {
    this.sumarioInfoExpanded = !this.sumarioInfoExpanded;
  }

  // NUEVA ARQUITECTURA: Obtener cantidad total recibida para un producto
  getCantidadRecibidaTotal(producto: ProductoAgrupado): number {
    let total = 0;
    producto.itemsPendientes.forEach(item => {
      if (item.cantidadRecibida) {
        total += item.cantidadRecibida;
      }
    });
    return Math.round(total * 100) / 100;
  }

  // NUEVA ARQUITECTURA: Obtener texto del estado de verificación con lógica inteligente
  getEstadoVerificacionTexto(estado: EstadoVerificacion, item?: RecepcionMercaderiaItem): string {
    switch (estado) {
      case EstadoVerificacion.VERIFICADO:
        return 'Verificado';
      case EstadoVerificacion.VERIFICADO_CON_DIFERENCIA:
        if (item && item.cantidadRecibida > 0 && item.cantidadRechazada > 0) {
          return 'Verificado con Rechazo Parcial';
        }
        return 'Verificado con Diferencia';
      case EstadoVerificacion.RECHAZADO:
        if (item && item.cantidadRecibida > 0) {
          return 'Rechazado Parcialmente';
        }
        return 'Rechazado';
      case EstadoVerificacion.PENDIENTE:
        return 'Pendiente';
      default:
        return 'Desconocido';
    }
  }

  // NUEVA ARQUITECTURA: Actualizar propiedades computadas cuando cambie el filtro
  private actualizarPropiedadesComputadas() {
    // Actualizar nombre del estado filtro
    if (this.filtroEstado.length === 1) {
      this.nombreEstadoFiltro = this.getEstadoVerificacionTexto(this.filtroEstado[0]);
    } else {
      this.nombreEstadoFiltro = 'Múltiples';
    }

    // Actualizar título del historial
    if (this.filtroEstado.length === 1) {
      const estado = this.filtroEstado[0];
      switch (estado) {
        case EstadoVerificacion.VERIFICADO:
          this.tituloHistorial = 'Verificados';
          break;
        case EstadoVerificacion.VERIFICADO_CON_DIFERENCIA:
          this.tituloHistorial = 'Verificados con Diferencia';
          break;
        case EstadoVerificacion.RECHAZADO:
          this.tituloHistorial = 'Rechazados';
          break;
        default:
          this.tituloHistorial = 'Verificados';
      }
    } else {
      this.tituloHistorial = 'Verificados';
    }
  }



  // NUEVA ARQUITECTURA: Limpiar filtro de búsqueda
  limpiarFiltro() {
    this.searchForm.get('searchText')?.setValue('');
    this.filtroTexto = '';
    this.filtroEstado = [EstadoVerificacion.VERIFICADO, EstadoVerificacion.VERIFICADO_CON_DIFERENCIA, EstadoVerificacion.RECHAZADO]; // Resetear a todos los estados
    this.actualizarPropiedadesComputadas(); // Actualizar propiedades computadas
    this.currentPage = 0;
    this.cargarItemsRecepcion();
  }

  // NUEVA ARQUITECTURA: Abrir menú de filtro por estado
  async abrirFiltroEstado() {
    const opciones: ActionMenuData[] = [
      {
        texto: 'Todos',
        role: 'todos',
        enabled: true
      },
      {
        texto: 'Verificados',
        role: 'verificados',
        enabled: true
      },
      {
        texto: 'Verificados con Diferencia',
        role: 'verificados_con_diferencia',
        enabled: true
      },
      {
        texto: 'Rechazados',
        role: 'rechazados',
        enabled: true
      }
    ];

    try {
      const result = await this.menuActionService.presentActionSheet(opciones);
      
      if (result.role) {
        const action = result.role;
        
        switch (action) {
          case 'todos':
            this.filtroEstado = [EstadoVerificacion.VERIFICADO, EstadoVerificacion.VERIFICADO_CON_DIFERENCIA, EstadoVerificacion.RECHAZADO];
            break;
          case 'verificados':
            this.filtroEstado = [EstadoVerificacion.VERIFICADO];
            break;
          case 'verificados_con_diferencia':
            this.filtroEstado = [EstadoVerificacion.VERIFICADO_CON_DIFERENCIA];
            break;
          case 'rechazados':
            this.filtroEstado = [EstadoVerificacion.RECHAZADO];
            break;
        }
        
        // Aplicar el filtro seleccionado
        this.actualizarPropiedadesComputadas(); // Actualizar propiedades computadas
        this.currentPage = 0;
        this.cargarItemsRecepcion();
      }
    } catch (error) {
      console.error('❌ [RecepcionAgrupadaPage] Error al mostrar menú de filtro por estado:', error);
    }
  }

  // NUEVA ARQUITECTURA: Aplicar filtro de búsqueda
  aplicarFiltro() {
    this.currentPage = 0; // Volver a la primera página
    this.cargarItemsRecepcion();
  }

  /**
   * Expande automáticamente los paneles según la información disponible
   */
  private autoExpandPanels(): void {
    if (this.sumarioRecepcion) {
      // Mantener ambos paneles colapsados por defecto
      // El usuario puede expandirlos manualmente si desea ver más información
      this.recepcionInfoExpanded = false;
      this.sumarioInfoExpanded = false;
    }
  }
} 