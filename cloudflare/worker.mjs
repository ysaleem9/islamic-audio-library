import crypto from "node:crypto";
import { EmailMessage } from "cloudflare:email";

const COOKIE_NAME = "islamic_audio_admin_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7;
const ALL_PERMISSIONS = [
  "manage_lessons",
  "import_archive",
  "manage_series",
  "manage_settings",
  "manage_admins",
];
const AUDIO_EXTENSIONS = [".mp3", ".m4a", ".ogg", ".opus", ".wav", ".aac"];
const VALID_ACCENTS = [
  "purple",
  "rose",
  "plum",
  "blush",
  "sage",
  "emerald",
  "gold",
  "teal",
  "slate",
];

function jsonResponse(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...extraHeaders,
    },
  });
}

function createSlug(text) {
  const cleaned = String(text || "")
    .trim()
    .toLowerCase()
    .replace(/[^\u0600-\u06FFa-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return cleaned || "series";
}

function getAuthSecret(env) {
  return env.AUTH_SECRET || "fatima-hijazi-audio-library-secret-key-2026";
}

function getOwnerCreds(env) {
  const username = (env.ADMIN_USERNAME || "admin").trim();
  const password = env.ADMIN_PASSWORD || "admin123";
  return { username, password, isDefault: false };
}

function getOwnerProfile(env) {
  const { username } = getOwnerCreds(env);
  return {
    id: "owner",
    username,
    displayName: "المدير العام (المالك)",
    role: "owner",
    permissions: [...ALL_PERMISSIONS],
    isActive: true,
    createdAt: "2026-01-01T00:00:00.000Z",
    lastActiveAt: new Date().toISOString(),
  };
}

function signPayload(payloadB64, env) {
  return crypto.createHmac("sha256", getAuthSecret(env)).update(payloadB64).digest("base64url");
}

function createSessionToken(user, env) {
  const payload = JSON.stringify({
    uid: user.id,
    u: user.username,
    exp: Date.now() + SESSION_TTL_MS,
  });
  const payloadB64 = Buffer.from(payload, "utf8").toString("base64url");
  const sig = signPayload(payloadB64, env);
  return `${payloadB64}.${sig}`;
}

function verifySessionToken(token, env) {
  if (!token || !token.includes(".")) return null;
  const [payloadB64, sig] = token.split(".");
  if (!payloadB64 || !sig) return null;
  const expectedSig = signPayload(payloadB64, env);
  const sigBuf = Buffer.from(sig);
  const expectedBuf = Buffer.from(expectedSig);
  if (sigBuf.length !== expectedBuf.length) return null;
  if (!crypto.timingSafeEqual(sigBuf, expectedBuf)) return null;
  try {
    const data = JSON.parse(Buffer.from(payloadB64, "base64url").toString("utf8"));
    if (!data.u || !data.exp || Date.now() > data.exp) return null;
    return {
      id: data.uid || (data.u === getOwnerCreds(env).username ? "owner" : data.u),
      username: data.u,
    };
  } catch {
    return null;
  }
}

function parseCookies(cookieHeader) {
  const out = {};
  if (!cookieHeader) return out;
  for (const part of cookieHeader.split(";")) {
    const idx = part.indexOf("=");
    if (idx > -1) {
      out[part.slice(0, idx).trim()] = decodeURIComponent(part.slice(idx + 1).trim());
    }
  }
  return out;
}

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function verifyPasswordHash(password, storedHash) {
  const [salt, key] = String(storedHash || "").split(":");
  if (!salt || !key) return false;
  const hashBuffer = crypto.scryptSync(password, salt, 64);
  const keyBuffer = Buffer.from(key, "hex");
  if (hashBuffer.length !== keyBuffer.length) return false;
  return crypto.timingSafeEqual(hashBuffer, keyBuffer);
}

function normalizePermissions(perms) {
  let arr = perms;
  if (typeof arr === "string") {
    try {
      arr = JSON.parse(arr);
    } catch {
      arr = [];
    }
  }
  if (!Array.isArray(arr)) return [];
  return arr.filter((p) => ALL_PERMISSIONS.includes(p));
}

function mapSettings(row) {
  if (!row) {
    return {
      id: "main",
      siteName: "الأستاذة فاطمة حجازي | أنزله بعلمه",
      sheikhName: "الأستاذة فاطمة حجازي",
      sheikhTitle: "الدروس العلمية والشروحات المنهجية والمحاضرات الصوتية",
      bio: "منصة علمية دعوية مخصصة لنشر الدروس الصوتية المرتبة في العقيدة والتفسير والفقه والرقائق والتربية، متاحة للاستماع المباشر والتحميل المجاني.",
      telegramUrl: "https://t.me/",
      youtubeUrl: "",
      whatsappUrl: "",
    };
  }
  return {
    id: String(row.id ?? "main"),
    siteName: String(row.site_name ?? "الأستاذة فاطمة حجازي | أنزله بعلمه"),
    sheikhName: String(row.sheikh_name ?? "الأستاذة فاطمة حجازي"),
    sheikhTitle: String(row.sheikh_title ?? ""),
    bio: String(row.bio ?? ""),
    telegramUrl: String(row.telegram_url ?? ""),
    youtubeUrl: String(row.youtube_url ?? ""),
    whatsappUrl: String(row.whatsapp_url ?? ""),
  };
}

function mapSeries(row) {
  const accent = String(row.cover_accent ?? "emerald");
  return {
    id: String(row.id),
    title: String(row.title),
    slug: String(row.slug),
    parentId: row.parent_id ? String(row.parent_id) : null,
    category: String(row.category ?? "تفسير القرآن الكريم"),
    description: String(row.description ?? ""),
    status: row.status === "completed" ? "completed" : "ongoing",
    coverAccent: VALID_ACCENTS.includes(accent) ? accent : "emerald",
    sortOrder: Number(row.sort_order ?? 0),
    createdAt: String(row.created_at ?? new Date().toISOString()),
  };
}

function mapLesson(row) {
  return {
    id: String(row.id),
    title: String(row.title),
    seriesId: row.series_id ? String(row.series_id) : null,
    episodeNumber: row.episode_number != null ? Number(row.episode_number) : null,
    category: String(row.category ?? "تفسير القرآن الكريم"),
    description: String(row.description ?? ""),
    notes: String(row.notes ?? ""),
    audioUrl: String(row.audio_url ?? ""),
    archiveIdentifier: String(row.archive_identifier ?? ""),
    durationSeconds: Number(row.duration_seconds ?? 0),
    publishedAt: String(row.published_at ?? ""),
    playsCount: Number(row.plays_count ?? 0),
    isFeatured: Boolean(row.is_featured),
    createdAt: String(row.created_at ?? new Date().toISOString()),
  };
}

function mapAdmin(row, includeHash = false) {
  const role = row.role === "owner" ? "owner" : "admin";
  const base = {
    id: String(row.id),
    username: String(row.username),
    displayName: String(row.display_name ?? row.username),
    role,
    permissions: role === "owner" ? [...ALL_PERMISSIONS] : normalizePermissions(row.permissions),
    isActive: row.is_active !== false && row.is_active !== 0,
    createdAt: String(row.created_at ?? new Date().toISOString()),
    lastActiveAt: row.last_active_at ? String(row.last_active_at) : undefined,
  };
  if (includeHash) base.passwordHash = String(row.password_hash ?? "");
  return base;
}

async function getAdminSession(request, env) {
  const cookies = parseCookies(request.headers.get("Cookie"));
  const token = cookies[COOKIE_NAME];
  const parsed = verifySessionToken(token, env);
  if (!parsed) return null;

  const ownerCreds = getOwnerCreds(env);
  if (parsed.id === "owner" || parsed.username.toLowerCase() === ownerCreds.username.toLowerCase()) {
    return getOwnerProfile(env);
  }

  const row = await env.DB.prepare(
    "SELECT * FROM admin_users WHERE id = ?1 OR lower(username) = ?2 LIMIT 1"
  )
    .bind(parsed.id, parsed.username.toLowerCase())
    .first();
  if (!row) return null;
  const admin = mapAdmin(row, false);
  if (!admin.isActive) return null;

  const now = new Date().toISOString();
  env.DB.prepare("UPDATE admin_users SET last_active_at = ?1 WHERE id = ?2")
    .bind(now, admin.id)
    .run()
    .catch(() => undefined);

  return admin;
}

function hasPerm(session, perm) {
  if (!session || !session.isActive) return false;
  if (session.role === "owner") return true;
  return session.permissions.includes(perm);
}

async function getAllData(env) {
  const [settingsRow, seriesRes, lessonsRes] = await Promise.all([
    env.DB.prepare("SELECT * FROM site_settings WHERE id = 'main' LIMIT 1").first(),
    env.DB.prepare("SELECT * FROM series ORDER BY sort_order ASC, created_at DESC").all(),
    env.DB.prepare("SELECT * FROM lessons ORDER BY episode_number ASC, published_at DESC, created_at DESC").all(),
  ]);
  return {
    settings: mapSettings(settingsRow),
    series: (seriesRes.results || []).map(mapSeries),
    lessons: (lessonsRes.results || []).map(mapLesson),
  };
}

function getDescendantIds(allSeries, rootId) {
  const set = new Set([rootId]);
  let changed = true;
  while (changed) {
    changed = false;
    for (const s of allSeries) {
      if (s.parentId && set.has(s.parentId) && !set.has(s.id)) {
        set.add(s.id);
        changed = true;
      }
    }
  }
  return set;
}

function extractArchiveIdentifier(urlOrId) {
  const trimmed = String(urlOrId || "").trim();
  if (!trimmed) return null;
  if (/^[a-zA-Z0-9._-]{3,100}$/.test(trimmed)) return trimmed;
  try {
    const parsed = new URL(trimmed);
    if (!parsed.hostname.includes("archive.org")) return null;
    const parts = parsed.pathname.split("/").filter(Boolean);
    if (parts.length >= 2 && ["details", "download", "metadata", "embed"].includes(parts[0])) {
      return parts[1];
    }
    return null;
  } catch {
    return null;
  }
}

function parseArchiveLength(val) {
  if (typeof val === "number" && Number.isFinite(val)) return Math.round(val);
  if (typeof val !== "string") return 0;
  const t = val.trim();
  if (!t) return 0;
  if (/^\d+(\.\d+)?$/.test(t)) return Math.round(Number.parseFloat(t));
  const parts = t.split(":").map((p) => Number.parseFloat(p));
  if (parts.some((n) => Number.isNaN(n))) return 0;
  if (parts.length === 2) return Math.round(parts[0] * 60 + parts[1]);
  if (parts.length === 3) return Math.round(parts[0] * 3600 + parts[1] * 60 + parts[2]);
  return 0;
}

async function handleApi(request, env, url) {
  const path = url.pathname;
  const method = request.method.toUpperCase();

  if (path === "/api/data" && method === "GET") {
    const data = await getAllData(env);
    return jsonResponse(data);
  }

  if (path === "/api/auth/login" && method === "POST") {
    const body = await request.json();
    const username = String(body.username || "").trim();
    const password = String(body.password || "");
    const owner = getOwnerCreds(env);

    let adminUser = null;
    if (username.toLowerCase() === owner.username.toLowerCase() && password === owner.password) {
      adminUser = getOwnerProfile(env);
    } else {
      const row = await env.DB.prepare("SELECT * FROM admin_users WHERE lower(username) = ?1 LIMIT 1")
        .bind(username.toLowerCase())
        .first();
      if (row) {
        const rec = mapAdmin(row, true);
        if (rec.isActive && verifyPasswordHash(password, rec.passwordHash)) {
          const now = new Date().toISOString();
          await env.DB.prepare("UPDATE admin_users SET last_active_at = ?1 WHERE id = ?2").bind(now, rec.id).run();
          delete rec.passwordHash;
          adminUser = rec;
        }
      }
    }

    if (!adminUser) {
      return jsonResponse({ error: "اسم المستخدم أو كلمة المرور غير صحيحة أو الحساب موقوف" }, 401);
    }

    const token = createSessionToken({ id: adminUser.id, username: adminUser.username }, env);
    const maxAge = Math.floor(SESSION_TTL_MS / 1000);
    const cookie = `${COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Secure; Max-Age=${maxAge}`;
    return jsonResponse({ ok: true, user: adminUser }, 200, { "Set-Cookie": cookie });
  }

  if (path === "/api/auth/logout" && method === "POST") {
    const cookie = `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Secure; Max-Age=0`;
    return jsonResponse({ ok: true }, 200, { "Set-Cookie": cookie });
  }

  if (path === "/api/auth/me" && method === "GET") {
    const session = await getAdminSession(request, env);
    if (!session) return jsonResponse({ authenticated: false }, 401);
    return jsonResponse({
      authenticated: true,
      username: session.username,
      user: session,
      config: {
        supabaseConfigured: true,
        archiveConfigured: true,
        isDefaultCredentials: false,
      },
    });
  }

  if (path === "/api/lessons") {
    if (method === "GET") {
      const data = await getAllData(env);
      return jsonResponse(data.lessons);
    }
    if (method === "POST") {
      const session = await getAdminSession(request, env);
      if (!session) return jsonResponse({ error: "غير مصرح" }, 401);
      const body = await request.json();

      if (Array.isArray(body.lessons)) {
        if (!hasPerm(session, "import_archive") && !hasPerm(session, "manage_lessons")) {
          return jsonResponse({ error: "ليس لديك صلاحية استيراد الدروس" }, 403);
        }
        const created = [];
        for (const item of body.lessons) {
          if (!item.title || !item.audioUrl) continue;
          const id = `les-${crypto.randomBytes(5).toString("hex")}`;
          const today = new Date().toISOString().slice(0, 10);
          const now = new Date().toISOString();
          const l = {
            id,
            title: String(item.title).trim(),
            seriesId: item.seriesId ? String(item.seriesId) : null,
            episodeNumber: item.episodeNumber != null ? Number(item.episodeNumber) : null,
            category: String(item.category || "تفسير القرآن الكريم").trim(),
            description: String(item.description || "").trim(),
            notes: String(item.notes || "").trim(),
            audioUrl: String(item.audioUrl).trim(),
            archiveIdentifier: String(item.archiveIdentifier || ""),
            durationSeconds: Math.max(0, Math.round(Number(item.durationSeconds || 0))),
            publishedAt: String(item.publishedAt || today),
            playsCount: 0,
            isFeatured: Boolean(item.isFeatured),
            createdAt: now,
          };
          await env.DB.prepare(
            `INSERT INTO lessons (id, title, series_id, episode_number, category, description, notes, audio_url, archive_identifier, duration_seconds, published_at, plays_count, is_featured, created_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, 0, ?12, ?13)`
          )
            .bind(l.id, l.title, l.seriesId, l.episodeNumber, l.category, l.description, l.notes, l.audioUrl, l.archiveIdentifier, l.durationSeconds, l.publishedAt, l.isFeatured ? 1 : 0, l.createdAt)
            .run();
          created.push(l);
        }
        return jsonResponse({ created, count: created.length }, 201);
      }

      if (!hasPerm(session, "manage_lessons")) {
        return jsonResponse({ error: "ليس لديك صلاحية إدارة الدروس" }, 403);
      }
      const id = `les-${crypto.randomBytes(5).toString("hex")}`;
      const today = new Date().toISOString().slice(0, 10);
      const now = new Date().toISOString();
      const l = {
        id,
        title: String(body.title || "").trim(),
        seriesId: body.seriesId ? String(body.seriesId) : null,
        episodeNumber: body.episodeNumber !== "" && body.episodeNumber != null ? Number(body.episodeNumber) : null,
        category: String(body.category || "تفسير القرآن الكريم").trim(),
        description: String(body.description || "").trim(),
        notes: String(body.notes || "").trim(),
        audioUrl: String(body.audioUrl || "").trim(),
        archiveIdentifier: String(body.archiveIdentifier || ""),
        durationSeconds: Math.max(0, Math.round(Number(body.durationSeconds || 0))),
        publishedAt: String(body.publishedAt || today),
        playsCount: 0,
        isFeatured: Boolean(body.isFeatured),
        createdAt: now,
      };
      await env.DB.prepare(
        `INSERT INTO lessons (id, title, series_id, episode_number, category, description, notes, audio_url, archive_identifier, duration_seconds, published_at, plays_count, is_featured, created_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, 0, ?12, ?13)`
      )
        .bind(l.id, l.title, l.seriesId, l.episodeNumber, l.category, l.description, l.notes, l.audioUrl, l.archiveIdentifier, l.durationSeconds, l.publishedAt, l.isFeatured ? 1 : 0, l.createdAt)
        .run();
      return jsonResponse(l, 201);
    }
  }

  const playMatch = path.match(/^\/api\/lessons\/([^/]+)\/play$/);
  if (playMatch && method === "POST") {
    const id = decodeURIComponent(playMatch[1]);
    await env.DB.prepare("UPDATE lessons SET plays_count = COALESCE(plays_count, 0) + 1 WHERE id = ?1").bind(id).run();
    return jsonResponse({ ok: true });
  }

  const lessonMatch = path.match(/^\/api\/lessons\/([^/]+)$/);
  if (lessonMatch) {
    const session = await getAdminSession(request, env);
    if (!session) return jsonResponse({ error: "غير مصرح" }, 401);
    if (!hasPerm(session, "manage_lessons")) return jsonResponse({ error: "ليس لديك صلاحية" }, 403);
    const id = decodeURIComponent(lessonMatch[1]);

    if (method === "PUT") {
      const existing = await env.DB.prepare("SELECT * FROM lessons WHERE id = ?1 LIMIT 1").bind(id).first();
      if (!existing) return jsonResponse({ error: "الدرس غير موجود" }, 404);
      const cur = mapLesson(existing);
      const body = await request.json();
      const updated = {
        ...cur,
        title: body.title !== undefined ? String(body.title).trim() : cur.title,
        seriesId: body.seriesId !== undefined ? (body.seriesId ? String(body.seriesId) : null) : cur.seriesId,
        episodeNumber: body.episodeNumber !== undefined ? (body.episodeNumber !== "" && body.episodeNumber != null ? Number(body.episodeNumber) : null) : cur.episodeNumber,
        category: body.category !== undefined ? String(body.category).trim() : cur.category,
        description: body.description !== undefined ? String(body.description).trim() : cur.description,
        notes: body.notes !== undefined ? String(body.notes).trim() : cur.notes,
        audioUrl: body.audioUrl !== undefined ? String(body.audioUrl).trim() : cur.audioUrl,
        archiveIdentifier: body.archiveIdentifier !== undefined ? String(body.archiveIdentifier) : cur.archiveIdentifier,
        durationSeconds: body.durationSeconds !== undefined ? Number(body.durationSeconds) : cur.durationSeconds,
        publishedAt: body.publishedAt !== undefined ? String(body.publishedAt) : cur.publishedAt,
        isFeatured: body.isFeatured !== undefined ? Boolean(body.isFeatured) : cur.isFeatured,
      };
      await env.DB.prepare(
        `UPDATE lessons SET title = ?1, series_id = ?2, episode_number = ?3, category = ?4, description = ?5, notes = ?6, audio_url = ?7, archive_identifier = ?8, duration_seconds = ?9, published_at = ?10, is_featured = ?11 WHERE id = ?12`
      )
        .bind(updated.title, updated.seriesId, updated.episodeNumber, updated.category, updated.description, updated.notes, updated.audioUrl, updated.archiveIdentifier, updated.durationSeconds, updated.publishedAt, updated.isFeatured ? 1 : 0, id)
        .run();
      return jsonResponse(updated);
    }

    if (method === "DELETE") {
      await env.DB.prepare("DELETE FROM lessons WHERE id = ?1").bind(id).run();
      return jsonResponse({ ok: true });
    }
  }

  if (path === "/api/series") {
    if (method === "GET") {
      const data = await getAllData(env);
      return jsonResponse(data.series);
    }
    if (method === "POST") {
      const session = await getAdminSession(request, env);
      if (!session) return jsonResponse({ error: "غير مصرح" }, 401);
      if (!hasPerm(session, "manage_series")) return jsonResponse({ error: "ليس لديك صلاحية" }, 403);
      const body = await request.json();
      const id = `ser-${crypto.randomBytes(5).toString("hex")}`;
      const slug = `${createSlug(body.title)}-${id.slice(-4)}`;
      const parentId = body.parentId && String(body.parentId).trim() ? String(body.parentId).trim() : null;
      const item = {
        id,
        title: String(body.title || "").trim(),
        slug,
        parentId,
        category: String(body.category || "تفسير القرآن الكريم").trim(),
        description: String(body.description || "").trim(),
        status: body.status === "completed" ? "completed" : "ongoing",
        coverAccent: body.coverAccent || "emerald",
        sortOrder: Number(body.sortOrder || 0),
        createdAt: new Date().toISOString(),
      };
      await env.DB.prepare(
        `INSERT INTO series (id, title, slug, parent_id, category, description, status, cover_accent, sort_order, created_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)`
      )
        .bind(item.id, item.title, item.slug, item.parentId, item.category, item.description, item.status, item.coverAccent, item.sortOrder, item.createdAt)
        .run();
      return jsonResponse(item, 201);
    }
  }

  const seriesMatch = path.match(/^\/api\/series\/([^/]+)$/);
  if (seriesMatch) {
    const session = await getAdminSession(request, env);
    if (!session) return jsonResponse({ error: "غير مصرح" }, 401);
    if (!hasPerm(session, "manage_series")) return jsonResponse({ error: "ليس لديك صلاحية" }, 403);
    const id = decodeURIComponent(seriesMatch[1]);

    if (method === "PUT") {
      const allRes = await env.DB.prepare("SELECT * FROM series").all();
      const allSeries = (allRes.results || []).map(mapSeries);
      const cur = allSeries.find((s) => s.id === id);
      if (!cur) return jsonResponse({ error: "السلسلة غير موجودة" }, 404);
      const body = await request.json();
      const nextParentId =
        body.parentId !== undefined
          ? body.parentId && String(body.parentId).trim()
            ? String(body.parentId).trim()
            : null
          : cur.parentId;
      if (nextParentId) {
        const descendants = getDescendantIds(allSeries, id);
        if (descendants.has(nextParentId)) {
          return jsonResponse({ error: "لا يمكن نقل القائمة داخل إحدى قوائمها الفرعية" }, 400);
        }
      }
      const updated = {
        ...cur,
        title: body.title !== undefined ? String(body.title).trim() : cur.title,
        parentId: nextParentId,
        category: body.category !== undefined ? String(body.category).trim() : cur.category,
        description: body.description !== undefined ? String(body.description).trim() : cur.description,
        status: body.status !== undefined ? body.status : cur.status,
        coverAccent: body.coverAccent !== undefined ? body.coverAccent : cur.coverAccent,
        sortOrder: body.sortOrder !== undefined ? Number(body.sortOrder) : cur.sortOrder,
      };
      await env.DB.prepare(
        `UPDATE series SET title = ?1, parent_id = ?2, category = ?3, description = ?4, status = ?5, cover_accent = ?6, sort_order = ?7 WHERE id = ?8`
      )
        .bind(updated.title, updated.parentId, updated.category, updated.description, updated.status, updated.coverAccent, updated.sortOrder, id)
        .run();
      return jsonResponse(updated);
    }

    if (method === "DELETE") {
      const existing = await env.DB.prepare("SELECT parent_id FROM series WHERE id = ?1 LIMIT 1").bind(id).first();
      const grandParentId = existing?.parent_id ? String(existing.parent_id) : null;
      await env.DB.prepare("UPDATE series SET parent_id = ?1 WHERE parent_id = ?2").bind(grandParentId, id).run();
      await env.DB.prepare("UPDATE lessons SET series_id = NULL WHERE series_id = ?1").bind(id).run();
      await env.DB.prepare("DELETE FROM series WHERE id = ?1").bind(id).run();
      return jsonResponse({ ok: true });
    }
  }

  if (path === "/api/settings" && method === "PUT") {
    const session = await getAdminSession(request, env);
    if (!session) return jsonResponse({ error: "غير مصرح" }, 401);
    if (!hasPerm(session, "manage_settings")) return jsonResponse({ error: "ليس لديك صلاحية" }, 403);
    const body = await request.json();
    await env.DB.prepare(
      `INSERT INTO site_settings (id, site_name, sheikh_name, sheikh_title, bio, telegram_url, youtube_url, whatsapp_url, updated_at)
       VALUES ('main', ?1, ?2, ?3, ?4, ?5, ?6, ?7, datetime('now'))
       ON CONFLICT(id) DO UPDATE SET
         site_name = excluded.site_name,
         sheikh_name = excluded.sheikh_name,
         sheikh_title = excluded.sheikh_title,
         bio = excluded.bio,
         telegram_url = excluded.telegram_url,
         youtube_url = excluded.youtube_url,
         whatsapp_url = excluded.whatsapp_url,
         updated_at = datetime('now')`
    )
      .bind(
        String(body.siteName || "الأستاذة فاطمة حجازي | أنزله بعلمه").trim(),
        String(body.sheikhName || "الأستاذة فاطمة حجازي").trim(),
        String(body.sheikhTitle || "").trim(),
        String(body.bio || "").trim(),
        String(body.telegramUrl || "").trim(),
        String(body.youtubeUrl || "").trim(),
        String(body.whatsappUrl || "").trim()
      )
      .run();
    const row = await env.DB.prepare("SELECT * FROM site_settings WHERE id = 'main' LIMIT 1").first();
    return jsonResponse(mapSettings(row));
  }

  if (path === "/api/admins") {
    const session = await getAdminSession(request, env);
    if (!session) return jsonResponse({ error: "غير مصرح" }, 401);
    if (method === "GET") {
      const res = await env.DB.prepare("SELECT * FROM admin_users ORDER BY created_at ASC").all();
      return jsonResponse((res.results || []).map((r) => mapAdmin(r, false)));
    }
    if (method === "POST") {
      if (!hasPerm(session, "manage_admins")) return jsonResponse({ error: "ليس لديك صلاحية" }, 403);
      const body = await request.json();
      const username = String(body.username || "").trim().toLowerCase();
      if (!/^[a-z0-9_.-]{3,32}$/.test(username)) {
        return jsonResponse({ error: "اسم المستخدم يجب أن يتكون من 3 إلى 32 حرفاً إنجليزياً أو رقماً" }, 400);
      }
      if (!body.password || String(body.password).length < 6) {
        return jsonResponse({ error: "كلمة المرور يجب أن تكون 6 خانات على الأقل" }, 400);
      }
      const existing = await env.DB.prepare("SELECT id FROM admin_users WHERE lower(username) = ?1 LIMIT 1").bind(username).first();
      if (existing) return jsonResponse({ error: "اسم المستخدم مستخدم بالفعل" }, 400);

      const id = `adm-${crypto.randomBytes(5).toString("hex")}`;
      const displayName = String(body.displayName || username).trim();
      const passwordHash = hashPassword(String(body.password));
      const permissions = normalizePermissions(body.permissions);
      const createdAt = new Date().toISOString();

      await env.DB.prepare(
        `INSERT INTO admin_users (id, username, display_name, password_hash, role, permissions, is_active, created_at)
         VALUES (?1, ?2, ?3, ?4, 'admin', ?5, 1, ?6)`
      )
        .bind(id, username, displayName, passwordHash, JSON.stringify(permissions), createdAt)
        .run();

      return jsonResponse(
        {
          id,
          username,
          displayName,
          role: "admin",
          permissions,
          isActive: true,
          createdAt,
        },
        201
      );
    }
  }

  const adminMatch = path.match(/^\/api\/admins\/([^/]+)$/);
  if (adminMatch) {
    const session = await getAdminSession(request, env);
    if (!session) return jsonResponse({ error: "غير مصرح" }, 401);
    if (!hasPerm(session, "manage_admins")) return jsonResponse({ error: "ليس لديك صلاحية" }, 403);
    const id = decodeURIComponent(adminMatch[1]);
    if (id === "owner") return jsonResponse({ error: "لا يمكن تعديل حساب المالك" }, 400);

    if (method === "PUT") {
      const existing = await env.DB.prepare("SELECT * FROM admin_users WHERE id = ?1 LIMIT 1").bind(id).first();
      if (!existing) return jsonResponse({ error: "المشرف غير موجود" }, 404);
      const cur = mapAdmin(existing, true);
      const body = await request.json();
      if (id === session.id && body.isActive === false) {
        return jsonResponse({ error: "لا يمكنك إيقاف حسابك الحالي" }, 400);
      }
      const displayName = body.displayName !== undefined ? String(body.displayName).trim() || cur.username : cur.displayName;
      let passwordHash = cur.passwordHash;
      if (body.password && String(body.password).trim()) {
        if (String(body.password).length < 6) {
          return jsonResponse({ error: "كلمة المرور يجب أن تكون 6 خانات على الأقل" }, 400);
        }
        passwordHash = hashPassword(String(body.password));
      }
      const permissions = body.permissions !== undefined ? normalizePermissions(body.permissions) : cur.permissions;
      const isActive = body.isActive !== undefined ? Boolean(body.isActive) : cur.isActive;

      await env.DB.prepare(
        `UPDATE admin_users SET display_name = ?1, password_hash = ?2, permissions = ?3, is_active = ?4 WHERE id = ?5`
      )
        .bind(displayName, passwordHash, JSON.stringify(permissions), isActive ? 1 : 0, id)
        .run();
      return jsonResponse({
        id: cur.id,
        username: cur.username,
        displayName,
        role: cur.role,
        permissions,
        isActive,
        createdAt: cur.createdAt,
        lastActiveAt: cur.lastActiveAt,
      });
    }

    if (method === "DELETE") {
      if (id === session.id) return jsonResponse({ error: "لا يمكنك حذف حسابك الحالي" }, 400);
      await env.DB.prepare("DELETE FROM admin_users WHERE id = ?1").bind(id).run();
      return jsonResponse({ ok: true });
    }
  }

  if (path === "/api/archive/upload" && method === "POST") {
    const session = await getAdminSession(request, env);
    if (!session) return jsonResponse({ error: "غير مصرح" }, 401);
    if (!hasPerm(session, "manage_lessons")) return jsonResponse({ error: "ليس لديك صلاحية رفع الملفات" }, 403);

    const formData = await request.formData();
    const file = formData.get("file");
    const folder = String(formData.get("identifier") || "lessons").trim() || "lessons";
    if (!file || typeof file.arrayBuffer !== "function") {
      return jsonResponse({ error: "يرجى اختيار ملف صوتي" }, 400);
    }

    const cleanName = String(file.name || "lesson.mp3").replace(/[/\\]/g, "_").trim();
    const objectKey = `${folder}/${Date.now()}-${cleanName}`;
    const buf = await file.arrayBuffer();

    await env.AUDIO_BUCKET.put(objectKey, buf, {
      httpMetadata: { contentType: file.type || "audio/mpeg" },
    });

    const encodedKey = objectKey.split("/").map((s) => encodeURIComponent(s)).join("/");
    const publicBase = (env.R2_PUBLIC_URL || "https://audio.fatimahijazi.com").replace(/\/+$/, "");
    const audioUrl = `${publicBase}/${encodedKey}`;

    return jsonResponse({
      storageMode: "r2",
      audioUrl,
      identifier: "msfatimawebsite",
      fileName: objectKey,
      message: "تم رفع الملف الصوتي مباشرة إلى Cloudflare R2 بنجاح!",
    });
  }

  if (path === "/api/archive/resolve" && method === "POST") {
    const session = await getAdminSession(request, env);
    if (!session) return jsonResponse({ error: "غير مصرح" }, 401);
    const body = await request.json();
    const identifier = extractArchiveIdentifier(body.url || "");
    if (!identifier) return jsonResponse({ error: "رابط أرشيف الإنترنت غير صالح" }, 400);
    const res = await fetch(`https://archive.org/metadata/${encodeURIComponent(identifier)}`);
    if (!res.ok) return jsonResponse({ error: "تعذر جلب البيانات من أرشيف الإنترنت" }, 400);
    const data = await res.json();
    const rawFiles = (data.files || []).filter((f) => f.name && AUDIO_EXTENSIONS.some((e) => f.name.toLowerCase().endsWith(e)));
    const originals = rawFiles.filter((f) => f.source === "original");
    const selected = originals.length > 0 ? originals : rawFiles;
    const files = selected.map((f) => {
      const encoded = f.name.split("/").map((s) => encodeURIComponent(s)).join("/");
      return {
        name: f.name,
        title: f.title || f.name.split("/").pop().replace(/\.[^.]+$/, ""),
        downloadUrl: `https://archive.org/download/${encodeURIComponent(identifier)}/${encoded}`,
        durationSeconds: parseArchiveLength(f.length),
        sizeBytes: Number(f.size || 0),
        format: f.format || "MP3",
      };
    });
    return jsonResponse({
      identifier,
      itemTitle: (Array.isArray(data.metadata?.title) ? data.metadata.title[0] : data.metadata?.title) || identifier,
      creator: "",
      files,
    });
  }

  if (path === "/api/notifications") {
    await env.DB.prepare(
      `CREATE TABLE IF NOT EXISTS notifications (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL DEFAULT 'announcement',
        title TEXT NOT NULL DEFAULT '',
        message TEXT NOT NULL DEFAULT '',
        meeting_date TEXT DEFAULT '',
        meeting_time TEXT DEFAULT '',
        zoom_url TEXT DEFAULT '',
        duration_days INTEGER NOT NULL DEFAULT 7,
        expires_at TEXT NOT NULL,
        created_at TEXT NOT NULL
      )`
    ).run();

    if (method === "GET") {
      const activeOnly = url.searchParams.get("active") === "1";
      const res = await env.DB.prepare("SELECT * FROM notifications ORDER BY created_at DESC").all();
      let items = (res.results || []).map((row) => ({
        id: String(row.id),
        type: row.type === "faith_meeting" ? "faith_meeting" : "announcement",
        title: String(row.title ?? ""),
        message: String(row.message ?? ""),
        meetingDate: row.meeting_date ? String(row.meeting_date) : "",
        meetingTime: row.meeting_time ? String(row.meeting_time) : "",
        zoomUrl: row.zoom_url ? String(row.zoom_url) : "",
        durationDays: Math.max(1, Number(row.duration_days ?? 7)),
        expiresAt: String(row.expires_at ?? new Date().toISOString()),
        createdAt: String(row.created_at ?? new Date().toISOString()),
      }));
      if (activeOnly) {
        const now = Date.now();
        items = items.filter((n) => new Date(n.expiresAt).getTime() > now);
      }
      return jsonResponse(items);
    }

    if (method === "POST") {
      const session = await getAdminSession(request, env);
      if (!session) return jsonResponse({ error: "غير مصرح" }, 401);
      const body = await request.json();
      const type = body.type === "faith_meeting" ? "faith_meeting" : "announcement";

      if (type === "announcement" && !String(body.message || "").trim()) {
        return jsonResponse({ error: "يرجى كتابة نص الإعلان" }, 400);
      }
      if (type === "faith_meeting") {
        if (!String(body.title || "").trim()) {
          return jsonResponse({ error: "يرجى إدخال عنوان اللقاء الإيماني" }, 400);
        }
        if (!String(body.meetingDate || "").trim() || !String(body.meetingTime || "").trim()) {
          return jsonResponse({ error: "يرجى تحديد تاريخ ووقت اللقاء" }, 400);
        }
      }

      const durationDays = Math.max(1, Math.min(365, Math.round(Number(body.durationDays || 7))));
      const nowDate = new Date();
      const createdAt = nowDate.toISOString();
      const expiresAt = new Date(nowDate.getTime() + durationDays * 24 * 60 * 60 * 1000).toISOString();
      const item = {
        id: `ntf-${crypto.randomBytes(5).toString("hex")}`,
        type,
        title: String(body.title || "").trim(),
        message: String(body.message || "").trim(),
        meetingDate: String(body.meetingDate || "").trim(),
        meetingTime: String(body.meetingTime || "").trim(),
        zoomUrl: String(body.zoomUrl || "").trim(),
        durationDays,
        expiresAt,
        createdAt,
      };

      await env.DB.prepare(
        `INSERT INTO notifications (id, type, title, message, meeting_date, meeting_time, zoom_url, duration_days, expires_at, created_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)`
      )
        .bind(
          item.id,
          item.type,
          item.title,
          item.message,
          item.meetingDate,
          item.meetingTime,
          item.zoomUrl,
          item.durationDays,
          item.expiresAt,
          item.createdAt
        )
        .run();

      return jsonResponse(item, 201);
    }
  }

  const notifMatch = path.match(/^\/api\/notifications\/([^/]+)$/);
  if (notifMatch && method === "DELETE") {
    const session = await getAdminSession(request, env);
    if (!session) return jsonResponse({ error: "غير مصرح" }, 401);
    const id = decodeURIComponent(notifMatch[1]);
    await env.DB.prepare("DELETE FROM notifications WHERE id = ?1").bind(id).run();
    return jsonResponse({ ok: true });
  }

  if (path === "/api/contact" && method === "POST") {
    const body = await request.json();
    const category = String(body.category || "استفسار عام").trim();
    const senderName = String(body.senderName || "").trim();
    const senderEmail = String(body.senderEmail || "").trim();
    const message = String(body.message || "").trim();

    if (!senderEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(senderEmail)) {
      return jsonResponse({ error: "يرجى إدخال بريد إلكتروني صحيح" }, 400);
    }
    if (!message || message.length < 5) {
      return jsonResponse({ error: "يرجى كتابة نص الرسالة بشكل واضح" }, 400);
    }

    const id = `msg-${crypto.randomBytes(5).toString("hex")}`;
    const createdAt = new Date().toISOString();

    await env.DB.prepare(
      `CREATE TABLE IF NOT EXISTS contact_messages (
        id TEXT PRIMARY KEY,
        category TEXT NOT NULL,
        sender_name TEXT NOT NULL DEFAULT '',
        sender_email TEXT NOT NULL,
        message TEXT NOT NULL,
        created_at TEXT NOT NULL
      )`
    ).run();

    await env.DB.prepare(
      `INSERT INTO contact_messages (id, category, sender_name, sender_email, message, created_at)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6)`
    )
      .bind(id, category, senderName, senderEmail, message, createdAt)
      .run();

    let emailSent = false;
    let emailError = "";

    // 1. Primary (100% Free): Native Cloudflare Workers send_email binding
    if (env.CONTACT_EMAIL) {
      try {
        const fromAddr = "support@fatimahijazi.com";
        const toAddr = "abdullah.abusalah@gmail.com";
        const subjectText = `[${category}] رسالة جديدة من ${senderName || senderEmail}`;
        const encodedSubject = `=?UTF-8?B?${Buffer.from(subjectText, "utf8").toString("base64")}?=`;
        const encodedFromName = `=?UTF-8?B?${Buffer.from("منصة الأستاذة فاطمة حجازي", "utf8").toString("base64")}?=`;
        const safeReplyTo = senderEmail.replace(/[\r\n<>]/g, "").trim();
        const plainBody = [
          `نوع الرسالة: ${category}`,
          `الاسم: ${senderName || "غير محدد"}`,
          `البريد الإلكتروني للمرسل: ${safeReplyTo}`,
          `التاريخ: ${createdAt}`,
          "",
          "نص الرسالة:",
          message,
          "",
          "----------------------------------------",
          "يمكنك الضغط على «رد / Reply» مباشرة ليصل ردك إلى بريد المرسل الشخصي.",
        ].join("\r\n");

        const bodyBase64 = Buffer.from(plainBody, "utf8")
          .toString("base64")
          .replace(/(.{76})/g, "$1\r\n");

        const rawMime = [
          `From: ${encodedFromName} <${fromAddr}>`,
          `To: <${toAddr}>`,
          `Reply-To: <${safeReplyTo}>`,
          `Subject: ${encodedSubject}`,
          `Date: ${new Date().toUTCString()}`,
          `Message-ID: <${id}@fatimahijazi.com>`,
          `MIME-Version: 1.0`,
          `Content-Type: text/plain; charset="utf-8"`,
          `Content-Transfer-Encoding: base64`,
          "",
          bodyBase64,
          "",
        ].join("\r\n");

        const emailMsg = new EmailMessage(fromAddr, toAddr, rawMime);
        await env.CONTACT_EMAIL.send(emailMsg);
        emailSent = true;
      } catch (err) {
        emailError = err instanceof Error ? err.message : String(err);
      }
    }

    // 2. Fallback: Resend API if configured and native binding wasn't used
    if (!emailSent && env.RESEND_API_KEY) {
      const fromAddress =
        env.CONTACT_FROM_EMAIL || "منصة أنزله بعلمه <noreply@fatimahijazi.com>";
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: fromAddress,
          to: ["support@fatimahijazi.com"],
          reply_to: senderEmail,
          subject: `[${category}] رسالة جديدة من ${senderName || senderEmail}`,
          text: [
            `نوع الرسالة: ${category}`,
            `الاسم: ${senderName || "غير محدد"}`,
            `البريد الإلكتروني للمرسل: ${senderEmail}`,
            "",
            "نص الرسالة:",
            message,
            "",
            "— يمكنك الرد مباشرة على هذه الرسالة ليصل ردك إلى بريد المرسل الشخصي.",
          ].join("\n"),
        }),
      });
      emailSent = res.ok;
    }

    return jsonResponse({ ok: true, id, emailSent, ...(emailError ? { emailError } : {}) }, 201);
  }

  return jsonResponse({ error: "Not found" }, 404);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname.startsWith("/api/")) {
      try {
        return await handleApi(request, env, url);
      } catch (err) {
        return jsonResponse({ error: err instanceof Error ? err.message : "خطأ في الخادم" }, 500);
      }
    }

    const assetRes = await env.ASSETS.fetch(request);
    if (assetRes.status !== 404) {
      return assetRes;
    }

    if (url.pathname.startsWith("/lessons/")) {
      const target = url.pathname.endsWith(".txt")
        ? "/lessons/placeholder.txt"
        : "/lessons/placeholder.html";
      const fallbackUrl = new URL(target, request.url);
      return env.ASSETS.fetch(new Request(fallbackUrl, request));
    }
    if (url.pathname.startsWith("/series/")) {
      const target = url.pathname.endsWith(".txt")
        ? "/series/placeholder.txt"
        : "/series/placeholder.html";
      const fallbackUrl = new URL(target, request.url);
      return env.ASSETS.fetch(new Request(fallbackUrl, request));
    }

    return assetRes;
  },
};
