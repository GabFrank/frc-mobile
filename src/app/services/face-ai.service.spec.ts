import { TestBed } from '@angular/core/testing';

import { FaceAiService } from './face-ai.service';

describe('FaceAiService', () => {
  let service: FaceAiService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FaceAiService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
