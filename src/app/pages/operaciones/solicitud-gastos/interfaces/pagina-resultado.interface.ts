/** Estructura de página que devuelve el backend en las consultas paginadas de GraphQL. */
export interface PaginaResultado<T> {
  getContent: T[];
  getTotalPages?: number;
  getTotalElements?: number;
  getNumberOfElements?: number;
  isFirst?: boolean;
  isLast?: boolean;
  hasNext?: boolean;
  hasPrevious?: boolean;
}
