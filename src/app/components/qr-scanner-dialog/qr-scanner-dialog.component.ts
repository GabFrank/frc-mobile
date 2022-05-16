import { ModalService } from './../../services/modal.service';
import { ModalController } from '@ionic/angular';
import { Component, EventEmitter, Inject, OnInit, Output } from '@angular/core';
import { Location } from '@angular/common';

@Component({
  selector: 'app-qr-scanner-dialog',
  templateUrl: './qr-scanner-dialog.component.html',
  styleUrls: ['./qr-scanner-dialog.component.scss'],
})
export class QrScannerDialogComponent implements OnInit {

  constructor(private modalService: ModalService
  ) { }

  ngOnInit() {
    console.log(this.modalService.currentModal)
  }

  onSuccess(e) {
    this.modalService.closeModal(e)
  }
  onError(e) {
    this.modalService.closeModal(e)
  }

  onExit() {
    this.modalService.closeModal(null)
  }

}
