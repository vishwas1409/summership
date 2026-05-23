require("dotenv").config();

const express = require("express");
const path = require("path");
const fs = require("fs/promises");
const bcrypt = require("bcryptjs");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const compression = require("compression");
const XLSX = require("xlsx");
const mysql = require("mysql2/promise");
const session = require("express-session");
const MySQLStoreFactory = require("express-mysql-session")(session);

const app = express();
const PORT = Number(process.env.PORT || 3000);
const TEAM_LIMIT = 40;
const isProduction = process.env.NODE_ENV === "production";
const ASSET_VERSION = "2026-05-23-16-9";
const DEFAULT_DOMAINS = [
  "AI",
  "Community",
  "EdTech",
  "EventTech",
  "HRTech",
  "PropTech",
  "RetailTech",
];

const SPONSOR_LOGOS = [
  { src: "/images/sponsors/sponsor-4.jpeg", alt: "CS Coworking logo", name: "CS Coworking", role: "Venue Partner" },
  { src: "https://www.image2url.com/r2/default/images/1779544078309-db6f76de-62e6-49f7-bbbc-e02ed3e291f2.jpg", alt: "Al Ansar logo", name: "Al Ansar", role: "Media Partner" },
];

const DEFAULT_PROBLEM_CATALOG = [
  {
    problemCode: "01",
    title: "Coworking Space CRM + ERP Platform (Multi Center Management)",
    domain: "PropTech",
    description:
      "Coworking spaces managing multiple branches struggle with fragmented operations across visitor handling, bookings, client onboarding, renewals, finances, and internal communication.",
    persona: "Coworking space operators, branch managers, community leads, and finance teams",
    problemStatement:
      "Coworking spaces managing multiple branches struggle with fragmented operations across visitor handling, bookings, client onboarding, renewals, finances, and internal communication. Most operators rely on spreadsheets, WhatsApp, separate booking tools, and manual tracking, leading to operational inefficiencies, missed renewals, poor occupancy visibility, and revenue leakage. There is no unified SaaS platform designed specifically for coworking operators that combines CRM, ERP, visitor management, booking systems, finance, and operations under one ecosystem.",
    solutionIdea:
      "Build a centralized multi-center Coworking CRM + ERP platform with modules for Smart Visitor Management, Conference Room Booking, Floor & Seat Availability Management, Client Onboarding Workflow, Quotation & Proposal Management, Lead Tracking, Client Renewals & Reminders, Employee & Team Management, Finance & Billing, Website CMS, Integrations Layer, Ticket & Resolution Management, Internal Task Management, Team Chat, Role Based Permissions, and Multi Location Dashboard.",
    whySelected: "Solves real operational bottlenecks and revenue leakage for coworking operators in a single unified system.",
    keyTechnologies: "Multi-tenant CRM/ERP architecture\nInteractive Floor Map Booking (SVG/Canvas)\nBilling & Subscription Automation\nRole-based Access Control (RBAC)\nNotification & Reminder Engine",
  },
  {
    problemCode: "02",
    title: "Learning Management System (EdTech LMS)",
    domain: "EdTech",
    description:
      "Educational institutes, coaching centers, training organizations, and cohort-based programs struggle with disconnected tools for courses, assignments, payments, and engagement.",
    persona: "Educational institutes, coaching centers, training organizations, and cohort-based programs",
    problemStatement:
      "Educational institutes, coaching centers, training organizations, and cohort-based programs often use multiple disconnected tools for courses, assignments, classes, payments, notifications, and student engagement. This fragmented setup creates operational overhead, poor student experience, delayed fee collections, and weak learning tracking. There is a need for an all-in-one LMS platform combining learning delivery, administration, communication, and monetization.",
    solutionIdea:
      "Build an all-in-one LMS platform combining: Digital Courses Marketplace, Course & Product Management, Fee Collection System, Automated Payment Reminders, Assignment Submission, Online Class Management, Batch Management, Student Communities, Group Chats, Notifications, Progress Tracking, Attendance, Certification, Faculty Dashboard, and Parent/Student Portal.",
    whySelected: "Reduces operational overhead and improves student learning outcomes by uniting management and content delivery.",
    keyTechnologies: "LMS Core Engine\nPayment Gateway Integration\nVideo Streaming & Online Class Webhooks\nAuto-generated Certificates (PDF)\nInteractive Student Portal",
  },
  {
    problemCode: "03",
    title: "Video Resume Job Platform",
    domain: "HRTech",
    description:
      "Traditional resumes fail to represent communication skills, confidence, personality, and practical abilities of candidates. Recruiters spend significant time screening profiles with limited context.",
    persona: "Job candidates, recruiters, hiring managers, and HR specialists",
    problemStatement:
      "Traditional resumes fail to represent communication skills, confidence, personality, and practical abilities of candidates. Recruiters spend significant time screening profiles with limited context, increasing hiring effort and reducing matching quality. Candidates also struggle to differentiate themselves in competitive job markets. A video-first hiring ecosystem can improve candidate visibility and recruiter efficiency.",
    solutionIdea:
      "Build a video-first hiring platform containing Candidate features (KYC Verification, Identity Validation, Profile Builder, Video Resume Upload, Record Resume Feature, PDF Resume Upload, Job Discovery, Apply to Companies, Skills Portfolio, Status Tracking) and Recruiter features (Recruiter Verification, Company Verification, Organization Profile, Candidate Search Engine, AI Matching, Interview Scheduling, Virtual Interviews, Candidate Chat, Hiring Pipeline Management).",
    whySelected: "Improves candidate visibility and recruiter efficiency through rich media context instead of flat PDF text.",
    keyTechnologies: "Video Recording & Streaming APIs\nAI Profile Matching & Resume Parsing\nKYC & Identity Verification\nInterview Scheduling Calendar Sync\nHiring Pipeline Kanban Board",
  },
  {
    problemCode: "04",
    title: "Salon Management System (Multi Branch)",
    domain: "RetailTech",
    description:
      "Salon businesses struggle to manage appointments, customer history, staff commissions, inventory, and billing across multiple centers, leading to double bookings and errors.",
    persona: "Salon owners, salon branch managers, stylists, and retail customers",
    problemStatement:
      "Salon businesses often manage appointments from multiple channels including websites, calls, WhatsApp, Instagram, and walk-ins. Managing bookings, customer history, staff commissions, inventory, and billing across multiple centers becomes complex and error-prone. Existing systems often lack complete omnichannel support and centralized branch management.",
    solutionIdea:
      "Build an omnichannel salon management platform featuring: Omnichannel Booking Management, Website Booking Integration, WhatsApp Booking, Call Based Appointments, Customer Database, POS, Billing & Invoicing, Discount Management, Membership Plans, Loyalty Programs, Staff Management, Commission Calculation, Notifications, Multi Center Operations, Inventory Management, and Reports & Analytics.",
    whySelected: "Provides a unified POS, booking engine, and staff commission tracker for the highly fragmented salon industry.",
    keyTechnologies: "Omnichannel Calendar Scheduling\nPOS Billing & Invoice Generation\nWhatsApp Business API Integrations\nCommission Calculation Algorithm\nInventory Alert System",
  },
  {
    problemCode: "05",
    title: "Multi Channel Auto Reply, Calls & Business Automation Platform",
    domain: "AI",
    description:
      "Managing customer enquiries manually across WhatsApp, Instagram, Facebook, LinkedIn, and Phone Calls causes delayed responses, missed leads, and poor customer experience.",
    persona: "Customer support teams, business owners, and digital marketers",
    problemStatement:
      "Businesses receive customer enquiries across WhatsApp, Instagram, Facebook, LinkedIn, phone calls, websites, and other platforms. Managing conversations manually causes delayed responses, missed leads, inconsistent communication, and poor customer experience. Companies need a unified conversational AI system capable of handling messages, voice calls, collecting data, booking appointments, and answering queries automatically.",
    solutionIdea:
      "Build a unified conversational AI platform with: WhatsApp Automation, Instagram Auto Reply, Facebook Inbox Automation, LinkedIn Messaging Automation, AI Voice Call Automation, Unified Inbox, AI Response Engine, Knowledge Base Training, Lead Capture, Booking Management, Customer Data Collection, Sheet Export, CRM Integration, Analytics Dashboard, Notifications, Team Assignment, and Workflow Automation.",
    whySelected: "Empowers SMBs with automated lead generation and responsive support across all major messaging channels.",
    keyTechnologies: "Social Media Messaging & Voice Call APIs (Twilio, Meta Graph, LinkedIn)\nLLM Conversational Agent (RAG/Knowledge Base)\nUnified Inbox Websockets\nWorkflow Automation Rules Engine\nGoogle Sheets / CRM Sync API",
  },
  {
    problemCode: "06",
    title: "Event Management Ecosystem (Hackathons, Workshops, College Events)",
    domain: "EventTech",
    description:
      "Event organizers manually manage registrations, sponsors, volunteers, and operations. Sponsors struggle to find events, and volunteers lack structured recognition.",
    persona: "Event organizers, student volunteers, corporate sponsors, and event participants",
    problemStatement:
      "Event organizers spend significant effort managing registrations, sponsors, volunteers, communications, leadership tracking, and event operations manually. Sponsors struggle to find relevant events while volunteers have no structured ecosystem for participation, recognition, and growth. The event ecosystem lacks a unified platform connecting organizers, volunteers, sponsors, and participants.",
    solutionIdea:
      "Build a multi-sided event platform with modules: Organizer Module (Event Creation, Registration Management, Sponsor Discovery, Volunteer Hiring, Budget Tracking, Communication Hub, Analytics Dashboard, Certificate Management), Volunteer Module (Volunteer Profiles, Event Applications, Skill Tags, Task Allocation, Performance Scores, Leadership Board, Achievement System), Sponsor Module (Sponsor Marketplace, Event Discovery, Industry Matching, ROI Tracking, Sponsorship Packages, Communication Tools), and Participant Module (Registration, Tickets, Event Updates, Networking, Certificates, Feedback System).",
    whySelected: "Creates a cohesive ecosystem linking organizers, sponsors, volunteers, and participants together.",
    keyTechnologies: "Event Registration & Ticketing (QR Codes)\nVolunteer Kanban Task Allocator\nSponsor Matching Algorithm\nBudget Analytics Charts\nAutomated Digital Certificates",
  },
  {
    problemCode: "07",
    title: "Open Innovation",
    domain: "Community",
    description:
      "Do you have a unique idea that doesn't fit into our pre-defined domains? Choose Open Innovation to pitch your own custom solution to a real-world problem.",
    persona: "Visionary builders, independent thinkers, and multidisciplinary teams",
    problemStatement:
      "Many teams have highly innovative, cross-domain ideas that do not fit neatly into existing hackathon tracks. Without a dedicated track for custom problem statements, these high-potential concepts remain unexplored and builders face limitations in demonstrating their creative freedom. The Open Innovation track welcomes any novel solution addressing any industry challenge.",
    solutionIdea:
      "Develop and pitch a custom product, service, or workflow designed to solve a verified real-world problem of your choice. Your project will be evaluated on complexity, implementation, and potential impact.",
    whySelected: "Encourages out-of-the-box thinking and ensures no high-impact idea is left behind due to strict category limits.",
    keyTechnologies: "Developer's Choice\nAny Modern Tech Stack\nAPIs and Integrations",
  },
];

