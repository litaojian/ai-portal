
import { db } from "@/lib/db";
import { oidcClients, applications } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// Use native crypto instead of uuid package
const uuidv4 = () => crypto.randomUUID();

async function main() {
    console.log("Checking for OIDC clients...");

    const existing = await db.query.oidcClients.findFirst({
        where: eq(oidcClients.clientId, "oidc_test_client")
    });

    if (existing) {
        console.log("Test client already exists:", existing.clientId);
        return;
    }

    console.log("Creating test application and OIDC client...");

    // 1. Create an App first
    const appId = uuidv4();
    await db.insert(applications).values({
        id: appId,
        name: "OIDC Test App",
        description: "Auto-generated for testing OIDC",
        type: "internal",
        status: "published"
    });

    // 2. Create OIDC Client
    await db.insert(oidcClients).values({
        applicationId: appId,
        clientId: "oidc_test_client",
        clientSecret: "test_secret_123",
        clientName: "Test Client",
        redirectUris: ["https://oidcdebugger.com/debug"],
        grantTypes: ["authorization_code", "refresh_token"],
        responseTypes: ["code"],
        scope: "openid profile email",
        tokenEndpointAuthMethod: "client_secret_basic"
    });

    console.log("✓ OIDC Test Client created: oidc_test_client");
}

main().catch(console.error).finally(() => process.exit(0));
