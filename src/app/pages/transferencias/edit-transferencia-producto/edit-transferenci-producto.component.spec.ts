import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { EditTransferenciaProductoComponent } from './edit-transferenci-producto.component';

describe('EditTransferenciProductoComponent', () => {
  let component: EditTransferenciaProductoComponent;
  let fixture: ComponentFixture<EditTransferenciaProductoComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [EditTransferenciaProductoComponent],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(EditTransferenciaProductoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
