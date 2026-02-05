"use client";

import { submitConsent, abortInteraction } from "@/app/actions/oidc-interaction";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";

import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export function OidcConsent({ uid, client, scopes }: { uid: string, client: string, scopes: string }) {
  const [loading, setLoading] = useState(false);

  const handleAllow = async () => {
    setLoading(true);
    try {
      const url = await submitConsent(uid);
      console.log("ltj Redirecting to:", url);
      //const result = await fetch(url);
      //console.log("ltj Fetch result:", result);

      window.location.href = url;
    } catch (error: any) {
      toast.error(error.message || "Consent failed");
      setLoading(false);
    }
  };

  const handleDeny = async () => {
    setLoading(true);
    try {
      const url = await abortInteraction(uid);
      window.location.href = url;
    } catch (error: any) {
      toast.error(error.message || "Abort failed");
      setLoading(false);
    }
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
        <Button variant="outline" onClick={handleDeny} disabled={loading}>
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Deny
        </Button>
        <Button onClick={handleAllow} disabled={loading}>
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Authorize
        </Button>
      </CardFooter>
    </Card>
  );
}
