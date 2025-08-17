import type { IAdminUser } from "@/models/Admin";

declare module "next" {
  interface NextApiRequest {
    admin?: IAdminUser; // admin attaché par withAdminAuth()
  }
}
