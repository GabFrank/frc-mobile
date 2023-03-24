import { Component, OnInit } from '@angular/core';
import { Platform } from '@ionic/angular';

@Component({
  selector: 'app-app-update',
  templateUrl: './app-update.component.html',
  styleUrls: ['./app-update.component.scss'],
})
export class AppUpdateComponent implements OnInit {

  private readonly GH_URL =
    'https://github.com/GabFrank/frc-mobile/';

  constructor(private readonly platform: Platform) { }
  ngOnInit(): void {
    throw new Error('Method not implemented.');
  }


}
