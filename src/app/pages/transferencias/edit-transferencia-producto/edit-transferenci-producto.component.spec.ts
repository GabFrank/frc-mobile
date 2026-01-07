import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { EditTransferenciaProductoComponent } from './edit-transferenci-producto.component';
import { TransferenciaService } from '../transferencia.service';
import { CargandoService } from 'src/app/services/cargando.service';
import { MenuActionService } from 'src/app/services/menu-action.service';
import { ModalService } from 'src/app/services/modal.service';
import { DialogoService } from 'src/app/services/dialogo.service';
import { MainService } from 'src/app/services/main.service';
import { NotificacionService } from 'src/app/services/notificacion.service';
import { ProductoService } from '../../producto/producto.service';
import { SucursalService } from 'src/app/domains/empresarial/sucursal/sucursal.service';
import { of } from 'rxjs';

describe('EditTransferenciaProductoComponent', () => {
  let component: EditTransferenciaProductoComponent;
  let fixture: ComponentFixture<EditTransferenciaProductoComponent>;
  const transferenciaServiceMock = jasmine.createSpyObj('TransferenciaService', ['onGetTransferencia', 'onGetTransferenciaItensPorTransferenciaId']);
  const cargandoServiceMock = jasmine.createSpyObj('CargandoService', ['open', 'close']);
  const menuActionServiceMock = jasmine.createSpyObj('MenuActionService', ['presentActionSheet']);
  const modalServiceMock = jasmine.createSpyObj('ModalService', ['openModal']);
  const dialogoServiceMock = jasmine.createSpyObj('DialogoService', ['presentAlert']);
  const mainServiceMock = { usuarioActual: { id: 1 } };
  const notificacionServiceMock = jasmine.createSpyObj('NotificacionService', ['open']);
  const productoServiceMock = jasmine.createSpyObj('ProductoService', ['searchProducto']);
  const sucursalServiceMock = jasmine.createSpyObj('SucursalService', ['onGetAllSucursales']);

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [EditTransferenciaProductoComponent],
      imports: [
        IonicModule.forRoot(),
        RouterTestingModule,
        HttpClientTestingModule
      ],
      providers: [
        { provide: TransferenciaService, useValue: transferenciaServiceMock },
        { provide: CargandoService, useValue: cargandoServiceMock },
        { provide: MenuActionService, useValue: menuActionServiceMock },
        { provide: ModalService, useValue: modalServiceMock },
        { provide: DialogoService, useValue: dialogoServiceMock },
        { provide: MainService, useValue: mainServiceMock },
        { provide: NotificacionService, useValue: notificacionServiceMock },
        { provide: ProductoService, useValue: productoServiceMock },
        { provide: SucursalService, useValue: sucursalServiceMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(EditTransferenciaProductoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
