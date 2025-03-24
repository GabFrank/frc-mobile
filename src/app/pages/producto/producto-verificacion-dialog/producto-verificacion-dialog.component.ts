import { Component, Input, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { Producto } from 'src/app/domains/productos/producto.model';

@Component({
  selector: 'app-producto-verificacion-dialog',
  templateUrl: './producto-verificacion-dialog.component.html',
  styleUrls: ['./producto-verificacion-dialog.component.scss']
})
export class ProductoVerificacionDialogComponent implements OnInit {
  @Input() data: { producto: Producto };
  selectedProducto: Producto;

  constructor(
    private modalController: ModalController
  ) { }

  ngOnInit() {
    console.log(this.data);
    
    this.selectedProducto = this.data?.producto;
  }

  onConfirm() {
    this.modalController.dismiss(true);
  }

  onCancel() {
    this.modalController.dismiss(false);
  }
} 