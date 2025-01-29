import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { HistoricoNotaRecepcionComponent } from './historico-nota-recepcion.component';

describe('HistoricoNotaRecepcionComponent', () => {
  let component: HistoricoNotaRecepcionComponent;
  let fixture: ComponentFixture<HistoricoNotaRecepcionComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ HistoricoNotaRecepcionComponent ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(HistoricoNotaRecepcionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