function resolveDbConfig() {
  const connectionUrl =
    process.env.DATABASE_URL || process.env.MYSQL_URL || process.env.MYSQL_PUBLIC_URL;

  if (connectionUrl && /^mysql/i.test(connectionUrl)) {
    try {
      const parsed = new URL(connectionUrl);
      const host = parsed.hostname;
      return {
        host,
        port: Number(parsed.port || 3306),
        user: decodeURIComponent(parsed.username || "root"),
        password: decodeURIComponent(parsed.password || ""),
        database: decodeURIComponent(parsed.pathname.replace(/^\//, "") || "hackathon_selection"),
        ssl: host && !["localhost", "127.0.0.1"].includes(host) ? { rejectUnauthorized: false } : undefined,
      };
    } catch (error) {
      console.warn("Could not parse database URL:", error.message || error);
    }
  }

  const host =
    process.env.DB_HOST ||
    process.env.MYSQLHOST ||
    process.env.MYSQL_HOST ||
    (process.env.RAILWAY_ENVIRONMENT_NAME || process.env.RAILWAY_PROJECT_ID
      ? "127.0.0.1"
      : "localhost");
  const isRemoteHost = host && !["localhost", "127.0.0.1"].includes(host);

  return {
    host,
    port: Number(process.env.DB_PORT || process.env.MYSQLPORT || process.env.MYSQL_PORT || 3306),
    user: process.env.DB_USER || process.env.MYSQLUSER || process.env.MYSQL_USER || "root",
    password: process.env.DB_PASSWORD || process.env.MYSQLPASSWORD || process.env.MYSQL_PASSWORD || "",
    database:
      process.env.DB_NAME ||
      process.env.MYSQLDATABASE ||
      process.env.MYSQL_DATABASE ||
      "hackathon_selection",
    ssl:
      process.env.DB_SSL === "true" || (isProduction && isRemoteHost)
        ? { rejectUnauthorized: false }
        : undefined,
  };
}

function buildPool() {
  const dbConfig = resolveDbConfig();
  return mysql.createPool({
    ...dbConfig,
    waitForConnections: true,
    connectionLimit: 10,
    namedPlaceholders: true,
  });
}

const pool = buildPool();

function normalizeProblem(problem) {
  const problemCode = cleanOptionalText(problem.problemCode);
  const description = String(problem.description || "").trim();
  const persona = cleanOptionalText(problem.persona);
  const problemStatement = cleanOptionalText(problem.problemStatement);
  const solutionIdea = cleanOptionalText(problem.solutionIdea);
  const whySelected = cleanOptionalText(problem.whySelected);
  const keyTechnologyList = splitMultilineList(problem.keyTechnologies);
  const primaryStatement = problemStatement || description;

  return {
    ...problem,
    problemCode,
    description,
    persona,
    problemStatement: primaryStatement,
    solutionIdea,
    whySelected,
    keyTechnologyList,
    hasOverview: Boolean(problemStatement && problemStatement !== description),
    teamCount: Number(problem.teamCount || 0),
    availableSlots: Math.max(TEAM_LIMIT - Number(problem.teamCount || 0), 0),
    isFull: Number(problem.teamCount || 0) >= TEAM_LIMIT,
    searchText: `${problemCode || ""} ${problem.title} ${description} ${problem.domain} ${persona || ""} ${primaryStatement} ${solutionIdea || ""} ${whySelected || ""} ${keyTechnologyList.join(" ")}`
      .toLowerCase()
      .trim(),
  };
}

function groupProblemsByDomain(problems) {
  return problems.reduce((groups, problem) => {
    if (!groups[problem.domain]) {
      groups[problem.domain] = [];
    }
    groups[problem.domain].push(problem);
    return groups;
  }, {});
}

function setFlash(req, type, message) {
  req.session.flash = { type, message };
}

function consumeFlash(req) {
  const flash = req.session.flash || null;
  delete req.session.flash;
  return flash;
}

function requireAdmin(req, res, next) {
  if (!req.session.admin) {
    setFlash(req, "error", "Please sign in as admin to continue.");
    return res.redirect("/admin/login");
  }

  return next();
}

function requireParticipant(req, res, next) {
  if (!req.session.participant) {
    setFlash(req, "error", "Please sign up or log in as a participant first.");
    return res.redirect("/");
  }

  return next();
}

function validMobileNumber(number) {
  return /^[6-9]\d{9}$/.test(String(number || "").trim());
}

function validPassword(password) {
  return String(password || "").trim().length >= 6;
}

function validEmailAddress(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || "").trim());
}

