import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { BarcodeQrScannerComponent } from './barcode-qr-scanner.component';

describe('BarcodeQrScannerComponent', () => {
  let component: BarcodeQrScannerComponent;
  let fixture: ComponentFixture<BarcodeQrScannerComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ BarcodeQrScannerComponent ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(BarcodeQrScannerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
