import { Component, OnInit } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { ActionSheetController, NavController } from '@ionic/angular';

@Component({
  selector: 'app-informaciones-personales-dashboard',
  templateUrl: './informaciones-personales-dashboard.component.html',
  styleUrls: ['./informaciones-personales-dashboard.component.scss'],
})
export class InformacionesPersonalesDashboardComponent implements OnInit {

  fullNameControl = new FormControl('', [Validators.required]);
  emailControl = new FormControl('', [Validators.email]);
  phoneControl = new FormControl('', [
    Validators.required,
    Validators.pattern(/^\d{4}-?\d{3}-?\d{3}$/), // Paraguayan phone number pattern
  ]);
  birthDateControl = new FormControl('', [Validators.required]);

  constructor(private navCtrl: NavController, private actionSheetController: ActionSheetController) {}

  ngOnInit() {
    // Load current profile data here
  }

  async presentActionSheet() {
    const actionSheet = await this.actionSheetController.create({
      header: 'Select an option',
      buttons: [
        {
          text: 'Tomar foto',
          icon: 'camera',
          handler: () => {
            // Implement photo capture here
          },
        },
        {
          text: 'Elegir foto existente',
          icon: 'image',
          handler: () => {
            // Implement photo selection here
          },
        },
      ],
    });
    await actionSheet.present();
  }

  goBack() {
    this.navCtrl.back();
  }

  saveProfile() {
    // Save profile data here
  }
}

