/// <reference types="vite/client" />

declare module 'node:fs' {
  export function existsSync(path: string): boolean
}
