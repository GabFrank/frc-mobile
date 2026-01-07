import { Component, OnInit } from '@angular/core';
import { ClienteService } from './cliente.service';
import { ClienteInput, TipoCliente } from './model/cliente.model';

@Component({
  selector: 'app-clientes',
  templateUrl: './clientes.component.html',
  styleUrls: ['./clientes.component.scss'],
})
export class ClientesComponent implements OnInit {

  constructor(private clienteService: ClienteService) { }

  ngOnInit() { }

  async onAddCliente() {
    // Logic for adding a client
  }

}
