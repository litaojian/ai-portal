import { mysqlTable, varchar, text, int, timestamp, boolean, json, uniqueIndex, index, real } from "drizzle-orm/mysql-core";
import { relations, type InferSelectModel } from "drizzle-orm";
import type { AdapterAccount } from "next-auth/adapters";
import { sql } from "drizzle-orm";

// Helper for dates
const now = () => timestamp("created_at", { mode: "date" }).defaultNow().notNull();
const updated = () => timestamp("updated_at", { mode: "date" }).onUpdateNow();

// Auth Tables matching NextAuth requirements
export const users = mysqlTable("uc_user", {
    id: varchar("id", { length: 255 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
    name: varchar("name", { length: 255 }).notNull(),
    email: varchar("email", { length: 255 }).notNull(), // uniqueIndex below
    emailVerified: timestamp("emailVerified", { mode: "date" }),
    image: varchar("image", { length: 255 }),
    password: varchar("password", { length: 255 }),
    role: varchar("role", { length: 50 }).default("USER").notNull(),
    createdAt: now(),
    updatedAt: updated(),
}, (table) => ({
    emailIdx: uniqueIndex("user_email_idx").on(table.email),
}));

export const accounts = mysqlTable(
    "uc_account",
    {
        userId: varchar("userId", { length: 255 })
            .notNull()
            .references(() => users.id, { onDelete: "cascade" }),
        type: varchar("type", { length: 255 }).$type<AdapterAccount["type"]>().notNull(),
        provider: varchar("provider", { length: 255 }).notNull(),
        providerAccountId: varchar("providerAccountId", { length: 255 }).notNull(),
        refresh_token: text("refresh_token"),
        access_token: text("access_token"),
        expires_at: int("expires_at"),
        token_type: varchar("token_type", { length: 255 }),
        scope: varchar("scope", { length: 255 }),
        id_token: text("id_token"),
        session_state: varchar("session_state", { length: 255 }),
    },
    (account) => ({
        compoundKey: uniqueIndex("account_provider_providerAccountId_key").on(
            account.provider,
            account.providerAccountId
        ),
    })
);

export const sessions = mysqlTable("uc_session", {
    sessionToken: varchar("sessionToken", { length: 255 }).primaryKey(),
    userId: varchar("userId", { length: 255 })
        .notNull()
        .references(() => users.id, { onDelete: "cascade" }),
    expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = mysqlTable(
    "uc_verificationtoken",
    {
        identifier: varchar("identifier", { length: 255 }).notNull(),
        token: varchar("token", { length: 255 }).notNull(),
        expires: timestamp("expires", { mode: "date" }).notNull(),
    },
    (vt) => ({
        compoundKey: uniqueIndex("verificationToken_identifier_token_key").on(
            vt.identifier,
            vt.token
        ),
    })
);

// Menu
export const menus = mysqlTable("uc_menu", {
    id: varchar("id", { length: 255 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
    title: varchar("title", { length: 255 }).notNull(),
    url: varchar("url", { length: 255 }).default("#"),
    icon: varchar("icon", { length: 255 }),
    group: varchar("group", { length: 50 }).default("main"),
    order: int("order").default(0),
    parentId: varchar("parentId", { length: 255 }), // Self-relation
    createdAt: now(),
    updatedAt: updated(),
});

export const menusRelations = relations(menus, ({ one, many }) => ({
    parent: one(menus, {
        fields: [menus.parentId],
        references: [menus.id],
        relationName: "menuHierarchy",
    }),
    children: many(menus, {
        relationName: "menuHierarchy",
    }),
}));

// Project


// Application
export const applications = mysqlTable("uc_application", {
    id: varchar("id", { length: 255 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    icon: varchar("icon", { length: 255 }),
    url: varchar("url", { length: 255 }),
    type: varchar("type", { length: 50 }).default("internal").notNull(),
    status: varchar("status", { length: 50 }).default("draft").notNull(),
    version: varchar("version", { length: 50 }).default("1.0.0").notNull(),
    developer: varchar("developer", { length: 255 }),
    category: varchar("category", { length: 50 }),
    createdAt: now(),
    updatedAt: updated(),
});

export const applicationsRelations = relations(applications, ({ many }) => ({
    oidcClient: many(oidcClients, {
        relationName: "appToClient"
    }),
}));

// OIDC Client
export const oidcClients = mysqlTable("oidc_client", {
    id: varchar("id", { length: 255 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
    applicationId: varchar("applicationId", { length: 255 }).references(() => applications.id, { onDelete: "cascade" }),
    clientId: varchar("clientId", { length: 255 }).notNull().unique(),
    clientSecret: varchar("clientSecret", { length: 255 }),
    clientName: varchar("clientName", { length: 255 }),
    clientUri: varchar("clientUri", { length: 255 }),
    logoUri: varchar("logoUri", { length: 255 }),
    redirectUris: json("redirectUris").notNull(), // Changed to JSON
    grantTypes: json("grantTypes").notNull(), // Changed to JSON
    responseTypes: json("responseTypes").notNull(), // Changed to JSON
    scope: varchar("scope", { length: 255 }).default("openid profile email"),
    tokenEndpointAuthMethod: varchar("tokenEndpointAuthMethod", { length: 50 }).default("client_secret_basic"),
    createdAt: now(),
    updatedAt: updated(),
}, (table) => ({
    appIdx: uniqueIndex("oidc_client_applicationId_idx").on(table.applicationId),
}));

export const oidcClientsRelations = relations(oidcClients, ({ one }) => ({
    application: one(applications, {
        fields: [oidcClients.applicationId],
        references: [applications.id],
        relationName: "appToClient"
    }),
}));

// OIDC Payload
export const oidcPayloads = mysqlTable("oidc_payload", {
    id: varchar("id", { length: 255 }).primaryKey(),
    type: varchar("type", { length: 50 }).notNull(),
    payload: json("payload").notNull(), // Changed to JSON
    grantId: varchar("grantId", { length: 255 }),
    userCode: varchar("userCode", { length: 255 }),
    uid: varchar("uid", { length: 255 }),
    expiresAt: timestamp("expiresAt", { mode: "date" }),
    consumedAt: timestamp("consumedAt", { mode: "date" }),
    createdAt: now(),
    updatedAt: updated(),
}, (table) => ({
    typeIdx: index("oidc_payload_type_idx").on(table.type),
    grantIdx: index("oidc_payload_grantId_idx").on(table.grantId),
    expiresIdx: index("oidc_payload_expiresAt_idx").on(table.expiresAt),
}));

// Role
export const roles = mysqlTable("uc_role", {
    id: varchar("id", { length: 255 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
    name: varchar("name", { length: 255 }).notNull(),
    code: varchar("code", { length: 50 }).notNull().unique(),
    description: text("description"),
    status: varchar("status", { length: 50 }).default("enabled").notNull(),
    createdAt: now(),
    updatedAt: updated(),
});

export const tables = {
    user: users,
    users: users,
    account: accounts,
    accounts: accounts,
    session: sessions,
    sessions: sessions,
    verificationToken: verificationTokens,
    verificationTokens: verificationTokens,
    menu: menus,
    menus: menus,
    role: roles,
    roles: roles,

    application: applications,
    applications: applications,
    oidcClient: oidcClients,
    oidcClients: oidcClients,
    oidcPayload: oidcPayloads,
    oidcPayloads: oidcPayloads,
};

export type User = InferSelectModel<typeof users>;
export type Account = InferSelectModel<typeof accounts>;
export type Session = InferSelectModel<typeof sessions>;
export type VerificationToken = InferSelectModel<typeof verificationTokens>;
export type Menu = InferSelectModel<typeof menus> & { children?: Menu[] };
export type Role = InferSelectModel<typeof roles>;

export type Application = InferSelectModel<typeof applications> & { oidcClient?: OidcClient | null };
export type OidcClient = InferSelectModel<typeof oidcClients>;
export type OidcPayload = InferSelectModel<typeof oidcPayloads>;
