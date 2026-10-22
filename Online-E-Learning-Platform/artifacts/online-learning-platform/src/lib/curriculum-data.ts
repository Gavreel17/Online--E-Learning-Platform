import type { SubjectItem, LessonItem, QuizItem, QuestionBankItem, QuizQuestionItem } from './platform-store';

export const DEFAULT_SUBJECTS: SubjectItem[] = [
  {
    id: 1,
    name: 'Database Management',
    code: 'DBMS101',
    description: 'Master relational database design, SQL querying, entity-relationship models, transaction management, and normalization principles.',
    instructor: 'Prof. Sarah Jenkins',
    instructorEmail: 'jenkins@lumenpath.edu',
    department: 'Database Systems',
    lessonCount: 8,
    quizCount: 1,
    progress: 25,
    status: 'published',
  },
  {
    id: 2,
    name: 'Web Development',
    code: 'WEB201',
    description: 'Modern frontend web development covering semantic HTML5 markup, responsive CSS3 styling, modern JavaScript, and website structure.',
    instructor: 'Dr. Eleanor Davies',
    instructorEmail: 'davies@lumenpath.edu',
    department: 'Web & Mobile Development',
    lessonCount: 6,
    quizCount: 1,
    progress: 15,
    status: 'published',
  },
  {
    id: 3,
    name: 'Programming',
    code: 'PROG101',
    description: 'Foundational computer science principles, variables, control flow, loops, functions, algorithms, and systematic problem-solving.',
    instructor: 'Dr. Robert Vance',
    instructorEmail: 'vance@lumenpath.edu',
    department: 'Computer Science',
    lessonCount: 6,
    quizCount: 1,
    progress: 30,
    status: 'published',
  },
  {
    id: 4,
    name: 'Computer Systems',
    code: 'CS101',
    description: 'Architecture of modern computing systems, hardware components, operating systems, memory hierarchy, system software, and peripheral I/O.',
    instructor: 'Engr. Marcus Sterling',
    instructorEmail: 'sterling@lumenpath.edu',
    department: 'Hardware & Computer Engineering',
    lessonCount: 5,
    quizCount: 1,
    progress: 0,
    status: 'published',
  },
];

