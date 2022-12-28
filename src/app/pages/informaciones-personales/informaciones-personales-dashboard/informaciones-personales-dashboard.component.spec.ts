import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { InformacionesPersonalesDashboardComponent } from './informaciones-personales-dashboard.component';

describe('InformacionesPersonalesDashboardComponent', () => {
  let component: InformacionesPersonalesDashboardComponent;
  let fixture: ComponentFixture<InformacionesPersonalesDashboardComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ InformacionesPersonalesDashboardComponent ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(InformacionesPersonalesDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
