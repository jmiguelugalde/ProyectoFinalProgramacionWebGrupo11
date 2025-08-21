import api from "./api";
import { AxiosHeaders } from "axios";

export type LoginResponse = {
  access_token: string;
  token_type: "bearer";
  user?: { id?: number; username: string; role?: string; email?: string };
};

export async function login(
  username: string,
  password: string
): Promise<LoginResponse> {
  const body = new URLSearchParams();
  body.set("username", username);
  body.set("password", password);

  const { data } = await api.post("/auth/login", body.toString(), {
    headers: new AxiosHeaders({
      "Content-Type": "application/x-www-form-urlencoded",
    }),
  });

  return data;
}
