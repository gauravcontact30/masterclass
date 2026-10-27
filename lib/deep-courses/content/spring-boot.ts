import type { DeepCourse } from "../types";
import { DEEP_COURSES } from "../index";
import { code, file, mcq, qa } from "./helpers";

export const COURSE: DeepCourse = {
  ...DEEP_COURSES.find(course => course.id === "spring-boot")!,
  intro: [
    "Spring Boot is the most widely used way to build Java back-end services. It sits on the Spring Framework (dependency injection, Web MVC, data access, security) and removes the configuration work with starters, auto-configuration and an embedded server.",
    "This course builds one realistic service — a course-enrolment REST API — topic by topic: beans and configuration, controllers, validation, error handling, JPA, transactions, security with JWT, testing, Actuator, caching, calling other services and shipping a container. Examples target Spring Boot 3.x on Java 17+ (jakarta.* packages).",
  ],
  topics: [
    {
      id: "spring-boot-intro", module: "Spring core", title: "What Spring Boot is: starters, auto-configuration and the main class", level: "Beginner", minutes: 16,
      summary: "Why Boot exists, how starters and @SpringBootApplication work, the embedded server and the project layout.",
      description: [
        "The Spring Framework provides an IoC container plus modules for web, data, security and messaging, but classic Spring needed a lot of XML or Java configuration and an external application server. Spring Boot is an opinionated layer on top that makes a production-ready application runnable with java -jar.",
        "Starters are curated dependency bundles: spring-boot-starter-web brings Spring MVC, Jackson and embedded Tomcat; spring-boot-starter-data-jpa brings Hibernate and HikariCP; spring-boot-starter-test brings JUnit 5, Mockito, AssertJ and Spring Test. The Spring Boot parent/BOM manages compatible versions so you rarely specify them.",
        "@SpringBootApplication combines @Configuration (the class may define beans), @EnableAutoConfiguration and @ComponentScan (scan the class's package and sub-packages). Auto-configuration classes are conditional (@ConditionalOnClass, @ConditionalOnMissingBean, @ConditionalOnProperty): if a DataSource driver is on the classpath and you have not defined a DataSource, Boot creates one from your properties. Your own beans always win. Run with --debug to see the conditions evaluation report.",
        "SpringApplication.run creates the ApplicationContext, runs auto-configuration, starts the embedded server (Tomcat by default; Jetty or Undertow by swapping starters) and calls any CommandLineRunner/ApplicationRunner beans. Projects are usually generated at start.spring.io with Maven or Gradle.",
      ],
      usage: [
        "Generate projects at start.spring.io choosing Web, Data JPA, Validation, Security, Actuator and your database driver.",
        "Keep the main class in the root package so component scanning finds every sub-package.",
        "Run locally with ./mvnw spring-boot:run or ./gradlew bootRun; ship the executable JAR built by the Boot plugin.",
        "Use spring-boot-devtools in development for automatic restarts.",
      ],
      files: [
        file("src/main/java/com/mc/enrol/EnrolApplication.java", code`
package com.mc.enrol;

import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

@SpringBootApplication   // = @Configuration + @EnableAutoConfiguration + @ComponentScan("com.mc.enrol")
public class EnrolApplication {

    public static void main(String[] args) {
        SpringApplication.run(EnrolApplication.class, args);
    }

    @Bean
    CommandLineRunner startupMessage() {            // runs once after the context is ready
        return args -> System.out.println("Enrolment API is up");
    }
}`),
        file("src/main/java/com/mc/enrol/web/HelloController.java", code`
package com.mc.enrol.web;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import java.util.Map;

@RestController            // found by component scanning because it is under com.mc.enrol
public class HelloController {
    @GetMapping("/hello")
    public Map<String, String> hello(@RequestParam(defaultValue = "learner") String name) {
        return Map.of("message", "Hello, " + name);  // serialized to JSON by Jackson
    }
}`),
        file("pom.xml", code`
<project xmlns="http://maven.apache.org/POM/4.0.0">
  <modelVersion>4.0.0</modelVersion>
  <parent>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-parent</artifactId>
    <version>3.4.1</version>                <!-- manages versions of every starter -->
  </parent>
  <groupId>com.mc</groupId>
  <artifactId>enrol</artifactId>
  <version>1.0.0</version>
  <properties><java.version>21</java.version></properties>
  <dependencies>
    <dependency><groupId>org.springframework.boot</groupId><artifactId>spring-boot-starter-web</artifactId></dependency>
    <dependency><groupId>org.springframework.boot</groupId><artifactId>spring-boot-starter-validation</artifactId></dependency>
    <dependency><groupId>org.springframework.boot</groupId><artifactId>spring-boot-starter-data-jpa</artifactId></dependency>
    <dependency><groupId>org.postgresql</groupId><artifactId>postgresql</artifactId><scope>runtime</scope></dependency>
    <dependency><groupId>org.springframework.boot</groupId><artifactId>spring-boot-starter-test</artifactId><scope>test</scope></dependency>
  </dependencies>
  <build>
    <plugins>
      <plugin><groupId>org.springframework.boot</groupId><artifactId>spring-boot-maven-plugin</artifactId></plugin>
    </plugins>
  </build>
</project>`),
        file("src/main/resources/application.yml", code`
spring:
  application:
    name: enrol-api
server:
  port: 8080
logging:
  level:
    org.springframework.boot.autoconfigure: INFO   # DEBUG prints the auto-configuration report`),
      ],
      tips: [
        "Spring Boot is not a replacement for Spring — it configures Spring for you.",
        "Exclude an unwanted auto-configuration with @SpringBootApplication(exclude = DataSourceAutoConfiguration.class).",
        "A bean defined by you disables the matching auto-configured one thanks to @ConditionalOnMissingBean.",
        "Spring Boot 3 requires Java 17+ and uses jakarta.* instead of javax.*.",
      ],
      subjective: [
        qa("What are the advantages of Spring Boot over traditional Spring?", "Auto-configuration based on the classpath and properties removes most boilerplate configuration; starters provide curated, version-compatible dependencies; an embedded server lets apps run as executable JARs without deploying WAR files; externalized configuration with profiles; production features such as Actuator health and metrics; sensible defaults (HikariCP, Jackson, logging); and faster project set-up through Spring Initializr. It remains fully customizable — your own beans override defaults."),
        qa("Explain @SpringBootApplication.", "It is a convenience meta-annotation combining @SpringBootConfiguration (a specialized @Configuration, so the class can declare @Bean methods), @EnableAutoConfiguration (imports auto-configuration classes registered by Boot and applies them conditionally), and @ComponentScan (scans the annotated class's package and sub-packages for @Component, @Service, @Repository, @Controller and @Configuration classes)."),
        qa("How does auto-configuration work internally?", "Boot lists auto-configuration classes in META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports inside its JARs. @EnableAutoConfiguration loads them, and each is guarded by conditions such as @ConditionalOnClass (a library is present), @ConditionalOnMissingBean (the user has not defined one) and @ConditionalOnProperty (a property is set). Only matching configurations contribute beans, and they are processed after user configuration so user beans take precedence. The --debug flag prints which conditions matched."),
      ],
      objective: [
        mcq("Which annotation is NOT part of @SpringBootApplication?", ["@EnableAutoConfiguration", "@ComponentScan", "@SpringBootConfiguration", "@EnableWebMvc"], 3, "Adding @EnableWebMvc actually switches off Boot's MVC auto-configuration."),
        mcq("Default embedded server with spring-boot-starter-web:", ["Jetty", "Undertow", "Tomcat", "Netty"], 2, "Netty is the default for WebFlux."),
        mcq("What is a starter?", ["A main method", "A curated dependency descriptor", "A Spring profile", "A shell script"], 1, "Starters aggregate related dependencies."),
        mcq("Which condition prevents auto-configuration from creating a bean you already defined?", ["@ConditionalOnClass", "@ConditionalOnMissingBean", "@Primary", "@Lazy"], 1, "Auto-configured beans back off when yours exist."),
      ],
    },
    {
      id: "ioc-dependency-injection", module: "Spring core", title: "IoC container, beans and dependency injection", level: "Beginner", minutes: 20,
      summary: "Inversion of control, stereotypes, constructor injection, @Bean methods, qualifiers, scopes and the bean lifecycle.",
      description: [
        "Inversion of Control means objects do not create their own dependencies; a container creates them and wires them together. In Spring, the ApplicationContext is the container and the objects it manages are beans. Dependency injection is the technique: a class declares what it needs (usually as constructor parameters) and Spring supplies matching beans. This decouples classes from concrete implementations and makes them easy to test with fakes.",
        "Beans are declared by annotating classes with stereotypes — @Component (generic), @Service (business logic), @Repository (data access, with exception translation) and @Controller/@RestController (web) — or by @Bean methods inside a @Configuration class, which is the way to register third-party classes you cannot annotate.",
        "Injection styles: constructor injection (recommended — dependencies are final, required and visible; with a single constructor, @Autowired is optional), setter injection (optional dependencies) and field injection (@Autowired on a field — concise but hides dependencies and hinders testing). When several beans match one type, choose with @Qualifier(\"name\"), mark one @Primary, or inject a List/Map of all of them.",
        "Scopes: singleton (default — one instance per container), prototype (a new instance per injection), and web scopes request, session and application. Lifecycle: instantiate → inject dependencies → Aware callbacks → BeanPostProcessors (before) → @PostConstruct / InitializingBean → ready → @PreDestroy / DisposableBean on shutdown. Many framework features (AOP proxies, @Transactional) are applied by BeanPostProcessors.",
      ],
      usage: [
        "Inject collaborators through constructors and keep them final.",
        "Depend on interfaces (PaymentGateway) so implementations can be switched with profiles or qualifiers.",
        "Use @Bean methods for library objects such as Clock, ObjectMapper customizations or HTTP clients.",
        "Keep singleton beans stateless; never store per-request data in fields.",
      ],
      files: [
        file("src/main/java/com/mc/enrol/notify/Notifier.java", code`
package com.mc.enrol.notify;

public interface Notifier {
    void send(String to, String message);
}`),
        file("src/main/java/com/mc/enrol/notify/EmailNotifier.java", code`
package com.mc.enrol.notify;

import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Component;

@Component("email")
@Primary                                   // chosen when a single Notifier is requested without a qualifier
public class EmailNotifier implements Notifier {
    @Override public void send(String to, String message) { System.out.println("EMAIL to " + to + ": " + message); }
}`),
        file("src/main/java/com/mc/enrol/notify/SmsNotifier.java", code`
package com.mc.enrol.notify;

import org.springframework.stereotype.Component;

@Component("sms")
public class SmsNotifier implements Notifier {
    @Override public void send(String to, String message) { System.out.println("SMS to " + to + ": " + message); }
}`),
        file("src/main/java/com/mc/enrol/service/EnrolmentService.java", code`
package com.mc.enrol.service;

import com.mc.enrol.notify.Notifier;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;
import java.time.Clock;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class EnrolmentService {
    private final Notifier primary;          // final: set once through the constructor
    private final Notifier sms;
    private final List<Notifier> all;        // every Notifier bean
    private final Clock clock;

    // Single constructor: Spring injects it without @Autowired
    public EnrolmentService(Notifier primary, @Qualifier("sms") Notifier sms, List<Notifier> all, Clock clock) {
        this.primary = primary;
        this.sms = sms;
        this.all = all;
        this.clock = clock;
    }

    @PostConstruct void ready() { System.out.println("EnrolmentService ready with " + all.size() + " notifiers"); }
    @PreDestroy void bye() { System.out.println("EnrolmentService shutting down"); }

    public String enrol(String student, String course) {
        String msg = student + " enrolled in " + course + " at " + LocalDateTime.now(clock);
        primary.send(student, msg);
        sms.send(student, "Enrolled: " + course);
        return msg;
    }
}`),
        file("src/main/java/com/mc/enrol/config/AppConfig.java", code`
package com.mc.enrol.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Scope;
import java.time.Clock;
import java.util.concurrent.atomic.AtomicInteger;

@Configuration
public class AppConfig {
    @Bean
    public Clock clock() { return Clock.systemDefaultZone(); }   // third-party type registered as a bean

    @Bean
    @Scope("prototype")                                          // new instance for each injection point
    public AtomicInteger counter() { return new AtomicInteger(); }
}`),
      ],
      tips: [
        "Constructor injection makes circular dependencies fail fast at startup — a feature, since cycles usually signal a design problem.",
        "Calling a @Bean method from another @Bean method in a @Configuration class returns the singleton, because the class is proxied by CGLIB.",
        "Injecting a prototype into a singleton gives one instance forever; use ObjectProvider<T> to get a fresh one each time.",
        "@Repository adds translation of persistence exceptions into Spring's DataAccessException hierarchy.",
      ],
      subjective: [
        qa("What is Inversion of Control and Dependency Injection?", "IoC is a design principle where the control of object creation and wiring is transferred from application code to a container or framework. Dependency Injection is the way Spring implements IoC: instead of a class constructing its collaborators with new, the container supplies them through constructors, setters or fields. Benefits: loose coupling, programming to interfaces, easier unit testing with mocks, centralized configuration and lifecycle management."),
        qa("Why is constructor injection preferred over field injection?", "Dependencies can be final, so the object is immutable and always fully initialized; required dependencies are explicit in the signature; the class can be instantiated in plain unit tests without Spring or reflection; too many constructor parameters reveal a class with too many responsibilities; and circular dependencies are detected at startup. Field injection hides dependencies, allows partially constructed objects and requires reflection to test."),
        qa("Explain bean scopes in Spring.", "singleton (default): one shared instance per ApplicationContext. prototype: a new instance every time the bean is requested or injected; Spring does not manage its destruction. request: one instance per HTTP request. session: one per HTTP session. application: one per ServletContext. websocket: one per WebSocket session. Web scopes are available only in a web-aware context and are injected into singletons through proxies."),
        qa("Describe the life cycle of a Spring bean.", "1. The container reads bean definitions. 2. Instantiates the bean (constructor injection happens here). 3. Populates properties (setter/field injection). 4. Calls Aware interfaces (BeanNameAware, ApplicationContextAware). 5. BeanPostProcessor.postProcessBeforeInitialization. 6. Initialization: @PostConstruct, InitializingBean.afterPropertiesSet, custom init-method. 7. BeanPostProcessor.postProcessAfterInitialization (proxies for AOP/transactions are created here). 8. Bean is in use. 9. On context shutdown: @PreDestroy, DisposableBean.destroy, custom destroy-method (singletons only)."),
      ],
      objective: [
        mcq("Default scope of a Spring bean:", ["prototype", "request", "singleton", "session"], 2, "One instance per container."),
        mcq("Which annotation resolves ambiguity between two beans of the same type at an injection point?", ["@Value", "@Qualifier", "@Lazy", "@Scope"], 1, "@Qualifier selects by name; @Primary sets a default."),
        mcq("Which stereotype is intended for the data-access layer?", ["@Service", "@Controller", "@Repository", "@Configuration"], 2, "It also enables exception translation."),
        mcq("Which method annotation registers a third-party object as a bean?", ["@Component", "@Bean", "@Autowired", "@Import"], 1, "@Bean methods live in @Configuration classes."),
        mcq("Which callback runs after dependency injection completes?", ["@PreDestroy", "@PostConstruct", "@Bean", "@EventListener"], 1, "Use it for initialization logic."),
      ],
    },
    {
      id: "configuration-profiles", module: "Spring core", title: "Externalized configuration, @ConfigurationProperties and profiles", level: "Intermediate", minutes: 16,
      summary: "application.yml, property precedence, type-safe configuration classes, validation of settings, and environment-specific profiles.",
      description: [
        "Spring Boot reads configuration from many sources and merges them with a defined precedence. From highest to lowest (simplified): command-line arguments, Java system properties, OS environment variables, profile-specific files (application-prod.yml), then application.yml/properties packaged in the JAR. This lets the same artifact run everywhere, with environment-specific values injected from outside — the Twelve-Factor App principle.",
        "Read single values with @Value(\"${...}\") — including defaults (${app.name:Enrol}) — but prefer @ConfigurationProperties for groups of related settings: a record or class bound to a prefix with relaxed binding (max-seats, MAX_SEATS and maxSeats all match), type conversion (Duration, DataSize, lists, maps) and Bean Validation (@Validated with @NotBlank, @Min) so the application fails at startup when configuration is wrong.",
        "Profiles group configuration and beans per environment. Activate them with spring.profiles.active=prod (property, environment variable SPRING_PROFILES_ACTIVE or --spring.profiles.active). @Profile(\"dev\") on a bean or configuration registers it only when that profile is active. Multi-document YAML files can hold several profiles separated by --- with spring.config.activate.on-profile.",
        "Secrets (database passwords, API keys) should come from environment variables or a secret store (Vault, Kubernetes secrets, cloud secret managers), never from committed files.",
      ],
      usage: [
        "Keep defaults in application.yml and override per environment with env variables in deployment.",
        "Bind feature settings (limits, timeouts, URLs) to a validated @ConfigurationProperties record.",
        "Use profiles to swap implementations, e.g. a fake payment gateway in dev and the real one in prod.",
        "Add spring-boot-configuration-processor for IDE auto-completion of your custom properties.",
      ],
      files: [
        file("src/main/resources/application.yml", code`
app:
  name: Enrol API
  max-seats: 60                  # relaxed binding -> maxSeats
  hold-timeout: 15m              # converted to java.time.Duration
  allowed-origins:
    - http://localhost:3000
  payment:
    provider: fake

spring:
  datasource:
    url: ${"$"}{DB_URL:jdbc:postgresql://localhost:5432/enrol}   # env var with a default
    username: ${"$"}{DB_USER:app}
    password: ${"$"}{DB_PASSWORD:}

---
spring:
  config:
    activate:
      on-profile: prod
app:
  allowed-origins:
    - https://masterclass.example
  payment:
    provider: razorpay
logging:
  level:
    root: WARN`),
        file("src/main/java/com/mc/enrol/config/AppProperties.java", code`
package com.mc.enrol.config;

import jakarta.validation.constraints.*;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;
import java.time.Duration;
import java.util.List;

@Validated
@ConfigurationProperties(prefix = "app")      // binds app.* into this record
public record AppProperties(
        @NotBlank String name,
        @Min(1) @Max(500) int maxSeats,
        @NotNull Duration holdTimeout,
        List<String> allowedOrigins,
        Payment payment) {
    public record Payment(@NotBlank String provider) { }
}`),
        file("src/main/java/com/mc/enrol/config/PaymentConfig.java", code`
package com.mc.enrol.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.*;

@Configuration
@EnableConfigurationProperties(AppProperties.class)
public class PaymentConfig {
    public interface PaymentGateway { String charge(String student, long paise); }

    @Bean @Profile("!prod")                                           // dev, test, default...
    PaymentGateway fakeGateway() { return (student, paise) -> "FAKE-" + student + "-" + paise; }

    @Bean @Profile("prod")
    PaymentGateway realGateway(@Value("${"$"}{RAZORPAY_KEY_SECRET}") String secret) {  // fails at startup if missing
        return (student, paise) -> "LIVE-charge-using-" + secret.substring(0, 4);
    }
}`),
        file("run.sh", code`
# Default profile, values from application.yml
java -jar target/enrol-1.0.0.jar

# Production: activate the profile and inject secrets through the environment
SPRING_PROFILES_ACTIVE=prod DB_URL=jdbc:postgresql://db:5432/enrol DB_PASSWORD=*** RAZORPAY_KEY_SECRET=*** \
  java -jar target/enrol-1.0.0.jar

# Command-line arguments override everything else
java -jar target/enrol-1.0.0.jar --server.port=9090 --app.max-seats=120`),
      ],
      tips: [
        "Environment variable names map to properties by upper-casing and replacing dots and dashes with underscores: APP_MAX_SEATS → app.max-seats.",
        "@Value cannot be used on static fields, and it does not support relaxed binding as fully as @ConfigurationProperties.",
        "@Profile(\"!prod\") means every profile except prod, including the default.",
        "Never log the full configuration in production — it may include secrets.",
      ],
      subjective: [
        qa("Differentiate @Value and @ConfigurationProperties.", "@Value injects a single property or SpEL expression into a field or parameter; it is quick for one-off values but scattered, weakly typed and lacks validation and relaxed binding for complex structures. @ConfigurationProperties binds a whole prefix to a type-safe class or record, supports relaxed binding, nested objects, lists, maps, Duration/DataSize conversion, JSR-303 validation with @Validated, IDE metadata, and is easy to test. Prefer @ConfigurationProperties for groups of settings."),
        qa("What are Spring profiles and how do you activate them?", "Profiles are named logical groups of configuration and bean definitions for different environments (dev, test, prod). Beans or configuration classes annotated with @Profile(\"x\") and properties in application-x.yml or in YAML documents activated on-profile apply only when profile x is active. Activate with spring.profiles.active in properties, the SPRING_PROFILES_ACTIVE environment variable, the --spring.profiles.active command-line argument, or @ActiveProfiles in tests."),
      ],
      objective: [
        mcq("Which source has the highest precedence?", ["application.yml in the JAR", "Environment variables", "Command-line arguments", "@PropertySource"], 2, "Command-line arguments override other common sources."),
        mcq("Which annotation binds a group of properties with a common prefix to a class?", ["@Value", "@ConfigurationProperties", "@PropertySource", "@Profile"], 1, "Supports relaxed binding and validation."),
        mcq("How is a property default written in @Value?", ["@Value(\"${x}|10\")", "@Value(\"${x:10}\")", "@Value(\"${x?10}\")", "@Value(\"${x=10}\")"], 1, "The colon separates the key and its default."),
        mcq("Which environment variable activates profiles?", ["SPRING_PROFILE", "SPRING_PROFILES_ACTIVE", "ACTIVE_PROFILE", "BOOT_PROFILE"], 1, "Maps to spring.profiles.active."),
      ],
    },
    {
      id: "aop", module: "Spring core", title: "Aspect-oriented programming and proxies", level: "Advanced", minutes: 16,
      summary: "Cross-cutting concerns with @Aspect, advice types, pointcut expressions, and the proxy limitations that also affect @Transactional.",
      description: [
        "Some concerns cut across many classes — logging, timing, security checks, auditing, transactions, caching. Aspect-oriented programming moves them into aspects instead of repeating them in every method. Spring AOP terms: an aspect is the module (@Aspect class); a join point is a point in execution (in Spring, always a method call on a bean); a pointcut selects join points with an expression; advice is the code to run; weaving links aspects to targets.",
        "Advice types: @Before, @AfterReturning (access to the return value), @AfterThrowing (access to the exception), @After (finally) and @Around (wraps the call, decides whether and how to proceed, can change arguments and results — the most powerful). Pointcut designators include execution(* com.mc..service.*.*(..)), within(...), @annotation(com.mc.Audited) and bean(...).",
        "Spring AOP is proxy-based: the container wraps the bean in a JDK dynamic proxy (when it implements interfaces) or a CGLIB subclass proxy, and advice runs when calls go through the proxy. Consequences: self-invocation (this.otherMethod()) bypasses the proxy and the advice; final and private methods cannot be advised with CGLIB; only Spring beans are advised. @Transactional, @Cacheable, @Async and method security are all implemented this way. AspectJ compile- or load-time weaving removes these limits when needed.",
      ],
      usage: [
        "Measure execution time of service methods without touching their code.",
        "Implement auditing with a custom @Audited annotation and an @AfterReturning advice.",
        "Centralize retry or circuit-breaking policies (libraries like Resilience4j use AOP).",
        "Understand proxies to debug why @Transactional or @Cacheable seems to be ignored.",
      ],
      files: [
        file("src/main/java/com/mc/enrol/aop/Audited.java", code`
package com.mc.enrol.aop;

import java.lang.annotation.*;

@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.METHOD)
public @interface Audited {
    String action();
}`),
        file("src/main/java/com/mc/enrol/aop/MonitoringAspect.java", code`
package com.mc.enrol.aop;

import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

@Aspect
@Component
public class MonitoringAspect {
    private static final Logger log = LoggerFactory.getLogger(MonitoringAspect.class);

    @Pointcut("execution(public * com.mc.enrol.service..*(..))")   // every public service method
    void serviceLayer() { }

    @Around("serviceLayer()")
    public Object time(ProceedingJoinPoint pjp) throws Throwable {
        long start = System.nanoTime();
        try {
            return pjp.proceed();                                   // call the real method
        } finally {
            log.info("{} took {} ms", pjp.getSignature().toShortString(), (System.nanoTime() - start) / 1_000_000);
        }
    }

    @AfterReturning(pointcut = "@annotation(audited)", returning = "result")
    public void audit(JoinPoint jp, Audited audited, Object result) {
        log.info("AUDIT action={} args={} result={}", audited.action(), jp.getArgs(), result);
    }

    @AfterThrowing(pointcut = "serviceLayer()", throwing = "ex")
    public void failure(JoinPoint jp, Exception ex) {
        log.warn("{} failed: {}", jp.getSignature().getName(), ex.getMessage());
    }
}`),
        file("src/main/java/com/mc/enrol/service/SeatService.java", code`
package com.mc.enrol.service;

import com.mc.enrol.aop.Audited;
import org.springframework.stereotype.Service;

@Service
public class SeatService {
    @Audited(action = "RESERVE_SEAT")
    public String reserve(String student, String course) {
        return student + "@" + course;
    }

    public void reserveTwice(String student, String course) {
        reserve(student, course);   // self-invocation: goes through 'this', NOT the proxy -> no audit, no timing
    }
}`),
      ],
      tips: [
        "Add spring-boot-starter-aop (or rely on starters that include it) to enable @Aspect support.",
        "@Around advice must call proceed() and return its result, or the target never runs and callers get null.",
        "To fix self-invocation, move the method to another bean or inject the bean's own proxy.",
        "Order multiple aspects with @Order; lower values run first (outermost).",
      ],
      subjective: [
        qa("Explain AOP terminology with an example.", "Aspect: a class modularizing a cross-cutting concern, e.g. MonitoringAspect for timing. Join point: a point during execution — in Spring AOP, a method execution such as SeatService.reserve. Pointcut: a predicate selecting join points, e.g. execution(* com.mc..service.*.*(..)). Advice: action taken at a join point (@Before, @After, @AfterReturning, @AfterThrowing, @Around). Target: the advised object. Proxy: the object created by Spring that applies advice. Weaving: linking aspects with targets — Spring does it at run time with proxies."),
        qa("Why does @Transactional not work when a method calls another method of the same class?", "Spring implements @Transactional with a proxy around the bean. External callers invoke the proxy, which starts the transaction before delegating. When a method inside the bean calls another method with this.method(), the call goes directly to the target object, bypassing the proxy, so no transactional advice runs. Fix it by moving the method to another bean, restructuring so the external entry point is transactional, injecting the proxy (self-reference via ObjectProvider), or using AspectJ weaving."),
      ],
      objective: [
        mcq("Which advice can prevent the target method from executing?", ["@Before (without throwing)", "@After", "@Around", "@AfterReturning"], 2, "@Around decides whether to call proceed()."),
        mcq("In Spring AOP, join points are always:", ["Field accesses", "Method executions on Spring beans", "Constructor calls", "Static initializers"], 1, "Spring AOP is proxy-based and method-level."),
        mcq("Which proxy does Spring use for a class that implements no interface?", ["JDK dynamic proxy", "CGLIB subclass proxy", "No proxy", "Java agent"], 1, "Spring Boot defaults to CGLIB proxies in general."),
        mcq("Which feature is NOT implemented with Spring AOP proxies?", ["@Transactional", "@Cacheable", "@Async", "@Entity"], 3, "@Entity is a JPA mapping annotation."),
      ],
    },
    {
      id: "rest-controllers", module: "Building REST APIs", title: "REST controllers, request mapping and ResponseEntity", level: "Beginner", minutes: 20,
      summary: "Designing resources, @RestController and mapping annotations, path variables, query parameters, request bodies, status codes and pagination.",
      description: [
        "REST models an API as resources identified by URLs (/api/courses/42) and manipulated with HTTP methods: GET reads, POST creates, PUT replaces, PATCH partially updates, DELETE removes. Responses use status codes meaningfully: 200 OK, 201 Created (with a Location header), 204 No Content, 400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found, 409 Conflict and 422/400 for validation failures.",
        "@RestController = @Controller + @ResponseBody: return values are serialized to JSON by Jackson through HttpMessageConverters. Map handlers with @RequestMapping on the class (base path) and @GetMapping, @PostMapping, @PutMapping, @PatchMapping, @DeleteMapping on methods. Bind inputs with @PathVariable (/courses/{id}), @RequestParam (?level=beginner, optional with defaultValue), @RequestBody (JSON → object), @RequestHeader and @CookieValue.",
        "Return a domain object for 200, or ResponseEntity to control status, headers and body (ResponseEntity.created(uri).body(dto), ResponseEntity.noContent().build()). @ResponseStatus sets a fixed status. Pageable parameters (page, size, sort) bind automatically with Spring Data.",
        "Under the hood, the DispatcherServlet receives every request, asks HandlerMappings for the matching controller method, uses HandlerAdapters and argument resolvers to call it, then converts the return value. Controllers should stay thin: translate HTTP to service calls and DTOs, nothing more.",
      ],
      usage: [
        "Use plural nouns for collections (/courses) and IDs for items (/courses/{id}); avoid verbs in URLs.",
        "Return 201 with a Location header after POST creates something.",
        "Accept and return DTOs (records), not JPA entities, to avoid leaking internals and lazy-loading issues.",
        "Version public APIs (/api/v1) or with headers before breaking changes.",
      ],
      files: [
        file("src/main/java/com/mc/enrol/web/CourseController.java", code`
package com.mc.enrol.web;

import com.mc.enrol.web.dto.CourseRequest;
import com.mc.enrol.web.dto.CourseResponse;
import com.mc.enrol.service.CourseService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

@RestController
@RequestMapping("/api/v1/courses")
public class CourseController {
    private final CourseService courses;
    public CourseController(CourseService courses) { this.courses = courses; }

    @GetMapping                                                    // GET /api/v1/courses?level=BEGINNER&page=0&size=10&sort=title
    public Page<CourseResponse> list(@RequestParam(required = false) String level, Pageable pageable) {
        return courses.list(level, pageable);
    }

    @GetMapping("/{id}")                                           // GET /api/v1/courses/7
    public CourseResponse get(@PathVariable long id) {
        return courses.get(id);                                    // throws NotFoundException -> 404 (see error handling)
    }

    @PostMapping
    public ResponseEntity<CourseResponse> create(@Valid @RequestBody CourseRequest body) {
        CourseResponse created = courses.create(body);
        var location = ServletUriComponentsBuilder.fromCurrentRequest().path("/{id}").buildAndExpand(created.id()).toUri();
        return ResponseEntity.created(location).body(created);     // 201 + Location header
    }

    @PutMapping("/{id}")
    public CourseResponse replace(@PathVariable long id, @Valid @RequestBody CourseRequest body) {
        return courses.update(id, body);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable long id) {
        courses.delete(id);
        return ResponseEntity.noContent().build();                 // 204
    }

    @GetMapping("/search")
    public ResponseEntity<?> search(@RequestParam String q, @RequestHeader(value = "Accept-Language", defaultValue = "en") String lang) {
        return ResponseEntity.ok().header("X-Result-Language", lang).body(courses.search(q));
    }
}`),
        file("src/main/java/com/mc/enrol/web/dto/CourseRequest.java", code`
package com.mc.enrol.web.dto;

import jakarta.validation.constraints.*;

public record CourseRequest(
        @NotBlank @Size(max = 120) String title,
        @NotNull Level level,
        @Min(1) @Max(500) int seats,
        @PositiveOrZero long feePaise) {
    public enum Level { BEGINNER, INTERMEDIATE, ADVANCED }
}`),
        file("src/main/java/com/mc/enrol/web/dto/CourseResponse.java", code`
package com.mc.enrol.web.dto;

public record CourseResponse(long id, String title, String level, int seats, int seatsLeft, String fee) { }`),
        file("requests.http", code`
### Create
POST http://localhost:8080/api/v1/courses
Content-Type: application/json

{ "title": "Spring Boot in depth", "level": "INTERMEDIATE", "seats": 60, "feePaise": 49900 }

### List with paging and sorting
GET http://localhost:8080/api/v1/courses?level=INTERMEDIATE&page=0&size=5&sort=title,asc

### Read one
GET http://localhost:8080/api/v1/courses/1

### Delete
DELETE http://localhost:8080/api/v1/courses/1`),
      ],
      tips: [
        "PUT is idempotent (repeating it gives the same result); POST is not — important for retries.",
        "@RequestParam is required by default; a missing one yields 400 Bad Request.",
        "Serialize Page<T> through a DTO or PagedModel; Spring Data warns that raw PageImpl JSON is not a stable format.",
        "Use @RestControllerAdvice for errors rather than try/catch in every controller.",
      ],
      subjective: [
        qa("Differentiate @Controller and @RestController.", "@Controller marks a web controller whose handler return values are normally view names resolved by a ViewResolver (Thymeleaf, JSP); to write data directly you add @ResponseBody. @RestController is a composed annotation of @Controller and @ResponseBody, so every handler's return value is written to the response body through message converters (JSON by default). Use @RestController for REST APIs."),
        qa("Differentiate @PathVariable and @RequestParam.", "@PathVariable extracts values from the URI path template, e.g. /courses/{id} → id; it identifies a specific resource and is required by default. @RequestParam extracts query string or form parameters, e.g. /courses?level=BEGINNER; it is used for filtering, sorting and pagination, can be optional (required=false) and can have a defaultValue."),
        qa("Explain the request flow through DispatcherServlet.", "1. The embedded server passes the request to DispatcherServlet (the front controller). 2. It asks HandlerMappings for the handler (controller method) matching the URL and method, plus interceptors. 3. A HandlerAdapter invokes the method, using argument resolvers to bind @PathVariable, @RequestParam, @RequestBody (via HttpMessageConverters) and validation. 4. The return value is processed: for @ResponseBody it is converted to JSON; otherwise a view is resolved and rendered. 5. Exceptions go to HandlerExceptionResolvers such as @ControllerAdvice. 6. The response is committed."),
      ],
      objective: [
        mcq("Which status code should a successful POST that creates a resource return?", ["200", "201", "204", "302"], 1, "201 Created, ideally with a Location header."),
        mcq("Which annotation binds the JSON request body to an object?", ["@RequestParam", "@ModelAttribute", "@RequestBody", "@PathVariable"], 2, "Converted by an HttpMessageConverter."),
        mcq("Which HTTP method is idempotent?", ["POST", "PUT", "PATCH (always)", "CONNECT"], 1, "Repeating PUT has the same effect as one call; PATCH may or may not be."),
        mcq("@RestController combines @Controller with:", ["@Service", "@ResponseBody", "@RequestMapping", "@Component"], 1, "Every return value is written to the body."),
        mcq("Which class lets you set status code and headers explicitly?", ["HttpStatus", "ResponseEntity", "HttpEntity only", "ModelAndView"], 1, "ResponseEntity extends HttpEntity with a status."),
      ],
    },
    {
      id: "validation-error-handling", module: "Building REST APIs", title: "Bean Validation, DTOs and global exception handling", level: "Intermediate", minutes: 20,
      summary: "Constraint annotations, @Valid and groups, custom validators, @RestControllerAdvice and RFC 9457 ProblemDetail responses.",
      description: [
        "Jakarta Bean Validation (Hibernate Validator) checks objects against constraints declared as annotations: @NotNull, @NotBlank, @NotEmpty, @Size, @Min/@Max, @Positive, @Email, @Pattern, @Past/@Future and @Valid for nested objects. Add spring-boot-starter-validation, then put @Valid (or @Validated) on @RequestBody parameters; violations throw MethodArgumentNotValidException, which Spring turns into 400. For @PathVariable/@RequestParam constraints, Spring 6.1+ validates method parameters directly (HandlerMethodValidationException).",
        "Custom constraints combine an annotation with a ConstraintValidator, e.g. @CourseCode that checks a pattern and a checksum. Class-level constraints validate several fields together (end date after start date). Validation groups let one DTO apply different rules for create and update.",
        "Error handling should be centralized. A @RestControllerAdvice class with @ExceptionHandler methods maps exceptions to responses: domain exceptions like NotFoundException → 404, ConflictException → 409, validation errors → 400 with field details, and an unexpected exception → 500 without leaking stack traces. Spring 6 supports RFC 9457 Problem Details (ProblemDetail) — a standard JSON error shape with type, title, status, detail and instance, plus custom properties. Enable it globally with spring.mvc.problemdetails.enabled=true or extend ResponseEntityExceptionHandler.",
      ],
      usage: [
        "Validate at the API boundary (DTOs) and enforce invariants again in the domain where it matters.",
        "Return all field errors at once so clients can show them next to form inputs.",
        "Throw meaningful domain exceptions from services and translate them to HTTP only in the advice.",
        "Log 5xx errors with a correlation id; never return stack traces to clients.",
      ],
      files: [
        file("src/main/java/com/mc/enrol/web/dto/EnrolRequest.java", code`
package com.mc.enrol.web.dto;

import com.mc.enrol.web.validation.CourseCode;
import jakarta.validation.constraints.*;
import java.time.LocalDate;

public record EnrolRequest(
        @NotBlank @Size(max = 80) String studentName,
        @NotBlank @Email String email,
        @CourseCode String courseCode,                      // custom constraint
        @NotNull @FutureOrPresent LocalDate startDate,
        @Pattern(regexp = "^[6-9]\\d{9}$", message = "must be a 10-digit Indian mobile number") String phone) { }`),
        file("src/main/java/com/mc/enrol/web/validation/CourseCode.java", code`
package com.mc.enrol.web.validation;

import jakarta.validation.*;
import java.lang.annotation.*;

@Documented
@Constraint(validatedBy = CourseCode.Validator.class)
@Target({ ElementType.FIELD, ElementType.PARAMETER })
@Retention(RetentionPolicy.RUNTIME)
public @interface CourseCode {
    String message() default "must look like JAVA-101";
    Class<?>[] groups() default {};
    Class<? extends Payload>[] payload() default {};

    class Validator implements ConstraintValidator<CourseCode, String> {
        @Override public boolean isValid(String value, ConstraintValidatorContext ctx) {
            return value != null && value.matches("^[A-Z]{2,6}-\\d{3}$");
        }
    }
}`),
        file("src/main/java/com/mc/enrol/web/error/Errors.java", code`
package com.mc.enrol.web.error;

public final class Errors {
    private Errors() { }
    public static class NotFoundException extends RuntimeException {
        public NotFoundException(String what, Object id) { super(what + " " + id + " not found"); }
    }
    public static class SeatsFullException extends RuntimeException {
        public SeatsFullException(String course) { super("No seats left in " + course); }
    }
}`),
        file("src/main/java/com/mc/enrol/web/error/GlobalExceptionHandler.java", code`
package com.mc.enrol.web.error;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.*;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;
import java.net.URI;
import java.util.Map;
import java.util.stream.Collectors;

@RestControllerAdvice                                    // applies to every @RestController
public class GlobalExceptionHandler {
    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(Errors.NotFoundException.class)
    ProblemDetail notFound(Errors.NotFoundException ex) {
        ProblemDetail pd = ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, ex.getMessage());
        pd.setType(URI.create("https://api.masterclass.example/errors/not-found"));
        return pd;
    }

    @ExceptionHandler(Errors.SeatsFullException.class)
    ProblemDetail full(Errors.SeatsFullException ex) {
        return ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT, ex.getMessage());   // 409
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    ProblemDetail invalid(MethodArgumentNotValidException ex) {
        Map<String, String> fields = ex.getBindingResult().getFieldErrors().stream()
            .collect(Collectors.toMap(fe -> fe.getField(), fe -> String.valueOf(fe.getDefaultMessage()), (a, b) -> a + "; " + b));
        ProblemDetail pd = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, "Validation failed");
        pd.setProperty("errors", fields);                // custom extension member
        return pd;
    }

    @ExceptionHandler(Exception.class)
    ProblemDetail unexpected(Exception ex) {
        log.error("Unhandled error", ex);                // full details stay in the logs
        return ProblemDetail.forStatusAndDetail(HttpStatus.INTERNAL_SERVER_ERROR, "Something went wrong");
    }
}`),
        file("sample-error.json", code`
{
  "type": "about:blank",
  "title": "Bad Request",
  "status": 400,
  "detail": "Validation failed",
  "instance": "/api/v1/enrolments",
  "errors": {
    "email": "must be a well-formed email address",
    "courseCode": "must look like JAVA-101"
  }
}`),
      ],
      tips: [
        "@NotNull allows \"\"; @NotEmpty rejects \"\" but allows \"  \"; @NotBlank rejects both — a favourite MCQ.",
        "Without @Valid on the parameter, constraint annotations on the DTO are silently ignored.",
        "@Validated on a class enables method-level validation of parameters and return values in services.",
        "Use a ProblemDetail type URI that documents the error for API consumers.",
      ],
      subjective: [
        qa("How do you implement global exception handling in Spring Boot?", "Create a class annotated with @RestControllerAdvice (or @ControllerAdvice for MVC views). Inside, write methods annotated with @ExceptionHandler(SomeException.class) that return a ResponseEntity, a ProblemDetail or an object with @ResponseStatus. Spring routes exceptions thrown from any controller to the most specific matching handler. Optionally extend ResponseEntityExceptionHandler to customize Spring MVC's built-in exceptions, and enable RFC 9457 problem details for consistent error bodies."),
        qa("Differentiate @NotNull, @NotEmpty and @NotBlank.", "@NotNull: the value must not be null; empty strings and collections are allowed. @NotEmpty: not null and length/size > 0 — applies to strings, collections, maps and arrays; \"   \" passes. @NotBlank: for character sequences only — not null and must contain at least one non-whitespace character."),
      ],
      objective: [
        mcq("Which annotation triggers validation of a @RequestBody?", ["@Validate", "@Valid", "@Check", "@Constraint"], 1, "@Valid (or @Validated) on the parameter."),
        mcq("Exception thrown when @Valid @RequestBody validation fails:", ["ConstraintViolationException", "MethodArgumentNotValidException", "BindException only", "IllegalArgumentException"], 1, "Spring maps it to 400 by default."),
        mcq("Which annotation creates a global exception handler for REST controllers?", ["@ExceptionHandler on the main class", "@RestControllerAdvice", "@ControllerAspect", "@ErrorController"], 1, "Its @ExceptionHandler methods apply across controllers."),
        mcq("ProblemDetail follows which standard?", ["RFC 7231", "RFC 9457 (formerly 7807)", "JSON:API", "OpenAPI 3"], 1, "Problem Details for HTTP APIs."),
      ],
    },
    {
      id: "spring-data-jpa", module: "Data access", title: "Spring Data JPA: entities, repositories and queries", level: "Intermediate", minutes: 22,
      summary: "JpaRepository, derived query methods, @Query, projections, pagination and sorting, and auditing.",
      description: [
        "Spring Data JPA removes DAO boilerplate. Declare an interface extending JpaRepository<Entity, Id> and Spring generates an implementation at startup with save, saveAll, findById, findAll (with Sort or Pageable), existsById, count, deleteById and more. Repositories are discovered automatically under the application package.",
        "Derived query methods build JPQL from the method name: findByEmail, findByLevelAndSeatsGreaterThan, findTop5ByOrderByCreatedAtDesc, countByCourseId, existsByEmailIgnoreCase. For anything more complex use @Query with JPQL (or nativeQuery = true) and named parameters; modifying queries need @Modifying and a transaction.",
        "Return types are flexible: Optional<T>, List<T>, Page<T> (with total count — an extra count query), Slice<T> (no count), Stream<T>, and projections — interface-based or record DTOs — that select only needed columns. @EntityGraph(attributePaths = \"enrolments\") fetches associations to avoid N+1 queries.",
        "Auditing fills created/modified timestamps and users automatically with @EnableJpaAuditing plus @CreatedDate, @LastModifiedDate and @EntityListeners(AuditingEntityListener.class). Schema management in production should use Flyway or Liquibase with spring.jpa.hibernate.ddl-auto=validate.",
      ],
      usage: [
        "Use derived queries for simple lookups and @Query for joins, aggregates or anything with a long method name.",
        "Return Page/Slice for list endpoints instead of loading whole tables.",
        "Use projections for read-heavy endpoints to avoid loading full entities.",
        "Keep ddl-auto=validate in production and version the schema with Flyway migrations.",
      ],
      files: [
        file("src/main/java/com/mc/enrol/domain/Course.java", code`
package com.mc.enrol.domain;

import jakarta.persistence.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@EntityListeners(AuditingEntityListener.class)
public class Course {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(nullable = false, unique = true) private String code;
    @Column(nullable = false) private String title;
    @Enumerated(EnumType.STRING) private Level level;      // store names, not ordinals
    private int seats;
    private long feePaise;
    @Version private long version;                          // optimistic locking for seat counts

    @OneToMany(mappedBy = "course", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Enrolment> enrolments = new ArrayList<>();

    @CreatedDate private Instant createdAt;
    @LastModifiedDate private Instant updatedAt;

    public enum Level { BEGINNER, INTERMEDIATE, ADVANCED }
    protected Course() { }
    public Course(String code, String title, Level level, int seats, long feePaise) {
        this.code = code; this.title = title; this.level = level; this.seats = seats; this.feePaise = feePaise;
    }
    public Long getId() { return id; }
    public String getCode() { return code; }
    public String getTitle() { return title; }
    public Level getLevel() { return level; }
    public int getSeats() { return seats; }
    public int seatsLeft() { return seats - enrolments.size(); }
    public List<Enrolment> getEnrolments() { return enrolments; }
}`),
        file("src/main/java/com/mc/enrol/domain/Enrolment.java", code`
package com.mc.enrol.domain;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(uniqueConstraints = @UniqueConstraint(columnNames = { "course_id", "email" }))  // one seat per email
public class Enrolment {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) private Course course;
    private String studentName;
    private String email;
    private Instant enrolledAt = Instant.now();

    protected Enrolment() { }
    public Enrolment(Course course, String studentName, String email) { this.course = course; this.studentName = studentName; this.email = email; }
    public Long getId() { return id; }
    public String getEmail() { return email; }
}`),
        file("src/main/java/com/mc/enrol/repo/CourseRepository.java", code`
package com.mc.enrol.repo;

import com.mc.enrol.domain.Course;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;

public interface CourseRepository extends JpaRepository<Course, Long> {
    Optional<Course> findByCode(String code);                                  // derived: WHERE code = ?
    Page<Course> findByLevel(Course.Level level, Pageable pageable);           // derived + paging
    List<Course> findTop5ByOrderByCreatedAtDesc();
    boolean existsByCodeIgnoreCase(String code);

    @Query("SELECT c FROM Course c WHERE lower(c.title) LIKE lower(concat('%', :q, '%'))")
    List<Course> search(@Param("q") String q);

    // Projection: only the columns the endpoint needs
    record CourseStats(String code, long enrolled) { }
    @Query("SELECT new com.mc.enrol.repo.CourseRepository$CourseStats(c.code, COUNT(e)) " +
           "FROM Course c LEFT JOIN c.enrolments e GROUP BY c.code ORDER BY COUNT(e) DESC")
    List<CourseStats> stats();

    @EntityGraph(attributePaths = "enrolments")                                // fetch join: avoids N+1
    Optional<Course> findWithEnrolmentsById(Long id);

    @Modifying
    @Query("UPDATE Course c SET c.seats = c.seats + :extra WHERE c.id = :id")
    int addSeats(@Param("id") long id, @Param("extra") int extra);
}`),
        file("src/main/java/com/mc/enrol/repo/EnrolmentRepository.java", code`
package com.mc.enrol.repo;

import com.mc.enrol.domain.Enrolment;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EnrolmentRepository extends JpaRepository<Enrolment, Long> {
    boolean existsByCourseIdAndEmail(Long courseId, String email);
    long countByCourseId(Long courseId);
}`),
        file("src/main/resources/db/migration/V1__init.sql", code`
CREATE TABLE course (
  id BIGSERIAL PRIMARY KEY, code VARCHAR(20) NOT NULL UNIQUE, title VARCHAR(120) NOT NULL,
  level VARCHAR(20) NOT NULL, seats INT NOT NULL, fee_paise BIGINT NOT NULL, version BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ, updated_at TIMESTAMPTZ
);
CREATE TABLE enrolment (
  id BIGSERIAL PRIMARY KEY, course_id BIGINT NOT NULL REFERENCES course(id), student_name VARCHAR(80) NOT NULL,
  email VARCHAR(150) NOT NULL, enrolled_at TIMESTAMPTZ NOT NULL, UNIQUE (course_id, email)
);`),
        file("src/main/resources/application.yml", code`
spring:
  jpa:
    hibernate:
      ddl-auto: validate          # Flyway owns the schema
    open-in-view: false           # no lazy loading during view rendering
    properties:
      hibernate.default_batch_fetch_size: 50
  flyway:
    enabled: true`),
      ],
      tips: [
        "Use @Enumerated(EnumType.STRING): ORDINAL breaks silently when someone reorders the enum.",
        "save() on an entity with an id calls merge, which may issue a SELECT first; prefer modifying managed entities inside a transaction.",
        "Disable spring.jpa.open-in-view so lazy-loading problems surface in tests rather than as hidden queries in production.",
        "Spring Data's findAll() without paging on a large table is an outage waiting to happen.",
      ],
      subjective: [
        qa("Differentiate CrudRepository, PagingAndSortingRepository and JpaRepository.", "CrudRepository provides basic CRUD (save, findById, findAll, delete, count, existsById). PagingAndSortingRepository adds findAll(Sort) and findAll(Pageable). JpaRepository extends both (via ListCrudRepository/ListPagingAndSortingRepository) and adds JPA-specific operations: flush, saveAndFlush, deleteAllInBatch, getReferenceById, and returns List instead of Iterable. Use JpaRepository in JPA projects unless you want to restrict the exposed methods."),
        qa("What are derived query methods? Give examples.", "Spring Data parses repository method names and builds queries from them: a prefix (find…By, read…By, count…By, exists…By, delete…By), property expressions joined with And/Or, and operators like GreaterThan, Between, Like, Containing, IgnoreCase, In, IsNull, OrderBy and limiting keywords First/Top. Examples: findByEmail(String email); findByLevelAndSeatsGreaterThan(Level l, int s); findTop3ByOrderByCreatedAtDesc(); countByCourseId(Long id). Invalid property names fail at startup."),
        qa("How do you implement pagination in Spring Data JPA?", "Add a Pageable parameter to a repository method (findByLevel(Level level, Pageable pageable)) returning Page<T> or Slice<T>. In a controller, accept a Pageable — Spring binds page, size and sort query parameters — or build one with PageRequest.of(page, size, Sort.by(\"title\")). Page includes content, total elements and total pages (requiring a count query); Slice only knows whether a next page exists, which is cheaper."),
      ],
      objective: [
        mcq("Which interface should a repository extend for JPA paging, sorting and batch operations?", ["Repository", "CrudRepository", "JpaRepository", "EntityManager"], 2, "JpaRepository includes paging/sorting and JPA extras."),
        mcq("findByTitleContainingIgnoreCase(String t) generates a query using:", ["=", "LIKE %t% with lower-casing", "BETWEEN", "IN"], 1, "Containing maps to LIKE with wildcards."),
        mcq("Which annotation is required on an UPDATE/DELETE @Query?", ["@Transactional only", "@Modifying", "@Update", "@Write"], 1, "Plus a transaction around the call."),
        mcq("Which return type avoids an extra count query?", ["Page<T>", "Slice<T>", "List<T> with Pageable is impossible", "Iterable<T>"], 1, "Slice knows only whether more data exists."),
        mcq("Recommended production value for spring.jpa.hibernate.ddl-auto when using Flyway:", ["create-drop", "update", "validate", "create"], 2, "Hibernate checks the schema but never changes it."),
      ],
    },
    {
      id: "transactions", module: "Data access", title: "@Transactional: propagation, isolation, rollback rules and pitfalls", level: "Advanced", minutes: 18,
      summary: "Declarative transactions in services, propagation types, read-only transactions, which exceptions roll back, and concurrency control.",
      description: [
        "@Transactional on a public method (or class) of a Spring bean starts a transaction before the method and commits after it, or rolls back if it throws. Put it on the service layer where a business operation spans several repository calls. Spring Data repository methods are already transactional individually, but that does not make two repository calls atomic.",
        "Propagation decides what happens if a transaction already exists: REQUIRED (default — join it or create one), REQUIRES_NEW (suspend the current one and start an independent transaction, e.g. for audit logs that must persist even if the outer work fails), MANDATORY (must already exist), SUPPORTS, NOT_SUPPORTED, NEVER and NESTED (savepoint inside the current one).",
        "Rollback rules: by default only unchecked exceptions (RuntimeException and Error) trigger rollback; checked exceptions commit. Change it with rollbackFor = Exception.class or noRollbackFor. readOnly = true hints that no writes occur, letting Hibernate skip dirty checking and some databases optimize. isolation and timeout can also be set per method.",
        "Pitfalls: self-invocation bypasses the proxy; private or final methods are not transactional; catching an exception inside the method and not rethrowing means no rollback; long transactions that call remote services hold database locks. For concurrent updates (last seat in a course), use optimistic locking (@Version → retry on ObjectOptimisticLockingFailureException) or pessimistic locking (@Lock(PESSIMISTIC_WRITE) → SELECT … FOR UPDATE), or a conditional update.",
      ],
      usage: [
        "Annotate service methods that perform multiple writes; mark query-only services readOnly = true.",
        "Use REQUIRES_NEW for audit or outbox records that must survive the caller's rollback.",
        "Handle optimistic-lock failures with a retry for high-contention resources such as seat counts.",
        "Send emails and call external APIs after commit (TransactionalEventListener) rather than inside the transaction.",
      ],
      files: [
        file("src/main/java/com/mc/enrol/service/EnrolService.java", code`
package com.mc.enrol.service;

import com.mc.enrol.domain.Course;
import com.mc.enrol.domain.Enrolment;
import com.mc.enrol.repo.CourseRepository;
import com.mc.enrol.repo.EnrolmentRepository;
import com.mc.enrol.web.error.Errors;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class EnrolService {
    public record Enrolled(long enrolmentId, String email, String course) { }   // domain event

    private final CourseRepository courses;
    private final EnrolmentRepository enrolments;
    private final AuditService audit;
    private final ApplicationEventPublisher events;

    public EnrolService(CourseRepository courses, EnrolmentRepository enrolments, AuditService audit, ApplicationEventPublisher events) {
        this.courses = courses; this.enrolments = enrolments; this.audit = audit; this.events = events;
    }

    @Transactional                                  // REQUIRED: everything below commits or rolls back together
    public long enrol(String code, String name, String email) {
        Course course = courses.findByCode(code).orElseThrow(() -> new Errors.NotFoundException("Course", code));
        audit.record("attempt " + email + " -> " + code);           // REQUIRES_NEW: kept even on rollback
        if (enrolments.existsByCourseIdAndEmail(course.getId(), email)) throw new IllegalStateException("already enrolled");
        if (course.seatsLeft() <= 0) throw new Errors.SeatsFullException(code);   // RuntimeException -> rollback
        Enrolment saved = enrolments.save(new Enrolment(course, name, email));
        course.getEnrolments().add(saved);          // bumps @Version: concurrent enrolments conflict and one retries
        events.publishEvent(new Enrolled(saved.getId(), email, code));
        return saved.getId();
    }

    @Transactional(readOnly = true)                 // no dirty checking, read replicas possible
    public int seatsLeft(String code) {
        return courses.findByCode(code).map(Course::seatsLeft).orElse(0);
    }
}`),
        file("src/main/java/com/mc/enrol/service/AuditService.java", code`
package com.mc.enrol.service;

import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuditService {
    private final JdbcClient jdbc;
    public AuditService(JdbcClient jdbc) { this.jdbc = jdbc; }

    @Transactional(propagation = Propagation.REQUIRES_NEW)   // independent transaction, commits on its own
    public void record(String message) {
        jdbc.sql("INSERT INTO audit_log(message) VALUES (:m)").param("m", message).update();
    }
}`),
        file("src/main/java/com/mc/enrol/service/EnrolmentMailer.java", code`
package com.mc.enrol.service;

import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Component
public class EnrolmentMailer {
    // Runs only if the enrol() transaction commits: no "welcome" email for a rolled-back enrolment
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onEnrolled(EnrolService.Enrolled event) {
        System.out.println("Sending welcome email to " + event.email() + " for " + event.course());
    }
}`),
        file("src/main/java/com/mc/enrol/service/RetryingEnrol.java", code`
package com.mc.enrol.service;

import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.stereotype.Service;

@Service
public class RetryingEnrol {
    private final EnrolService enrolService;
    public RetryingEnrol(EnrolService enrolService) { this.enrolService = enrolService; }

    // Retry happens OUTSIDE the transaction: each attempt is a fresh transaction through the proxy
    public long enrolWithRetry(String code, String name, String email) {
        for (int attempt = 1; ; attempt++) {
            try { return enrolService.enrol(code, name, email); }
            catch (ObjectOptimisticLockingFailureException e) { if (attempt == 3) throw e; }
        }
    }
}`),
      ],
      tips: [
        "Checked exceptions do NOT roll back by default — use rollbackFor = Exception.class if your service throws them.",
        "A REQUIRED inner method that throws marks the shared transaction rollback-only; catching it in the outer method then fails with UnexpectedRollbackException at commit.",
        "Use @Transactional from org.springframework.transaction.annotation for full features (readOnly, propagation).",
        "Keep transactions short: no HTTP calls, file uploads or sleeping inside them.",
      ],
      subjective: [
        qa("Explain transaction propagation types in Spring.", "REQUIRED (default): join the existing transaction or create a new one. REQUIRES_NEW: always start a new transaction, suspending any existing one; commits or rolls back independently. SUPPORTS: join if one exists, otherwise run without a transaction. NOT_SUPPORTED: suspend any existing transaction and run without one. MANDATORY: require an existing transaction or throw. NEVER: throw if a transaction exists. NESTED: run within a nested transaction using a savepoint if one exists (rollback of the nested part does not roll back the outer), otherwise behave like REQUIRED."),
        qa("When does @Transactional roll back?", "By default it rolls back on unchecked exceptions (RuntimeException and its subclasses) and Errors that propagate out of the method, and commits on normal return and on checked exceptions. You can customize with rollbackFor / rollbackForClassName and noRollbackFor. Programmatic rollback is possible with TransactionAspectSupport.currentTransactionStatus().setRollbackOnly(). If you catch the exception inside the method and swallow it, the transaction commits."),
        qa("Differentiate optimistic and pessimistic locking.", "Optimistic locking assumes conflicts are rare: each row has a version column (@Version); an UPDATE includes WHERE version = ?, and if another transaction changed the row first, zero rows are updated and an OptimisticLockException is thrown — the application retries or reports a conflict. No database locks are held. Pessimistic locking assumes conflicts are likely: the row is locked when read (SELECT ... FOR UPDATE via @Lock(PESSIMISTIC_WRITE)) so other writers wait; it guarantees serialization but reduces concurrency and can cause deadlocks."),
      ],
      objective: [
        mcq("Default propagation of @Transactional:", ["REQUIRES_NEW", "REQUIRED", "SUPPORTS", "NESTED"], 1, "Joins an existing transaction or starts one."),
        mcq("By default, a checked exception thrown from a @Transactional method causes:", ["Rollback", "Commit", "A new transaction", "A compile error"], 1, "Only unchecked exceptions trigger rollback by default."),
        mcq("Which propagation always starts an independent transaction?", ["REQUIRED", "MANDATORY", "REQUIRES_NEW", "SUPPORTS"], 2, "It suspends the caller's transaction."),
        mcq("@Transactional on a private method:", ["Works normally", "Is ignored by proxy-based AOP", "Throws at startup", "Makes the class final"], 1, "Proxies only intercept public (and with CGLIB, non-private) external calls."),
        mcq("Which JPA annotation enables optimistic locking?", ["@Lock", "@Version", "@Optimistic", "@Transactional"], 1, "The version column is checked on update."),
      ],
    },
    {
      id: "spring-security", module: "Security", title: "Spring Security fundamentals: filter chain, users and authorization", level: "Intermediate", minutes: 22,
      summary: "How SecurityFilterChain works, password encoding, UserDetailsService, URL and method security, CSRF and CORS.",
      description: [
        "Adding spring-boot-starter-security secures every endpoint by default with a generated password. Security is implemented as a chain of servlet filters (exposed as a SecurityFilterChain bean) that runs before your controllers: it establishes who the user is (authentication) and decides what they may do (authorization). The current user is stored in the SecurityContext (SecurityContextHolder), per request.",
        "Authentication: an AuthenticationManager delegates to providers; DaoAuthenticationProvider loads users through a UserDetailsService (from your database) and checks passwords with a PasswordEncoder. Always store passwords hashed with an adaptive algorithm — BCrypt, Argon2 or the DelegatingPasswordEncoder that prefixes hashes with {bcrypt}. Never store or log plain text.",
        "Authorization rules are configured with authorizeHttpRequests: requestMatchers(\"/api/admin/**\").hasRole(\"ADMIN\"), permitAll for public paths, authenticated for the rest — order matters, first match wins. Method security (@EnableMethodSecurity) adds @PreAuthorize(\"hasRole('ADMIN') or #email == authentication.name\") on service methods. Roles are authorities prefixed with ROLE_.",
        "CSRF protection is on by default for browser sessions (form posts need a token); stateless token-based APIs typically disable it. CORS must be configured explicitly when a browser front end on another origin calls the API. Return 401 for missing/invalid credentials and 403 for authenticated users without permission.",
      ],
      usage: [
        "Define one SecurityFilterChain bean with explicit rules rather than relying on defaults.",
        "Load users from your database with a UserDetailsService and hash passwords with BCrypt.",
        "Protect admin and data-changing operations both at URL level and with @PreAuthorize on services.",
        "Configure CORS with the exact front-end origins instead of *.",
      ],
      files: [
        file("src/main/java/com/mc/enrol/security/SecurityConfig.java", code`
package com.mc.enrol.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.crypto.factory.PasswordEncoderFactories;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import java.util.List;

@Configuration
@EnableMethodSecurity                                   // enables @PreAuthorize
public class SecurityConfig {

    @Bean
    SecurityFilterChain api(HttpSecurity http) throws Exception {
        return http
            .csrf(csrf -> csrf.ignoringRequestMatchers("/api/**"))     // stateless API; keep CSRF for browser forms
            .cors(Customizer.withDefaults())
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/actuator/health", "/api/v1/auth/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/v1/courses/**").permitAll()
                .requestMatchers("/api/v1/admin/**").hasRole("ADMIN")      // first match wins: specific rules first
                .anyRequest().authenticated())
            .httpBasic(Customizer.withDefaults())                      // replaced by JWT in the next topic
            .build();
    }

    @Bean
    PasswordEncoder passwordEncoder() {
        return PasswordEncoderFactories.createDelegatingPasswordEncoder();   // stores "{bcrypt}$2a$10$..."
    }

    @Bean
    UrlBasedCorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration cors = new CorsConfiguration();
        cors.setAllowedOrigins(List.of("http://localhost:3000", "https://masterclass.example"));
        cors.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE"));
        cors.setAllowedHeaders(List.of("Authorization", "Content-Type"));
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/api/**", cors);
        return source;
    }
}`),
        file("src/main/java/com/mc/enrol/security/DbUserDetailsService.java", code`
package com.mc.enrol.security;

import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.security.core.userdetails.*;
import org.springframework.stereotype.Service;

@Service
public class DbUserDetailsService implements UserDetailsService {
    private final JdbcClient jdbc;
    public DbUserDetailsService(JdbcClient jdbc) { this.jdbc = jdbc; }

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        record Row(String email, String passwordHash, String role, boolean enabled) { }
        Row row = jdbc.sql("SELECT email, password_hash, role, enabled FROM app_user WHERE email = :e")
            .param("e", email.toLowerCase()).query(Row.class).optional()
            .orElseThrow(() -> new UsernameNotFoundException("unknown user"));
        return User.withUsername(row.email())
            .password(row.passwordHash())          // already hashed; the encoder compares
            .roles(row.role())                     // becomes authority ROLE_<role>
            .disabled(!row.enabled())
            .build();
    }
}`),
        file("src/main/java/com/mc/enrol/service/ReportService.java", code`
package com.mc.enrol.service;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

@Service
public class ReportService {
    @PreAuthorize("hasRole('ADMIN')")
    public String revenueReport() { return "revenue..."; }

    @PreAuthorize("hasRole('ADMIN') or #email == authentication.name")   // users may read only their own
    public String studentReport(String email) {
        String caller = SecurityContextHolder.getContext().getAuthentication().getName();
        return "report for " + email + " requested by " + caller;
    }
}`),
      ],
      tips: [
        "hasRole('ADMIN') checks for the authority ROLE_ADMIN; hasAuthority('ADMIN') checks the exact string.",
        "Put specific requestMatchers before general ones; anyRequest() must be last.",
        "Do not disable CSRF for session-cookie-based browser apps — only for stateless token APIs.",
        "Return the same error for “unknown user” and “wrong password” to avoid user enumeration.",
      ],
      subjective: [
        qa("Differentiate authentication and authorization.", "Authentication verifies identity — who you are — using credentials such as a password, token or certificate; failure results in 401 Unauthorized. Authorization determines permissions — what an authenticated identity may access — based on roles, authorities or attributes; failure results in 403 Forbidden. Authentication happens first; authorization uses its result."),
        qa("Explain the Spring Security architecture.", "A DelegatingFilterProxy registered in the servlet container delegates to FilterChainProxy, which selects a SecurityFilterChain matching the request and runs its filters in order (CORS, CSRF, authentication filters such as UsernamePasswordAuthenticationFilter, BasicAuthenticationFilter or BearerTokenAuthenticationFilter, ExceptionTranslationFilter, AuthorizationFilter). Authentication filters build an Authentication request and pass it to the AuthenticationManager (ProviderManager), which delegates to AuthenticationProviders (e.g. DaoAuthenticationProvider using UserDetailsService and PasswordEncoder). The authenticated result is stored in the SecurityContextHolder; AuthorizationFilter and method security then check access."),
        qa("Why should passwords be hashed with BCrypt rather than SHA-256?", "Password hashing must be slow and salted to resist brute-force and rainbow-table attacks. SHA-256 is a fast general-purpose hash — attackers can compute billions per second on GPUs — and is unsalted unless you add salts yourself. BCrypt (like Argon2 and scrypt) includes a random salt per password and a configurable work factor that makes each guess expensive, which can be increased as hardware improves."),
      ],
      objective: [
        mcq("Which status code means authenticated but not permitted?", ["401", "403", "404", "407"], 1, "403 Forbidden."),
        mcq("Which bean configures HTTP security rules in Spring Security 6?", ["WebSecurityConfigurerAdapter", "SecurityFilterChain", "AuthenticationProvider", "SecurityContext"], 1, "The adapter class was removed in Spring Security 6."),
        mcq("hasRole('ADMIN') matches the authority:", ["ADMIN", "ROLE_ADMIN", "admin", "ADMIN_ROLE"], 1, "The ROLE_ prefix is added automatically."),
        mcq("Which annotation enables @PreAuthorize?", ["@EnableWebSecurity", "@EnableMethodSecurity", "@Secured", "@EnableGlobalAuth"], 1, "Replaces @EnableGlobalMethodSecurity."),
        mcq("Recommended way to store passwords:", ["Plain text", "Base64", "BCrypt/Argon2 hash", "AES encryption with a shared key"], 2, "Use a slow, salted, adaptive hash."),
      ],
    },
    {
      id: "jwt-auth", module: "Security", title: "Stateless authentication with JWT and the OAuth2 resource server", level: "Advanced", minutes: 20,
      summary: "Structure of a JWT, issuing tokens at login, validating them with spring-boot-starter-oauth2-resource-server, scopes and refresh strategy.",
      description: [
        "A JSON Web Token has three Base64URL parts: header (algorithm), payload (claims such as sub, iat, exp, roles/scope, iss, aud) and signature. The server signs it; anyone holding the verification key can check it has not been tampered with. JWTs are signed, not encrypted — never put secrets in them.",
        "In stateless authentication the client sends credentials once to a login endpoint, receives a short-lived access token, and sends it on each request in Authorization: Bearer <token>. The server validates signature, expiry, issuer and audience without a session store, which scales horizontally. Revocation is the trade-off: keep access tokens short (5–15 minutes) and use refresh tokens (stored server-side or rotated) to obtain new ones.",
        "Spring Boot's spring-boot-starter-oauth2-resource-server validates JWTs with oauth2ResourceServer(o -> o.jwt(...)). Configure either issuer-uri (fetches public keys from an identity provider such as Keycloak, Auth0, Cognito or Okta) or your own JwtDecoder for keys you hold. Claims are mapped to authorities — by default scope/scp become SCOPE_xxx; a JwtAuthenticationConverter can map a roles claim to ROLE_xxx.",
        "For your own login endpoint, authenticate the username/password with the AuthenticationManager and mint tokens with JwtEncoder (Nimbus). For larger systems, delegate login entirely to an identity provider using OAuth2/OpenID Connect and keep the API as a pure resource server.",
      ],
      usage: [
        "Use JWT bearer tokens for mobile apps, SPAs calling APIs, and service-to-service calls.",
        "Prefer RS256/ES256 (asymmetric) so services verify with a public key and only the issuer can sign.",
        "Validate exp, iss and aud; set small clock skew; reject alg=none.",
        "Store browser tokens in memory or HttpOnly cookies — not in localStorage if XSS is a concern.",
      ],
      files: [
        file("src/main/java/com/mc/enrol/security/JwtSecurityConfig.java", code`
package com.mc.enrol.security;

import com.nimbusds.jose.jwk.*;
import com.nimbusds.jose.jwk.source.ImmutableJWKSet;
import org.springframework.context.annotation.*;
import org.springframework.security.authentication.*;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jwt.*;
import org.springframework.security.oauth2.server.resource.authentication.*;
import org.springframework.security.web.SecurityFilterChain;
import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.interfaces.*;

@Configuration
public class JwtSecurityConfig {
    private final KeyPair keys = generate();                    // demo: load from a keystore/secret manager in production

    @Bean @Primary
    SecurityFilterChain jwtChain(HttpSecurity http) throws Exception {
        return http
            .csrf(c -> c.disable())                                       // no cookies -> no CSRF risk
            .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(a -> a
                .requestMatchers("/api/v1/auth/login").permitAll()
                .requestMatchers("/api/v1/admin/**").hasRole("ADMIN")
                .anyRequest().authenticated())
            .oauth2ResourceServer(o -> o.jwt(j -> j.jwtAuthenticationConverter(rolesConverter())))
            .build();
    }

    @Bean JwtDecoder jwtDecoder() { return NimbusJwtDecoder.withPublicKey((RSAPublicKey) keys.getPublic()).build(); }

    @Bean JwtEncoder jwtEncoder() {
        RSAKey jwk = new RSAKey.Builder((RSAPublicKey) keys.getPublic()).privateKey((RSAPrivateKey) keys.getPrivate()).build();
        return new NimbusJwtEncoder(new ImmutableJWKSet<>(new JWKSet(jwk)));
    }

    @Bean AuthenticationManager authenticationManager(UserDetailsService users, PasswordEncoder encoder) {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider(users);
        provider.setPasswordEncoder(encoder);
        return new ProviderManager(provider);
    }

    private JwtAuthenticationConverter rolesConverter() {        // "roles": ["ADMIN"] -> ROLE_ADMIN
        JwtGrantedAuthoritiesConverter authorities = new JwtGrantedAuthoritiesConverter();
        authorities.setAuthoritiesClaimName("roles");
        authorities.setAuthorityPrefix("ROLE_");
        JwtAuthenticationConverter converter = new JwtAuthenticationConverter();
        converter.setJwtGrantedAuthoritiesConverter(authorities);
        return converter;
    }

    private static KeyPair generate() {
        try { KeyPairGenerator g = KeyPairGenerator.getInstance("RSA"); g.initialize(2048); return g.generateKeyPair(); }
        catch (Exception e) { throw new IllegalStateException(e); }
    }
}`),
        file("src/main/java/com/mc/enrol/security/AuthController.java", code`
package com.mc.enrol.security;

import org.springframework.security.authentication.*;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.oauth2.jwt.*;
import org.springframework.web.bind.annotation.*;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {
    public record LoginRequest(String email, String password) { }
    public record TokenResponse(String accessToken, long expiresIn) { }

    private final AuthenticationManager authManager;
    private final JwtEncoder encoder;
    public AuthController(AuthenticationManager authManager, JwtEncoder encoder) { this.authManager = authManager; this.encoder = encoder; }

    @PostMapping("/login")
    public TokenResponse login(@RequestBody LoginRequest body) {
        Authentication auth = authManager.authenticate(
            UsernamePasswordAuthenticationToken.unauthenticated(body.email(), body.password()));   // throws on bad credentials -> 401
        List<String> roles = auth.getAuthorities().stream().map(GrantedAuthority::getAuthority)
            .map(a -> a.replaceFirst("^ROLE_", "")).toList();
        Instant now = Instant.now();
        JwtClaimsSet claims = JwtClaimsSet.builder()
            .issuer("https://api.masterclass.example")
            .subject(auth.getName())
            .issuedAt(now)
            .expiresAt(now.plus(15, ChronoUnit.MINUTES))           // short-lived access token
            .claim("roles", roles)
            .build();
        String token = encoder.encode(JwtEncoderParameters.from(claims)).getTokenValue();
        return new TokenResponse(token, 900);
    }

    @GetMapping("/me")
    public Object me(@org.springframework.security.core.annotation.AuthenticationPrincipal Jwt jwt) {
        return java.util.Map.of("email", jwt.getSubject(), "roles", jwt.getClaimAsStringList("roles"), "expires", jwt.getExpiresAt());
    }
}`),
        file("token-anatomy.txt", code`
eyJhbGciOiJSUzI1NiJ9 . eyJzdWIiOiJhc2hhQG1jLmRldiIsInJvbGVzIjpbIlNUVURFTlQiXSwiZXhwIjoxNzMwMDAwMDAwfQ . kX9...signature
        header                                payload (claims)                                           signature

header : {"alg":"RS256"}
payload: {"sub":"asha@mc.dev","roles":["STUDENT"],"iss":"https://api.masterclass.example","exp":1730000000}
Use    : Authorization: Bearer <token>`),
      ],
      tips: [
        "JWT payloads are only Base64URL-encoded: anyone can read them; the signature only proves integrity.",
        "A stolen JWT is valid until it expires — keep lifetimes short and use HTTPS everywhere.",
        "With issuer-uri configured (spring.security.oauth2.resourceserver.jwt.issuer-uri) Spring fetches and rotates signing keys automatically.",
        "Logout in pure JWT setups means deleting the token client-side and revoking refresh tokens server-side.",
      ],
      subjective: [
        qa("Explain the structure of a JWT and how it is verified.", "A JWT is header.payload.signature, each Base64URL-encoded. The header states the token type and signing algorithm (e.g. RS256). The payload contains claims: registered ones like iss (issuer), sub (subject), aud (audience), exp (expiry), iat (issued at), plus custom claims such as roles. The signature is computed over header and payload with the issuer's private key (RSA/EC) or a shared secret (HMAC). The verifier recomputes/validates the signature with the public key or secret, then checks exp, nbf, iss and aud before trusting the claims."),
        qa("Compare session-based and token-based (JWT) authentication.", "Session-based: the server stores session state and gives the browser a session ID cookie; easy revocation, small cookies, but requires sticky sessions or a shared session store to scale, and CSRF protection. Token-based: the server issues a signed self-contained token sent in the Authorization header; stateless, scales horizontally, works across domains and for mobile/services, but tokens cannot easily be revoked before expiry, are larger, and must be stored carefully on the client."),
      ],
      objective: [
        mcq("How many parts does a signed JWT (JWS) have?", ["2", "3", "4", "5"], 1, "Header, payload and signature."),
        mcq("Which claim holds the expiry time?", ["iat", "exp", "sub", "nbf"], 1, "exp is seconds since the epoch."),
        mcq("JWT payloads are:", ["Encrypted by default", "Encoded and signed, readable by anyone", "Hashed", "Compressed only"], 1, "Use JWE if you need encryption."),
        mcq("Which Spring starter validates incoming bearer JWTs?", ["spring-boot-starter-oauth2-client", "spring-boot-starter-oauth2-resource-server", "spring-boot-starter-jwt", "spring-security-jwt-legacy"], 1, "The resource server starter."),
        mcq("Which header carries the token?", ["Cookie: jwt=", "Authorization: Bearer <token>", "X-Token-Auth", "WWW-Authenticate"], 1, "RFC 6750 bearer token usage."),
      ],
    },
    {
      id: "testing", module: "Quality and production", title: "Testing Spring Boot applications", level: "Intermediate", minutes: 20,
      summary: "Unit tests with Mockito, slice tests (@WebMvcTest, @DataJpaTest), full @SpringBootTest, MockMvc, and Testcontainers.",
      description: [
        "Test at several levels. Plain unit tests create classes directly with new and mock collaborators with Mockito — fast and the majority of your tests, which constructor injection makes easy. Slice tests start only part of the context: @WebMvcTest loads controllers, advice and MVC infrastructure with MockMvc, mocking services with @MockitoBean (Spring Boot 3.4+; @MockBean earlier); @DataJpaTest loads JPA repositories with a test database and rolls back each test.",
        "@SpringBootTest loads the whole application context for integration tests; combine with @AutoConfigureMockMvc or webEnvironment = RANDOM_PORT plus TestRestTemplate/WebTestClient for real HTTP calls. Spring caches contexts between tests with the same configuration, so avoid needless variations.",
        "Testcontainers runs real dependencies (PostgreSQL, Redis, Kafka) in Docker during tests; with @ServiceConnection Spring Boot wires the container's URL automatically. This catches SQL dialect and migration problems that H2 would hide.",
        "spring-boot-starter-test includes JUnit 5, Mockito, AssertJ, Hamcrest, JSONassert, JsonPath and Spring Test. Use @ActiveProfiles(\"test\") and application-test.yml for test settings, and @Sql to load fixtures.",
      ],
      usage: [
        "Unit-test services with Mockito; slice-test controllers with MockMvc; integration-test critical flows with Testcontainers.",
        "Assert status codes, JSON fields and error bodies — they are your API contract.",
        "Use @WithMockUser or jwt() request post-processors to test secured endpoints.",
        "Run tests in CI on every pull request; keep the suite fast enough to run locally.",
      ],
      files: [
        file("src/test/java/com/mc/enrol/service/EnrolServiceTest.java", code`
package com.mc.enrol.service;

import com.mc.enrol.domain.Course;
import com.mc.enrol.repo.CourseRepository;
import com.mc.enrol.repo.EnrolmentRepository;
import com.mc.enrol.web.error.Errors;
import org.junit.jupiter.api.Test;
import org.springframework.context.ApplicationEventPublisher;
import java.util.Optional;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class EnrolServiceTest {                                   // plain unit test: no Spring context
    CourseRepository courses = mock(CourseRepository.class);
    EnrolmentRepository enrolments = mock(EnrolmentRepository.class);
    EnrolService service = new EnrolService(courses, enrolments, mock(AuditService.class), mock(ApplicationEventPublisher.class));

    @Test
    void rejectsWhenCourseIsFull() {
        Course full = new Course("JAVA-101", "Core Java", Course.Level.BEGINNER, 0, 0);   // zero seats
        when(courses.findByCode("JAVA-101")).thenReturn(Optional.of(full));

        assertThatThrownBy(() -> service.enrol("JAVA-101", "Asha", "asha@mc.dev"))
            .isInstanceOf(Errors.SeatsFullException.class)
            .hasMessageContaining("JAVA-101");
        verify(enrolments, never()).save(any());
    }

    @Test
    void unknownCourseIsNotFound() {
        when(courses.findByCode("NOPE-000")).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.enrol("NOPE-000", "Asha", "asha@mc.dev")).isInstanceOf(Errors.NotFoundException.class);
    }
}`),
        file("src/test/java/com/mc/enrol/web/CourseControllerTest.java", code`
package com.mc.enrol.web;

import com.mc.enrol.service.CourseService;
import com.mc.enrol.web.dto.CourseResponse;
import com.mc.enrol.web.error.Errors;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(CourseController.class)                        // web slice only
class CourseControllerTest {
    @Autowired MockMvc mvc;
    @MockitoBean CourseService courses;                      // replaces the real bean in the slice

    @Test @WithMockUser
    void returnsCourse() throws Exception {
        when(courses.get(1)).thenReturn(new CourseResponse(1, "Spring Boot", "INTERMEDIATE", 60, 12, "₹499"));
        mvc.perform(get("/api/v1/courses/1"))
           .andExpect(status().isOk())
           .andExpect(jsonPath("$.title").value("Spring Boot"))
           .andExpect(jsonPath("$.seatsLeft").value(12));
    }

    @Test @WithMockUser
    void missingCourseIs404ProblemDetail() throws Exception {
        when(courses.get(9)).thenThrow(new Errors.NotFoundException("Course", 9));
        mvc.perform(get("/api/v1/courses/9"))
           .andExpect(status().isNotFound())
           .andExpect(jsonPath("$.detail").value("Course 9 not found"));
    }

    @Test @WithMockUser(roles = "ADMIN")
    void invalidBodyIs400() throws Exception {
        mvc.perform(post("/api/v1/courses").with(csrf()).contentType(MediaType.APPLICATION_JSON).content("{\"title\":\"\"}"))
           .andExpect(status().isBadRequest())
           .andExpect(jsonPath("$.errors.title").exists());
    }
}`),
        file("src/test/java/com/mc/enrol/repo/CourseRepositoryIT.java", code`
package com.mc.enrol.repo;

import com.mc.enrol.domain.Course;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest                                                // JPA slice, each test rolled back
@Testcontainers
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)   // use the container, not H2
class CourseRepositoryIT {
    @Container @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine");

    @Autowired CourseRepository repo;

    @Test
    void findsByCodeAndSearchesTitle() {
        repo.save(new Course("JAVA-101", "Core Java Foundations", Course.Level.BEGINNER, 50, 0));
        assertThat(repo.findByCode("JAVA-101")).isPresent();
        assertThat(repo.search("foundations")).extracting(Course::getCode).containsExactly("JAVA-101");
        assertThat(repo.existsByCodeIgnoreCase("java-101")).isTrue();
    }
}`),
      ],
      tips: [
        "@MockitoBean replaced @MockBean in Spring Boot 3.4; the older annotation is deprecated.",
        "Each different set of mocked beans creates a new cached application context — share configurations to keep suites fast.",
        "Name integration tests *IT and run them with the Failsafe plugin if they need Docker.",
        "Prefer AssertJ's fluent assertions; they produce far clearer failure messages.",
      ],
      subjective: [
        qa("Differentiate @SpringBootTest, @WebMvcTest and @DataJpaTest.", "@SpringBootTest boots the complete application context (optionally with a real server on a random port) for end-to-end integration tests; slowest but most realistic. @WebMvcTest loads only the web layer — controllers, @ControllerAdvice, filters, converters, MockMvc — and requires mocking services; fast tests of request mapping, validation, serialization and error handling. @DataJpaTest loads only JPA components (entities, repositories, EntityManager, DataSource), configures an embedded or containerized database, and wraps each test in a rolled-back transaction."),
        qa("What is Testcontainers and why is it preferable to H2 for repository tests?", "Testcontainers is a library that starts real services (databases, message brokers) in Docker containers for the lifetime of a test. Compared with H2 it tests against the same database engine and version as production, so native SQL, JSON types, constraints, migrations (Flyway) and dialect-specific behaviour are verified; H2's compatibility modes hide differences and can let bugs reach production."),
      ],
      objective: [
        mcq("Which annotation loads only MVC components for testing controllers?", ["@SpringBootTest", "@WebMvcTest", "@DataJpaTest", "@JsonTest"], 1, "Services must be mocked."),
        mcq("Which tool simulates HTTP requests against controllers without a real server?", ["RestTemplate", "MockMvc", "WebClient", "HttpClient"], 1, "MockMvc drives the DispatcherServlet in-memory."),
        mcq("By default, each @DataJpaTest test method:", ["Commits", "Is rolled back", "Runs without a transaction", "Uses a new JVM"], 1, "Tests stay isolated."),
        mcq("Which library mocks dependencies in plain unit tests?", ["AssertJ", "Mockito", "JsonPath", "Flyway"], 1, "mock(), when(), verify()."),
      ],
    },
    {
      id: "actuator-observability", module: "Quality and production", title: "Actuator, logging, metrics and observability", level: "Intermediate", minutes: 15,
      summary: "Health, info and metrics endpoints, readiness/liveness probes, custom health indicators, Micrometer metrics and structured logs.",
      description: [
        "spring-boot-starter-actuator adds production endpoints under /actuator: health (UP/DOWN with components such as db and diskSpace), info, metrics, prometheus (with micrometer-registry-prometheus), env, loggers (change log levels at run time), threaddump, heapdump and mappings. Only health is exposed over HTTP by default; expose others deliberately with management.endpoints.web.exposure.include and secure them.",
        "Kubernetes and load balancers use probes: /actuator/health/liveness says whether the process should be restarted and /actuator/health/readiness says whether it should receive traffic. Custom HealthIndicator beans add checks for dependencies such as a payment gateway.",
        "Micrometer is the metrics facade (like SLF4J for metrics): inject MeterRegistry to record counters, gauges, timers and distribution summaries, or use @Timed/@Observed. Spring Boot auto-instruments HTTP requests, JVM memory, GC, thread pools, HikariCP and more. Micrometer Tracing with OpenTelemetry propagates trace IDs across services, and Spring Boot 3.4+ can emit structured JSON logs (logging.structured.format.console=ecs) for log platforms.",
        "Logging uses SLF4J with Logback by default. Use parameterized messages (log.info(\"user {} enrolled\", id)), the right levels (ERROR for failures needing attention, WARN for recoverable problems, INFO for business events, DEBUG for diagnostics) and never log passwords, tokens or full card numbers.",
      ],
      usage: [
        "Point container orchestrators at the liveness and readiness probe endpoints.",
        "Expose /actuator/prometheus to Prometheus and build Grafana dashboards for latency, error rate and saturation.",
        "Record business metrics (enrolments per course, payment failures) alongside technical ones.",
        "Change a logger's level at run time via /actuator/loggers to debug production issues without redeploying.",
      ],
      files: [
        file("src/main/resources/application.yml", code`
management:
  endpoints:
    web:
      exposure:
        include: health,info,metrics,prometheus,loggers
  endpoint:
    health:
      probes:
        enabled: true            # /actuator/health/liveness and /readiness
      show-details: when-authorized
  info:
    env:
      enabled: true
info:
  app:
    name: enrol-api
    version: "@project.version@"
logging:
  structured:
    format:
      console: ecs               # JSON logs (Spring Boot 3.4+)
  level:
    com.mc.enrol: INFO`),
        file("src/main/java/com/mc/enrol/ops/PaymentGatewayHealth.java", code`
package com.mc.enrol.ops;

import org.springframework.boot.actuate.health.Health;
import org.springframework.boot.actuate.health.HealthIndicator;
import org.springframework.stereotype.Component;

@Component("paymentGateway")                   // appears as components.paymentGateway in /actuator/health
public class PaymentGatewayHealth implements HealthIndicator {
    @Override
    public Health health() {
        long latencyMs = ping();
        return latencyMs < 500
            ? Health.up().withDetail("latencyMs", latencyMs).build()
            : Health.down().withDetail("latencyMs", latencyMs).withDetail("reason", "slow gateway").build();
    }
    private long ping() { return 120; }         // call the provider's status endpoint in real code
}`),
        file("src/main/java/com/mc/enrol/ops/EnrolmentMetrics.java", code`
package com.mc.enrol.ops;

import io.micrometer.core.instrument.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import java.util.function.Supplier;

@Component
public class EnrolmentMetrics {
    private static final Logger log = LoggerFactory.getLogger(EnrolmentMetrics.class);
    private final MeterRegistry registry;
    private final Timer enrolTimer;

    public EnrolmentMetrics(MeterRegistry registry) {
        this.registry = registry;
        this.enrolTimer = Timer.builder("enrol.duration").description("Time to enrol a student")
            .publishPercentiles(0.5, 0.95, 0.99).register(registry);
    }

    public <T> T timeEnrol(String course, Supplier<T> work) {
        try {
            T result = enrolTimer.record(work);
            registry.counter("enrol.success", "course", course).increment();   // tag = dimension
            log.info("enrolment succeeded course={}", course);                 // parameterized, no secrets
            return result;
        } catch (RuntimeException e) {
            registry.counter("enrol.failure", "course", course, "reason", e.getClass().getSimpleName()).increment();
            log.warn("enrolment failed course={} reason={}", course, e.getMessage());
            throw e;
        }
    }
}`),
      ],
      tips: [
        "Never expose env, heapdump or threaddump publicly — they can leak secrets and memory contents.",
        "Keep metric tag values low-cardinality: course codes are fine, user IDs or emails are not.",
        "Readiness DOWN during startup or a dependency outage removes the pod from load balancing without restarting it.",
        "Use a separate management port (management.server.port) to keep actuator off the public ingress.",
      ],
      subjective: [
        qa("What is Spring Boot Actuator? Name important endpoints.", "Actuator adds production-ready features to monitor and manage an application over HTTP or JMX. Important endpoints: /health (application and dependency health, liveness/readiness probes), /info (build and app info), /metrics (Micrometer metrics), /prometheus (metrics in Prometheus format), /loggers (view and change log levels), /env (configuration properties), /mappings (request mappings), /beans, /threaddump, /heapdump, /scheduledtasks. Only health is exposed over the web by default."),
        qa("Differentiate liveness and readiness probes.", "Liveness answers “is the application alive or stuck?”; if it fails, the orchestrator restarts the container. It should not depend on external systems, or a database outage would trigger pointless restart loops. Readiness answers “can the application handle traffic now?”; if it fails, the instance is removed from the load balancer but not restarted. It may consider startup completion and critical dependencies."),
      ],
      objective: [
        mcq("Which Actuator endpoint is exposed over HTTP by default?", ["env", "health", "beans", "heapdump"], 1, "Others must be included explicitly."),
        mcq("Micrometer is best described as:", ["A logging framework", "A vendor-neutral metrics facade", "A tracing database", "A JSON parser"], 1, "It supports Prometheus, Datadog, CloudWatch and more."),
        mcq("Which probe failure should cause a container restart?", ["Readiness", "Liveness", "Startup only", "Info"], 1, "Readiness failure only stops traffic."),
        mcq("Default logging implementation in Spring Boot:", ["Log4j 1", "Logback via SLF4J", "java.util.logging", "System.out"], 1, "Logback is included by spring-boot-starter-logging."),
      ],
    },
    {
      id: "caching-scheduling-async", module: "Quality and production", title: "Caching, scheduling and asynchronous methods", level: "Intermediate", minutes: 16,
      summary: "@Cacheable/@CacheEvict with Caffeine or Redis, @Scheduled jobs and cron expressions, @Async with a bounded executor.",
      description: [
        "Spring's cache abstraction caches method results: @EnableCaching once, then @Cacheable(\"courses\") returns a cached value for the same arguments, @CachePut always runs and updates the cache, @CacheEvict removes entries (allEntries = true clears). The key defaults to the method arguments; customize with SpEL (key = \"#code\") and add conditions (unless = \"#result == null\"). Providers: ConcurrentMap (default, no expiry), Caffeine (local, with size and TTL), Redis (shared across instances).",
        "@EnableScheduling enables @Scheduled methods: fixedRate (start every N ms), fixedDelay (N ms after the previous run ends), initialDelay, and cron with six fields (second minute hour day month weekday) plus a zone, e.g. \"0 0 5 * * *\" for 05:00 daily. In a multi-instance deployment every instance runs the job — use ShedLock or a single scheduler instance to avoid duplicates.",
        "@EnableAsync makes @Async methods run on a TaskExecutor and return void, CompletableFuture or Future. Configure a bounded ThreadPoolTaskExecutor (or virtual threads with spring.threads.virtual.enabled=true). Like transactions and caching, these are proxy-based, so self-invocation does not apply them, and exceptions in void async methods go to an AsyncUncaughtExceptionHandler.",
      ],
      usage: [
        "Cache expensive, frequently read, rarely changing data such as course catalogues or exchange rates.",
        "Evict or update cache entries in the same service methods that change the data.",
        "Schedule nightly reports, cleanup of expired holds and reminders with @Scheduled.",
        "Send emails and notifications asynchronously so API responses stay fast.",
      ],
      files: [
        file("src/main/java/com/mc/enrol/config/PerformanceConfig.java", code`
package com.mc.enrol.config;

import com.github.benmanes.caffeine.cache.Caffeine;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.caffeine.CaffeineCacheManager;
import org.springframework.context.annotation.*;
import org.springframework.scheduling.annotation.*;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;
import java.time.Duration;
import java.util.concurrent.Executor;

@Configuration
@EnableCaching
@EnableScheduling
@EnableAsync
public class PerformanceConfig {
    @Bean
    CacheManager cacheManager() {
        CaffeineCacheManager manager = new CaffeineCacheManager("courses", "courseByCode");
        manager.setCaffeine(Caffeine.newBuilder().maximumSize(1_000).expireAfterWrite(Duration.ofMinutes(10)));
        return manager;
    }

    @Bean(name = "mailExecutor")
    Executor mailExecutor() {
        ThreadPoolTaskExecutor ex = new ThreadPoolTaskExecutor();
        ex.setCorePoolSize(2);
        ex.setMaxPoolSize(4);
        ex.setQueueCapacity(500);                 // bounded: back-pressure instead of unbounded memory
        ex.setThreadNamePrefix("mail-");
        ex.initialize();
        return ex;
    }
}`),
        file("src/main/java/com/mc/enrol/service/CatalogueService.java", code`
package com.mc.enrol.service;

import com.mc.enrol.domain.Course;
import com.mc.enrol.repo.CourseRepository;
import org.springframework.cache.annotation.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
public class CatalogueService {
    private final CourseRepository repo;
    public CatalogueService(CourseRepository repo) { this.repo = repo; }

    @Cacheable(cacheNames = "courseByCode", key = "#code", unless = "#result == null")
    @Transactional(readOnly = true)
    public CourseView byCode(String code) {
        System.out.println("DB hit for " + code);                  // printed only on a cache miss
        return repo.findByCode(code).map(CourseView::of).orElse(null);
    }

    @CacheEvict(cacheNames = { "courseByCode", "courses" }, allEntries = true)
    @Transactional
    public void addSeats(long id, int extra) { repo.addSeats(id, extra); }

    public record CourseView(String code, String title, int seatsLeft) {
        static CourseView of(Course c) { return new CourseView(c.getCode(), c.getTitle(), c.seatsLeft()); }
    }
}`),
        file("src/main/java/com/mc/enrol/jobs/Jobs.java", code`
package com.mc.enrol.jobs;

import org.springframework.scheduling.annotation.Async;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import java.util.concurrent.CompletableFuture;

@Component
public class Jobs {
    @Scheduled(cron = "0 0 5 * * *", zone = "Asia/Kolkata")     // sec min hour day month weekday: 05:00 IST daily
    public void dailyReport() { System.out.println("Building the daily enrolment report"); }

    @Scheduled(fixedDelay = 60_000, initialDelay = 10_000)     // 60 s after the previous run finishes
    public void releaseExpiredHolds() { System.out.println("Releasing seat holds older than 15 minutes"); }

    @Async("mailExecutor")                                     // runs on the mail- thread pool
    public CompletableFuture<Boolean> sendWelcome(String email) {
        System.out.println(Thread.currentThread().getName() + " sending welcome to " + email);
        return CompletableFuture.completedFuture(true);
    }
}`),
      ],
      tips: [
        "Cached objects should be immutable DTOs — returning a cached mutable entity lets callers corrupt the cache.",
        "Spring cron has six fields (seconds first), unlike Unix cron's five.",
        "fixedRate can overlap runs if a run takes longer than the rate unless the scheduler is single-threaded; fixedDelay never overlaps.",
        "@Async on a method called from the same class runs synchronously — the proxy rule again.",
      ],
      subjective: [
        qa("Explain @Cacheable, @CachePut and @CacheEvict.", "@Cacheable: before invoking the method, Spring looks up the key in the named cache; on a hit it returns the cached value without executing the method, on a miss it executes and stores the result. @CachePut: always executes the method and puts the result into the cache — used to refresh entries after updates. @CacheEvict: removes one entry (by key) or all entries (allEntries = true), optionally before invocation (beforeInvocation = true) — used when data changes or is deleted."),
        qa("Differentiate fixedRate, fixedDelay and cron in @Scheduled.", "fixedRate runs the task at a constant interval measured from the start of each execution (every N ms), regardless of how long the previous run took. fixedDelay waits N ms after the previous execution completes before starting the next, so runs never overlap. cron schedules by calendar expression (second, minute, hour, day of month, month, day of week), e.g. \"0 30 9 * * MON-FRI\" for 09:30 on weekdays, optionally with a time zone."),
      ],
      objective: [
        mcq("Which annotation always executes the method and updates the cache?", ["@Cacheable", "@CachePut", "@CacheEvict", "@Caching"], 1, "Used after updates."),
        mcq("Spring's cron expression \"0 0 5 * * *\" means:", ["Every 5 minutes", "At 05:00 every day", "On the 5th of every month", "Every 5 seconds"], 1, "Seconds=0, minutes=0, hour=5."),
        mcq("Which annotation is required to activate @Async methods?", ["@EnableScheduling", "@EnableAsync", "@EnableCaching", "@Async on the main class"], 1, "Enables the async proxy."),
        mcq("Default cache provider when none is configured:", ["Redis", "Caffeine", "ConcurrentMapCacheManager", "Ehcache"], 2, "Simple in-memory maps without expiry."),
      ],
    },
    {
      id: "microservices-rest-client", module: "Quality and production", title: "Calling other services: RestClient, resilience and API documentation", level: "Advanced", minutes: 18,
      summary: "RestClient and HTTP interfaces, timeouts, retries and circuit breakers with Resilience4j, and OpenAPI docs with springdoc.",
      description: [
        "Spring Framework 6.1 introduced RestClient, a fluent synchronous client that replaces most uses of RestTemplate (now in maintenance). It shares message converters and interceptors with MVC: restClient.get().uri(\"/users/{id}\", id).retrieve().body(User.class). onStatus handlers map error responses to exceptions. HTTP interface clients let you declare a Java interface with @GetExchange/@PostExchange and have Spring generate the implementation — similar to OpenFeign. WebClient remains for reactive or streaming use.",
        "Remote calls fail in ways local calls do not: latency spikes, timeouts, partial outages. Always set connect and read timeouts. Resilience4j provides patterns as annotations or decorators: @Retry (with backoff, only for idempotent or safely retriable operations), @CircuitBreaker (stop calling a failing service for a while and use a fallback), @RateLimiter, @Bulkhead and @TimeLimiter.",
        "Microservice concerns that build on this: service discovery (Kubernetes DNS, Eureka), centralized configuration, API gateways (Spring Cloud Gateway), distributed tracing, idempotency keys for retried writes, and asynchronous messaging (Kafka, RabbitMQ) to decouple services. Document APIs with springdoc-openapi, which generates an OpenAPI 3 spec at /v3/api-docs and Swagger UI at /swagger-ui.html from your controllers and validation annotations.",
      ],
      usage: [
        "Wrap each downstream service in its own client class with timeouts, error mapping and resilience annotations.",
        "Use HTTP interface clients to keep remote APIs strongly typed.",
        "Publish OpenAPI docs so front-end and partner teams can generate clients.",
        "Prefer events/messaging for work that does not need an immediate answer.",
      ],
      files: [
        file("src/main/java/com/mc/enrol/client/PaymentClientConfig.java", code`
package com.mc.enrol.client;

import org.springframework.boot.http.client.ClientHttpRequestFactoryBuilder;
import org.springframework.boot.http.client.ClientHttpRequestFactorySettings;
import org.springframework.context.annotation.*;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.support.RestClientAdapter;
import org.springframework.web.service.invoker.HttpServiceProxyFactory;
import java.time.Duration;

@Configuration
public class PaymentClientConfig {
    @Bean
    RestClient paymentRestClient(RestClient.Builder builder) {          // Boot-provided builder with converters
        var settings = ClientHttpRequestFactorySettings.defaults()
            .withConnectTimeout(Duration.ofSeconds(2))
            .withReadTimeout(Duration.ofSeconds(5));                     // never call without timeouts
        return builder.baseUrl("https://payments.internal")
            .requestFactory(ClientHttpRequestFactoryBuilder.detect().build(settings))
            .defaultHeader("X-Client", "enrol-api")
            .build();
    }

    @Bean
    PaymentApi paymentApi(RestClient paymentRestClient) {               // HTTP interface -> generated client
        return HttpServiceProxyFactory.builderFor(RestClientAdapter.create(paymentRestClient)).build().createClient(PaymentApi.class);
    }
}`),
        file("src/main/java/com/mc/enrol/client/PaymentApi.java", code`
package com.mc.enrol.client;

import org.springframework.web.bind.annotation.*;
import org.springframework.web.service.annotation.*;

@HttpExchange("/v1/payments")
public interface PaymentApi {
    record ChargeRequest(String student, long amountPaise, String idempotencyKey) { }
    record ChargeResponse(String id, String status) { }

    @PostExchange
    ChargeResponse charge(@RequestBody ChargeRequest request, @RequestHeader("Idempotency-Key") String key);

    @GetExchange("/{id}")
    ChargeResponse status(@PathVariable String id);
}`),
        file("src/main/java/com/mc/enrol/client/PaymentService.java", code`
package com.mc.enrol.client;

import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import io.github.resilience4j.retry.annotation.Retry;
import org.springframework.stereotype.Service;

@Service
public class PaymentService {
    private final PaymentApi api;
    public PaymentService(PaymentApi api) { this.api = api; }

    // Same idempotency key on every retry: the provider charges at most once
    @Retry(name = "payments")
    @CircuitBreaker(name = "payments", fallbackMethod = "queued")
    public PaymentApi.ChargeResponse charge(String student, long paise, String enrolmentId) {
        String key = "enrol-" + enrolmentId;
        return api.charge(new PaymentApi.ChargeRequest(student, paise, key), key);
    }

    // Fallback: same parameters plus the exception
    private PaymentApi.ChargeResponse queued(String student, long paise, String enrolmentId, Throwable cause) {
        return new PaymentApi.ChargeResponse("pending-" + enrolmentId, "QUEUED_FOR_RETRY");
    }
}`),
        file("src/main/resources/application.yml", code`
resilience4j:
  retry:
    instances:
      payments:
        max-attempts: 3
        wait-duration: 300ms
        enable-exponential-backoff: true
  circuitbreaker:
    instances:
      payments:
        sliding-window-size: 20
        failure-rate-threshold: 50        # open when half of the last 20 calls failed
        wait-duration-in-open-state: 30s
springdoc:
  swagger-ui:
    path: /swagger-ui.html               # OpenAPI spec at /v3/api-docs`),
      ],
      tips: [
        "Retry only idempotent operations, or make them idempotent with idempotency keys.",
        "Order matters: a retry inside a circuit breaker counts one breaker call per retried attempt depending on aspect order — configure it deliberately.",
        "Time-outs belong on every network call; the default for some clients is infinite.",
        "A circuit breaker's fallback should degrade gracefully (cached data, queued work), not hide failures silently.",
      ],
      subjective: [
        qa("What is the circuit breaker pattern?", "A circuit breaker wraps calls to a remote service and tracks failures. In the CLOSED state calls pass through; when the failure rate in a sliding window exceeds a threshold it OPENS and immediately fails or runs a fallback without calling the service, protecting both sides and freeing threads. After a wait time it becomes HALF_OPEN and lets a few trial calls through; success closes it again, failure reopens it. Resilience4j's @CircuitBreaker implements this in Spring Boot."),
        qa("Compare RestTemplate, RestClient and WebClient.", "RestTemplate is the original synchronous template-method client, now in maintenance mode. RestClient (Spring 6.1+) is the modern synchronous client with a fluent API, sharing infrastructure with RestTemplate and supporting HTTP interface clients — the default choice for Spring MVC apps (and with virtual threads, blocking calls scale well). WebClient is the non-blocking reactive client from WebFlux, suited to reactive applications, streaming and very high concurrency with few threads."),
      ],
      objective: [
        mcq("Which client is the modern synchronous replacement for RestTemplate?", ["WebClient", "RestClient", "HttpURLConnection", "Feign only"], 1, "Introduced in Spring Framework 6.1."),
        mcq("Circuit breaker state that allows a limited number of trial calls:", ["CLOSED", "OPEN", "HALF_OPEN", "DISABLED"], 2, "It probes whether the service has recovered."),
        mcq("Which operations are safe to retry without extra measures?", ["Non-idempotent POSTs", "Idempotent GETs/PUTs", "Payments without keys", "All of them"], 1, "Use idempotency keys for others."),
        mcq("springdoc-openapi serves the API description by default at:", ["/api-docs.json", "/v3/api-docs", "/openapi", "/swagger.json"], 1, "Swagger UI is at /swagger-ui.html."),
      ],
    },
    {
      id: "packaging-deployment", module: "Quality and production", title: "Packaging and deployment: executable JARs, Docker and native images", level: "Intermediate", minutes: 14,
      summary: "Building the fat JAR, layered Docker images, Cloud Native Buildpacks, GraalVM native images, graceful shutdown and virtual threads.",
      description: [
        "The Spring Boot Maven/Gradle plugin repackages the application into an executable “fat” JAR containing your classes, all dependencies in BOOT-INF/lib and a launcher, so java -jar app.jar runs anywhere with a JRE. Layered JARs separate dependencies (rarely changing) from application classes (frequently changing) so Docker can cache layers and rebuild quickly.",
        "Container options: a multi-stage Dockerfile (build with a JDK image, run with a slim JRE image as a non-root user) or Cloud Native Buildpacks via ./mvnw spring-boot:build-image, which produces an optimized OCI image without a Dockerfile. Configure the JVM for containers with -XX:MaxRAMPercentage rather than fixed -Xmx so the heap scales with the container memory limit.",
        "GraalVM native images (./mvnw -Pnative native:compile) compile the application ahead of time into a standalone executable with millisecond startup and lower memory, at the cost of longer builds and restrictions on reflection (handled by Spring AOT hints). Alternatively, CRaC checkpoint/restore and Class Data Sharing reduce JVM startup time.",
        "Production settings: server.shutdown=graceful finishes in-flight requests on SIGTERM; spring.threads.virtual.enabled=true (Java 21) handles each request on a virtual thread for high-concurrency blocking workloads; health probes integrate with Kubernetes; configuration and secrets come from the environment.",
      ],
      usage: [
        "Build images in CI, tag them with the Git commit, and promote the same image across environments.",
        "Run as a non-root user with read-only filesystems where possible.",
        "Enable graceful shutdown and set the orchestrator's termination grace period longer than it.",
        "Use native images for serverless or scale-to-zero workloads where startup time dominates.",
      ],
      files: [
        file("Dockerfile", code`
# ---- build stage ----
FROM eclipse-temurin:21-jdk AS build
WORKDIR /src
COPY mvnw pom.xml ./
COPY .mvn .mvn
RUN ./mvnw -q dependency:go-offline            # cached unless pom.xml changes
COPY src src
RUN ./mvnw -q -DskipTests package && java -Djarmode=tools -jar target/*.jar extract --layers --launcher --destination extracted

# ---- run stage ----
FROM eclipse-temurin:21-jre
RUN useradd --system --uid 1001 spring
USER spring
WORKDIR /app
# Least-changing layers first so Docker reuses them between builds
COPY --from=build /src/extracted/dependencies/ ./
COPY --from=build /src/extracted/spring-boot-loader/ ./
COPY --from=build /src/extracted/snapshot-dependencies/ ./
COPY --from=build /src/extracted/application/ ./
EXPOSE 8080
ENV JAVA_TOOL_OPTIONS="-XX:MaxRAMPercentage=75 -XX:+ExitOnOutOfMemoryError"
ENTRYPOINT ["java", "org.springframework.boot.loader.launch.JarLauncher"]`),
        file("src/main/resources/application-prod.yml", code`
server:
  shutdown: graceful              # finish in-flight requests on SIGTERM
  forward-headers-strategy: framework
spring:
  lifecycle:
    timeout-per-shutdown-phase: 20s
  threads:
    virtual:
      enabled: true               # Java 21: request handling on virtual threads
  jpa:
    open-in-view: false
management:
  server:
    port: 9090                    # actuator off the public port`),
        file("build-and-run.sh", code`
# Executable JAR
./mvnw clean package
java -jar target/enrol-1.0.0.jar --spring.profiles.active=prod

# OCI image with Cloud Native Buildpacks (no Dockerfile needed)
./mvnw spring-boot:build-image -Dspring-boot.build-image.imageName=registry.example/enrol-api:$(git rev-parse --short HEAD)

# Docker with the multi-stage Dockerfile
docker build -t enrol-api:local .
docker run -p 8080:8080 -e SPRING_PROFILES_ACTIVE=prod -e DB_URL=jdbc:postgresql://host.docker.internal:5432/enrol enrol-api:local

# GraalVM native executable (requires GraalVM JDK)
./mvnw -Pnative native:compile && ./target/enrol`),
      ],
      tips: [
        "Spring Boot 3.2+ moved the launcher to org.springframework.boot.loader.launch.JarLauncher.",
        "Never bake secrets into images — they persist in image layers and registries.",
        "Use -XX:+ExitOnOutOfMemoryError so the orchestrator restarts a broken JVM instead of leaving it half-alive.",
        "Native images need reachability hints for reflection-heavy libraries; test the native build in CI.",
      ],
      subjective: [
        qa("What is a fat JAR and how does Spring Boot run it?", "A fat (uber) JAR packages the application classes together with all dependency JARs and a launcher. Spring Boot's plugin places application classes in BOOT-INF/classes and dependencies in BOOT-INF/lib (nested JARs) and sets Main-Class to Spring Boot's JarLauncher in the manifest, with Start-Class pointing to your @SpringBootApplication class. The launcher creates a class loader that can read nested JARs and then invokes your main method."),
        qa("Compare running Spring Boot on the JVM and as a GraalVM native image.", "JVM: fast build, full dynamic features, the JIT reaches high peak throughput after warm-up, but startup takes seconds and memory use is higher. Native image: compiled ahead of time with a closed-world assumption; starts in tens of milliseconds and uses less memory, ideal for serverless and scale-to-zero; but builds are slow, reflection/proxies/resources need AOT hints, some libraries are incompatible, and peak throughput may be lower without profile-guided optimization."),
      ],
      objective: [
        mcq("Which Maven goal builds an OCI image with buildpacks?", ["spring-boot:run", "spring-boot:build-image", "package -Pdocker", "jib:build"], 1, "No Dockerfile needed."),
        mcq("Property enabling graceful shutdown:", ["server.shutdown=graceful", "spring.graceful=true", "management.shutdown=enabled", "server.stop=soft"], 0, "In-flight requests complete before shutdown."),
        mcq("Main benefit of GraalVM native images:", ["Higher peak throughput always", "Very fast startup and lower memory", "No need for Java code", "Automatic scaling"], 1, "Ahead-of-time compilation trades build time for startup."),
        mcq("Which property enables virtual threads for request handling in Spring Boot 3.2+?", ["server.virtual=true", "spring.threads.virtual.enabled=true", "java.virtual.threads=on", "spring.mvc.async=true"], 1, "Requires Java 21."),
      ],
    },
  ],
};
