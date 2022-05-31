import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { FinalizarInventarioResumenComponent } from './finalizar-inventario-resumen.component';

describe('FinalizarInventarioResumenComponent', () => {
  let component: FinalizarInventarioResumenComponent;
  let fixture: ComponentFixture<FinalizarInventarioResumenComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ FinalizarInventarioResumenComponent ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(FinalizarInventarioResumenComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