export const DEFAULT_LESSONS: LessonItem[] = [
  // ==========================================
  // SUBJECT 1: Database Management (subject_id: 1)
  // ==========================================
  {
    id: 101,
    subjectId: 1,
    subjectName: 'Database Management',
    title: 'Introduction to Database Management Systems',
    description: 'Understand what a DBMS is, the critical advantages over flat files, and explore industry-standard relational database architectures.',
    lessonType: 'text',
    durationMinutes: 20,
    completed: false,
    progress: 0,
    published: true,
    objectives: [
      'Define what a Database Management System (DBMS) is and why modern applications depend on it',
      'Contrast DBMS advantages with traditional flat-file storage systems',
      'Understand the 3-tier ANSI-SPARC architecture of modern databases',
      'Recognize popular relational database management systems like PostgreSQL, MySQL, and SQLite',
    ],
    content: `
      <h2>1. What is a Database Management System (DBMS)?</h2>
      <p>A <strong>Database Management System (DBMS)</strong> is specialized software that provides an interface between end-users, software applications, and the physical database. It manages how data is stored, retrieved, updated, and secured.</p>
      
      <p>Before the widespread adoption of DBMS software, organizations stored records in flat files (such as spreadsheets, text files, or binary records). While simple, flat files present severe architectural limitations:</p>
      <ul>
        <li><strong>Data Redundancy and Inconsistency:</strong> The same information is duplicated in multiple files, causing discrepancies when records are updated in one place but not another.</li>
        <li><strong>Difficulty in Accessing Data:</strong> Fetching specific subsets of records requires writing bespoke search algorithms for each query.</li>
        <li><strong>Data Isolation:</strong> Records are scattered across disparate file formats.</li>
        <li><strong>Concurrent Access Anomalies:</strong> Multiple users modifying the same file concurrently can overwrite each other's changes or corrupt the file.</li>
        <li><strong>Security and Integrity Violations:</strong> Hard to enforce row-level or column-level permissions.</li>
      </ul>

      <h2>2. Core Advantages of a Relational DBMS</h2>
      <p>Modern relational DBMS engines (such as <strong>PostgreSQL, MySQL, SQLite, Oracle Database, and Microsoft SQL Server</strong>) resolve these challenges by providing:</p>
      <div style="background: rgba(15,118,110,0.06); padding: 16px; border-radius: 12px; margin: 16px 0; border-left: 4px solid #0f766e;">
        <h4 style="margin: 0 0 8px 0; color: #0f766e; font-weight: 700;">Key DBMS Capabilities</h4>
        <ul style="margin: 0; padding-left: 20px;">
          <li><strong>ACID Transaction Compliance:</strong> Guarantees Atomicity, Consistency, Isolation, and Durability.</li>
          <li><strong>Structured Query Language (SQL):</strong> A declarative language to express complex queries and transformations effortlessly.</li>
          <li><strong>High Concurrency:</strong> Multi-Version Concurrency Control (MVCC) enables thousands of simultaneous readers and writers.</li>
          <li><strong>Data Recovery & Backups:</strong> Write-Ahead Logging (WAL) ensures zero data loss during power outages or system crashes.</li>
        </ul>
      </div>

      <h2>3. The Three-Schema Architecture</h2>
      <p>To achieve physical and logical data independence, databases use three layers of abstraction:</p>
      <ol>
        <li><strong>Physical / Internal Level:</strong> Describes how data is physically stored on SSDs/disks (B-Trees, page layouts, block compression).</li>
        <li><strong>Conceptual / Logical Level:</strong> Defines entities, attributes, relationships, and business rules without detailing storage specifics.</li>
        <li><strong>External / View Level:</strong> Provides customized subsets of data for specific user personas or application endpoints.</li>
      </ol>
    `,
  },
  {
    id: 102,
    subjectId: 1,
    subjectName: 'Database Management',
    title: 'Database Concepts and Terminologies',
    description: 'Learn essential database building blocks: schemas, instances, data dictionaries, metadata, and data integrity constraints.',
    lessonType: 'text',
    durationMinutes: 25,
    completed: false,
    progress: 0,
    published: true,
    objectives: [
      'Distinguish between a database schema and a database instance',
      'Understand the role of the data dictionary and catalog metadata',
      'Categorize SQL commands into DDL, DML, DCL, and TCL',
      'Explain domain, entity, and referential integrity constraints',
    ],
    content: `
      <h2>1. Schema vs. Instance</h2>
      <p>In database engineering, distinguishing between the structure and its current content is critical:</p>
      <ul>
        <li><strong>Database Schema:</strong> The overall structural blueprint or skeleton of the database. It defines the tables, columns, constraints, and data types. A schema rarely changes once deployed to production.</li>
        <li><strong>Database Instance:</strong> The actual data and records stored in the database at a specific point in time. As users insert or modify records, the database instance changes continuously.</li>
      </ul>

      <h2>2. Metadata and the Data Dictionary</h2>
      <p><strong>Metadata</strong> is "data about data." It describes table names, column lengths, indexing methods, and access privileges. The database stores metadata in an internal repository called the <strong>Data Dictionary</strong> or <strong>System Catalog</strong> (for example, the <code>information_schema</code> in PostgreSQL and MySQL).</p>

      <h2>3. Database Sublanguages</h2>
      <div style="background: rgba(0,0,0,0.03); border: 1px solid rgba(0,0,0,0.1); border-radius: 12px; padding: 16px; margin: 16px 0;">
        <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 14px;">
          <thead>
            <tr style="border-bottom: 2px solid #ccc;">
              <th style="padding: 8px;">Category</th>
              <th style="padding: 8px;">Full Name</th>
              <th style="padding: 8px;">Key Commands</th>
              <th style="padding: 8px;">Purpose</th>
            </tr>
          </thead>
          <tbody>
            <tr style="border-bottom: 1px solid #eee;">
              <td style="padding: 8px; font-weight: bold;">DDL</td>
              <td style="padding: 8px;">Data Definition Language</td>
              <td style="padding: 8px;"><code>CREATE, ALTER, DROP, TRUNCATE</code></td>
              <td style="padding: 8px;">Modifies schema structures</td>
            </tr>
            <tr style="border-bottom: 1px solid #eee;">
              <td style="padding: 8px; font-weight: bold;">DML</td>
              <td style="padding: 8px;">Data Manipulation Language</td>
              <td style="padding: 8px;"><code>SELECT, INSERT, UPDATE, DELETE</code></td>
              <td style="padding: 8px;">Queries and modifies records</td>
            </tr>
            <tr style="border-bottom: 1px solid #eee;">
              <td style="padding: 8px; font-weight: bold;">DCL</td>
              <td style="padding: 8px;">Data Control Language</td>
              <td style="padding: 8px;"><code>GRANT, REVOKE</code></td>
              <td style="padding: 8px;">Manages permissions and security</td>
            </tr>
            <tr>
              <td style="padding: 8px; font-weight: bold;">TCL</td>
              <td style="padding: 8px;">Transaction Control Language</td>
              <td style="padding: 8px;"><code>COMMIT, ROLLBACK, SAVEPOINT</code></td>
              <td style="padding: 8px;">Manages transactional units of work</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2>4. Integrity Constraints</h2>
      <p>Constraints ensure that data entered into the database remains accurate, valid, and reliable:</p>
      <ul>
        <li><strong>Domain Integrity:</strong> Values in a column must conform to defined data types, nullability, or <code>CHECK</code> conditions.</li>
        <li><strong>Entity Integrity:</strong> Every table must have a primary key, and the primary key column cannot contain NULL values.</li>
        <li><strong>Referential Integrity:</strong> A foreign key value must match an existing primary key value in the referenced parent table or be explicitly NULL.</li>
      </ul>
    `,
  },
  {
    id: 103,
    subjectId: 1,
    subjectName: 'Database Management',
    title: 'Tables, Rows, and Columns',
    description: 'Explore relational table structures, attributes, records, data types, degree, and cardinality.',
    lessonType: 'text',
    durationMinutes: 20,
    completed: false,
    progress: 0,
    published: true,
    objectives: [
      'Understand relations, tuples, and attributes in relational algebra',
      'Select appropriate column data types and configure column constraints',
      'Calculate relation cardinality and relation degree',
      'Explain NULL values and three-valued logic in SQL',
    ],
    content: `
      <h2>1. The Structure of a Relation (Table)</h2>
      <p>In relational database theory originated by Edgar F. Codd, a database is a collection of relations:</p>
      <ul>
        <li><strong>Relation (Table):</strong> A two-dimensional grid of rows and columns representing an entity type (e.g., <code>students</code>, <code>courses</code>).</li>
        <li><strong>Tuple (Row / Record):</strong> A single horizontal occurrence or entry representing one specific instance of the entity.</li>
        <li><strong>Attribute (Column / Field):</strong> A named vertical column that stores a specific property of the entity across all rows.</li>
      </ul>

      <h2>2. Cardinality vs. Degree</h2>
      <div style="background: rgba(245,158,11,0.08); padding: 14px 18px; border-radius: 12px; margin: 16px 0; border-left: 4px solid #f59e0b;">
        <p style="margin: 0;"><strong>Cardinality:</strong> The total count of rows (tuples) present in the table.<br/>
        <strong>Degree (Arity):</strong> The total count of columns (attributes) defined in the table.</p>
      </div>

      <h2>3. Common SQL Column Data Types</h2>
      <pre style="background: #1e293b; color: #f8fafc; padding: 16px; border-radius: 12px; overflow-x: auto;"><code>CREATE TABLE students (
    student_id   SERIAL PRIMARY KEY,
    first_name   VARCHAR(50) NOT NULL,
    last_name    VARCHAR(50) NOT NULL,
    email        VARCHAR(120) UNIQUE NOT NULL,
    gpa          NUMERIC(3, 2) DEFAULT 0.00,
    enrolled_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active    BOOLEAN DEFAULT TRUE
);</code></pre>

      <h2>4. Understanding NULL in Relational Databases</h2>
      <p>In SQL, <code>NULL</code> does <em>not</em> mean zero (0), an empty string (<code>""</code>), or a whitespace character. <code>NULL</code> signifies the <strong>absence of a value</strong> or that the value is unknown. Because of this, SQL operates using <strong>three-valued logic (3VL)</strong>: True, False, and Unknown. Any comparison with NULL (e.g., <code>val = NULL</code>) evaluates to Unknown; you must always use <code>IS NULL</code> or <code>IS NOT NULL</code>.</p>
    `,
  },
  {
    id: 104,
    subjectId: 1,
    subjectName: 'Database Management',
    title: 'Primary Keys and Foreign Keys',
    description: 'Master candidate keys, primary keys, composite keys, and how foreign keys establish relational integrity between tables.',
    lessonType: 'text',
    durationMinutes: 25,
    completed: false,
    progress: 0,
    published: true,
    objectives: [
      'Select effective primary keys and identify candidate keys',
      'Implement composite keys for multi-attribute identification',
      'Create foreign key constraints linking child tables to parent tables',
      'Configure cascading delete and update actions',
    ],
    content: `
      <h2>1. The Family of Keys</h2>
      <p>Keys are columns used to identify and enforce relationships between records:</p>
      <ul>
        <li><strong>Super Key:</strong> Any set of one or more columns that uniquely identifies a row in a table.</li>
        <li><strong>Candidate Key:</strong> A minimal super key with no extraneous columns. Any candidate key can qualify to become the primary key.</li>
        <li><strong>Primary Key (PK):</strong> The chosen candidate key that uniquely and irrevocably identifies each record in the table. Must be unique and cannot contain NULL.</li>
        <li><strong>Alternate Key:</strong> Candidate keys that were not chosen as the primary key (typically given a <code>UNIQUE</code> constraint).</li>
        <li><strong>Composite Key:</strong> A primary key formed by combining two or more columns together when no single column is unique.</li>
      </ul>

      <h2>2. Foreign Keys (FK) and Referential Integrity</h2>
      <p>A <strong>Foreign Key</strong> is a column (or set of columns) in one table that references the Primary Key of another table. It enforces referential integrity so that you cannot insert a child record referencing a non-existent parent.</p>

      <pre style="background: #1e293b; color: #f8fafc; padding: 16px; border-radius: 12px; overflow-x: auto;"><code>-- Parent table
CREATE TABLE departments (
    dept_id SERIAL PRIMARY KEY,
    dept_name VARCHAR(100) NOT NULL
);

-- Child table with Foreign Key
CREATE TABLE instructors (
    instructor_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    dept_id INT NOT NULL,
    CONSTRAINT fk_instructor_dept
        FOREIGN KEY (dept_id)
        REFERENCES departments(dept_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);</code></pre>

      <h2>3. Referential Action Rules</h2>
      <p>When a record in the parent table is deleted or updated, the foreign key rule decides what happens to dependent child rows:</p>
      <ul>
        <li><code>CASCADE:</code> Automatically delete or update child rows when the parent row is deleted or updated.</li>
        <li><code>RESTRICT / NO ACTION:</code> Prevent deletion of the parent row if child rows still reference it.</li>
        <li><code>SET NULL:</code> Keep child rows, but set their foreign key column value to NULL.</li>
        <li><code>SET DEFAULT:</code> Reset the foreign key column in child rows to its default value.</li>
      </ul>
    `,
  },
  {
    id: 105,
    subjectId: 1,
    subjectName: 'Database Management',
    title: 'Entity-Relationship Diagrams (ERD)',
    description: 'Design conceptual and logical database models using Entity-Relationship Diagrams, cardinality notation, and relationship mapping.',
    lessonType: 'pdf',
    durationMinutes: 30,
    completed: false,
    progress: 0,
    published: true,
    objectives: [
      'Draw entities, attributes, and relationships using Crow\'s Foot notation',
      'Distinguish between One-to-One, One-to-Many, and Many-to-Many relationships',
      'Resolve Many-to-Many relationships using associative junction tables',
      'Map ERD components directly to normalized SQL schema definitions',
    ],
    content: `
      <h2>1. Purpose of Entity-Relationship Modeling</h2>
      <p>An <strong>Entity-Relationship Diagram (ERD)</strong> is a graphical representation that visualizes how entities (people, objects, concepts, or transactions) relate to one another in an application domain. It serves as the bridge between business requirements and physical database implementation.</p>

      <h2>2. Core ERD Components</h2>
      <ul>
        <li><strong>Entity:</strong> A definable real-world object or concept (e.g., <code>Student</code>, <code>Course</code>, <code>Order</code>). Drawn as a rectangle.</li>
        <li><strong>Weak Entity:</strong> An entity whose existence depends on another parent entity and cannot be uniquely identified by its own attributes alone (e.g., <code>Dependent</code> of an <code>Employee</code>).</li>
        <li><strong>Attributes:</strong> Characteristics of an entity (e.g., <code>student_name</code>, <code>date_of_birth</code>).</li>
        <li><strong>Relationships:</strong> How two or more entities interact (e.g., A student <em>enrolls in</em> a course).</li>
      </ul>

      <h2>3. Relationship Cardinality and Modality</h2>
      <p>Relationships are categorized by cardinality ratios:</p>
      <div style="background: rgba(15,118,110,0.06); padding: 16px; border-radius: 12px; margin: 16px 0; border: 1px solid rgba(15,118,110,0.2);">
        <ul style="margin: 0; padding-left: 20px;">
          <li><strong>One-to-One (1:1):</strong> E.g., A <code>User</code> has one <code>UserProfile</code>. The foreign key can reside on either table with a UNIQUE constraint.</li>
          <li><strong>One-to-Many (1:N):</strong> E.g., A <code>Department</code> employs many <code>Teachers</code>. The foreign key always goes on the "Many" side.</li>
          <li><strong>Many-to-Many (M:N):</strong> E.g., A <code>Student</code> enrolls in many <code>Courses</code>, and a <code>Course</code> has many <code>Students</code>. Cannot be represented directly with a single foreign key!</li>
        </ul>
      </div>

      <h2>4. Resolving Many-to-Many with Junction Tables</h2>
      <p>To implement an M:N relationship in a relational database, you must decompose it into two 1:N relationships using an <strong>Associative / Junction Table</strong>:</p>
      <pre style="background: #1e293b; color: #f8fafc; padding: 16px; border-radius: 12px; overflow-x: auto;"><code>CREATE TABLE enrollments (
    student_id  INT NOT NULL REFERENCES students(student_id) ON DELETE CASCADE,
    course_id   INT NOT NULL REFERENCES courses(course_id) ON DELETE CASCADE,
    enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    grade       VARCHAR(2),
    PRIMARY KEY (student_id, course_id) -- Composite Primary Key
);</code></pre>
    `,
  },
  {
    id: 106,
    subjectId: 1,
    subjectName: 'Database Management',
    title: 'SQL Basics',
    description: 'Get started with Structured Query Language (SQL): syntax rules, basic SELECT queries, WHERE filtering, and ORDER BY sorting.',
    lessonType: 'text',
    durationMinutes: 30,
    completed: false,
    progress: 0,
    published: true,
    objectives: [
      'Write syntactically correct SQL SELECT statements',
      'Filter datasets using comparison, logical, and wildcard operators in WHERE clauses',
      'Sort query result sets in ascending or descending order using ORDER BY',
      'Limit result sets and implement pagination with LIMIT and OFFSET',
    ],
    content: `
      <h2>1. The Structure of a SQL Query</h2>
      <p>SQL is a <strong>declarative language</strong>: you tell the database <em>what</em> data you want, and the database query planner determines <em>how</em> to retrieve it most efficiently using index scans or sequential scans.</p>

      <pre style="background: #1e293b; color: #f8fafc; padding: 16px; border-radius: 12px; overflow-x: auto;"><code>SELECT column1, column2, column3
FROM table_name
WHERE condition
ORDER BY column1 ASC
LIMIT 10;</code></pre>

      <h2>2. Filtering Records with WHERE Clauses</h2>
      <p>The <code>WHERE</code> clause extracts only those records that satisfy a specified criterion. SQL supports a rich set of operators:</p>
      <ul>
        <li><code>=, !=, &lt;, &gt;, &lt;=, &gt;=</code>: Standard equality and inequality comparisons.</li>
        <li><code>AND, OR, NOT</code>: Boolean operators to combine multiple conditions.</li>
        <li><code>IN (val1, val2, ...)</code>: Matches any value in a list of items.</li>
        <li><code>BETWEEN min AND max</code>: Matches values inclusive of both boundaries.</li>
        <li><code>LIKE 'pattern%'</code>: Pattern matching with wildcards (<code>%</code> matches any sequence of characters, <code>_</code> matches a single character).</li>
        <li><code>IS NULL / IS NOT NULL</code>: Checks for missing or undefined values.</li>
      </ul>

      <h2>3. Sample Queries and Output</h2>
      <pre style="background: #1e293b; color: #f8fafc; padding: 16px; border-radius: 12px; overflow-x: auto;"><code>-- Retrieve all active computer science students with a GPA over 3.5
SELECT student_id, first_name, last_name, gpa
FROM students
WHERE department = 'Computer Science' 
  AND gpa &gt; 3.5
  AND is_active = TRUE
ORDER BY gpa DESC, last_name ASC
LIMIT 5;</code></pre>

      <h2>4. Execution Order vs. Lexical Order</h2>
      <p>While queries are written starting with <code>SELECT</code>, the SQL engine executes them in a distinct logical order:</p>
      <ol>
        <li><code>FROM</code> (determines table sources)</li>
        <li><code>WHERE</code> (filters rows before aggregation)</li>
        <li><code>GROUP BY</code> (groups rows)</li>
        <li><code>HAVING</code> (filters grouped rows)</li>
        <li><code>SELECT</code> (projects expressions and aliases)</li>
        <li><code>ORDER BY</code> (sorts the projected output)</li>
        <li><code>LIMIT / OFFSET</code> (truncates output rows)</li>
      </ol>
    `,
  },
  {
    id: 107,
    subjectId: 1,
    subjectName: 'Database Management',
    title: 'SQL SELECT, INSERT, UPDATE, and DELETE',
    description: 'Perform full CRUD operations in SQL: inserting new records, querying with aggregations, modifying records, and executing safe deletions.',
    lessonType: 'text',
    durationMinutes: 35,
    completed: false,
    progress: 0,
    published: true,
    objectives: [
      'Insert single and multiple records using INSERT INTO',
      'Use aggregate functions (COUNT, SUM, AVG, MIN, MAX) with GROUP BY',
      'Update existing records safely without accidental mass-modifications',
      'Perform targeted record deletions and understand transaction rollbacks',
    ],
    content: `
      <h2>1. The Four Pillars of Data Manipulation (CRUD)</h2>
      <p>The core operations on database data correspond directly to CRUD (Create, Read, Update, Delete):</p>

      <h2>2. INSERT INTO (Create)</h2>
      <pre style="background: #1e293b; color: #f8fafc; padding: 16px; border-radius: 12px; overflow-x: auto;"><code>-- Insert a single record
INSERT INTO students (first_name, last_name, email, gpa)
VALUES ('Jordan', 'Lee', 'jordan.lee@lumenpath.edu', 3.85);

-- Insert multiple records in a single batch
INSERT INTO courses (course_code, course_title, credits)
VALUES 
    ('DBMS101', 'Database Management', 3),
    ('WEB201',  'Web Development',     3),
    ('PROG101', 'Programming Basics',  4);</code></pre>

      <h2>3. Aggregation and GROUP BY (Read)</h2>
      <pre style="background: #1e293b; color: #f8fafc; padding: 16px; border-radius: 12px; overflow-x: auto;"><code>-- Calculate average GPA and total students per department
SELECT department, 
       COUNT(*) AS total_students,
       ROUND(AVG(gpa), 2) AS average_gpa
FROM students
WHERE is_active = TRUE
GROUP BY department
HAVING COUNT(*) &gt;= 5
ORDER BY average_gpa DESC;</code></pre>

      <h2>4. UPDATE (Modify)</h2>
      <div style="background: rgba(239,68,68,0.08); padding: 14px 18px; border-radius: 12px; margin: 16px 0; border-left: 4px solid #ef4444;">
        <strong style="color: #b91c1c;">Caution:</strong> Always include a <code>WHERE</code> clause in your UPDATE statements. Omitting the WHERE clause will overwrite every single row in the table!
      </div>
      <pre style="background: #1e293b; color: #f8fafc; padding: 16px; border-radius: 12px; overflow-x: auto;"><code>UPDATE students
SET gpa = 3.92,
    last_updated = CURRENT_TIMESTAMP
WHERE student_id = 101;</code></pre>

      <h2>5. DELETE and Transactions</h2>
      <pre style="background: #1e293b; color: #f8fafc; padding: 16px; border-radius: 12px; overflow-x: auto;"><code>-- Safe execution within a transaction block
BEGIN;

DELETE FROM enrollments
WHERE student_id = 101 AND course_id = 'DBMS101';

-- Verify changes before finalizing
COMMIT; -- Or ROLLBACK; if an error occurred</code></pre>
    `,
  },
  {
    id: 108,
    subjectId: 1,
    subjectName: 'Database Management',
    title: 'Database Normalization',
    description: 'Eliminate data redundancy and update anomalies by applying First (1NF), Second (2NF), and Third (3NF) Normal Forms.',
    lessonType: 'text',
    durationMinutes: 35,
    completed: false,
    progress: 0,
    published: true,
    objectives: [
      'Identify insertion, deletion, and update anomalies in unnormalized schemas',
      'Convert tables into First Normal Form (1NF) by enforcing atomic values',
      'Convert tables into Second Normal Form (2NF) by eliminating partial dependencies',
      'Convert tables into Third Normal Form (3NF) by eliminating transitive dependencies',
    ],
    content: `
      <h2>1. The Problem of Data Anomalies</h2>
      <p>Poorly designed databases suffer from anomalies that compromise data integrity:</p>
      <ul>
        <li><strong>Insertion Anomaly:</strong> You cannot record an entity (e.g., a new course) without artificially creating a dummy entity (e.g., a dummy student).</li>
        <li><strong>Deletion Anomaly:</strong> Deleting one record inadvertently erases other critical information (e.g., deleting the last student in a class erases the course record entirely).</li>
        <li><strong>Update Anomaly:</strong> Redundant copies of data require updating multiple rows. If one row is missed, data becomes contradictory.</li>
      </ul>

      <h2>2. The Normalization Steps</h2>
      <div style="background: rgba(15,118,110,0.06); padding: 16px; border-radius: 12px; margin: 16px 0; border: 1px solid rgba(15,118,110,0.2);">
        <h4 style="margin: 0 0 10px 0; color: #0f766e; font-weight: 700;">Progression of Normal Forms</h4>
        <p style="margin: 0 0 8px 0;"><strong>First Normal Form (1NF):</strong> All attributes must contain atomic (indivisible) values. No repeating groups or comma-separated lists in a single cell. Each row must be uniquely identifiable.</p>
        <p style="margin: 0 0 8px 0;"><strong>Second Normal Form (2NF):</strong> Must be in 1NF, and all non-key columns must depend on the <em>entire</em> primary key. Eliminates partial functional dependencies on composite primary keys.</p>
        <p style="margin: 0;"><strong>Third Normal Form (3NF):</strong> Must be in 2NF, and no non-key column may depend on another non-key column. Eliminates transitive functional dependencies (e.g., <code>A → B → C</code>).</p>
      </div>

      <h2>3. Practical Normalization Walkthrough</h2>
      <p>Consider an unnormalized course enrollment table:</p>
      <pre style="background: #1e293b; color: #f8fafc; padding: 16px; border-radius: 12px; overflow-x: auto;"><code>-- Unnormalized:
[student_id, student_name, course_id, course_title, instructor_id, instructor_name, instructor_office]

-- Decomposed into 3NF:
Students:    (student_id [PK], student_name)
Instructors: (instructor_id [PK], instructor_name, instructor_office)
Courses:     (course_id [PK], course_title, instructor_id [FK])
Enrollments: (student_id [PK, FK], course_id [PK, FK], grade)</code></pre>
      <p>Notice how every non-key attribute now depends on the key, the whole key, and nothing but the key!</p>
    `,
  },

  // ==========================================
  // SUBJECT 2: Web Development (subject_id: 2)
  // ==========================================
  {
    id: 201,
    subjectId: 2,
    subjectName: 'Web Development',
    title: 'Introduction to Web Development',
    description: 'Discover how the web works, client-server architecture, HTTP/HTTPS protocols, and the roles of HTML, CSS, and JavaScript.',
    lessonType: 'text',
    durationMinutes: 20,
    completed: false,
    progress: 0,
    published: true,
    objectives: [
      'Trace the lifecycle of an HTTP request from browser URL input to server response',
      'Explain the respective roles of HTML, CSS, and JavaScript',
      'Understand web browsers, rendering engines, and DOM creation',
      'Use browser developer tools to inspect elements, network traffic, and console output',
    ],
    content: `
      <h2>1. How the World Wide Web Works</h2>
      <p>When you type a URL like <code>https://lumenpath.edu</code> into a browser, a sequence of coordinated network steps occurs within milliseconds:</p>
      <ol>
        <li><strong>DNS Lookup:</strong> The browser queries a Domain Name System (DNS) server to convert the human-friendly domain into an IP address (e.g., <code>192.0.2.1</code>).</li>
        <li><strong>TCP/IP Handshake & TLS Negotiation:</strong> A secure encrypted channel is established between your client device and the web server via TLS/SSL.</li>
        <li><strong>HTTP Request:</strong> The browser sends an HTTP <code>GET</code> request with headers.</li>
        <li><strong>Server Processing:</strong> The web server handles the request and sends back an HTTP response containing headers and the HTML payload.</li>
        <li><strong>Rendering:</strong> The browser parses HTML into the Document Object Model (DOM), loads CSS into the CSSOM, combines them into a Render Tree, and paints pixels on screen.</li>
      </ol>

      <h2>2. The Triad of Web Technologies</h2>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px; margin: 16px 0;">
        <div style="background: rgba(239,68,68,0.06); padding: 14px; border-radius: 12px; border-left: 4px solid #ef4444;">
          <h4 style="margin: 0 0 6px 0; color: #ef4444;">HTML (Structure)</h4>
          <p style="margin: 0; font-size: 13px;">Defines the semantic scaffolding, headings, paragraphs, images, links, and forms.</p>
        </div>
        <div style="background: rgba(59,130,246,0.06); padding: 14px; border-radius: 12px; border-left: 4px solid #3b82f6;">
          <h4 style="margin: 0 0 6px 0; color: #3b82f6;">CSS (Presentation)</h4>
          <p style="margin: 0; font-size: 13px;">Controls typography, colors, layouts, animations, and responsive screen adaptation.</p>
        </div>
        <div style="background: rgba(245,158,11,0.06); padding: 14px; border-radius: 12px; border-left: 4px solid #f59e0b;">
          <h4 style="margin: 0 0 6px 0; color: #f59e0b;">JavaScript (Behavior)</h4>
          <p style="margin: 0; font-size: 13px;">Drives interactivity, asynchronous data fetching (AJAX/Fetch), and real-time state updates.</p>
        </div>
      </div>
    `,
  },
  {
    id: 202,
    subjectId: 2,
    subjectName: 'Web Development',
    title: 'HTML Basics',
    description: 'Master semantic HTML5 markup, page structure, headings, lists, links, images, tables, and accessible forms.',
    lessonType: 'text',
    durationMinutes: 25,
    completed: false,
    progress: 0,
    published: true,
    objectives: [
      'Construct valid HTML5 document skeletons with proper doctype and head metadata',
      'Apply semantic HTML5 container elements for accessibility and SEO',
      'Create accessible web forms with associated labels and inputs',
      'Embed images, hyperlinks, and tabular data properly',
    ],
    content: `
      <h2>1. The Anatomy of an HTML5 Document</h2>
      <pre style="background: #1e293b; color: #f8fafc; padding: 16px; border-radius: 12px; overflow-x: auto;"><code>&lt;!DOCTYPE html&gt;
&lt;html lang="en"&gt;
&lt;head&gt;
    &lt;meta charset="UTF-8"&gt;
    &lt;meta name="viewport" content="width=device-width, initial-scale=1.0"&gt;
    &lt;title&gt;LumenPath Academy&lt;/title&gt;
&lt;/head&gt;
&lt;body&gt;
    &lt;header&gt;
        &lt;nav&gt;
            &lt;a href="/"&gt;Home&lt;/a&gt;
            &lt;a href="/courses"&gt;Courses&lt;/a&gt;
        &lt;/nav&gt;
    &lt;/header&gt;
    &lt;main&gt;
        &lt;article&gt;
            &lt;h1&gt;Welcome to Web Development&lt;/h1&gt;
            &lt;p&gt;Learn to craft modern, accessible web interfaces.&lt;/p&gt;
        &lt;/article&gt;
    &lt;/main&gt;
    &lt;footer&gt;
        &lt;p&gt;&copy; 2026 LumenPath&lt;/p&gt;
    &lt;/footer&gt;
&lt;/body&gt;
&lt;/html&gt;</code></pre>

      <h2>2. Semantic Elements vs. Generic Divs</h2>
      <p>Rather than using generic <code>&lt;div&gt;</code> elements everywhere, semantic HTML informs search engines and screen readers about the purpose of each section:</p>
      <ul>
        <li><code>&lt;header&gt;</code>: Introductory content, brand logo, or main navigation.</li>
        <li><code>&lt;nav&gt;</code>: Major navigational link clusters.</li>
        <li><code>&lt;main&gt;</code>: The dominant, non-repeated content of the document.</li>
        <li><code>&lt;section&gt;</code>: Thematic grouping of content with its own heading.</li>
        <li><code>&lt;article&gt;</code>: Self-contained composition independently distributable (e.g., blog post).</li>
        <li><code>&lt;aside&gt;</code>: Tangentially related side content.</li>
      </ul>

      <h2>3. Accessible Forms</h2>
      <p>Always pair inputs with explicit <code>&lt;label&gt;</code> elements using matching <code>for</code> and <code>id</code> attributes:</p>
      <pre style="background: #1e293b; color: #f8fafc; padding: 16px; border-radius: 12px; overflow-x: auto;"><code>&lt;form action="/submit" method="POST"&gt;
    &lt;label for="user-email"&gt;Email Address&lt;/label&gt;
    &lt;input type="email" id="user-email" name="email" required placeholder="you@domain.com"&gt;
    
    &lt;button type="submit"&gt;Sign Up&lt;/button&gt;
&lt;/form&gt;</code></pre>
    `,
  },
  {
    id: 203,
    subjectId: 2,
    subjectName: 'Web Development',
    title: 'CSS Fundamentals',
    description: 'Style web pages with CSS: selectors, the Box Model, typography, colors, border, padding, margin, and specificity rules.',
    lessonType: 'text',
    durationMinutes: 25,
    completed: false,
    progress: 0,
    published: true,
    objectives: [
      'Master the CSS Box Model (content, padding, border, margin)',
      'Write specific CSS selectors (element, class, ID, attribute, pseudo-classes)',
      'Calculate CSS rule specificity and resolve style inheritance conflicts',
      'Apply modern color formats (HSL, HEX, RGBA) and typography rules',
    ],
    content: `
      <h2>1. The CSS Box Model</h2>
      <p>Every element rendered on an HTML page is represented as a rectangular box consisting of four concentric layers:</p>
      <ol>
        <li><strong>Content:</strong> The text, image, or child elements.</li>
        <li><strong>Padding:</strong> Transparent inner space between the content and the border.</li>
        <li><strong>Border:</strong> The line encircling the padding and content.</li>
        <li><strong>Margin:</strong> Outer clear space separating this element from neighboring elements.</li>
      </ol>

      <div style="background: #1e293b; color: #f8fafc; padding: 16px; border-radius: 12px; margin: 16px 0;">
        <pre style="margin: 0;"><code>/* Modern CSS reset recommendation */
*, *::before, *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
}</code></pre>
      </div>

      <h2>2. Understanding CSS Specificity</h2>
      <p>When multiple rules target the same element, the browser applies the rule with the highest specificity score:</p>
      <ul>
        <li><strong>Inline styles:</strong> <code>style="..."</code> (1000 points)</li>
        <li><strong>IDs:</strong> <code>#header</code> (100 points)</li>
        <li><strong>Classes, attributes, pseudo-classes:</strong> <code>.card, [type="text"], :hover</code> (10 points)</li>
        <li><strong>Elements & pseudo-elements:</strong> <code>p, div, h1, ::before</code> (1 point)</li>
      </ul>
    `,
  },
  {
    id: 204,
    subjectId: 2,
    subjectName: 'Web Development',
    title: 'JavaScript Introduction',
    description: 'Bring pages to life with JavaScript: variables, data types, conditionals, loops, functions, and interactive DOM manipulation.',
    lessonType: 'text',
    durationMinutes: 30,
    completed: false,
    progress: 0,
    published: true,
    objectives: [
      'Declare variables using let and const and avoid global scope pollution',
      'Work with modern JavaScript data types, template literals, and objects',
      'Select DOM elements and listen for user interaction events',
      'Perform dynamic DOM updates and content manipulation',
    ],
    content: `
      <h2>1. Modern JavaScript Variables: let and const</h2>
      <p>In modern ES6+ JavaScript, avoid using <code>var</code>. Use <code>const</code> for values that will not be reassigned, and <code>let</code> when a variable needs to be updated:</p>
      <pre style="background: #1e293b; color: #f8fafc; padding: 16px; border-radius: 12px; overflow-x: auto;"><code>const studentName = "Elena Rostova";
let currentScore = 85;

// Template literals allow string interpolation:
console.log(\`Student \${studentName} scored \${currentScore}%\`);</code></pre>

      <h2>2. Interacting with the DOM (Document Object Model)</h2>
      <p>JavaScript interacts with the webpage through the browser\'s DOM API:</p>
      <pre style="background: #1e293b; color: #f8fafc; padding: 16px; border-radius: 12px; overflow-x: auto;"><code>// Select elements
const button = document.querySelector('#enroll-btn');
const statusText = document.querySelector('.status-message');

// Attach event listener
button.addEventListener('click', () => {
    statusText.textContent = "Enrollment confirmed! Check your email.";
    statusText.classList.add('text-success');
});</code></pre>
    `,
  },
  {
    id: 205,
    subjectId: 2,
    subjectName: 'Web Development',
    title: 'Responsive Web Design',
    description: 'Build layouts that adapt to any screen size using CSS Flexbox, CSS Grid, media queries, and mobile-first design principles.',
    lessonType: 'text',
    durationMinutes: 30,
    completed: false,
    progress: 0,
    published: true,
    objectives: [
      'Implement mobile-first responsive workflows using CSS media queries',
      'Build dynamic 1D flexible layouts using CSS Flexbox',
      'Design complex 2D responsive page layouts using CSS Grid',
      'Use responsive units (rem, em, clamp(), min(), max())',
    ],
    content: `
      <h2>1. The Viewport Meta Tag</h2>
      <p>Responsive design begins with the viewport meta tag in your HTML head:</p>
      <pre style="background: #1e293b; color: #f8fafc; padding: 16px; border-radius: 12px; overflow-x: auto;"><code>&lt;meta name="viewport" content="width=device-width, initial-scale=1.0"&gt;</code></pre>

      <h2>2. CSS Flexbox (1D Layouts)</h2>
      <p>Flexbox excels at distributing items along a single axis (either row or column):</p>
      <pre style="background: #1e293b; color: #f8fafc; padding: 16px; border-radius: 12px; overflow-x: auto;"><code>.navbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 2rem;
}</code></pre>

      <h2>3. CSS Grid (2D Layouts)</h2>
      <p>CSS Grid enables simultaneous alignment across columns and rows:</p>
      <pre style="background: #1e293b; color: #f8fafc; padding: 16px; border-radius: 12px; overflow-x: auto;"><code>.course-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 1.5rem;
}</code></pre>

      <h2>4. Mobile-First Media Queries</h2>
      <pre style="background: #1e293b; color: #f8fafc; padding: 16px; border-radius: 12px; overflow-x: auto;"><code>/* Base mobile styles apply first */
.sidebar {
    display: none;
}

/* Tablet & Desktop enhancement */
@media (min-width: 768px) {
    .sidebar {
        display: block;
        width: 260px;
    }
}</code></pre>
    `,
  },
  {
    id: 206,
    subjectId: 2,
    subjectName: 'Web Development',
    title: 'Website Structure and Navigation',
    description: 'Design clean information architecture, responsive navigation bars, breadcrumbs, footers, and accessible multi-page site structures.',
    lessonType: 'text',
    durationMinutes: 25,
    completed: false,
    progress: 0,
    published: true,
    objectives: [
      'Design intuitive site information architecture and user navigation flows',
      'Implement responsive navigation menus with mobile hamburger toggles',
      'Provide breadcrumbs and semantic hierarchical landmarks',
      'Ensure keyboard navigability and ARIA accessibility standards',
    ],
    content: `
      <h2>1. Information Architecture (IA)</h2>
      <p>Information Architecture organizes and structures web content so users find what they need effortlessly with minimum cognitive load:</p>
      <ul>
        <li><strong>Hierarchical Model:</strong> Clear tree-like progression from Home &rarr; Categories &rarr; Subcategories &rarr; Detail pages.</li>
        <li><strong>Three-Click Rule:</strong> Any critical piece of content should be accessible within at most three clicks from the home view.</li>
        <li><strong>F-Shaped and Z-Shaped Scanning:</strong> Users scan pages in predictable patterns; place key navigation and branding along these scanning vectors.</li>
      </ul>

      <h2>2. Accessible Breadcrumbs</h2>
      <pre style="background: #1e293b; color: #f8fafc; padding: 16px; border-radius: 12px; overflow-x: auto;"><code>&lt;nav aria-label="Breadcrumb" class="breadcrumbs"&gt;
    &lt;ol&gt;
        &lt;li&gt;&lt;a href="/"&gt;Home&lt;/a&gt;&lt;/li&gt;
        &lt;li&gt;&lt;a href="/student/subjects"&gt;Subjects&lt;/a&gt;&lt;/li&gt;
        &lt;li aria-current="page"&gt;Web Development&lt;/li&gt;
    &lt;/ol&gt;
&lt;/nav&gt;</code></pre>
    `,
  },

  // ==========================================
  // SUBJECT 3: Programming (subject_id: 3)
  // ==========================================
  {
    id: 301,
    subjectId: 3,
    subjectName: 'Programming',
    title: 'Introduction to Programming',
    description: 'Understand how computers process instructions, compilation vs interpretation, algorithm design, and pseudocode.',
    lessonType: 'text',
    durationMinutes: 20,
    completed: false,
    progress: 0,
    published: true,
    objectives: [
      'Understand how high-level programming code translates into binary machine instructions',
      'Contrast compiled languages with interpreted and bytecode-driven languages',
      'Formulate algorithms using flowcharts and pseudocode',
      'Cultivate systematic analytical debugging habits',
    ],
    content: `
      <h2>1. What is Computer Programming?</h2>
      <p>A computer processor executes only binary instructions (sequences of <code>0</code>s and <code>1</code>s represented by electrical voltages in transistors). <strong>Programming</strong> is the discipline of expressing problem solutions in precise, high-level languages that humans can comprehend, which are then translated into machine execution.</p>

      <h2>2. Compilers vs. Interpreters</h2>
      <div style="background: rgba(15,118,110,0.06); padding: 16px; border-radius: 12px; margin: 16px 0; border-left: 4px solid #0f766e;">
        <ul style="margin: 0; padding-left: 20px;">
          <li><strong>Compiled Languages (C, C++, Rust, Go):</strong> A compiler translates the entire source code file into a standalone binary executable before program runtime. Results in blazing fast execution speed.</li>
          <li><strong>Interpreted Languages (Python, Ruby, JavaScript):</strong> An interpreter reads and executes source code statement by statement at runtime. Enables rapid iteration and dynamic typing.</li>
        </ul>
      </div>

      <h2>3. Writing an Algorithm with Pseudocode</h2>
      <p>An algorithm is a finite, step-by-step procedure for solving a computational problem:</p>
      <pre style="background: #1e293b; color: #f8fafc; padding: 16px; border-radius: 12px; overflow-x: auto;"><code>ALGORITHM CalculateAverageGrade
    INPUT: list of exam scores
    SET total = 0
    SET count = 0
    FOR EACH score IN list:
        total = total + score
        count = count + 1
    IF count &gt; 0 THEN
        RETURN total / count
    ELSE
        RETURN 0</code></pre>
    `,
  },
  {
    id: 302,
    subjectId: 3,
    subjectName: 'Programming',
    title: 'Variables and Data Types',
    description: 'Learn memory storage, variable declarations, primitive types (numbers, strings, booleans), arrays, scope, and type casting.',
    lessonType: 'text',
    durationMinutes: 25,
    completed: false,
    progress: 0,
    published: true,
    objectives: [
      'Declare and initialize variables adhering to standard naming conventions',
      'Identify primitive data types (integers, floats, characters, booleans)',
      'Manage sequential memory collections with arrays and lists',
      'Differentiate between local, block, and global variable scope',
    ],
    content: `
      <h2>1. Variables as Named Memory Locations</h2>
      <p>When you declare a variable, the computer allocates a specific quantity of bytes in Random Access Memory (RAM) and associates that memory address with an identifier name:</p>
      <pre style="background: #1e293b; color: #f8fafc; padding: 16px; border-radius: 12px; overflow-x: auto;"><code>int age = 21;          // 4 bytes allocated on stack
double gpa = 3.84;     // 8 bytes IEEE-754 floating point
boolean isActive = true; // 1 byte boolean flag
char grade = 'A';      // 1-2 bytes character representation</code></pre>

      <h2>2. Arrays and Collections</h2>
      <p>An array stores multiple values of the same type in contiguous memory blocks, indexed from zero (<code>0</code>):</p>
      <pre style="background: #1e293b; color: #f8fafc; padding: 16px; border-radius: 12px; overflow-x: auto;"><code>int[] scores = {92, 88, 95, 79, 100};
int firstScore = scores[0]; // 92
int totalCount = scores.length; // 5</code></pre>

      <h2>3. Variable Scope and Lifetime</h2>
      <p>A variable\'s <strong>scope</strong> determines where in the program that variable can be accessed:</p>
      <ul>
        <li><strong>Local / Block Scope:</strong> Variables declared inside a function or loop exist only during that block\'s execution.</li>
        <li><strong>Global Scope:</strong> Variables declared outside all functions; accessible anywhere in the program file (use sparingly to prevent side effects).</li>
      </ul>
    `,
  },
  {
    id: 303,
    subjectId: 3,
    subjectName: 'Programming',
    title: 'Conditional Statements',
    description: 'Master decision-making in software using if/else logic, comparison operators, boolean evaluation, and switch statements.',
    lessonType: 'text',
    durationMinutes: 25,
    completed: false,
    progress: 0,
    published: true,
    objectives: [
      'Construct branching logic using if, else if, and else blocks',
      'Combine multiple logical expressions using AND (&&), OR (||), and NOT (!)',
      'Use switch/case statements for clean multi-way branching',
      'Apply guard clauses to eliminate deeply nested conditionals',
    ],
    content: `
      <h2>1. The Principle of Branching</h2>
      <p>Conditional statements allow your program to follow different execution paths depending on whether a given condition evaluates to <code>true</code> or <code>false</code>:</p>

      <pre style="background: #1e293b; color: #f8fafc; padding: 16px; border-radius: 12px; overflow-x: auto;"><code>function getHonorRollStatus(gpa, creditsCompleted) {
    // Guard clause: handle edge cases first
    if (creditsCompleted &lt; 12) {
        return "Ineligible: minimum 12 credits required";
    }

    if (gpa &gt;= 3.9) {
        return "Summa Cum Laude";
    } else if (gpa &gt;= 3.7) {
        return "Magna Cum Laude";
    } else if (gpa &gt;= 3.5) {
        return "Cum Laude";
    } else {
        return "Good Standing";
    }
}</code></pre>

      <h2>2. Short-Circuit Evaluation</h2>
      <p>Logical operators evaluate left-to-right and stop as soon as the outcome is certain:</p>
      <ul>
        <li><code>A && B</code>: If <code>A</code> is false, <code>B</code> is never evaluated.</li>
        <li><code>A || B</code>: If <code>A</code> is true, <code>B</code> is never evaluated.</li>
      </ul>
    `,
  },
  {
    id: 304,
    subjectId: 3,
    subjectName: 'Programming',
    title: 'Loops',
    description: 'Automate repetitive operations with for loops, while loops, array iteration, loop control keywords, and recursion.',
    lessonType: 'text',
    durationMinutes: 30,
    completed: false,
    progress: 0,
    published: true,
    objectives: [
      'Choose appropriately between for loops and while loops',
      'Prevent infinite loops by ensuring monotonic loop termination conditions',
      'Use break and continue to control iteration execution',
      'Iterate over multidimensional data arrays with nested loops',
    ],
    content: `
      <h2>1. For Loops vs. While Loops</h2>
      <p>Use a <strong>for loop</strong> when you know in advance how many times the loop should execute. Use a <strong>while loop</strong> when looping depends on an external condition being satisfied:</p>

      <pre style="background: #1e293b; color: #f8fafc; padding: 16px; border-radius: 12px; overflow-x: auto;"><code>// Standard for loop (initialization; condition; increment)
for (let i = 1; i &lt;= 5; i++) {
    console.log("Iteration #" + i);
}

// While loop (executes as long as condition remains true)
let attempts = 0;
while (attempts &lt; 3 && !loginSuccess) {
    loginSuccess = attemptLogin();
    attempts++;
}</code></pre>

      <h2>2. Break and Continue</h2>
      <ul>
        <li><code>break;</code>: Terminates the loop immediately and jumps to the code following the loop.</li>
        <li><code>continue;</code>: Skips the remainder of the current iteration and jumps directly to the next iteration.</li>
      </ul>
    `,
  },
  {
    id: 305,
    subjectId: 3,
    subjectName: 'Programming',
    title: 'Functions',
    description: 'Write modular and reusable code using functions, parameters, arguments, return values, scope, and clean abstraction.',
    lessonType: 'text',
    durationMinutes: 25,
    completed: false,
    progress: 0,
    published: true,
    objectives: [
      'Apply the DRY (Don\'t Repeat Yourself) principle through modular functions',
      'Differentiate parameters (formal definitions) from arguments (passed values)',
      'Write pure functions that produce predictable outputs without unexpected side effects',
      'Pass data by value vs. by reference',
    ],
    content: `
      <h2>1. The DRY Principle (Don\'t Repeat Yourself)</h2>
      <p>Functions are self-contained blocks of code designed to perform a single, coherent task. Encapsulating logic inside functions allows you to test, debug, and reuse code without copy-pasting:</p>

      <pre style="background: #1e293b; color: #f8fafc; padding: 16px; border-radius: 12px; overflow-x: auto;"><code>// Pure function: deterministic and has no side effects
function calculateNetPay(grossSalary, taxRate = 0.15) {
    const deductions = grossSalary * taxRate;
    return grossSalary - deductions;
}

const developerPay = calculateNetPay(95000, 0.20);
console.log("Net pay: $" + developerPay);</code></pre>

      <h2>2. Pass by Value vs. Pass by Reference</h2>
      <ul>
        <li><strong>Primitives (numbers, booleans, strings):</strong> Passed by value. The function receives a copy of the value; modifying it does not alter the caller\'s original variable.</li>
        <li><strong>Objects and Arrays:</strong> Passed by reference (pointer). Modifying an array\'s elements inside a function alters the original data in the caller.</li>
      </ul>
    `,
  },
  {
    id: 306,
    subjectId: 3,
    subjectName: 'Programming',
    title: 'Basic Problem-Solving',
    description: 'Develop structured problem-solving skills: problem decomposition, algorithmic thinking, boundary case testing, and debugging.',
    lessonType: 'text',
    durationMinutes: 35,
    completed: false,
    progress: 0,
    published: true,
    objectives: [
      'Deconstruct complex programming problems into manageable sub-tasks',
      'Identify edge cases, boundary inputs, and null/empty scenarios',
      'Apply classic algorithmic strategies (two-pointer, sliding window, frequency maps)',
      'Trace code line-by-line with dry-run tables',
    ],
    content: `
      <h2>1. The Engineering Problem-Solving Framework</h2>
      <p>Professional software engineers rarely start writing code immediately. Instead, they follow a systematic four-step problem-solving lifecycle:</p>
      <ol>
        <li><strong>Understand the Problem:</strong> Restate requirements in your own words. Identify input types, expected output types, and edge cases (e.g., negative numbers, empty arrays).</li>
        <li><strong>Decompose & Plan:</strong> Break the challenge into smaller sub-problems. Write pseudocode or draw diagrams.</li>
        <li><strong>Implement Iteratively:</strong> Write code for the simplest case first, test it, and then expand to cover complex cases.</li>
        <li><strong>Refactor & Optimize:</strong> Review time complexity (Big O notation) and readability.</li>
      </ol>

      <h2>2. Example: Finding the Maximum Element in an Array</h2>
      <pre style="background: #1e293b; color: #f8fafc; padding: 16px; border-radius: 12px; overflow-x: auto;"><code>function findMax(numbers) {
    if (!numbers || numbers.length === 0) {
        throw new Error("Array cannot be empty");
    }

    let maxVal = numbers[0];
    for (let i = 1; i &lt; numbers.length; i++) {
        if (numbers[i] &gt; maxVal) {
            maxVal = numbers[i];
        }
    }
    return maxVal;
}</code></pre>
    `,
  },

  // ==========================================
  // SUBJECT 4: Computer Systems (subject_id: 4)
  // ==========================================
  {
    id: 401,
    subjectId: 4,
    subjectName: 'Computer Systems',
    title: 'Introduction to Computer Systems',
    description: 'Examine the Von Neumann computer architecture, instruction cycles, binary representation, clock cycles, and system buses.',
    lessonType: 'text',
    durationMinutes: 20,
    completed: false,
    progress: 0,
    published: true,
    objectives: [
      'Describe the fundamental Von Neumann architecture model',
      'Trace the Fetch-Decode-Execute instruction cycle',
      'Understand binary data representations (bits, bytes, hexadecimal)',
      'Explain the roles of Address, Data, and Control buses',
    ],
    content: `
      <h2>1. The Von Neumann Architecture</h2>
      <p>Proposed by mathematician John von Neumann in 1945, this architectural model remains the foundational paradigm of virtually all modern microprocessors:</p>
      <ul>
        <li><strong>Central Processing Unit (CPU):</strong> Contains the Arithmetic Logic Unit (ALU), Control Unit (CU), and high-speed Registers.</li>
        <li><strong>Main Memory Unit (RAM):</strong> Stores both program instructions and application data in shared address space ("stored-program concept").</li>
        <li><strong>Input / Output (I/O) Interfaces:</strong> Connects peripherals and secondary storage to the system.</li>
        <li><strong>System Bus:</strong> High-speed electrical pathways connecting CPU, memory, and I/O.</li>
      </ul>

      <h2>2. The Fetch-Decode-Execute Cycle</h2>
      <p>Every clock cycle, the CPU runs this continuous loop billions of times per second:</p>
      <ol>
        <li><strong>Fetch:</strong> The Program Counter (PC) register points to the next instruction in RAM. The instruction is copied into the Instruction Register (IR).</li>
        <li><strong>Decode:</strong> The Control Unit interprets the opcode bits to determine required ALU operations and operand registers.</li>
        <li><strong>Execute:</strong> The ALU computes the operation, and the result is written back to an accumulator register or memory.</li>
      </ol>
    `,
  },
  {
    id: 402,
    subjectId: 4,
    subjectName: 'Computer Systems',
    title: 'Computer Hardware',
    description: 'Explore internal PC components: CPU (ALU, registers, cache), motherboard, volatile RAM, NVMe storage, and cooling systems.',
    lessonType: 'text',
    durationMinutes: 25,
    completed: false,
    progress: 0,
    published: true,
    objectives: [
      'Identify essential internal PC hardware components and their specifications',
      'Analyze the CPU cache hierarchy (L1, L2, L3 cache vs. RAM)',
      'Contrast volatile RAM with non-volatile solid-state NVMe storage',
      'Understand motherboard chipsets and PCIe expansion lanes',
    ],
    content: `
      <h2>1. Inside the Modern CPU</h2>
      <p>The CPU is the computational brain of a computer:</p>
      <ul>
        <li><strong>Arithmetic Logic Unit (ALU):</strong> Performs integer arithmetic (addition, subtraction) and bitwise boolean operations (AND, OR, XOR).</li>
        <li><strong>Control Unit (CU):</strong> Orchestrates data flow and instruction timings across the processor.</li>
        <li><strong>Registers:</strong> Tiny, ultra-fast storage cells located directly inside the CPU core (e.g., RAX, RBX in x86-64).</li>
        <li><strong>Cache Hierarchy (L1, L2, L3):</strong> Static RAM (SRAM) buffers preventing the CPU from sitting idle waiting on slower main memory. L1 is fastest (~1 nanosecond), followed by L2 and shared L3.</li>
      </ul>

      <h2>2. Memory and Storage Comparison</h2>
      <div style="background: rgba(0,0,0,0.03); border: 1px solid rgba(0,0,0,0.1); border-radius: 12px; padding: 16px; margin: 16px 0;">
        <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 14px;">
          <thead>
            <tr style="border-bottom: 2px solid #ccc;">
              <th style="padding: 8px;">Characteristic</th>
              <th style="padding: 8px;">RAM (DDR5)</th>
              <th style="padding: 8px;">NVMe SSD (PCIe 4.0)</th>
            </tr>
          </thead>
          <tbody>
            <tr style="border-bottom: 1px solid #eee;">
              <td style="padding: 8px; font-weight: bold;">Volatility</td>
              <td style="padding: 8px;">Volatile (erased on power loss)</td>
              <td style="padding: 8px;">Non-volatile (persists permanently)</td>
            </tr>
            <tr style="border-bottom: 1px solid #eee;">
              <td style="padding: 8px; font-weight: bold;">Bandwidth</td>
              <td style="padding: 8px;">~64,000 MB/s</td>
              <td style="padding: 8px;">~7,000 MB/s</td>
            </tr>
            <tr>
              <td style="padding: 8px; font-weight: bold;">Latency</td>
              <td style="padding: 8px;">~50 - 70 nanoseconds</td>
              <td style="padding: 8px;">~10 - 50 microseconds</td>
            </tr>
          </tbody>
        </table>
      </div>
    `,
  },
  {
    id: 403,
    subjectId: 4,
    subjectName: 'Computer Systems',
    title: 'Computer Software',
    description: 'Differentiate between system software (OS, firmware, drivers) and application software, compilers, linkers, and loaders.',
    lessonType: 'text',
    durationMinutes: 25,
    completed: false,
    progress: 0,
    published: true,
    objectives: [
      'Categorize software into system software and application software tiers',
      'Explain the UEFI/BIOS boot sequence and hardware initialization',
      'Trace the compilation pipeline from source code to linker and loader',
      'Understand device drivers and kernel-space execution',
    ],
    content: `
      <h2>1. Taxonomy of Computer Software</h2>
      <p>Software is broadly categorized into two major classes:</p>
      <ul>
        <li><strong>System Software:</strong> Manages hardware resources and provides a platform for application software. Includes Operating Systems (Linux, Windows, macOS), UEFI/BIOS firmware, device drivers, and system daemons.</li>
        <li><strong>Application Software:</strong> Programs designed for end-users to achieve specific tasks (e.g., web browsers, office productivity tools, media editors, games).</li>
      </ul>

      <h2>2. From Source Code to Executable Process</h2>
      <p>Turning human-readable code into an active executing process requires four software tools working in sequence:</p>
      <ol>
        <li><strong>Preprocessor:</strong> Expands macros, imports header files, and strips comments.</li>
        <li><strong>Compiler:</strong> Translates preprocessed code into assembly instructions specific to the CPU target architecture.</li>
        <li><strong>Assembler:</strong> Converts assembly into machine-code object files (<code>.o</code> / <code>.obj</code>).</li>
        <li><strong>Linker:</strong> Merges multiple object files with shared runtime libraries into a single executable binary.</li>
        <li><strong>Loader:</strong> An OS component that reads the executable from disk into RAM, sets up the virtual address space, and transfers CPU execution to the entry point.</li>
      </ol>
    `,
  },
  {
    id: 404,
    subjectId: 4,
    subjectName: 'Computer Systems',
    title: 'Operating Systems',
    description: 'Understand how operating systems orchestrate hardware: process scheduling, virtual memory management, and file systems.',
    lessonType: 'text',
    durationMinutes: 30,
    completed: false,
    progress: 0,
    published: true,
    objectives: [
      'Explain the primary roles of an Operating System kernel',
      'Analyze CPU scheduling algorithms (Round Robin, Priority, Multi-level Feedback Queues)',
      'Explain virtual memory, paging, and page fault handling',
      'Understand file systems and directory tree structures',
    ],
    content: `
      <h2>1. The Role of the Operating System Kernel</h2>
      <p>The <strong>Kernel</strong> is the core supervisory program running in privileged CPU supervisor mode (Ring 0). It acts as an impartial arbiter allocating hardware resources to user-space applications (Ring 3):</p>
      <ul>
        <li><strong>Process Management:</strong> Spawning, scheduling, and terminating executing processes and threads.</li>
        <li><strong>Memory Management:</strong> Allocating virtual memory pages and preventing unauthorized cross-process memory access.</li>
        <li><strong>File System Management:</strong> Translating logical file paths (<code>/home/student/notes.txt</code>) into physical disk block sectors.</li>
        <li><strong>Device I/O Management:</strong> Providing standardized abstractions for diverse hardware via device drivers.</li>
      </ul>

      <h2>2. Virtual Memory and Paging</h2>
      <p>Rather than giving applications direct physical RAM addresses, the OS provides each process with its own private <strong>Virtual Address Space</strong>. The Memory Management Unit (MMU) in the CPU uses page tables to map virtual pages (typically 4 KB each) to physical RAM frames. If a requested page is not in RAM, a <strong>Page Fault</strong> occurs, causing the OS to retrieve it from SSD swap space.</p>
    `,
  },
  {
    id: 405,
    subjectId: 4,
    subjectName: 'Computer Systems',
    title: 'Input and Output Devices',
    description: 'Survey peripheral hardware: input devices, display monitors, USB-C/PCIe interfaces, interrupt requests, and DMA controllers.',
    lessonType: 'text',
    durationMinutes: 25,
    completed: false,
    progress: 0,
    published: true,
    objectives: [
      'Classify modern input, output, and hybrid peripheral devices',
      'Compare high-speed peripheral bus interfaces (USB-C, PCIe, Thunderbolt, HDMI)',
      'Contrast interrupt-driven I/O with polling mechanisms',
      'Understand Direct Memory Access (DMA) for high-bandwidth data transfers',
    ],
    content: `
      <h2>1. Classification of Peripheral Devices</h2>
      <ul>
        <li><strong>Input Devices:</strong> Keyboards (mechanical switches, matrix scanning), optical mice (CMOS sensors), touchscreens, microphones, barcode scanners.</li>
        <li><strong>Output Devices:</strong> Displays (OLED, IPS LCD, refresh rates and color gamuts), audio speakers/DACs, laser printers.</li>
        <li><strong>Input/Output (Hybrid):</strong> Touchscreens, network interface cards (NICs), external NVMe storage drives.</li>
      </ul>

      <h2>2. Polling vs. Interrupt-Driven I/O</h2>
      <p>How does the CPU know when a peripheral has incoming data?</p>
      <ul>
        <li><strong>Polling:</strong> The CPU repeatedly checks a status register in a tight loop. Wastes enormous processor cycles.</li>
        <li><strong>Interrupt-Driven I/O:</strong> When a key is pressed, the hardware controller triggers an electrical <strong>Interrupt Request (IRQ)</strong> line. The CPU suspends its current task, invokes the Interrupt Service Routine (ISR) handler, and then resumes normal execution immediately.</li>
      </ul>

      <h2>3. Direct Memory Access (DMA)</h2>
      <p>For high-throughput devices (like network cards and graphics cards), routing every single byte through CPU registers would bottleneck the system. A <strong>DMA Controller</strong> allows peripherals to transfer blocks of data directly to and from RAM without engaging the CPU, freeing the processor for computational tasks.</p>
    `,
  },
];

