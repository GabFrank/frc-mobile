import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { ModalService } from 'src/app/services/modal.service';

@Component({
  selector: 'app-change-server-ip-dialog',
  templateUrl: './change-server-ip-dialog.component.html',
  styleUrls: ['./change-server-ip-dialog.component.scss'],
})
export class ChangeServerIpDialogComponent implements OnInit {

  serverIpControl = new FormControl()
  serverPortControl = new FormControl()
  constructor(private modalService: ModalService) { }

  ngOnInit() {
  }

  onGuardar() {
    localStorage.setItem('serverIp', this.serverIpControl.value)
    localStorage.setItem('serverPort', this.serverPortControl.value)
    localStorage.setItem('usuarioId', null)
    localStorage.setItem('token', null)
    window.location.reload()
  }

  onCancelar() {
    this.modalService.closeModal(null)
  }

  onBodegaClick(){
    localStorage.setItem('serverIp', '159.203.86.103')
    localStorage.setItem('serverPort', '8081')
    localStorage.setItem('usuarioId', null)
    localStorage.setItem('token', null)
    window.location.reload()

  }
  onFarmaciaClick(){
    localStorage.setItem('serverIp', '159.203.86.103')
    localStorage.setItem('serverPort', '8082')
    localStorage.setItem('usuarioId', null)
    localStorage.setItem('token', null)

    window.location.reload()

  }

}
