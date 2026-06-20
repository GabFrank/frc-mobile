import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class CamaraService {

  private stream: MediaStream | null = null;

  async iniciarCamara(): Promise<MediaStream> {
    if (this.stream) {
      this.detenerCamara();
    }

    const constraints: MediaStreamConstraints = {
      video: {
        facingMode: 'user',
        width: { ideal: 640 },
        height: { ideal: 480 }
      }
    };

    try {
      this.stream = await navigator.mediaDevices.getUserMedia(constraints);
      return this.stream;
    } catch {
      this.stream = await navigator.mediaDevices.getUserMedia({ video: true });
      return this.stream;
    }
  }

  detenerCamara(video?: HTMLVideoElement | null): void {
    if (video) {
      video.srcObject = null;
    }
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }
  }

  /**
   * Captura un frame del video. Con espejar=true corrige la orientación del
   * sensor frontal para alinearla con fotos de enrolamiento (cámara nativa).
   */
  capturarFoto(videoElement: HTMLVideoElement, espejar = false): string {
    const canvas = document.createElement('canvas');
    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx || canvas.width === 0 || canvas.height === 0) {
      return '';
    }

    if (espejar) {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/png');
  }
}
