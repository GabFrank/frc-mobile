import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { StockPorSucursalDialogComponent } from './stock-por-sucursal-dialog.component';

describe('StockPorSucursalDialogComponent', () => {
  let component: StockPorSucursalDialogComponent;
  let fixture: ComponentFixture<StockPorSucursalDialogComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ StockPorSucursalDialogComponent ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(StockPorSucursalDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
