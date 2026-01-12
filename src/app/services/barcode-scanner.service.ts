import { Injectable } from '@angular/core';
import { Platform } from '@ionic/angular';
import { BarcodeScanner, BarcodeFormat } from '@capacitor-mlkit/barcode-scanning';
import { from, Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';

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
    // Use native plugin on device
    if (this.platform.is('capacitor') || this.platform.is('cordova')) {
      return from(this.scanNative());
    } else {
      // Use browser webcam when in development
      return this.scanWithWebcam();
    }
  }

  private async scanNative(): Promise<BarcodeScanResult> {
    try {
      // Check if the Google Barcode Scanner module is available
      let { available } = await BarcodeScanner.isGoogleBarcodeScannerModuleAvailable();

      if (!available) {
        // Install the module if not available
        console.log('Google Barcode Scanner Module not available. Installing...');
        await BarcodeScanner.installGoogleBarcodeScannerModule();

        // Wait for usage - Poll for availability
        // Some devices (like Android 10) might not fire the progress event reliably or strictly sequentially.
        // Polling is safer here.
        let attempts = 0;
        const maxAttempts = 15; // Wait up to 15 seconds (usually takes 2-3s)

        while (!available && attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 1000));
          const result = await BarcodeScanner.isGoogleBarcodeScannerModuleAvailable();
          available = result.available;
          attempts++;
          console.log(`Checking availability attempt ${attempts}: ${available}`);
        }

        if (!available) {
          // One final check or attempt to scan anyway, relying on the error catch
          throw new Error('Google Barcode Scanner Module installation timed out or failed to verify availability.');
        }
      }

      // Start the scan
      const { barcodes } = await BarcodeScanner.scan();

      if (barcodes.length > 0) {
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
      console.error('Barcode scanning failed', error);
      // If error is related to module not available, providing a prompt might be good, but here we just return cancelled/empty.
      return {
        text: '',
        format: '',
        cancelled: true
      };
    }
  }

  private scanWithWebcam(): Observable<BarcodeScanResult> {
    return new Observable(observer => {
      // Create elements for webcam preview
      const modal = document.createElement('div');
      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      const closeButton = document.createElement('button');

      // Style the modal
      modal.style.position = 'fixed';
      modal.style.top = '0';
      modal.style.left = '0';
      modal.style.width = '100%';
      modal.style.height = '100%';
      modal.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
      modal.style.zIndex = '999999';
      modal.style.display = 'flex';
      modal.style.flexDirection = 'column';
      modal.style.alignItems = 'center';
      modal.style.justifyContent = 'center';

      // Style the video
      video.style.width = '100%';
      video.style.maxWidth = '400px';
      video.style.borderRadius = '8px';

      // Style the close button
      closeButton.textContent = 'Cancel';
      closeButton.style.marginTop = '20px';
      closeButton.style.padding = '10px 20px';
      closeButton.style.borderRadius = '4px';
      closeButton.style.backgroundColor = '#ff4081';
      closeButton.style.color = 'white';
      closeButton.style.border = 'none';
      closeButton.style.cursor = 'pointer';

      // Append elements
      modal.appendChild(video);
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
      navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
        .then(stream => {
          video.srcObject = stream;
          video.setAttribute('playsinline', 'true');
          video.play();

          // Load the barcode detection library
          const script = document.createElement('script');
          script.src = 'https://cdn.jsdelivr.net/npm/@zxing/library@latest';
          script.onload = startScanning;
          document.head.appendChild(script);
        })
        .catch(err => {
          console.error('Error accessing camera:', err);
          observer.error(err);
          document.body.removeChild(modal);
        });

      let scanning = true;

      function startScanning() {
        if (!window['ZXing']) return;
        const codeReader = new window['ZXing'].BrowserMultiFormatReader();

        // Scan every 100ms
        const scanInterval = setInterval(() => {
          if (scanning) {
            try {
              codeReader.decodeFromVideoElement(video)
                .then(result => {
                  if (result) {
                    stopCamera();
                    observer.next({
                      text: result.text,
                      format: result.format?.toString() || 'Unknown',
                      cancelled: false
                    });
                    observer.complete();
                  }
                })
                .catch(() => {
                  // No barcode found, continue scanning
                });
            } catch (e) {
              console.error('Scanning error:', e);
            }
          } else {
            clearInterval(scanInterval);
          }
        }, 100);
      }

      function stopCamera() {
        scanning = false;
        const stream = video.srcObject as MediaStream;
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
        }
        if (modal.parentNode) {
          document.body.removeChild(modal);
        }
      }
    });
  }
}
