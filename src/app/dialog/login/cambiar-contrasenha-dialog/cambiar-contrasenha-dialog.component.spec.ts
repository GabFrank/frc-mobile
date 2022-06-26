import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { CambiarContrasenhaDialogComponent } from './cambiar-contrasenha-dialog.component';

describe('CambiarContrasenhaDialogComponent', () => {
  let component: CambiarContrasenhaDialogComponent;
  let fixture: ComponentFixture<CambiarContrasenhaDialogComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ CambiarContrasenhaDialogComponent ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(CambiarContrasenhaDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
