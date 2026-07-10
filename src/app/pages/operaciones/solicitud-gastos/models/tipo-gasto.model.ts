import { ModuloPadreGasto } from './ente.model';

export class TipoGasto {
  id: number;
  descripcion: string;
  activo?: boolean;
  autorizacion?: boolean;
  moduloPadre?: ModuloPadreGasto;
  tipoNaturaleza?: string;
  esPagoCuotaActivo?: boolean;
}
