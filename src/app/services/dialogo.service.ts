import { Observable } from 'rxjs';
import { Injectable } from '@angular/core';
import { AlertController } from '@ionic/angular';

@Injectable({
  providedIn: 'root'
})
export class DialogoService {

  constructor(private alertController: AlertController) { }

  /**
   * Abre un diálogo de alerta con opciones configurables
   * @param titulo Título del diálogo
   * @param texto Mensaje del diálogo
   * @param siNo Si es true, muestra botones "No" y "Si". Si es false, solo muestra "Aceptar"
   * @returns Promise que resuelve con el resultado del diálogo
   */
  async open(titulo: string, texto: string, siNo?: boolean): Promise<any> {
    const alert = await this.alertController.create({
      header: titulo,
      message: texto,
      buttons: siNo === true ? [
        {
          text: 'No',
          role: 'cancelar',
          id: 'cancelar-button',
          handler: () => {
            // No hacer nada, el diálogo se cerrará
          }
        },
        {
          text: 'Si',
          role: 'aceptar',
          id: 'aceptar-button',
          handler: () => {
            // No hacer nada, el diálogo se cerrará
          }
        }
      ] : [
        {
          text: 'Aceptar',
          role: 'aceptar',
          id: 'aceptar-button',
          handler: () => {
            // No hacer nada, el diálogo se cerrará
          }
        }
      ]
    });

    await alert.present();

    // Retornar el resultado del diálogo
    return alert.onDidDismiss();
  }

  /**
   * Abre un diálogo de confirmación específico para discrepancias de cantidad
   * @param cantidadTotal Cantidad total ingresada
   * @param cantidadEsperada Cantidad esperada
   * @returns Promise que resuelve con la opción seleccionada
   */
  async confirmarDiscrepanciaCantidad(cantidadTotal: number, cantidadEsperada: number): Promise<'volver' | 'confirmar'> {
    const mensaje = `La cantidad total (${cantidadTotal}) no coincide con la cantidad esperada (${cantidadEsperada}).\n\n¿Qué desea hacer?`;
    
    const alert = await this.alertController.create({
      header: 'Discrepancia de Cantidad',
      message: mensaje,
      buttons: [
        {
          text: 'Volver a Contar',
          role: 'volver',
          id: 'volver-button',
          handler: () => {
            // No hacer nada, el diálogo se cerrará
          }
        },
        {
          text: 'Confirmar y Rechazar Faltante',
          role: 'confirmar',
          id: 'confirmar-button',
          handler: () => {
            // No hacer nada, el diálogo se cerrará
          }
        }
      ]
    });

    await alert.present();

    const result = await alert.onDidDismiss();
    
    if (result.role === 'confirmar') {
      return 'confirmar';
    } else {
      return 'volver';
    }
  }

  /**
   * Abre un diálogo para seleccionar motivo de rechazo
   * @returns Promise que resuelve con el motivo seleccionado
   */
  async seleccionarMotivoRechazo(): Promise<MotivoRechazoFisico> {
    const alert = await this.alertController.create({
      header: 'Motivo de Rechazo',
      message: 'Seleccione el motivo por el cual se rechaza esta cantidad faltante:',
      inputs: [
        { type: 'radio', label: 'Producto Dañado',      value: 'PRODUCTO_DANADO' },
        { type: 'radio', label: 'Producto Vencido',     value: 'PRODUCTO_VENCIDO' },
        { type: 'radio', label: 'Producto Incorrecto',  value: 'PRODUCTO_INCORRECTO' },
        { type: 'radio', label: 'Cantidad Incorrecta',  value: 'CANTIDAD_INCORRECTA', checked: true },
        { type: 'radio', label: 'Otro',                 value: 'OTRO' }
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: 'Confirmar', role: 'confirm' }
      ]
    });

    await alert.present();

    const { role, data } = await alert.onDidDismiss<any>();