export const DEFAULT_QUESTIONS: QuestionBankItem[] = [
  // ==========================================
  // SUBJECT 1: Database Management (subjectId: 1)
  // ==========================================
  {
    id: 1001,
    subjectId: 1,
    subjectName: 'Database Management',
    lessonId: 101,
    lessonTitle: 'Introduction to Database Management Systems',
    type: 'multiple_choice',
    text: 'What is a Database Management System (DBMS)?',
    points: 2,
    difficulty: 'easy',
    status: 'published',
    choices: [
      { id: 'a', value: 'a', label: 'Software that controls the organization, storage, retrieval, security, and integrity of data' },
      { id: 'b', value: 'b', label: 'A hardware microcontroller that reads mechanical disk sectors' },
      { id: 'c', value: 'c', label: 'A styling sheet language used strictly for browser presentation' },
      { id: 'd', value: 'd', label: 'An operating system kernel component dedicated to sound processing' },
    ],
    correctAnswer: 'a',
    explanation: 'A DBMS is specialized software providing an interface between applications and physical storage while enforcing ACID properties.',
    createdAt: '2026-10-15',
    authorName: 'Prof. Sarah Jenkins',
  },
  {
    id: 1002,
    subjectId: 1,
    subjectName: 'Database Management',
    lessonId: 104,
    lessonTitle: 'Primary Keys and Foreign Keys',
    type: 'multiple_choice',
    text: 'What is a primary key in a relational database table?',
    points: 2,
    difficulty: 'easy',
    status: 'published',
    choices: [
      { id: 'a', value: 'a', label: 'A column or attribute set that uniquely identifies each row and cannot be NULL' },
      { id: 'b', value: 'b', label: 'The first column alphabetically in the table definition' },
      { id: 'c', value: 'c', label: 'An optional text label describing the table schema' },
      { id: 'd', value: 'd', label: 'A cryptographic key used exclusively to encrypt passwords' },
    ],
    correctAnswer: 'a',
    explanation: 'A primary key enforces unique entity identity for every record and strictly forbids NULL values.',
    createdAt: '2026-10-15',
    authorName: 'Prof. Sarah Jenkins',
  },
  {
    id: 1003,
    subjectId: 1,
    subjectName: 'Database Management',
    lessonId: 103,
    lessonTitle: 'Tables, Rows, and Columns',
    type: 'true_false',
    text: 'In relational database theory, rows are formally known as tuples and columns are known as attributes.',
    points: 1,
    difficulty: 'easy',
    status: 'published',
    choices: [
      { id: 'true', value: 'true', label: 'True' },
      { id: 'false', value: 'false', label: 'False' },
    ],
    correctAnswer: 'true',
    explanation: 'In E.F. Codd relational model, relations represent tables, tuples represent individual rows, and attributes represent columns.',
    createdAt: '2026-10-16',
    authorName: 'Prof. Sarah Jenkins',
  },
  {
    id: 1004,
    subjectId: 1,
    subjectName: 'Database Management',
    lessonId: 106,
    lessonTitle: 'SQL Basics',
    type: 'identification',
    text: 'What does the SQL acronym stand for?',
    points: 2,
    difficulty: 'easy',
    status: 'published',
    correctAnswer: 'Structured Query Language',
    acceptedAnswers: ['Structured Query Language', 'structured query language', 'SQL', 'structured query lang'],
    explanation: 'SQL stands for Structured Query Language, the international standard declarative language for relational database systems.',
    createdAt: '2026-10-16',
    authorName: 'Prof. Sarah Jenkins',
  },
  {
    id: 1005,
    subjectId: 1,
    subjectName: 'Database Management',
    lessonId: 108,
    lessonTitle: 'Database Normalization',
    type: 'essay',
    text: 'Explain the concept and purpose of Database Normalization (1NF through 3NF) and why it is critical in relational schema design.',
    points: 5,
    difficulty: 'hard',
    status: 'published',
    sampleAnswerRubric: 'Rubric Criteria:\n1. 1NF: Eliminates repeating groups and ensures atomic (indivisible) column values.\n2. 2NF: Must be in 1NF and eliminate partial functional dependencies on composite keys.\n3. 3NF: Must be in 2NF and eliminate transitive dependencies (non-key attributes dependent on other non-key attributes).\n4. Purpose: Eliminates insertion, update, and deletion anomalies while conserving disk space and preserving data integrity.',
    explanation: 'Normalization organizes columns and tables to eliminate data redundancy and prevent data modification anomalies.',
    createdAt: '2026-10-17',
    authorName: 'Prof. Sarah Jenkins',
  },

  // ==========================================
  // SUBJECT 2: Web Development (subjectId: 2)
  // ==========================================
  {
    id: 2001,
    subjectId: 2,
    subjectName: 'Web Development',
    lessonId: 202,
    lessonTitle: 'HTML Basics',
    type: 'multiple_choice',
    text: 'What does HTML stand for?',
    points: 2,
    difficulty: 'easy',
    status: 'published',
    choices: [
      { id: 'a', value: 'a', label: 'HyperText Markup Language' },
      { id: 'b', value: 'b', label: 'HighText Machine Language' },
      { id: 'c', value: 'c', label: 'Hyperlink and Text Management Language' },
      { id: 'd', value: 'd', label: 'Home Tool Markup Language' },
    ],
    correctAnswer: 'a',
    explanation: 'HTML (HyperText Markup Language) is the standard markup language used to structure web pages and their content.',
    createdAt: '2026-10-15',
    authorName: 'Dr. Eleanor Davies',
  },
  {
    id: 2002,
    subjectId: 2,
    subjectName: 'Web Development',
    lessonId: 203,
    lessonTitle: 'CSS Fundamentals',
    type: 'multiple_choice',
    text: 'What is the primary purpose of Cascading Style Sheets (CSS)?',
    points: 2,
    difficulty: 'easy',
    status: 'published',
    choices: [
      { id: 'a', value: 'a', label: 'To style, format, design, and control the visual layout of HTML elements' },
      { id: 'b', value: 'b', label: 'To perform database migrations on a SQL server' },
      { id: 'c', value: 'c', label: 'To compile native bytecode for mobile processors' },
      { id: 'd', value: 'd', label: 'To encrypt WebSocket connections' },
    ],
    correctAnswer: 'a',
    explanation: 'CSS specifies how HTML elements are visually styled, positioned, and rendered across different display sizes.',
    createdAt: '2026-10-15',
    authorName: 'Dr. Eleanor Davies',
  },
  {
    id: 2003,
    subjectId: 2,
    subjectName: 'Web Development',
    lessonId: 202,
    lessonTitle: 'HTML Basics',
    type: 'true_false',
    text: 'HTML5 semantic elements like <header>, <nav>, <main>, and <footer> enhance accessibility and SEO indexing.',
    points: 1,
    difficulty: 'easy',
    status: 'published',
    choices: [
      { id: 'true', value: 'true', label: 'True' },
      { id: 'false', value: 'false', label: 'False' },
    ],
    correctAnswer: 'true',
    explanation: 'Semantic markup clearly describes its meaning both to the browser and assistive screen reader technology.',
    createdAt: '2026-10-16',
    authorName: 'Dr. Eleanor Davies',
  },
  {
    id: 2004,
    subjectId: 2,
    subjectName: 'Web Development',
    lessonId: 205,
    lessonTitle: 'Responsive Web Design',
    type: 'identification',
    text: 'Which CSS layout module is primarily designed for one-dimensional layouts along a single axis (either row or column)?',
    points: 2,
    difficulty: 'medium',
    status: 'published',
    correctAnswer: 'Flexbox',
    acceptedAnswers: ['Flexbox', 'Flexible Box', 'flexbox', 'display: flex', 'CSS Flexbox'],
    explanation: 'Flexbox provides 1-dimensional space distribution, while CSS Grid provides 2-dimensional grid tracks.',
    createdAt: '2026-10-17',
    authorName: 'Dr. Eleanor Davies',
  },
  {
    id: 2005,
    subjectId: 2,
    subjectName: 'Web Development',
    lessonId: 204,
    lessonTitle: 'JavaScript Introduction',
    type: 'essay',
    text: 'Discuss the role of JavaScript in web development and explain how it dynamically manipulates the Document Object Model (DOM).',
    points: 5,
    difficulty: 'medium',
    status: 'published',
    sampleAnswerRubric: 'Rubric Criteria:\n1. JavaScript role: Adds dynamic reactivity, client-side computation, and event handling.\n2. DOM definition: An object-oriented tree representation of the structured HTML document.\n3. Manipulation methods: document.getElementById(), querySelector(), innerHTML, classList, addEventListener().\n4. Asynchronous capability: Fetching data from APIs via Fetch/Async-Await without reloading the entire page.',
    explanation: 'JavaScript enables interactive client-side experiences through programmatic DOM mutations.',
    createdAt: '2026-10-18',
    authorName: 'Dr. Eleanor Davies',
  },

  // ==========================================
  // SUBJECT 3: Programming (subjectId: 3)
  // ==========================================
  {
    id: 3001,
    subjectId: 3,
    subjectName: 'Programming',
    lessonId: 302,
    lessonTitle: 'Variables and Data Types',
    type: 'multiple_choice',
    text: 'What is a variable in computer programming?',
    points: 2,
    difficulty: 'easy',
    status: 'published',
    choices: [
      { id: 'a', value: 'a', label: 'A named storage location in memory that holds a value which can be referenced or changed' },
      { id: 'b', value: 'b', label: 'A fixed physical transistor soldered into the CPU clock generator' },
      { id: 'c', value: 'c', label: 'A compiler flag that turns on code optimization' },
      { id: 'd', value: 'd', label: 'An operating system process that manages printer queues' },
    ],
    correctAnswer: 'a',
    explanation: 'A variable binds a symbolic name to an allocated memory address storing program state.',
    createdAt: '2026-10-15',
    authorName: 'Dr. Robert Vance',
  },
  {
    id: 3002,
    subjectId: 3,
    subjectName: 'Programming',
    lessonId: 304,
    lessonTitle: 'Loops',
    type: 'true_false',
    text: 'A loop is a control structure that repeatedly executes a block of code while a specified condition evaluates to true.',
    points: 1,
    difficulty: 'easy',
    status: 'published',
    choices: [
      { id: 'true', value: 'true', label: 'True' },
      { id: 'false', value: 'false', label: 'False' },
    ],
    correctAnswer: 'true',
    explanation: 'Loops automate repetitive tasks without duplicate code statements.',
    createdAt: '2026-10-16',
    authorName: 'Dr. Robert Vance',
  },
  {
    id: 3003,
    subjectId: 3,
    subjectName: 'Programming',
    lessonId: 304,
    lessonTitle: 'Loops',
    type: 'identification',
    text: 'What keyword is used in C, Java, JavaScript, and Python to immediately exit a loop prematurely?',
    points: 2,
    difficulty: 'easy',
    status: 'published',
    correctAnswer: 'break',
    acceptedAnswers: ['break', 'break;', 'Break'],
    explanation: 'The break statement jumps execution immediately out of the innermost enclosing loop or switch construct.',
    createdAt: '2026-10-16',
    authorName: 'Dr. Robert Vance',
  },
  {
    id: 3004,
    subjectId: 3,
    subjectName: 'Programming',
    lessonId: 302,
    lessonTitle: 'Variables and Data Types',
    type: 'identification',
    text: 'Which primitive data type is used in programming languages to store truth values (True or False)?',
    points: 2,
    difficulty: 'easy',
    status: 'published',
    correctAnswer: 'Boolean',
    acceptedAnswers: ['Boolean', 'bool', 'boolean', 'Boolean type'],
    explanation: 'Named after English mathematician George Boole, Boolean variables hold either true or false.',
    createdAt: '2026-10-17',
    authorName: 'Dr. Robert Vance',
  },
  {
    id: 3005,
    subjectId: 3,
    subjectName: 'Programming',
    lessonId: 303,
    lessonTitle: 'Conditional Statements',
    type: 'essay',
    text: 'Explain how conditional statements (if, else if, else) allow software to make decisions and alter execution flow.',
    points: 5,
    difficulty: 'medium',
    status: 'published',
    sampleAnswerRubric: 'Rubric Criteria:\n1. Condition evaluation: A Boolean condition is tested.\n2. Branching flow: If condition is true, one branch executes; if false, alternate branch executes.\n3. Comparison operators: Uses equality, inequality, relational operators (>, <, >=, <=) and logical operators (AND, OR, NOT).\n4. Practical use cases: Validating user permissions, handling error edge cases, filtering search inputs.',
    explanation: 'Conditional branching allows dynamic computational decisions based on real-time inputs.',
    createdAt: '2026-10-18',
    authorName: 'Dr. Robert Vance',
  },

  // ==========================================
  // SUBJECT 4: Computer Systems (subjectId: 4)
  // ==========================================
  {
    id: 4001,
    subjectId: 4,
    subjectName: 'Computer Systems',
    lessonId: 402,
    lessonTitle: 'Computer Hardware',
    type: 'multiple_choice',
    text: 'What is computer hardware?',
    points: 2,
    difficulty: 'easy',
    status: 'published',
    choices: [
      { id: 'a', value: 'a', label: 'The physical, tangible electrical and mechanical components of a computing device' },
      { id: 'b', value: 'b', label: 'The binary bytecode instructions loaded into program memory' },
      { id: 'c', value: 'c', label: 'The documentation manuals written by software engineers' },
      { id: 'd', value: 'd', label: 'The high-level algorithms designed for algorithmic complexity' },
    ],
    correctAnswer: 'a',
    explanation: 'Hardware includes physical chips, printed circuit boards, cables, power units, and peripheral devices.',
    createdAt: '2026-10-15',
    authorName: 'Engr. Marcus Sterling',
  },
  {
    id: 4002,
    subjectId: 4,
    subjectName: 'Computer Systems',
    lessonId: 402,
    lessonTitle: 'Computer Hardware',
    type: 'true_false',
    text: 'RAM (Random Access Memory) retains all of its stored data when computer electrical power is switched off.',
    points: 1,
    difficulty: 'easy',
    status: 'published',
    choices: [
      { id: 'true', value: 'true', label: 'True' },
      { id: 'false', value: 'false', label: 'False' },
    ],
    correctAnswer: 'false',
    explanation: 'RAM is volatile memory; capacitors and transistors lose their electrical charge when power is cut.',
    createdAt: '2026-10-16',
    authorName: 'Engr. Marcus Sterling',
  },
  {
    id: 4003,
    subjectId: 4,
    subjectName: 'Computer Systems',
    lessonId: 402,
    lessonTitle: 'Computer Hardware',
    type: 'identification',
    text: 'Which primary hardware component is known as the "brain" of the computer, executing the fetch-decode-execute cycle?',
    points: 2,
    difficulty: 'easy',
    status: 'published',
    correctAnswer: 'CPU',
    acceptedAnswers: ['CPU', 'Central Processing Unit', 'cpu', 'processor', 'microprocessor'],
    explanation: 'The Central Processing Unit (CPU) fetches instructions from memory, decodes opcodes, and executes computations.',
    createdAt: '2026-10-17',
    authorName: 'Engr. Marcus Sterling',
  },
  {
    id: 4004,
    subjectId: 4,
    subjectName: 'Computer Systems',
    lessonId: 404,
    lessonTitle: 'Operating Systems',
    type: 'essay',
    text: 'What is an Operating System (OS), and what are its core responsibilities in managing computer resources?',
    points: 5,
    difficulty: 'hard',
    status: 'published',
    sampleAnswerRubric: 'Rubric Criteria:\n1. OS Definition: System software acting as an intermediary between computer hardware and user application programs.\n2. Process Management: CPU scheduling, process creation, context switching, and thread synchronization.\n3. Memory Management: RAM allocation, virtual memory paging, memory protection between processes.\n4. File System & I/O: Managing storage disks, directories, file permissions, and device driver communication.',
    explanation: 'The operating system orchestrates CPU time, memory space, storage persistence, and security controls.',
    createdAt: '2026-10-18',
    authorName: 'Engr. Marcus Sterling',
  },
];

