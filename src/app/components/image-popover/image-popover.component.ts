import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-image-popover',
  templateUrl: './image-popover.component.html',
  styleUrls: ['./image-popover.component.scss'],
})
export class ImagePopoverComponent implements OnInit {

  @Input()
  data;

  constructor() { }

  ngOnInit() {
  }

}
