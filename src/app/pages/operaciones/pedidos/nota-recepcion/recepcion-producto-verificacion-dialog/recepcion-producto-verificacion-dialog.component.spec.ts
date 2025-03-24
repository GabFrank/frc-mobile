import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { RecepcionProductoVerificacionDialogComponent } from './recepcion-producto-verificacion-dialog.component';

describe('RecepcionProductoVerificacionDialogComponent', () => {
  let component: RecepcionProductoVerificacionDialogComponent;
  let fixture: ComponentFixture<RecepcionProductoVerificacionDialogComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ RecepcionProductoVerificacionDialogComponent ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(RecepcionProductoVerificacionDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
