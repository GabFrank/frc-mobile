import { Component, OnInit } from '@angular/core';
import { UntypedFormControl} from '@angular/forms';
import { ConfigService } from 'src/app/services/config.service';
import { NotificacionService } from 'src/app/services/notificacion.service';
import { Moneda } from '../../operaciones/moneda/moneda.model';
import { Preferences } from '@capacitor/preferences';

@Component({
  selector: 'app-precio-config',
  templateUrl: './precio-config.component.html',
  styleUrls: ['./precio-config.component.scss'],
})
export class PrecioConfigComponent implements OnInit {

  mode: string;
  serverIpConsulta = new UntypedFormControl();
  serverPortConsulta = new UntypedFormControl();
  constructor(
    private configService: ConfigService, 
    private notificacionService: NotificacionService,
    ) {}

  ngOnInit(){
    this.configService.currentMode.subscribe(mode => {
      this.mode = mode;
    });
  }
  
  changeMode(mode: string){
    this.configService.setMode(mode);
    this.notificacionService.success('Modo '+ mode + ' activado');
  }
  
  async onServerCentral(){
    localStorage.setItem('serverIp', '159.203.86.103');
    localStorage.setItem('serverPort', '8081');
    localStorage.setItem('usuarioId', null);
    localStorage.setItem('token', null);
    await Preferences.set({ key: 'serverIp', value: '159.203.86.103' });
    await Preferences.set({ key: 'serverPort', value: '8081' });
    window.location.reload();
  }

  async onServerSucursal(){
    localStorage.setItem('serverIp', this.serverIpConsulta.value);
    localStorage.setItem('serverPort', this.serverPortConsulta.value);
    localStorage.setItem('usuarioId', null);
    localStorage.setItem('token', null);
    await Preferences.set({ key: 'serverIp', value: this.serverIpConsulta.value });
    await Preferences.set({ key: 'serverPort', value: this.serverPortConsulta.value });

    window.location.reload();
  }

}
