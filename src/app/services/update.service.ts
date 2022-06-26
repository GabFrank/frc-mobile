import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AppVersion } from '@ionic-native/app-version/ngx';
import { AlertController, Platform } from '@ionic/angular';

interface AppUpdate {
  current: string;
  enabled: boolean;
  msg?: {
    title: string;
    msg: string;
    btn: string;
  },
  majorMsg?: {
    title: string;
    msg: string;
    btn: string;
  },
  minorMsg?: {
    title: string;
    msg: string;
    btn: string;
  }
}

@Injectable({
  providedIn: 'root'
})
export class UpdateService {

  updateExample = ''
  maintenannceExample = ''

  constructor(
    private http: HttpClient,
    private alertCtrl: AlertController,
    private appVersion: AppVersion,
    private plt: Platform
  ) { }

  async chackForUpdate(){
    this.http.get(this.maintenannceExample).subscribe((info: AppUpdate) => {
      console.log('resulst: ', info);
      if(!info.enabled){
        this.presentAlert(info.msg.title, info.msg.msg, info.msg.btn)
      }
    })
  }

  openAppstoreEntry(){
    console.log('abrime')
  }

  async presentAlert(header, message, buttonText = '', allowClose = false){
    const buttons = []

    if(buttonText != ''){
      buttons.push( {
        text: buttonText,
        handler: () => {
          this.openAppstoreEntry()
        }
      })
    }

    if(allowClose){
      buttons.push( {
        text: 'Cerrar',
        role: 'Cancel'
      })
    }
    const alert = await this.alertCtrl.create( {
      header,
      message,
      buttons,
      backdropDismiss: allowClose
    })
  }
}
