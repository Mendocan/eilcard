import {
  sql,
  count,
  eq,
  desc,
  or,
  ilike,
  and,
  gte,
  inArray,
  type SQL,
} from "drizzle-orm";
import { db } from "@/lib/db";
import {
  adminAuditLogs,
  adminOperators,
  cardChangeLogs,
  cards,
  domainVerifications,
  resolveEvents,
  sessions,
  users,
} from "@/lib/db/schema";
import { buildCardJson, getCardByHandle } from "@/lib/card-service";
import {
  reconcileStaleVerifications,
  resolveVerificationQueueState,
  unverifiedCardCondition,
} from "@/lib/domain-verification-queue";
import { getUserPlan } from "@/lib/user-plan";

const PAGE_SIZE = 20;

export type CardListFilters = {
  q: string;
  page: number;
  status?: "all" | "verified" | "pending";
  type?: "all" | "organization" | "person";
};

export const ADOPTION_VERIFIED_GOAL = 50;

export async function getAdminOverview() {
  await reconcileStaleVerifications();

  const today = new Date().toISOString().slice(0, 10);

  const [[userRow], [cardRow], [verifiedRow], [resolveRow], [pendingRow]] =
    await Promise.all([
      db.select({ c: count() }).from(users),
      db.select({ c: count() }).from(cards),
      db.select({ c: count() }).from(cards).where(eq(cards.verified, true)),
      db
        .select({ total: sql<number>`coalesce(sum(${resolveEvents.count}), 0)` })
        .from(resolveEvents)
        .where(eq(resolveEvents.date, today)),
      db.select({ c: count() }).from(cards).where(unverifiedCardCondition),
    ]);

  const [recentCards, recentUsers] = await Promise.all([
    db
      .select({
        handle: cards.handle,
        domain: cards.domain,
        verified: cards.verified,
        createdAt: cards.createdAt,
      })
      .from(cards)
      .orderBy(desc(cards.createdAt))
      .limit(5),
    db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        createdAt: users.createdAt,
      })
      .from(users)
      .orderBy(desc(users.createdAt))
      .limit(5),
  ]);

  return {
    users: userRow?.c ?? 0,
    cards: cardRow?.c ?? 0,
    verified: verifiedRow?.c ?? 0,
    adoptionGoal: ADOPTION_VERIFIED_GOAL,
    adoptionProgress: Math.min(
      100,
      Math.round(((verifiedRow?.c ?? 0) / ADOPTION_VERIFIED_GOAL) * 100)
    ),
    resolvesToday: Number(resolveRow?.total ?? 0),
    pendingVerifications: pendingRow?.c ?? 0,
    recentCards,
    recentUsers,
  };
}

function cardSearchFilter(q: string) {
  const term = `%${q.trim()}%`;
  return or(
    ilike(cards.handle, term),
    ilike(cards.domain, term),
    ilike(users.email, term)
  );
}

function cardListConditions(filters: CardListFilters): SQL | undefined {
  const parts: SQL[] = [];
  const trimmed = filters.q.trim();

  if (trimmed) {
    const search = cardSearchFilter(trimmed);
    if (search) parts.push(search);
  }
  if (filters.status === "verified") parts.push(eq(cards.verified, true));
  if (filters.status === "pending") parts.push(eq(cards.verified, false));
  if (filters.type === "organization" || filters.type === "person") {
    parts.push(eq(cards.type, filters.type));
  }

  if (parts.length === 0) return undefined;
  if (parts.length === 1) return parts[0];
  return and(...parts);
}

export async function listAdminCards(filters: CardListFilters) {
  const offset = (filters.page - 1) * PAGE_SIZE;
  const where = cardListConditions(filters);

  const base = db
    .select({
      handle: cards.handle,
      domain: cards.domain,
      type: cards.type,
      verified: cards.verified,
      createdAt: cards.createdAt,
      userEmail: users.email,
      userIsPlatformOperator: users.isPlatformOperator,
    })
    .from(cards)
    .innerJoin(users, eq(cards.userId, users.id));

  const rows = where
    ? await base
        .where(where)
        .orderBy(desc(cards.createdAt))
        .limit(PAGE_SIZE)
        .offset(offset)
    : await base.orderBy(desc(cards.createdAt)).limit(PAGE_SIZE).offset(offset);

  const countBase = db
    .select({ c: count() })
    .from(cards)
    .innerJoin(users, eq(cards.userId, users.id));

  const [totalRow] = where
    ? await countBase.where(where)
    : await countBase;

  const total = totalRow?.c ?? 0;

  return {
    rows,
    total,
    page: filters.page,
    pageSize: PAGE_SIZE,
    totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
  };
}

