import type { TopicEssentials } from "../types";

/** Spring Boot topics distilled: the idea each rests on, the answer to give when asked, and what to remember. */
export const ESSENTIALS: Record<string, TopicEssentials> = {
  "spring-boot-intro": {
    core: "Spring Boot is opinionated Spring: starters bring the right dependencies, auto-configuration wires sensible defaults, and the app runs as one executable JAR with an embedded server.",
    answer: "@SpringBootApplication combines @Configuration, @EnableAutoConfiguration and @ComponentScan. Starters such as spring-boot-starter-web are curated dependency sets with managed versions. Auto-configuration classes activate when their conditions hold (@ConditionalOnClass, @ConditionalOnMissingBean), so adding a library configures it, and declaring your own bean overrides the default. SpringApplication.run starts the context and an embedded Tomcat, Jetty or Undertow.",
    keyPoints: [
      "Component scanning starts at the main class's package: keep the main class at the root package.",
      "Your own @Bean always wins over an auto-configured one.",
      "Run with --debug, or open /actuator/conditions, to see which auto-configurations applied and why.",
      "Spring Boot 3 requires Java 17+ and uses jakarta.* packages.",
      "start.spring.io (Spring Initializr) generates the project skeleton.",
    ],
  },
  "ioc-dependency-injection": {
    core: "With inversion of control, the container creates objects and supplies their dependencies; a class declares what it needs instead of constructing it.",
    answer: "Spring's ApplicationContext creates beans from @Component, @Service, @Repository and @Controller classes and from @Bean methods, then injects their dependencies. Prefer constructor injection: dependencies can be final, are mandatory and are easy to test, and a single constructor needs no @Autowired. When several beans match a type, choose one with @Qualifier or mark a default with @Primary. The default scope is singleton (one per context); prototype gives a new instance per injection, and web scopes cover request and session.",
    keyPoints: [
      "The bean lifecycle runs instantiate → inject → @PostConstruct → in use → @PreDestroy.",
      "Field injection hides dependencies and complicates tests: avoid it.",
      "Circular constructor dependencies fail at startup, and that usually signals a design problem.",
      "@Repository also translates persistence exceptions into Spring's DataAccessException.",
      "A prototype bean injected into a singleton is created only once: use ObjectProvider to get fresh ones.",
    ],
  },
  "configuration-profiles": {
    core: "Settings live outside the code and are merged from many sources in a fixed precedence order; profiles switch whole sets of settings per environment.",
    answer: "Spring Boot reads application.properties or application.yml, profile files such as application-prod.yml, environment variables and command-line arguments; later sources override earlier ones, and command-line arguments win. @ConfigurationProperties(prefix = \"app\") binds a group of settings to a type-safe class or record, which @Validated can check at startup. Activate profiles with spring.profiles.active, and use @Profile to register beans only in certain environments.",
    keyPoints: [
      "Environment variables bind with relaxed rules: APP_MAIL_HOST maps to app.mail.host.",
      "Prefer @ConfigurationProperties to scattered @Value(\"${...}\") annotations.",
      "Never commit secrets; inject them from the environment or a vault.",
      "Profile-specific files override the base file only for the keys they set.",
      "Invalid settings with @Validated fail fast at startup, not at the first request.",
    ],
  },
  aop: {
    core: "AOP adds cross-cutting behaviour (logging, transactions, security) around methods by wrapping beans in proxies instead of editing every method.",
    answer: "An @Aspect class holds advice (code to run) bound to a pointcut (which methods), for example execution(* com.app.service.*.*(..)). The advice types are @Before, @AfterReturning, @AfterThrowing, @After and @Around; @Around can change arguments, results and exceptions and must call proceed(). Spring AOP works through proxies (JDK dynamic proxies or CGLIB subclasses), so only external calls through the proxy are advised.",
    keyPoints: [
      "Self-invocation (this.method()) bypasses the proxy, so the advice does not run. @Transactional has the same trap.",
      "Private and final methods cannot be advised by proxy-based AOP.",
      "@Around without proceed() silently skips the real method.",
      "Use @Order to control the order of several aspects.",
      "@Transactional, @Cacheable, @Async and method security are all built on AOP proxies.",
    ],
  },
  "rest-controllers": {
    core: "A REST controller maps HTTP methods on resource URLs to Java methods; Jackson converts JSON bodies to objects and back.",
    answer: "@RestController combines @Controller and @ResponseBody. @GetMapping, @PostMapping, @PutMapping, @PatchMapping and @DeleteMapping bind methods to routes. @PathVariable reads URL segments, @RequestParam reads query parameters and @RequestBody deserialises the JSON body. ResponseEntity controls the status, headers and body, for example 201 Created with a Location header. Design URLs around nouns (/orders/42) and let the HTTP method be the verb.",
    keyPoints: [
      "GET, PUT and DELETE are idempotent; POST is not.",
      "Return DTOs, never JPA entities, to avoid lazy-loading errors and leaking fields.",
      "Paginate lists with Pageable (?page=0&size=20&sort=name,asc).",
      "Status codes: 200 OK, 201 Created, 204 No Content, 400, 401, 403, 404, 409 Conflict.",
      "Version APIs deliberately, with /v1 in the path or a header.",
    ],
  },
  "validation-error-handling": {
    core: "Validate input at the boundary with Bean Validation annotations, and turn every exception into one consistent error format in a single global handler.",
    answer: "Put constraints such as @NotBlank, @Email, @Size, @Min and @Past on DTO fields and mark the controller parameter with @Valid; a violation throws MethodArgumentNotValidException, answered with 400. Custom constraints pair an annotation with a ConstraintValidator, and validation groups apply different rules to create and update. A @RestControllerAdvice with @ExceptionHandler methods maps exceptions to responses, ideally ProblemDetail (RFC 9457, application/problem+json).",
    keyPoints: [
      "@Valid cascades into nested objects; @Validated on a class enables method-parameter validation and groups.",
      "Never expose stack traces or internal messages in error responses.",
      "Map domain exceptions to status codes: not found → 404, conflict → 409.",
      "Set spring.mvc.problemdetails.enabled=true to get ProblemDetail for Spring's own exceptions.",
      "Validation belongs on DTOs; database constraints are the last line of defence.",
    ],
  },
  "spring-data-jpa": {
    core: "Spring Data writes the repository implementation for you: you declare an interface and it derives queries from method names.",
    answer: "Extend JpaRepository<Entity, Id> to get CRUD, paging and sorting. Derived methods such as findByEmailAndActiveTrue or countByStatus are parsed into JPQL. Use @Query for anything more complex, written in JPQL or as native SQL. Projections (interfaces or records) fetch only the columns you need. Pageable and Sort add pagination, and auditing (@CreatedDate, @LastModifiedBy with @EnableJpaAuditing) fills timestamps automatically.",
    keyPoints: [
      "Updating or deleting with @Query needs @Modifying and a transaction.",
      "findById returns Optional; getReferenceById returns a lazy proxy.",
      "Page runs an extra count query; Slice skips it for infinite scroll.",
      "Solve N+1 with @EntityGraph or JOIN FETCH in @Query.",
      "Set spring.jpa.open-in-view=false so lazy loading cannot hide in the view layer.",
    ],
  },
  transactions: {
    core: "@Transactional wraps a method in a database transaction through a proxy: commit on success, rollback on failure.",
    answer: "Put @Transactional on service methods. The default propagation, REQUIRED, joins an existing transaction or starts one; REQUIRES_NEW suspends the current transaction and starts an independent one. By default, rollback happens only for unchecked exceptions and Errors; checked exceptions commit unless you set rollbackFor. readOnly = true lets the persistence provider skip dirty checking. Isolation sets how concurrent transactions see each other, and optimistic locking with @Version detects lost updates.",
    keyPoints: [
      "Self-invocation and private methods bypass the proxy, so no transaction starts.",
      "Catching an exception inside the method prevents the rollback, unless you rethrow it.",
      "Keep transactions short; never call slow remote services inside them.",
      "An OptimisticLockException means someone else updated the row first: retry or report a conflict.",
      "Propagation types: REQUIRED, REQUIRES_NEW, SUPPORTS, MANDATORY, NOT_SUPPORTED, NEVER, NESTED.",
    ],
  },
  "spring-security": {
    core: "Spring Security is a chain of servlet filters that authenticates every request and then decides whether the caller may proceed.",
    answer: "Declare a SecurityFilterChain bean and configure it with authorizeHttpRequests (URL rules), the login mechanism (formLogin, httpBasic or oauth2ResourceServer), CSRF and CORS. A UserDetailsService loads users, and a PasswordEncoder (BCrypt, or a DelegatingPasswordEncoder) hashes and checks passwords. Method security (@EnableMethodSecurity with @PreAuthorize(\"hasRole('ADMIN')\")) guards service methods. Authentication means who you are; authorization means what you may do.",
    keyPoints: [
      "Never store plain passwords: use BCrypt or Argon2 through PasswordEncoder.",
      "hasRole(\"ADMIN\") checks for the authority ROLE_ADMIN.",
      "Keep CSRF protection for cookie-based sessions; stateless token APIs can disable it.",
      "URL rules match in order: put specific matchers before anyRequest().",
      "401 means not authenticated; 403 means authenticated but not allowed.",
    ],
  },
  "jwt-auth": {
    core: "A JWT is a signed, self-contained token: the server verifies the signature and expiry instead of looking up a session.",
    answer: "A JWT has three Base64URL parts: a header (algorithm), a payload (claims such as sub, exp, iat and scope) and a signature. At login, the server or an identity provider issues a short-lived access token, and clients send it as Authorization: Bearer <token>. spring-boot-starter-oauth2-resource-server validates the signature, issuer and expiry, and maps scopes to SCOPE_ authorities. A longer-lived refresh token, stored and rotated securely, gets new access tokens.",
    keyPoints: [
      "The payload is encoded, not encrypted: never put secrets in it.",
      "Keep access tokens short-lived (minutes); revocation is hard because servers keep no state.",
      "Use RS256 or ES256 with a JWKS endpoint so services verify without sharing a secret.",
      "Always validate exp, iss and aud, and reject alg=none.",
      "Store tokens in HttpOnly cookies or memory, not in localStorage when XSS is a risk.",
    ],
  },
  testing: {
    core: "Test most logic with fast unit tests, then test each layer in a slice of the context, and keep a few full end-to-end tests.",
    answer: "Unit-test services with JUnit 5 and Mockito: @Mock the dependencies and @InjectMocks the class under test, with no Spring at all. Slice tests start only part of the context: @WebMvcTest loads controllers and MockMvc (with @MockitoBean for services) and @DataJpaTest loads JPA repositories. @SpringBootTest starts the whole application. Testcontainers runs a real PostgreSQL or Kafka in Docker, so tests match production, and @ServiceConnection wires it automatically.",
    keyPoints: [
      "Prefer slices to @SpringBootTest: they are faster and narrower.",
      "@MockitoBean replaces @MockBean, which is deprecated since Boot 3.4.",
      "@DataJpaTest rolls back each test and uses an embedded database unless configured otherwise.",
      "Test behaviour through public APIs, not private methods.",
      "Each Testcontainers-backed context is cached and reused across test classes with the same configuration.",
    ],
  },
  "actuator-observability": {
    core: "Actuator exposes the application's health, metrics and internals as endpoints, so you can see what it is doing in production.",
    answer: "Add spring-boot-starter-actuator and expose endpoints with management.endpoints.web.exposure.include. /health reports UP or DOWN, aggregated from HealthIndicators, and /health/liveness and /health/readiness feed Kubernetes probes. Micrometer records metrics (timers, counters, gauges) and exports them to Prometheus and other backends. Micrometer Tracing propagates trace ids across services, and structured JSON logs make logs searchable.",
    keyPoints: [
      "Only /health is exposed over HTTP by default; secure every other endpoint.",
      "Liveness failing means restart the container; readiness failing means stop sending it traffic.",
      "Implement HealthIndicator for custom dependencies such as a payment gateway.",
      "Keep metric tag values low-cardinality: never user ids as tags.",
      "Boot 3.4+ supports structured logging out of the box (logging.structured.format.console=ecs).",
    ],
  },
  "caching-scheduling-async": {
    core: "Caching skips repeated work, scheduling runs work on a timer, and @Async runs work on another thread; all three are proxy-based annotations.",
    answer: "@EnableCaching with @Cacheable stores a method's result by key, @CachePut updates the entry and @CacheEvict removes it; Caffeine suits a local cache and Redis a shared one. @EnableScheduling with @Scheduled(fixedRate, fixedDelay or cron) runs periodic jobs; Spring cron expressions have six fields, starting with seconds. @EnableAsync with @Async runs a method on a TaskExecutor and can return CompletableFuture. Configure a bounded executor rather than relying on the default.",
    keyPoints: [
      "Calls from inside the same class bypass the proxy, so the cache, async or transaction does not apply.",
      "Always give caches a TTL and a size limit to avoid stale data and memory leaks.",
      "In a cluster, every instance runs @Scheduled jobs: use ShedLock or a single scheduler.",
      "Exceptions from void @Async methods go to an AsyncUncaughtExceptionHandler, not the caller.",
      "fixedRate measures from start to start; fixedDelay measures from the end of one run to the start of the next.",
    ],
  },
  "microservices-rest-client": {
    core: "Remote calls fail and slow down, so every call to another service needs a timeout, a bounded retry and a circuit breaker.",
    answer: "RestClient (Spring 6.1+) is the fluent synchronous HTTP client, and @HttpExchange interfaces generate clients declaratively. Set connect and read timeouts on every client. Resilience4j adds @Retry with backoff for transient failures, @CircuitBreaker (which opens after a failure-rate threshold, fails fast, and then probes with half-open calls), bulkheads and rate limiters. springdoc-openapi generates the OpenAPI spec and Swagger UI from your controllers.",
    keyPoints: [
      "Retry only idempotent operations, or use idempotency keys.",
      "Retries without backoff and jitter turn an outage into a self-inflicted denial of service.",
      "Return a meaningful fallback, or fail fast, when the circuit is open.",
      "RestTemplate is in maintenance mode; use RestClient, or WebClient for reactive code.",
      "Propagate trace ids so a request can be followed across services.",
    ],
  },
  "packaging-deployment": {
    core: "Spring Boot builds one executable JAR containing the app, its dependencies and the server; layered images and native images make it cheaper to ship and faster to start.",
    answer: "mvn package or gradle bootJar produces a fat JAR you run with java -jar. Layered JARs separate dependencies from application code so Docker caches the layers that rarely change, and mvn spring-boot:build-image builds an image with Cloud Native Buildpacks without a Dockerfile. GraalVM native images compile ahead of time for millisecond startup and low memory, at the cost of longer builds and reflection hints. Enable graceful shutdown and, on Java 21, spring.threads.virtual.enabled=true.",
    keyPoints: [
      "server.shutdown=graceful finishes in-flight requests before stopping.",
      "Run containers as a non-root user and size the heap with -XX:MaxRAMPercentage.",
      "Native images need reachability metadata for reflection, proxies and resources.",
      "Externalise configuration, so one image runs in every environment.",
      "Wire liveness and readiness probes to Actuator's health groups.",
    ],
  },
};
