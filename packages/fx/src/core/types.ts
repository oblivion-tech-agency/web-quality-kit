/** Lo mínimo que devuelve todo efecto del kit. */
export interface FxHandle {
  /** Deja el DOM como estaba antes de montar y suelta listeners, observers, rAF y recursos. */
  destroy(): void;
}

/** Firma de todo efecto: un elemento raíz y opciones. */
export type FxFactory<O, H extends FxHandle = FxHandle> = (target: HTMLElement, options?: O) => H;