function cleanOptionalText(value) {
  const normalized = String(value || "").trim();
  return normalized ? normalized : null;
}

function splitMultilineList(value) {
  return String(value || "")
    .split(/\r?\n/)
    .map((item) => item.trim().replace(/^[•*-]\s*/, ""))
    .filter(Boolean);
}

function escapeCsvValue(value) {
  const stringValue = String(value ?? "");
  if (/[",\n]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
}

function formatSelectionTimestamp(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString();
}

async function fetchAllSelections() {
  const [rows] = await pool.query(
    `SELECT
      ps.id,
      ps.participant_id AS participantId,
      ps.team_name AS teamName,
      COALESCE(NULLIF(ps.email_address, ''), ps.team_leader_name) AS emailAddress,
      ps.mobile_number AS mobileNumber,
      ps.created_at AS createdAt,
      p.id AS problemId,
      p.problem_code AS problemCode,
      p.title AS problemTitle,
      p.domain AS problemDomain
    FROM problem_selections ps
    INNER JOIN problems p ON p.id = ps.problem_id
    ORDER BY ps.created_at DESC`
  );

  return rows.map((row) => ({
    ...row,
    createdAtFormatted: formatSelectionTimestamp(row.createdAt),
  }));
}

async function initializeDatabase() {
  const schemaPath = path.join(__dirname, "db", "schema.sql");
  const schema = await fs.readFile(schemaPath, "utf8");
  const statements = schema
    .split(";")
    .map((statement) => statement.trim())
    .filter(Boolean);

  for (const statement of statements) {
    await pool.query(statement);
  }
}

async function ensureProblemBriefColumns() {
  const problemColumns = [
    ["problem_code", "VARCHAR(20) NULL AFTER title"],
    ["persona", "TEXT NULL AFTER description"],
    ["problem_statement", "TEXT NULL AFTER persona"],
    ["solution_idea", "TEXT NULL AFTER problem_statement"],
    ["why_selected", "TEXT NULL AFTER solution_idea"],
    ["key_technologies", "TEXT NULL AFTER why_selected"],
  ];

  for (const [name, definition] of problemColumns) {
    try {
      await pool.query(`ALTER TABLE problems ADD COLUMN ${name} ${definition}`);
    } catch (error) {
      if (error.code !== "ER_DUP_FIELDNAME") {
        throw error;
      }
    }
  }
}

async function ensureParticipantSelectionSupport() {
  try {
    await pool.query(
      "ALTER TABLE problem_selections ADD COLUMN participant_id INT NULL AFTER id"
    );
  } catch (error) {
    if (error.code !== "ER_DUP_FIELDNAME") {
      throw error;
    }
  }

  try {
    await pool.query(
      "ALTER TABLE problem_selections ADD CONSTRAINT fk_problem_selections_participant FOREIGN KEY (participant_id) REFERENCES participants(id) ON DELETE SET NULL"
    );
  } catch (error) {
    if (error.code !== "ER_CANT_CREATE_TABLE" && error.code !== "ER_DUP_KEY" && error.code !== "ER_FK_DUP_NAME") {
      throw error;
    }
  }

  try {
    await pool.query(
      "CREATE UNIQUE INDEX uq_problem_selections_participant ON problem_selections (participant_id)"
    );
  } catch (error) {
    if (error.code !== "ER_DUP_KEYNAME") {
      throw error;
    }
  }
}

async function ensureParticipantEmailColumns() {
  try {
    await pool.query(
      "ALTER TABLE participants ADD COLUMN email_address VARCHAR(255) NULL AFTER team_leader_name"
    );
  } catch (error) {
    if (error.code !== "ER_DUP_FIELDNAME") {
      throw error;
    }
  }

  try {
    await pool.query(
      "ALTER TABLE problem_selections ADD COLUMN email_address VARCHAR(255) NULL AFTER team_leader_name"
    );
  } catch (error) {
    if (error.code !== "ER_DUP_FIELDNAME") {
      throw error;
    }
  }

  await pool.query(
    `UPDATE participants
    SET email_address = team_leader_name
    WHERE (email_address IS NULL OR email_address = '')
      AND team_leader_name IS NOT NULL
      AND team_leader_name <> ''`
  );

  await pool.query(
    `UPDATE problem_selections
    SET email_address = team_leader_name
    WHERE (email_address IS NULL OR email_address = '')
      AND team_leader_name IS NOT NULL
      AND team_leader_name <> ''`
  );
}

async function syncDefaultProblemCatalog() {
  for (const item of DEFAULT_PROBLEM_CATALOG) {
    const [byCode] = await pool.query(
      "SELECT id FROM problems WHERE problem_code = ? LIMIT 1",
      [item.problemCode]
    );

    if (byCode.length > 0) {
      continue;
    }

    const [byTitle] = await pool.query(
      "SELECT id FROM problems WHERE title = ? LIMIT 1",
      [item.title]
    );

    if (byTitle.length > 0) {
      await pool.query(
        `UPDATE problems
        SET
          problem_code = COALESCE(problem_code, ?),
          domain = COALESCE(NULLIF(domain, ''), ?),
          description = COALESCE(NULLIF(description, ''), ?),
          persona = COALESCE(NULLIF(persona, ''), ?),
          problem_statement = COALESCE(NULLIF(problem_statement, ''), ?),
          solution_idea = COALESCE(NULLIF(solution_idea, ''), ?),
          why_selected = COALESCE(NULLIF(why_selected, ''), ?),
          key_technologies = COALESCE(NULLIF(key_technologies, ''), ?)
        WHERE id = ?`,
        [
          item.problemCode,
          item.domain,
          item.description,
          item.persona || null,
          item.problemStatement,
          item.solutionIdea || null,
          item.whySelected || null,
          item.keyTechnologies || null,
          byTitle[0].id,
        ]
      );
      continue;
    }

    await pool.query(
      `INSERT INTO problems
        (
          problem_code,
          title,
          domain,
          description,
          persona,
          problem_statement,
          solution_idea,
          why_selected,
          key_technologies
        )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        item.problemCode,
        item.title,
        item.domain,
        item.description,
        item.persona || null,
        item.problemStatement,
        item.solutionIdea || null,
        item.whySelected || null,
        item.keyTechnologies || null,
      ]
    );
  }
}

async function ensureAdminAccount() {
  const username = (process.env.ADMIN_USERNAME || "admin").trim();
  const password = process.env.ADMIN_PASSWORD || "ChangeMe123!";

  const [admins] = await pool.query("SELECT id FROM admins WHERE username = ? LIMIT 1", [username]);
  if (admins.length > 0) {
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await pool.query("INSERT INTO admins (username, password_hash) VALUES (?, ?)", [username, passwordHash]);
  console.log(`Bootstrapped admin account for username "${username}".`);
}

async function fetchParticipantSelection(participantId) {
  if (!participantId) {
    return null;
  }

  const [rows] = await pool.query(
    `SELECT
      ps.id,
      ps.created_at AS createdAt,
      p.id AS problemId,
      p.problem_code AS problemCode,
      p.title,
      p.domain,
      p.description,
      p.problem_statement AS problemStatement
    FROM problem_selections ps
    INNER JOIN problems p ON p.id = ps.problem_id
    WHERE ps.participant_id = ?
    LIMIT 1`,
    [participantId]
  );

  if (rows.length === 0) {
    return null;
  }

  return {
    ...rows[0],
    problemStatement: cleanOptionalText(rows[0].problemStatement) || rows[0].description,
    createdAtFormatted: formatSelectionTimestamp(rows[0].createdAt),
  };
}

async function fetchPublicData(participantId) {
  const [problemsRaw] = await pool.query(
    `SELECT
      p.id,
      p.problem_code AS problemCode,
      p.title,
      p.description,
      p.persona AS persona,
      p.problem_statement AS problemStatement,
      p.solution_idea AS solutionIdea,
      p.why_selected AS whySelected,
      p.key_technologies AS keyTechnologies,
      p.domain,
      p.created_at AS createdAt,
      COUNT(ps.id) AS teamCount
    FROM problems p
    LEFT JOIN problem_selections ps ON ps.problem_id = p.id
    WHERE p.is_active = 1
    GROUP BY
      p.id,
      p.title,
      p.description,
      p.problem_code,
      p.persona,
      p.problem_statement,
      p.solution_idea,
      p.why_selected,
      p.key_technologies,
      p.domain,
      p.created_at
    ORDER BY p.problem_code ASC, p.created_at DESC`
  );

  const [statsRows] = await pool.query(
    `SELECT
      (SELECT COUNT(*) FROM problems WHERE is_active = 1) AS problemCount,
      (SELECT COUNT(*) FROM problem_selections) AS selectionCount`
  );

  const problems = problemsRaw.map(normalizeProblem);
  const domains = Array.from(new Set([...DEFAULT_DOMAINS, ...problems.map((problem) => problem.domain)])).sort();
  const participantSelection = await fetchParticipantSelection(participantId);
  return {
    problems,
    problemGroups: groupProblemsByDomain(problems),
    domains,
    participantSelection,
    stats: {
      problemCount: Number(statsRows[0].problemCount || 0),
      selectionCount: Number(statsRows[0].selectionCount || 0),
    },
  };
}

async function fetchAdminData() {
  const [problemsRaw] = await pool.query(
    `SELECT
      p.id,
      p.problem_code AS problemCode,
      p.title,
      p.description,
      p.persona AS persona,
      p.problem_statement AS problemStatement,
      p.solution_idea AS solutionIdea,
      p.why_selected AS whySelected,
      p.key_technologies AS keyTechnologies,
      p.domain,
      p.is_active AS isActive,
      p.created_at AS createdAt,
      p.updated_at AS updatedAt,
      COUNT(ps.id) AS teamCount
    FROM problems p
    LEFT JOIN problem_selections ps ON ps.problem_id = p.id
    GROUP BY
      p.id,
      p.title,
      p.description,
      p.problem_code,
      p.persona,
      p.problem_statement,
      p.solution_idea,
      p.why_selected,
      p.key_technologies,
      p.domain,
      p.is_active,
      p.created_at,
      p.updated_at
    ORDER BY p.problem_code ASC, p.created_at DESC`
  );

  const allSelections = await fetchAllSelections();
  const recentSelections = allSelections.slice(0, 8);

  const [domainSummary] = await pool.query(
    `SELECT
      p.domain,
      COUNT(ps.id) AS teamCount
    FROM problems p
    LEFT JOIN problem_selections ps ON ps.problem_id = p.id
    WHERE p.is_active = 1
    GROUP BY p.domain
    ORDER BY teamCount DESC, p.domain ASC`
  );

  const problems = problemsRaw.map(normalizeProblem);
  const activeProblems = problems.filter((problem) => Number(problem.isActive) === 1);
  const fullProblems = activeProblems.filter((problem) => problem.isFull);

  return {
    problems,
    recentSelections,
    allSelections,
    domainSummary,
    domains: Array.from(new Set([...DEFAULT_DOMAINS, ...problems.map((problem) => problem.domain)])).sort(),
    stats: {
      totalProblems: problems.length,
      activeProblems: activeProblems.length,
      totalSelections: problems.reduce((sum, problem) => sum + problem.teamCount, 0),
      fullProblems: fullProblems.length,
    },
  };
}

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.set("trust proxy", 1);

// Production Middlewares
app.use(helmet({ contentSecurityPolicy: false })); // Disabled CSP to prevent blocking of inline styles/scripts and CDNs unless configured
app.use(compression());

app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, "public")));

const sessionStore = new MySQLStoreFactory(
  {
    createDatabaseTable: true,
    clearExpired: true,
    expiration: 1000 * 60 * 60 * 8,
    schema: {
      tableName: "sessions",
    },
  },
  pool
);

app.use(
  session({
    key: "hackathon.sid",
    secret: process.env.SESSION_SECRET || "replace-this-secret",
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: isProduction,
      maxAge: 1000 * 60 * 60 * 8,
    },
  })
);

app.use((req, res, next) => {
  res.locals.flash = consumeFlash(req);
  res.locals.admin = req.session.admin || null;
  res.locals.participant = req.session.participant || null;
  res.locals.currentYear = new Date().getFullYear();
  res.locals.teamLimit = TEAM_LIMIT;
  res.locals.assetVersion = ASSET_VERSION;
  next();
});

const adminLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many admin login attempts from this IP, please try again later.',
});

app.get("/", async (req, res, next) => {
  try {
    const publicData = await fetchPublicData(req.session.participant?.id);
    res.render("home", {
      title: "Summership Problem Statement Selection",
      sponsorLogos: SPONSOR_LOGOS,
      ...publicData,
    });
  } catch (error) {
    next(error);
  }
});

app.post("/participant/signup", async (req, res, next) => {
  const teamName = String(req.body.teamName || "").trim();
  const emailAddress = String(req.body.emailAddress || "").trim().toLowerCase();
  const mobileNumber = String(req.body.mobileNumber || "").trim();
  const password = req.body.password || "";
  const confirmPassword = req.body.confirmPassword || "";

  if (!teamName || !emailAddress || !mobileNumber || !password || !confirmPassword) {
    setFlash(req, "error", "Please complete all signup fields.");
    return res.redirect("/");
  }

  if (!validEmailAddress(emailAddress)) {
    setFlash(req, "error", "Please enter a valid email address.");
    return res.redirect("/");
  }

  if (!validMobileNumber(mobileNumber)) {
    setFlash(req, "error", "Please enter a valid 10-digit mobile number.");
    return res.redirect("/");
  }

  if (!validPassword(password)) {
    setFlash(req, "error", "Password must be at least 6 characters long.");
    return res.redirect("/");
  }

  if (password !== confirmPassword) {
    setFlash(req, "error", "Password and confirm password do not match.");
    return res.redirect("/");
  }

  try {
    const passwordHash = await bcrypt.hash(password, 12);
    const [result] = await pool.query(
      `INSERT INTO participants
        (team_name, team_leader_name, email_address, mobile_number, password_hash)
      VALUES (?, ?, ?, ?, ?)`,
      [teamName, emailAddress, emailAddress, mobileNumber, passwordHash]
    );

    req.session.participant = {
      id: result.insertId,
      teamName,
      emailAddress,
      mobileNumber,
    };

    setFlash(req, "success", `Welcome, ${teamName}. Your participant account is ready.`);
    return res.redirect("/");
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      setFlash(req, "error", "This mobile number is already registered. Please log in instead.");
      return res.redirect("/");
    }

    return next(error);
  }
});

app.post("/participant/login", async (req, res, next) => {
  const mobileNumber = String(req.body.mobileNumber || "").trim();
  const password = req.body.password || "";

  if (!mobileNumber || !password) {
    setFlash(req, "error", "Enter your mobile number and password.");
    return res.redirect("/");
  }

  try {
    const [participants] = await pool.query(
      `SELECT
        id,
        team_name AS teamName,
        COALESCE(NULLIF(email_address, ''), team_leader_name) AS emailAddress,
        mobile_number AS mobileNumber,
        password_hash AS passwordHash
      FROM participants
      WHERE mobile_number = ?
      LIMIT 1`,
      [mobileNumber]
    );

    if (participants.length === 0) {
      setFlash(req, "error", "Invalid participant login details.");
      return res.redirect("/");
    }

    const participant = participants[0];
    const passwordMatches = await bcrypt.compare(password, participant.passwordHash);

    if (!passwordMatches) {
      setFlash(req, "error", "Invalid participant login details.");
      return res.redirect("/");
    }

    req.session.participant = {
      id: participant.id,
      teamName: participant.teamName,
      emailAddress: participant.emailAddress,
      mobileNumber: participant.mobileNumber,
    };

    setFlash(req, "success", `Welcome back, ${participant.teamName}.`);
    return res.redirect("/");
  } catch (error) {
    return next(error);
  }
});

app.post("/participant/logout", requireParticipant, (req, res, next) => {
  delete req.session.participant;
  setFlash(req, "success", "Participant account signed out.");
  return req.session.save((error) => {
    if (error) {
      return next(error);
    }

    return res.redirect("/");
  });
});

app.post("/select", requireParticipant, async (req, res, next) => {
  const problemId = String(req.body.problemId || "").trim();
  const participantId = req.session.participant.id;

  if (!problemId) {
    setFlash(req, "error", "Please choose a problem statement first.");
    return res.redirect("/");
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [participantRows] = await connection.query(
      `SELECT
        id,
        team_name AS teamName,
        COALESCE(NULLIF(email_address, ''), team_leader_name) AS emailAddress,
        mobile_number AS mobileNumber
      FROM participants
      WHERE id = ?
      FOR UPDATE`,
      [participantId]
    );

    if (participantRows.length === 0) {
      throw new Error("Your participant account could not be found. Please sign in again.");
    }

    const participant = participantRows[0];
    const [existingSelections] = await connection.query(
      "SELECT id FROM problem_selections WHERE participant_id = ? FOR UPDATE",
      [participantId]
    );

    if (existingSelections.length > 0) {
      throw new Error("You have already selected a problem statement. Editing is disabled after confirmation.");
    }

    const [problemRows] = await connection.query(
      "SELECT id, title, is_active AS isActive FROM problems WHERE id = ? FOR UPDATE",
      [problemId]
    );

    if (problemRows.length === 0 || Number(problemRows[0].isActive) !== 1) {
      throw new Error("This problem statement is no longer available.");
    }

    const [countRows] = await connection.query(
      "SELECT COUNT(*) AS total FROM problem_selections WHERE problem_id = ?",
      [problemId]
    );

    const currentSelections = Number(countRows[0].total || 0);
    if (currentSelections >= TEAM_LIMIT) {
      throw new Error("This problem statement is already full. Please choose another one.");
    }

    await connection.query(
      `INSERT INTO problem_selections
        (participant_id, problem_id, team_name, team_leader_name, email_address, mobile_number)
      VALUES (?, ?, ?, ?, ?, ?)`,
      [
        participant.id,
        problemId,
        participant.teamName.trim(),
        participant.emailAddress.trim(),
        participant.emailAddress.trim(),
        participant.mobileNumber.trim(),
      ]
    );

    await connection.commit();
    setFlash(
      req,
      "success",
      `Problem statement locked for team "${participant.teamName}". It can no longer be edited.`
    );
    return res.redirect("/");
  } catch (error) {
    await connection.rollback();

    if (error.code === "ER_DUP_ENTRY") {
      setFlash(req, "error", "This participant account already has a saved selection.");
      return res.redirect("/");
    }

    setFlash(req, "error", error.message || "We could not save that team selection.");
    return res.redirect("/");
  } finally {
    connection.release();
  }
});

app.get("/admin/login", (req, res) => {
  if (req.session.admin) {
    return res.redirect("/admin");
  }

  return res.render("admin-login", {
    title: "Admin Login",
  });
});

app.post("/admin/login", adminLoginLimiter, async (req, res, next) => {
  const username = (req.body.username || "").trim();
  const password = req.body.password || "";

  if (!username || !password) {
    setFlash(req, "error", "Enter your admin username and password.");
    return res.redirect("/admin/login");
  }

  try {
    const [admins] = await pool.query(
      "SELECT id, username, password_hash AS passwordHash FROM admins WHERE username = ? LIMIT 1",
      [username]
    );

    if (admins.length === 0) {
      setFlash(req, "error", "Invalid admin credentials.");
      return res.redirect("/admin/login");
    }

    const admin = admins[0];
    const passwordMatches = await bcrypt.compare(password, admin.passwordHash);

    if (!passwordMatches) {
      setFlash(req, "error", "Invalid admin credentials.");
      return res.redirect("/admin/login");
    }

    req.session.admin = {
      id: admin.id,
      username: admin.username,
    };

    setFlash(req, "success", `Welcome back, ${admin.username}.`);
    return res.redirect("/admin");
  } catch (error) {
    return next(error);
  }
});

// Disallow changing the admin password or modifying admin accounts through the app.
app.post("/admin/change-password", requireAdmin, (req, res) => {
  setFlash(req, "error", "Admin password cannot be changed through the application.");
  return res.redirect("/admin");
});

app.post("/admin/admins/:id/update", requireAdmin, (req, res) => {
  setFlash(req, "error", "Modifying admin accounts is disabled.");
  return res.redirect("/admin");
});

app.post("/admin/admins/:id/delete", requireAdmin, (req, res) => {
  setFlash(req, "error", "Deleting admin accounts is disabled.");
  return res.redirect("/admin");
});

app.post("/admin/logout", requireAdmin, (req, res, next) => {
  req.session.destroy((error) => {
    if (error) {
      return next(error);
    }

    res.clearCookie("hackathon.sid");
    return res.redirect("/admin/login");
  });
});

app.get("/admin", requireAdmin, async (req, res, next) => {
  try {
    const adminData = await fetchAdminData();
    res.render("admin-dashboard", {
      title: "Admin Dashboard",
      ...adminData,
    });
  } catch (error) {
    next(error);
  }
});

app.get("/admin/selections/export.csv", requireAdmin, async (req, res, next) => {
  try {
    const selections = await fetchAllSelections();
    const headers = [
      "Team Name",
      "Email Address",
      "Mobile Number",
      "Problem Statement",
      "Domain",
      "Selected At",
    ];

    const rows = selections.map((item) => [
      item.teamName,
      item.emailAddress,
      item.mobileNumber,
      item.problemTitle,
      item.problemDomain,
      item.createdAtFormatted,
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map(escapeCsvValue).join(","))
      .join("\n");

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", 'attachment; filename="team-selections.csv"');
    res.send(csv);
  } catch (error) {
    next(error);
  }
});

app.get("/admin/selections/export.xlsx", requireAdmin, async (req, res, next) => {
  try {
    const selections = await fetchAllSelections();
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(
      selections.map((item) => ({
        "Team Name": item.teamName,
        "Email Address": item.emailAddress,
        "Mobile Number": item.mobileNumber,
        "Problem Statement": item.problemTitle,
        Domain: item.problemDomain,
        "Selected At": item.createdAtFormatted,
      }))
    );

    XLSX.utils.book_append_sheet(workbook, worksheet, "Selections");
    const buffer = XLSX.write(workbook, { bookType: "xlsx", type: "buffer" });

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader("Content-Disposition", 'attachment; filename="team-selections.xlsx"');
    res.send(buffer);
  } catch (error) {
    next(error);
  }
});

app.post("/admin/problems", requireAdmin, async (req, res, next) => {
  const {
    problemCode,
    title,
    domain,
    description,
    persona,
    problemStatement,
    solutionIdea,
    whySelected,
    keyTechnologies,
  } = req.body;

  if (!title || !domain || !description) {
    setFlash(req, "error", "Title, domain, and description are all required.");
    return res.redirect("/admin");
  }

  try {
    await pool.query(
      `INSERT INTO problems
        (
          problem_code,
          title,
          domain,
          description,
          persona,
          problem_statement,
          solution_idea,
          why_selected,
          key_technologies
        )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        cleanOptionalText(problemCode),
        title.trim(),
        domain.trim(),
        description.trim(),
        cleanOptionalText(persona),
        cleanOptionalText(problemStatement),
        cleanOptionalText(solutionIdea),
        cleanOptionalText(whySelected),
        cleanOptionalText(keyTechnologies),
      ]
    );

    setFlash(req, "success", "Problem statement created successfully.");
    return res.redirect("/admin");
  } catch (error) {
    return next(error);
  }
});

