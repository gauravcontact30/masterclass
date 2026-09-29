import { defineHandbook } from "./shared";

/**
 * Authentication, split by who owns the user store.
 *
 * Auth.js and Better Auth keep users in your database; Kinde and Clerk host
 * them. That difference decides migrations, pricing and what happens when the
 * vendor is unavailable, so it is the line these handbooks are drawn along
 * rather than the framework each one plugs into.
 */
export const AUTH_HANDBOOKS = [
  defineHandbook("Authentication with Auth.js & Kinde Auth", "Providers, callbacks, sessions, JWTs, route protection and the hosted alternative.", "https://authjs.dev/getting-started", {
    mechanism: "Auth.js runs in your application and stores sessions either as an encrypted cookie or in your database through an adapter. Kinde hosts the identity service instead, redirecting to its own pages and returning tokens your app verifies.",
    example: "A Next.js app signs in with GitHub through Auth.js, persists users with a database adapter, and adds the user's role to the session in a callback so middleware can protect routes without a database read per request.",
    pitfall: "A JWT session is not revocable on its own — signing out clears the cookie but an already-issued token stays valid until it expires. Short lifetimes plus a server-side check are what actually end a session early.",
  }, {
    "Auth.js setup": [
      ["Configuration", "Declare providers, secret, session strategy and callbacks in one config.", [
        "One exported config object is the whole contract: providers, secret, strategy and callbacks.",
        "The same object feeds the route handler and the server-side session helpers.",
        "Splitting it into an edge-safe half is what lets middleware run without the database adapter.",
      ]],
      ["Route handlers", "Mount the sign-in, callback and sign-out endpoints the library expects.", [
        "A single catch-all route serves sign-in, callback, sign-out and the CSRF endpoint.",
        "The provider's redirect URI must match this path exactly or the callback 404s.",
        "Exporting GET and POST from the same file is required; a missing POST breaks sign-out.",
      ]],
      ["Environment secrets", "Set the signing secret and provider credentials per environment.", [
        "The signing secret derives the session encryption key, so rotating it invalidates every cookie.",
        "Provider client secrets differ per environment because each has its own redirect URI.",
        "A missing secret fails closed at boot in production and silently generates one in development.",
      ]],
      ["Trusted host and URL", "Configure the canonical URL so OAuth redirects resolve correctly.", [
        "The canonical URL is what the library builds OAuth redirect targets from.",
        "Behind a proxy the forwarded host must be trusted, or callbacks resolve to the internal address.",
        "A preview deployment on a generated domain needs the host allowed or sign-in loops back.",
      ]],
      ["Sign-in and sign-out", "Trigger flows from the client or server and handle the redirect.", [
        "Sign-in takes a provider id and a callback URL to return to afterwards.",
        "Sign-out must clear the cookie server-side; clearing it client-side leaves the session readable.",
        "The redirect flag lets the caller handle the result instead of the browser navigating.",
      ]],
      ["Custom pages", "Replace the default sign-in and error pages with your own.", [
        "Pointing the config at your own routes replaces the built-in sign-in and error screens.",
        "The error page receives the failure reason as a query parameter to render.",
        "A custom page still posts to the library's endpoints, so the CSRF token must be included.",
      ]],
    ],
    "Providers": [
      ["OAuth providers", "Add GitHub, Google or another provider and register the redirect URI.", [
        "Each provider needs its redirect URI registered on the provider's side before it will return.",
        "Scopes requested at sign-in decide what the profile response contains.",
        "A provider added later does not link to existing users unless account linking is enabled.",
      ]],
      ["Credentials provider", "Accept a password only with your own hashing and lockout rules.", [
        "The library verifies nothing here: hashing, comparison and lockout are yours to write.",
        "It forces the JWT strategy, because there is no provider account to persist.",
        "Returning null is the only way to signal failure; throwing leaks the reason to the client.",
      ]],
      ["Email and magic links", "Sign in with a one-time link and an expiry the user cannot extend.", [
        "The link carries a single-use token stored server-side and deleted on redemption.",
        "An expiry the user cannot extend is what stops a forwarded mail granting access days later.",
        "It needs a database adapter, because the pending token has nowhere else to live.",
      ]],
      ["Account linking", "Attach a second provider to an existing user without duplicating accounts.", [
        "Linking attaches a second provider account to one user row rather than creating a duplicate.",
        "Automatic linking on a matching email trusts the provider to have verified that address.",
        "Unlinking the last provider leaves a user who cannot sign in at all.",
      ]],
      ["Provider profiles", "Map a provider's profile fields onto your own user shape.", [
        "The profile callback maps a provider's response onto your own user columns.",
        "Providers disagree on field names, so the mapping is per provider rather than shared.",
        "Whatever it returns is what the adapter writes, including the id the user is keyed by.",
      ]],
      ["OIDC specifics", "Handle scopes, the id token and provider-specific claims.", [
        "The id token carries claims already, so a userinfo request is often an avoidable round trip.",
        "Requesting offline access is what returns a refresh token; without it the access token simply expires.",
        "Clock skew between your server and the issuer makes valid tokens look expired.",
      ]],
    ],
    "Sessions & authorization": [
      ["JWT versus database sessions", "Trade a stateless cookie against a revocable server-side record.", [
        "A JWT costs no read per request but cannot be revoked before it expires.",
        "A database session is revocable immediately and costs one query on every request.",
        "The choice decides whether middleware can authorize without touching the database.",
      ]],
      ["Session and JWT callbacks", "Add roles or a user id to the token and expose them on the session.", [
        "The JWT callback runs on sign-in and refresh; the session callback runs on every read.",
        "Anything the client must see has to be copied across both, not just into the token.",
        "A token that grows with every callback eventually exceeds the cookie size limit.",
      ]],
      ["Reading the session", "Get the session on the server and in a client component correctly.", [
        "The server helper reads the cookie directly and needs no fetch to your own API.",
        "A client hook re-renders on change, which a one-off server read cannot do.",
        "Reading it in a layout opts the whole route into dynamic rendering.",
      ]],
      ["Middleware protection", "Guard route groups before they render.", [
        "Middleware runs before the route renders, so an unauthorized user never reaches the page.",
        "It cannot use a database adapter, which is why it pairs with the JWT strategy.",
        "A matcher that catches static assets makes every image request pay for an auth check.",
      ]],
      ["Role-based access", "Authorize by role or permission rather than by mere presence of a session.", [
        "Presence of a session answers who, not what they may do.",
        "The role must come from the token or a lookup, and only one of those is free.",
        "Checking the role in the page as well as the middleware is what survives a matcher mistake.",
      ]],
      ["Cookie security", "Set httpOnly, secure and sameSite so the cookie is not readable or forgeable.", [
        "httpOnly keeps the session out of reach of any script on the page.",
        "secure and sameSite together are what stop it riding along on a cross-site request.",
        "A cookie scoped to the parent domain is readable by every subdomain under it.",
      ]],
    ],
    "Kinde Auth": [
      ["Hosted sign-in", "Redirect to Kinde's pages and receive the user back with tokens.", [
        "The browser leaves your application entirely and returns with tokens on a callback.",
        "Branding and password policy live in Kinde's dashboard rather than your codebase.",
        "An outage at the provider is a full sign-in outage you cannot work around locally.",
      ]],
      ["SDK setup", "Wire the client and server helpers and the callback route.", [
        "The callback route exchanges the returned code for tokens and sets the session.",
        "Server and client helpers read the same session but from different places.",
        "The configured site URL must match the application's real origin or the exchange fails.",
      ]],
      ["Organizations", "Model multi-tenant users where a person belongs to several organizations.", [
        "A person can belong to several organizations, so identity alone does not decide access.",
        "The active organization travels in the token and scopes every query behind it.",
        "Switching organization issues a new token rather than mutating the current one.",
      ]],
      ["Permissions and roles", "Define authorization in Kinde and read it from the token.", [
        "Authorization is declared in Kinde and arrives as claims, not computed in your code.",
        "Reading a permission from the token avoids a round trip on every protected action.",
        "A permission changed in the dashboard does not apply until the token refreshes.",
      ]],
      ["Feature flags", "Read per-organization flags alongside identity.", [
        "Flags arrive on the same token as identity, so no second service is queried.",
        "Per-organization values let one tenant get a feature before the rest.",
        "A flag read from a cached token is as stale as that token is.",
      ]],
      ["Choosing hosted or self-hosted", "Weigh vendor ownership of the user store against what you must operate.", [
        "Hosting the user store means migrations, breach exposure and password policy are yours.",
        "A hosted provider owns the user records, so leaving means exporting and re-verifying them.",
        "Cost scales with users on a hosted plan and with engineering time on a self-hosted one.",
      ]],
    ],
  }),

  defineHandbook("BetterAuth", "Framework-agnostic authentication with sessions, plugins, organizations and two-factor support.", "https://www.better-auth.com/docs/introduction", {
    mechanism: "Better Auth owns its tables in your database and exposes a typed server and client API. Features arrive as plugins that extend both the schema and the client, so enabling two-factor authentication adds tables and methods together.",
    example: "Email and password sign-in is enabled first, then the organization plugin adds teams and invitations, then the two-factor plugin adds TOTP. Each step generates a migration, and the client gains typed methods for the new flows.",
    pitfall: "Plugins change the database schema. Enabling one in production without running the generated migration leaves the server calling for columns that do not exist, and the failure appears at sign-in rather than at deploy.",
  }, {
    "Hooks": [
      ["authClient.useSession", "Read the session reactively in a component, with isPending and error alongside the data.", [
        "It returns data, isPending and error together, so all three states are handled at once.",
        "The component re-renders when the session changes rather than reading a stale snapshot.",
        "Rendering before isPending clears is what makes a signed-in user flash as signed out.",
      ]],
      ["useSession versus getSession", "The hook re-renders on change; the promise is for everywhere a hook may not run.", [
        "The hook subscribes; the promise resolves once and never updates the caller.",
        "Server code and event handlers cannot call a hook, which is what the promise is for.",
        "Calling the promise on every render refetches the session instead of reusing it.",
      ]],
      ["Server hooks: before", "Run logic before a matched endpoint with createAuthMiddleware, and reject or rewrite the request.", [
        "createAuthMiddleware runs ahead of the matched endpoint and can reject the request outright.",
        "Rewriting the context here changes what the endpoint receives, not just what it logs.",
        "Throwing inside it is how a sign-up is blocked before any row is written.",
      ]],
      ["Server hooks: after", "Act once an endpoint has succeeded - send a welcome email, record an analytics event.", [
        "It runs only once the endpoint has succeeded, so side effects never fire on a failure.",
        "Welcome mail and analytics belong here rather than inside the endpoint itself.",
        "Work done here still delays the response unless it is handed to a queue.",
      ]],
      ["Hook matchers", "Match the paths a hook applies to, so it does not run on every auth request.", [
        "A matcher limits a hook to the paths it is about instead of every auth request.",
        "Without one, a sign-in hook also runs on session reads and token refreshes.",
        "Matching on path keeps the cost of a hook proportional to how often it is needed.",
      ]],
      ["getSessionFromCtx", "Read the caller's session inside a hook without a second round trip.", [
        "It reads the session already resolved for this request rather than fetching it again.",
        "Using it inside a hook avoids a second database round trip per call.",
        "It returns null for unauthenticated endpoints, which the hook must handle.",
      ]],
      ["Database hooks", "Intercept create and update on user, session and account records, before or after they are written.", [
        "They intercept create and update on user, session and account rows.",
        "A before hook can refuse or rewrite the write; an after hook only observes it.",
        "They fire for every path that touches the record, including provider callbacks.",
      ]],
      ["Plugin hooks", "Ship a plugin that contributes its own before and after handlers alongside its endpoints.", [
        "A plugin ships its own before and after handlers beside its endpoints.",
        "Handler order follows plugin registration order, which makes it deterministic.",
        "One plugin's hook can see the effect of another's, so ordering is a real dependency.",
      ]],
      ["Organization client hooks", "Read the active organization and membership lists through the plugin's own hooks.", [
        "The active organization and membership list are read through the plugin's own hooks.",
        "They re-render on a switch, so the interface never shows the previous tenant's data.",
        "They resolve only once the plugin is enabled on both server and client.",
      ]],
    ],
    "Core setup": [
      ["Server instance", "Configure the auth server with a database adapter and a base URL.", [
        "The server owns its tables through an adapter and a declared base URL.",
        "The base URL is what callback and redirect targets are built from.",
        "Enabled options here decide the schema, so the instance and migrations move together.",
      ]],
      ["Database schema", "Generate and apply the tables the enabled features require.", [
        "The generator emits the tables the currently enabled features require.",
        "Applying the migration before enabling the feature is what keeps sign-in working.",
        "A schema behind the configuration fails at request time, not at deploy.",
      ]],
      ["Route handler", "Mount the handler so client calls reach the server API.", [
        "Mounting the handler is what makes the client's typed calls reach the server API.",
        "The mount path must match the client's base path or every call 404s.",
        "One handler serves every enabled plugin's endpoints, not one route per feature.",
      ]],
      ["Client instance", "Create a typed client that matches the server's enabled plugins.", [
        "The client is typed from the server's enabled plugins, so missing methods are a compile error.",
        "Its base URL must point at the mounted handler, not the application root.",
        "Adding a plugin server-side without the client leaves the methods untyped.",
      ]],
      ["Environment configuration", "Set the secret and provider credentials per environment.", [
        "The secret signs sessions, so changing it signs everyone out at once.",
        "Provider credentials are per environment because each has its own callback URL.",
        "Configuration read at module load will not pick up a value set later at runtime.",
      ]],
      ["Framework adapters", "Integrate with Next.js, SvelteKit, Hono or a plain Node server.", [
        "An adapter translates the framework's request and response into what the handler expects.",
        "Cookie writing differs per framework, which is most of what the adapter carries.",
        "Running on the edge restricts the adapter to APIs that runtime actually provides.",
      ]],
    ],
    "Authentication methods": [
      ["Email and password", "Enable credential sign-up with verification and reset flows.", [
        "Verification and reset flows come with the method rather than being written by hand.",
        "Password rules are configured once and enforced on sign-up and reset alike.",
        "Enabling it adds credential columns the migration must apply first.",
      ]],
      ["Social providers", "Add OAuth providers and map returned profiles onto users.", [
        "The provider's returned profile is mapped onto the user row on first sign-in.",
        "Each provider needs its redirect URI registered before the callback will return.",
        "A second provider on the same email links or duplicates depending on configuration.",
      ]],
      ["Magic links", "Sign in with a single-use link and a short expiry.", [
        "The link is single use and dies on redemption, not on the next request.",
        "A short expiry is what limits the damage of a forwarded or logged URL.",
        "It needs somewhere to store the pending token, so the schema must be current.",
      ]],
      ["Passkeys", "Register and authenticate with WebAuthn credentials.", [
        "WebAuthn binds the credential to the origin, so it cannot be replayed elsewhere.",
        "The private key never leaves the authenticator, which removes the password to steal.",
        "Registration and authentication are separate ceremonies with separate endpoints.",
      ]],
      ["Two-factor authentication", "Add TOTP or OTP as a second step with recovery codes.", [
        "TOTP adds a second step whose codes are time-bound rather than reusable.",
        "Recovery codes are the fallback, and they must be single-use and stored hashed.",
        "Enabling it adds tables, so the migration has to land before the feature does.",
      ]],
      ["Anonymous and guest sessions", "Let a visitor act before signing up and upgrade the account later.", [
        "A visitor can act before signing up, and the work is kept against a real session.",
        "Upgrading links the existing session to the new account instead of starting over.",
        "A guest session still counts as a session, so authorization must check more than presence.",
      ]],
    ],
    "Sessions & accounts": [
      ["Session management", "Read, refresh and revoke sessions server-side.", [
        "Sessions are rows, so revoking one takes effect on the very next request.",
        "Listing a user's sessions is what makes a sign-out-everywhere control possible.",
        "Refreshing extends the record rather than issuing an unrelated new one.",
      ]],
      ["Cookie configuration", "Set attributes and domains so sessions work across subdomains.", [
        "The cookie domain decides which subdomains can see the session at all.",
        "sameSite governs whether the session rides along on cross-site navigation.",
        "Attributes set for local development will not be valid over HTTPS in production.",
      ]],
      ["Account linking", "Attach multiple providers to one user deliberately.", [
        "Linking keeps one user row when the same person arrives through a second provider.",
        "Trusting an unverified provider email is how one account gets taken over by another.",
        "Unlinking must refuse to remove the only remaining sign-in method.",
      ]],
      ["Email verification", "Block privileged actions until an address is confirmed.", [
        "Privileged actions stay blocked until the address is confirmed.",
        "The token is single use, so a resend must invalidate the previous one.",
        "Verification state belongs on the user row, not inferred from the provider.",
      ]],
      ["Password reset", "Issue single-use reset tokens that expire and cannot be replayed.", [
        "The reset token is single use and expires whether or not it is redeemed.",
        "Resetting must end existing sessions, or a thief keeps the one they already have.",
        "Responding identically for unknown addresses is what stops the form enumerating users.",
      ]],
      ["Session hooks", "Run logic before or after a sign-in or sign-out.", [
        "They run either side of a sign-in or sign-out rather than on every read.",
        "A before hook can refuse the sign-in; an after hook can only react to it.",
        "Audit records written here capture the event with the session still in context.",
      ]],
    ],
    "Plugins & multi-tenancy": [
      ["Organization plugin", "Model teams, memberships and invitations.", [
        "Teams, memberships and invitations arrive as tables plus typed client methods.",
        "A user's active organization is what every scoped query is filtered by.",
        "Enabling it changes the schema, so it is a migration before it is a feature.",
      ]],
      ["Roles and permissions", "Define access rules and check them on the server.", [
        "Rules are declared once and checked on the server, never only in the interface.",
        "A role is per membership, so the same user can be an admin of one team and not another.",
        "A client-side check is a convenience; the server check is the actual boundary.",
      ]],
      ["Admin plugin", "Impersonate, ban or manage users with an audited path.", [
        "Impersonation, bans and user management arrive on an audited path rather than ad hoc SQL.",
        "Every privileged action is attributable, which is what makes it reviewable afterwards.",
        "The plugin's own endpoints need protecting, or it becomes the way in.",
      ]],
      ["Rate limiting", "Throttle sign-in attempts to blunt credential stuffing.", [
        "Throttling sign-in attempts is what makes credential stuffing expensive.",
        "Limiting by address alone punishes shared networks and misses distributed attempts.",
        "The counter must be shared across instances or each one enforces its own limit.",
      ]],
      ["Custom plugins", "Extend the schema, server API and client together.", [
        "A plugin extends schema, server API and client types as one unit.",
        "Shipping the three together is what keeps the client's methods honest.",
        "Its migration is still a migration, and it must land before the plugin is enabled.",
      ]],
      ["Migration planning", "Roll out a plugin's schema change before enabling it in production.", [
        "The schema change is deployed and applied before the feature is turned on.",
        "A plugin enabled ahead of its columns fails at sign-in, not at deploy.",
        "Rolling back the code without rolling back the schema is the safer order.",
      ]],
    ],
  }),

  defineHandbook("Clerk user management", "Hosted authentication, prebuilt components, organizations, webhooks and route protection.", "https://clerk.com/docs", {
    mechanism: "Clerk hosts users and sessions and ships prebuilt UI components. The session is a short-lived JWT the client refreshes automatically, and your server verifies it — so your database holds application data keyed by a Clerk user id, not credentials.",
    example: "Middleware protects the dashboard, the SignIn component renders the flow, and a webhook writes a matching row to the local database when a user is created — so joins work locally while Clerk stays the source of truth for identity.",
    pitfall: "Webhooks are how the local copy stays current, and they can be replayed or forged. Verifying the signature and handling delivery more than once are both required, or a duplicate event corrupts the mirrored record.",
  }, {
    "Hooks": [
      ["useUser", "Read the signed-in user and their metadata reactively, with a loaded flag.", [
        "It returns the full user object, which is more than a page needing only an id should load.",
        "The loaded flag is what separates signed out from not yet known.",
        "Metadata read here is the client-visible half, never the private half.",
      ]],
      ["useAuth", "Read the session and user ids, and fetch a token, without pulling the whole user object.", [
        "It gives the user and session ids without deserialising the whole user.",
        "Fetching a token here is how a call to your own API is authorized.",
        "It is the cheaper hook for a component that only guards on identity.",
      ]],
      ["useClerk", "Reach the Clerk instance for imperative calls such as opening a sign-in modal.", [
        "It exposes the instance for imperative calls such as opening a modal.",
        "Nothing it returns re-renders the component, so state must come from elsewhere.",
        "It is for event handlers, not for deciding what to render.",
      ]],
      ["useSession", "Read the active session, including its status and last-active time.", [
        "The active session carries its status and last-active time, not just the user.",
        "Session status is what distinguishes expired from signed out.",
        "It reflects one session even when the browser holds several.",
      ]],
      ["useSessionList", "List every session in the browser to build an account switcher.", [
        "Every session in the browser is listed, which is what an account switcher renders.",
        "Switching the active session changes what every other hook reports.",
        "The list is per browser, so it says nothing about sessions on other devices.",
      ]],
      ["useSignIn and useSignUp", "Drive a custom authentication flow step by step instead of the prebuilt components.", [
        "They drive the flow step by step when the prebuilt components do not fit.",
        "Each step returns the next required factor rather than a finished session.",
        "The flow must handle every branch, including verification and multi-factor.",
      ]],
      ["useOrganization", "Read the active organization, its membership and the current user's role in it.", [
        "It reports the active organization, its membership and the caller's role in it.",
        "Role read here is what a tenant-scoped interface renders against.",
        "It returns null when no organization is active, which is a real state to handle.",
      ]],
      ["useOrganizationList", "List the organizations a user belongs to and switch the active one.", [
        "It lists the organizations a user belongs to and switches the active one.",
        "Switching re-issues the token, so server checks see the new tenant.",
        "The list is paginated, so a user in many organizations is not fully loaded at once.",
      ]],
      ["useReverification", "Require a fresh credential check before a sensitive action completes.", [
        "A sensitive action can demand a fresh credential check before it completes.",
        "It proves the person at the keyboard now, not whoever signed in hours ago.",
        "The challenge is per action, so passing it once does not unlock the rest.",
      ]],
      ["Loaded flags before rendering", "Every hook reports whether Clerk has loaded, and rendering before it flashes the wrong state.", [
        "Every hook reports whether Clerk has finished loading.",
        "Rendering before it resolves flashes signed-out content at a signed-in user.",
        "The flag is the guard; the absence of a user is not the same as no user.",
      ]],
    ],
    "Setup & components": [
      ["Provider setup", "Wrap the application so client components can read auth state.", [
        "Wrapping the tree is what lets client components read auth state at all.",
        "The provider must sit above every consumer, which in practice means the root layout.",
        "Keys read here are publishable; the secret key must never reach this boundary.",
      ]],
      ["Prebuilt components", "Use SignIn, SignUp and UserButton before building custom flows.", [
        "They carry the flows, validation and error states already written.",
        "Replacing them with custom flows means owning every branch they handle.",
        "They render Clerk's markup, so page styling has to work through the appearance API.",
      ]],
      ["Appearance customization", "Restyle the components to match the product.", [
        "Styling goes through the appearance API rather than by overriding the markup.",
        "Variables restyle every component at once; element overrides target one.",
        "Targeting internal class names breaks on a library upgrade.",
      ]],
      ["Custom flows", "Drive sign-in with the hooks when the prebuilt UI does not fit.", [
        "The hooks drive the steps when the prebuilt interface does not fit the product.",
        "Every factor and error the components handled becomes yours to handle.",
        "Sign-in and sign-up are separate flows even when the screen looks like one.",
      ]],
      ["Environment keys", "Separate publishable and secret keys and keep the secret server-side.", [
        "The publishable key is safe in the browser; the secret key is not.",
        "A secret key reaching the client bundle is a full compromise, not a leak.",
        "Each instance has its own pair, so promoting a build means swapping both.",
      ]],
      ["Local development", "Run against a development instance with its own users.", [
        "A development instance keeps test users out of the production directory.",
        "Its keys and its user list are separate, so data never crosses over.",
        "Development instances relax some checks, which hides issues until production.",
      ]],
    ],
    "Sessions & protection": [
      ["Middleware", "Protect route groups and declare which routes stay public.", [
        "Protection runs before the route renders, so nothing unauthorized is produced.",
        "Public routes must be declared, because the default is to protect.",
        "A matcher that includes static assets charges every asset an auth check.",
      ]],
      ["Server-side auth", "Read the user id on the server before querying application data.", [
        "Reading the user id on the server is what scopes the query that follows.",
        "Trusting a client-supplied id instead is how one user reads another's rows.",
        "It reads the request, so it makes the route dynamic.",
      ]],
      ["Session tokens", "Understand the short-lived JWT and its automatic refresh.", [
        "The token is short-lived and refreshed by the client automatically.",
        "Short lifetime is what limits the damage of one being captured.",
        "Anything cached from it is stale as soon as the token rotates.",
      ]],
      ["Custom claims", "Add metadata to the token so authorization needs no extra lookup.", [
        "Claims in the token let the server authorize without a second lookup.",
        "A claim is only as fresh as the token carrying it.",
        "An oversized claim set pushes the token past what a cookie will hold.",
      ]],
      ["Multi-session handling", "Support a user signed into several accounts at once.", [
        "One browser can hold several signed-in accounts at once.",
        "Every server check must read the active session rather than assume one.",
        "Switching accounts changes the id your queries must be scoped by.",
      ]],
      ["Sign-out and revocation", "End a session everywhere rather than only in one tab.", [
        "Signing out of one tab is not the same as ending the session everywhere.",
        "Revoking server-side is what stops an already-issued token being used.",
        "Until the token expires, a revoked session may still pass a naive check.",
      ]],
    ],
    "Organizations & data": [
      ["Organizations", "Model teams with memberships, roles and an active organization.", [
        "Teams are modelled as memberships with roles and one active organization.",
        "The active organization scopes both the interface and the server query.",
        "A user with no organization is a state the interface has to render.",
      ]],
      ["Invitations", "Invite members and handle acceptance into the right organization.", [
        "An invitation resolves to a membership in a specific organization on acceptance.",
        "Accepting with a different email than invited is the case that must be refused.",
        "Pending invitations expire, or they become a standing way in.",
      ]],
      ["Role-based permissions", "Authorize actions by organization role on the server.", [
        "Authorization is by organization role, checked on the server.",
        "The same user holds different roles in different organizations.",
        "A client-side role check hides a control; it does not protect the action.",
      ]],
      ["User and public metadata", "Choose what the client may read and what stays private.", [
        "Public metadata is readable by the client; private metadata is not.",
        "Putting a role in public metadata lets the client read it and the server still verify it.",
        "Anything secret in public metadata is published, not merely exposed.",
      ]],
      ["Webhooks", "Mirror user and organization events into your own database.", [
        "Events mirror user and organization changes into your own database.",
        "The local copy is a mirror, so Clerk stays the source of truth for identity.",
        "A missed event leaves the mirror wrong until the next one arrives.",
      ]],
      ["Signature verification and idempotency", "Verify every webhook and make handling safe to repeat.", [
        "An unverified webhook is an open endpoint anyone may post to.",
        "Delivery is at least once, so the same event will arrive twice.",
        "Keying on the event id is what makes repeated handling harmless.",
      ]],
    ],
  }),
];
