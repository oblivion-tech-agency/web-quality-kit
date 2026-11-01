/**
 * Restauración exacta del DOM. Regla del contrato: `destroy()` deja el
 * elemento como estaba antes de montar (atributos, estilos inline, texto e
 * hijos), así un remount de React StrictMode no acumula restos.
 */

export type Restore = () => void;

export interface PreserveOptions {
  /** Atributos que el efecto puede tocar (se guardan, incluida su ausencia). */
  attributes?: string[];
  /** Propiedades de estilo inline que el efecto puede tocar (`transform`, `--p`…). */
  styles?: string[];
  /** Guarda y restaura los hijos tal cual (para efectos que reescriben el contenido). */
  children?: boolean;
}

/** Toma una foto del estado del elemento y devuelve la función que lo repone. */
export function preserve(el: Element, { attributes = [], styles = [], children = false }: PreserveOptions): Restore {
  const attrs = attributes.map((name) => [name, el.getAttribute(name)] as const);
  const style = (el as HTMLElement).style as CSSStyleDeclaration | undefined;
  const inline = styles.map((prop) => [prop, style?.getPropertyValue(prop) ?? '', style?.getPropertyPriority(prop) ?? ''] as const);
  const kids = children ? Array.from(el.childNodes) : null;
  const styleAttr = styles.length ? el.getAttribute('style') : null;
  const cssTextBefore = styles.length ? (style?.cssText ?? '') : '';

  return () => {
    for (const [name, value] of attrs) {
      if (value === null) el.removeAttribute(name);
      else el.setAttribute(name, value);
    }
    for (const [prop, value, priority] of inline) {
      if (!style) break;
      if (value) style.setProperty(prop, value, priority);
      else style.removeProperty(prop);
    }
    // Si el estilo quedó igual al de antes, se repone el atributo textual tal
    // cual estaba (el navegador lo normaliza al escribir propiedades).
    if (styles.length && style && style.cssText === cssTextBefore) {
      if (styleAttr === null) el.removeAttribute('style');
      else el.setAttribute('style', styleAttr);
    }
    if (kids) el.replaceChildren(...kids);
  };
}

/** Une varias funciones de limpieza en una, en orden inverso al de montaje. */
export function bundle(...fns: Array<(() => void) | undefined | null | false>): () => void {
  return () => {
    for (let i = fns.length - 1; i >= 0; i--) {
      const fn = fns[i];
      if (fn) fn();
    }
  };
}

/** Busca un hijo por atributo `data-fx-*` dentro del efecto. */
export const part = <T extends Element = HTMLElement>(root: ParentNode, name: string): T | null =>
  root.querySelector<T>(`[data-fx-${name}]`);

export const parts = <T extends Element = HTMLElement>(root: ParentNode, name: string): T[] =>
  Array.from(root.querySelectorAll<T>(`[data-fx-${name}]`));
