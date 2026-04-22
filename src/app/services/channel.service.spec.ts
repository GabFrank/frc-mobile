import { TestBed } from '@angular/core/testing';
import { ChannelService } from './channel.service';

describe('ChannelService', () => {
  let service: ChannelService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ChannelService);
  });

  describe('detectCurrentChannel', () => {
    it('should return alpha for -alpha.N suffix', () => {
      expect(service.detectCurrentChannel('1.1.0-alpha.3')).toBe('alpha');
      expect(service.detectCurrentChannel('2.0.0-alpha.1')).toBe('alpha');
    });

    it('should return beta for -beta.N suffix', () => {
      expect(service.detectCurrentChannel('1.1.0-beta.2')).toBe('beta');
      expect(service.detectCurrentChannel('3.0.0-beta.10')).toBe('beta');
    });

    it('should return stable for plain semver', () => {
      expect(service.detectCurrentChannel('1.0.1')).toBe('stable');
      expect(service.detectCurrentChannel('2.3.4')).toBe('stable');
    });

    it('should return stable for null/undefined/empty input', () => {
      expect(service.detectCurrentChannel(null)).toBe('stable');
      expect(service.detectCurrentChannel(undefined)).toBe('stable');
      expect(service.detectCurrentChannel('')).toBe('stable');
    });
  });

  describe('getChannelLabel', () => {
    it('should return capitalized channel name', () => {
      expect(service.getChannelLabel('alpha')).toBe('Alpha');
      expect(service.getChannelLabel('beta')).toBe('Beta');
      expect(service.getChannelLabel('stable')).toBe('Stable');
    });
  });
});
