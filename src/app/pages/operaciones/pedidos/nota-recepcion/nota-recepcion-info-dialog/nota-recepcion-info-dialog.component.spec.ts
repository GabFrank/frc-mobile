import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { NotaRecepcionInfoDialogComponent } from './nota-recepcion-info-dialog.component';

describe('NotaRecepcionInfoDialogComponent', () => {
  let component: NotaRecepcionInfoDialogComponent;
  let fixture: ComponentFixture<NotaRecepcionInfoDialogComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ NotaRecepcionInfoDialogComponent ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(NotaRecepcionInfoDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
