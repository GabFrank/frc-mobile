export class QrData {
  sucursalId?;
  tipoEntidad?;
  idOrigen?;
  idCentral?;
  componentToOpen?;
  data?;
  timestamp?;
}

export function codificarQr(data: QrData): string{
  return 'frc-'+data?.sucursalId+'-'+data?.tipoEntidad+'-'+data?.idOrigen+'-'+data?.idCentral+'-'+data?.componentToOpen+'-'+data?.data+'-'+data?.timestamp;
}

export function descodificarQr(codigo: string){
  let arr = codigo.split('-');
  let res: QrData = {
    sucursalId: arr[1],
    tipoEntidad: arr[2],
    idOrigen: arr[3],
    idCentral: arr[4],
    componentToOpen: arr[5],
    data: arr[6],
    timestamp: arr[7]
  }
  return res;
}
