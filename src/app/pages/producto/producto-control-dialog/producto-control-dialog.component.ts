import { Component, Input, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Producto } from 'src/app/domains/productos/producto.model';
import { ModalService } from 'src/app/services/modal.service';
import { ModalController } from '@ionic/angular';
import { CalendarModal, CalendarModalOptions, CalendarResult } from 'ion7-calendar';


@Component({
  selector: 'app-producto-control-dialog',
  templateUrl: './producto-control-dialog.component.html',
  styleUrls: ['./producto-control-dialog.component.scss'],
})
export class ProductoControlDialogComponent implements OnInit {

  @Input() data: { producto: any; onlyView: boolean };
  producto: any = {};
  onlyView: boolean = false;
  prodVencidoForm: FormGroup;
  selectedDate: Date = null;

  constructor(
    private modalService: ModalService, 
    private fb: FormBuilder, 
    private modalCtrl: ModalController
  ) { }

  ngOnInit() {
    this.producto = this.data?.producto || {};
    this.onlyView = this.data?.onlyView || false;
    
   if(!this.onlyView) {
      this.prodVencidoForm = this.fb.group({
        cantidadVencimiento: this.fb.array(this.initCantVencimiento()),
      });
    }
  }

  async openCalendar(index: number) {
    const options: CalendarModalOptions = {
      pickMode: 'single',
      title: 'SELECCIONAR FECHA',
      monthFormat: 'MMMM yyyy',
      format: 'YYYY-MM-DD HH:mm', 
      doneLabel: 'LISTO',
      weekdays: ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'],
      closeIcon: true,
      canBackwardsSelected: true,
      weekStart: 1,
      defaultScrollTo: new Date(),
    };

    const myCalendar = await this.modalCtrl.create({
      component: CalendarModal,
      cssClass: 'myCalendar-class',
      backdropDismiss: false,
      componentProps: { options }
    });

    myCalendar.present();

    const event: any = await myCalendar.onDidDismiss();
    const date: CalendarResult = event.data;

    this.cantidadVencimiento.at(index).get('vencimiento')?.setValue(date.dateObj);
    this.cantidadVencimiento.at(index).get('vencimiento')?.markAsDirty();
  }

  initCantVencimiento(): FormGroup[] {
    return (
      this.producto.cantidadVencimiento?.map((item: any) =>
        this.fb.group({
          cantidad: [item.cantidad, [Validators.required]],
          vencimiento: [new Date(item.vencimiento), [Validators.required]],
        })
      ) || []
    );
  }

  get cantidadVencimiento(): FormArray {
    if (!this.prodVencidoForm) {
      return this.fb.array([]);
    }
    return this.prodVencidoForm.get('cantidadVencimiento') as FormArray;
  }

  agregarFecha() {
    this.cantidadVencimiento.push(
      this.fb.group({
        cantidad: ['', [Validators.required, Validators.minLength(1)]],
        vencimiento: ['', Validators.required],
      })
    );
  }

  eliminarfecha(index: number) {
    this.cantidadVencimiento.removeAt(index);
  }

  guardarCambios() {
    if (this.prodVencidoForm.valid) {
      const productoActualizado = {
        ...this.producto,
        cantidadVencimiento: this.prodVencidoForm.value.cantidadVencimiento,
      };
      this.modalService.closeModal({ productoActualizado });
    } else {
      console.log('Formulario inválido');
    }
  }

  cerrarModal() {
    this.modalService.closeModal(null);
  }
}

