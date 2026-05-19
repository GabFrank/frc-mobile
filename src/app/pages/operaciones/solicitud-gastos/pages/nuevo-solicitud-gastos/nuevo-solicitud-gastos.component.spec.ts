import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { NuevoSolicitudGastosComponent } from './nuevo-solicitud-gastos.component';

describe('NuevoSolicitudGastosComponent', () => {
  let component: NuevoSolicitudGastosComponent;
  let fixture: ComponentFixture<NuevoSolicitudGastosComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ NuevoSolicitudGastosComponent ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(NuevoSolicitudGastosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
