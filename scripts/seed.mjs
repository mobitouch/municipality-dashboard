// Populates the SQLite database with a realistic demo dataset — 20 sample
// requests/complaints spanning every status, plus their notifications and
// activity history. Structural data (departments, categories) is created
// by the app itself on first boot (see lib/db/bootstrap.ts); this script
// only adds the illustrative case data on top of it.
//
// Run with `npm run seed`. Safe to re-run: it clears existing requests,
// notes, activity, and notifications before reinserting, but never touches
// user accounts or API keys.
import path from "node:path";
import { fileURLToPath } from "node:url";
import { DatabaseSync } from "node:sqlite";

import { MIGRATIONS } from "../lib/db/schema.ts";
import { DEFAULT_CATEGORIES, DEFAULT_DEPARTMENTS } from "../lib/db/defaults.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = process.env.DATABASE_PATH
  ? path.resolve(/* turbopackIgnore: true */ process.cwd(), process.env.DATABASE_PATH)
  : path.join(__dirname, "..", "data", "dashboard.db");

function iso(dateStr, hoursOffset = 0) {
  const d = new Date(`${dateStr}T09:00:00Z`);
  d.setHours(d.getHours() + hoursOffset);
  return d.toISOString();
}

function sourceLabel(source) {
  if (source === "chatbot") return "Citizen (via chatbot)";
  if (source === "website") return "Citizen (via website)";
  if (source === "phone") return "Citizen (via phone)";
  return "Citizen (walk-in)";
}

const STAFF = [
  { id: "staff-karim", name: "Karim Yazbeck", role: "Field Technician", departmentId: "dept-public-works", email: "karim.yazbeck@mobitouch.demo", phone: "+961 70 112 233" },
  { id: "staff-rania", name: "Rania Haddad", role: "Field Supervisor", departmentId: "dept-public-works", email: "rania.haddad@mobitouch.demo", phone: "+961 71 223 344" },
  { id: "staff-tarek", name: "Tarek Zeidan", role: "Electrician", departmentId: "dept-public-works", email: "tarek.zeidan@mobitouch.demo", phone: "+961 76 334 455" },
  { id: "staff-walid", name: "Walid Fares", role: "Field Technician", departmentId: "dept-sanitation", email: "walid.fares@mobitouch.demo", phone: "+961 70 445 566" },
  { id: "staff-maria", name: "Maria Abi Saab", role: "Operations Coordinator", departmentId: "dept-sanitation", email: "maria.abisaab@mobitouch.demo", phone: "+961 71 556 677" },
  { id: "staff-maya", name: "Maya Khoury", role: "Civil Engineer", departmentId: "dept-water", email: "maya.khoury@mobitouch.demo", phone: "+961 76 667 788" },
  { id: "staff-joseph", name: "Joseph Rahme", role: "Field Technician", departmentId: "dept-water", email: "joseph.rahme@mobitouch.demo", phone: "+961 70 778 899" },
  { id: "staff-sami", name: "Sami Abou Rjeily", role: "Parks Technician", departmentId: "dept-parks", email: "sami.abourjeily@mobitouch.demo", phone: "+961 71 889 900" },
  { id: "staff-nadine", name: "Nadine Chami", role: "Code Inspector", departmentId: "dept-code-enforcement", email: "nadine.chami@mobitouch.demo", phone: "+961 76 990 011" },
  { id: "staff-georges", name: "Georges Matta", role: "Permits Officer", departmentId: "dept-permits", email: "georges.matta@mobitouch.demo", phone: "+961 70 101 202" },
  { id: "staff-elias", name: "Elias Nakhle", role: "Public Safety Officer", departmentId: "dept-public-safety", email: "elias.nakhle@mobitouch.demo", phone: "+961 71 212 303" },
  { id: "staff-layla", name: "Layla Saade", role: "Administration Coordinator", departmentId: "dept-admin", email: "layla.saade@mobitouch.demo", phone: "+961 76 323 404" },
];

// Head-of-department names layered onto the structural defaults, purely
// for demo flavour.
const DEPARTMENT_HEADS = {
  "dept-public-works": "Rania Haddad",
  "dept-sanitation": "Maria Abi Saab",
  "dept-water": "Maya Khoury",
  "dept-parks": "Sami Abou Rjeily",
  "dept-code-enforcement": "Nadine Chami",
  "dept-permits": "Georges Matta",
  "dept-public-safety": "Elias Nakhle",
  "dept-admin": "Layla Saade",
};

