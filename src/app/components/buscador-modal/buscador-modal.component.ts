import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
} from '@angular/core';

/** Configuración para filtrado local (array completo ya cargado). */
export interface BuscadorModalConfigLocal<T> {
  modo: 'local';
  titulo: string;
  placeholder: string;
  icono: string;
  items: T[];
  campoTexto: (item: T) => string;
  campoId: (item: T) => unknown;
  campoSubtexto?: (item: T) => string;
}

/** Configuración para búsqueda paginada con infinite scroll. */
export interface BuscadorModalConfigPaginado<T> {
  modo: 'paginado';
  titulo: string;
  placeholder: string;
  icono: string;
  cargarPagina: (texto: string, pagina: number) => Promise<{ items: T[]; hayMas: boolean }>;
  campoTexto: (item: T) => string;
  campoId: (item: T) => unknown;
  campoSubtexto?: (item: T) => string;
  tamPagina?: number;
  debounceMs?: number;
}

export type BuscadorModalConfig<T> = BuscadorModalConfigLocal<T> | BuscadorModalConfigPaginado<T>;

@Component({
  selector: 'app-buscador-modal',
  templateUrl: './buscador-modal.component.html',
  styleUrls: ['./buscador-modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BuscadorModalComponent<T = unknown> implements OnChanges, OnDestroy {
  @Input() abierto = false;
  @Input() config: BuscadorModalConfig<T> | null = null;
  @Input() valorSeleccionadoId: unknown = null;

  @Output() seleccionar = new EventEmitter<T>();
  @Output() cerrar = new EventEmitter<void>();

  textoBusqueda = '';
  itemsFiltrados: T[] = [];
  cargando = false;
  hayMas = false;

  private paginaSiguiente = 0;
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['abierto'] && this.abierto && this.config) {
      this.reiniciarBusqueda();
    }
  }

  ngOnDestroy(): void {
    this.limpiarDebounce();
  }

  alCambiarTexto(): void {
    if (!this.config) {
      return;
    }
    if (this.config.modo === 'local') {
      this.filtrarLocal();
      return;
    }
    this.limpiarDebounce();
    const ms = this.config.debounceMs ?? 350;
    this.debounceTimer = setTimeout(() => {
      this.debounceTimer = null;
      this.paginaSiguiente = 0;
      void this.cargarPaginaRemota(false);
    }, ms);
  }

  alCargarMas(evento: CustomEvent): void {
    void this.cargarPaginaRemota(true, evento);
  }

  alSeleccionar(item: T, evento?: Event): void {
    evento?.stopPropagation();
    this.seleccionar.emit(item);
  }

  alCerrar(): void {
    this.limpiarDebounce();
    this.cerrar.emit();
  }

  esSeleccionado(item: T): boolean {
    if (!this.config || this.valorSeleccionadoId == null) {
      return false;
    }
    return this.config.campoId(item) === this.valorSeleccionadoId;
  }

  textoItem(item: T): string {
    return this.config?.campoTexto(item) ?? '';
  }

  subtextoItem(item: T): string {
    return this.config?.campoSubtexto?.(item) ?? '';
  }

  iconoItem(): string {
    return this.config?.icono ?? 'search-outline';
  }

  tituloModal(): string {
    return this.config?.titulo ?? '';
  }

  placeholderBusqueda(): string {
    return this.config?.placeholder ?? 'Buscar';
  }

  esModoLocal(): boolean {
    return this.config?.modo === 'local';
  }

  // ---------- Privados ----------

  private reiniciarBusqueda(): void {
    this.textoBusqueda = '';
    this.paginaSiguiente = 0;
    this.hayMas = false;
    this.cargando = false;
    this.limpiarDebounce();

    if (!this.config) {
      this.itemsFiltrados = [];
      return;
    }

    if (this.config.modo === 'local') {
      this.itemsFiltrados = [...this.config.items];
      this.cdr.markForCheck();
      return;
    }

    this.itemsFiltrados = [];
    this.hayMas = true;
    this.cdr.markForCheck();
    void this.cargarPaginaRemota(false);
  }

  private filtrarLocal(): void {
    if (!this.config || this.config.modo !== 'local') {
      return;
    }
    const query = this.textoBusqueda.trim().toLowerCase();
    if (!query) {
      this.itemsFiltrados = [...this.config.items];
      this.cdr.markForCheck();
      return;
    }
    this.itemsFiltrados = this.config.items.filter((item) => {
      const texto = this.config!.campoTexto(item).toLowerCase();
      const sub = this.config!.campoSubtexto?.(item)?.toLowerCase() ?? '';
      return texto.includes(query) || sub.includes(query);
    });
    this.cdr.markForCheck();
  }

  private async cargarPaginaRemota(append: boolean, infiniteEvent?: CustomEvent): Promise<void> {
    if (!this.config || this.config.modo !== 'paginado') {
      this.completarInfinite(infiniteEvent);
      return;
    }
    if (this.cargando) {
      this.completarInfinite(infiniteEvent);
      return;
    }
    if (append && !this.hayMas) {
      this.completarInfinite(infiniteEvent);
      return;
    }

    this.cargando = true;
    this.cdr.markForCheck();

    try {
      const pagina = append ? this.paginaSiguiente : 0;
      const texto = this.textoBusqueda.trim();
      const resultado = await this.config.cargarPagina(texto, pagina);

      if (append) {
        this.itemsFiltrados = [...this.itemsFiltrados, ...resultado.items];
      } else {
        this.itemsFiltrados = resultado.items;
      }
      this.paginaSiguiente = pagina + 1;
      this.hayMas = resultado.hayMas;
    } catch {
      if (!append) {
        this.itemsFiltrados = [];
      }
      this.hayMas = false;
    } finally {
      this.cargando = false;
      this.completarInfinite(infiniteEvent);
      this.cdr.markForCheck();
    }
  }

  private completarInfinite(evento?: CustomEvent): void {
    const target = evento?.target as { complete?: () => void } | undefined;
    target?.complete?.();
  }

  private limpiarDebounce(): void {
    if (this.debounceTimer != null) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
  }
}
