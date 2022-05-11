import { TestBed } from '@angular/core/testing';

import { CargandoService } from './cargando.service';

describe('CargandoService', () => {
  let service: CargandoService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CargandoService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