app.post("/admin/problems/:id/update", requireAdmin, async (req, res, next) => {
  const { id } = req.params;
  const {
    problemCode,
    title,
    domain,
    description,
    persona,
    problemStatement,
    solutionIdea,
    whySelected,
    keyTechnologies,
    isActive,
  } = req.body;

  if (!title || !domain || !description) {
    setFlash(req, "error", "Please complete the title, domain, and description fields.");
    return res.redirect("/admin");
  }

  try {
    await pool.query(
      `UPDATE problems
      SET
        problem_code = ?,
        title = ?,
        domain = ?,
        description = ?,
        persona = ?,
        problem_statement = ?,
        solution_idea = ?,
        why_selected = ?,
        key_technologies = ?,
        is_active = ?
      WHERE id = ?`,
      [
        cleanOptionalText(problemCode),
        title.trim(),
        domain.trim(),
        description.trim(),
        cleanOptionalText(persona),
        cleanOptionalText(problemStatement),
        cleanOptionalText(solutionIdea),
        cleanOptionalText(whySelected),
        cleanOptionalText(keyTechnologies),
        isActive === "1" ? 1 : 0,
        id,
      ]
    );

    setFlash(req, "success", "Problem statement updated.");
    return res.redirect("/admin");
  } catch (error) {
    return next(error);
  }
});

