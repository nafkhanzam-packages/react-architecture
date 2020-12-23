import axios, {Method} from "axios";

type QueryType = Record<string, unknown>;
type BodyType = Record<string, unknown>;

type Opt = {
  auth?: string;
  query?: QueryType;
  body?: BodyType;
};

const exec = async (method: Method, url: string, opts?: Opt) =>
  (
    await axios({
      method,
      url,
      headers: {
        Authorization: opts?.auth,
      },
      params: opts?.query,
    })
  ).data;

export const toFormData = (obj: Record<string, string | number | boolean>) => {
  const res = new FormData();
  for (const [key, value] of Object.entries(obj)) {
    res.append(key, value.toString());
  }
  return res;
};

export const apiClient = {
  exec,
  get: async (url: string, opts?: Omit<Opt, "body">) => exec("GET", url, opts),
  post: async (url: string, opts?: Opt) => exec("POST", url, opts),
  put: async (url: string, opts?: Opt) => exec("PUT", url, opts),
};

export class ApiClient {
  constructor(public auth: string) {}
  async exec(method: Method, url: string, opts?: Opt) {
    return (await apiClient.exec(method, url, {auth: this.auth, ...opts})).data;
  }

  async get(url: string, opts?: Omit<Opt, "body">) {
    return (await apiClient.get(url, {auth: this.auth, ...opts})).data;
  }

  async post(url: string, opts?: Opt) {
    return (await apiClient.post(url, {auth: this.auth, ...opts})).data;
  }

  async put(url: string, opts?: Opt) {
    return (await apiClient.put(url, {auth: this.auth, ...opts})).data;
  }
}
