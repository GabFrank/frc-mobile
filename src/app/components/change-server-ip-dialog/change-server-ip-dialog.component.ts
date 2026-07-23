import { Component, OnInit } from '@angular/core';
import { UntypedFormControl, FormGroup } from '@angular/forms';
import { ModalService } from 'src/app/services/modal.service';
import { Preferences } from '@capacitor/preferences';

@Component({
  selector: 'app-change-server-ip-dialog',
  templateUrl: './change-server-ip-dialog.component.html',
  styleUrls: ['./change-server-ip-dialog.component.scss'],
})
export class ChangeServerIpDialogComponent implements OnInit {

  serverIpControl = new UntypedFormControl()
  serverPortControl = new UntypedFormControl()
  constructor(private modalService: ModalService) { }

  ngOnInit() {
  }

  async onGuardar() {
    localStorage.setItem('serverIp', this.serverIpControl.value)
    localStorage.setItem('serverPort', this.serverPortControl.value)
    localStorage.setItem('usuarioId', null)
    localStorage.setItem('token', null)
    await Preferences.set({ key: 'serverIp', value: this.serverIpControl.value })
    await Preferences.set({ key: 'serverPort', value: this.serverPortControl.value })
    window.location.reload()
  }

  onCancelar() {
    this.modalService.closeModal(null)
  }

  async onBodegaClick(){
    localStorage.setItem('serverIp', '159.203.86.103')
    localStorage.setItem('serverPort', '8081')
    localStorage.setItem('usuarioId', null)
    localStorage.setItem('token', null)
    await Preferences.set({ key: 'serverIp', value: '159.203.86.103' })
    await Preferences.set({ key: 'serverPort', value: '8081' })
    window.location.reload()

  }
  async onFarmaciaClick(){
    localStorage.setItem('serverIp', '159.203.86.103')
    localStorage.setItem('serverPort', '8082')
    localStorage.setItem('usuarioId', null)
    localStorage.setItem('token', null)
    await Preferences.set({ key: 'serverIp', value: '159.203.86.103' })
    await Preferences.set({ key: 'serverPort', value: '8082' })

    window.location.reload()

  }

}
