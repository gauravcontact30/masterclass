-- Third catalogue expansion, same shape as 0004/0006: technologies grouped by
-- `category` for the dashboard's <optgroup> rendering, topics scoped to
-- technology_id, and every topic's `references` pointing at the official
-- docs the generation prompt is grounded against. These titles are also
-- added to the landing page's marquee (components/landing-page.tsx) so every
-- scrolling technology opens a modal backed by real topics, not a dead click.
insert into public.technologies(id,title,title_hi,category) values
  ('cpp','C++','C++','Languages'),
  ('php','PHP','PHP','Languages'),
  ('ruby','Ruby','Ruby','Languages'),
  ('angular','Angular','Angular','Web development'),
  ('express','Express.js','Express.js','Web development'),
  ('redis','Redis','Redis','Data'),
  ('pytorch','PyTorch','PyTorch','AI tools'),
  ('tensorflow','TensorFlow','TensorFlow','AI tools'),
  ('firebase','Firebase','Firebase','Data'),
  ('aws','AWS fundamentals','AWS की बुनियाद','Tooling'),
  ('elasticsearch','Elasticsearch','Elasticsearch','Data'),
  ('github-actions','GitHub Actions','GitHub Actions','Tooling')
on conflict(id) do update set title=excluded.title,title_hi=excluded.title_hi,category=excluded.category;

