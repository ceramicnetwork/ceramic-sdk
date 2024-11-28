declare module "deep-diff" {
    export type DiffKind = "N" | "D" | "E" | "A";
  
    export interface Diff<T = any> {
      kind: DiffKind;
      path?: (string | number)[];
      lhs?: T;
      rhs?: T;
      index?: number;
      item?: Diff<T>;
    }
  
    export function diff<T = any>(
      lhs: T,
      rhs: T
    ): Array<Diff<T>> | undefined;
  
    export function applyChange<T = any>(
      target: T,
      source: T,
      change: Diff<T>
    ): void;
  
    export function revertChange<T = any>(
      target: T,
      source: T,
      change: Diff<T>
    ): void;
  }