// Helper to convert QuestionBankItem to QuizQuestionItem
export function questionBankItemToQuizQuestion(q: QuestionBankItem, number?: number): QuizQuestionItem {
  return {
    id: q.id,
    number: number,
    questionBankId: q.id,
    text: q.text,
    type: q.type,
    points: q.points,
    choices: q.choices || (q.type === 'true_false' ? [
      { id: 'true', value: 'true', label: 'True' },
      { id: 'false', value: 'false', label: 'False' }
    ] : []),
    correctAnswer: q.correctAnswer,
    acceptedAnswers: q.acceptedAnswers,
    sampleAnswerRubric: q.sampleAnswerRubric,
    explanation: q.explanation,
  };
}

export const DEFAULT_QUIZZES: QuizItem[] = [
  {
    id: 1,
    subjectId: 1,
    subjectName: 'Database Management',
    title: 'Database Design & SQL Mastery Check',
    description: 'Test your understanding of DBMS architecture, primary/foreign key constraints, normalization, and SQL CRUD queries.',
    questionCount: 5,
    passingScore: 75,
    timeLimit: 15,
    attempts: 0,
    bestScore: null,
    status: 'published',
    questions: [
      questionBankItemToQuizQuestion(DEFAULT_QUESTIONS[0], 1),
      questionBankItemToQuizQuestion(DEFAULT_QUESTIONS[1], 2),
      questionBankItemToQuizQuestion(DEFAULT_QUESTIONS[2], 3),
      questionBankItemToQuizQuestion(DEFAULT_QUESTIONS[3], 4),
      questionBankItemToQuizQuestion(DEFAULT_QUESTIONS[4], 5),
    ],
  },
  {
    id: 2,
    subjectId: 2,
    subjectName: 'Web Development',
    title: 'Frontend HTML & CSS Essentials',
    description: 'Assess your skills in semantic HTML5 markup, CSS Box Model calculations, specificity rules, and responsive design.',
    questionCount: 5,
    passingScore: 70,
    timeLimit: 15,
    attempts: 0,
    bestScore: null,
    status: 'published',
    questions: [
      questionBankItemToQuizQuestion(DEFAULT_QUESTIONS[5], 1),
      questionBankItemToQuizQuestion(DEFAULT_QUESTIONS[6], 2),
      questionBankItemToQuizQuestion(DEFAULT_QUESTIONS[7], 3),
      questionBankItemToQuizQuestion(DEFAULT_QUESTIONS[8], 4),
      questionBankItemToQuizQuestion(DEFAULT_QUESTIONS[9], 5),
    ],
  },
  {
    id: 3,
    subjectId: 3,
    subjectName: 'Programming',
    title: 'Programming Logic & Algorithms Quiz',
    description: 'Verify your mastery of variables, loops, modular functions, and step-by-step algorithmic problem-solving.',
    questionCount: 5,
    passingScore: 70,
    timeLimit: 15,
    attempts: 0,
    bestScore: null,
    status: 'published',
    questions: [
      questionBankItemToQuizQuestion(DEFAULT_QUESTIONS[10], 1),
      questionBankItemToQuizQuestion(DEFAULT_QUESTIONS[11], 2),
      questionBankItemToQuizQuestion(DEFAULT_QUESTIONS[12], 3),
      questionBankItemToQuizQuestion(DEFAULT_QUESTIONS[13], 4),
      questionBankItemToQuizQuestion(DEFAULT_QUESTIONS[14], 5),
    ],
  },
  {
    id: 4,
    subjectId: 4,
    subjectName: 'Computer Systems',
    title: 'Computer Architecture & Systems Fundamentals',
    description: 'Check your knowledge of Von Neumann architecture, CPU instruction cycles, memory hierarchy, and operating system functions.',
    questionCount: 4,
    passingScore: 70,
    timeLimit: 15,
    attempts: 0,
    bestScore: null,
    status: 'published',
    questions: [
      questionBankItemToQuizQuestion(DEFAULT_QUESTIONS[15], 1),
      questionBankItemToQuizQuestion(DEFAULT_QUESTIONS[16], 2),
      questionBankItemToQuizQuestion(DEFAULT_QUESTIONS[17], 3),
      questionBankItemToQuizQuestion(DEFAULT_QUESTIONS[18], 4),
    ],
  },
];

