import { AuthPage } from "@/components/site/auth-form";
export const metadata = { title: "Forgot password" };
export default function Page() {
  return <AuthPage mode="forgot" />;
}