app.post("/admin/problems/:id/delete", requireAdmin, async (req, res, next) => {
  try {
    await pool.query("DELETE FROM problems WHERE id = ?", [req.params.id]);
    setFlash(req, "success", "Problem statement deleted.");
    return res.redirect("/admin");
  } catch (error) {
    return next(error);
  }
});

app.post("/admin/selections/:id/delete", requireAdmin, async (req, res, next) => {
  try {
    const [result] = await pool.query("DELETE FROM problem_selections WHERE id = ?", [req.params.id]);

    if (result.affectedRows === 0) {
      setFlash(req, "error", "That team selection could not be found.");
      return res.redirect("/admin");
    }

    setFlash(req, "success", "Team selection deleted.");
    return res.redirect("/admin");
  } catch (error) {
    return next(error);
  }
});

app.post("/admin/selections/:id/update", requireAdmin, async (req, res, next) => {
  const selectionId = String(req.params.id || "").trim();
  const teamName = String(req.body.teamName || "").trim();
  const emailAddress = String(req.body.emailAddress || "").trim().toLowerCase();
  const mobileNumber = String(req.body.mobileNumber || "").trim();
  const problemId = String(req.body.problemId || "").trim();

  if (!teamName || !emailAddress || !mobileNumber || !problemId) {
    setFlash(req, "error", "Please complete all selection edit fields.");
    return res.redirect("/admin");
  }

  if (!validEmailAddress(emailAddress)) {
    setFlash(req, "error", "Please enter a valid email address.");
    return res.redirect("/admin");
  }

  if (!validMobileNumber(mobileNumber)) {
    setFlash(req, "error", "Please enter a valid 10-digit mobile number.");
    return res.redirect("/admin");
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [selectionRows] = await connection.query(
      `SELECT id, participant_id AS participantId
      FROM problem_selections
      WHERE id = ?
      FOR UPDATE`,
      [selectionId]
    );

    if (selectionRows.length === 0) {
      throw new Error("That team selection could not be found.");
    }

    const selection = selectionRows[0];

    const [problemRows] = await connection.query(
      `SELECT id
      FROM problems
      WHERE id = ?
      LIMIT 1`,
      [problemId]
    );

    if (problemRows.length === 0) {
      throw new Error("The selected problem statement could not be found.");
    }

    await connection.query(
      `UPDATE problem_selections
      SET
        problem_id = ?,
        team_name = ?,
        team_leader_name = ?,
        email_address = ?,
        mobile_number = ?
      WHERE id = ?`,
      [problemId, teamName, emailAddress, emailAddress, mobileNumber, selectionId]
    );

    if (selection.participantId) {
      await connection.query(
        `UPDATE participants
        SET
          team_name = ?,
          team_leader_name = ?,
          email_address = ?,
          mobile_number = ?
        WHERE id = ?`,
        [teamName, emailAddress, emailAddress, mobileNumber, selection.participantId]
      );
    }

    await connection.commit();
    setFlash(req, "success", "Admin updated the team selection successfully.");
    return res.redirect("/admin");
  } catch (error) {
    await connection.rollback();

    if (error.code === "ER_DUP_ENTRY") {
      setFlash(req, "error", "That email or mobile number is already in use by another record.");
      return res.redirect("/admin");
    }

    setFlash(req, "error", error.message || "Could not update that team selection.");
    return res.redirect("/admin");
  } finally {
    connection.release();
  }
});