const CATEGORY_ID_BY_NAME = Object.fromEntries(
  DEFAULT_CATEGORIES.map((category) => [category.name, category])
);

// [citizenName, phone, category, location, description, dateSubmitted, priority, status, assignedStaffId, resolvedAt, source, image, note, rejectedReason]
const RAW_REQUESTS = [
  ["Nadia Karam", "+961 3 101 010", "Roads & Potholes", "Hamra Street, near the pharmacy", "A large pothole has formed in the middle of the road, causing damage to passing vehicles.", "2026-02-03", "Normal", "Closed", "staff-karim", "2026-02-10", "website", "pothole.svg"],
  ["Elie Boutros", "+961 3 202 020", "Waste Collection", "Furn El Chebbak main road", "Garbage has not been collected in this area for several days, the bins are overflowing.", "2026-02-18", "High", "Resolved", "staff-walid", "2026-02-21", "website"],
  ["Rita Saliba", "+961 3 303 030", "Water & Sewage", "Verdun, Rue Verdun 730", "There is a continuous water leak from an underground pipe, water is pooling on the street.", "2026-03-02", "Urgent", "Resolved", "staff-joseph", "2026-03-05", "phone", "water-leak.svg"],
  ["Fadi Chalhoub", "+961 3 404 040", "Permits & Licensing", "Municipality front desk", "Citizen is asking about the requirements and steps to renew a commercial business license.", "2026-03-14", "Low", "Closed", "staff-georges", "2026-03-15", "walk-in"],
  ["Hala Naccache", "+961 3 505 050", "Illegal Dumping", "Jisr El Wati, industrial zone", "Construction debris and household waste is being dumped on the empty lot next to the building.", "2026-03-25", "High", "Rejected", null, null, "website", null, null, "Location falls outside municipal boundary; forwarded to regional authority."],
  ["Antoine Freij", "+961 3 606 060", "Noise Complaints", "Mar Mikhael, behind the church", "Excessive noise from a nearby workshop late at night is disturbing residents.", "2026-04-04", "Normal", "Resolved", "staff-nadine", "2026-04-07", "phone", null, "Workshop owner issued a formal warning and agreed to stop after 8 PM."],
  ["Sarah Moussa", "+961 3 707 070", "Street Lighting", "Gemmayze, Rue Gouraud", "Streetlight has been flickering and turning off intermittently for the past two weeks.", "2026-04-12", "Normal", "Closed", "staff-rania", "2026-04-16", "website"],
  ["Jad Khalil", "+961 3 808 080", "Parks & Trees", "Sioufi Garden entrance", "A large tree branch has fallen and is blocking part of the garden entrance after last night's storm.", "2026-04-20", "High", "Resolved", "staff-sami", "2026-04-23", "website", "tree.svg"],
  ["Christelle Aoun", "+961 3 909 090", "Roads & Potholes", "Badaro Street, next to the school", "Multiple potholes near the school entrance are a safety risk for children.", "2026-05-03", "Normal", "In Progress", "staff-karim", null, "website", null, "Materials ordered, repair scheduled for next week."],
  ["Marc Sfeir", "+961 3 111 011", "Waste Collection", "Bourj Hammoud, Marash street", "Waste collection has been irregular for the past two weeks in this area.", "2026-05-11", "High", "In Progress", "staff-walid", null, "phone"],
  ["Diala Haddad", "+961 3 121 212", "Water & Sewage", "Zalka highway service road", "A burst pipe is flooding the service road and affecting traffic.", "2026-05-22", "Urgent", "In Progress", "staff-joseph", null, "phone", "water-leak.svg", "Emergency crew dispatched, temporary patch applied, full repair pending parts."],
  ["Ziad Rizk", "+961 3 131 313", "Permits & Licensing", "Municipality front desk", "Citizen submitted an application for a new outdoor seating permit for a restaurant.", "2026-06-02", "Low", "Assigned", "staff-georges", null, "walk-in"],
  ["Layal Achkar", "+961 3 141 414", "Street Lighting", "Ain El Mreisseh corniche", "Several streetlights along the corniche walkway are not turning on at night.", "2026-06-09", "Normal", "Assigned", "staff-tarek", null, "website"],
  ["Youssef Daou", "+961 3 151 515", "Noise Complaints", "Baabda main road, near the Serail", "Loud construction work is starting before permitted hours.", "2026-06-15", "Normal", "Under Review", null, null, "phone"],
  ["Carla Nasrallah", "+961 3 161 616", "Illegal Dumping", "Dora highway, near the overpass", "Household appliances and furniture have been dumped under the highway overpass.", "2026-06-24", "High", "Assigned", "staff-maria", null, "website"],
  ["Ramzi Abou Khalil", "+961 3 171 717", "Parks & Trees", "Antelias main square", "A tree in the public square needs trimming as branches are touching power lines.", "2026-07-01", "Normal", "Under Review", null, null, "website"],
  ["Nour El Khoury", "+961 3 181 818", "Roads & Potholes", "Dbayeh residential area", "Deep pothole on a residential street is collecting water and growing larger.", "2026-07-08", "High", "New", null, null, "website"],
  ["Tony Maroun", "+961 3 191 919", "Waste Collection", "Zouk Mikael, church street", "Recycling bins have not been emptied in over a week.", "2026-07-15", "Normal", "New", null, null, "website"],
  ["Lea Bassil", "+961 3 202 121", "Water & Sewage", "Jounieh Bay, coastal road", "Water pressure has dropped significantly in the whole building over the past two days.", "2026-07-19", "Urgent", "Under Review", null, null, "phone", "water-leak.svg"],
  ["Wissam Tannous", "+961 3 212 222", "Street Lighting", "Corniche Road, near the lighthouse", "The streetlight at the corner has been completely out for three nights, making the area unsafe for pedestrians.", "2026-07-22", "Urgent", "New", null, null, "chatbot", "streetlight.svg"],
];

