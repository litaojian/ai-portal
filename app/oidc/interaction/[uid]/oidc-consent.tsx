"use client";

import { submitConsent, abortInteraction } from "@/app/actions/oidc-interaction";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";

export function OidcConsent({ uid, client, scopes }: { uid: string, client: string, scopes: string }) {
  const [loading, setLoading] = useState(false);

  const handleAllow = async () => {
    setLoading(true);
    const url = await submitConsent(uid);
    window.location.href = url;
  };

  const handleDeny = async () => {
    setLoading(true);
    const url = await abortInteraction(uid);
    window.location.href = url;
  };

  return (
    <Card className="w-[400px]">
      <CardHeader>
        <CardTitle>Authorize Application</CardTitle>
        <CardDescription>
          Application <strong>{client}</strong> wants to access your account.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="mb-2 text-sm text-muted-foreground">It requested the following permissions:</p>
        <ul className="list-disc pl-5 text-sm">
          {scopes.split(' ').map(s => <li key={s}>{s}</li>)}
        </ul>
      </CardContent>
      <CardFooter className="flex justify-end gap-2">
        <Button variant="outline" onClick={handleDeny} disabled={loading}>Deny</Button>
        <Button onClick={handleAllow} disabled={loading}>Authorize</Button>
      </CardFooter>
    </Card>
  );
}
