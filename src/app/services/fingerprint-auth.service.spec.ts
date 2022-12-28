import { TestBed } from '@angular/core/testing';

import { FingerprintAuthService } from './fingerprint-auth.service';

describe('FingerprintAuthService', () => {
  let service: FingerprintAuthService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FingerprintAuthService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
