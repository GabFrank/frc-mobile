import { PopOverService } from './../../services/pop-over.service';
import { NotificacionService } from './../../services/notificacion.service';
import { Component, ElementRef, Input, OnInit } from '@angular/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

@Component({
  selector: 'app-qr-generator',
  templateUrl: './qr-generator.component.html',
  styleUrls: ['./qr-generator.component.scss'],
})
export class QrGeneratorComponent implements OnInit {

  @Input()
  data;

  value;
  compartiendo = false;

  constructor(
    private popoverService: PopOverService,
    private notificacionService: NotificacionService,
    private elementRef: ElementRef
  ) {

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

  async onCompartir() {
    if (this.compartiendo) {
      return;
    }
    const imgElement: HTMLImageElement = this.elementRef.nativeElement.querySelector('.qr-container img');
    if (!imgElement?.src) {
      this.notificacionService.danger('El código QR aún no se generó');
      return;
    }
    this.compartiendo = true;
    try {
      const base64Data = imgElement.src.split(',')[1];
      const fileName = `qr-transferencia-${new Date().getTime()}.png`;
      const savedFile = await Filesystem.writeFile({
        path: fileName,
        data: base64Data,
        directory: Directory.Cache
      });
      await Share.share({
        title: 'Código QR',
        dialogTitle: 'Compartir código QR',
        files: [savedFile.uri]
      });
    } catch (e) {
      console.error('Error al compartir el QR', e);
      this.notificacionService.danger('No se pudo compartir el código QR');
    } finally {
      this.compartiendo = false;
    }
  }

}
