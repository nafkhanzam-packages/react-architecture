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

export const apiUtils = {
  exec,
  get: async (url: string, opts?: Omit<Opt, "body">) => exec("GET", url, opts),
  post: async (url: string, opts?: Opt) => exec("POST", url, opts),
  put: async (url: string, opts?: Opt) => exec("PUT", url, opts),
  delete: async (url: string, opts?: Opt) => exec("DELETE", url, opts),
};

export class ApiClient {
  constructor(public baseUrl: string, public authorization?: string) {}
  async exec(method: Method, url: string, opts?: Opt) {
    return (
      await apiUtils.exec(method, this.toUrl(url), {authorization: this.authorization, ...opts})
    ).data;
  }

  async get(url: string, opts?: Omit<Opt, "body">) {
    return (await apiUtils.get(this.toUrl(url), {authorization: this.authorization, ...opts})).data;
  }

  async post(url: string, opts?: Opt) {
    return (await apiUtils.post(this.toUrl(url), {authorization: this.authorization, ...opts}))
      .data;
  }

  async put(url: string, opts?: Opt) {
    return (await apiUtils.put(this.toUrl(url), {authorization: this.authorization, ...opts})).data;
  }

  async delete(url: string, opts?: Opt) {
    return (await apiUtils.delete(this.toUrl(url), {authorization: this.authorization, ...opts}))
      .data;
  }

  private toUrl(url: string) {
    if (url.startsWith("/") && this.baseUrl) {
      url = this.baseUrl + url;
    }
    return url;
  }
}