function staffName(sid) {
  return STAFF.find((s) => s.id === sid)?.name;
}
function deptName(did) {
  return DEFAULT_DEPARTMENTS.find((d) => d.id === did)?.name;
}

let idCounter = 0;
function id(prefix) {
  idCounter += 1;
  return `${prefix}-demo-${String(idCounter).padStart(4, "0")}`;
}

function buildHistory({ dateSubmitted, status, source, departmentId, assignedStaffId, resolvedAt, rejectedReason }) {
  const history = [
    {
      id: id("act"),
      timestamp: iso(dateSubmitted, 0),
      actor: sourceLabel(source),
      action: "Request submitted",
      detail: "New request received and logged in the system.",
    },
  ];

  if (status === "Rejected") {
    history.push({
      id: id("act"),
      timestamp: iso(dateSubmitted, 22),
      actor: deptName(departmentId) ?? "System",
      action: "Status changed",
      detail: `New -> Rejected. Reason: ${rejectedReason}`,
    });
    return history;
  }

  if (status === "New") return history;

  history.push({
    id: id("act"),
    timestamp: iso(dateSubmitted, 4),
    actor: "System",
    action: "Status changed",
    detail: "New -> Under Review",
  });
  if (status === "Under Review") return history;

  history.push({
    id: id("act"),
    timestamp: iso(dateSubmitted, 20),
    actor: "Dispatcher",
    action: "Assigned",
    detail: `Assigned to ${deptName(departmentId)}${assignedStaffId ? ` — ${staffName(assignedStaffId)}` : ""}`,
  });
  history.push({
    id: id("act"),
    timestamp: iso(dateSubmitted, 21),
    actor: "System",
    action: "Status changed",
    detail: "Under Review -> Assigned",
  });
  if (status === "Assigned") return history;

  history.push({
    id: id("act"),
    timestamp: iso(dateSubmitted, 30),
    actor: staffName(assignedStaffId) ?? "Field team",
    action: "Status changed",
    detail: "Assigned -> In Progress",
  });
  if (status === "In Progress") return history;

  history.push({
    id: id("act"),
    timestamp: resolvedAt ? iso(resolvedAt, 10) : iso(dateSubmitted, 72),
    actor: staffName(assignedStaffId) ?? "Field team",
    action: "Status changed",
    detail: `In Progress -> ${status}`,
  });
  return history;
}

