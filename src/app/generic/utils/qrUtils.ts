export interface QrData {
  sucursalId;
  tipoEntidad;
  idOrigen;
  idCentral;
  componentToOpen;
}

export function codificarQr(data: QrData): string{
  return 'frc-'+data.sucursalId+'-'+data.tipoEntidad+'-'+data.idOrigen+'-'+data.idCentral+'-'+data.componentToOpen;
}

export function descodificarQr(codigo: string){
  let arr = codigo.split('-');
  let res: QrData = {
    sucursalId: arr[1],
    tipoEntidad: arr[2],
    idOrigen: arr[3],
    idCentral: arr[4],
    componentToOpen: arr[5]
  }
  return res;
}
