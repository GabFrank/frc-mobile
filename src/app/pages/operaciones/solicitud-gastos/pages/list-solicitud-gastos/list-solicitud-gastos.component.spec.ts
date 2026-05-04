import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { ListSolicitudGastosComponent } from './list-solicitud-gastos.component';

describe('ListSolicitudGastosComponent', () => {
  let component: ListSolicitudGastosComponent;
  let fixture: ComponentFixture<ListSolicitudGastosComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ListSolicitudGastosComponent ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(ListSolicitudGastosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
