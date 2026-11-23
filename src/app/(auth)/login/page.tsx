import { AuthPage } from "@/components/site/auth-form";
export const metadata = { title: "Log in" };
export default function Page() {
  return <AuthPage mode="login" />;
}
