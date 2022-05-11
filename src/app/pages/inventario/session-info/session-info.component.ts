import { InventarioService } from './../inventario.service';
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-session-info',
  templateUrl: './session-info.component.html',
  styleUrls: ['./session-info.component.scss'],
})
export class SessionInfoComponent implements OnInit {

  constructor(public inventarioService: InventarioService) {
   }

  ngOnInit() {
  }

}
