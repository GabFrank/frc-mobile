import { InventarioProductoItem } from './../inventario.model';
import { Routes, Router } from '@angular/router';
import { Component, OnInit } from '@angular/core';
import { InventarioService } from '../inventario.service';

@Component({
  selector: 'app-producto-info',
  templateUrl: './producto-info.component.html',
  styleUrls: ['./producto-info.component.scss'],
})
export class ProductoInfoComponent implements OnInit {

  selectedItem: InventarioProductoItem;

  constructor(public inventarioService: InventarioService, private router: Router) {
  }

  ngOnInit() {
  }

  onSelectItem(item){
    this.selectedItem = item;
    this.router.navigate([`/inventario/inventario-producto-item/${item.id}`])
  }

  // goToInventarioProductoItem(item){
  //   this.router.navigate(['/inventario-producto-item'])
  // }

}
