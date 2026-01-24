import { getInteractionDetails, submitLogin, submitConsent, abortInteraction } from "@/app/actions/oidc-interaction";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { redirect } from "next/navigation";
import { LoginForm } from "@/app/login/login-form"; // 我们可能需要改造 LoginForm
import { OidcLogin } from "./oidc-login"; // 新建一个专门的登录组件
import { OidcConsent } from "./oidc-consent"; // 新建同意组件

interface PageProps {
  params: Promise<{ uid: string }>;
}

export default async function InteractionPage({ params }: PageProps) {
  const { uid } = await params;
  let interaction;

  try {
    interaction = await getInteractionDetails(uid);
  } catch (e) {
    return <div>Interaction expired or invalid.</div>;
  }

  const prompt = interaction.prompt.name;
  const client = interaction.params.client_id;

  // 如果是登录 prompt
  if (prompt === "login") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <OidcLogin uid={uid} />
      </div>
    );
  }

  // 如果是授权 prompt
  if (prompt === "consent") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <OidcConsent uid={uid} client={client} scopes={interaction.params.scope} />
      </div>
    );
  }

  return <div>Unknown prompt: {prompt}</div>;
}
