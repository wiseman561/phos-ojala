import axios from "axios";

// CRA does not support import.meta.env; fall back to process.env.
// Keep a permissive check for import.meta in case tooling changes.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const importMetaEnv = (typeof import !== 'undefined' ? (import as any).meta?.env : undefined);
const baseURL = importMetaEnv?.REACT_APP_API_URL || process.env.REACT_APP_API_URL || "http://localhost:5100";

export const http = axios.create({ baseURL });