    console.log('🔍 [DialogoService] Resultado del diálogo:', { role, data });

    if (role === 'confirm' && data) {
      // El AlertController retorna {values: ['VALOR_SELECCIONADO']}
      let motivoSeleccionado: string;
      
      if (data.values && Array.isArray(data.values) && data.values.length > 0) {
        motivoSeleccionado = data.values[0];
      } else if (typeof data === 'string') {
        motivoSeleccionado = data;
      } else {
        console.warn('⚠️ [DialogoService] Estructura de data inesperada:', data);
        motivoSeleccionado = 'CANTIDAD_INCORRECTA';
      }
      
      console.log('🔍 [DialogoService] Motivo extraído:', motivoSeleccionado);
      return motivoSeleccionado as MotivoRechazoFisico;
    }
    
    // Valor por defecto si cancela o no hay data
    console.log('🔍 [DialogoService] Usando valor por defecto: CANTIDAD_INCORRECTA');
    return 'CANTIDAD_INCORRECTA' as MotivoRechazoFisico;
  }

  /**
   * Valida una fecha de vencimiento y muestra alertas si es necesario
   * @param fechaVencimiento Fecha de vencimiento a validar
   * @returns Promise que resuelve con la acción del usuario
   */
  async validarFechaVencimiento(fechaVencimiento: Date): Promise<'continuar' | 'cambiar'> {
    const fechaActual = new Date();
    const fechaActualSinHora = new Date(fechaActual.getFullYear(), fechaActual.getMonth(), fechaActual.getDate());
    const fechaVencimientoSinHora = new Date(fechaVencimiento.getFullYear(), fechaVencimiento.getMonth(), fechaVencimiento.getDate());
    
    // Calcular diferencia en días
    const diferenciaDias = Math.ceil((fechaVencimientoSinHora.getTime() - fechaActualSinHora.getTime()) / (1000 * 60 * 60 * 24));
    
    let mensaje = '';
    let titulo = '';
    
    if (diferenciaDias < 0) {
      // Producto vencido
      titulo = 'Producto Vencido';
      mensaje = `La fecha de vencimiento seleccionada (${fechaVencimiento.toLocaleDateString('es-ES')}) es anterior a la fecha actual.\n\nEste producto está vencido. ¿Desea continuar con esta fecha o seleccionar una nueva?`;
    } else if (diferenciaDias <= 30) {
      // Producto próximo a vencer
      titulo = 'Vencimiento Próximo';
      mensaje = `La fecha de vencimiento seleccionada (${fechaVencimiento.toLocaleDateString('es-ES')}) está a ${diferenciaDias} días de vencer.\n\n¿Desea continuar con esta fecha o seleccionar una nueva?`;
    } else {
      // Fecha válida, no mostrar alerta
      return 'continuar';
    }
    
    const alert = await this.alertController.create({
      header: titulo,
      message: mensaje,
      buttons: [
        {
          text: 'Cambiar Fecha',
          role: 'cambiar',
          handler: () => {
            // No hacer nada, el diálogo se cerrará
          }
        },
        {
          text: 'Continuar',
          role: 'continuar',
          handler: () => {
            // No hacer nada, el diálogo se cerrará
          }
        }
      ]
    });

    await alert.present();

    const result = await alert.onDidDismiss();
    
    if (result.role === 'continuar') {
      return 'continuar';
    } else {
      return 'cambiar';
    }
  }
}

// Enum para los motivos de rechazo (importado desde el modelo)
enum MotivoRechazoFisico {
  PRODUCTO_DANADO = 'PRODUCTO_DANADO',
  PRODUCTO_VENCIDO = 'PRODUCTO_VENCIDO',
  PRODUCTO_INCORRECTO = 'PRODUCTO_INCORRECTO',
  CANTIDAD_INCORRECTA = 'CANTIDAD_INCORRECTA',
  OTRO = 'OTRO'
}
