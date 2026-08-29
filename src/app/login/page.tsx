import LoginForm from "./login-form";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const setup = typeof params.setup === "string" ? params.setup : undefined;
  const callbackUrl = typeof params.callbackUrl === "string" ? params.callbackUrl : undefined;

  return <LoginForm setup={setup} callbackUrl={callbackUrl} />;
}
