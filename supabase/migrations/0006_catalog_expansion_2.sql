-- Second catalogue expansion: today's most in-demand stacks beyond the web/
-- languages/testing/AI/data/tooling core added in 0004. Same shape as that
-- migration — technologies group by `category` for the dashboard's <optgroup>
-- rendering, topics hang off technology_id, and every topic's `references`
-- point at the official docs the generation prompt is grounded against.
insert into public.technologies(id,title,title_hi,category) values
  ('go','Go','Go','Languages'),
  ('rust','Rust','Rust','Languages'),
  ('kotlin','Kotlin','Kotlin','Mobile'),
  ('swift','Swift','Swift','Mobile'),
  ('flutter','Flutter','Flutter','Mobile'),
  ('vue','Vue.js','Vue.js','Web development'),
  ('graphql','GraphQL','GraphQL','Web development'),
  ('mongodb','MongoDB','MongoDB','Data'),
  ('kubernetes','Kubernetes','Kubernetes','Tooling'),
  ('langchain','LangChain','LangChain','AI tools')
on conflict(id) do update set title=excluded.title,title_hi=excluded.title_hi,category=excluded.category;

insert into public.topics(id,technology_id,title,title_hi,full_track,"references") values
  ('go-full','go','Complete Go path','पूरा Go पाठ्यक्रम',true,'["https://go.dev/doc/tutorial/getting-started"]'),
  ('go-basics','go','Syntax, types and control flow','सिंटैक्स, टाइप और नियंत्रण प्रवाह',false,'["https://go.dev/tour/basics/1"]'),
  ('go-concurrency','go','Goroutines and channels','Goroutines और channels',false,'["https://go.dev/tour/concurrency/1"]'),
  ('go-modules','go','Modules and packages','Modules और packages',false,'["https://go.dev/doc/modules/managing-dependencies"]'),
  ('go-errors','go','Error handling','त्रुटि प्रबंधन',false,'["https://go.dev/blog/error-handling-and-go"]'),

  ('rust-full','rust','Complete Rust path','पूरा Rust पाठ्यक्रम',true,'["https://doc.rust-lang.org/book/"]'),
  ('rust-ownership','rust','Ownership and borrowing','Ownership और borrowing',false,'["https://doc.rust-lang.org/book/ch04-00-understanding-ownership.html"]'),
  ('rust-types','rust','Structs, enums and pattern matching','Structs, enums और pattern matching',false,'["https://doc.rust-lang.org/book/ch06-00-enums.html"]'),
  ('rust-errors','rust','Error handling with Result','Result से त्रुटि प्रबंधन',false,'["https://doc.rust-lang.org/book/ch09-00-error-handling.html"]'),
  ('rust-cargo','rust','Cargo and crates','Cargo और crates',false,'["https://doc.rust-lang.org/cargo/getting-started/index.html"]'),

  ('kotlin-full','kotlin','Complete Kotlin path','पूरा Kotlin पाठ्यक्रम',true,'["https://kotlinlang.org/docs/getting-started.html"]'),
  ('kotlin-basics','kotlin','Syntax and null safety','सिंटैक्स और null safety',false,'["https://kotlinlang.org/docs/null-safety.html"]'),
  ('kotlin-coroutines','kotlin','Coroutines','Coroutines',false,'["https://kotlinlang.org/docs/coroutines-overview.html"]'),
  ('kotlin-classes','kotlin','Classes and data classes','Classes और data classes',false,'["https://kotlinlang.org/docs/data-classes.html"]'),
  ('kotlin-android','kotlin','Kotlin for Android','Android के लिए Kotlin',false,'["https://developer.android.com/kotlin"]'),

  ('swift-full','swift','Complete Swift path','पूरा Swift पाठ्यक्रम',true,'["https://www.swift.org/documentation/tspl/"]'),
  ('swift-basics','swift','Types, optionals and control flow','Types, optionals और नियंत्रण प्रवाह',false,'["https://www.swift.org/documentation/tspl/thebasics"]'),
  ('swift-closures','swift','Functions and closures','Functions और closures',false,'["https://www.swift.org/documentation/tspl/closures"]'),
  ('swift-structs','swift','Structs and classes','Structs और classes',false,'["https://www.swift.org/documentation/tspl/classesandstructures"]'),
  ('swiftui','swift','SwiftUI basics','SwiftUI की बुनियाद',false,'["https://developer.apple.com/tutorials/swiftui"]'),

  ('flutter-full','flutter','Complete Flutter path','पूरा Flutter पाठ्यक्रम',true,'["https://docs.flutter.dev/get-started/codelab"]'),
  ('flutter-widgets','flutter','Widgets and layout','Widgets और layout',false,'["https://docs.flutter.dev/ui/widgets/layout"]'),
  ('flutter-state','flutter','State management','State management',false,'["https://docs.flutter.dev/data-and-backend/state-mgmt/intro"]'),
  ('flutter-navigation','flutter','Navigation and routing','Navigation और routing',false,'["https://docs.flutter.dev/ui/navigation"]'),
  ('flutter-async','flutter','Async and futures','Async और futures',false,'["https://docs.flutter.dev/cookbook/networking/fetch-data"]'),

  ('vue-full','vue','Complete Vue.js path','पूरा Vue.js पाठ्यक्रम',true,'["https://vuejs.org/guide/introduction.html"]'),
  ('vue-reactivity','vue','Reactivity fundamentals','Reactivity की बुनियाद',false,'["https://vuejs.org/guide/essentials/reactivity-fundamentals.html"]'),
  ('vue-components','vue','Components and props','Components और props',false,'["https://vuejs.org/guide/essentials/component-basics.html"]'),
  ('vue-composition','vue','Composition API','Composition API',false,'["https://vuejs.org/guide/extras/composition-api-faq.html"]'),
  ('vue-router','vue','Routing with Vue Router','Vue Router से routing',false,'["https://router.vuejs.org/guide/"]'),

  ('graphql-full','graphql','Complete GraphQL path','पूरा GraphQL पाठ्यक्रम',true,'["https://graphql.org/learn/"]'),
  ('graphql-schema','graphql','Schemas and types','Schemas और types',false,'["https://graphql.org/learn/schema/"]'),
  ('graphql-queries','graphql','Queries and mutations','Queries और mutations',false,'["https://graphql.org/learn/queries/"]'),
  ('graphql-resolvers','graphql','Resolvers','Resolvers',false,'["https://graphql.org/learn/execution/"]'),
  ('graphql-clients','graphql','Client-side GraphQL','Client-side GraphQL',false,'["https://graphql.org/community/tools-and-libraries/"]'),

  ('mongodb-full','mongodb','Complete MongoDB path','पूरा MongoDB पाठ्यक्रम',true,'["https://www.mongodb.com/docs/manual/tutorial/getting-started/"]'),
  ('mongodb-crud','mongodb','CRUD operations','CRUD operations',false,'["https://www.mongodb.com/docs/manual/crud/"]'),
  ('mongodb-schema','mongodb','Schema design','Schema design',false,'["https://www.mongodb.com/docs/manual/core/data-modeling-introduction/"]'),
  ('mongodb-aggregation','mongodb','Aggregation pipeline','Aggregation pipeline',false,'["https://www.mongodb.com/docs/manual/core/aggregation-pipeline/"]'),
  ('mongodb-indexes','mongodb','Indexes and performance','Indexes और performance',false,'["https://www.mongodb.com/docs/manual/indexes/"]'),

  ('kubernetes-full','kubernetes','Complete Kubernetes path','पूरा Kubernetes पाठ्यक्रम',true,'["https://kubernetes.io/docs/tutorials/kubernetes-basics/"]'),
  ('kubernetes-pods','kubernetes','Pods and deployments','Pods और deployments',false,'["https://kubernetes.io/docs/concepts/workloads/pods/"]'),
  ('kubernetes-services','kubernetes','Services and networking','Services और networking',false,'["https://kubernetes.io/docs/concepts/services-networking/service/"]'),
  ('kubernetes-config','kubernetes','ConfigMaps and secrets','ConfigMaps और secrets',false,'["https://kubernetes.io/docs/concepts/configuration/configmap/"]'),
  ('kubernetes-scaling','kubernetes','Scaling and rollouts','Scaling और rollouts',false,'["https://kubernetes.io/docs/concepts/workloads/controllers/deployment/"]'),

  ('langchain-full','langchain','Complete LangChain path','पूरा LangChain पाठ्यक्रम',true,'["https://python.langchain.com/docs/introduction/"]'),
  ('langchain-chains','langchain','Chains and runnables','Chains और runnables',false,'["https://python.langchain.com/docs/concepts/lcel/"]'),
  ('langchain-rag','langchain','Retrieval-augmented generation','Retrieval-augmented generation',false,'["https://python.langchain.com/docs/concepts/rag/"]'),
  ('langchain-agents','langchain','Agents and tools','Agents और tools',false,'["https://python.langchain.com/docs/concepts/agents/"]'),
  ('langchain-memory','langchain','Memory and state','Memory और state',false,'["https://python.langchain.com/docs/concepts/chat_history/"]')
on conflict(id) do update set technology_id=excluded.technology_id,title=excluded.title,title_hi=excluded.title_hi,full_track=excluded.full_track,"references"=excluded."references";
