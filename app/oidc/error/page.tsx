import OidcErrorPage from "@/components/oidc/oidc-error-page";

export default async function OidcError({
    searchParams,
}: {
    searchParams: Promise<{ error?: string; details?: string }>;
}) {
    const { error, details } = await searchParams;

    return (
        <OidcErrorPage
            error={error || "Unknown OIDC Error"}
            details={details || "No further details provided."}
        />
    );
}
