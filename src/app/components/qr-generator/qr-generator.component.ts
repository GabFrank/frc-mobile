import { PopOverService } from './../../services/pop-over.service';
import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-qr-generator',
  templateUrl: './qr-generator.component.html',
  styleUrls: ['./qr-generator.component.scss'],
})
export class QrGeneratorComponent implements OnInit {

  @Input()
  data;

  value;

  constructor(private popoverService: PopOverService) {

  }

  ngOnInit() {
    console.log(this.data)
    if(this.data!=null){
      this.value = this.data;
    }
  }

  onSalir(){
    this.popoverService.close(null)
  }

}
