import axios from "axios";

// CRA exposes REACT_APP_* at build time on process.env
const baseURL =
  (process.env as Record<string, string | undefined>).REACT_APP_API_URL ??
  "http://localhost:5100";

export const http = axios.create({ baseURL });

