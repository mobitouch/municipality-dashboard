// Builds the demo dataset (departments, staff, requests, notifications).
// Run directly with `npm run seed` to write data/db.json to disk, or
// import { buildDb } from this module (used by the in-app "Reset Demo
// Data" button in Settings) to regenerate it in-process.
import fs from "fs";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";

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

export function buildDb() {
  const departments = [
    {
      id: "dept-public-works",
      name: "Public Works",
      headOfDepartment: "Rania Haddad",
      description: "Roads, street lighting, and public infrastructure maintenance.",
    },
    {
      id: "dept-sanitation",
      name: "Sanitation Services",
      headOfDepartment: "Maria Abi Saab",
      description: "Waste collection, street cleaning, and illegal dumping response.",
    },
    {
      id: "dept-water",
      name: "Water & Sewage Authority",
      headOfDepartment: "Maya Khoury",
      description: "Water supply, leakage repair, and sewage network maintenance.",
    },
    {
      id: "dept-parks",
      name: "Parks & Environment",
      headOfDepartment: "Sami Abou Rjeily",
      description: "Parks, green spaces, and tree maintenance.",
    },
    {
      id: "dept-code-enforcement",
      name: "Code Enforcement",
      headOfDepartment: "Nadine Chami",
      description: "Noise, zoning, and municipal code compliance.",
    },
    {
      id: "dept-permits",
      name: "Permits & Licensing Office",
      headOfDepartment: "Georges Matta",
      description: "Building permits, business licenses, and municipal authorizations.",
    },
    {
      id: "dept-public-safety",
      name: "Public Safety",
      headOfDepartment: "Elias Nakhle",
      description: "Emergency response coordination and public safety concerns.",
    },
    {
      id: "dept-admin",
      name: "Administration",
      headOfDepartment: "Layla Saade",
      description: "General administration and citizen services coordination.",
    },
  ];

  const staff = [
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

  // category -> { defaultDepartmentId, kind } — "complaint" categories are ones
  // about service quality/nuisance, "request" categories are service/infra asks.
  const CATEGORY_META = {
    "Street Lighting": { departmentId: "dept-public-works", kind: "request" },
    "Roads & Potholes": { departmentId: "dept-public-works", kind: "request" },
    "Waste Collection": { departmentId: "dept-sanitation", kind: "complaint" },
    "Illegal Dumping": { departmentId: "dept-sanitation", kind: "complaint" },
    "Water & Sewage": { departmentId: "dept-water", kind: "request" },
    "Parks & Trees": { departmentId: "dept-parks", kind: "request" },
    "Noise Complaints": { departmentId: "dept-code-enforcement", kind: "complaint" },
    "Permits & Licensing": { departmentId: "dept-permits", kind: "request" },
  };

  function staffName(sid) {
    return staff.find((s) => s.id === sid)?.name;
  }
  function deptName(did) {
    return departments.find((d) => d.id === did)?.name;
  }

  let idCounter = 0;
  function id(prefix) {
    idCounter += 1;
    return `${prefix}-${String(idCounter).padStart(4, "0")}`;
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

  // [citizenName, phone, category, location, description, dateSubmitted, priority, status, assignedStaffId, resolvedAt, source, image, note, rejectedReason]
  const raw = [
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

  const requests = raw.map(
    ([citizenName, phone, category, location, description, dateSubmitted, priority, status, assignedStaffId, resolvedAt, source, image, note, rejectedReason]) => {
      const meta = CATEGORY_META[category];
      const history = buildHistory({
        dateSubmitted,
        status,
        source,
        departmentId: meta.departmentId,
        assignedStaffId,
        resolvedAt,
        rejectedReason,
      });
      const internalNotes = note
        ? [
            {
              id: id("note"),
              author: staffName(assignedStaffId) ?? deptName(meta.departmentId) ?? "Staff",
              timestamp: iso(resolvedAt ?? dateSubmitted, 40),
              note,
            },
          ]
        : [];

      return {
        id: id("req"),
        referenceNumber: "", // filled below once ordered by date
        kind: meta.kind,
        citizenName,
        phone,
        category,
        departmentId: status === "New" ? null : meta.departmentId,
        location,
        description,
        dateSubmitted: iso(dateSubmitted, 0),
        priority,
        status,
        assignedStaffId: assignedStaffId ?? null,
        attachedImage: image ? `/demo/${image}` : null,
        internalNotes,
        activityHistory: history,
        source,
        resolvedAt: resolvedAt ? iso(resolvedAt, 34) : null,
      };
    }
  );

  requests
    .slice()
    .sort((a, b) => new Date(a.dateSubmitted) - new Date(b.dateSubmitted))
    .forEach((r, i) => {
      r.referenceNumber = `REQ-2026-${String(i + 1).padStart(4, "0")}`;
    });

  const notifications = [];
  requests.forEach((r) => {
    notifications.push({
      id: id("notif"),
      timestamp: r.dateSubmitted,
      recipient: r.citizenName,
      channel: r.source === "phone" ? "SMS" : "Email",
      message: `Your request ${r.referenceNumber} ("${r.category}") has been received and logged.`,
      relatedRequestId: r.id,
    });
    if (r.status !== "New" && r.status !== "Rejected") {
      notifications.push({
        id: id("notif"),
        timestamp: r.activityHistory[r.activityHistory.length - 1].timestamp,
        recipient: r.citizenName,
        channel: r.source === "phone" ? "SMS" : "Email",
        message: `Update on ${r.referenceNumber}: your request is now "${r.status}".`,
        relatedRequestId: r.id,
      });
    }
    if (r.status === "Rejected") {
      notifications.push({
        id: id("notif"),
        timestamp: r.activityHistory[r.activityHistory.length - 1].timestamp,
        recipient: r.citizenName,
        channel: "Email",
        message: `Update on ${r.referenceNumber}: your request could not be processed. Reason provided in-app.`,
        relatedRequestId: r.id,
      });
    }
  });
  notifications.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  return { departments, staff, requests, notifications };
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isMain) {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const OUT_PATH = path.join(__dirname, "..", "data", "db.json");
  const db = buildDb();
  fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
  fs.writeFileSync(OUT_PATH, JSON.stringify(db, null, 2), "utf-8");
  console.log(`Seeded ${db.requests.length} requests, ${db.notifications.length} notifications -> ${OUT_PATH}`);
}