/**
 * Filter questions belonging strictly to a subject.
 */
export function getSubjectQuestions(
  questions: QuestionBankItem[],
  subjectId: number,
  options?: { onlyPublished?: boolean; search?: string; type?: string; difficulty?: string; lessonId?: number }
): QuestionBankItem[] {
  return questions.filter((q) => {
    if (q.subjectId !== Number(subjectId)) return false;
    if (options?.onlyPublished && q.status === 'draft') return false;
    if (options?.type && options.type !== 'all' && q.type !== options.type) return false;
    if (options?.difficulty && options.difficulty !== 'all' && q.difficulty !== options.difficulty) return false;
    if (options?.lessonId && q.lessonId !== Number(options.lessonId)) return false;
    if (options?.search && options.search.trim()) {
      const term = options.search.toLowerCase();
      const match =
        q.text.toLowerCase().includes(term) ||
        (q.explanation && q.explanation.toLowerCase().includes(term)) ||
        (q.lessonTitle && q.lessonTitle.toLowerCase().includes(term));
      if (!match) return false;
    }
    return true;
  });
}

/**
 * Checks if a question from the question bank is currently referenced in any quiz
 */
export function isQuestionUsedInQuiz(quizzes: QuizItem[], questionId: number): { used: boolean; quizTitles: string[] } {
  const matches = quizzes.filter((qz) =>
    qz.questions && qz.questions.some((q) => q.questionBankId === questionId || q.id === questionId)
  );
  return {
    used: matches.length > 0,
    quizTitles: matches.map((q) => q.title),
  };
}

/**
 * Filter lessons belonging to a specific subject
 */
export function getSubjectLessons<T extends { subjectId: number; published?: boolean; title?: string; description?: string }>(
  lessons: T[],
  subjectId: number,
  options?: { onlyPublished?: boolean; search?: string }
): T[] {
  return lessons.filter((l) => {
    if (l.subjectId !== Number(subjectId)) return false;
    if (options?.onlyPublished && l.published === false) return false;
    if (options?.search) {
      const term = options.search.toLowerCase();
      const match = (l.title && l.title.toLowerCase().includes(term)) || (l.description && l.description.toLowerCase().includes(term));
      if (!match) return false;
    }
    return true;
  });
}

