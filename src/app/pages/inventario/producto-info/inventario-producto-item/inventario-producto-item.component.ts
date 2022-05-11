import { untilDestroyed, UntilDestroy } from '@ngneat/until-destroy';
import { InventarioProducto, InventarioProductoItem } from './../../inventario.model';
import { InventarioService } from './../../inventario.service';
import { ActivatedRoute, Router, RouterLinkActive } from '@angular/router';
import { Component, OnInit } from '@angular/core';

@UntilDestroy()
@Component({
  selector: 'app-inventario-producto-item',
  templateUrl: './inventario-producto-item.component.html',
  styleUrls: ['./inventario-producto-item.component.scss'],
})
export class InventarioProductoItemComponent implements OnInit {
  selectedItem: InventarioProducto;

  constructor(private router: Router,
    private inventarioService: InventarioService,
    private route: ActivatedRoute) { }

  ngOnInit() {
    this.route.paramMap
    .pipe(untilDestroyed(this))
    .subscribe(res => {
      let id = res.get('id');
      console.log(id)
      if(id!=null){
        this.selectedItem = this.inventarioService.getInventarioProducto(id);
        console.log(this.selectedItem)
      }
    })
  }

  onVovler() {
    this.router.navigate(['/inventario/producto-info'])
  }

  onDelete(item){

  }

  onEdit(item){

  }

}
