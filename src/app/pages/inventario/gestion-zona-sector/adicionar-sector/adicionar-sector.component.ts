import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-adicionar-sector',
  templateUrl: './adicionar-sector.component.html',
  styleUrls: ['./adicionar-sector.component.scss'],
})
export class AdicionarSectorComponent implements OnInit {

  @Input() data;

  constructor() { }

  ngOnInit() {}

}