export async function getAdminCardDetail(handle: string) {
  const [row] = await db
    .select({
      id: cards.id,
      handle: cards.handle,
      cardId: cards.cardId,
      type: cards.type,
      domain: cards.domain,
      verified: cards.verified,
      verificationMethod: cards.verificationMethod,
      body: cards.body,
      createdAt: cards.createdAt,
      updatedAt: cards.updatedAt,
      userId: users.id,
      userName: users.name,
      userEmail: users.email,
      userIsPlatformOperator: users.isPlatformOperator,
      userEmailVerified: users.emailVerified,
    })
    .from(cards)
    .innerJoin(users, eq(cards.userId, users.id))
    .where(eq(cards.handle, handle))
    .limit(1);

  if (!row) return null;

  const verifications = await db
    .select()
    .from(domainVerifications)
    .where(eq(domainVerifications.cardId, row.id))
    .orderBy(desc(domainVerifications.createdAt));

  const [resolveTotal] = await db
    .select({ total: sql<number>`coalesce(sum(${resolveEvents.count}), 0)` })
    .from(resolveEvents)
    .where(eq(resolveEvents.cardId, row.id));

  const card = await getCardByHandle(handle);
  const publicJson = card ? buildCardJson(card) : null;

  return {
    ...row,
    verifications,
    resolveTotal: Number(resolveTotal?.total ?? 0),
    publicJson,
  };
}

export async function listVerificationQueue(page: number) {
  await reconcileStaleVerifications();

  const offset = (page - 1) * PAGE_SIZE;

  const cardRows = await db
    .select({
      cardId: cards.id,
      handle: cards.handle,
      domain: cards.domain,
      cardCreatedAt: cards.createdAt,
      userEmail: users.email,
    })
    .from(cards)
    .innerJoin(users, eq(cards.userId, users.id))
    .where(unverifiedCardCondition)
    .orderBy(
      sql`case
        when ${cards.domain} is not null and exists (
          select 1 from domain_verifications dv
          where dv.card_id = ${cards.id} and dv.status = 'pending'
        ) then 0
        when ${cards.domain} is not null then 1
        else 2
      end`,
      desc(cards.createdAt)
    )
    .limit(PAGE_SIZE)
    .offset(offset);

  const cardIds = cardRows.map((row) => row.cardId);
  const pendingByCard = new Map<
    string,
    {
      id: string;
      method: string;
      token: string;
      createdAt: Date;
    }
  >();

  if (cardIds.length > 0) {
    const pendingRows = await db
      .select({
        id: domainVerifications.id,
        cardId: domainVerifications.cardId,
        method: domainVerifications.method,
        token: domainVerifications.token,
        createdAt: domainVerifications.createdAt,
      })
      .from(domainVerifications)
      .where(
        and(
          inArray(domainVerifications.cardId, cardIds),
          eq(domainVerifications.status, "pending")
        )
      )
      .orderBy(desc(domainVerifications.createdAt));

    for (const row of pendingRows) {
      if (!pendingByCard.has(row.cardId)) {
        pendingByCard.set(row.cardId, row);
      }
    }
  }

  const rows = cardRows.map((card) => {
    const pending = pendingByCard.get(card.cardId);
    const queueState = resolveVerificationQueueState(
      card.domain,
      Boolean(pending)
    );

    return {
      cardId: card.cardId,
      handle: card.handle,
      domain: card.domain,
      userEmail: card.userEmail,
      cardCreatedAt: card.cardCreatedAt,
      queueState,
      verificationId: pending?.id ?? null,
      method: pending?.method ?? null,
      token: pending?.token ?? null,
      verificationCreatedAt: pending?.createdAt ?? null,
    };
  });

  const [totalRow] = await db
    .select({ c: count() })
    .from(cards)
    .where(unverifiedCardCondition);

  const total = totalRow?.c ?? 0;

  return {
    rows,
    total,
    page,
    pageSize: PAGE_SIZE,
    totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
  };
}

export async function listAdminUsers(q: string, page: number) {
  const offset = (page - 1) * PAGE_SIZE;
  const trimmed = q.trim();

  const userFilter = trimmed
    ? or(ilike(users.email, `%${trimmed}%`), ilike(users.name, `%${trimmed}%`))
    : undefined;

  const rowsQuery = db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      emailVerified: users.emailVerified,
      isPlatformOperator: users.isPlatformOperator,
      createdAt: users.createdAt,
      cardCount: sql<number>`count(${cards.id})::int`,
    })
    .from(users)
    .leftJoin(cards, eq(cards.userId, users.id))
    .groupBy(
      users.id,
      users.name,
      users.email,
      users.emailVerified,
      users.isPlatformOperator,
      users.createdAt
    )
    .orderBy(desc(users.createdAt))
    .limit(PAGE_SIZE)
    .offset(offset);

  const rows = userFilter ? await rowsQuery.where(userFilter) : await rowsQuery;

  const [totalRow] = userFilter
    ? await db.select({ c: count() }).from(users).where(userFilter)
    : await db.select({ c: count() }).from(users);

  const total = totalRow?.c ?? 0;

  return {
    rows,
    total,
    page,
    pageSize: PAGE_SIZE,
    totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
  };
}

