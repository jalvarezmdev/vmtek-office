import 'dotenv/config';

import { randomUUID } from 'node:crypto';

import { count, eq, inArray, like, sum } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { getDb } from '@/db';
import {
  clients,
  epics,
  expenses,
  milestones,
  negotiations,
  payments,
  projects,
  tasks,
} from '@/db/schema';
import {
  sortByOverdueThenDue,
  startOfMonthUtc,
  startOfNextMonthUtc,
} from '@/lib/dates';
import { sumByCurrency } from '@/lib/money';

// Integration tests for the dashboard widget aggregates. The widgets themselves
// are server components (next/headers etc.) and cannot be imported in tests, so
// these tests exercise the same Drizzle query + reduce shapes they use against
// the real Neon dev database.
//
// CI runs `pnpm test` without a DATABASE_URL (no .env), so this suite skips
// entirely unless the env var is present. Locally `import 'dotenv/config'`
// loads .env; in CI there is no .env and the suite is skipped, keeping CI
// green.
describe.skipIf(!process.env.DATABASE_URL)('dashboard aggregates', () => {
  let db: ReturnType<typeof getDb>;
  let prefix = '';
  let clientId = '';
  let tasksProjectId = '';

  beforeAll(async () => {
    db = getDb();
    prefix = `itest-${randomUUID().slice(0, 8)}`;

    const now = new Date();
    const monthStart = startOfMonthUtc(now);
    const year = monthStart.getUTCFullYear();
    const month = monthStart.getUTCMonth();
    const inMonth = (day: number) => new Date(Date.UTC(year, month, day));
    const lastMonth = (day: number) => new Date(Date.UTC(year, month - 1, day));
    const dayOffset = (days: number) =>
      new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    const [client] = await db
      .insert(clients)
      .values({ name: `${prefix}-client`, company: 'VMWTEK Test Co' })
      .returning({ id: clients.id });
    clientId = client.id;

    const insertedProjects = await db
      .insert(projects)
      .values([
        { name: `${prefix}-alpha`, status: 'active', clientId },
        { name: `${prefix}-beta`, status: 'active', clientId },
        { name: `${prefix}-gamma`, status: 'active' },
        { name: `${prefix}-planning`, status: 'planning', clientId },
        { name: `${prefix}-tasks`, status: 'active', clientId },
      ])
      .returning({ id: projects.id, name: projects.name });
    const projectIdByName = new Map(
      insertedProjects.map((p) => [p.name, p.id])
    );
    const alphaId = projectIdByName.get(`${prefix}-alpha`)!;
    const gammaId = projectIdByName.get(`${prefix}-gamma`)!;
    tasksProjectId = projectIdByName.get(`${prefix}-tasks`)!;

    await db.insert(milestones).values([
      { projectId: alphaId, name: `${prefix}-ms-a1`, status: 'done' },
      { projectId: alphaId, name: `${prefix}-ms-a2`, status: 'done' },
      { projectId: alphaId, name: `${prefix}-ms-a3`, status: 'planned' },
      { projectId: gammaId, name: `${prefix}-ms-c1`, status: 'done' },
      { projectId: gammaId, name: `${prefix}-ms-c2`, status: 'active' },
    ]);

    await db.insert(tasks).values([
      {
        title: `${prefix}-t1`,
        projectId: tasksProjectId,
        status: 'todo',
        priority: 'high',
        dueDate: dayOffset(-2),
      },
      {
        title: `${prefix}-t2`,
        projectId: tasksProjectId,
        status: 'in_progress',
        priority: 'medium',
        dueDate: dayOffset(3),
      },
      {
        title: `${prefix}-t3`,
        projectId: tasksProjectId,
        status: 'todo',
        priority: 'low',
        dueDate: dayOffset(8),
      },
      {
        title: `${prefix}-t4`,
        projectId: tasksProjectId,
        status: 'todo',
        priority: 'medium',
        dueDate: null,
      },
      {
        title: `${prefix}-t5`,
        projectId: tasksProjectId,
        status: 'done',
        priority: 'medium',
        dueDate: dayOffset(-1),
      },
      {
        title: `${prefix}-t6`,
        projectId: tasksProjectId,
        status: 'in_progress',
        priority: 'urgent',
        dueDate: dayOffset(-1),
      },
      {
        title: `${prefix}-t7`,
        projectId: tasksProjectId,
        status: 'todo',
        priority: 'low',
        dueDate: dayOffset(1),
      },
      {
        title: `${prefix}-t8`,
        projectId: tasksProjectId,
        status: 'todo',
        priority: 'medium',
        dueDate: dayOffset(7),
      },
    ]);

    await db.insert(payments).values([
      {
        clientId,
        projectId: alphaId,
        description: `${prefix}-rec-usd`,
        amount: 1200,
        currency: 'USD',
        status: 'received',
        receivedDate: inMonth(10),
        dueDate: inMonth(10),
      },
      {
        clientId,
        projectId: alphaId,
        description: `${prefix}-rec-eur`,
        amount: 800,
        currency: 'EUR',
        status: 'received',
        receivedDate: inMonth(12),
        dueDate: inMonth(12),
      },
      {
        clientId,
        projectId: alphaId,
        description: `${prefix}-rec-last`,
        amount: 500,
        currency: 'USD',
        status: 'received',
        receivedDate: lastMonth(15),
        dueDate: dayOffset(-1),
      },
      {
        clientId,
        projectId: alphaId,
        description: `${prefix}-pend-1`,
        amount: 500,
        currency: 'USD',
        status: 'partial',
        dueDate: dayOffset(-5),
      },
      {
        clientId,
        projectId: alphaId,
        description: `${prefix}-pend-2`,
        amount: 300,
        currency: 'EUR',
        status: 'pending',
        dueDate: dayOffset(2),
      },
      {
        clientId,
        projectId: alphaId,
        description: `${prefix}-pend-3`,
        amount: 250,
        currency: 'USD',
        status: 'pending',
        dueDate: dayOffset(-1),
      },
      {
        clientId,
        projectId: alphaId,
        description: `${prefix}-pend-4`,
        amount: 1000,
        currency: 'GBP',
        status: 'pending',
        dueDate: dayOffset(5),
      },
      {
        clientId,
        projectId: alphaId,
        description: `${prefix}-pend-5`,
        amount: 400,
        currency: 'USD',
        status: 'pending',
        dueDate: dayOffset(10),
      },
      {
        clientId,
        projectId: alphaId,
        description: `${prefix}-pend-6`,
        amount: 150,
        currency: 'EUR',
        status: 'partial',
        dueDate: dayOffset(-3),
      },
      {
        clientId,
        projectId: alphaId,
        description: `${prefix}-pend-7`,
        amount: 700,
        currency: 'USD',
        status: 'pending',
        dueDate: dayOffset(1),
      },
      {
        clientId,
        projectId: alphaId,
        description: `${prefix}-pend-8`,
        amount: 200,
        currency: 'EUR',
        status: 'pending',
        dueDate: dayOffset(-2),
      },
    ]);

    await db.insert(expenses).values([
      {
        clientId,
        projectId: alphaId,
        category: 'software',
        amount: 300,
        currency: 'USD',
        date: inMonth(5),
      },
      {
        clientId,
        projectId: alphaId,
        category: 'marketing',
        amount: 200,
        currency: 'EUR',
        date: inMonth(18),
      },
      {
        clientId,
        projectId: alphaId,
        category: 'travel',
        amount: 150,
        currency: 'USD',
        date: lastMonth(20),
      },
    ]);

    await db.insert(negotiations).values([
      {
        clientId,
        title: `${prefix}-open-usd`,
        amount: 1000,
        currency: 'USD',
        status: 'open',
      },
      {
        clientId,
        title: `${prefix}-open-eur`,
        amount: 500,
        currency: 'EUR',
        status: 'open',
      },
      {
        clientId,
        title: `${prefix}-won`,
        amount: 999,
        currency: 'USD',
        status: 'won',
      },
      {
        clientId,
        title: `${prefix}-lost`,
        amount: 888,
        currency: 'USD',
        status: 'lost',
      },
    ]);
  });

  // Fixture rows are identified by a unique per-run prefix, so cleanup is exact
  // even if a previous run left orphans behind. Children are deleted before
  // parents to avoid FK surprises (payments/expenses/negotiations/tasks/epics/
  // milestones all reference projects/clients).
  afterAll(async () => {
    if (!db) return;
    const p = `${prefix}%`;
    await db.delete(payments).where(like(payments.description, p));
    await db.delete(expenses).where(like(expenses.description, p));
    await db.delete(negotiations).where(like(negotiations.title, p));
    await db.delete(tasks).where(like(tasks.title, p));
    await db.delete(epics).where(like(epics.name, p));
    await db.delete(milestones).where(like(milestones.name, p));
    await db.delete(projects).where(like(projects.name, p));
    await db.delete(clients).where(like(clients.name, p));
  });

  it('money overview: received this month minus expenses this month per currency', async () => {
    const monthStart = startOfMonthUtc(new Date());
    const nextMonthStart = startOfNextMonthUtc(new Date());

    const [received, expenseRows] = await Promise.all([
      db.query.payments.findMany({
        where: (p, { and, eq, gte, lt }) =>
          and(
            eq(p.status, 'received'),
            gte(p.receivedDate, monthStart),
            lt(p.receivedDate, nextMonthStart)
          ),
      }),
      db.query.expenses.findMany({
        where: (e, { and, gte, lt }) =>
          and(gte(e.date, monthStart), lt(e.date, nextMonthStart)),
      }),
    ]);

    const fixtureReceived = received.filter((r) => r.clientId === clientId);
    const fixtureExpenses = expenseRows.filter((r) => r.clientId === clientId);

    expect(fixtureReceived).toHaveLength(2);
    expect(fixtureExpenses).toHaveLength(2);

    const receivedByCurrency = sumByCurrency(
      fixtureReceived,
      'amount',
      'currency'
    );
    const expensesByCurrency = sumByCurrency(
      fixtureExpenses,
      'amount',
      'currency'
    );
    expect(receivedByCurrency).toEqual([
      { currency: 'EUR', total: 800 },
      { currency: 'USD', total: 1200 },
    ]);
    expect(expensesByCurrency).toEqual([
      { currency: 'EUR', total: 200 },
      { currency: 'USD', total: 300 },
    ]);

    const net = receivedByCurrency.map(({ currency, total }) => {
      const spent =
        expensesByCurrency.find((r) => r.currency === currency)?.total ?? 0;
      return { currency, received: total, expenses: spent, net: total - spent };
    });
    expect(net).toEqual([
      { currency: 'EUR', received: 800, expenses: 200, net: 600 },
      { currency: 'USD', received: 1200, expenses: 300, net: 900 },
    ]);
  });

  it('pending payments: pending+partial only, outstanding per currency, overdue-first', async () => {
    const rows = await db.query.payments.findMany({
      where: (p, { inArray }) => inArray(p.status, ['pending', 'partial']),
      with: { project: true, client: true },
      orderBy: (p, { asc }) => [asc(p.dueDate)],
      limit: 8,
    });

    for (const row of rows) {
      expect(['pending', 'partial']).toContain(row.status);
    }

    const fixtureRows = rows.filter((r) => r.clientId === clientId);
    expect(fixtureRows.some((r) => r.status === 'received')).toBe(false);

    const scoped = await db.query.payments.findMany({
      where: (p, { and, eq, inArray }) =>
        and(
          eq(p.clientId, clientId),
          inArray(p.status, ['pending', 'partial'])
        ),
      orderBy: (p, { asc }) => [asc(p.dueDate)],
    });
    const scopedSorted = sortByOverdueThenDue(scoped, (p) => p.dueDate);
    expect(scopedSorted.map((r) => r.amount)).toEqual([
      500, 150, 200, 250, 700, 300, 1000, 400,
    ]);

    const presentIds = new Set(fixtureRows.map((r) => r.id));
    const expectedPresentOrder = scopedSorted
      .filter((r) => presentIds.has(r.id))
      .map((r) => r.amount);
    const actualPresentOrder = sortByOverdueThenDue(
      fixtureRows,
      (r) => r.dueDate
    ).map((r) => r.amount);
    expect(actualPresentOrder).toEqual(expectedPresentOrder);

    const [outstanding, allPending] = await Promise.all([
      db
        .select({
          currency: payments.currency,
          total: sum(payments.amount),
        })
        .from(payments)
        .where(inArray(payments.status, ['pending', 'partial']))
        .groupBy(payments.currency),
      db.query.payments.findMany({
        where: (p, { inArray }) => inArray(p.status, ['pending', 'partial']),
      }),
    ]);

    const aggregate = sumByCurrency(outstanding, 'total', 'currency');
    const groundTruth = sumByCurrency(allPending, 'amount', 'currency');
    expect(aggregate).toEqual(groundTruth);

    const fixturePending = allPending.filter((r) => r.clientId === clientId);
    expect(sumByCurrency(fixturePending, 'amount', 'currency')).toEqual([
      { currency: 'EUR', total: 650 },
      { currency: 'GBP', total: 1000 },
      { currency: 'USD', total: 1850 },
    ]);
  });

  it('active projects: active only, milestone progress done/total', async () => {
    const rows = await db.query.projects.findMany({
      where: (p, { eq }) => eq(p.status, 'active'),
      with: { client: true, milestones: true },
      orderBy: (p, { asc }) => [asc(p.name)],
    });

    expect(rows.some((r) => r.name === `${prefix}-planning`)).toBe(false);

    const fixture = rows.filter((r) =>
      [`${prefix}-alpha`, `${prefix}-beta`, `${prefix}-gamma`].includes(r.name)
    );
    expect(fixture).toHaveLength(3);

    const progress = fixture.map((r) => ({
      name: r.name,
      done: r.milestones.filter((m) => m.status === 'done').length,
      total: r.milestones.length,
    }));
    expect(progress).toEqual([
      { name: `${prefix}-alpha`, done: 2, total: 3 },
      { name: `${prefix}-beta`, done: 0, total: 0 },
      { name: `${prefix}-gamma`, done: 1, total: 2 },
    ]);

    expect(fixture[0].client?.name).toBe(`${prefix}-client`);
    expect(fixture[2].client).toBeNull();
  });

  it('open negotiations: open only, count and per-currency pipeline', async () => {
    const [countResult, pipelineRows, allOpen] = await Promise.all([
      db
        .select({ value: count() })
        .from(negotiations)
        .where(eq(negotiations.status, 'open')),
      db
        .select({
          currency: negotiations.currency,
          total: sum(negotiations.amount),
        })
        .from(negotiations)
        .where(eq(negotiations.status, 'open'))
        .groupBy(negotiations.currency),
      db.query.negotiations.findMany({
        where: (n, { eq }) => eq(n.status, 'open'),
      }),
    ]);

    expect(Number(countResult[0]?.value ?? 0)).toBe(allOpen.length);

    const aggregate = sumByCurrency(pipelineRows, 'total', 'currency');
    const groundTruth = sumByCurrency(allOpen, 'amount', 'currency');
    expect(aggregate).toEqual(groundTruth);

    const fixture = allOpen.filter((n) => n.clientId === clientId);
    expect(fixture).toHaveLength(2);
    expect(sumByCurrency(fixture, 'amount', 'currency')).toEqual([
      { currency: 'EUR', total: 500 },
      { currency: 'USD', total: 1000 },
    ]);
  });

  it('pending tasks: todo/in_progress due within 7 days, null-due excluded, overdue-first', async () => {
    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const rows = await db.query.tasks.findMany({
      where: (t, { and, inArray, lte }) =>
        and(
          inArray(t.status, ['todo', 'in_progress']),
          lte(t.dueDate, sevenDaysFromNow)
        ),
      with: { project: true },
      orderBy: (t, { asc }) => [asc(t.dueDate)],
      limit: 8,
    });

    for (const row of rows) {
      expect(['todo', 'in_progress']).toContain(row.status);
    }

    const present = rows.filter((r) => r.projectId === tasksProjectId);
    const presentTitles = new Set(present.map((r) => r.title));
    for (const excluded of [`${prefix}-t3`, `${prefix}-t4`, `${prefix}-t5`]) {
      expect(presentTitles.has(excluded)).toBe(false);
    }

    const scoped = await db.query.tasks.findMany({
      where: (t, { and, eq, inArray, lte }) =>
        and(
          eq(t.projectId, tasksProjectId),
          inArray(t.status, ['todo', 'in_progress']),
          lte(t.dueDate, sevenDaysFromNow)
        ),
      orderBy: (t, { asc }) => [asc(t.dueDate)],
    });
    expect(scoped).toHaveLength(5);

    const sorted = sortByOverdueThenDue(scoped, (t) => t.dueDate);
    expect(sorted.map((t) => t.title)).toEqual([
      `${prefix}-t1`,
      `${prefix}-t6`,
      `${prefix}-t7`,
      `${prefix}-t2`,
      `${prefix}-t8`,
    ]);
  });

  it('client outstanding balance: pending+partial per client per currency', async () => {
    const outstanding = await db.query.payments.findMany({
      where: (p, { and, eq, inArray }) =>
        and(
          eq(p.clientId, clientId),
          inArray(p.status, ['pending', 'partial'])
        ),
      orderBy: (p, { asc }) => [asc(p.dueDate)],
    });

    expect(outstanding.some((r) => r.status === 'received')).toBe(false);
    expect(sumByCurrency(outstanding, 'amount', 'currency')).toEqual([
      { currency: 'EUR', total: 650 },
      { currency: 'GBP', total: 1000 },
      { currency: 'USD', total: 1850 },
    ]);
  });
});
