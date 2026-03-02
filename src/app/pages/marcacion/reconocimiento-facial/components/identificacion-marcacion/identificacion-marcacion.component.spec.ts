import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { IdentificacionMarcacionComponent } from './identificacion-marcacion.component';

describe('IdentificacionMarcacionComponent', () => {
  let component: IdentificacionMarcacionComponent;
  let fixture: ComponentFixture<IdentificacionMarcacionComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ IdentificacionMarcacionComponent ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(IdentificacionMarcacionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
