import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { TransaferenciaListProductosComponent } from './transaferencia-list-productos.component';

describe('TransaferenciaListProductosComponent', () => {
  let component: TransaferenciaListProductosComponent;
  let fixture: ComponentFixture<TransaferenciaListProductosComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ TransaferenciaListProductosComponent ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(TransaferenciaListProductosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