app.get("/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

app.use((error, req, res, next) => {
  console.error(error);
  res.status(500).render("error", {
    title: "Something went wrong",
    message: error.message || "Unexpected server error.",
  });
});

async function verifyDatabaseConnection(retries = 20, delayMs = 3000) {
  let lastError = null;

  for (let attempt = 1; attempt <= retries; attempt += 1) {
    try {
      await pool.query("SELECT 1");
      if (attempt > 1) {
        console.log(`Database ready after ${attempt} attempts.`);
      }
      return;
    } catch (error) {
      lastError = error;
      if (attempt < retries) {
        console.warn(
          `Database not ready (${attempt}/${retries}): ${error.code || error.message || "unknown error"}`
        );
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }

  const dbConfig = resolveDbConfig();
  const details = [
    lastError?.message,
    lastError?.code,
    `host=${dbConfig.host}`,
    `database=${dbConfig.database}`,
  ]
    .filter(Boolean)
    .join(" | ");
  throw new Error(
    `Database connection failed (${details}). Configure DB_HOST, DB_USER, DB_PASSWORD, DB_NAME or link Railway MySQL (MYSQLHOST, MYSQLUSER, MYSQLPASSWORD, MYSQLDATABASE).`
  );
}

async function startServer() {
  await verifyDatabaseConnection();
  await initializeDatabase();
  await ensureProblemBriefColumns();
  await ensureParticipantSelectionSupport();
  await ensureParticipantEmailColumns();
  await ensureAdminAccount();
  await syncDefaultProblemCatalog();

  app.listen(PORT, () => {
    console.log(`Hackathon selection app running on http://localhost:${PORT}`);
  });
}

startServer().catch((error) => {
  const detail = error?.message || error?.code || String(error);
  console.error("Failed to start server:", detail);
  if (error?.stack) {
    console.error(error.stack);
  }
  process.exit(1);
});
