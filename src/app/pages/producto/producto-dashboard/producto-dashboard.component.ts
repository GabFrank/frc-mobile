import { Producto } from 'src/app/domains/productos/producto.model';
import { SearchProductoDialogComponent } from './../search-producto-dialog/search-producto-dialog.component';
import { ModalService } from './../../../services/modal.service';
import { Router, ActivatedRoute } from '@angular/router';
import { Component, OnInit } from '@angular/core';
import { Presentacion } from 'src/app/domains/productos/presentacion.model';

@Component({
  selector: 'app-producto-dashboard',
  templateUrl: './producto-dashboard.component.html',
  styleUrls: ['./producto-dashboard.component.scss'],
})
export class ProductoDashboardComponent implements OnInit {

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private modalService: ModalService
  ) { }

  ngOnInit() {}

  onBuscarProducto(){
    this.modalService.openModal(SearchProductoDialogComponent, {
      data: {
        mostrarPrecio: true
      }
    }).then(res => {
      if(res!=null){
        console.log(res)
        let presentacion: Presentacion = res.data['presentacion'];
        let producto: Producto = res.data['producto'];
      }
    })
  }

}
