// Small environment helper to avoid direct import.meta usage in modules
// Allows tests to override via process.env when running under Jest
export const getApiBase = (): string => {
  // prefer Vite-style env if available at runtime, otherwise use process.env
  // This keeps runtime behavior the same in production while allowing Jest to import safely
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const maybeImportMeta: any = typeof (globalThis as any).importMeta !== 'undefined' ? (globalThis as any).importMeta : undefined;
  if (typeof (global as any).process !== 'undefined' && (process.env as any).VITE_API_BASE) {
    return (process.env as any).VITE_API_BASE as string;
  }

  if (maybeImportMeta && maybeImportMeta.env && maybeImportMeta.env.VITE_API_BASE) {
    return maybeImportMeta.env.VITE_API_BASE as string;
  }

  // Fallback to localhost
  return 'http://localhost:8000';
};

export default getApiBase;