export async function listAdminAuditLogs(page: number) {
  const offset = (page - 1) * PAGE_SIZE;

  const rows = await db
    .select({
      id: adminAuditLogs.id,
      action: adminAuditLogs.action,
      targetType: adminAuditLogs.targetType,
      targetId: adminAuditLogs.targetId,
      details: adminAuditLogs.details,
      createdAt: adminAuditLogs.createdAt,
      operatorId: adminAuditLogs.operatorId,
      operatorName: adminOperators.name,
      operatorEmail: adminOperators.email,
    })
    .from(adminAuditLogs)
    .leftJoin(adminOperators, eq(adminAuditLogs.operatorId, adminOperators.id))
    .orderBy(desc(adminAuditLogs.createdAt))
    .limit(PAGE_SIZE)
    .offset(offset);

  const [totalRow] = await db.select({ c: count() }).from(adminAuditLogs);
  const total = totalRow?.c ?? 0;

  return {
    rows,
    total,
    page,
    pageSize: PAGE_SIZE,
    totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
  };
}

export async function listCardChangeLogs(page: number) {
  const offset = (page - 1) * PAGE_SIZE;

  const rows = await db
    .select({
      id: cardChangeLogs.id,
      cardId: cardChangeLogs.cardId,
      userId: cardChangeLogs.userId,
      changedFields: cardChangeLogs.changedFields,
      createdAt: cardChangeLogs.createdAt,
      handle: cards.handle,
      userEmail: users.email,
    })
    .from(cardChangeLogs)
    .innerJoin(cards, eq(cardChangeLogs.cardId, cards.id))
    .innerJoin(users, eq(cardChangeLogs.userId, users.id))
    .orderBy(desc(cardChangeLogs.createdAt))
    .limit(PAGE_SIZE)
    .offset(offset);

  const [totalRow] = await db.select({ c: count() }).from(cardChangeLogs);
  const total = totalRow?.c ?? 0;

  return {
    rows,
    total,
    page,
    pageSize: PAGE_SIZE,
    totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
  };
}

export async function getAdminUserDetail(userId: string) {
  const [user] = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      emailVerified: users.emailVerified,
      isPlatformOperator: users.isPlatformOperator,
      suspendedAt: users.suspendedAt,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) return null;

  const plan = await getUserPlan(userId);

  const userCards = await db
    .select({
      handle: cards.handle,
      domain: cards.domain,
      type: cards.type,
      verified: cards.verified,
      createdAt: cards.createdAt,
    })
    .from(cards)
    .where(eq(cards.userId, userId))
    .orderBy(desc(cards.createdAt));

  const [sessionCount] = await db
    .select({ c: count() })
    .from(sessions)
    .where(eq(sessions.userId, userId));

  return {
    ...user,
    plan,
    cards: userCards,
    sessionCount: sessionCount?.c ?? 0,
  };
}

export async function getResolveAnalytics(days = 14) {
  const since = new Date();
  since.setUTCDate(since.getUTCDate() - (days - 1));
  const sinceStr = since.toISOString().slice(0, 10);
  const today = new Date().toISOString().slice(0, 10);

  const daily = await db
    .select({
      date: resolveEvents.date,
      total: sql<number>`coalesce(sum(${resolveEvents.count}), 0)`,
    })
    .from(resolveEvents)
    .where(gte(resolveEvents.date, sinceStr))
    .groupBy(resolveEvents.date)
    .orderBy(resolveEvents.date);

  const topCards = await db
    .select({
      handle: cards.handle,
      domain: cards.domain,
      total: sql<number>`coalesce(sum(${resolveEvents.count}), 0)`,
    })
    .from(resolveEvents)
    .innerJoin(cards, eq(resolveEvents.cardId, cards.id))
    .groupBy(cards.id, cards.handle, cards.domain)
    .orderBy(desc(sql`coalesce(sum(${resolveEvents.count}), 0)`))
    .limit(10);

  const [[allTimeRow], [periodRow], [todayRow]] = await Promise.all([
    db
      .select({ total: sql<number>`coalesce(sum(${resolveEvents.count}), 0)` })
      .from(resolveEvents),
    db
      .select({ total: sql<number>`coalesce(sum(${resolveEvents.count}), 0)` })
      .from(resolveEvents)
      .where(gte(resolveEvents.date, sinceStr)),
    db
      .select({ total: sql<number>`coalesce(sum(${resolveEvents.count}), 0)` })
      .from(resolveEvents)
      .where(eq(resolveEvents.date, today)),
  ]);

  const maxDaily = Math.max(1, ...daily.map((d) => Number(d.total)));

  return {
    days,
    daily: daily.map((d) => ({
      date: d.date,
      total: Number(d.total),
    })),
    topCards: topCards.map((c) => ({
      handle: c.handle,
      domain: c.domain,
      total: Number(c.total),
    })),
    totals: {
      allTime: Number(allTimeRow?.total ?? 0),
      period: Number(periodRow?.total ?? 0),
      today: Number(todayRow?.total ?? 0),
    },
    maxDaily,
  };
}
