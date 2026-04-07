import { Injectable } from '@angular/core';
import { Platform } from '@ionic/angular';
import { BarcodeScanner, BarcodeFormat } from '@capacitor-mlkit/barcode-scanning';
import { from, Observable, of } from 'rxjs';

export interface BarcodeScanResult {
  text: string;
  format: string;
  cancelled: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class BarcodeScannerService {
  constructor(
    private platform: Platform
  ) { }

  scan(): Observable<BarcodeScanResult> {
    // Check if we are on a native platform (Android or iOS)
    if (this.platform.is('capacitor') && (this.platform.is('android') || this.platform.is('ios'))) {
      return from(this.scanNative());
    } else {
      // Use browser webcam fallback when in development/web
      return this.scanWithWebcam();
    }
  }

  private async scanNative(): Promise<BarcodeScanResult> {
    try {
      // 1. Check/Install Google Barcode Scanner Module (Android only, but safe to check)
      if (this.platform.is('android')) {
        const { available } = await BarcodeScanner.isGoogleBarcodeScannerModuleAvailable();
        if (!available) {
          await BarcodeScanner.installGoogleBarcodeScannerModule();
        }
      }

      // 2. Check and request permissions
      const status = await BarcodeScanner.checkPermissions();
      if (status.camera !== 'granted') {
        const res = await BarcodeScanner.requestPermissions();
        if (res.camera !== 'granted') {
          throw new Error('Camera permission was denied');
        }
      }

      // 3. Open the modern Google Barcode Scanner UI
      // This provides a high-quality, modern, and efficient scanning interface.
      const { barcodes } = await BarcodeScanner.scan({
        formats: [
          BarcodeFormat.QrCode,
          BarcodeFormat.Ean13,
          BarcodeFormat.Ean8,
          BarcodeFormat.Code128,
          BarcodeFormat.UpcA,
          BarcodeFormat.UpcE
        ]
      });

      if (barcodes && barcodes.length > 0) {
        return {
          text: barcodes[0].displayValue,
          format: barcodes[0].format,
          cancelled: false
        };
      } else {
        return {
          text: '',
          format: '',
          cancelled: true
        };
      }
    } catch (error) {
      console.error('Google ML Kit Scan Error:', error);
      // Return cancelled result on error to avoid breaking the UI flow
      return {
        text: '',
        format: '',
        cancelled: true
      };
    }
  }

  private scanWithWebcam(): Observable<BarcodeScanResult> {
    return new Observable(observer => {
      // Create elements for webcam preview with a modern look
      const modal = document.createElement('div');
      const container = document.createElement('div');
      const video = document.createElement('video');
      const overlay = document.createElement('div');
      const line = document.createElement('div');
      const closeButton = document.createElement('button');

      // Modal full screen backdrop
      modal.style.position = 'fixed';
      modal.style.top = '0';
      modal.style.left = '0';
      modal.style.width = '100%';
      modal.style.height = '100%';
      modal.style.backgroundColor = 'rgba(0, 0, 0, 0.9)';
      modal.style.zIndex = '999999';
      modal.style.display = 'flex';
      modal.style.flexDirection = 'column';
      modal.style.alignItems = 'center';
      modal.style.justifyContent = 'center';

      // Container for video
      container.style.position = 'relative';
      container.style.width = '90%';
      container.style.maxWidth = '500px';
      container.style.setProperty('aspect-ratio', '1/1');
      container.style.borderRadius = '20px';
      container.style.overflow = 'hidden';
      container.style.border = '2px solid rgba(255,255,255,0.3)';

      // Video styling
      video.style.width = '100%';
      video.style.height = '100%';
      video.style.objectFit = 'cover';

      // Scanning overlay (Modern UI look)
      overlay.style.position = 'absolute';
      overlay.style.top = '10%';
      overlay.style.left = '10%';
      overlay.style.right = '10%';
      overlay.style.bottom = '10%';
      overlay.style.border = '2px solid #00ff00';
      overlay.style.boxShadow = '0 0 0 1000px rgba(0,0,0,0.5)';
      overlay.style.borderRadius = '15px';

      // Scanning line
      line.style.position = 'absolute';
      line.style.top = '50%';
      line.style.left = '5%';
      line.style.width = '90%';
      line.style.height = '3px';
      line.style.backgroundColor = '#00ff00';
      line.style.boxShadow = '0 0 15px #00ff00';
      line.style.animation = 'scanAnim 2s infinite ease-in-out';

      const style = document.createElement('style');
      style.textContent = `
        @keyframes scanAnim {
          0% { top: 10%; }
          50% { top: 90%; }
          100% { top: 10%; }
        }
      `;
      document.head.appendChild(style);

      // Close button
      closeButton.textContent = 'CANCELAR';
      closeButton.style.marginTop = '40px';
      closeButton.style.padding = '12px 30px';
      closeButton.style.borderRadius = '30px';
      closeButton.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
      closeButton.style.color = 'white';
      closeButton.style.border = '1px solid white';
      closeButton.style.fontWeight = 'bold';
      closeButton.style.cursor = 'pointer';
      closeButton.style.setProperty('backdrop-filter', 'blur(5px)');

      // Append elements
      container.appendChild(video);
      container.appendChild(overlay);
      overlay.appendChild(line);
      modal.appendChild(container);
      modal.appendChild(closeButton);
      document.body.appendChild(modal);

      // Handle close button
      closeButton.addEventListener('click', () => {
        stopCamera();
        observer.next({
          text: '',
          format: '',
          cancelled: true
        });
        observer.complete();
      });

      // Access webcam
      navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      })
        .then(stream => {
          video.srcObject = stream;
          video.setAttribute('playsinline', 'true');
          video.play();

          // Load the barcode detection library if not loaded
          if (typeof window['ZXing'] === 'undefined') {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/@zxing/library@0.19.1';
            script.onload = startScanning;
            document.head.appendChild(script);
          } else {
            startScanning();
          }
        })
        .catch(err => {
          console.error('Error accessing camera:', err);
          observer.error(err);
          stopCamera();
        });

      let scanning = true;
      let scanInterval: ReturnType<typeof setInterval>;

      function startScanning() {
        if (!window['ZXing']) return;
        const codeReader = new window['ZXing'].BrowserMultiFormatReader();

        // Scan every 150ms for performance
        scanInterval = setInterval(() => {
          if (scanning) {
            try {
              codeReader.decodeFromVideoElement(video)
                .then(result => {
                  if (result) {
                    stopCamera();
                    observer.next({
                      text: result.text,
                      format: result.barcodeFormat?.toString() || 'Unknown',
                      cancelled: false
                    });
                    observer.complete();
                  }
                })
                .catch(() => {
                  // No barcode found in this frame
                });
            } catch (e) {
              // Ignore errors
            }
          }
        }, 150);
      }

      function stopCamera() {
        scanning = false;
        if (scanInterval) clearInterval(scanInterval);
        const stream = video.srcObject as MediaStream;
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
        }
        if (document.body.contains(modal)) {
          document.body.removeChild(modal);
        }
        if (document.head.contains(style)) {
          document.head.removeChild(style);
        }
      }
    });
  }
}
