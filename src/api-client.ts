import axios, {Method} from "axios";

type QueryType = Record<string, unknown>;
type BodyType = Record<string, unknown>;

type Opt = {
  authorization?: string;
  query?: QueryType;
  body?: BodyType | FormData;
};

const exec = async (method: Method, url: string, opts?: Opt) =>
  (
    await axios({
      method,
      url,
      headers: {
        Authorization: opts?.authorization,
        "Content-Type": opts?.body instanceof FormData ? "multipart/form-data" : "application/json",
      },
      params: opts?.query,
      data: opts?.body,
    })
  ).data;

export const toFormData = (obj: Record<string, string | number | boolean>) => {
  const res = new FormData();
  for (const [key, value] of Object.entries(obj)) {
    res.append(key, value.toString());
  }
  return res;
};

export const apiUtils = {
  exec,
  get: async (url: string, opts?: Omit<Opt, "body">) => exec("GET", url, opts),
  post: async (url: string, opts?: Opt) => exec("POST", url, opts),
  put: async (url: string, opts?: Opt) => exec("PUT", url, opts),
};

export class ApiClient {
  constructor(public authorization?: string) {}
  async exec(method: Method, url: string, opts?: Opt) {
    return (await apiUtils.exec(method, url, {authorization: this.authorization, ...opts})).data;
  }

  async get(url: string, opts?: Omit<Opt, "body">) {
    return (await apiUtils.get(url, {authorization: this.authorization, ...opts})).data;
  }

  async post(url: string, opts?: Opt) {
    return (await apiUtils.post(url, {authorization: this.authorization, ...opts})).data;
  }

  async put(url: string, opts?: Opt) {
    return (await apiUtils.put(url, {authorization: this.authorization, ...opts})).data;
  }
}
