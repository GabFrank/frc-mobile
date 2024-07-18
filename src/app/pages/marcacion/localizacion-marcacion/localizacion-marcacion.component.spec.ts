import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { LocalizacionMarcacionComponent } from './localizacion-marcacion.component';

describe('LocalizacionMarcacionComponent', () => {
  let component: LocalizacionMarcacionComponent;
  let fixture: ComponentFixture<LocalizacionMarcacionComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ LocalizacionMarcacionComponent ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(LocalizacionMarcacionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
