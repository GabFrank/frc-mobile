import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SolicitarPagoNotaRecepcionComponent } from './solicitar-pago-nota-recepcion.component';
import { IonicModule } from '@ionic/angular';
import { RouterTestingModule } from '@angular/router/testing';

describe('SolicitarPagoNotaRecepcionComponent', () => {
  let component: SolicitarPagoNotaRecepcionComponent;
  let fixture: ComponentFixture<SolicitarPagoNotaRecepcionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SolicitarPagoNotaRecepcionComponent],
      imports: [IonicModule.forRoot(), RouterTestingModule]
    }).compileComponents();

    fixture = TestBed.createComponent(SolicitarPagoNotaRecepcionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
}); 