# Navigation improvements

- The shared proxy skips Supabase session lookup when no SSR auth cookie exists, while retaining security checks and anonymous dashboard redirects.
- Existing sessions use `getClaims()` in the proxy. It verifies JWT signatures and refreshes sessions through the SSR cookie adapter. Asymmetric signing keys allow cached key verification; symmetric signing still requires an auth-server request. Protected pages and APIs retain authoritative current-user, role, and subscription checks.
- `currentUser()` uses React's request-scoped cache to deduplicate reads during a server render. No user data is cached across requests.
- Account entitlement reads run concurrently instead of serializing profile, subscription, and usage lookups.
- Dashboard and library sidebar destinations use Next.js links, enabling standard prefetching and client navigation.
- Account hydration and catalog loading have separate effects. The permission-filtered catalog loads after account initialization, avoiding the previous repeated requests when preparation selections arrive.

Validation: navigation/authentication, workspace request counts, concurrent account reads, and subscription/trial regression tests. Development first visits still pay route compilation costs; production navigation performance must be measured against a production build after deployment. No production timing improvement is claimed from development-mode measurements.

Reference: https://supabase.com/docs/reference/javascript/auth-getclaims
