import { TestBed } from '@angular/core/testing';

import { MenuActionService } from './menu-action.service';

describe('MenuActionService', () => {
  let service: MenuActionService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MenuActionService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
