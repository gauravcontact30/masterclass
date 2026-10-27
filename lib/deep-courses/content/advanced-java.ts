import type { DeepCourse } from "../types";
import { DEEP_COURSES } from "../index";
import { code, file, mcq, qa } from "./helpers";

export const COURSE: DeepCourse = {
  ...DEEP_COURSES.find(course => course.id === "advanced-java")!,
  intro: [
    "Advanced Java is the server side of the platform: talking to databases with JDBC, serving HTTP with Servlets and JSP, managing sessions, mapping objects to tables with JPA/Hibernate, and running work concurrently with the java.util.concurrent toolkit.",
    "The Servlet and JSP examples use the Jakarta EE namespace (jakarta.servlet), which Tomcat 10+ and Spring Boot 3 require; older textbooks use javax.servlet — the APIs are otherwise the same. Each topic ends with written answers and MCQs in the style of university Advanced Java papers and backend interviews.",
  ],
  topics: [
    {
      id: "jdbc-basics", module: "Database access with JDBC", title: "JDBC architecture, drivers and CRUD with PreparedStatement", level: "Intermediate", minutes: 20,
      summary: "How Java talks to a relational database: DriverManager, Connection, Statement vs PreparedStatement, ResultSet and SQL injection.",
      description: [
        "JDBC (Java Database Connectivity) is a standard API in java.sql that lets Java code run SQL against any relational database through a vendor-supplied driver. The application calls JDBC interfaces; the driver translates them to the database's wire protocol. Today almost every driver is a Type 4 (pure Java, network protocol) driver; Types 1–3 (JDBC-ODBC bridge, native API, middleware) are historical but still asked in exams.",
        "The steps: put the driver JAR on the classpath (since JDBC 4 drivers self-register, so Class.forName is no longer needed); obtain a Connection with DriverManager.getConnection(url, user, password) or from a DataSource; create a Statement, PreparedStatement or CallableStatement; execute it with executeQuery (SELECT → ResultSet), executeUpdate (INSERT/UPDATE/DELETE → row count) or execute; read the ResultSet with next() and getXxx(column); and close everything — ideally with try-with-resources.",
        "PreparedStatement precompiles SQL with ? placeholders and binds values with setString, setInt and so on. It prevents SQL injection because values are sent separately from the SQL text, and it can be faster when reused. Never build SQL by concatenating user input. CallableStatement calls stored procedures ({call proc(?, ?)}).",
        "A ResultSet is a cursor positioned before the first row. By default it is forward-only and read-only; scrollable (TYPE_SCROLL_INSENSITIVE) and updatable (CONCUR_UPDATABLE) result sets exist but are rare. ResultSetMetaData describes the columns, DatabaseMetaData describes the database.",
      ],
      usage: [
        "Use PreparedStatement for every query that includes a value from outside the code.",
        "Use getGeneratedKeys to read auto-increment IDs after an INSERT.",
        "Map each row to a record or class inside a DAO (Data Access Object) so the rest of the code never sees JDBC types.",
        "Use plain JDBC (or Spring's JdbcClient) when you want full control of SQL; use JPA when you want object mapping.",
      ],
      files: [
        file("src/main/java/app/Student.java", code`
package app;

public record Student(long id, String name, String email, int marks) { }`),
        file("src/main/java/app/StudentDao.java", code`
package app;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

public class StudentDao {
    private final String url, user, password;

    public StudentDao(String url, String user, String password) { this.url = url; this.user = user; this.password = password; }

    private Connection connect() throws SQLException { return DriverManager.getConnection(url, user, password); }

    public long insert(String name, String email, int marks) throws SQLException {
        String sql = "INSERT INTO student(name, email, marks) VALUES (?, ?, ?)";
        try (Connection con = connect();
             PreparedStatement ps = con.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            ps.setString(1, name);                // values are bound, never concatenated
            ps.setString(2, email);
            ps.setInt(3, marks);
            ps.executeUpdate();
            try (ResultSet keys = ps.getGeneratedKeys()) {
                keys.next();
                return keys.getLong(1);
            }
        }
    }

    public Optional<Student> findByEmail(String email) throws SQLException {
        try (Connection con = connect();
             PreparedStatement ps = con.prepareStatement("SELECT id, name, email, marks FROM student WHERE email = ?")) {
            ps.setString(1, email);
            try (ResultSet rs = ps.executeQuery()) {
                return rs.next() ? Optional.of(map(rs)) : Optional.empty();
            }
        }
    }

    public List<Student> toppers(int minMarks) throws SQLException {
        List<Student> result = new ArrayList<>();
        try (Connection con = connect();
             PreparedStatement ps = con.prepareStatement("SELECT * FROM student WHERE marks >= ? ORDER BY marks DESC")) {
            ps.setInt(1, minMarks);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) result.add(map(rs));   // cursor starts before the first row
            }
        }
        return result;
    }

    public int updateMarks(long id, int marks) throws SQLException {
        try (Connection con = connect();
             PreparedStatement ps = con.prepareStatement("UPDATE student SET marks = ? WHERE id = ?")) {
            ps.setInt(1, marks);
            ps.setLong(2, id);
            return ps.executeUpdate();                   // number of rows changed
        }
    }

    private static Student map(ResultSet rs) throws SQLException {
        return new Student(rs.getLong("id"), rs.getString("name"), rs.getString("email"), rs.getInt("marks"));
    }
}`),
        file("src/main/java/app/Main.java", code`
package app;

public class Main {
    public static void main(String[] args) throws Exception {
        StudentDao dao = new StudentDao("jdbc:postgresql://localhost:5432/college", "app", System.getenv("DB_PASSWORD"));
        long id = dao.insert("Asha", "asha@example.com", 91);
        dao.updateMarks(id, 94);
        System.out.println(dao.findByEmail("asha@example.com").orElseThrow());
        dao.toppers(80).forEach(System.out::println);

        // NEVER do this: input "x' OR '1'='1" returns every row (SQL injection)
        // String sql = "SELECT * FROM student WHERE email = '" + input + "'";
    }
}`),
        file("schema.sql", code`
CREATE TABLE student (
    id     BIGSERIAL PRIMARY KEY,
    name   VARCHAR(100) NOT NULL,
    email  VARCHAR(150) NOT NULL UNIQUE,
    marks  INT CHECK (marks BETWEEN 0 AND 100)
);`),
      ],
      tips: [
        "JDBC column indexes start at 1, not 0 — in setXxx and getXxx alike.",
        "Read nullable numeric columns with getObject(col, Integer.class) or check rs.wasNull(); getInt returns 0 for NULL.",
        "Keep credentials out of source code: environment variables or a secrets manager.",
        "Exam answer for the steps of JDBC: load driver → get connection → create statement → execute query → process result → close connection.",
      ],
      subjective: [
        qa("Explain the types of JDBC drivers.", "Type 1 (JDBC-ODBC bridge): translates JDBC calls to ODBC; removed in Java 8. Type 2 (native-API, partly Java): uses the database's native client library, so it needs native code on each machine. Type 3 (network protocol/middleware): sends calls to a middleware server that talks to the database. Type 4 (thin, pure Java): converts calls directly to the database's network protocol; platform-independent, fastest to deploy and the one used today (e.g. PostgreSQL, MySQL Connector/J, Oracle thin)."),
        qa("Differentiate Statement, PreparedStatement and CallableStatement.", "Statement executes static SQL built as a string; it is compiled on every execution and is vulnerable to SQL injection if values are concatenated. PreparedStatement is precompiled with ? parameters bound through setters; it prevents injection, handles types and escaping, and can be reused efficiently, including in batches. CallableStatement extends PreparedStatement to call stored procedures and supports OUT parameters via registerOutParameter."),
        qa("What is SQL injection and how does PreparedStatement prevent it?", "SQL injection happens when user input is concatenated into SQL so that the input changes the query's structure, for example email = 'x' OR '1'='1' returning all rows or '; DROP TABLE ...'. With PreparedStatement the SQL structure is sent and parsed first and the values are bound separately as data, so input can never be interpreted as SQL syntax."),
        qa("Differentiate execute(), executeQuery() and executeUpdate().", "executeQuery is for SELECT and returns a ResultSet. executeUpdate is for INSERT, UPDATE, DELETE and DDL and returns the number of affected rows (0 for DDL). execute can run any SQL and returns true if the first result is a ResultSet (retrieve it with getResultSet) or false if it is an update count (getUpdateCount); it is used when the statement type is unknown or returns multiple results."),
      ],
      objective: [
        mcq("Which JDBC driver type is pure Java and talks the database protocol directly?", ["Type 1", "Type 2", "Type 3", "Type 4"], 3, "Type 4 thin drivers are the modern standard."),
        mcq("Which method is used for a SELECT query?", ["executeUpdate()", "executeQuery()", "executeBatch()", "update()"], 1, "executeQuery returns a ResultSet."),
        mcq("The first column index in a ResultSet is:", ["0", "1", "-1", "Depends on the driver"], 1, "JDBC indexes are 1-based."),
        mcq("Which interface helps prevent SQL injection?", ["Statement", "PreparedStatement", "ResultSet", "DriverManager"], 1, "Parameters are bound, not concatenated."),
        mcq("Initially the ResultSet cursor points:", ["At the first row", "Before the first row", "At the last row", "Nowhere until reset"], 1, "Call next() to move to the first row."),
      ],
    },
    {
      id: "jdbc-transactions-batch", module: "Database access with JDBC", title: "Transactions, isolation levels, savepoints and batch updates", level: "Advanced", minutes: 18,
      summary: "ACID, auto-commit, commit/rollback, isolation anomalies, savepoints and sending many statements in one round trip.",
      description: [
        "A transaction groups SQL statements into one unit of work with ACID properties: Atomicity (all or nothing), Consistency (constraints hold), Isolation (concurrent transactions do not see each other's partial work) and Durability (committed data survives crashes). A JDBC Connection is in auto-commit mode by default, so each statement commits immediately. To group statements call setAutoCommit(false), then commit() on success or rollback() on failure.",
        "Isolation levels trade consistency for concurrency. READ_UNCOMMITTED allows dirty reads; READ_COMMITTED (default in PostgreSQL, Oracle, SQL Server) prevents dirty reads but allows non-repeatable reads; REPEATABLE_READ (MySQL InnoDB default) also prevents non-repeatable reads, with phantoms possible in the SQL standard; SERIALIZABLE behaves as if transactions ran one after another. Set it with con.setTransactionIsolation(Connection.TRANSACTION_...).",
        "A Savepoint marks a point inside a transaction; rollback(savepoint) undoes only the work after it. Batch updates (addBatch, executeBatch) send many parameter sets in one network round trip, which is dramatically faster for bulk inserts; wrap them in a transaction so the batch is atomic.",
      ],
      usage: [
        "Money transfers, order placement with stock decrement, and any multi-table write must be one transaction.",
        "Use batches of a few hundred to a few thousand rows for imports; call executeBatch periodically.",
        "Keep transactions short: never wait for user input or remote HTTP calls while holding one.",
        "Use SELECT ... FOR UPDATE or a conditional UPDATE to prevent lost updates under concurrency.",
      ],
      files: [
        file("src/main/java/bank/TransferService.java", code`
package bank;

import java.math.BigDecimal;
import java.sql.*;

public class TransferService {
    private final javax.sql.DataSource dataSource;

    public TransferService(javax.sql.DataSource dataSource) { this.dataSource = dataSource; }

    public void transfer(long from, long to, BigDecimal amount) throws SQLException {
        try (Connection con = dataSource.getConnection()) {
            con.setAutoCommit(false);                                   // start a unit of work
            con.setTransactionIsolation(Connection.TRANSACTION_READ_COMMITTED);
            try {
                // Conditional update: succeeds only if the balance is sufficient (no lost update)
                try (PreparedStatement debit = con.prepareStatement(
                        "UPDATE account SET balance = balance - ? WHERE id = ? AND balance >= ?")) {
                    debit.setBigDecimal(1, amount);
                    debit.setLong(2, from);
                    debit.setBigDecimal(3, amount);
                    if (debit.executeUpdate() != 1) throw new SQLException("insufficient funds or no such account");
                }
                try (PreparedStatement credit = con.prepareStatement("UPDATE account SET balance = balance + ? WHERE id = ?")) {
                    credit.setBigDecimal(1, amount);
                    credit.setLong(2, to);
                    if (credit.executeUpdate() != 1) throw new SQLException("no such account " + to);
                }
                con.commit();                                           // both updates become visible together
            } catch (SQLException e) {
                con.rollback();                                         // neither update is kept
                throw e;
            }
        }
    }
}`),
        file("src/main/java/bank/BulkImport.java", code`
package bank;

import java.sql.*;
import java.util.List;

public class BulkImport {
    public record Row(String name, String city) { }

    public static int[] importAll(Connection con, List<Row> rows) throws SQLException {
        con.setAutoCommit(false);
        Savepoint beforeImport = con.setSavepoint("before_import");
        try (PreparedStatement ps = con.prepareStatement("INSERT INTO customer(name, city) VALUES (?, ?)")) {
            int count = 0;
            for (Row row : rows) {
                ps.setString(1, row.name());
                ps.setString(2, row.city());
                ps.addBatch();                                          // queue this parameter set
                if (++count % 500 == 0) ps.executeBatch();              // flush every 500 rows
            }
            int[] results = ps.executeBatch();
            con.commit();
            return results;
        } catch (BatchUpdateException e) {
            con.rollback(beforeImport);                                 // undo only the import
            con.commit();
            throw e;
        }
    }
}`),
      ],
      tips: [
        "Always restore auto-commit or close the connection; with a pool, a connection left in manual mode leaks into the next request.",
        "rollback() on a closed or auto-commit connection throws SQLException — guard your error handling.",
        "Higher isolation means more locking or more serialization failures to retry, not just “more safety”.",
        "For MySQL, add rewriteBatchedStatements=true to the JDBC URL to make batches truly multi-row.",
      ],
      subjective: [
        qa("Explain ACID properties with an example.", "Using a bank transfer of ₹500 from A to B: Atomicity — the debit and credit both happen or neither does. Consistency — the total money and constraints such as balance ≥ 0 remain valid. Isolation — another transaction never sees A debited without B credited. Durability — once commit() returns, the transfer survives a crash, because it is written to the database's log."),
        qa("How do you manage a transaction in JDBC?", "Disable auto-commit with con.setAutoCommit(false), execute all statements on the same Connection, call con.commit() if all succeed, and call con.rollback() in the catch block if any fails. Optionally set the isolation level and use savepoints for partial rollback. Finally, close the connection (or restore auto-commit) in finally / try-with-resources."),
        qa("Describe the read anomalies prevented by each isolation level.", "Dirty read: reading uncommitted data of another transaction — prevented from READ_COMMITTED upward. Non-repeatable read: re-reading a row returns different data because another transaction committed an update — prevented from REPEATABLE_READ upward. Phantom read: re-running a range query returns new rows inserted by another transaction — prevented by SERIALIZABLE (and in practice by some databases' REPEATABLE_READ implementations)."),
      ],
      objective: [
        mcq("By default, a JDBC connection is in:", ["Manual commit mode", "Auto-commit mode", "Read-only mode", "Serializable mode"], 1, "Each statement commits on its own unless you call setAutoCommit(false)."),
        mcq("Which isolation level allows dirty reads?", ["READ_COMMITTED", "READ_UNCOMMITTED", "REPEATABLE_READ", "SERIALIZABLE"], 1, "It is the weakest level."),
        mcq("Which method sends a group of statements to the database in one call?", ["executeAll()", "executeBatch()", "commitBatch()", "flush()"], 1, "Queue with addBatch, run with executeBatch."),
        mcq("A Savepoint allows you to:", ["Commit part of a transaction", "Roll back part of a transaction", "Save the connection for later", "Cache a query"], 1, "rollback(savepoint) undoes work after the savepoint."),
      ],
    },
    {
      id: "connection-pooling", module: "Database access with JDBC", title: "DataSource, connection pooling and the DAO pattern", level: "Intermediate", minutes: 14,
      summary: "Why opening connections is expensive, how HikariCP pools them, JNDI lookups, and structuring persistence code.",
      description: [
        "Opening a physical database connection involves a TCP handshake, TLS, authentication and session setup — often several milliseconds. A connection pool opens a fixed set of connections once and lends them out; calling close() on a pooled connection returns it to the pool rather than closing the socket. HikariCP is the fastest common pool and the default in Spring Boot; Apache DBCP and c3p0 are older alternatives.",
        "javax.sql.DataSource is the preferred factory for connections: application code depends on the interface while the pool (or the application server) provides the implementation. In Java EE/Jakarta EE servers such as Tomcat, a DataSource is configured by the container and looked up through JNDI (java:comp/env/jdbc/AppDB).",
        "The DAO (Data Access Object) pattern isolates persistence: an interface such as StudentDao declares operations (findById, save) and an implementation contains the SQL. Services depend on the interface, which keeps SQL out of business logic and makes it easy to test with fakes. Pool size should be small — often around (2 × CPU cores) on the database side — because more connections than the database can execute in parallel only add contention.",
      ],
      usage: [
        "Always use a pool in web applications; DriverManager is fine only for scripts and examples.",
        "Configure maximumPoolSize, connectionTimeout and maxLifetime (shorter than the database's idle timeout).",
        "Inject a DataSource into DAOs rather than having each DAO create connections.",
        "Monitor pool metrics (active, idle, pending) — a pending queue means slow queries or leaked connections.",
      ],
      files: [
        file("src/main/java/app/db/Database.java", code`
package app.db;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import javax.sql.DataSource;

public final class Database {
    private static final HikariDataSource POOL;

    static {
        HikariConfig cfg = new HikariConfig();
        cfg.setJdbcUrl(System.getenv().getOrDefault("DB_URL", "jdbc:postgresql://localhost:5432/college"));
        cfg.setUsername(System.getenv("DB_USER"));
        cfg.setPassword(System.getenv("DB_PASSWORD"));
        cfg.setMaximumPoolSize(10);              // small pools are faster than huge ones
        cfg.setConnectionTimeout(3_000);         // fail fast if the pool is exhausted
        cfg.setMaxLifetime(25 * 60_000);         // recycle before the server's idle timeout
        POOL = new HikariDataSource(cfg);
    }

    private Database() { }
    public static DataSource dataSource() { return POOL; }
}`),
        file("src/main/java/app/dao/BookDao.java", code`
package app.dao;

import java.util.List;
import java.util.Optional;

public interface BookDao {
    record Book(long id, String title, String author) { }
    Optional<Book> findById(long id);
    List<Book> findByAuthor(String author);
    Book save(String title, String author);
}`),
        file("src/main/java/app/dao/JdbcBookDao.java", code`
package app.dao;

import javax.sql.DataSource;
import java.sql.*;
import java.util.*;

public class JdbcBookDao implements BookDao {
    private final DataSource ds;
    public JdbcBookDao(DataSource ds) { this.ds = ds; }       // dependency injected

    @Override public Optional<Book> findById(long id) {
        try (Connection c = ds.getConnection();               // borrowed from the pool
             PreparedStatement ps = c.prepareStatement("SELECT id, title, author FROM book WHERE id = ?")) {
            ps.setLong(1, id);
            try (ResultSet rs = ps.executeQuery()) {
                return rs.next() ? Optional.of(new Book(rs.getLong(1), rs.getString(2), rs.getString(3))) : Optional.empty();
            }
        } catch (SQLException e) { throw new DataAccessException("findById " + id, e); }
    }                                                           // close() returns it to the pool

    @Override public List<Book> findByAuthor(String author) {
        List<Book> books = new ArrayList<>();
        try (Connection c = ds.getConnection();
             PreparedStatement ps = c.prepareStatement("SELECT id, title, author FROM book WHERE author = ?")) {
            ps.setString(1, author);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) books.add(new Book(rs.getLong(1), rs.getString(2), rs.getString(3)));
            }
        } catch (SQLException e) { throw new DataAccessException("findByAuthor", e); }
        return books;
    }

    @Override public Book save(String title, String author) {
        try (Connection c = ds.getConnection();
             PreparedStatement ps = c.prepareStatement("INSERT INTO book(title, author) VALUES (?, ?) RETURNING id")) {
            ps.setString(1, title);
            ps.setString(2, author);
            try (ResultSet rs = ps.executeQuery()) { rs.next(); return new Book(rs.getLong(1), title, author); }
        } catch (SQLException e) { throw new DataAccessException("save", e); }
    }

    public static class DataAccessException extends RuntimeException {
        public DataAccessException(String msg, Throwable cause) { super(msg, cause); }
    }
}`),
        file("src/main/webapp/META-INF/context.xml", code`
<!-- Tomcat: container-managed pool exposed through JNDI as java:comp/env/jdbc/AppDB -->
<Context>
  <Resource name="jdbc/AppDB" auth="Container" type="javax.sql.DataSource"
            driverClassName="org.postgresql.Driver"
            url="jdbc:postgresql://localhost:5432/college"
            username="app" password="change-me"
            maxTotal="20" maxIdle="5" maxWaitMillis="3000"/>
</Context>`),
      ],
      tips: [
        "A connection leak (forgetting close) eventually blocks every request waiting for the pool — try-with-resources prevents it.",
        "HikariCP's leakDetectionThreshold logs a stack trace for connections held too long.",
        "Translate SQLException into an unchecked domain exception at the DAO boundary.",
        "JNDI lookup: new InitialContext().lookup(\"java:comp/env/jdbc/AppDB\").",
      ],
      subjective: [
        qa("What is connection pooling? List its advantages.", "Connection pooling keeps a cache of open database connections that are reused across requests. When code asks the DataSource for a connection it borrows an idle one; close() returns it to the pool. Advantages: avoids the cost of creating connections per request (lower latency), caps the number of concurrent connections protecting the database, enables health checks and timeouts, and improves throughput and scalability."),
        qa("Explain the DAO design pattern.", "The Data Access Object pattern separates persistence logic from business logic. A DAO interface declares data operations for an entity (save, findById, delete); concrete classes implement them using JDBC, JPA or another technology; and the service layer depends only on the interface. Benefits: single responsibility, easier testing with mock DAOs, the ability to switch storage technology, and centralized SQL and exception translation."),
      ],
      objective: [
        mcq("In a pool, calling close() on a borrowed connection:", ["Closes the TCP socket", "Returns it to the pool", "Throws an exception", "Commits automatically"], 1, "The pool wraps the physical connection."),
        mcq("Which interface is the preferred source of JDBC connections in server applications?", ["DriverManager", "DataSource", "Driver", "ConnectionFactory"], 1, "DataSource decouples code from pool configuration."),
        mcq("Default connection pool in Spring Boot:", ["c3p0", "DBCP", "HikariCP", "Tomcat JDBC"], 2, "HikariCP is auto-configured when on the classpath."),
        mcq("JNDI is used to:", ["Compile JSPs", "Look up resources such as DataSources by name", "Hash passwords", "Map entities"], 1, "Java Naming and Directory Interface."),
      ],
    },
    {
      id: "servlet-lifecycle", module: "Web tier: Servlets and JSP", title: "Servlets: architecture, lifecycle and configuration", level: "Intermediate", minutes: 18,
      summary: "What a servlet container does, init/service/destroy, one instance many threads, annotations vs web.xml, and init/context parameters.",
      description: [
        "A servlet is a Java class that handles HTTP requests inside a servlet container (web container) such as Apache Tomcat, Jetty or Undertow. The container accepts connections, parses HTTP, maps the URL to a servlet, creates HttpServletRequest and HttpServletResponse objects, and calls the servlet on a worker thread. Most servlets extend HttpServlet and override doGet, doPost, doPut or doDelete.",
        "Lifecycle: the container loads the class and creates one instance (at first request or at startup with loadOnStartup), calls init(ServletConfig) once, calls service() for every request — which dispatches to doGet/doPost — on many threads concurrently, and calls destroy() once before unloading. Because one instance serves all requests, instance fields are shared across threads; keep servlets stateless or synchronize carefully.",
        "Mapping is configured with @WebServlet(urlPatterns = ...) or in WEB-INF/web.xml (the deployment descriptor). ServletConfig gives a servlet its own init parameters; ServletContext is shared by the whole web application (context parameters, application-scoped attributes, resources). A WAR file packages a web app: static files at the root, WEB-INF/web.xml, WEB-INF/classes and WEB-INF/lib.",
      ],
      usage: [
        "Understand servlets to understand Spring MVC: DispatcherServlet is itself a servlet.",
        "Use doGet for safe reads and doPost for actions that change state.",
        "Load heavy resources once in init() (or a ServletContextListener), not per request.",
        "Never store per-user data in servlet instance fields; use request or session attributes.",
      ],
      files: [
        file("src/main/java/web/HelloServlet.java", code`
package web;

import jakarta.servlet.ServletConfig;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebInitParam;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.*;
import java.io.IOException;
import java.io.PrintWriter;
import java.util.concurrent.atomic.AtomicLong;

@WebServlet(urlPatterns = "/hello", loadOnStartup = 1,
            initParams = @WebInitParam(name = "greeting", value = "Namaste"))
public class HelloServlet extends HttpServlet {
    private String greeting;                              // read-only after init: safe to share
    private final AtomicLong hits = new AtomicLong();      // shared counter must be thread-safe

    @Override public void init(ServletConfig config) throws ServletException {
        super.init(config);
        greeting = config.getInitParameter("greeting");
        log("HelloServlet initialised");                  // runs once
    }

    @Override protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        String name = req.getParameter("name");           // ?name=Asha
        resp.setContentType("text/html;charset=UTF-8");
        try (PrintWriter out = resp.getWriter()) {
            out.println("<h1>" + greeting + ", " + escape(name == null ? "guest" : name) + "</h1>");
            out.println("<p>Request #" + hits.incrementAndGet() + " served by " + Thread.currentThread().getName() + "</p>");
            out.println("<p>App: " + getServletContext().getInitParameter("appName") + "</p>");
        }
    }

    @Override public void destroy() { log("HelloServlet destroyed after " + hits + " requests"); }

    private static String escape(String s) {             // prevent XSS when echoing input
        return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace("\"", "&quot;");
    }
}`),
        file("src/main/webapp/WEB-INF/web.xml", code`
<?xml version="1.0" encoding="UTF-8"?>
<web-app xmlns="https://jakarta.ee/xml/ns/jakartaee" version="6.0">
    <display-name>College Portal</display-name>

    <!-- Shared by the whole application: ServletContext.getInitParameter("appName") -->
    <context-param>
        <param-name>appName</param-name>
        <param-value>College Portal</param-value>
    </context-param>

    <!-- The same servlet could be mapped here instead of with @WebServlet -->
    <servlet>
        <servlet-name>report</servlet-name>
        <servlet-class>web.ReportServlet</servlet-class>
        <init-param><param-name>format</param-name><param-value>pdf</param-value></init-param>
        <load-on-startup>2</load-on-startup>
    </servlet>
    <servlet-mapping>
        <servlet-name>report</servlet-name>
        <url-pattern>/reports/*</url-pattern>
    </servlet-mapping>

    <welcome-file-list><welcome-file>index.jsp</welcome-file></welcome-file-list>
    <error-page><error-code>404</error-code><location>/WEB-INF/views/404.jsp</location></error-page>
</web-app>`),
        file("pom.xml", code`
<project xmlns="http://maven.apache.org/POM/4.0.0">
  <modelVersion>4.0.0</modelVersion>
  <groupId>edu.college</groupId>
  <artifactId>portal</artifactId>
  <version>1.0</version>
  <packaging>war</packaging>
  <properties><maven.compiler.release>17</maven.compiler.release></properties>
  <dependencies>
    <dependency>
      <groupId>jakarta.servlet</groupId>
      <artifactId>jakarta.servlet-api</artifactId>
      <version>6.0.0</version>
      <scope>provided</scope> <!-- Tomcat supplies it at run time -->
    </dependency>
  </dependencies>
</project>`),
      ],
      tips: [
        "Override init() without arguments in your own code, or call super.init(config) — otherwise getServletConfig() returns null.",
        "Order of lifecycle methods is the classic viva answer: loading → instantiation → init() → service() (many times) → destroy().",
        "Servlets are not thread-safe by default; SingleThreadModel was deprecated and removed.",
        "javax.servlet → jakarta.servlet was a pure package rename in Jakarta EE 9.",
      ],
      subjective: [
        qa("Explain the life cycle of a servlet.", "1. Loading and instantiation: the container loads the servlet class and creates a single instance, either on the first request or at startup if load-on-startup is set. 2. Initialization: init(ServletConfig) is called once to acquire resources. 3. Request handling: for every request the container calls service(request, response) on a separate thread; HttpServlet.service dispatches to doGet, doPost etc. 4. Destruction: when the application is stopped or the servlet unloaded, destroy() is called once to release resources, after which the instance is garbage collected."),
        qa("Differentiate ServletConfig and ServletContext.", "ServletConfig is per servlet: created by the container for each servlet, carries that servlet's init parameters and a reference to the context; obtained with getServletConfig(). ServletContext is per web application: one object shared by all servlets, JSPs and filters, holding context parameters, application-scoped attributes, resource access and logging; obtained with getServletContext()."),
        qa("Why should servlets be stateless?", "The container creates one instance of each servlet and calls it concurrently from many threads. Instance fields are therefore shared by all requests and users; writing to them causes race conditions and data leaking between users. Per-request data belongs in local variables or request attributes, per-user data in the HttpSession, and shared data in thread-safe structures."),
      ],
      objective: [
        mcq("How many times is init() called for a servlet?", ["Once per request", "Once in its lifetime", "Twice", "Once per session"], 1, "init runs once after instantiation."),
        mcq("Which method dispatches requests to doGet/doPost?", ["init()", "service()", "destroy()", "dispatch()"], 1, "HttpServlet.service inspects the HTTP method."),
        mcq("The deployment descriptor of a Java web application is:", ["context.xml", "web.xml", "server.xml", "app.xml"], 1, "It lives in WEB-INF/web.xml."),
        mcq("Which object is shared by all servlets in a web application?", ["ServletConfig", "ServletContext", "HttpSession", "HttpServletRequest"], 1, "There is one ServletContext per application."),
        mcq("load-on-startup with a positive value means:", ["The servlet is never loaded", "The servlet is created when the application starts", "It loads on the first request only", "It runs as a filter"], 1, "Lower positive numbers load earlier."),
      ],
    },
    {
      id: "request-response", module: "Web tier: Servlets and JSP", title: "Requests, responses, forward vs redirect", level: "Intermediate", minutes: 16,
      summary: "Reading parameters and headers, writing responses and status codes, RequestDispatcher forward/include and sendRedirect, Post/Redirect/Get.",
      description: [
        "HttpServletRequest exposes everything about the incoming request: getParameter / getParameterValues for query string and form fields, getHeader, getMethod, getRequestURI, getPathInfo, getCookies, getSession, getInputStream / getReader for raw bodies (JSON) and attributes (setAttribute/getAttribute) for passing objects between components during one request. Call setCharacterEncoding(\"UTF-8\") before reading form data.",
        "HttpServletResponse writes the reply: setStatus or sendError for status codes, setContentType and setHeader, addCookie, and getWriter (text) or getOutputStream (binary). Once the response is committed (headers flushed) you can no longer change status or redirect.",
        "RequestDispatcher.forward(req, resp) passes the same request to another resource on the server; the browser URL does not change and request attributes are preserved — the usual way a controller servlet hands data to a JSP. include() inserts another resource's output. response.sendRedirect(url) sends a 302 response telling the browser to make a new request to a different URL (which may be on another site); request attributes are lost and the URL bar changes.",
        "Post/Redirect/Get (PRG): after a successful form POST, redirect to a GET page so that refreshing the browser does not resubmit the form.",
      ],
      usage: [
        "Use forward to render a view with data computed by a servlet.",
        "Use redirect after a state-changing POST, after login/logout, and to move users to another application.",
        "Return proper status codes: 400 for bad input, 404 for missing resources, 201 for created, 303/302 for redirects.",
        "Validate and escape every parameter: they are untrusted strings.",
      ],
      files: [
        file("src/main/java/web/RegisterServlet.java", code`
package web;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.*;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

@WebServlet("/register")
public class RegisterServlet extends HttpServlet {
    @Override protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        req.getRequestDispatcher("/WEB-INF/views/register.jsp").forward(req, resp);   // show the empty form
    }

    @Override protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        req.setCharacterEncoding("UTF-8");
        String name = req.getParameter("name");
        String email = req.getParameter("email");
        String[] courses = req.getParameterValues("course");          // checkboxes: many values

        List<String> errors = new ArrayList<>();
        if (name == null || name.isBlank()) errors.add("Name is required");
        if (email == null || !email.matches("^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$")) errors.add("Valid email is required");

        if (!errors.isEmpty()) {
            req.setAttribute("errors", errors);                        // request attribute survives a forward
            resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            req.getRequestDispatcher("/WEB-INF/views/register.jsp").forward(req, resp);
            return;
        }
        // ... save the student ...
        req.getSession().setAttribute("flash", "Welcome, " + name + " (" + (courses == null ? 0 : courses.length) + " courses)");
        resp.sendRedirect(req.getContextPath() + "/dashboard");         // PRG: new GET request, URL changes
    }
}`),
        file("src/main/java/web/ApiServlet.java", code`
package web;

import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.*;
import java.io.IOException;

@WebServlet("/api/ping")
public class ApiServlet extends HttpServlet {
    @Override protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        String body = new String(req.getInputStream().readAllBytes(), java.nio.charset.StandardCharsets.UTF_8);
        if (!"application/json".equals(req.getContentType())) {
            resp.sendError(415, "JSON only");                 // Unsupported Media Type
            return;
        }
        resp.setStatus(201);
        resp.setContentType("application/json");
        resp.setHeader("Cache-Control", "no-store");
        resp.getWriter().write("{\"received\":" + body.length() + ",\"agent\":\"" + req.getHeader("User-Agent").replace("\"", "") + "\"}");
    }
}`),
      ],
      tips: [
        "forward: one request, server-side, same URL, attributes kept. redirect: two requests, client-side, URL changes, attributes lost.",
        "Paths for getRequestDispatcher are relative to the context root; sendRedirect paths need req.getContextPath().",
        "Calling forward or sendRedirect after writing output throws IllegalStateException once the response is committed.",
        "getParameter returns null for missing fields and an empty string for empty ones — check both.",
      ],
      subjective: [
        qa("Differentiate forward() and sendRedirect().", "forward() (RequestDispatcher) transfers the same request and response to another resource inside the same web application on the server; the browser is unaware, the URL stays the same, request attributes are preserved, and it is faster (one round trip). sendRedirect() (HttpServletResponse) sends a 302/303 status with a Location header; the browser issues a new request to that URL, which can be anywhere, the URL bar changes, and request attributes are lost. Use forward to render views and redirect after POSTs (PRG) or to external sites."),
        qa("Differentiate GET and POST.", "GET sends parameters in the URL query string, is meant to be safe and idempotent, can be bookmarked and cached, and is limited in practical length; data appears in history and logs. POST sends data in the request body, is used for actions that change state, is not cached or bookmarked by default, supports large and binary payloads, and browsers warn before resubmitting. Neither is encrypted without HTTPS."),
        qa("What are request attributes and how do they differ from parameters?", "Parameters are strings sent by the client (query string or form body) and are read-only on the server. Attributes are objects set by server code with setAttribute to share data between components (servlet → JSP) during the same request; they never come from the client and disappear when the request ends."),
      ],
      objective: [
        mcq("After sendRedirect, the browser:", ["Shows the old URL", "Makes a new request to the new URL", "Keeps request attributes", "Receives status 200"], 1, "A redirect is a 3xx response followed by a new request."),
        mcq("Which method returns all values of a multi-select field?", ["getParameter", "getParameterValues", "getAttribute", "getParameterMap only"], 1, "It returns a String[]."),
        mcq("RequestDispatcher.forward keeps:", ["Only the URL", "The same request and its attributes", "Nothing", "Only cookies"], 1, "The same request object travels to the next resource."),
        mcq("Which HTTP method should a login form use?", ["GET", "POST", "HEAD", "TRACE"], 1, "Credentials must not appear in URLs, logs and history."),
      ],
    },
    {
      id: "session-management", module: "Web tier: Servlets and JSP", title: "Session tracking: cookies, HttpSession and URL rewriting", level: "Intermediate", minutes: 16,
      summary: "HTTP is stateless; the four tracking techniques, HttpSession lifecycle, secure cookie flags and session fixation.",
      description: [
        "HTTP is stateless: each request is independent, so the server needs a way to recognize the same user across requests. Classic techniques are cookies, hidden form fields, URL rewriting and the HttpSession API (which itself is usually implemented with a cookie named JSESSIONID).",
        "A Cookie is a small name–value pair the server sends with Set-Cookie and the browser returns on later requests. Set its max age (seconds; -1 = until the browser closes, 0 = delete), path, HttpOnly (not readable by JavaScript, mitigating XSS theft), Secure (HTTPS only) and SameSite (limits cross-site sending, mitigating CSRF).",
        "HttpSession stores user-specific objects on the server. request.getSession() returns the existing session or creates one; getSession(false) returns null if none exists. Use setAttribute/getAttribute, setMaxInactiveInterval (or session-timeout in web.xml, in minutes) and invalidate() on logout. If cookies are disabled, response.encodeURL appends ;jsessionid= to links (URL rewriting) — which leaks the ID in URLs and logs, so modern apps disable it.",
        "After login, call request.changeSessionId() to prevent session fixation (an attacker planting a known session ID before the victim logs in). In clustered deployments sessions need sticky routing or a shared store (Redis, Spring Session); stateless tokens such as JWTs are an alternative.",
      ],
      usage: [
        "Store the logged-in user's ID and roles in the session, not entire large object graphs.",
        "Use cookies for small client-side preferences (theme, language) and never for secrets in plain text.",
        "Invalidate the session on logout and rotate its ID on login.",
        "Set short idle timeouts for sensitive applications such as banking.",
      ],
      files: [
        file("src/main/java/web/LoginServlet.java", code`
package web;

import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.*;
import java.io.IOException;

@WebServlet("/login")
public class LoginServlet extends HttpServlet {
    @Override protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        String user = req.getParameter("username");
        String pass = req.getParameter("password");
        if (!"asha".equals(user) || !"s3cret!".equals(pass)) {       // demo only: use hashed passwords in real code
            resp.sendRedirect("login.jsp?error=1");
            return;
        }
        HttpSession session = req.getSession();       // create or reuse
        req.changeSessionId();                         // defeat session fixation
        session.setAttribute("user", user);
        session.setMaxInactiveInterval(15 * 60);       // 15 minutes idle timeout (seconds)

        Cookie theme = new Cookie("theme", "light");
        theme.setMaxAge(60 * 60 * 24 * 30);            // 30 days
        theme.setHttpOnly(true);
        theme.setSecure(true);
        theme.setPath(req.getContextPath());
        theme.setAttribute("SameSite", "Lax");         // Servlet 6.0
        resp.addCookie(theme);

        resp.sendRedirect(req.getContextPath() + "/dashboard");
    }
}`),
        file("src/main/java/web/DashboardServlet.java", code`
package web;

import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.*;
import java.io.IOException;

@WebServlet("/dashboard")
public class DashboardServlet extends HttpServlet {
    @Override protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        HttpSession session = req.getSession(false);   // do NOT create one for anonymous users
        if (session == null || session.getAttribute("user") == null) {
            resp.sendRedirect(req.getContextPath() + "/login.jsp");
            return;
        }
        String theme = "default";
        if (req.getCookies() != null)
            for (Cookie c : req.getCookies()) if (c.getName().equals("theme")) theme = c.getValue();

        resp.setContentType("text/plain");
        resp.getWriter().printf("Hello %s, theme=%s, session id=%s, created=%tT%n",
            session.getAttribute("user"), theme, session.getId(), session.getCreationTime());
    }
}`),
        file("src/main/java/web/LogoutServlet.java", code`
package web;

import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.*;
import java.io.IOException;

@WebServlet("/logout")
public class LogoutServlet extends HttpServlet {
    @Override protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        HttpSession session = req.getSession(false);
        if (session != null) session.invalidate();     // removes all attributes server-side
        Cookie gone = new Cookie("theme", "");
        gone.setMaxAge(0);                             // max age 0 deletes the cookie
        gone.setPath(req.getContextPath());
        resp.addCookie(gone);
        resp.sendRedirect(req.getContextPath() + "/login.jsp");
    }
}`),
      ],
      tips: [
        "session-timeout in web.xml is in minutes; setMaxInactiveInterval is in seconds — a common mix-up.",
        "Hidden form fields and URL rewriting work without cookies but expose state to the client and to logs.",
        "Session attributes should be Serializable if sessions are persisted or replicated.",
        "Logout should be a POST (with CSRF protection), not a GET link that any page can trigger.",
      ],
      subjective: [
        qa("What is session tracking? Explain its techniques.", "Because HTTP is stateless, session tracking associates a series of requests with one user. Techniques: 1) Cookies — the server stores an identifier or small data in the browser, which sends it back automatically. 2) Hidden form fields — values carried in <input type=\"hidden\"> across form submissions; works only with forms. 3) URL rewriting — the session ID is appended to every URL; works without cookies but leaks IDs. 4) HttpSession — the servlet API keeps data on the server keyed by a session ID transmitted via a cookie or URL rewriting."),
        qa("Differentiate cookies and sessions.", "Cookies store data on the client, are limited (~4 KB each), are sent with every request, can persist after the browser closes, and can be viewed or modified by the user. Sessions store data on the server, can hold any objects, only the ID travels to the client, end on invalidate or timeout, and are more secure for sensitive data. Sessions usually rely on a cookie to carry their ID."),
      ],
      objective: [
        mcq("request.getSession(false) returns:", ["Always a new session", "The existing session or null", "Throws if none exists", "A temporary session"], 1, "false means do not create."),
        mcq("Which cookie flag prevents JavaScript from reading the cookie?", ["Secure", "HttpOnly", "SameSite", "Path"], 1, "HttpOnly cookies are not exposed to document.cookie."),
        mcq("Which method ends a session immediately?", ["session.close()", "session.invalidate()", "session.remove()", "session.expire()"], 1, "invalidate() unbinds all attributes."),
        mcq("To delete a cookie, set its max age to:", ["-1", "0", "1", "Integer.MAX_VALUE"], 1, "-1 means a browser-session cookie; 0 deletes it."),
        mcq("Default name of the session cookie in servlet containers:", ["SESSIONID", "JSESSIONID", "SID", "PHPSESSID"], 1, "Configurable, but JSESSIONID by default."),
      ],
    },
    {
      id: "filters-listeners", module: "Web tier: Servlets and JSP", title: "Filters and listeners", level: "Intermediate", minutes: 14,
      summary: "Cross-cutting request processing with Filter and FilterChain, and reacting to application, session and request events.",
      description: [
        "A Filter intercepts requests before they reach a servlet and responses on the way back. It implements doFilter(request, response, chain); calling chain.doFilter passes control to the next filter or the target, and not calling it short-circuits the request (for example, to block an unauthenticated user). Filters are mapped with @WebFilter or <filter-mapping>; multiple filters form a chain whose order follows web.xml mappings.",
        "Typical filters: authentication/authorization, logging and timing, character encoding, compression, CORS headers, and security headers. Spring Security is essentially a large chain of servlet filters.",
        "Listeners respond to lifecycle events. ServletContextListener (contextInitialized/contextDestroyed) sets up and tears down application-wide resources such as connection pools or schedulers. HttpSessionListener tracks sessions created and destroyed (active-user counts). ServletRequestListener observes each request. Attribute listeners react to attributes being added, removed or replaced.",
      ],
      usage: [
        "Put authentication checks in one filter instead of repeating them in every servlet.",
        "Measure request latency and add correlation IDs to logs in a filter.",
        "Initialize and close a DataSource in a ServletContextListener.",
        "Count online users with an HttpSessionListener.",
      ],
      files: [
        file("src/main/java/web/filter/AuthFilter.java", code`
package web.filter;

import jakarta.servlet.*;
import jakarta.servlet.annotation.WebFilter;
import jakarta.servlet.http.*;
import java.io.IOException;

@WebFilter(urlPatterns = { "/dashboard", "/admin/*" })
public class AuthFilter implements Filter {
    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain) throws IOException, ServletException {
        HttpServletRequest req = (HttpServletRequest) request;
        HttpServletResponse resp = (HttpServletResponse) response;
        HttpSession session = req.getSession(false);
        boolean loggedIn = session != null && session.getAttribute("user") != null;
        if (!loggedIn) {
            resp.sendRedirect(req.getContextPath() + "/login.jsp");   // chain not called: request stops here
            return;
        }
        chain.doFilter(request, response);                            // continue to the servlet
    }
}`),
        file("src/main/java/web/filter/TimingFilter.java", code`
package web.filter;

import jakarta.servlet.*;
import jakarta.servlet.annotation.WebFilter;
import jakarta.servlet.http.HttpServletRequest;
import java.io.IOException;
import java.util.UUID;

@WebFilter("/*")
public class TimingFilter implements Filter {
    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain) throws IOException, ServletException {
        long start = System.nanoTime();
        String requestId = UUID.randomUUID().toString().substring(0, 8);
        request.setAttribute("requestId", requestId);
        try {
            chain.doFilter(request, response);                         // everything downstream runs here
        } finally {
            long ms = (System.nanoTime() - start) / 1_000_000;
            request.getServletContext().log(requestId + " " + ((HttpServletRequest) request).getRequestURI() + " " + ms + " ms");
        }
    }
}`),
        file("src/main/java/web/listener/AppListener.java", code`
package web.listener;

import jakarta.servlet.*;
import jakarta.servlet.annotation.WebListener;
import jakarta.servlet.http.*;
import java.util.concurrent.atomic.AtomicInteger;

@WebListener
public class AppListener implements ServletContextListener, HttpSessionListener {
    private static final AtomicInteger ONLINE = new AtomicInteger();

    @Override public void contextInitialized(ServletContextEvent e) {
        e.getServletContext().setAttribute("startedAt", java.time.Instant.now());
        e.getServletContext().log("Application started");     // open pools, start schedulers here
    }

    @Override public void contextDestroyed(ServletContextEvent e) {
        e.getServletContext().log("Application stopping");    // close pools, stop schedulers here
    }

    @Override public void sessionCreated(HttpSessionEvent e) { ONLINE.incrementAndGet(); }
    @Override public void sessionDestroyed(HttpSessionEvent e) { ONLINE.decrementAndGet(); }

    public static int online() { return ONLINE.get(); }
}`),
      ],
      tips: [
        "Order of @WebFilter-annotated filters is unspecified; use web.xml <filter-mapping> order when it matters.",
        "Code after chain.doFilter runs on the way back, after the servlet has produced the response.",
        "To modify a response body in a filter, wrap the response with HttpServletResponseWrapper.",
        "Filters can also apply to dispatcher types (REQUEST, FORWARD, INCLUDE, ERROR, ASYNC).",
      ],
      subjective: [
        qa("What is a filter? Explain FilterChain.", "A filter is an object that performs filtering tasks on requests to a resource, on responses from it, or both — authentication, logging, encoding, compression. It implements jakarta.servlet.Filter with init, doFilter and destroy. FilterChain represents the remaining filters and the target resource; calling chain.doFilter(req, res) invokes the next element. A filter can modify the request/response before calling it, act on the response afterwards, or not call it at all to block the request."),
        qa("List the types of listeners in the Servlet API with a use case each.", "ServletContextListener — application startup/shutdown (create a connection pool). ServletContextAttributeListener — application attribute changes. HttpSessionListener — session creation/destruction (count active users). HttpSessionAttributeListener — session attribute changes (audit login). HttpSessionBindingListener / HttpSessionActivationListener — object bound to a session or session migrated. ServletRequestListener — each request start/end (metrics). ServletRequestAttributeListener — request attribute changes."),
      ],
      objective: [
        mcq("Which method passes a request to the next filter or the servlet?", ["chain.next()", "chain.doFilter()", "filter.forward()", "request.proceed()"], 1, "FilterChain.doFilter."),
        mcq("Which listener is notified when the web application starts?", ["HttpSessionListener", "ServletContextListener", "ServletRequestListener", "Filter"], 1, "contextInitialized is called at startup."),
        mcq("A filter that does not call chain.doFilter:", ["Causes a compile error", "Prevents the request from reaching the servlet", "Is skipped", "Forwards automatically"], 1, "It short-circuits the chain."),
        mcq("Annotation to register a listener:", ["@WebServlet", "@WebFilter", "@WebListener", "@Listener"], 2, "@WebListener."),
      ],
    },
    {
      id: "jsp-el-jstl", module: "Web tier: Servlets and JSP", title: "JSP, Expression Language and JSTL", level: "Intermediate", minutes: 18,
      summary: "How JSPs become servlets, scripting elements and directives, implicit objects, EL and JSTL tags, and why scriptlets are discouraged.",
      description: [
        "JavaServer Pages are HTML templates with embedded Java constructs. On first request the container translates a JSP into a servlet source file, compiles it, loads it and then calls jspInit, _jspService (for each request) and jspDestroy. Because of this, a JSP is a servlet.",
        "Scripting elements: scriptlets <% code %>, expressions <%= value %> and declarations <%! fields or methods %>. Directives configure translation: <%@ page import=... contentType=... %>, <%@ include file=... %> (static include at translation time) and <%@ taglib %>. Standard actions include <jsp:include> (dynamic include at request time), <jsp:forward> and <jsp:useBean>.",
        "JSP has nine implicit objects: request, response, out, session, application, config, pageContext, page and exception (only in error pages). Attributes live in four scopes: page, request, session and application.",
        "Modern JSP avoids Java code in pages. Expression Language — written ${expression} — reads attributes and bean properties from all scopes (${user.name}, ${param.q}, ${sessionScope.cart}), handles null gracefully and supports operators (empty, eq, gt, ternary). JSTL (Jakarta Standard Tag Library) provides tags: c:if, c:choose, c:forEach, c:url, c:out (escapes HTML), fmt:formatNumber and fmt:formatDate. Together they implement the view of the MVC pattern.",
      ],
      usage: [
        "Use JSP only as a view: a servlet (or Spring controller) prepares data and forwards to it.",
        "Escape user data with c:out or fn:escapeXml to prevent cross-site scripting.",
        "Put JSPs under WEB-INF so browsers cannot request them directly.",
        "In new projects, Thymeleaf or a front-end framework is more common, but JSP remains in many enterprise systems and syllabi.",
      ],
      files: [
        file("src/main/webapp/WEB-INF/views/products.jsp", code`
<%@ page contentType="text/html;charset=UTF-8" pageEncoding="UTF-8" %>
<%@ taglib prefix="c" uri="jakarta.tags.core" %>
<%@ taglib prefix="fmt" uri="jakarta.tags.fmt" %>
<!DOCTYPE html>
<html>
<head><title>Products</title></head>
<body>
  <%@ include file="header.jspf" %>  <%-- static include: merged at translation time --%>

  <h1>Products for <c:out value="${"$"}{sessionScope.user}" default="guest"/></h1>

  <c:if test="${"$"}{empty products}">
    <p>No products found for "<c:out value="${"$"}{param.q}"/>".</p>
  </c:if>

  <table>
    <c:forEach var="p" items="${"$"}{products}" varStatus="s">
      <tr class="${"$"}{s.index % 2 == 0 ? 'even' : 'odd'}">
        <td>${"$"}{s.count}</td>
        <td><c:out value="${"$"}{p.name}"/></td>              <%-- escaped: safe against XSS --%>
        <td><fmt:formatNumber value="${"$"}{p.price}" type="currency" currencyCode="INR"/></td>
        <td>
          <c:choose>
            <c:when test="${"$"}{p.stock == 0}">Out of stock</c:when>
            <c:when test="${"$"}{p.stock lt 5}">Only ${"$"}{p.stock} left</c:when>
            <c:otherwise>In stock</c:otherwise>
          </c:choose>
        </td>
      </tr>
    </c:forEach>
  </table>

  <a href="<c:url value='/cart'/>">View cart</a>
  <jsp:include page="footer.jsp"/>   <%-- dynamic include: executed per request --%>
</body>
</html>`),
        file("src/main/webapp/legacy-scriptlets.jsp", code`
<%-- Scripting elements: shown for exams; avoid in real code --%>
<%@ page import="java.time.LocalDate" %>
<%! private int visits = 0; %>                  <%-- declaration: a field of the generated servlet (shared!) --%>
<% visits++; String today = LocalDate.now().toString(); %>   <%-- scriptlet: runs in _jspService --%>
<p>Date: <%= today %></p>                        <%-- expression: printed with out.print --%>
<p>Visits: <%= visits %></p>
<p>Session id: <%= session.getId() %></p>        <%-- 'session' is an implicit object --%>`),
        file("src/main/java/web/ProductServlet.java", code`
package web;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.*;
import java.io.IOException;
import java.util.List;

@WebServlet("/products")
public class ProductServlet extends HttpServlet {
    public record Product(String name, double price, int stock) {
        public String getName() { return name; }      // EL reads JavaBean-style getters
        public double getPrice() { return price; }
        public int getStock() { return stock; }
    }

    @Override protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        String q = req.getParameter("q");
        List<Product> all = List.of(new Product("Notebook", 120, 40), new Product("Pen <b>", 15, 3), new Product("Bag", 899, 0));
        req.setAttribute("products", q == null ? all : all.stream().filter(p -> p.name().toLowerCase().contains(q.toLowerCase())).toList());
        req.getRequestDispatcher("/WEB-INF/views/products.jsp").forward(req, resp);
    }
}`),
      ],
      tips: [
        "Static include (<%@ include %>) copies the file at translation time; <jsp:include> calls it at request time.",
        "EL searches scopes in order page → request → session → application when no scope prefix is given.",
        "isELIgnored and isErrorPage are page directive attributes frequently asked in exams.",
        "Declarations create servlet fields shared by all users — another reason to avoid scriptlets.",
      ],
      subjective: [
        qa("Explain the JSP life cycle.", "1. Translation: the JSP is converted into a servlet Java file. 2. Compilation: the generated file is compiled into a class. 3. Loading and instantiation of the class. 4. Initialization: jspInit() is called once. 5. Request processing: _jspService(request, response) is called for each request, on multiple threads. 6. Destruction: jspDestroy() is called when the JSP is taken out of service. Translation and compilation happen on the first request or when the JSP file changes (or ahead of time with precompilation)."),
        qa("List the JSP implicit objects with their types.", "request (HttpServletRequest), response (HttpServletResponse), out (JspWriter), session (HttpSession), application (ServletContext), config (ServletConfig), pageContext (PageContext), page (Object, the servlet instance — this) and exception (Throwable, only in pages with isErrorPage=\"true\")."),
        qa("Differentiate the include directive and the include action.", "The include directive <%@ include file=\"x.jsp\" %> inserts the file's source into the JSP during translation, producing one servlet; changes to the included file may require retranslation; good for static fragments like headers. The include action <jsp:include page=\"x.jsp\"/> calls the other resource at request time and inserts its output; it can pass parameters with <jsp:param> and picks up changes immediately; good for dynamic content."),
      ],
      objective: [
        mcq("A JSP is ultimately translated into a:", ["Applet", "Servlet", "Filter", "EJB"], 1, "The container generates and compiles a servlet."),
        mcq("Which implicit object is available only on error pages?", ["page", "exception", "config", "pageContext"], 1, "Requires isErrorPage=\"true\"."),
        mcq("Which JSTL tag iterates over a collection?", ["c:if", "c:forEach", "c:loop", "c:iterate"], 1, "c:forEach with items and var."),
        mcq("Which element is used to declare a method in a JSP?", ["<% %>", "<%= %>", "<%! %>", "<%@ %>"], 2, "Declarations add members to the generated servlet class."),
        mcq("Which tag escapes HTML special characters by default?", ["c:out", "c:set", "c:url", "c:import"], 0, "c:out has escapeXml=true by default."),
      ],
    },
    {
      id: "mvc-pattern", module: "Web tier: Servlets and JSP", title: "MVC with Servlets and JSP (Model 2)", level: "Intermediate", minutes: 15,
      summary: "Separating model, view and controller in a classic Java web app — the architecture Spring MVC later standardized.",
      description: [
        "Model–View–Controller divides an application into three roles. The Model holds data and business rules (entities, services, DAOs). The View renders the model (JSP). The Controller receives input, calls the model, chooses a view and passes data to it (servlet). In Java web history, “Model 1” let JSPs handle requests directly; “Model 2” is MVC with a servlet as the controller.",
        "A typical request flow: the browser calls /students; the StudentController servlet validates the input, calls StudentService which uses StudentDao, stores the result as a request attribute, and forwards to /WEB-INF/views/students.jsp, which renders it with EL and JSTL. A front controller variant uses one servlet to dispatch all requests to command handlers — exactly what Spring's DispatcherServlet does.",
        "Benefits: separation of concerns, independent development and testing of each layer, reusable business logic across views (HTML, JSON), and easier maintenance.",
      ],
      usage: [
        "Keep SQL in DAOs, rules in services, HTTP handling in controllers and HTML in views.",
        "Never let a JSP talk to the database directly.",
        "Write unit tests for services without any servlet container.",
        "Use the same service from an HTML controller and a JSON API servlet.",
      ],
      files: [
        file("src/main/java/mvc/model/Student.java", code`
package mvc.model;

public record Student(long id, String name, String branch, double cgpa) {
    public String getName() { return name; }
    public String getBranch() { return branch; }
    public double getCgpa() { return cgpa; }
}`),
        file("src/main/java/mvc/model/StudentService.java", code`
package mvc.model;

import java.util.Comparator;
import java.util.List;

public class StudentService {
    private final List<Student> students = List.of(
        new Student(1, "Asha", "CSE", 9.1), new Student(2, "Ravi", "ECE", 7.8), new Student(3, "Meera", "CSE", 8.6));

    public List<Student> byBranch(String branch) {
        return students.stream()
            .filter(s -> branch == null || branch.isBlank() || s.branch().equalsIgnoreCase(branch))
            .sorted(Comparator.comparingDouble(Student::cgpa).reversed())
            .toList();
    }
}`),
        file("src/main/java/mvc/controller/StudentController.java", code`
package mvc.controller;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.*;
import mvc.model.StudentService;
import java.io.IOException;

@WebServlet("/students")
public class StudentController extends HttpServlet {
    private final StudentService service = new StudentService();   // stateless: safe to share

    @Override protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        String branch = req.getParameter("branch");                  // 1. read input
        req.setAttribute("students", service.byBranch(branch));      // 2. call the model
        req.setAttribute("branch", branch);
        req.getRequestDispatcher("/WEB-INF/views/students.jsp").forward(req, resp);   // 3. choose the view
    }
}`),
        file("src/main/webapp/WEB-INF/views/students.jsp", code`
<%@ page contentType="text/html;charset=UTF-8" %>
<%@ taglib prefix="c" uri="jakarta.tags.core" %>
<h1>Students <c:if test="${"$"}{not empty branch}">in <c:out value="${"$"}{branch}"/></c:if></h1>
<form method="get"><input name="branch" placeholder="Branch"><button>Filter</button></form>
<ol>
  <c:forEach var="s" items="${"$"}{students}">
    <li><c:out value="${"$"}{s.name}"/> — ${"$"}{s.branch} — CGPA ${"$"}{s.cgpa}</li>
  </c:forEach>
</ol>`),
      ],
      tips: [
        "Exam diagram: Browser → Controller (Servlet) → Model (Service/DAO/DB) → Controller → View (JSP) → Browser.",
        "Model 1 = JSP-centric; Model 2 = servlet controller + JSP view.",
        "The front controller pattern centralizes security, logging and routing in one entry point.",
        "Spring MVC maps the same roles: @Controller, model attributes and view templates.",
      ],
      subjective: [
        qa("Explain MVC architecture with respect to Servlets and JSP.", "In Model 2 MVC, the Controller is a servlet that receives every request, reads and validates parameters, invokes the Model, puts the results into request (or session) attributes, and forwards to a View. The Model consists of JavaBeans/entities plus service and DAO classes containing business rules and database access. The View is a JSP that only renders the attributes using EL and JSTL. This separates presentation from logic, allows parallel development, improves testability and lets multiple views share one model."),
        qa("Differentiate Model 1 and Model 2 architectures.", "Model 1: the browser requests JSPs directly; each JSP handles input, business logic (often via beans) and presentation, leading to scattered control logic and scriptlet-heavy pages; suitable only for small apps. Model 2: a servlet controller handles requests and navigation, the model encapsulates logic, and JSPs only display data; centralised control, cleaner code, better maintainability — the basis of frameworks like Struts and Spring MVC."),
      ],
      objective: [
        mcq("In Servlet/JSP MVC, the controller is usually a:", ["JSP", "Servlet", "JavaBean", "Database table"], 1, "The servlet coordinates the request."),
        mcq("Which layer should contain SQL queries?", ["View", "Controller", "Model (DAO)", "web.xml"], 2, "DAOs in the model layer encapsulate persistence."),
        mcq("Spring's DispatcherServlet is an example of which pattern?", ["Singleton", "Front Controller", "Observer", "Adapter"], 1, "One servlet dispatches all requests."),
        mcq("Why are views placed under WEB-INF?", ["To compile faster", "So they cannot be requested directly by the browser", "Because EL requires it", "To enable caching"], 1, "Only server-side forwards can reach them."),
      ],
    },
    {
      id: "jpa-hibernate-basics", module: "Persistence with JPA and Hibernate", title: "ORM, JPA and Hibernate fundamentals", level: "Advanced", minutes: 22,
      summary: "Mapping classes to tables, EntityManager operations, persistence context, entity states and dirty checking.",
      description: [
        "Object–Relational Mapping bridges the mismatch between objects (inheritance, references, collections) and relational tables (rows, foreign keys). JPA (Jakarta Persistence API) is the standard specification; Hibernate is its most popular implementation (EclipseLink is another). Hibernate also has its own native API (Session, SessionFactory) and features beyond JPA.",
        "An entity is a class annotated with @Entity, with an @Id primary key (often @GeneratedValue), mapped to a table (@Table) and columns (@Column). The EntityManager (Hibernate Session) is the main API: persist (insert), find (select by id), merge (copy detached state into a managed entity), remove (delete), createQuery (JPQL). An EntityManagerFactory (SessionFactory) is expensive and created once per application; EntityManagers are cheap and short-lived (one per request or transaction).",
        "Each EntityManager has a persistence context — a first-level cache that guarantees one object per row identity. Entity states: transient/new (not associated), managed/persistent (tracked by the context), detached (context closed or cleared) and removed. Managed entities are dirty-checked: changes to their fields are automatically written as UPDATE statements at flush/commit, without calling any save method.",
        "Configuration lives in persistence.xml (or Spring Boot properties): the JDBC URL, credentials, dialect and hbm2ddl.auto / jakarta.persistence.schema-generation (create, update, validate, none — use validate or a migration tool such as Flyway in production).",
      ],
      usage: [
        "Use JPA for CRUD-heavy domain models where productivity matters more than hand-tuned SQL.",
        "Wrap each unit of work in a transaction; JPA writes are not executed outside one.",
        "Let dirty checking update managed entities instead of calling merge on them.",
        "Use database migrations (Flyway/Liquibase) for schema changes instead of hbm2ddl update.",
      ],
      files: [
        file("src/main/java/lib/Book.java", code`
package lib;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "books", uniqueConstraints = @UniqueConstraint(columnNames = "isbn"))
public class Book {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(nullable = false, length = 13)
    private String isbn;

    private BigDecimal price;
    private LocalDate publishedOn;

    @Version private int version;          // optimistic locking: detects concurrent updates

    protected Book() { }                   // JPA requires a no-arg constructor
    public Book(String title, String isbn, BigDecimal price) { this.title = title; this.isbn = isbn; this.price = price; }

    public Long getId() { return id; }
    public String getTitle() { return title; }
    public void setPrice(BigDecimal price) { this.price = price; }
    public BigDecimal getPrice() { return price; }
    @Override public String toString() { return "Book[" + id + ", " + title + ", " + price + "]"; }
}`),
        file("src/main/java/lib/Main.java", code`
package lib;

import jakarta.persistence.*;
import java.math.BigDecimal;

public class Main {
    public static void main(String[] args) {
        EntityManagerFactory emf = Persistence.createEntityManagerFactory("library");   // once per app

        EntityManager em = emf.createEntityManager();
        em.getTransaction().begin();
        Book book = new Book("Clean Code", "9780132350884", new BigDecimal("599"));     // transient
        em.persist(book);                                                               // managed
        em.getTransaction().commit();                                                   // INSERT executed
        em.close();                                                                     // book is now detached

        EntityManager em2 = emf.createEntityManager();
        em2.getTransaction().begin();
        Book managed = em2.find(Book.class, book.getId());                              // SELECT
        managed.setPrice(new BigDecimal("549"));                                        // no save call needed
        Book same = em2.find(Book.class, book.getId());                                 // first-level cache: no SQL
        System.out.println(managed == same);                                            // true
        em2.getTransaction().commit();                                                  // dirty check -> UPDATE

        book.setPrice(new BigDecimal("499"));                                           // detached: not tracked
        em2.getTransaction().begin();
        Book merged = em2.merge(book);                                                  // copy state onto a managed copy
        em2.remove(merged);                                                             // DELETE at commit
        em2.getTransaction().commit();
        em2.close();
        emf.close();
    }
}`),
        file("src/main/resources/META-INF/persistence.xml", code`
<persistence xmlns="https://jakarta.ee/xml/ns/persistence" version="3.0">
  <persistence-unit name="library" transaction-type="RESOURCE_LOCAL">
    <class>lib.Book</class>
    <properties>
      <property name="jakarta.persistence.jdbc.url" value="jdbc:postgresql://localhost:5432/library"/>
      <property name="jakarta.persistence.jdbc.user" value="app"/>
      <property name="jakarta.persistence.jdbc.password" value="change-me"/>
      <!-- create | drop-and-create | none; use migrations in production -->
      <property name="jakarta.persistence.schema-generation.database.action" value="create"/>
      <property name="hibernate.show_sql" value="true"/>
      <property name="hibernate.format_sql" value="true"/>
    </properties>
  </persistence-unit>
</persistence>`),
      ],
      tips: [
        "persist on an entity that already has an id (detached) throws an exception; merge returns a new managed instance — use the returned object.",
        "Entities need a non-final class, a no-arg constructor (protected is fine) and an identifier.",
        "Implement equals/hashCode on entities carefully (business key or id with null handling), never on all fields with lazy collections.",
        "flush() sends pending SQL without committing; commit() flushes and commits.",
      ],
      subjective: [
        qa("What is ORM? What problems does Hibernate solve over JDBC?", "ORM maps classes to tables and objects to rows so developers work with objects instead of SQL and ResultSets. Over JDBC, Hibernate removes boilerplate (connections, statements, mapping columns manually), generates database-specific SQL via dialects (portability), tracks changes automatically (dirty checking), manages associations and inheritance, offers caching (first- and second-level), lazy loading, optimistic locking with @Version, and an object query language (JPQL/HQL)."),
        qa("Explain the entity life cycle states in JPA.", "New/Transient: created with new, not associated with any persistence context, no database row. Managed/Persistent: associated with a persistence context (after persist, find, or merge's result); changes are tracked and synchronized at flush. Detached: was managed but the context was closed, cleared or the entity evicted; changes are not tracked until merged. Removed: scheduled for deletion by remove(); deleted from the database at flush/commit."),
        qa("Differentiate persist() and merge().", "persist(entity) makes a new (transient) instance managed and schedules an INSERT; the same instance becomes managed; it throws for detached entities. merge(entity) copies the state of a detached (or new) entity onto a managed instance — loading it if necessary — and returns that managed instance; the argument itself stays detached. Hibernate's save/update/saveOrUpdate are older native equivalents."),
      ],
      objective: [
        mcq("JPA is a:", ["Database", "Specification", "Hibernate subclass", "JDBC driver"], 1, "Hibernate and EclipseLink implement it."),
        mcq("Which annotation marks the primary key?", ["@Key", "@Id", "@Primary", "@Column(pk=true)"], 1, "Combine with @GeneratedValue for generated keys."),
        mcq("Changing a field of a managed entity inside a transaction:", ["Does nothing until save()", "Is written at flush/commit by dirty checking", "Throws an exception", "Creates a new row"], 1, "The persistence context tracks managed entities."),
        mcq("The first-level cache in Hibernate is associated with:", ["SessionFactory", "Session / EntityManager", "The database", "Each entity class"], 1, "It lives as long as the persistence context."),
        mcq("Which @Version is used for?", ["Schema versioning", "Optimistic locking", "API versioning", "Audit logs"], 1, "Concurrent updates with stale versions fail with OptimisticLockException."),
      ],
    },
    {
      id: "jpa-relationships-queries", module: "Persistence with JPA and Hibernate", title: "Relationships, fetching, the N+1 problem and JPQL", level: "Advanced", minutes: 22,
      summary: "@OneToMany/@ManyToOne/@ManyToMany, owning side, cascade and orphan removal, LAZY vs EAGER, JOIN FETCH and Criteria API.",
      description: [
        "Associations map foreign keys to object references. @ManyToOne (many orders → one customer) places a foreign key column on the many side and is the owning side. @OneToMany(mappedBy = \"customer\") is the inverse side: mappedBy names the field that owns the relationship, and only changes on the owning side are written. @OneToOne and @ManyToMany (with a join table) complete the set. Keep both sides in sync with helper methods (addOrder sets order.customer).",
        "cascade propagates operations (PERSIST, MERGE, REMOVE, ALL) from parent to children; orphanRemoval = true deletes a child removed from the collection. Use cascades for true parent–child aggregates (order → order lines), not for shared references (order → product).",
        "Fetch type decides when associations load. Defaults: @ManyToOne and @OneToOne are EAGER, collections are LAZY. Prefer LAZY everywhere and fetch what a use case needs explicitly. Accessing a lazy association after the persistence context is closed throws LazyInitializationException.",
        "The N+1 select problem: loading N parents with one query and then touching each parent's lazy association triggers N more queries. Fix it with JOIN FETCH in JPQL, an @EntityGraph, or batch fetching (hibernate.default_batch_fetch_size). JPQL queries entities and fields, not tables and columns (SELECT o FROM Order o WHERE o.customer.city = :city). The Criteria API builds type-safe dynamic queries in code, and native queries run raw SQL when needed.",
      ],
      usage: [
        "Map relationships LAZY and load related data with JOIN FETCH in the specific query that needs it.",
        "Use named parameters (:city) in JPQL — never concatenate input.",
        "Use DTO projections (SELECT new com.app.OrderSummary(...)) for read-only lists and reports.",
        "Enable SQL logging in development to spot N+1 queries early.",
      ],
      files: [
        file("src/main/java/shop/Customer.java", code`
package shop;

import jakarta.persistence.*;
import java.util.ArrayList;
import java.util.List;

@Entity
public class Customer {
    @Id @GeneratedValue private Long id;
    private String name;
    private String city;

    // Inverse side: 'customer' in PurchaseOrder owns the foreign key
    @OneToMany(mappedBy = "customer", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<PurchaseOrder> orders = new ArrayList<>();

    protected Customer() { }
    public Customer(String name, String city) { this.name = name; this.city = city; }

    public void addOrder(PurchaseOrder order) {        // keep both sides in sync
        orders.add(order);
        order.setCustomer(this);
    }

    public String getName() { return name; }
    public List<PurchaseOrder> getOrders() { return orders; }
}`),
        file("src/main/java/shop/PurchaseOrder.java", code`
package shop;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "purchase_order")
public class PurchaseOrder {
    @Id @GeneratedValue private Long id;
    private BigDecimal total;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)   // owning side: customer_id column
    @JoinColumn(name = "customer_id")
    private Customer customer;

    @ManyToMany
    @JoinTable(name = "order_product",
        joinColumns = @JoinColumn(name = "order_id"),
        inverseJoinColumns = @JoinColumn(name = "product_id"))
    private Set<Product> products = new HashSet<>();

    protected PurchaseOrder() { }
    public PurchaseOrder(BigDecimal total) { this.total = total; }
    void setCustomer(Customer c) { this.customer = c; }
    public BigDecimal getTotal() { return total; }
    public Customer getCustomer() { return customer; }
}

@Entity
class Product {
    @Id @GeneratedValue Long id;
    String name;
}`),
        file("src/main/java/shop/OrderQueries.java", code`
package shop;

import jakarta.persistence.EntityManager;
import jakarta.persistence.criteria.*;
import java.math.BigDecimal;
import java.util.List;

public class OrderQueries {
    public record CitySales(String city, Long orders, BigDecimal revenue) { }
    private final EntityManager em;
    public OrderQueries(EntityManager em) { this.em = em; }

    // N+1: one query for customers, then one per customer when getOrders() is touched
    public void slow() {
        for (Customer c : em.createQuery("SELECT c FROM Customer c", Customer.class).getResultList())
            System.out.println(c.getName() + " " + c.getOrders().size());
    }

    // Fixed: a single SQL query with a join; DISTINCT removes duplicate parents
    public List<Customer> withOrders(String city) {
        return em.createQuery("SELECT DISTINCT c FROM Customer c LEFT JOIN FETCH c.orders WHERE c.city = :city", Customer.class)
                 .setParameter("city", city)
                 .getResultList();
    }

    // DTO projection for a report
    public List<CitySales> salesByCity() {
        return em.createQuery("""
            SELECT new shop.OrderQueries$CitySales(c.city, COUNT(o), SUM(o.total))
            FROM PurchaseOrder o JOIN o.customer c
            GROUP BY c.city ORDER BY SUM(o.total) DESC""", CitySales.class).getResultList();
    }

    // Criteria API: dynamic filters without string building
    public List<PurchaseOrder> search(String city, BigDecimal minTotal) {
        CriteriaBuilder cb = em.getCriteriaBuilder();
        CriteriaQuery<PurchaseOrder> q = cb.createQuery(PurchaseOrder.class);
        Root<PurchaseOrder> o = q.from(PurchaseOrder.class);
        Join<PurchaseOrder, Customer> c = o.join("customer");
        List<Predicate> where = new java.util.ArrayList<>();
        if (city != null) where.add(cb.equal(c.get("city"), city));
        if (minTotal != null) where.add(cb.ge(o.get("total"), minTotal));
        q.select(o).where(where.toArray(Predicate[]::new));
        return em.createQuery(q).setMaxResults(50).getResultList();
    }
}`),
      ],
      tips: [
        "mappedBy goes on the side that does NOT own the foreign key.",
        "Use Set rather than List for @ManyToMany to avoid Hibernate deleting and reinserting all join rows.",
        "Never use CascadeType.REMOVE on @ManyToOne or @ManyToMany — deleting an order would delete the shared customer or product.",
        "JOIN FETCH with pagination on a collection makes Hibernate paginate in memory; page parent IDs first, then fetch.",
      ],
      subjective: [
        qa("What is the N+1 select problem and how do you solve it?", "It occurs when one query loads N entities and then accessing a lazy association on each issues one additional query per entity — N+1 queries in total, causing heavy latency. Solutions: JOIN FETCH in JPQL (SELECT c FROM Customer c JOIN FETCH c.orders), @EntityGraph on the query, batch fetching (@BatchSize or hibernate.default_batch_fetch_size) which loads associations in IN-clause batches, or DTO projections that select exactly the needed columns."),
        qa("Differentiate LAZY and EAGER fetching.", "EAGER loads the association immediately with the owning entity, via a join or a secondary select, whether or not it is used. LAZY loads it on first access through a proxy or a collection wrapper, which requires an open persistence context. Defaults: *ToOne are EAGER, *ToMany are LAZY. Best practice is LAZY everywhere and explicit fetching per use case, because EAGER cannot be turned off per query and often causes unnecessary joins or N+1 selects."),
        qa("What is the owning side of a relationship?", "The owning side is the entity whose table holds the foreign key (or which defines the join table) and whose changes JPA uses to update the relationship. In a bidirectional @OneToMany/@ManyToOne, the @ManyToOne side owns it; the @OneToMany side uses mappedBy and is ignored for writes. If you only update the inverse collection, no foreign key change is saved."),
      ],
      objective: [
        mcq("Default fetch type of @OneToMany:", ["EAGER", "LAZY", "JOIN", "BATCH"], 1, "Collections are lazy by default."),
        mcq("mappedBy is placed on:", ["The owning side", "The inverse (non-owning) side", "Both sides", "The join table"], 1, "It references the owning field."),
        mcq("Which exception occurs when accessing a lazy association after the session is closed?", ["NullPointerException", "LazyInitializationException", "TransactionRequiredException", "NonUniqueResultException"], 1, "The proxy cannot load without an open context."),
        mcq("JPQL queries operate on:", ["Tables and columns", "Entities and their fields", "XML mappings", "Stored procedures"], 1, "Hibernate translates JPQL to SQL."),
        mcq("Which removes a child row when it is removed from the parent's collection?", ["cascade = PERSIST", "orphanRemoval = true", "fetch = LAZY", "optional = false"], 1, "Orphan removal deletes de-referenced children."),
      ],
    },
    {
      id: "concurrency-executors", module: "Concurrency, reflection and networking", title: "java.util.concurrent: executors, futures, locks and concurrent collections", level: "Advanced", minutes: 24,
      summary: "Thread pools, Callable/Future, CompletableFuture pipelines, ReentrantLock, BlockingQueue, ConcurrentHashMap, latches and virtual threads.",
      description: [
        "Creating a thread per task does not scale. An ExecutorService manages a pool of worker threads and a task queue: submit Runnable or Callable tasks and receive a Future. Executors.newFixedThreadPool, newCachedThreadPool, newSingleThreadExecutor and newScheduledThreadPool create common configurations; ThreadPoolExecutor exposes core/max size, queue and rejection policy. Shut pools down with shutdown() and awaitTermination. Java 21's Executors.newVirtualThreadPerTaskExecutor() creates a cheap virtual thread per task, ideal for blocking I/O.",
        "A Callable returns a value and may throw checked exceptions. Future.get() blocks until the result is ready (with an optional timeout). CompletableFuture adds non-blocking composition: supplyAsync, thenApply (transform), thenCompose (chain another async call), thenCombine (join two), allOf/anyOf, exceptionally/handle (recover) and orTimeout.",
        "Explicit locks in java.util.concurrent.locks give more control than synchronized: ReentrantLock with tryLock(timeout), lockInterruptibly, fairness and Condition objects; ReadWriteLock allows many readers or one writer; StampedLock offers optimistic reads. Always unlock in finally.",
        "Concurrent collections: ConcurrentHashMap (fine-grained, lock-free reads, atomic compute/merge), CopyOnWriteArrayList (read-mostly lists), BlockingQueue implementations (ArrayBlockingQueue, LinkedBlockingQueue) for producer–consumer, and ConcurrentLinkedQueue. Synchronizers coordinate threads: CountDownLatch (wait for N events), CyclicBarrier (N threads meet repeatedly), Semaphore (limit concurrent access to N permits) and Phaser.",
      ],
      usage: [
        "Run independent remote calls in parallel with CompletableFuture and combine the results.",
        "Bound concurrency to a downstream service with a Semaphore or a fixed-size pool.",
        "Use BlockingQueue for producer–consumer pipelines instead of wait/notify.",
        "Use virtual threads (Java 21) for many blocking I/O tasks; keep platform-thread pools for CPU-bound work.",
      ],
      files: [
        file("src/main/java/conc/PriceAggregator.java", code`
package conc;

import java.util.List;
import java.util.concurrent.*;

public class PriceAggregator {
    record Quote(String shop, double price) { }

    static Quote fetch(String shop, long delayMs, double price) {
        try { Thread.sleep(delayMs); } catch (InterruptedException e) { Thread.currentThread().interrupt(); }
        if (shop.equals("SlowMart")) throw new IllegalStateException("SlowMart is down");
        return new Quote(shop, price);
    }

    public static void main(String[] args) throws Exception {
        try (ExecutorService pool = Executors.newFixedThreadPool(4)) {          // Java 19+: AutoCloseable
            // Callable + Future
            Future<Integer> answer = pool.submit(() -> 6 * 7);
            System.out.println("future: " + answer.get(1, TimeUnit.SECONDS));

            // CompletableFuture: three calls in parallel, total time ~ the slowest one
            List<CompletableFuture<Quote>> quotes = List.of(
                CompletableFuture.supplyAsync(() -> fetch("Amazin", 300, 499), pool),
                CompletableFuture.supplyAsync(() -> fetch("Flipkart", 200, 479), pool),
                CompletableFuture.supplyAsync(() -> fetch("SlowMart", 100, 450), pool)
                    .exceptionally(ex -> new Quote("SlowMart (unavailable)", Double.MAX_VALUE)));   // recover

            CompletableFuture.allOf(quotes.toArray(CompletableFuture[]::new)).join();
            Quote best = quotes.stream().map(CompletableFuture::join)
                .min(java.util.Comparator.comparingDouble(Quote::price)).orElseThrow();
            System.out.println("best: " + best);

            CompletableFuture<String> chained = CompletableFuture
                .supplyAsync(() -> "order-42", pool)
                .thenCompose(id -> CompletableFuture.supplyAsync(() -> id + ":paid", pool))  // async step after async step
                .thenApply(String::toUpperCase)
                .orTimeout(2, TimeUnit.SECONDS);
            System.out.println(chained.join());
        }
    }
}`),
        file("src/main/java/conc/Coordination.java", code`
package conc;

import java.util.concurrent.*;
import java.util.concurrent.atomic.LongAdder;
import java.util.concurrent.locks.ReentrantLock;

public class Coordination {
    private final ReentrantLock lock = new ReentrantLock();
    private double balance = 1000;

    boolean withdraw(double amount) throws InterruptedException {
        if (!lock.tryLock(100, TimeUnit.MILLISECONDS)) return false;   // give up instead of deadlocking
        try {
            if (balance < amount) return false;
            balance -= amount;
            return true;
        } finally {
            lock.unlock();                                              // always in finally
        }
    }

    public static void main(String[] args) throws Exception {
        ConcurrentHashMap<String, LongAdder> hits = new ConcurrentHashMap<>();
        Semaphore apiLimit = new Semaphore(2);                          // at most 2 concurrent calls
        CountDownLatch done = new CountDownLatch(6);

        try (ExecutorService pool = Executors.newVirtualThreadPerTaskExecutor()) {   // Java 21
            for (int i = 0; i < 6; i++) {
                String page = i % 2 == 0 ? "/home" : "/cart";
                pool.submit(() -> {
                    try {
                        apiLimit.acquire();
                        try {
                            hits.computeIfAbsent(page, k -> new LongAdder()).increment();   // atomic per key
                            Thread.sleep(50);
                        } finally { apiLimit.release(); }
                    } catch (InterruptedException e) { Thread.currentThread().interrupt(); }
                    finally { done.countDown(); }
                });
            }
            done.await();                                                // wait for all 6 tasks
        }
        System.out.println(hits);

        BlockingQueue<String> queue = new ArrayBlockingQueue<>(2);
        Thread producer = Thread.ofVirtual().start(() -> {
            try { for (String s : new String[]{"a", "b", "c", "STOP"}) queue.put(s); }   // blocks when full
            catch (InterruptedException e) { Thread.currentThread().interrupt(); }
        });
        String item;
        while (!(item = queue.take()).equals("STOP")) System.out.println("took " + item); // blocks when empty
        producer.join();
        System.out.println(new Coordination().withdraw(300));
    }
}`),
      ],
      tips: [
        "Unbounded queues (newFixedThreadPool's LinkedBlockingQueue) can hide overload until memory runs out; prefer bounded queues with a rejection policy for servers.",
        "Future.get() without a timeout can block forever; CompletableFuture.join() throws unchecked CompletionException.",
        "Without an executor argument, supplyAsync uses the common ForkJoinPool — do not run blocking I/O there.",
        "Do not pool virtual threads; create one per task and limit concurrency with a Semaphore.",
      ],
      subjective: [
        qa("Why use an ExecutorService instead of creating threads manually?", "Thread creation is expensive and unbounded thread creation can exhaust memory and CPU. An executor reuses a bounded set of threads, queues excess tasks, separates task submission from execution policy, returns Futures for results and exceptions, supports scheduling, and offers orderly shutdown. Changing concurrency strategy (fixed, cached, virtual threads) becomes a one-line change."),
        qa("Differentiate Runnable and Callable.", "Runnable.run() returns void and cannot throw checked exceptions; it can be passed to Thread or an executor. Callable<V>.call() returns a value of type V and can throw checked exceptions; it is submitted to an ExecutorService, which returns a Future<V> whose get() yields the result or throws ExecutionException wrapping the failure."),
        qa("Compare synchronized and ReentrantLock.", "Both provide mutual exclusion, reentrancy and memory visibility. synchronized is built into the language, releases automatically at block exit, and is simpler. ReentrantLock is a class requiring explicit unlock in finally, but adds tryLock (with timeout), interruptible locking, optional fairness, multiple Condition objects, and lock state inspection. Use synchronized by default and ReentrantLock when you need those features."),
        qa("How does ConcurrentHashMap achieve thread safety and why is it better than Hashtable?", "Hashtable synchronizes every method on one lock, so only one thread can use it at a time. ConcurrentHashMap (Java 8+) uses lock-free reads with volatile fields and CAS for inserting into empty bins, and locks only the head node of a single bin for updates, so many threads can read and write different bins concurrently. It also offers atomic compound operations (putIfAbsent, compute, merge) and weakly consistent iterators that never throw ConcurrentModificationException. It disallows null keys and values."),
      ],
      objective: [
        mcq("Which method returns a value from a task?", ["Runnable.run", "Callable.call", "Thread.start", "Executor.execute"], 1, "Callable<V> returns V."),
        mcq("Which synchronizer lets one thread wait until N events have occurred?", ["Semaphore", "CountDownLatch", "Exchanger", "ReentrantLock"], 1, "countDown() N times releases await()."),
        mcq("Which collection is best for a producer–consumer queue with blocking?", ["ArrayList", "ArrayBlockingQueue", "HashSet", "TreeMap"], 1, "put blocks when full and take blocks when empty."),
        mcq("CompletableFuture method used to chain a dependent asynchronous call returning another CompletableFuture:", ["thenApply", "thenCompose", "thenAccept", "join"], 1, "thenCompose flattens the nested future."),
        mcq("A Semaphore with 3 permits allows:", ["3 total calls ever", "At most 3 threads in the guarded section at once", "Only 3 threads in the JVM", "3 retries"], 1, "acquire/release manage the permits."),
      ],
    },
    {
      id: "reflection-annotations", module: "Concurrency, reflection and networking", title: "Reflection and custom annotations", level: "Advanced", minutes: 16,
      summary: "Inspecting and invoking classes at run time, writing annotations with retention and targets, and how frameworks use both.",
      description: [
        "Reflection (java.lang.reflect) lets a program examine and manipulate classes at run time: obtain a Class object (Foo.class, obj.getClass(), Class.forName(\"com.x.Foo\")), list its fields, methods and constructors, read annotations, create instances (getDeclaredConstructor().newInstance()), call methods (Method.invoke) and read or write fields — including private ones after setAccessible(true), subject to module encapsulation.",
        "Frameworks are built on reflection: Spring scans for @Component classes and injects dependencies, JPA maps @Entity fields, JUnit finds @Test methods, Jackson serializes getters. The trade-offs are lost compile-time safety, slower calls (though the JIT and MethodHandles reduce this) and broken encapsulation.",
        "An annotation is metadata declared with @interface. Meta-annotations configure it: @Retention (SOURCE — discarded by the compiler, CLASS — kept in bytecode but not at run time, RUNTIME — readable by reflection), @Target (TYPE, METHOD, FIELD, PARAMETER…), @Inherited and @Documented. Elements look like methods and may have defaults; a single element named value can be set without its name. Built-in annotations include @Override, @Deprecated, @SuppressWarnings and @FunctionalInterface.",
      ],
      usage: [
        "Build plug-in systems that load classes by name from configuration.",
        "Write validation, auditing or test frameworks driven by your own annotations.",
        "Use annotation processors (compile time) for code generation, as Lombok and MapStruct do.",
        "Avoid reflection in hot business code; prefer interfaces and lambdas.",
      ],
      files: [
        file("src/main/java/meta/Range.java", code`
package meta;

import java.lang.annotation.*;

@Retention(RetentionPolicy.RUNTIME)     // must survive to run time for reflection to see it
@Target(ElementType.FIELD)
@Documented
public @interface Range {
    int min() default 0;
    int max() default Integer.MAX_VALUE;
    String message() default "out of range";
}`),
        file("src/main/java/meta/NotBlank.java", code`
package meta;

import java.lang.annotation.*;

@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.FIELD)
public @interface NotBlank { }`),
        file("src/main/java/meta/Validator.java", code`
package meta;

import java.lang.reflect.Field;
import java.util.ArrayList;
import java.util.List;

// A tiny reflection-driven validator, in the spirit of Jakarta Bean Validation
public final class Validator {
    public static List<String> validate(Object target) throws IllegalAccessException {
        List<String> errors = new ArrayList<>();
        for (Field field : target.getClass().getDeclaredFields()) {
            field.setAccessible(true);                                  // read private fields
            Object value = field.get(target);
            if (field.isAnnotationPresent(NotBlank.class) && (value == null || value.toString().isBlank()))
                errors.add(field.getName() + " must not be blank");
            Range range = field.getAnnotation(Range.class);
            if (range != null && value instanceof Integer n && (n < range.min() || n > range.max()))
                errors.add(field.getName() + ": " + range.message() + " [" + range.min() + ", " + range.max() + "]");
        }
        return errors;
    }
}`),
        file("src/main/java/meta/Main.java", code`
package meta;

import java.lang.reflect.Method;
import java.util.Arrays;

public class Main {
    static class Student {
        @NotBlank private String name;
        @Range(min = 16, max = 60, message = "age not allowed") private int age;
        Student(String name, int age) { this.name = name; this.age = age; }
        private String secret() { return "private method of " + name; }
    }

    public static void main(String[] args) throws Exception {
        System.out.println(Validator.validate(new Student(" ", 12)));

        Class<?> type = Class.forName("java.util.ArrayList");                 // load by name
        Object list = type.getDeclaredConstructor().newInstance();
        Method add = type.getMethod("add", Object.class);
        add.invoke(list, "created reflectively");
        System.out.println(list + " methods=" + type.getMethods().length);

        Method hidden = Student.class.getDeclaredMethod("secret");
        hidden.setAccessible(true);
        System.out.println(hidden.invoke(new Student("Asha", 20)));
        System.out.println(Arrays.toString(Student.class.getDeclaredFields()));
    }
}`),
      ],
      tips: [
        "getMethods() returns public methods including inherited ones; getDeclaredMethods() returns all methods declared in that class only.",
        "Annotations without RUNTIME retention are invisible to getAnnotation — the most common custom annotation bug.",
        "Since Java 16, strong encapsulation blocks setAccessible into JDK internals unless the module is opened (--add-opens).",
        "Class.forName also initializes the class, running its static blocks — that is how old JDBC drivers registered themselves.",
      ],
      subjective: [
        qa("What is reflection? Give its uses and drawbacks.", "Reflection is the ability of a program to inspect and modify the structure and behaviour of classes, methods and fields at run time through java.lang.Class and java.lang.reflect. Uses: dependency injection frameworks, ORM mapping, serialization libraries, test runners, IDE tooling, debuggers and plug-in loading. Drawbacks: bypasses compile-time checks, slower than direct calls, can break encapsulation and security boundaries, makes refactoring riskier, and may be restricted by the module system."),
        qa("Explain retention policies of annotations.", "RetentionPolicy.SOURCE: kept only in source and discarded by the compiler (@Override, @SuppressWarnings) — used by compilers and annotation processors. CLASS (default): recorded in the .class file but not available via reflection at run time — used by bytecode tools. RUNTIME: recorded in the class file and available through reflection at run time — needed for frameworks such as Spring, JPA and JUnit."),
      ],
      objective: [
        mcq("Which keyword declares an annotation type?", ["annotation", "@annotation", "@interface", "interface@"], 2, "public @interface Range { }."),
        mcq("Which retention makes an annotation readable via reflection?", ["SOURCE", "CLASS", "RUNTIME", "COMPILE"], 2, "Only RUNTIME annotations are visible to getAnnotation."),
        mcq("Which method gives access to a private field's value?", ["field.open()", "field.setAccessible(true) then field.get(obj)", "field.unlock()", "Class.forName(field)"], 1, "setAccessible suppresses Java language access checks."),
        mcq("Class.forName(\"com.x.Foo\") does what besides loading?", ["Nothing", "Initializes the class (runs static blocks)", "Creates an instance", "Compiles the class"], 1, "The single-argument form loads and initializes."),
      ],
    },
    {
      id: "networking", module: "Concurrency, reflection and networking", title: "Networking: sockets, URLs and the HTTP Client", level: "Intermediate", minutes: 16,
      summary: "TCP client/server with Socket and ServerSocket, UDP datagrams, and calling REST APIs with java.net.http.HttpClient.",
      description: [
        "java.net supports both low-level and high-level networking. TCP is connection-oriented and reliable: a ServerSocket listens on a port and accept() returns a Socket for each client; each side reads and writes through the socket's input and output streams. UDP (DatagramSocket, DatagramPacket) is connectionless and faster but offers no delivery or ordering guarantees — suited to DNS, streaming and games.",
        "A blocking server must handle each client on its own thread (or virtual thread) so one slow client does not block others. NIO channels and selectors (java.nio.channels) multiplex many connections on few threads; frameworks such as Netty build on them.",
        "For HTTP, Java 11's java.net.http.HttpClient replaces the old HttpURLConnection. It supports HTTP/1.1 and HTTP/2, synchronous send and asynchronous sendAsync returning CompletableFuture, timeouts, redirects, and body handlers for strings, files and streams. InetAddress resolves host names; URI parses and builds addresses.",
      ],
      usage: [
        "Use HttpClient to call REST APIs from plain Java or command-line tools.",
        "Use sockets for custom protocols, chat servers and learning how HTTP works underneath.",
        "Always set connect and request timeouts on network calls.",
        "Use TLS (SSLSocket or https URLs) for anything crossing an untrusted network.",
      ],
      files: [
        file("src/main/java/net/EchoServer.java", code`
package net;

import java.io.*;
import java.net.ServerSocket;
import java.net.Socket;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.Executors;

public class EchoServer {
    public static void main(String[] args) throws IOException {
        try (ServerSocket server = new ServerSocket(5000);
             var pool = Executors.newVirtualThreadPerTaskExecutor()) {    // one cheap thread per client
            System.out.println("Listening on 5000");
            while (true) {
                Socket client = server.accept();                         // blocks until a client connects
                pool.submit(() -> handle(client));
            }
        }
    }

    static void handle(Socket socket) {
        try (socket;
             BufferedReader in = new BufferedReader(new InputStreamReader(socket.getInputStream(), StandardCharsets.UTF_8));
             PrintWriter out = new PrintWriter(new OutputStreamWriter(socket.getOutputStream(), StandardCharsets.UTF_8), true)) {
            String line;
            while ((line = in.readLine()) != null && !line.equals("bye")) out.println("echo: " + line);
        } catch (IOException e) {
            System.err.println("client error: " + e.getMessage());
        }
    }
}`),
        file("src/main/java/net/EchoClient.java", code`
package net;

import java.io.*;
import java.net.Socket;

public class EchoClient {
    public static void main(String[] args) throws IOException {
        try (Socket socket = new Socket("localhost", 5000);
             BufferedReader in = new BufferedReader(new InputStreamReader(socket.getInputStream()));
             PrintWriter out = new PrintWriter(socket.getOutputStream(), true)) {
            socket.setSoTimeout(3000);                    // read timeout
            for (String msg : new String[]{"hello", "java"}) {
                out.println(msg);
                System.out.println(in.readLine());
            }
            out.println("bye");
        }
    }
}`),
        file("src/main/java/net/RestCall.java", code`
package net;

import java.net.URI;
import java.net.http.*;
import java.time.Duration;
import java.util.List;
import java.util.concurrent.CompletableFuture;

public class RestCall {
    public static void main(String[] args) throws Exception {
        HttpClient client = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(3))
            .followRedirects(HttpClient.Redirect.NORMAL)
            .build();

        HttpRequest get = HttpRequest.newBuilder(URI.create("https://httpbin.org/get?course=java"))
            .header("Accept", "application/json").timeout(Duration.ofSeconds(5)).GET().build();
        HttpResponse<String> response = client.send(get, HttpResponse.BodyHandlers.ofString());
        System.out.println(response.statusCode() + " " + response.version());

        HttpRequest post = HttpRequest.newBuilder(URI.create("https://httpbin.org/post"))
            .header("Content-Type", "application/json")
            .POST(HttpRequest.BodyPublishers.ofString("{\"name\":\"Asha\"}")).build();

        // Asynchronous: several requests in flight at once
        List<CompletableFuture<Integer>> calls = List.of(post, get).stream()
            .map(r -> client.sendAsync(r, HttpResponse.BodyHandlers.discarding()).thenApply(HttpResponse::statusCode))
            .toList();
        System.out.println(calls.stream().map(CompletableFuture::join).toList());
    }
}`),
      ],
      tips: [
        "Port numbers below 1024 need administrator rights on most systems.",
        "readLine() blocks until a newline arrives — forgetting println on the other side is a classic hang.",
        "Reuse one HttpClient instance; it pools connections.",
        "TCP vs UDP is a frequent theory question: reliability, ordering, connection set-up and speed.",
      ],
      subjective: [
        qa("Differentiate TCP and UDP and name the Java classes for each.", "TCP is connection-oriented, reliable (acknowledgements, retransmission), ordered and flow-controlled, with higher overhead; Java uses Socket and ServerSocket (stream-based). UDP is connectionless, unreliable, unordered, message-oriented and low-latency; Java uses DatagramSocket and DatagramPacket. TCP suits web, email and file transfer; UDP suits DNS, VoIP, live streaming and games."),
        qa("Write the steps to create a TCP server in Java.", "1. Create a ServerSocket bound to a port. 2. Call accept() in a loop; it blocks and returns a Socket per client. 3. Obtain input and output streams from the socket (wrap in BufferedReader/PrintWriter). 4. Read requests and write responses according to your protocol. 5. Handle each client on a separate thread (or virtual thread) so others are not blocked. 6. Close the client socket when done and the server socket at shutdown."),
      ],
      objective: [
        mcq("Which class waits for incoming TCP connections?", ["Socket", "ServerSocket", "DatagramSocket", "URLConnection"], 1, "accept() returns a Socket per client."),
        mcq("UDP communication in Java uses:", ["Socket", "DatagramPacket and DatagramSocket", "HttpClient", "ServerSocket"], 1, "Datagrams carry independent messages."),
        mcq("HttpClient was standardized in Java:", ["8", "9", "11", "17"], 2, "Incubated in 9, standard in 11."),
        mcq("Which method sends an HTTP request asynchronously?", ["send", "sendAsync", "post", "execute"], 1, "It returns a CompletableFuture<HttpResponse<T>>."),
      ],
    },
  ],
};
