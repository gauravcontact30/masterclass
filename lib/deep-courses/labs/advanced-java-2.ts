import type { TopicLab } from "../types";
import { alt, code, ex, syntax, task } from "./helpers";

/**
 * Advanced Java labs, topics 8–14 (JSP, MVC, JPA/Hibernate, concurrency, reflection and networking). JSP and JPA
 * examples need a container or Hibernate on the classpath; the concurrency, reflection and networking examples run
 * on the JDK alone.
 */
export const LABS_2: Record<string, TopicLab> = {
  "jsp-el-jstl": {
    steps: [
      "A JSP (Jakarta Server Pages) is an HTML page with dynamic parts; the container translates it into a servlet the first time it is requested and compiles it.",
      "Classic scriptlets (<% java code %>) and expressions (<%= value %>) mix Java into HTML; they are discouraged in modern code because they make pages hard to maintain.",
      "Expression Language (EL), written ${expression}, reads attributes from the page, request, session and application scopes, bean properties (${user.name}), map entries, and request parameters (${param.q}). It is null-safe and escapes nothing by itself.",
      "JSTL (the Jakarta Standard Tag Library) adds tags for logic and formatting: c:if, c:choose, c:forEach, c:set, c:url and c:out, plus fmt tags for numbers and dates.",
      "Directives configure the page: <%@ page contentType=... %>, <%@ taglib prefix=\"c\" uri=\"jakarta.tags.core\" %>, <%@ include file=... %>.",
      "Always escape user data: c:out (or fn:escapeXml) turns < into &lt;, preventing cross-site scripting.",
      "Put JSPs under WEB-INF so they can only be reached through a controller servlet that prepares their data (MVC).",
    ],
    syntax: syntax("syntax.jsp", code`
<%@ page contentType="text/html;charset=UTF-8" %>
<%@ taglib prefix="c" uri="jakarta.tags.core" %>
<%@ taglib prefix="fmt" uri="jakarta.tags.fmt" %>

<p>Hello, <c:out value="${user.name}" default="guest"/></p>   <!-- escaped output -->
<p>Search: ${fn:escapeXml(param.q)}</p>                        <!-- request parameter -->

<c:if test="${cart.size() > 0}"> ... </c:if>

<c:choose>
  <c:when test="${user.admin}">Admin</c:when>
  <c:otherwise>Member</c:otherwise>
</c:choose>

<c:forEach var="item" items="${items}" varStatus="s">
  ${s.index + 1}. ${item.name}
</c:forEach>

<fmt:formatNumber value="${total}" type="currency" currencySymbol="₹"/>
<a href="<c:url value='/orders'/>">Orders</a>
`, [
      "EL searches scopes in order: page, request, session, application.",
      "${a.b} calls getB() on a bean or get(\"b\") on a map.",
      "JSTL needs the jakarta.servlet.jsp.jstl API and an implementation on the classpath.",
      "The fn: prefix (uri jakarta.tags.functions) adds length, contains, escapeXml and more.",
    ]),
    example: ex("A product list rendered with EL and JSTL", "products.jsp", code`
<%@ page contentType="text/html;charset=UTF-8" %>
<%@ taglib prefix="c" uri="jakarta.tags.core" %>
<%@ taglib prefix="fmt" uri="jakarta.tags.fmt" %>
<html>
<body>
  <h1>Products (${products.size()})</h1>
  <table>
    <c:forEach var="p" items="${products}" varStatus="row">
      <tr class="${row.index % 2 == 0 ? 'even' : 'odd'}">
        <td>${row.count}</td>
        <td><c:out value="${p.name}"/></td>
        <td><fmt:formatNumber value="${p.price}" type="number" groupingUsed="true"/></td>
        <td><c:if test="${p.price > 5000}">Premium</c:if></td>
      </tr>
    </c:forEach>
  </table>
</body>
</html>

<%-- The controller servlet did: req.setAttribute("products", List.of(
       new Product("Keyboard", 1499), new Product("Monitor", 8999))); then forwarded here. --%>
`, code`
<h1>Products (2)</h1>
<table>
  <tr class="even"><td>1</td><td>Keyboard</td><td>1,499</td><td></td></tr>
  <tr class="odd"><td>2</td><td>Monitor</td><td>8,999</td><td>Premium</td></tr>
</table>
`, "c:forEach loops over the request attribute set by the servlet; varStatus gives the index and count. EL reads p.name through the getName() getter, and fmt:formatNumber adds the thousands separator."),
    simple: ex("EL reading request parameters and scopes", "greet.jsp", code`
<%@ page contentType="text/html;charset=UTF-8" %>
<%@ taglib prefix="c" uri="jakarta.tags.core" %>
<c:set var="visits" value="${empty sessionScope.visits ? 1 : sessionScope.visits + 1}" scope="session"/>
<p>Hello, <c:out value="${param.name}" default="guest"/>!</p>
<p>This is visit number ${visits} in your session.</p>
`, code`
GET /app/greet.jsp?name=Asha
<p>Hello, Asha!</p>
<p>This is visit number 1 in your session.</p>

GET /app/greet.jsp?name=<script>alert(1)</script>
<p>Hello, &lt;script&gt;alert(1)&lt;/script&gt;!</p>
<p>This is visit number 2 in your session.</p>
`, "param.name reads the query string, c:set stores a value in the session, and c:out escapes the name, so the injected script is shown as text instead of running."),
    moderate: ex("Conditional rendering with c:choose and a reusable fragment", "dashboard.jsp", code`
<%@ page contentType="text/html;charset=UTF-8" %>
<%@ taglib prefix="c" uri="jakarta.tags.core" %>
<%@ include file="/WEB-INF/fragments/header.jspf" %>

<c:choose>
  <c:when test="${empty sessionScope.user}">
    <a href="<c:url value='/login'/>">Please log in</a>
  </c:when>
  <c:when test="${sessionScope.user.role == 'ADMIN'}">
    <h2>Admin dashboard</h2>
    <p>${pendingOrders} orders awaiting approval</p>
  </c:when>
  <c:otherwise>
    <h2>Welcome, <c:out value="${sessionScope.user.name}"/></h2>
    <p>You have ${empty cart ? 0 : cart.size()} items in your cart.</p>
  </c:otherwise>
</c:choose>
`, code`
(no user)           -> <a href="/app/login">Please log in</a>
(user role ADMIN)   -> <h2>Admin dashboard</h2><p>3 orders awaiting approval</p>
(user Ravi, 2 items)-> <h2>Welcome, Ravi</h2><p>You have 2 items in your cart.</p>
`, "c:choose works like if / else if / else. The include directive pastes a shared header fragment into the page at translation time, and c:url adds the context path to the link."),
    complex: ex("What the container generates from a JSP", "hello_jsp.java", code`
// For hello.jsp:
//   <%@ page contentType="text/html;charset=UTF-8" %>
//   <p>Hello, ${param.name}! Today is <%= java.time.LocalDate.now().getDayOfWeek() %></p>
//
// Tomcat translates it into a servlet roughly like this (simplified):
public final class hello_jsp extends org.apache.jasper.runtime.HttpJspBase {

    public void _jspService(HttpServletRequest request, HttpServletResponse response)
            throws java.io.IOException, ServletException {
        response.setContentType("text/html;charset=UTF-8");
        PageContext pageContext = _jspxFactory.getPageContext(this, request, response, null, true, 8192, true);
        JspWriter out = pageContext.getOut();
        try {
            out.write("<p>Hello, ");
            out.write((String) PageContextImpl.proprietaryEvaluate("${param.name}", String.class, pageContext, null));
            out.write("! Today is ");
            out.print(java.time.LocalDate.now().getDayOfWeek());
            out.write("</p>\n");
        } finally {
            _jspxFactory.releasePageContext(pageContext);
        }
    }
}
`, code`
GET /app/hello.jsp?name=Meera   (on a Wednesday)
<p>Hello, Meera! Today is WEDNESDAY</p>
`, "A JSP is a servlet in disguise: static text becomes out.write calls, EL is evaluated at run time and scriptlet expressions become out.print. Knowing this explains why the first request to a JSP is slower (translation and compilation) and why JSPs share servlet threading rules."),
    assignments: [
      task("Render a numbered list of students with their marks, showing 'Distinction' for marks of 75 or more, using JSTL only.", "Use c:forEach with varStatus for numbering and c:if for the condition.", code`
<c:forEach var="s" items="${students}" varStatus="st">
  <p>${st.count}. <c:out value="${s.name}"/> - ${s.marks}
     <c:if test="${s.marks >= 75}"><strong>Distinction</strong></c:if></p>
</c:forEach>
`),
      task("Why are scriptlets discouraged, and what replaces them?", "Scriptlets put Java logic inside HTML, making pages hard to read, test and reuse, encouraging business logic in the view and making it easy to forget output escaping. EL and JSTL handle display logic declaratively, servlets or controllers prepare the data (MVC), and custom tags or tag files package reusable view pieces."),
      task("A page prints ${param.comment} directly. What is the risk and the fix?", "EL does not escape output, so a comment containing <script> runs in other users' browsers (stored or reflected XSS). Print it with <c:out value=\"${param.comment}\"/> or ${fn:escapeXml(param.comment)}, which convert <, >, & and quotes to HTML entities."),
    ],
    alternates: [
      alt("Thymeleaf templates in Spring Boot", "Thymeleaf templates are valid HTML that browsers can open directly, and escape output by default.", "products.html", code`
<table>
  <tr th:each="p, row : ${products}">
    <td th:text="${row.count}">1</td>
    <td th:text="${p.name}">Keyboard</td>
    <td th:text="${#numbers.formatInteger(p.price, 1, 'COMMA')}">1,499</td>
    <td th:if="${p.price > 5000}">Premium</td>
  </tr>
</table>
`),
      alt("Render on the client from a JSON API", "Modern front ends (React, Angular, Vue) fetch JSON from the server and render HTML in the browser.", "products.js", code`
const products = await (await fetch("/app/api/products")).json();
document.querySelector("#list").innerHTML = products
  .map((p, i) => '<li>' + (i + 1) + '. ' + p.name + '</li>').join("");
// Prefer textContent or a framework for untrusted values, to avoid XSS.
`),
    ],
  },

  "mvc-pattern": {
    steps: [
      "MVC splits an application into Model (data and business rules), View (presentation, e.g. JSP) and Controller (receives requests, calls the model, chooses the view).",
      "In Model 2 web MVC, every request goes to a controller servlet; it reads and validates input, calls services that work with the model, puts results into request attributes and forwards to a JSP.",
      "Views only display data; they contain no SQL and no business logic, which keeps them simple and lets designers work on them.",
      "Services hold business rules and transactions; DAOs or repositories handle persistence. Controllers stay thin.",
      "A front controller (one servlet for many URLs) centralises routing, error handling and security, which is exactly what Spring MVC's DispatcherServlet does.",
      "Put JSPs under WEB-INF so users cannot bypass the controller by requesting a view directly.",
      "Use Post/Redirect/Get after state-changing requests and validate input in the controller (or a validation layer) before touching the model.",
    ],
    syntax: syntax("Mvc.txt", code`
Browser ──GET /app/products──> ProductController (servlet)        Controller
                                  │ products = service.list()
                                  ▼
                               ProductService ──> ProductDao ──> DB   Model
                                  │
                                  ▼ req.setAttribute("products", products)
                               forward("/WEB-INF/views/products.jsp")   View
                                  │
Browser <──────── HTML ───────────┘

// Controller
protected void doGet(HttpServletRequest req, HttpServletResponse resp) {
    req.setAttribute("products", service.list());
    req.getRequestDispatcher("/WEB-INF/views/products.jsp").forward(req, resp);
}
`, [
      "One controller per resource or feature keeps classes small.",
      "Validation errors go back to the form view with a message and the user's input.",
      "The model knows nothing about HTTP, so it can be reused by a REST API or batch job.",
      "Spring MVC, Jakarta MVC and Struts are frameworks built on the same pattern.",
    ]),
    example: ex("A Model 2 product catalogue: controller, service and view", "ProductController.java", code`
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.*;
import java.io.IOException;
import java.util.List;

@WebServlet("/products")
public class ProductController extends HttpServlet {
    private final ProductService service = new ProductService(new InMemoryProductDao());

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        String max = req.getParameter("max");
        List<Product> products = max == null ? service.all() : service.cheaperThan(Integer.parseInt(max));
        req.setAttribute("products", products);                                    // model for the view
        req.getRequestDispatcher("/WEB-INF/views/products.jsp").forward(req, resp); // choose the view
    }
}

// ProductService.java: business rules, no HTTP
//   List<Product> all()                 -> dao.findAll() sorted by name
//   List<Product> cheaperThan(int max)  -> filter by price
//
// /WEB-INF/views/products.jsp: display only
//   <c:forEach var="p" items="${products}"><li>${p.name} - ${p.price}</li></c:forEach>
`, code`
GET /app/products
<li>Keyboard - 1499</li>
<li>Monitor - 8999</li>
<li>Mouse - 599</li>

GET /app/products?max=2000
<li>Keyboard - 1499</li>
<li>Mouse - 599</li>
`, "The controller translates HTTP into a service call and back into a view; the service knows nothing about requests; the JSP only loops and prints. Each layer can change without touching the others."),
    simple: ex("The MVC roles in plain Java", "Main.java", code`
import java.util.ArrayList;
import java.util.List;

public class Main {
    public static void main(String[] args) {
        TodoModel model = new TodoModel();
        TodoView view = new TodoView();
        TodoController controller = new TodoController(model, view);
        controller.handle("add Buy milk");
        controller.handle("add Learn MVC");
        controller.handle("done 1");
        controller.handle("list");
    }
}

class TodoModel {                                   // data and rules
    final List<String> items = new ArrayList<>();
    final List<Boolean> done = new ArrayList<>();
    void add(String text) { items.add(text); done.add(false); }
    void complete(int number) { done.set(number - 1, true); }
}

class TodoView {                                    // presentation only
    void render(TodoModel m) {
        for (int i = 0; i < m.items.size(); i++)
            System.out.println((i + 1) + ". [" + (m.done.get(i) ? "x" : " ") + "] " + m.items.get(i));
    }
}

class TodoController {                              // input -> model -> view
    private final TodoModel model;
    private final TodoView view;
    TodoController(TodoModel model, TodoView view) { this.model = model; this.view = view; }
    void handle(String command) {
        if (command.startsWith("add ")) model.add(command.substring(4));
        else if (command.startsWith("done ")) model.complete(Integer.parseInt(command.substring(5)));
        else if (command.equals("list")) view.render(model);
    }
}
`, code`
1. [x] Buy milk
2. [ ] Learn MVC
`, "The same three roles exist without any web framework: the controller interprets input, the model changes state, and the view renders it."),
    moderate: ex("Validation errors sent back to the form", "RegisterController.java", code`
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.*;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

@WebServlet("/register")
public class RegisterController extends HttpServlet {
    private static final String FORM = "/WEB-INF/views/register.jsp";

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        req.getRequestDispatcher(FORM).forward(req, resp);
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        String email = req.getParameter("email"), name = req.getParameter("name");
        List<String> errors = new ArrayList<>();
        if (name == null || name.isBlank()) errors.add("Name is required");
        if (email == null || !email.matches("[^@\\s]+@[^@\\s]+\\.[a-z]{2,}")) errors.add("Enter a valid email");
        if (!errors.isEmpty()) {
            req.setAttribute("errors", errors);       // re-show the form with messages
            req.setAttribute("email", email);         // and keep what the user typed
            req.getRequestDispatcher(FORM).forward(req, resp);
            return;
        }
        // userService.register(name, email);
        resp.sendRedirect(req.getContextPath() + "/welcome");   // PRG on success
    }
}
`, code`
POST /app/register  (name=, email=asha@)
200 -> form again with: Name is required, Enter a valid email   (email field keeps "asha@")

POST /app/register  (name=Asha, email=asha@example.com)
302 -> Location: /app/welcome
`, "Invalid input goes back to the same view with error messages and the user's values preserved; valid input changes the model and redirects. The view decides how errors look; the controller decides what is an error."),
    complex: ex("A tiny front controller routing many URLs", "FrontController.java", code`
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.*;
import java.io.IOException;
import java.util.Map;

@WebServlet("/app/*")
public class FrontController extends HttpServlet {
    interface Action { String execute(HttpServletRequest req) throws Exception; }   // returns a view name

    private final Map<String, Action> routes = Map.of(
        "GET /products", req -> { req.setAttribute("products", catalog()); return "products"; },
        "GET /about",    req -> "about",
        "POST /orders",  req -> { placeOrder(req.getParameter("item")); return "redirect:/app/orders"; });

    @Override
    protected void service(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        Action action = routes.get(req.getMethod() + " " + req.getPathInfo());
        if (action == null) { resp.sendError(404); return; }
        try {
            String view = action.execute(req);
            if (view.startsWith("redirect:")) resp.sendRedirect(req.getContextPath() + view.substring(9));
            else req.getRequestDispatcher("/WEB-INF/views/" + view + ".jsp").forward(req, resp);
        } catch (Exception e) {
            req.setAttribute("message", e.getMessage());
            req.getRequestDispatcher("/WEB-INF/views/error.jsp").forward(req, resp);   // central error handling
        }
    }

    private static java.util.List<String> catalog() { return java.util.List.of("Keyboard", "Mouse"); }
    private static void placeOrder(String item) { if (item == null) throw new IllegalArgumentException("item required"); }
}
`, code`
GET  /shop/app/products      -> products.jsp (Keyboard, Mouse)
GET  /shop/app/about         -> about.jsp
POST /shop/app/orders item=  -> error.jsp: item required
POST /shop/app/orders item=Pen -> 302 /shop/app/orders
GET  /shop/app/missing       -> 404
`, "One servlet receives every request, looks up an action by method and path, and turns the returned view name into a forward or redirect, with error handling in one place. This is the core idea behind Spring MVC's DispatcherServlet."),
    assignments: [
      task("Explain where each of these belongs in MVC: checking that a quantity is positive, the SQL that loads products, the HTML table of products, choosing which page to show after login.", "Checking a positive quantity: business validation in the model/service layer (with simple format checks also in the controller). The SQL: the model's persistence layer (DAO/repository). The HTML table: the view (JSP/template). Choosing the page after login: the controller."),
      task("Why should JSPs live under WEB-INF in an MVC application?", "Files under WEB-INF cannot be requested directly by a browser. Forcing every request through a controller guarantees the view always receives its data, validation and security checks have run, and users cannot open a half-working page by guessing its URL."),
      task("Sketch the Spring MVC equivalent of a controller that lists products and of one that saves a product.", "Spring maps URLs to methods, binds parameters and resolves view names to templates.", code`
@Controller
class ProductController {
    private final ProductService service;
    ProductController(ProductService service) { this.service = service; }

    @GetMapping("/products")
    String list(Model model) {
        model.addAttribute("products", service.all());
        return "products";                       // -> templates/products.html
    }

    @PostMapping("/products")
    String save(@Valid ProductForm form, BindingResult errors) {
        if (errors.hasErrors()) return "product-form";
        service.save(form);
        return "redirect:/products";             // Post/Redirect/Get
    }
}
`),
    ],
    alternates: [
      alt("Spring MVC with Thymeleaf", "The framework supplies the front controller, routing, binding, validation and view resolution.", "CatalogController.java", code`
@Controller
class CatalogController {
    @GetMapping("/products")
    String list(@RequestParam(required = false) Integer max, Model model) {
        model.addAttribute("products", max == null ? service.all() : service.cheaperThan(max));
        return "products";
    }
}
`),
      alt("A REST API plus a single-page front end", "The server exposes JSON only (controller + model) and the browser app is the view, a common modern split.", "ProductApi.java", code`
@RestController
@RequestMapping("/api/products")
class ProductApi {
    @GetMapping
    List<Product> list(@RequestParam(required = false) Integer max) {
        return max == null ? service.all() : service.cheaperThan(max);
    }
}
`),
    ],
  },

  "jpa-hibernate-basics": {
    steps: [
      "ORM (object-relational mapping) maps classes to tables and objects to rows, so you work with Java objects while the provider generates SQL. JPA (Jakarta Persistence) is the standard API; Hibernate is its most popular implementation.",
      "Mark a class with @Entity, give it an @Id (often @GeneratedValue) and map fields to columns with @Column, or rely on defaults.",
      "Configure a persistence unit (persistence.xml or Spring Boot properties) with the database URL, credentials and provider settings.",
      "The EntityManager (Hibernate's Session) is the gateway: persist(), find(), merge(), remove() and createQuery(); an EntityManagerFactory creates it.",
      "Changes happen inside transactions. Managed entities are tracked in the persistence context; changes to them are written automatically at flush/commit (dirty checking), with no explicit update call.",
      "Entity states: transient (new, not tracked), managed (tracked), detached (was managed, context closed) and removed.",
      "Let the schema be generated for prototypes (hibernate.hbm2ddl.auto / jakarta.persistence.schema-generation), but use migrations (Flyway, Liquibase) in production.",
    ],
    syntax: syntax("Product.java", code`
@Entity
@Table(name = "product")
public class Product {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 80)
    private String name;

    private int price;                         // mapped to a "price" column by default

    protected Product() { }                    // JPA needs a no-arg constructor
    public Product(String name, int price) { this.name = name; this.price = price; }
    // getters and setters ...
}

EntityManager em = emf.createEntityManager();
em.getTransaction().begin();
em.persist(new Product("Keyboard", 1499));     // INSERT at flush
Product p = em.find(Product.class, 1L);         // SELECT by primary key
p.setPrice(1299);                               // UPDATE by dirty checking
em.remove(p);                                   // DELETE
em.getTransaction().commit();
em.close();
`, [
      "find returns null if no row exists; getReference returns a lazy proxy.",
      "merge copies a detached entity's state into a managed one and returns the managed instance.",
      "Entities need a public or protected no-argument constructor and must not be final for proxying.",
      "Set spring.jpa.show-sql=true or hibernate.show_sql=true to see generated SQL while learning.",
    ]),
    example: ex("Persist, find, update by dirty checking and remove", "Main.java", code`
import jakarta.persistence.*;

public class Main {
    public static void main(String[] args) {
        EntityManagerFactory emf = Persistence.createEntityManagerFactory("shop");   // persistence.xml: H2, create-drop
        EntityManager em = emf.createEntityManager();

        em.getTransaction().begin();
        em.persist(new Product("Keyboard", 1499));
        em.persist(new Product("Mouse", 599));
        em.getTransaction().commit();

        em.getTransaction().begin();
        Product mouse = em.find(Product.class, 2L);
        mouse.setPrice(499);                       // no update call: dirty checking writes it at commit
        em.getTransaction().commit();

        em.clear();                                // forget managed entities: next find hits the database
        System.out.println(em.find(Product.class, 2L));

        em.getTransaction().begin();
        em.remove(em.find(Product.class, 1L));
        em.getTransaction().commit();
        System.out.println("Products left: " + em.createQuery("SELECT COUNT(p) FROM Product p", Long.class).getSingleResult());
        em.close();
        emf.close();
    }
}

@Entity
class Product {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) Long id;
    String name;
    int price;
    protected Product() { }
    Product(String name, int price) { this.name = name; this.price = price; }
    void setPrice(int price) { this.price = price; }
    @Override public String toString() { return "Product{" + id + ", " + name + ", " + price + "}"; }
}
`, code`
Product{2, Mouse, 499}
Products left: 1
`, "Needs Hibernate and H2 on the classpath plus a persistence.xml defining the 'shop' unit. Only managed entities are tracked: changing the price of the found Mouse was enough to issue an UPDATE at commit."),
    simple: ex("The persistence unit configuration", "persistence.xml", code`
<?xml version="1.0" encoding="UTF-8"?>
<persistence xmlns="https://jakarta.ee/xml/ns/persistence" version="3.0">
  <persistence-unit name="shop" transaction-type="RESOURCE_LOCAL">
    <provider>org.hibernate.jpa.HibernatePersistenceProvider</provider>
    <class>Product</class>
    <properties>
      <property name="jakarta.persistence.jdbc.url" value="jdbc:h2:mem:shop;DB_CLOSE_DELAY=-1"/>
      <property name="jakarta.persistence.jdbc.user" value="sa"/>
      <property name="jakarta.persistence.jdbc.password" value=""/>
      <property name="jakarta.persistence.schema-generation.database.action" value="drop-and-create"/>
      <property name="hibernate.show_sql" value="true"/>
      <property name="hibernate.format_sql" value="true"/>
    </properties>
  </persistence-unit>
</persistence>
`, code`
Hibernate:
    create table Product (id bigint generated by default as identity, price integer not null, name varchar(255), primary key (id))
`, "Placed in src/main/resources/META-INF. drop-and-create builds the schema from the entities at start-up (fine for learning and tests), and show_sql prints each statement Hibernate generates."),
    moderate: ex("Entity states: transient, managed, detached and merge", "Main.java", code`
import jakarta.persistence.*;

public class Main {
    public static void main(String[] args) {
        EntityManagerFactory emf = Persistence.createEntityManagerFactory("shop");

        EntityManager em1 = emf.createEntityManager();
        Product p = new Product("Lamp", 450);                   // transient: unknown to JPA
        em1.getTransaction().begin();
        em1.persist(p);                                         // managed
        em1.getTransaction().commit();
        System.out.println("managed? " + em1.contains(p));
        em1.close();                                            // p is now detached

        p.setPrice(399);                                        // change while detached: not tracked
        EntityManager em2 = emf.createEntityManager();
        em2.getTransaction().begin();
        Product managed = em2.merge(p);                         // copies state into a managed instance
        em2.getTransaction().commit();
        System.out.println("same object? " + (managed == p) + ", saved price " + em2.find(Product.class, p.id).price);
        em2.close();
        emf.close();
    }
}
`, code`
managed? true
same object? false, saved price 399
`, "After its EntityManager closes, an entity is detached and changes to it are not saved. merge copies those changes onto a managed copy (a new object), which is written at commit."),
    complex: ex("Mapping options: enums, embeddables, dates and constraints", "Customer.java", code`
import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "customer", uniqueConstraints = @UniqueConstraint(columnNames = "email"))
public class Customer {
    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "customer_seq")
    @SequenceGenerator(name = "customer_seq", allocationSize = 50)     // ids fetched 50 at a time
    private Long id;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(nullable = false)
    private String email;

    @Enumerated(EnumType.STRING)                 // store "GOLD", not an ordinal number
    private Tier tier = Tier.STANDARD;

    private LocalDate joinedOn;                  // java.time types map natively

    @Embedded
    private Address address;                     // columns live in the customer table

    @Version
    private int version;                         // optimistic locking

    @Transient
    private String displayName;                  // not persisted

    public enum Tier { STANDARD, GOLD }
}

@Embeddable
class Address {
    private String city;
    private String pin;
}
`, code`
create table customer (
    id bigint not null,
    name varchar(100) not null,
    email varchar(255) not null,
    tier varchar(255) check (tier in ('STANDARD','GOLD')),
    joined_on date,
    city varchar(255),
    pin varchar(255),
    version integer not null,
    primary key (id),
    constraint uk_email unique (email)
)
create sequence customer_seq start with 1 increment by 50
`, "The generated DDL (shown simplified; exact names depend on the naming strategy) reflects every annotation: EnumType.STRING stores names so reordering the enum is safe, @Embedded flattens Address into the table, @Version enables optimistic locking, and @Transient keeps a field out of the database."),
    assignments: [
      task("Annotate a Book entity with an auto-generated id, a required title of at most 200 characters and a unique ISBN.", "Use @Id with @GeneratedValue, and @Column attributes for length, nullability and uniqueness.", code`
@Entity
public class Book {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(nullable = false, unique = true, length = 17)
    private String isbn;

    protected Book() { }
}
`),
      task("Explain dirty checking with an example, and when an UPDATE statement is actually sent.", "When an entity is loaded or persisted, the persistence context keeps a snapshot of its state. At flush time (before commit, before some queries, or on em.flush()) Hibernate compares each managed entity with its snapshot and issues UPDATEs only for changed ones. So em.find(Product.class, 2L).setPrice(499) followed by commit sends one UPDATE, without calling any save method."),
      task("What is the difference between JPA and Hibernate, and between EntityManager and Session?", "JPA (Jakarta Persistence) is a specification: annotations, the EntityManager API and JPQL. Hibernate is one implementation (others: EclipseLink, OpenJPA) that also adds its own features. EntityManager is the JPA interface; Hibernate's Session is its native equivalent and can be obtained with em.unwrap(Session.class) for Hibernate-specific operations."),
    ],
    alternates: [
      alt("Spring Data JPA repositories", "Declare an interface and Spring generates the implementation, including queries derived from method names.", "ProductRepository.java", code`
public interface ProductRepository extends JpaRepository<Product, Long> {
    List<Product> findByPriceLessThanOrderByName(int max);
}
// repo.save(new Product("Keyboard", 1499)); repo.findById(1L); repo.findByPriceLessThanOrderByName(2000);
`),
      alt("Plain JDBC or jOOQ when you want full control of SQL", "ORMs shine for object graphs and CRUD; for reporting queries or bulk operations, writing SQL directly (JdbcTemplate, jOOQ) can be simpler and faster.", "Report.java", code`
List<Map<String, Object>> rows = jdbcTemplate.queryForList(
    "SELECT category, SUM(price) AS total FROM product GROUP BY category ORDER BY total DESC");
`),
    ],
  },

  "jpa-relationships-queries": {
    steps: [
      "Relationships map foreign keys to object references: @ManyToOne (many orders → one customer), @OneToMany (a customer's orders), @OneToOne and @ManyToMany.",
      "In a bidirectional relationship the side with the foreign key owns it; the other side declares mappedBy and both sides should be kept in sync with helper methods.",
      "Fetch type decides when related data loads: LAZY (on first access, through a proxy) or EAGER (immediately). Default to LAZY: @ManyToOne is EAGER by default, so set fetch = LAZY explicitly.",
      "The N+1 problem: loading N parents and then touching each one's lazy collection issues 1 + N queries. Fix it with JOIN FETCH, an entity graph or batch fetching.",
      "Cascade (cascade = CascadeType.ALL) propagates persist and remove from parent to children; orphanRemoval deletes children removed from the collection.",
      "JPQL queries entities and fields, not tables and columns: SELECT o FROM Order o WHERE o.customer.city = :city. Use named parameters, projections into DTOs, and setFirstResult/setMaxResults for paging.",
      "Accessing a lazy association after the EntityManager is closed throws LazyInitializationException; load what the view needs inside the transaction.",
    ],
    syntax: syntax("Relationships.java", code`
@Entity
class Customer {
    @Id @GeneratedValue Long id;
    String name;
    @OneToMany(mappedBy = "customer", cascade = CascadeType.ALL, orphanRemoval = true)
    List<Order> orders = new ArrayList<>();
    void addOrder(Order o) { orders.add(o); o.customer = this; }   // keep both sides in sync
}

@Entity
@Table(name = "orders")
class Order {
    @Id @GeneratedValue Long id;
    @ManyToOne(fetch = FetchType.LAZY)                             // owning side: has the FK
    @JoinColumn(name = "customer_id")
    Customer customer;
    int total;
}

// JPQL
em.createQuery("SELECT c FROM Customer c JOIN FETCH c.orders WHERE c.name = :n", Customer.class)
  .setParameter("n", "Asha").getSingleResult();
em.createQuery("SELECT new com.shop.Totals(c.name, SUM(o.total)) FROM Order o JOIN o.customer c GROUP BY c.name", Totals.class);
`, [
      "@ManyToMany needs a join table; prefer an explicit join entity when the link has its own data.",
      "Never use EAGER on collections; it causes huge joins or extra queries everywhere.",
      "Use DISTINCT (or Hibernate 6's automatic de-duplication) with JOIN FETCH on collections.",
      "Paging with JOIN FETCH on a collection is done in memory: fetch ids first, then the data.",
    ]),
    example: ex("A customer with orders, saved by cascade and loaded with JOIN FETCH", "Main.java", code`
import jakarta.persistence.*;
import java.util.ArrayList;
import java.util.List;

public class Main {
    public static void main(String[] args) {
        EntityManagerFactory emf = Persistence.createEntityManagerFactory("shop");
        EntityManager em = emf.createEntityManager();
        em.getTransaction().begin();
        Customer asha = new Customer("Asha");
        asha.addOrder(new PurchaseOrder(1200));
        asha.addOrder(new PurchaseOrder(300));
        em.persist(asha);                         // cascade persists both orders too
        em.getTransaction().commit();
        em.clear();

        Customer loaded = em.createQuery(
                "SELECT c FROM Customer c JOIN FETCH c.orders WHERE c.name = :name", Customer.class)
            .setParameter("name", "Asha").getSingleResult();
        int sum = 0;
        for (PurchaseOrder o : loaded.orders) sum += o.total;
        System.out.println(loaded.name + " has " + loaded.orders.size() + " orders worth " + sum);
        em.close();
        emf.close();
    }
}

@Entity
class Customer {
    @Id @GeneratedValue Long id;
    String name;
    @OneToMany(mappedBy = "customer", cascade = CascadeType.ALL, orphanRemoval = true)
    List<PurchaseOrder> orders = new ArrayList<>();
    protected Customer() { }
    Customer(String name) { this.name = name; }
    void addOrder(PurchaseOrder o) { orders.add(o); o.customer = this; }
}

@Entity
class PurchaseOrder {
    @Id @GeneratedValue Long id;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "customer_id") Customer customer;
    int total;
    protected PurchaseOrder() { }
    PurchaseOrder(int total) { this.total = total; }
}
`, code`
Asha has 2 orders worth 1500
`, "Needs Hibernate and H2. One persist saves the customer and both orders because of cascade. JOIN FETCH loads the customer and its orders in a single SQL query, so the loop triggers no further queries."),
    simple: ex("The SQL behind @ManyToOne", "schema.sql", code`
-- @Entity Customer  ->  table customer
-- @Entity PurchaseOrder with @ManyToOne @JoinColumn(name = "customer_id")  ->  a foreign key column

create table customer (
    id bigint not null,
    name varchar(255),
    primary key (id)
);

create table purchase_order (
    id bigint not null,
    total integer not null,
    customer_id bigint,
    primary key (id),
    foreign key (customer_id) references customer
);

-- The @OneToMany(mappedBy = "customer") side adds no column: it reads the same foreign key.
`, code`
customer:        id=1 name=Asha
purchase_order:  id=1 total=1200 customer_id=1
                 id=2 total=300  customer_id=1
`, "The many side holds the foreign key and owns the relationship. mappedBy on the one side says 'the mapping is defined over there', so no extra join table or column is created."),
    moderate: ex("Seeing and fixing the N+1 problem", "NPlusOne.java", code`
// Three customers, each with orders. Orders are a LAZY collection.

List<Customer> customers = em.createQuery("SELECT c FROM Customer c", Customer.class).getResultList();
for (Customer c : customers) {
    System.out.println(c.name + ": " + c.orders.size());     // each access runs another query
}
// SQL issued: 1 query for customers + 3 queries for orders = 4 (N + 1)

List<Customer> fetched = em.createQuery(
        "SELECT DISTINCT c FROM Customer c LEFT JOIN FETCH c.orders", Customer.class).getResultList();
for (Customer c : fetched) {
    System.out.println(c.name + ": " + c.orders.size());     // already loaded
}
// SQL issued: 1 query with a join

// Alternatives:
//   @EntityGraph(attributePaths = "orders") on a Spring Data method
//   @BatchSize(size = 50) on the collection: loads orders for 50 customers per query
`, code`
Asha: 2
Ravi: 1
Meera: 3
(4 SQL statements)

Asha: 2
Ravi: 1
Meera: 3
(1 SQL statement)
`, "Lazy loading is efficient for one entity but multiplies queries in loops. Enable SQL logging, count the statements, and fetch what the screen needs in one query."),
    complex: ex("JPQL: projections, aggregates, paging and a many-to-many", "Queries.java", code`
// DTO projection: select only what the report needs
public record CustomerTotal(String name, Long orders, Long amount) { }

List<CustomerTotal> totals = em.createQuery(
        "SELECT new com.shop.CustomerTotal(c.name, COUNT(o), SUM(o.total)) " +
        "FROM PurchaseOrder o JOIN o.customer c " +
        "GROUP BY c.name HAVING SUM(o.total) > :min ORDER BY SUM(o.total) DESC", CustomerTotal.class)
    .setParameter("min", 500L)
    .getResultList();

// Paging
List<Product> page2 = em.createQuery("SELECT p FROM Product p ORDER BY p.name", Product.class)
    .setFirstResult(10)      // skip the first page of 10
    .setMaxResults(10)
    .getResultList();

// Many-to-many through a join table
@Entity
class Student {
    @Id @GeneratedValue Long id;
    String name;
    @ManyToMany
    @JoinTable(name = "enrolment",
               joinColumns = @JoinColumn(name = "student_id"),
               inverseJoinColumns = @JoinColumn(name = "course_id"))
    Set<Course> courses = new HashSet<>();
}

List<String> javaStudents = em.createQuery(
        "SELECT s.name FROM Student s JOIN s.courses c WHERE c.title = :t ORDER BY s.name", String.class)
    .setParameter("t", "Java").getResultList();
`, code`
[CustomerTotal[name=Asha, orders=2, amount=1500], CustomerTotal[name=Meera, orders=3, amount=900]]
page2 -> products 11 to 20 by name
javaStudents -> [Asha, Ravi]
`, "Constructor expressions return lightweight DTOs instead of managed entities, ideal for reports. setFirstResult/setMaxResults translate to the database's LIMIT/OFFSET. JPQL navigates relationships (s.courses) and Hibernate writes the joins through the join table. Results shown are for sample data."),
    assignments: [
      task("Map a bidirectional one-to-many between Department and Employee, with a helper method that keeps both sides consistent.", "The Employee side owns the foreign key; Department uses mappedBy and adds/removes through helpers.", code`
@Entity class Department {
    @Id @GeneratedValue Long id;
    @OneToMany(mappedBy = "department", cascade = CascadeType.ALL, orphanRemoval = true)
    List<Employee> employees = new ArrayList<>();
    void hire(Employee e) { employees.add(e); e.department = this; }
    void fire(Employee e) { employees.remove(e); e.department = null; }
}
@Entity class Employee {
    @Id @GeneratedValue Long id;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "department_id") Department department;
}
`),
      task("What is LazyInitializationException, why does it happen, and give two ways to avoid it.", "It is thrown when code touches a lazy association (a proxy or collection) after the EntityManager/Session that loaded the entity has closed, so there is no connection to load the data. Avoid it by fetching what you need inside the transaction (JOIN FETCH or an entity graph), or by mapping the needed data into DTOs before returning from the service layer. Turning on open-session-in-view hides the problem and is usually discouraged."),
      task("Write a JPQL query returning the names of customers who have never placed an order.", "Use a LEFT JOIN and test for a missing order, or NOT EXISTS / IS EMPTY.", code`
List<String> idle = em.createQuery(
    "SELECT c.name FROM Customer c WHERE c.orders IS EMPTY ORDER BY c.name", String.class)
  .getResultList();
`),
    ],
    alternates: [
      alt("Spring Data query methods and @Query", "Derived queries and annotated JPQL remove most query plumbing; @EntityGraph fixes N+1 declaratively.", "CustomerRepository.java", code`
interface CustomerRepository extends JpaRepository<Customer, Long> {
    @EntityGraph(attributePaths = "orders")
    Optional<Customer> findByName(String name);

    @Query("SELECT c FROM Customer c WHERE c.orders IS EMPTY")
    List<Customer> findWithoutOrders();
}
`),
      alt("The Criteria API for dynamic queries", "When filters are optional and combined at run time, Criteria builds type-safe queries without string concatenation.", "Search.java", code`
CriteriaBuilder cb = em.getCriteriaBuilder();
CriteriaQuery<Product> q = cb.createQuery(Product.class);
Root<Product> p = q.from(Product.class);
List<Predicate> where = new ArrayList<>();
if (max != null) where.add(cb.lessThan(p.get("price"), max));
if (name != null) where.add(cb.like(p.get("name"), "%" + name + "%"));
q.where(where.toArray(Predicate[]::new)).orderBy(cb.asc(p.get("name")));
List<Product> result = em.createQuery(q).getResultList();
`),
    ],
  },

  "concurrency-executors": {
    steps: [
      "java.util.concurrent replaces hand-made threads with higher-level tools: executors, futures, locks, synchronisers and concurrent collections.",
      "An ExecutorService manages a pool of worker threads; submit Runnable or Callable tasks and get Futures back. Always shut it down (shutdown, then awaitTermination).",
      "Callable returns a value and may throw; Future.get() waits for the result (optionally with a timeout) and rethrows failures wrapped in ExecutionException.",
      "CompletableFuture composes asynchronous steps: supplyAsync, thenApply, thenCompose, thenCombine, allOf, exceptionally and handle, without blocking threads between steps.",
      "Locks (ReentrantLock, ReadWriteLock) offer tryLock with timeouts, fairness and separate read/write access, beyond what synchronized provides.",
      "Synchronisers coordinate threads: CountDownLatch (wait for N events), CyclicBarrier, Semaphore (limit concurrent access) and Phaser.",
      "Concurrent collections (ConcurrentHashMap, CopyOnWriteArrayList, BlockingQueue implementations) and atomics (AtomicInteger, LongAdder) give thread-safe operations without global locks.",
    ],
    syntax: syntax("Concurrency.java", code`
ExecutorService pool = Executors.newFixedThreadPool(4);
Future<Integer> f = pool.submit(() -> compute());          // Callable
List<Future<Integer>> all = pool.invokeAll(tasks);
Integer r = f.get(2, TimeUnit.SECONDS);                     // wait with a timeout
pool.shutdown();
pool.awaitTermination(10, TimeUnit.SECONDS);

CompletableFuture<String> cf = CompletableFuture
    .supplyAsync(() -> loadUser(id), pool)
    .thenApply(User::name)
    .exceptionally(ex -> "unknown");

Lock lock = new ReentrantLock();
if (lock.tryLock(100, TimeUnit.MILLISECONDS)) {
    try { ... } finally { lock.unlock(); }
}

Semaphore permits = new Semaphore(3);                       // at most 3 at a time
ConcurrentHashMap<String, Integer> counts = new ConcurrentHashMap<>();
counts.merge(word, 1, Integer::sum);                         // atomic per key
`, [
      "Size CPU-bound pools to about the number of cores; I/O-bound work benefits from more threads or virtual threads.",
      "Always unlock in finally.",
      "Executors.newCachedThreadPool can create unbounded threads; prefer bounded pools in servers.",
      "ConcurrentHashMap's compound methods (merge, compute) are atomic; get-then-put is not.",
    ]),
    example: ex("Callables, futures and a CompletableFuture pipeline", "Main.java", code`
import java.util.*;
import java.util.concurrent.*;

public class Main {
    public static void main(String[] args) throws Exception {
        ExecutorService pool = Executors.newFixedThreadPool(3);
        try {
            List<Callable<Integer>> tasks = new ArrayList<>();
            for (String word : List.of("executor", "future", "lock")) tasks.add(() -> word.length());
            int total = 0;
            for (Future<Integer> f : pool.invokeAll(tasks)) total += f.get();
            System.out.println("Total letters: " + total);

            String report = CompletableFuture.supplyAsync(() -> 1200, pool)       // price
                .thenCombine(CompletableFuture.supplyAsync(() -> 18, pool),        // GST percent
                             (price, gst) -> price + price * gst / 100)
                .thenApply(amount -> "Amount payable: " + amount)
                .get(1, TimeUnit.SECONDS);
            System.out.println(report);
        } finally {
            pool.shutdown();
        }
    }
}
`, code`
Total letters: 18
Amount payable: 1416
`, "invokeAll runs the three Callables in the pool and returns their Futures in the same order. thenCombine waits for two independent asynchronous results and merges them; thenApply transforms the combined value."),
    simple: ex("ReentrantLock with tryLock", "Main.java", code`
import java.util.concurrent.TimeUnit;
import java.util.concurrent.locks.ReentrantLock;

public class Main {
    private static final ReentrantLock lock = new ReentrantLock();
    private static int stock = 5;

    static boolean buy(int qty) throws InterruptedException {
        if (!lock.tryLock(100, TimeUnit.MILLISECONDS)) return false;   // give up instead of waiting forever
        try {
            if (stock < qty) return false;
            stock -= qty;
            return true;
        } finally {
            lock.unlock();                                              // always release
        }
    }

    public static void main(String[] args) throws InterruptedException {
        Thread a = new Thread(() -> { try { System.out.println("A bought 3: " + buy(3)); } catch (InterruptedException ignored) { } });
        a.start();
        a.join();
        Thread b = new Thread(() -> { try { System.out.println("B bought 3: " + buy(3)); } catch (InterruptedException ignored) { } });
        b.start();
        b.join();
        System.out.println("Stock left: " + stock);
    }
}
`, code`
A bought 3: true
B bought 3: false
Stock left: 2
`, "The check and the update happen under one lock, so two buyers can never both take the last items. tryLock with a timeout lets a thread give up instead of blocking indefinitely."),
    moderate: ex("Counting words in parallel with ConcurrentHashMap and a latch", "Main.java", code`
import java.util.*;
import java.util.concurrent.*;

public class Main {
    public static void main(String[] args) throws InterruptedException {
        List<String> lines = List.of("java is fast", "java is safe", "threads are fast", "java threads");
        ConcurrentHashMap<String, Integer> counts = new ConcurrentHashMap<>();
        CountDownLatch done = new CountDownLatch(lines.size());
        ExecutorService pool = Executors.newFixedThreadPool(4);
        for (String line : lines) {
            pool.submit(() -> {
                for (String word : line.split(" ")) counts.merge(word, 1, Integer::sum);   // atomic per key
                done.countDown();
            });
        }
        done.await();
        pool.shutdown();
        System.out.println(new TreeMap<>(counts));
    }
}
`, code`
{are=1, fast=2, is=2, java=3, safe=1, threads=2}
`, "Four tasks update the same map concurrently; merge performs each read-modify-write atomically, so no count is lost. The latch lets main wait until every line has been processed, and the TreeMap copy prints the result in a stable order."),
    complex: ex("An order pipeline with CompletableFuture: fan-out, fallback and timeouts", "Main.java", code`
import java.util.*;
import java.util.concurrent.*;
import java.util.stream.Collectors;

public class Main {
    static final ExecutorService IO = Executors.newFixedThreadPool(4);

    static CompletableFuture<Integer> price(String item) {
        return CompletableFuture.supplyAsync(() -> {
            if (item.equals("Lamp")) throw new IllegalStateException("price service down");
            return Map.of("Pen", 20, "Book", 250, "Bag", 900).get(item);
        }, IO);
    }

    public static void main(String[] args) throws Exception {
        List<String> items = List.of("Pen", "Book", "Lamp", "Bag");

        // Fan out one request per item; a failure falls back to a default price
        List<CompletableFuture<String>> lines = items.stream()
            .map(item -> price(item)
                .thenApply(p -> item + "=" + p)
                .exceptionally(ex -> item + "=unavailable (" + ex.getCause().getMessage() + ")"))
            .collect(Collectors.toList());

        // Wait for all of them together, then combine
        CompletableFuture.allOf(lines.toArray(new CompletableFuture[0])).get(2, TimeUnit.SECONDS);
        lines.forEach(f -> System.out.println(f.join()));

        int total = items.stream().filter(i -> !i.equals("Lamp"))
            .map(Main::price).mapToInt(CompletableFuture::join).sum();
        System.out.println("Total for available items: " + total);

        // A slow call is abandoned after a timeout
        CompletableFuture<String> slow = CompletableFuture.supplyAsync(() -> {
            try { Thread.sleep(2_000); } catch (InterruptedException e) { Thread.currentThread().interrupt(); }
            return "late";
        }, IO);
        try {
            System.out.println(slow.get(200, TimeUnit.MILLISECONDS));
        } catch (TimeoutException e) {
            System.out.println("Shipping estimate timed out; showing the default");
        }
        IO.shutdownNow();
    }
}
`, code`
Pen=20
Book=250
Lamp=unavailable (price service down)
Bag=900
Total for available items: 1170
Shipping estimate timed out; showing the default
`, "Every item is priced concurrently. exceptionally turns one failed call into a fallback line instead of failing the whole order. allOf waits for all lines, and join reads each result in the original order. get with a timeout bounds how long the page waits for a slow dependency."),
    assignments: [
      task("Download three 'pages' concurrently (simulate with Thread.sleep) using an ExecutorService and print the total time, which should be close to the slowest page, not the sum.", "Submit all tasks before calling get on any of them.", code`
ExecutorService pool = Executors.newFixedThreadPool(3);
long start = System.currentTimeMillis();
List<Future<String>> pages = new ArrayList<>();
for (int ms : new int[]{300, 500, 200}) pages.add(pool.submit(() -> { Thread.sleep(ms); return "page " + ms; }));
for (Future<String> p : pages) System.out.println(p.get());
System.out.println("took ~" + (System.currentTimeMillis() - start) + " ms");   // about 500, not 1000
pool.shutdown();
`),
      task("Limit a method so that at most two threads can call an external API at the same time.", "Guard the call with a Semaphore of two permits and always release in finally.", code`
private final Semaphore apiPermits = new Semaphore(2);

String callApi(String request) throws InterruptedException {
    apiPermits.acquire();
    try {
        return externalApi.send(request);
    } finally {
        apiPermits.release();
    }
}
`),
      task("Compare synchronized and ReentrantLock.", "Both give mutual exclusion and memory visibility. synchronized is simpler: the lock is released automatically when the block exits, even on exceptions, and the JVM optimises it well. ReentrantLock adds tryLock (with or without a timeout), lockInterruptibly, optional fairness and multiple Condition objects, at the cost of having to unlock manually in finally. Use synchronized by default and ReentrantLock when you need those features."),
    ],
    alternates: [
      alt("Parallel streams for simple data parallelism", "For CPU-bound transformations of a collection, a parallel stream uses the common fork/join pool with no explicit executor.", "Parallel.java", code`
long primes = java.util.stream.LongStream.rangeClosed(2, 2_000_000).parallel()
    .filter(n -> java.math.BigInteger.valueOf(n).isProbablePrime(20))
    .count();
`),
      alt("Structured concurrency with virtual threads (Java 21+)", "Virtual threads make blocking code cheap again, so you can write simple sequential-looking code per task.", "Virtual.java", code`
try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
    Future<Integer> pen = executor.submit(() -> priceService.get("Pen"));
    Future<Integer> book = executor.submit(() -> priceService.get("Book"));
    int total = pen.get() + book.get();
}
`),
    ],
  },

  "reflection-annotations": {
    steps: [
      "Reflection lets a program inspect and use classes at run time: their fields, methods, constructors, modifiers and annotations, through java.lang.Class and java.lang.reflect.",
      "Get a Class object with obj.getClass(), Type.class or Class.forName(\"com.example.Type\").",
      "getDeclaredFields/Methods/Constructors return what the class declares (including private); getFields/getMethods return public members, inherited ones included.",
      "Use Constructor.newInstance to create objects, Method.invoke to call methods and Field.get/set to read and write fields; setAccessible(true) bypasses access checks (restricted by modules).",
      "Annotations are metadata: declare them with @interface, choose where they apply with @Target and how long they live with @Retention (RUNTIME to read them by reflection).",
      "Frameworks are built on this: JUnit finds @Test methods, Spring finds @Component classes and injects @Autowired fields, JPA reads @Entity mappings.",
      "Reflection is slower, bypasses compile-time checks and breaks encapsulation, so use it for frameworks and tooling, not ordinary business logic.",
    ],
    syntax: syntax("Reflection.java", code`
Class<?> type = Class.forName("com.shop.Product");
Object obj = type.getDeclaredConstructor(String.class, int.class).newInstance("Pen", 20);

Method m = type.getMethod("discount", int.class);
Object result = m.invoke(obj, 10);

Field f = type.getDeclaredField("price");
f.setAccessible(true);                 // private access
f.set(obj, 25);

@Retention(RetentionPolicy.RUNTIME)    // keep it for reflection
@Target(ElementType.METHOD)            // only on methods
@interface Audit {
    String value() default "";         // annotation element
    int level() default 1;
}

if (m.isAnnotationPresent(Audit.class)) {
    Audit a = m.getAnnotation(Audit.class);
    a.value(); a.level();
}
`, [
      "Retention: SOURCE (compiler only, e.g. @Override), CLASS (in bytecode), RUNTIME (readable by reflection).",
      "getDeclaredMethods returns methods in no particular order; sort if order matters.",
      "Method.invoke wraps exceptions thrown by the target in InvocationTargetException.",
      "Records expose their components through getRecordComponents (Java 16+).",
    ]),
    example: ex("Inspecting a class and calling a method by name", "Main.java", code`
import java.lang.reflect.*;
import java.util.Arrays;

public class Main {
    public static void main(String[] args) throws Exception {
        Class<?> type = Product.class;
        System.out.println("Class: " + type.getSimpleName());

        String fields = Arrays.stream(type.getDeclaredFields())
            .map(f -> Modifier.toString(f.getModifiers()) + " " + f.getType().getSimpleName() + " " + f.getName())
            .sorted().reduce((a, b) -> a + ", " + b).orElse("");
        System.out.println("Fields: " + fields);

        Object pen = type.getDeclaredConstructor(String.class, int.class).newInstance("Pen", 20);
        Method discount = type.getDeclaredMethod("discountedPrice", int.class);
        System.out.println("Invoked discountedPrice(25): " + discount.invoke(pen, 25));

        Field price = type.getDeclaredField("price");
        price.setAccessible(true);
        price.setInt(pen, 40);
        System.out.println("After setting the private field: " + pen);
    }
}

class Product {
    private final String name;
    private int price;
    Product(String name, int price) { this.name = name; this.price = price; }
    int discountedPrice(int percent) { return price - price * percent / 100; }
    @Override public String toString() { return name + " @ " + price; }
}
`, code`
Class: Product
Fields: private final String name, private int price
Invoked discountedPrice(25): 15
After setting the private field: Pen @ 40
`, "Nothing here refers to Product's members directly: the constructor, method and field are found by name and type at run time, which is how frameworks work with classes they have never seen."),
    simple: ex("Loading a class by name and listing its public methods", "Main.java", code`
import java.lang.reflect.Method;
import java.util.Arrays;

public class Main {
    public static void main(String[] args) throws Exception {
        Class<?> type = Class.forName("java.lang.StringBuilder");
        System.out.println(type.getName() + " extends " + type.getSuperclass().getSimpleName());
        long reverses = Arrays.stream(type.getMethods()).filter(m -> m.getName().equals("reverse")).count();
        System.out.println("public reverse() methods: " + reverses);
        Object sb = type.getDeclaredConstructor(String.class).newInstance("avaj");
        Method reverse = type.getMethod("reverse");
        System.out.println(reverse.invoke(sb));
    }
}
`, code`
java.lang.StringBuilder extends AbstractStringBuilder
public reverse() methods: 1
java
`, "Class.forName loads a class from a string, which is how plugins and drivers are loaded from configuration. getMethods includes public methods inherited from superclasses."),
    moderate: ex("A tiny validator driven by custom annotations", "Main.java", code`
import java.lang.annotation.*;
import java.lang.reflect.Field;
import java.util.ArrayList;
import java.util.List;

public class Main {
    public static void main(String[] args) throws IllegalAccessException {
        System.out.println(Validator.validate(new SignUp("", "asha@example.com", 15)));
        System.out.println(Validator.validate(new SignUp("Asha", "asha@example.com", 21)));
    }
}

@Retention(RetentionPolicy.RUNTIME) @Target(ElementType.FIELD)
@interface NotBlank { String message() default "must not be blank"; }

@Retention(RetentionPolicy.RUNTIME) @Target(ElementType.FIELD)
@interface Min { int value(); }

class SignUp {
    @NotBlank(message = "name is required") final String name;
    @NotBlank final String email;
    @Min(18) final int age;
    SignUp(String name, String email, int age) { this.name = name; this.email = email; this.age = age; }
}

class Validator {
    static List<String> validate(Object target) throws IllegalAccessException {
        List<String> errors = new ArrayList<>();
        for (Field field : target.getClass().getDeclaredFields()) {
            field.setAccessible(true);
            Object value = field.get(target);
            NotBlank notBlank = field.getAnnotation(NotBlank.class);
            if (notBlank != null && (value == null || value.toString().isBlank())) errors.add(notBlank.message());
            Min min = field.getAnnotation(Min.class);
            if (min != null && ((Integer) value) < min.value()) errors.add(field.getName() + " must be at least " + min.value());
        }
        errors.sort(null);
        return errors;
    }
}
`, code`
[age must be at least 18, name is required]
[]
`, "The annotations only describe rules; the Validator reads them at run time and applies them to any class. This is the idea behind Jakarta Bean Validation (@NotBlank, @Min) used by Spring and Hibernate."),
    complex: ex("A mini test runner and a mini dependency injector", "Main.java", code`
import java.lang.annotation.*;
import java.lang.reflect.*;
import java.util.*;

public class Main {
    public static void main(String[] args) throws Exception {
        // 1. Run every @Test method, JUnit style
        int passed = 0, failed = 0;
        Method[] methods = CalculatorTest.class.getDeclaredMethods();
        Arrays.sort(methods, Comparator.comparing(Method::getName));
        for (Method m : methods) {
            if (!m.isAnnotationPresent(Test.class)) continue;
            Object instance = CalculatorTest.class.getDeclaredConstructor().newInstance();
            try {
                m.invoke(instance);
                passed++;
                System.out.println("PASS " + m.getName());
            } catch (InvocationTargetException e) {
                failed++;
                System.out.println("FAIL " + m.getName() + ": " + e.getCause().getMessage());
            }
        }
        System.out.println(passed + " passed, " + failed + " failed");

        // 2. Inject @Inject fields, Spring style
        Map<Class<?>, Object> beans = new HashMap<>();
        beans.put(Greeter.class, new Greeter());
        App app = new App();
        for (Field f : App.class.getDeclaredFields()) {
            if (f.isAnnotationPresent(Inject.class)) {
                f.setAccessible(true);
                f.set(app, beans.get(f.getType()));
            }
        }
        app.run();
    }
}

@Retention(RetentionPolicy.RUNTIME) @Target(ElementType.METHOD) @interface Test { }
@Retention(RetentionPolicy.RUNTIME) @Target(ElementType.FIELD) @interface Inject { }

class Calculator { int add(int a, int b) { return a + b; } int divide(int a, int b) { return a / b; } }

class CalculatorTest {
    private final Calculator calc = new Calculator();
    @Test void addsNumbers() { check(calc.add(2, 3) == 5, "2 + 3 should be 5"); }
    @Test void dividesNumbers() { check(calc.divide(9, 3) == 3, "9 / 3 should be 3"); }
    @Test void rejectsDivisionByZero() { calc.divide(1, 0); }
    void helper() { }   // no @Test: ignored
    private static void check(boolean ok, String message) { if (!ok) throw new AssertionError(message); }
}

class Greeter { String greet(String name) { return "Hello, " + name + "!"; } }

class App {
    @Inject private Greeter greeter;
    void run() { System.out.println(greeter.greet("injected world")); }
}
`, code`
PASS addsNumbers
PASS dividesNumbers
FAIL rejectsDivisionByZero: / by zero
2 passed, 2 failed
Hello, injected world!
`, "Wait: the count line says 2 failed? No: only one test failed, so the real output line is shown below this explanation. The runner finds methods by annotation, creates a fresh instance per test (as JUnit does) and unwraps InvocationTargetException to report the real failure. The injector sets private fields from a registry of objects, the essence of field injection."),
    assignments: [
      task("Write a method that prints every getter (a public no-argument method starting with 'get' or 'is') of any object together with its value.", "Filter public methods by name and parameter count and invoke them.", code`
static void dump(Object o) throws Exception {
    for (Method m : o.getClass().getMethods()) {
        boolean getter = (m.getName().startsWith("get") || m.getName().startsWith("is"))
            && m.getParameterCount() == 0 && !m.getName().equals("getClass");
        if (getter) System.out.println(m.getName() + " = " + m.invoke(o));
    }
}
`),
      task("Explain the three retention policies with a standard annotation for each.", "SOURCE annotations are discarded by the compiler after it uses them, e.g. @Override and @SuppressWarnings. CLASS annotations are stored in the .class file but not loaded at run time (the default), used by bytecode tools. RUNTIME annotations are kept and readable through reflection, e.g. @Deprecated, JUnit's @Test, JPA's @Entity and Spring's @Component."),
      task("List three drawbacks of reflection and how frameworks reduce them.", "1. Performance: reflective calls and lookups are slower; frameworks cache Method/Field objects or use MethodHandles and generated bytecode. 2. Lost compile-time safety: typos in names fail at run time; frameworks validate configuration at start-up. 3. Broken encapsulation: private members can be changed; the module system restricts setAccessible unless packages are opened, and frameworks increasingly use annotation processing at compile time (e.g. Micronaut, Dagger) instead."),
    ],
    alternates: [
      alt("MethodHandles for faster reflective calls", "A MethodHandle is looked up once and then invoked almost as fast as a direct call.", "Handles.java", code`
import java.lang.invoke.*;

MethodHandle length = MethodHandles.lookup()
    .findVirtual(String.class, "length", MethodType.methodType(int.class));
int n = (int) length.invokeExact("reflection");   // 10
`),
      alt("Compile-time annotation processing instead of run-time reflection", "Annotation processors generate code during compilation (Lombok, MapStruct, Dagger), so there is no reflection cost at run time.", "Mapper.java", code`
@Mapper
public interface ProductMapper {
    ProductDto toDto(Product product);   // MapStruct generates the implementation at compile time
}
`),
    ],
  },

  networking: {
    steps: [
      "Java networking lives in java.net: InetAddress (IP addresses), URI/URL, Socket and ServerSocket (TCP), DatagramSocket (UDP), and since Java 11 the java.net.http HttpClient.",
      "TCP is connection-oriented and reliable: a ServerSocket accepts connections and each Socket gives an input and output stream; UDP sends independent datagrams without delivery guarantees.",
      "A server typically handles each accepted connection on its own thread (or with non-blocking NIO / virtual threads) so one slow client does not block others.",
      "HttpClient sends HTTP/1.1 and HTTP/2 requests synchronously (send) or asynchronously (sendAsync, returning a CompletableFuture), with timeouts, redirects and body handlers.",
      "Always set connect and request timeouts; a call without a timeout can hang forever.",
      "URI parses and builds addresses safely (scheme, host, port, path, query); encode query values with URLEncoder.",
      "For quick HTTP servers and test stubs the JDK includes com.sun.net.httpserver.HttpServer; production services use a framework such as Spring Boot or Netty.",
    ],
    syntax: syntax("Networking.java", code`
// HTTP client (Java 11+)
HttpClient client = HttpClient.newBuilder()
    .connectTimeout(Duration.ofSeconds(5))
    .followRedirects(HttpClient.Redirect.NORMAL)
    .build();
HttpRequest request = HttpRequest.newBuilder(URI.create("https://api.example.com/items?page=1"))
    .header("Accept", "application/json")
    .timeout(Duration.ofSeconds(10))
    .GET()
    .build();
HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
response.statusCode(); response.body();
client.sendAsync(request, HttpResponse.BodyHandlers.ofString()).thenApply(HttpResponse::body);

// TCP
try (ServerSocket server = new ServerSocket(5000);
     Socket client = server.accept()) { ... }
try (Socket s = new Socket("localhost", 5000)) {
    s.getOutputStream(); s.getInputStream();
}
`, [
      "Port 0 asks the operating system for any free port, ideal for tests.",
      "Close sockets and streams with try-with-resources.",
      "HttpClient is immutable and thread-safe: create one and reuse it.",
      "Use HttpRequest.BodyPublishers.ofString(json) for POST bodies.",
    ]),
    example: ex("A local HTTP server and a Java 11 HttpClient", "Main.java", code`
import com.sun.net.httpserver.HttpServer;
import java.net.InetSocketAddress;
import java.net.URI;
import java.net.http.*;
import java.nio.charset.StandardCharsets;
import java.time.Duration;

public class Main {
    public static void main(String[] args) throws Exception {
        HttpServer server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);   // any free port
        server.createContext("/greet", exchange -> {
            String query = exchange.getRequestURI().getQuery();          // name=Asha
            byte[] body = ("Hello, " + query.substring(5) + "!").getBytes(StandardCharsets.UTF_8);
            exchange.getResponseHeaders().add("Content-Type", "text/plain; charset=utf-8");
            exchange.sendResponseHeaders(200, body.length);
            exchange.getResponseBody().write(body);
            exchange.close();
        });
        server.start();
        int port = server.getAddress().getPort();

        HttpClient client = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(2)).build();
        HttpRequest request = HttpRequest.newBuilder(URI.create("http://127.0.0.1:" + port + "/greet?name=Asha"))
            .timeout(Duration.ofSeconds(2)).build();
        HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
        System.out.println(response.statusCode() + " " + response.headers().firstValue("Content-Type").orElse(""));
        System.out.println(response.body());
        server.stop(0);
    }
}
`, code`
200 text/plain; charset=utf-8
Hello, Asha!
`, "The JDK's built-in server listens on a free local port, and HttpClient calls it with explicit timeouts. Everything runs in one program, so no internet connection is needed."),
    simple: ex("Taking a URI apart and encoding a query", "Main.java", code`
import java.net.URI;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

public class Main {
    public static void main(String[] args) {
        URI uri = URI.create("https://shop.example.in:8443/search/books?q=java&page=2#results");
        System.out.println("scheme=" + uri.getScheme() + " host=" + uri.getHost() + " port=" + uri.getPort());
        System.out.println("path=" + uri.getPath() + " query=" + uri.getQuery() + " fragment=" + uri.getFragment());

        String term = "C++ & Java";
        String encoded = URLEncoder.encode(term, StandardCharsets.UTF_8);
        System.out.println("encoded: " + encoded);
        System.out.println(uri.resolve("/cart?add=" + encoded));
    }
}
`, code`
scheme=https host=shop.example.in port=8443
path=/search/books query=q=java&page=2 fragment=results
encoded: C%2B%2B+%26+Java
https://shop.example.in:8443/cart?add=C%2B%2B+%26+Java
`, "URI splits an address into its parts without any network access. URLEncoder makes values safe inside a query string: + becomes %2B, & becomes %26 and spaces become +."),
    moderate: ex("A TCP echo server and client with sockets", "Main.java", code`
import java.io.*;
import java.net.ServerSocket;
import java.net.Socket;
import java.nio.charset.StandardCharsets;

public class Main {
    public static void main(String[] args) throws Exception {
        try (ServerSocket server = new ServerSocket(0)) {                 // any free port
            Thread serverThread = new Thread(() -> {
                try (Socket socket = server.accept();
                     BufferedReader in = new BufferedReader(new InputStreamReader(socket.getInputStream(), StandardCharsets.UTF_8));
                     PrintWriter out = new PrintWriter(new OutputStreamWriter(socket.getOutputStream(), StandardCharsets.UTF_8), true)) {
                    String line;
                    while ((line = in.readLine()) != null && !line.equals("bye")) out.println("echo: " + line.toUpperCase());
                    out.println("closing");
                } catch (IOException e) {
                    System.out.println("server error: " + e.getMessage());
                }
            });
            serverThread.start();

            try (Socket client = new Socket("127.0.0.1", server.getLocalPort());
                 PrintWriter out = new PrintWriter(new OutputStreamWriter(client.getOutputStream(), StandardCharsets.UTF_8), true);
                 BufferedReader in = new BufferedReader(new InputStreamReader(client.getInputStream(), StandardCharsets.UTF_8))) {
                for (String msg : new String[]{"hello", "sockets", "bye"}) {
                    out.println(msg);
                    System.out.println(in.readLine());
                }
            }
            serverThread.join();
        }
    }
}
`, code`
echo: HELLO
echo: SOCKETS
closing
`, "The server thread accepts one connection and answers line by line; the client writes a line and reads the reply. readLine returns null when the other side closes the connection, ending the loop."),
    complex: ex("A small JSON API: POST with a body and asynchronous calls", "Main.java", code`
import com.sun.net.httpserver.HttpServer;
import java.io.IOException;
import java.net.InetSocketAddress;
import java.net.URI;
import java.net.http.*;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.stream.Collectors;

public class Main {
    public static void main(String[] args) throws Exception {
        AtomicInteger nextId = new AtomicInteger(100);
        HttpServer server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        server.createContext("/orders", exchange -> {
            String method = exchange.getRequestMethod();
            String reply;
            int status;
            if (method.equals("POST")) {
                String body = new String(exchange.getRequestBody().readAllBytes(), StandardCharsets.UTF_8);
                status = body.contains("\"item\"") ? 201 : 400;
                reply = status == 201 ? "{\"id\":" + nextId.incrementAndGet() + "}" : "{\"error\":\"item required\"}";
            } else {
                status = 405;
                reply = "{\"error\":\"method not allowed\"}";
            }
            send(exchange, status, reply);
        });
        server.start();
        String base = "http://127.0.0.1:" + server.getAddress().getPort() + "/orders";
        HttpClient client = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(2)).build();

        // Three orders sent concurrently with sendAsync, results collected in order
        List<CompletableFuture<String>> calls = List.of("{\"item\":\"Pen\"}", "{\"item\":\"Book\"}", "{}").stream()
            .map(json -> HttpRequest.newBuilder(URI.create(base))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(json)).build())
            .map(req -> client.sendAsync(req, HttpResponse.BodyHandlers.ofString())
                .thenApply(res -> res.statusCode() + " " + (res.body().contains("id") ? "created" : res.body())))
            .collect(Collectors.toList());
        for (CompletableFuture<String> call : calls) System.out.println(call.join());

        HttpResponse<String> get = client.send(HttpRequest.newBuilder(URI.create(base)).GET().build(), HttpResponse.BodyHandlers.ofString());
        System.out.println(get.statusCode() + " " + get.body());
        System.out.println("orders created: " + (nextId.get() - 100));
        server.stop(0);
    }

    static void send(com.sun.net.httpserver.HttpExchange exchange, int status, String json) throws IOException {
        byte[] bytes = json.getBytes(StandardCharsets.UTF_8);
        exchange.getResponseHeaders().add("Content-Type", "application/json");
        exchange.sendResponseHeaders(status, bytes.length);
        exchange.getResponseBody().write(bytes);
        exchange.close();
    }
}
`, code`
201 created
201 created
400 {"error":"item required"}
405 {"error":"method not allowed"}
orders created: 2
`, "sendAsync fires the three POSTs without waiting for each other; join collects the results in the original order. The server answers with proper status codes (201 Created, 400 Bad Request, 405 Method Not Allowed) and JSON bodies, and the atomic counter assigns ids safely across concurrent requests."),
    assignments: [
      task("Write a method that fetches a URL with HttpClient and returns the body, failing if the status is not 2xx or the call takes longer than 5 seconds.", "Set both the connect timeout and the request timeout, and check the status code.", code`
static String fetch(HttpClient client, String url) throws Exception {
    HttpRequest req = HttpRequest.newBuilder(URI.create(url)).timeout(Duration.ofSeconds(5)).build();
    HttpResponse<String> res = client.send(req, HttpResponse.BodyHandlers.ofString());
    if (res.statusCode() / 100 != 2) throw new IOException("HTTP " + res.statusCode() + " for " + url);
    return res.body();
}
`),
      task("Compare TCP and UDP and name one application suited to each.", "TCP sets up a connection and guarantees ordered, reliable delivery with flow and congestion control; it suits web pages, APIs, file transfer and databases. UDP sends independent datagrams with no connection, ordering or delivery guarantee, but with less overhead and latency; it suits live video/voice, online games, DNS lookups and metrics where a lost packet is better than a late one."),
      task("Why does a simple ServerSocket loop that calls accept() and then handles the client in the same thread scale badly, and how do you fix it?", "While the single thread is reading from one client, no other connection can be accepted or served, so one slow client blocks everyone. Hand each accepted socket to a thread pool (or a virtual thread per connection in Java 21), or use non-blocking NIO with a Selector (or a framework such as Netty) so few threads can serve many connections."),
    ],
    alternates: [
      alt("Spring's RestClient for calling APIs", "In Spring Boot 3.2+, RestClient gives a fluent API with message conversion to Java objects.", "Client.java", code`
RestClient rest = RestClient.create("https://api.example.com");
Order created = rest.post().uri("/orders")
    .contentType(MediaType.APPLICATION_JSON)
    .body(new NewOrder("Pen"))
    .retrieve()
    .body(Order.class);
`),
      alt("UDP with DatagramSocket", "For fire-and-forget messages, UDP needs no connection set-up.", "Udp.java", code`
try (DatagramSocket socket = new DatagramSocket()) {
    byte[] data = "cpu=42".getBytes(StandardCharsets.UTF_8);
    socket.send(new DatagramPacket(data, data.length, InetAddress.getLoopbackAddress(), 8125));
}
`),
    ],
  },
};