function buildRequests() {
  const requests = RAW_REQUESTS.map(
    ([citizenName, phone, categoryName, location, description, dateSubmitted, priority, status, assignedStaffId, resolvedAt, source, image, note, rejectedReason]) => {
      const category = CATEGORY_ID_BY_NAME[categoryName];
      const history = buildHistory({
        dateSubmitted,
        status,
        source,
        departmentId: category.defaultDepartmentId,
        assignedStaffId,
        resolvedAt,
        rejectedReason,
      });
      const internalNotes = note
        ? [
            {
              id: id("note"),
              author: staffName(assignedStaffId) ?? deptName(category.defaultDepartmentId) ?? "Staff",
              timestamp: iso(resolvedAt ?? dateSubmitted, 40),
              note,
            },
          ]
        : [];

      return {
        id: id("req"),
        referenceNumber: "",
        kind: category.kind,
        categoryName,
        citizenName,
        phone,
        email: "",
        categoryId: category.id,
        departmentId: status === "New" ? null : category.defaultDepartmentId,
        assignedStaffId: assignedStaffId ?? null,
        location,
        description,
        dateSubmitted: iso(dateSubmitted, 0),
        priority,
        status,
        source,
        attachedImage: image ? `/demo/${image}` : null,
        internalNotes,
        activityHistory: history,
        resolvedAt: resolvedAt ? iso(resolvedAt, 34) : null,
      };
    }
  );

  requests
    .slice()
    .sort((a, b) => new Date(a.dateSubmitted) - new Date(b.dateSubmitted))
    .forEach((request, index) => {
      request.referenceNumber = `${request.kind === "complaint" ? "CMP" : "REQ"}-2026-${String(index + 1).padStart(4, "0")}`;
    });

  return requests;
}

function buildNotifications(requests) {
  const notifications = [];
  requests.forEach((request) => {
    notifications.push({
      id: id("notif"),
      timestamp: request.dateSubmitted,
      recipient: request.citizenName,
      channel: request.source === "phone" ? "SMS" : "Email",
      message: `Your ${request.kind} ${request.referenceNumber} ("${request.categoryName}") has been received and logged.`,
      relatedRequestId: request.id,
    });
    if (request.status !== "New" && request.status !== "Rejected") {
      notifications.push({
        id: id("notif"),
        timestamp: request.activityHistory[request.activityHistory.length - 1].timestamp,
        recipient: request.citizenName,
        channel: request.source === "phone" ? "SMS" : "Email",
        message: `Update on ${request.referenceNumber}: your ${request.kind} is now "${request.status}".`,
        relatedRequestId: request.id,
      });
    }
    if (request.status === "Rejected") {
      notifications.push({
        id: id("notif"),
        timestamp: request.activityHistory[request.activityHistory.length - 1].timestamp,
        recipient: request.citizenName,
        channel: "Email",
        message: `Update on ${request.referenceNumber}: your ${request.kind} could not be processed. Reason provided in-app.`,
        relatedRequestId: request.id,
      });
    }
  });
  notifications.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  return notifications;
}

function migrate(db) {
  const current = db.prepare("PRAGMA user_version").get()?.user_version ?? 0;
  for (let version = current; version < MIGRATIONS.length; version++) {
    db.exec("BEGIN IMMEDIATE");
    try {
      db.exec(MIGRATIONS[version]);
      db.exec(`PRAGMA user_version = ${version + 1}`);
      db.exec("COMMIT");
    } catch (error) {
      db.exec("ROLLBACK");
      throw error;
    }
  }
}

function ensureStructure(db, now) {
  const deptCount = db.prepare("SELECT COUNT(*) AS c FROM departments").get().c;
  if (deptCount === 0) {
    const insert = db.prepare(
      `INSERT INTO departments (id, name, head_of_department, description, email, phone, is_active, created_at, updated_at)
       VALUES (:id, :name, :head, :description, '', '', 1, :now, :now)`
    );
    for (const department of DEFAULT_DEPARTMENTS) {
      insert.run({
        id: department.id,
        name: department.name,
        head: DEPARTMENT_HEADS[department.id] ?? "",
        description: department.description,
        now,
      });
    }
  } else {
    const update = db.prepare(
      "UPDATE departments SET head_of_department = :head WHERE id = :id AND head_of_department = ''"
    );
    for (const [deptId, head] of Object.entries(DEPARTMENT_HEADS)) {
      update.run({ id: deptId, head });
    }
  }

  const categoryCount = db.prepare("SELECT COUNT(*) AS c FROM categories").get().c;
  if (categoryCount === 0) {
    const insert = db.prepare(
      `INSERT INTO categories (id, name, kind, default_department_id, is_active, sort_order, created_at, updated_at)
       VALUES (:id, :name, :kind, :departmentId, 1, :sortOrder, :now, :now)`
    );
    DEFAULT_CATEGORIES.forEach((category, index) => {
      insert.run({
        id: category.id,
        name: category.name,
        kind: category.kind,
        departmentId: category.defaultDepartmentId,
        sortOrder: index,
        now,
      });
    });
  }
}

