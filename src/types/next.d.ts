import type { IAdminUser } from "@/models/Admin";
import type { NextApiRequest } from "next";

declare module "next" {
  interface NextApiRequest {
    admin?: IAdminUser; // l’admin vérifié par le middleware
  }
}
