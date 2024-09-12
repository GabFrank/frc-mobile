import { ipAddress, port } from "./conectionConfig";

export const environment = {
  production: true,
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
