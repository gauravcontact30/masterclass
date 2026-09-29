import { defineHandbook } from "./shared";

/**
 * Two boundaries every application has: the form a person fills in, and the
 * environment the process starts with.
 *
 * Both are places where untrusted or missing input becomes a runtime failure
 * far from its cause, and both are solved the same way — validate at the edge
 * and derive the types from the same schema.
 */
export const APP_FOUNDATION_HANDBOOKS = [
  defineHandbook("Conform - Validation libraries", "Progressively enhanced forms with schema validation, accessible errors and server integration.", "https://conform.guide/", {
    mechanism: "Conform builds on the platform's own form submission. It reads the FormData a browser would send anyway, validates it against a schema on the server, and returns errors keyed to field names — so the form works before JavaScript loads and improves after it does.",
    example: "A signup form validates with Zod on the server and the same schema on the client. With scripting disabled the browser posts, the server re-renders with errors attached to the right inputs; with scripting enabled the same errors appear without a round trip.",
    pitfall: "Client validation is a convenience, never the check that counts. A schema that runs only in the browser is bypassed by a direct post, so the server must validate the same submission independently.",
  }, {
    "Form fundamentals": [
      ["useForm", "Create a form whose state derives from the last submission result.", [
        "Form state is derived from the last submission result rather than kept separately.",
        "Because the result is the source, a server round trip and a client check produce the same render.",
        "It returns the form and field metadata together, so nothing is wired by hand.",
      ]],
      ["Field metadata", "Read a field's name, id, errors and validation attributes from one object.", [
        "One object carries a field's name, id, errors and validation attributes.",
        "Spreading it onto an input is what links the label, the control and the message.",
        "Reading the id from it is what keeps aria-describedby pointing at the real element.",
      ]],
      ["Progressive enhancement", "Keep the form working as a plain HTML submission.", [
        "The form posts and works before any script has loaded.",
        "Scripting improves the same form rather than replacing how it submits.",
        "A control that only works through a click handler is the part that breaks without it.",
      ]],
      ["FormData parsing", "Turn a submission into a typed object with nested and repeated fields.", [
        "A flat FormData is turned into a typed object with nesting and repetition restored.",
        "Bracketed names are what encode structure the browser itself cannot express.",
        "Every value arrives as a string, so parsing is where types re-enter.",
      ]],
      ["Validation timing", "Validate on blur, on input or on submit per field.", [
        "Per-field timing decides whether a message appears on blur, on input or on submit.",
        "Validating on input as a field is first typed reports an error before it can be right.",
        "Timing is per field, so a slow async check need not run on every keystroke.",
      ]],
      ["Accessible errors", "Associate messages with inputs so assistive technology announces them.", [
        "A message is associated with its input so assistive technology announces it.",
        "Colour alone marks an error for sighted users and for nobody else.",
        "Moving focus to the first invalid field is what makes a long form recoverable.",
      ]],
    ],
    "Schema integration": [
      ["Zod integration", "Parse and validate a submission with a Zod schema on both sides.", [
        "One Zod schema validates the submission on the server and the client.",
        "Issue paths map onto field names, which is what puts a message on the right input.",
        "Sharing the schema keeps the two sides from drifting apart silently.",
      ]],
      ["Valibot and Yup", "Use an alternative schema library through the matching adapter.", [
        "An adapter lets an alternative schema library produce the same result shape.",
        "Only the adapter changes; the form code above it does not.",
        "Libraries differ on coercion and optionality, which shows up as different errors.",
      ]],
      ["Shared schemas", "Define the shape once and reuse it for the form and the API.", [
        "The shape is defined once and reused by the form and the API.",
        "A single definition is what stops the endpoint accepting what the form rejects.",
        "Only the schema is shared; messages can still be written per surface.",
      ]],
      ["Coercion", "Convert string form values into numbers, dates and booleans safely.", [
        "Form values arrive as strings, so numbers, dates and booleans need converting.",
        "An unchecked checkbox sends nothing at all rather than a false value.",
        "Coercing before validating is what stops a valid number failing as a string.",
      ]],
      ["Conditional schemas", "Require a field only when another value makes it relevant.", [
        "A field becomes required only when another value makes it relevant.",
        "The condition belongs in the schema so the server enforces it too.",
        "A hidden field that is still required is a form nobody can submit.",
      ]],
      ["Async validation", "Check uniqueness against a server without blocking every keystroke.", [
        "A uniqueness check reaches the server without running on every keystroke.",
        "Debouncing is what keeps one check per pause rather than one per character.",
        "The async result must be re-checked on submit, because it can go stale.",
      ]],
    ],
    "Complex forms": [
      ["Nested objects", "Model grouped fields and read their errors at the right level.", [
        "Grouped fields are addressed by path, and their errors read at that level.",
        "An error on the group is not the same as an error on a field inside it.",
        "The path in the name is what lets the server return errors to the right place.",
      ]],
      ["Field lists", "Add, remove and reorder repeating rows with the form's intent API.", [
        "Rows are added, removed and reordered through the intent API rather than local state.",
        "Intent keeps the list working when scripting is unavailable.",
        "Keying rows by index makes a removal renumber every row after it.",
      ]],
      ["Intent buttons", "Drive an action other than submit from within the same form.", [
        "A button can drive an action other than submit from inside the same form.",
        "The intent travels in the submission, so the server knows which action was meant.",
        "One form can hold several intents without a second form element.",
      ]],
      ["File inputs", "Validate uploads by type and size before accepting them.", [
        "Type and size are checked before an upload is accepted.",
        "The client check is a courtesy; the server still receives whatever is sent.",
        "A file input needs the right encoding type or the file never arrives.",
      ]],
      ["Multi-step forms", "Carry state across steps and validate each one independently.", [
        "Each step validates on its own while state carries across the whole flow.",
        "Validating only at the end makes a user correct errors they made three screens ago.",
        "The final submit must re-validate everything, not trust the earlier steps.",
      ]],
      ["Default values", "Populate a form from existing data and detect what changed.", [
        "A form is populated from existing data and reports what actually changed.",
        "Sending only changed fields is what avoids overwriting a concurrent edit.",
        "A default that is not in the schema is a value that never round-trips.",
      ]],
    ],
    "Server integration": [
      ["Server actions", "Handle a submission server-side and return a result the form can render.", [
        "The submission is handled server-side and returns a result the form renders.",
        "Returning the result rather than throwing is what keeps the errors renderable.",
        "The action runs on the server, so it may reach the database directly.",
      ]],
      ["Returning errors", "Map server-side failures back onto the fields that caused them.", [
        "A server-side failure is mapped back onto the field that caused it.",
        "A unique-constraint violation belongs on the field, not in a banner.",
        "An error with no field to attach to needs a form-level place to land.",
      ]],
      ["Redirect after success", "Avoid a resubmission on refresh after a successful write.", [
        "Redirecting after a successful write stops a refresh resubmitting it.",
        "Post-then-redirect is what keeps the back button from replaying the write.",
        "Redirecting before the write commits reports success that may not have happened.",
      ]],
      ["Framework adapters", "Integrate with Next.js, Remix or React Router.", [
        "An adapter connects the form to Next.js, Remix or React Router.",
        "Only submission and redirect handling differ; the schema does not.",
        "The adapter decides where the result comes from on a server render.",
      ]],
      ["Security", "Treat every submitted field as untrusted regardless of the client schema.", [
        "Every submitted field is untrusted no matter what the client schema said.",
        "A direct post never runs the client validation at all.",
        "Accepting fields the schema does not name is how extra values reach the database.",
      ]],
      ["Testing", "Test a submission with scripting disabled as well as enabled.", [
        "The form is tested with scripting disabled as well as enabled.",
        "Only the scriptless path proves the progressive enhancement actually works.",
        "Asserting on the rendered message catches a break the schema test cannot.",
      ]],
    ],
  }),

  defineHandbook("T3 environment", "Validated, type-safe environment variables split cleanly between server and client.", "https://env.t3.gg/docs/introduction", {
    mechanism: "Environment variables are parsed against a schema at startup and split into server and client groups. The client group must carry the framework's public prefix, and reading a server variable from client code is a build-time error rather than undefined at runtime.",
    example: "DATABASE_URL is declared as a server variable and NEXT_PUBLIC_APP_URL as a client one. A missing DATABASE_URL fails the build with a named error, and importing it into a client component fails to compile instead of shipping undefined.",
    pitfall: "Bundlers inline public variables at build time, so a value changed afterwards does not take effect and a secret that was ever given a public prefix is permanently in the bundle. Renaming it does not remove it from builds already shipped.",
  }, {
    "Defining the schema": [
      ["createEnv", "Declare server and client variables with their schemas in one place.", [
        "One createEnv call returns the object the whole application imports.",
        "Server and client keys are declared in separate blocks of the same call.",
        "Validation runs once at module load, so a bad value stops the process early.",
      ]],
      ["Server variables", "Keep secrets in a group the client bundle cannot import.", [
        "Server keys stay out of the client bundle and carry no public prefix.",
        "Importing one from a client component is a build error, not undefined at runtime.",
        "Database URLs, API secrets and signing keys belong in this group.",
      ]],
      ["Client variables", "Expose only values that are safe to publish, with the required prefix.", [
        "Every client key must start with the framework's public prefix.",
        "The prefix is what tells the bundler the value may be inlined.",
        "Assume anything declared here is readable by any visitor to the site.",
      ]],
      ["Shared variables", "Declare values both sides legitimately need, such as NODE_ENV.", [
        "A shared key validates once and is available to both halves of the app.",
        "The runtime mode and a public application name are the usual members.",
        "A value needing a secret half and a public half is two variables, not one.",
      ]],
      ["runtimeEnv mapping", "Map each key explicitly so bundler inlining works.", [
        "List each key against its literal process.env reference explicitly.",
        "Bundlers only inline a literal property access, never a computed lookup.",
        "A key missing from the map passes in development and fails in the build.",
      ]],
      ["Type inference", "Consume validated values with types derived from the schema.", [
        "The returned object is typed from the schemas, so keys autocomplete.",
        "A renamed variable surfaces as a type error at every place that reads it.",
        "Consumers read the validated object instead of reaching for process.env.",
      ]],
    ],
    "Validation rules": [
      ["Required versus optional", "Fail fast on a missing requirement instead of defaulting silently.", [
        "A required key with no value aborts startup with its name in the message.",
        "Mark a key optional only when the code has a real path for its absence.",
        "An empty string counts as present, so reject it in the schema if it is not valid.",
      ]],
      ["Defaults", "Supply a default only where one is genuinely safe.", [
        "A default hides a misconfiguration, so keep them to development conveniences.",
        "Never default a credential, an endpoint or anything environment-specific.",
        "A default port or log level is safe because being wrong is immediately visible.",
      ]],
      ["Format validation", "Constrain a URL, port or enum rather than accepting any string.", [
        "Parse a URL as a URL so a typo fails at boot rather than at first request.",
        "Constrain a mode or a region to an enum of the values the code actually handles.",
        "Bound a port or a timeout to a numeric range instead of accepting any integer.",
      ]],
      ["Transformations", "Coerce a string into a number or boolean at the boundary.", [
        "Every environment value arrives as a string and needs coercion before use.",
        "Coerce once at the boundary so no call site parses the same value again.",
        "Map the literal strings true and false rather than trusting a truthiness check.",
      ]],
      ["Cross-field refinement", "Require one variable only when another has a particular value.", [
        "A refinement can require a second key only when the first has a given value.",
        "Express rules such as: if email sending is enabled, the API key is required.",
        "Refinements run after each field parses, so a message can name both keys.",
      ]],
      ["Error messages", "Report which variable is wrong and what was expected.", [
        "Report every invalid key in one pass instead of stopping at the first.",
        "Name the variable and the expected shape so the fix needs no source reading.",
        "Keep the offending value out of the message, because it may be a secret.",
      ]],
    ],
    "Build & deployment": [
      ["Skipping validation", "Bypass checks for a container build that has no secrets, deliberately.", [
        "A skip flag lets a container image build without production secrets present.",
        "Skipping belongs to the build step only; the running process still validates.",
        "Leaving the flag on in a deploy turns a startup failure into a runtime one.",
      ]],
      ["Framework presets", "Use the preset matching Next.js, Nuxt, Astro or another target.", [
        "A preset supplies the public prefix and runtime mapping a framework expects.",
        "The Next.js preset knows its public prefix and wires the runtime map for you.",
        "Without a preset the prefix rule has to be restated by hand in every project.",
      ]],
      ["Monorepo usage", "Share one environment definition across packages.", [
        "Define the environment once in a package that every app imports.",
        "Each app extends the shared definition with the keys only it needs.",
        "One definition keeps two services from drifting on the meaning of a key name.",
      ]],
      ["CI configuration", "Provide the variables a build needs without leaking them to logs.", [
        "Inject values as masked secrets rather than as a committed file.",
        "Printing the environment in a debug step leaks every secret into the log.",
        "Give the build only the keys it compiles with; runtime keys can stay out.",
      ]],
      ["Per-environment values", "Keep development, preview and production configuration separate.", [
        "Development, preview and production each supply their own values for one schema.",
        "Preview deployments should point at throwaway data, never at production stores.",
        "Sharing the schema means a newly added key is remembered in every environment.",
      ]],
      ["Secret rotation", "Change a secret without a deploy that briefly has neither value.", [
        "Accept both the old and the new secret during the overlap window.",
        "A public value is inlined at build time, so rotating one requires a rebuild.",
        "Remove the retired value only after every instance has restarted on the new one.",
      ]],
    ],
  }),
];