function seedStaff(db, now) {
  const insert = db.prepare(
    `INSERT INTO staff (id, name, role, department_id, email, phone, is_active, created_at, updated_at)
     VALUES (:id, :name, :role, :departmentId, :email, :phone, 1, :now, :now)
     ON CONFLICT (id) DO UPDATE SET name = excluded.name, role = excluded.role`
  );
  for (const person of STAFF) {
    insert.run({ ...person, now });
  }
}

function clearDemoContent(db) {
  // Wipe generated case data but leave structure, user accounts, and API
  // keys untouched — re-running this script must never lock anyone out.
  db.exec("DELETE FROM notifications");
  db.exec("DELETE FROM request_notes");
  db.exec("DELETE FROM request_activity");
  db.exec("DELETE FROM requests");
}

function insertRequests(db, requests) {
  const insertRequest = db.prepare(
    `INSERT INTO requests (
       id, reference_number, kind, citizen_name, phone, email, category_id, department_id,
       assigned_staff_id, location, description, priority, status, source, attached_image,
       date_submitted, due_at, resolved_at, created_at, updated_at)
     VALUES (
       :id, :referenceNumber, :kind, :citizenName, :phone, :email, :categoryId, :departmentId,
       :assignedStaffId, :location, :description, :priority, :status, :source, :attachedImage,
       :dateSubmitted, NULL, :resolvedAt, :dateSubmitted, :dateSubmitted)`
  );
  const insertNote = db.prepare(
    `INSERT INTO request_notes (id, request_id, author, note, created_at)
     VALUES (:id, :requestId, :author, :note, :createdAt)`
  );
  const insertActivity = db.prepare(
    `INSERT INTO request_activity (id, request_id, actor, action, detail, created_at)
     VALUES (:id, :requestId, :actor, :action, :detail, :createdAt)`
  );

  for (const request of requests) {
    insertRequest.run({
      id: request.id,
      referenceNumber: request.referenceNumber,
      kind: request.kind,
      citizenName: request.citizenName,
      phone: request.phone,
      email: request.email,
      categoryId: request.categoryId,
      departmentId: request.departmentId,
      assignedStaffId: request.assignedStaffId,
      location: request.location,
      description: request.description,
      priority: request.priority,
      status: request.status,
      source: request.source,
      attachedImage: request.attachedImage,
      dateSubmitted: request.dateSubmitted,
      resolvedAt: request.resolvedAt,
    });

    for (const note of request.internalNotes) {
      insertNote.run({
        id: note.id,
        requestId: request.id,
        author: note.author,
        note: note.note,
        createdAt: note.timestamp,
      });
    }
    for (const activity of request.activityHistory) {
      insertActivity.run({
        id: activity.id,
        requestId: request.id,
        actor: activity.actor,
        action: activity.action,
        detail: activity.detail,
        createdAt: activity.timestamp,
      });
    }
  }
}

function insertNotifications(db, notifications) {
  const insert = db.prepare(
    `INSERT INTO notifications (id, request_id, recipient, channel, message, created_at)
     VALUES (:id, :requestId, :recipient, :channel, :message, :createdAt)`
  );
  for (const notification of notifications) {
    insert.run({
      id: notification.id,
      requestId: notification.relatedRequestId,
      recipient: notification.recipient,
      channel: notification.channel,
      message: notification.message,
      createdAt: notification.timestamp,
    });
  }
}

export function seed() {
  const db = new DatabaseSync(DB_PATH);
  db.exec("PRAGMA journal_mode = WAL");
  db.exec("PRAGMA foreign_keys = ON");

  const now = new Date().toISOString();
  migrate(db);

  db.exec("BEGIN IMMEDIATE");
  try {
    ensureStructure(db, now);
    seedStaff(db, now);
    clearDemoContent(db);

    const requests = buildRequests();
    insertRequests(db, requests);
    insertNotifications(db, buildNotifications(requests));

    db.exec("COMMIT");
    return { requests: requests.length, path: DB_PATH };
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  } finally {
    db.close();
  }
}

const isMain = process.argv[1] && import.meta.url === new URL(process.argv[1], "file://").href;
if (isMain || process.argv[1]?.endsWith("seed.mjs")) {
  const result = seed();
  console.log(`Seeded ${result.requests} demo requests -> ${result.path}`);
}
