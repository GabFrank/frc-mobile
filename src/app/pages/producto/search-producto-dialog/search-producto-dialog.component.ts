import { ActivatedRoute } from '@angular/router';
import { BarcodeScanner } from '@awesome-cordova-plugins/barcode-scanner/ngx';
import { Presentacion } from 'src/app/domains/productos/presentacion.model';
import { DialogoService } from 'src/app/services/dialogo.service';
import { ModalService } from './../../../services/modal.service';
import { PopOverService, PopoverSize } from './../../../services/pop-over.service';
import { UntilDestroy } from '@ngneat/until-destroy';
import { untilDestroyed } from '@ngneat/until-destroy';
import { Producto } from 'src/app/domains/productos/producto.model';
import { FormControl, Validators } from '@angular/forms';
import { Component, Input, OnInit } from '@angular/core';
import { ProductoService } from '../producto.service';
import { ImagePopoverComponent } from 'src/app/components/image-popover/image-popover.component';
import { Location } from '@angular/common';

export interface SearchProductoDialogData {
  mostrarPrecio: boolean;
}

@UntilDestroy()
@Component({
  selector: 'app-search-producto-dialog',
  templateUrl: './search-producto-dialog.component.html',
  styleUrls: ['./search-producto-dialog.component.scss'],
  providers: [BarcodeScanner]
})
export class SearchProductoDialogComponent implements OnInit {

  @Input()
  data;

  buscarControl = new FormControl('', [Validators.required, Validators.minLength(1)])
  productosList: Producto[]

  isSearching
  onSearchTimer
  showCargarMas = true;
  mostrarPrecio = false;

  constructor(
    private productoService: ProductoService,
    private popoverService: PopOverService,
    private modalService: ModalService,
    private dialogService: DialogoService,
    private barcodeScanner: BarcodeScanner,
    private route: ActivatedRoute,
    private _location: Location
  ) { }

  ngOnInit() {
    console.log(this.data)
    if(this.data?.data?.mostrarPrecio!=null){
      this.mostrarPrecio = this.data.data.mostrarPrecio;
    }
  }

  onBuscarClick(){
    this.onSearchProducto(this.buscarControl.value, null)
  }

  onSearchProducto(text: string, offset?: number) {
    this.isSearching = true;
    if (this.onSearchTimer != null) {
      clearTimeout(this.onSearchTimer);
    }
    if (text == "" || text == null || text == " ") {
      console.log("text is ", text);
      this.isSearching = false;
    } else {
      this.onSearchTimer = setTimeout(async () => {
        (await this.productoService.onSearch(text, offset)).pipe(untilDestroyed(this)).subscribe((res) => {
            if (offset == null) {
              this.productosList = res;
              this.showCargarMas = true
            } else {
              if(res?.length > 0) this.showCargarMas = true
              const arr = [...this.productosList.concat(res)];
              this.productosList = arr;
            }
            this.isSearching = false;
        });
      }, 1000);
    }
  }

  onAvatarClick(image){
    this.popoverService.open(ImagePopoverComponent, {
      image
    }, PopoverSize.MD)
  }

  onMasProductos(){
    this.showCargarMas = false;
    this.onSearchProducto(this.buscarControl.value, this.productosList?.length)
  }

  async onProductoClick(producto: Producto, index) {
    if (producto?.presentaciones == null) {
      (await this.productoService.getProducto(producto.id)).pipe(untilDestroyed(this)).subscribe((res) => {
        console.log(res);
        this.productosList[index].presentaciones = res.presentaciones;
      });
    }
  }

  onPresentacionClick(presentacion: Presentacion, producto: Producto){
    this.dialogService.open('Atención', `Seleccionaste el producto ${producto.descripcion} con la presentacion de ${presentacion.cantidad} unidades.`)
      .then(res => {
        if(res.role=='aceptar'){
          this.modalService.closeModal({presentacion : presentacion, producto: producto})

        }
      })
  }

  onBack(){
    if(this.modalService?.currentModal!=null){
      this.modalService.closeModal(null)
    } else {
      this._location.back()
    }
  }

  onCameraClick(){
    this.barcodeScanner.scan().then(barcodeData => {
      this.buscarControl.setValue(barcodeData.text)
      this.onSearchProducto(this.buscarControl.value, null)
    })
  }

}
