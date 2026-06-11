import { TestBed } from '@angular/core/testing';

import { SolicitudGastosService } from './solicitud-gastos.service';

describe('SolicitudGastosService', () => {
  let service: SolicitudGastosService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SolicitudGastosService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
