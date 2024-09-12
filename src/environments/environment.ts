import { ipAddress, port } from './conectionConfig';

export const APP_CONFIG = {
  production: false,
  environment: 'LOCAL'
};

export const environment = {
  production: false,
  usuario: 1,
  sucursalId: 1
};

export const serverAdress = {
  serverIp:
    localStorage.getItem('serverIpAddress') != null
      ? localStorage.getItem('serverIpAddress')
      : ipAddress,
  serverPort: port
};