insert into public.topics(id,technology_id,title,title_hi,full_track,"references") values
  ('cpp-full','cpp','Complete C++ path','पूरा C++ पाठ्यक्रम',true,'["https://en.cppreference.com/w/cpp/language.html"]'),
  ('cpp-basics','cpp','Types, pointers and references','Types, pointers और references',false,'["https://en.cppreference.com/w/cpp/language/reference.html"]'),
  ('cpp-oop','cpp','Classes and object-oriented C++','Classes और object-oriented C++',false,'["https://en.cppreference.com/w/cpp/language/classes.html"]'),
  ('cpp-memory','cpp','Memory management and smart pointers','Memory management और smart pointers',false,'["https://en.cppreference.com/w/cpp/memory.html"]'),
  ('cpp-stl','cpp','The Standard Template Library','Standard Template Library',false,'["https://en.cppreference.com/w/cpp/container.html"]'),

  ('php-full','php','Complete PHP path','पूरा PHP पाठ्यक्रम',true,'["https://www.php.net/manual/en/langref.php"]'),
  ('php-basics','php','Syntax, variables and control flow','सिंटैक्स, वेरिएबल और नियंत्रण प्रवाह',false,'["https://www.php.net/manual/en/language.basic-syntax.php"]'),
  ('php-functions','php','Functions and arrays','Functions और arrays',false,'["https://www.php.net/manual/en/language.functions.php"]'),
  ('php-oop','php','Object-oriented PHP','Object-oriented PHP',false,'["https://www.php.net/manual/en/language.oop5.php"]'),
  ('php-composer','php','Composer and packages','Composer और packages',false,'["https://getcomposer.org/doc/00-intro.md"]'),

  ('ruby-full','ruby','Complete Ruby path','पूरा Ruby पाठ्यक्रम',true,'["https://docs.ruby-lang.org/en/"]'),
  ('ruby-basics','ruby','Syntax and blocks','सिंटैक्स और blocks',false,'["https://docs.ruby-lang.org/en/master/syntax_rdoc.html"]'),
  ('ruby-classes','ruby','Classes and modules','Classes और modules',false,'["https://docs.ruby-lang.org/en/master/syntax/modules_and_classes_rdoc.html"]'),
  ('ruby-gems','ruby','Gems and bundler','Gems और bundler',false,'["https://guides.rubygems.org/what-is-a-gem/"]'),
  ('ruby-rails','ruby','Rails fundamentals','Rails की बुनियाद',false,'["https://guides.rubyonrails.org/getting_started.html"]'),

  ('angular-full','angular','Complete Angular path','पूरा Angular पाठ्यक्रम',true,'["https://angular.dev/overview"]'),
  ('angular-components','angular','Components and templates','Components और templates',false,'["https://angular.dev/guide/components"]'),
  ('angular-signals','angular','Signals and reactivity','Signals और reactivity',false,'["https://angular.dev/guide/signals"]'),
  ('angular-routing','angular','Routing','Routing',false,'["https://angular.dev/guide/routing"]'),
  ('angular-forms','angular','Forms','Forms',false,'["https://angular.dev/guide/forms"]'),

  ('express-full','express','Complete Express.js path','पूरा Express.js पाठ्यक्रम',true,'["https://expressjs.com/en/guide/routing.html"]'),
  ('express-routing','express','Routing and middleware','Routing और middleware',false,'["https://expressjs.com/en/guide/using-middleware.html"]'),
  ('express-errors','express','Error handling','त्रुटि प्रबंधन',false,'["https://expressjs.com/en/guide/error-handling.html"]'),
  ('express-rest','express','Building REST APIs','REST API बनाना',false,'["https://expressjs.com/en/starter/basic-routing.html"]'),
  ('express-security','express','Security best practices','Security best practices',false,'["https://expressjs.com/en/advanced/best-practice-security.html"]'),

  ('redis-full','redis','Complete Redis path','पूरा Redis पाठ्यक्रम',true,'["https://redis.io/docs/latest/"]'),
  ('redis-datatypes','redis','Core data types','मुख्य data types',false,'["https://redis.io/docs/latest/develop/data-types/"]'),
  ('redis-caching','redis','Caching patterns','Caching patterns',false,'["https://redis.io/docs/latest/develop/use/patterns/"]'),
  ('redis-pubsub','redis','Pub/Sub messaging','Pub/Sub messaging',false,'["https://redis.io/docs/latest/develop/pubsub/"]'),
  ('redis-persistence','redis','Persistence and durability','Persistence और durability',false,'["https://redis.io/docs/latest/operate/oss_and_stack/management/persistence/"]'),

  ('pytorch-full','pytorch','Complete PyTorch path','पूरा PyTorch पाठ्यक्रम',true,'["https://pytorch.org/tutorials/beginner/basics/intro.html"]'),
  ('pytorch-tensors','pytorch','Tensors and autograd','Tensors और autograd',false,'["https://pytorch.org/tutorials/beginner/basics/tensorqs_tutorial.html"]'),
  ('pytorch-nn','pytorch','Building neural networks','Neural networks बनाना',false,'["https://pytorch.org/tutorials/beginner/basics/buildmodel_tutorial.html"]'),
  ('pytorch-training','pytorch','Training loops and optimization','Training loops और optimization',false,'["https://pytorch.org/tutorials/beginner/basics/optimization_tutorial.html"]'),
  ('pytorch-data','pytorch','Datasets and dataloaders','Datasets और dataloaders',false,'["https://pytorch.org/tutorials/beginner/basics/data_tutorial.html"]'),

  ('tensorflow-full','tensorflow','Complete TensorFlow path','पूरा TensorFlow पाठ्यक्रम',true,'["https://www.tensorflow.org/tutorials"]'),
  ('tensorflow-keras','tensorflow','Keras basics','Keras की बुनियाद',false,'["https://www.tensorflow.org/guide/keras"]'),
  ('tensorflow-tensors','tensorflow','Tensors and operations','Tensors और operations',false,'["https://www.tensorflow.org/guide/tensor"]'),
  ('tensorflow-training','tensorflow','Training and evaluation','Training और evaluation',false,'["https://www.tensorflow.org/guide/keras/training_with_built_in_methods"]'),
  ('tensorflow-data','tensorflow','tf.data pipelines','tf.data pipelines',false,'["https://www.tensorflow.org/guide/data"]'),

  ('firebase-full','firebase','Complete Firebase path','पूरा Firebase पाठ्यक्रम',true,'["https://firebase.google.com/docs/guides"]'),
  ('firebase-firestore','firebase','Firestore database','Firestore database',false,'["https://firebase.google.com/docs/firestore"]'),
  ('firebase-auth','firebase','Authentication','Authentication',false,'["https://firebase.google.com/docs/auth"]'),
  ('firebase-hosting','firebase','Hosting and deployment','Hosting और deployment',false,'["https://firebase.google.com/docs/hosting"]'),
  ('firebase-functions','firebase','Cloud Functions','Cloud Functions',false,'["https://firebase.google.com/docs/functions"]'),

  ('aws-full','aws','Complete AWS fundamentals path','पूरा AWS पाठ्यक्रम',true,'["https://docs.aws.amazon.com/whitepapers/latest/aws-overview/introduction.html"]'),
  ('aws-ec2','aws','Compute with EC2','EC2 से compute',false,'["https://docs.aws.amazon.com/ec2/latest/instancetypes/instance-types.html"]'),
  ('aws-s3','aws','Storage with S3','S3 से storage',false,'["https://docs.aws.amazon.com/AmazonS3/latest/userguide/Welcome.html"]'),
  ('aws-lambda','aws','Serverless with Lambda','Lambda से serverless',false,'["https://docs.aws.amazon.com/lambda/latest/dg/welcome.html"]'),
  ('aws-iam','aws','IAM and security basics','IAM और security की बुनियाद',false,'["https://docs.aws.amazon.com/IAM/latest/UserGuide/introduction.html"]'),

  ('elasticsearch-full','elasticsearch','Complete Elasticsearch path','पूरा Elasticsearch पाठ्यक्रम',true,'["https://www.elastic.co/docs/solutions/search/get-started"]'),
  ('elasticsearch-indexing','elasticsearch','Indexing documents','Documents को index करना',false,'["https://www.elastic.co/docs/manage-data/data-store/index-basics"]'),
  ('elasticsearch-queries','elasticsearch','Query DSL','Query DSL',false,'["https://www.elastic.co/docs/explore-analyze/query-filter/languages/querydsl"]'),
  ('elasticsearch-aggregations','elasticsearch','Aggregations','Aggregations',false,'["https://www.elastic.co/docs/explore-analyze/query-filter/aggregations"]'),
  ('elasticsearch-mapping','elasticsearch','Mapping and analyzers','Mapping और analyzers',false,'["https://www.elastic.co/docs/manage-data/data-store/mapping"]'),

  ('github-actions-full','github-actions','Complete GitHub Actions path','पूरा GitHub Actions पाठ्यक्रम',true,'["https://docs.github.com/en/actions/writing-workflows/quickstart"]'),
  ('github-actions-workflows','github-actions','Workflow syntax','Workflow syntax',false,'["https://docs.github.com/en/actions/writing-workflows/workflow-syntax-for-github-actions"]'),
  ('github-actions-secrets','github-actions','Secrets and variables','Secrets और variables',false,'["https://docs.github.com/en/actions/security-for-github-actions/security-guides/using-secrets-in-github-actions"]'),
  ('github-actions-caching','github-actions','Caching dependencies','Dependencies को cache करना',false,'["https://docs.github.com/en/actions/writing-workflows/choosing-what-your-workflow-does/caching-dependencies-to-speed-up-workflows"]'),
  ('github-actions-cicd','github-actions','Building CI/CD pipelines','CI/CD pipelines बनाना',false,'["https://docs.github.com/en/actions/tutorials/build-and-test-code/nodejs"]')
on conflict(id) do update set technology_id=excluded.technology_id,title=excluded.title,title_hi=excluded.title_hi,full_track=excluded.full_track,"references"=excluded."references";
