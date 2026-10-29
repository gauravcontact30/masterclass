import type { TopicEssentials } from "../types";

/** Advanced Java topics distilled: the idea each rests on, the answer to give when asked, and what to remember. */
export const ESSENTIALS: Record<string, TopicEssentials> = {
  "jdbc-basics": {
    core: "JDBC is a standard API; a vendor driver translates its calls into the database's wire protocol, so the same Java code works against any relational database.",
    answer: "Get a Connection from DriverManager or, in real applications, from a DataSource. Create a PreparedStatement with ? placeholders, bind values with setXxx, and run executeQuery for SELECT (which returns a ResultSet) or executeUpdate for INSERT, UPDATE and DELETE (which returns the affected row count). PreparedStatement is precompiled and sends values separately from the SQL, which prevents SQL injection. Close the ResultSet, statement and connection with try-with-resources.",
    keyPoints: [
      "Since JDBC 4, drivers register themselves through ServiceLoader; Class.forName is no longer needed.",
      "Never build SQL by concatenating user input; always bind parameters.",
      "ResultSet columns are 1-indexed, and rs.next() must be called before reading the first row.",
      "execute() returns true when the result is a ResultSet; executeUpdate returns a row count.",
      "Placeholders bind values only, never table or column names.",
    ],
  },
  "jdbc-transactions-batch": {
    core: "A transaction groups statements into one all-or-nothing unit; isolation levels trade consistency for concurrency.",
    answer: "JDBC connections auto-commit each statement by default. Call setAutoCommit(false), run the statements, then commit(), or rollback() in the catch block. ACID means atomicity, consistency, isolation and durability. The isolation levels READ_UNCOMMITTED, READ_COMMITTED, REPEATABLE_READ and SERIALIZABLE progressively prevent dirty reads, non-repeatable reads and phantom reads. Savepoints allow a partial rollback. addBatch with executeBatch sends many statements in one round trip.",
    keyPoints: [
      "Dirty read: seeing uncommitted data. Non-repeatable read: the same row changes between reads. Phantom: new rows match a repeated query.",
      "Most databases default to READ_COMMITTED; MySQL InnoDB defaults to REPEATABLE_READ.",
      "Restore auto-commit before returning a pooled connection.",
      "Batch inserts inside one transaction are often 10–100× faster than separate commits.",
      "Higher isolation levels mean more locking or more serialization failures, which the application must retry.",
    ],
  },
  "connection-pooling": {
    core: "Opening a database connection is expensive, so a pool keeps a few open and lends them out; the DAO pattern keeps SQL out of business logic.",
    answer: "A DataSource hands out connections; a pooling DataSource such as HikariCP reuses physical connections, and close() returns a connection to the pool instead of closing it. Size the pool to what the database can serve, often around (cores × 2) plus the number of disks, rather than to the number of users. In application servers, a DataSource is looked up through JNDI. A DAO (Data Access Object) wraps all SQL for one entity behind an interface, so services stay database-agnostic and testable.",
    keyPoints: [
      "Always close pooled connections, ideally with try-with-resources; a leak drains the pool.",
      "Key Hikari settings: maximumPoolSize, connectionTimeout, idleTimeout, maxLifetime.",
      "A larger pool is not faster: it adds contention in the database.",
      "A DAO interface plus a JDBC implementation lets tests swap in a fake.",
      "Spring Boot auto-configures HikariCP as its default pool.",
    ],
  },
  "servlet-lifecycle": {
    core: "A servlet container creates one servlet instance and calls it concurrently from many threads, one thread per request.",
    answer: "The container (Tomcat, Jetty) loads the servlet and calls init() once. It then calls service() for every request, which dispatches to doGet or doPost, and calls destroy() once at shutdown. Because a single instance serves all requests concurrently, instance fields are shared, so a servlet must be stateless or thread-safe. Servlets are mapped with @WebServlet or in web.xml. Init parameters configure one servlet; context parameters configure the whole application.",
    keyPoints: [
      "Never store per-request data in servlet fields; keep it in local variables or request attributes.",
      "load-on-startup makes the container initialise a servlet at deployment instead of on the first request.",
      "Jakarta EE 9+ renamed the packages from javax.servlet to jakarta.servlet.",
      "ServletConfig is per servlet; ServletContext is shared by the whole web application.",
      "The default doGet and doPost answer 405 Method Not Allowed.",
    ],
  },
  "request-response": {
    core: "A forward stays inside the server on the same request; a redirect tells the browser to make a new request to a new URL.",
    answer: "Read input with getParameter, getHeader and getInputStream; write output with setStatus, setContentType and getWriter. RequestDispatcher.forward hands the same request and response to another resource: the URL in the browser does not change and request attributes survive. sendRedirect returns a 302 (or 303) with a Location header, the browser makes a new GET, and request attributes are lost. Post/Redirect/Get redirects after a successful POST so that a refresh does not resubmit the form.",
    keyPoints: [
      "Forward is faster and server-side only; redirect can go to another site.",
      "include() inserts another resource's output into the current response.",
      "Set headers and status before writing the body; once the response is committed they cannot change.",
      "Encode output for HTML to prevent XSS; set the request encoding before reading parameters.",
      "Use 201 for created resources, 204 for empty success, 400 for bad input and 404 for missing resources.",
    ],
  },
  "session-management": {
    core: "HTTP is stateless; a session id stored in a cookie lets the server recognise the same user across requests.",
    answer: "The four session-tracking techniques are cookies, URL rewriting, hidden form fields and HttpSession, which itself usually rides on the JSESSIONID cookie. request.getSession() creates or returns the user's session, and attributes stored there live until invalidate() or the timeout. Secure session cookies are HttpOnly (hidden from JavaScript), Secure (sent only over HTTPS) and SameSite. Prevent session fixation by issuing a new session id after login with request.changeSessionId().",
    keyPoints: [
      "getSession(false) returns null instead of creating a new session.",
      "Keep sessions small, and store only serializable objects if the session is replicated.",
      "Call session.invalidate() on logout.",
      "URL rewriting leaks session ids into logs and referrers: avoid it.",
      "Set the timeout in web.xml (minutes) or with setMaxInactiveInterval (seconds).",
    ],
  },
  "filters-listeners": {
    core: "Filters wrap request processing for concerns every request shares; listeners react to lifecycle events of the application, sessions and requests.",
    answer: "A Filter intercepts requests before they reach the servlet and responses on the way back. Its doFilter method must call chain.doFilter to continue, or it can stop the request there, for example on failed authentication. Filters suit authentication, logging, compression, CORS and encoding. Listeners such as ServletContextListener (startup and shutdown), HttpSessionListener (session created and destroyed) and ServletRequestListener run code when those events happen, without being called directly.",
    keyPoints: [
      "Filter order follows the web.xml mapping order; @WebFilter order is not guaranteed.",
      "Forgetting chain.doFilter silently blocks the request.",
      "ServletContextListener is the place to open and close application-wide resources.",
      "Response wrappers let a filter change the body after the servlet has written it.",
      "Spring Security is built as a chain of servlet filters.",
    ],
  },
  "jsp-el-jstl": {
    core: "A JSP is an HTML template that the container compiles into a servlet; EL and JSTL let it display data without Java code.",
    answer: "On the first request, a JSP is translated into a servlet, compiled, and then runs like any servlet. Directives (page, include, taglib) configure that translation, and scripting elements (<% %>, <%= %>, <%! %>) embed Java. EL expressions (${user.name}) read attributes from the page, request, session and application scopes in that order. JSTL tags (c:if, c:forEach, fmt:formatNumber) handle logic and formatting. Scriptlets mix logic into views and are discouraged in favour of MVC, EL and JSTL.",
    keyPoints: [
      "There are nine implicit objects, including request, response, session, application, out, pageContext and exception.",
      "<%@ include %> is static and happens at translation time; <jsp:include> is dynamic and happens at request time.",
      "EL is null-safe: a missing value renders as empty, not as an exception.",
      "Escape output with <c:out> or fn:escapeXml to prevent XSS.",
      "Modern applications use Thymeleaf or a JavaScript front end, but JSP still appears in exams and legacy code.",
    ],
  },
  "mvc-pattern": {
    core: "Model 2 MVC sends every request to a controller servlet, which uses the model and forwards to a view JSP that only renders.",
    answer: "The controller (a servlet) reads and validates input, calls the model (services and DAOs holding the business logic and data), puts results into request attributes, and forwards to a view (a JSP using EL and JSTL). Views contain no business logic and the model knows nothing about HTTP. This separation makes each layer testable and replaceable, and it is the architecture Spring MVC's DispatcherServlet standardised.",
    keyPoints: [
      "Model 1 lets JSPs handle requests directly; Model 2 routes everything through a controller.",
      "Keep JSPs under WEB-INF so users cannot open them without the controller.",
      "Redirect after POST to prevent duplicate submissions.",
      "A front controller centralises routing, security and error handling.",
      "Spring MVC maps the same roles: DispatcherServlet, @Controller, Model, ViewResolver.",
    ],
  },
  "jpa-hibernate-basics": {
    core: "JPA maps classes to tables; the EntityManager tracks managed entities in a persistence context and writes their changes back to the database automatically.",
    answer: "JPA is the specification and Hibernate its most common implementation. @Entity, @Id and @Column map a class to a table. persist, find, merge and remove manage entities. Within a transaction, the persistence context holds one managed instance per row (a first-level cache), and dirty checking turns field changes into UPDATE statements at flush or commit without any save call. An entity is in one of four states: transient, managed, detached or removed.",
    keyPoints: [
      "Entities need a no-argument constructor (protected is fine) and an @Id.",
      "merge copies a detached entity's state onto a managed copy and returns that copy; keep using the returned object.",
      "find returns null for a missing row; getReference returns a lazy proxy that fails later.",
      "Flush happens before commit and before queries that touch the changed tables.",
      "Use GenerationType.IDENTITY or SEQUENCE; SEQUENCE allows batched inserts.",
    ],
  },
  "jpa-relationships-queries": {
    core: "The owning side of a relationship holds the foreign key; fetch strategy decides when related rows load, and careless lazy loading causes the N+1 problem.",
    answer: "@ManyToOne owns the foreign key. @OneToMany(mappedBy = ...) is its inverse side, and @ManyToMany uses a join table. Cascade propagates operations such as persist and remove to children, and orphanRemoval deletes children removed from the collection. @ManyToOne and @OneToOne are EAGER by default and should usually be set to LAZY; collections are LAZY. N+1 means one query for the parents plus one per parent for its children; fix it with JOIN FETCH, an @EntityGraph, or batch fetching.",
    keyPoints: [
      "Only the owning side's changes are written; keep both sides in sync with helper methods.",
      "Accessing a LAZY association outside a transaction throws LazyInitializationException.",
      "JPQL queries entities and fields, not tables and columns.",
      "JOIN FETCH with pagination on collections paginates in memory: watch for warnings.",
      "Avoid CascadeType.REMOVE on @ManyToMany, because it can delete shared rows.",
      "The Criteria API builds type-safe dynamic queries.",
    ],
  },
  "concurrency-executors": {
    core: "Submit tasks to managed thread pools instead of creating threads, and coordinate them with futures, locks and thread-safe collections.",
    answer: "An ExecutorService (Executors.newFixedThreadPool or a ThreadPoolExecutor) runs Runnable and Callable tasks; submit returns a Future whose get() blocks for the result. CompletableFuture chains asynchronous steps with thenApply, thenCompose, thenCombine and exceptionally. ReentrantLock adds tryLock, timeouts and fairness that synchronized lacks. ConcurrentHashMap, BlockingQueue, CountDownLatch and Semaphore solve common coordination problems. Java 21 virtual threads (Executors.newVirtualThreadPerTaskExecutor) make one thread per blocking task affordable.",
    keyPoints: [
      "Always shut executors down (shutdown, then awaitTermination), or use try-with-resources with Java 19+ executors.",
      "Bounded queues and a rejection policy prevent unbounded memory growth.",
      "Unlock a ReentrantLock in finally.",
      "ConcurrentHashMap.compute and merge are atomic; a separate get then put is not.",
      "CompletableFuture's default async pool is the shared ForkJoinPool: pass your own executor for blocking I/O.",
      "Don't pool virtual threads; limit concurrency with a Semaphore instead.",
    ],
  },
  "reflection-annotations": {
    core: "Reflection lets code inspect and invoke classes at run time; annotations attach metadata that frameworks read through reflection.",
    answer: "Starting from a Class object (obj.getClass(), Foo.class, Class.forName), you can list and invoke constructors, methods and fields, including private ones after setAccessible(true), subject to module rules. Custom annotations are declared with @interface; @Retention(RUNTIME) keeps them visible to reflection and @Target limits where they can be placed. Frameworks such as Spring, JUnit and Hibernate scan for annotations and use reflection to create objects, inject dependencies and call methods.",
    keyPoints: [
      "Retention: SOURCE (discarded by the compiler), CLASS (the default, not visible at run time), RUNTIME (readable by reflection).",
      "Reflection is slower, bypasses compile-time checks and breaks encapsulation: use it in frameworks, not in business code.",
      "getDeclaredMethods returns all of the class's own methods; getMethods returns public ones, including inherited.",
      "Annotation elements can only be primitives, String, Class, enums, annotations or arrays of these.",
      "Reflective access into JDK internals needs opens in module-info or --add-opens.",
    ],
  },
  networking: {
    core: "TCP gives a reliable, ordered byte stream between two sockets; UDP sends independent datagrams; HttpClient is the modern way to call web APIs.",
    answer: "A server opens a ServerSocket on a port and accept() returns a Socket for each client; both sides then read and write through the socket's streams. UDP uses DatagramSocket and DatagramPacket, with no connection, no guaranteed delivery and no ordering. java.net.http.HttpClient (Java 11+) sends HTTP/1.1 and HTTP/2 requests synchronously with send or asynchronously with sendAsync, and supports timeouts, redirects and body handlers.",
    keyPoints: [
      "accept() blocks; serve each client on a separate thread (a virtual thread works well) or the server handles one at a time.",
      "Set connect and read timeouts; the defaults can wait forever.",
      "Create one HttpClient and reuse it, because it pools connections.",
      "URL describes an address; URI is the safer type for building and parsing addresses.",
      "TCP suits files, chat and APIs; UDP suits streaming and games where late data is useless.",
    ],
  },
};
