/// <reference types="vite/client" />
/// <reference types="vue/ref-macros" />

declare module 'pinia' {
  export function defineStore<Id extends string, S, G, A>(
    id: Id,
    options: any
  ): any
  export function mapActions<Id extends string, S, G, A>(
    useStore: any,
    keys: Array<keyof A> | Record<string, keyof A>
  ): any
  export function mapState<Id extends string, S, G>(
    useStore: any,
    keys: Array<keyof S | keyof G> | Record<string, keyof S | keyof G>
  ): any
  export function mapWritableState<Id extends string, S>(
    useStore: any,
    keys: Array<keyof S> | Record<string, keyof S>
  ): any
}
