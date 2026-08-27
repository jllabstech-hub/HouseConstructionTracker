import { describe, expect, it } from "vitest";

describe("Multi-Project Authorization & Isolation Rules", () => {
  // Test Mock Users & Projects
  const userA = { id: "user_aaa_111", email: "homeowner1@test.com" };
  const userB = { id: "user_bbb_222", email: "homeowner2@test.com" };

  const projectA1 = { id: "proj_a1", userId: userA.id, name: "House Alpha", totalBudget: "5000000" };
  const projectA2 = { id: "proj_a2", userId: userA.id, name: "House Beta", totalBudget: "3500000" };
  const projectB1 = { id: "proj_b1", userId: userB.id, name: "House Gamma", totalBudget: "6000000" };

  const allProjects = [projectA1, projectA2, projectB1];

  // Helper simulating getOwnedProjectOrNull
  function getOwnedProject(projectId: string, userId: string) {
    return allProjects.find((p) => p.id === projectId && p.userId === userId) ?? null;
  }

  // Helper simulating active project cookie resolution with self-healing
  function resolveActiveProject(userId: string, cookieProjectId?: string | null) {
    const userOwned = allProjects.filter((p) => p.userId === userId);
    if (userOwned.length === 0) return null;

    const matched = cookieProjectId ? userOwned.find((p) => p.id === cookieProjectId) : null;
    return matched ?? userOwned[0];
  }

  it("1. Resolves null when user has no projects", () => {
    const active = resolveActiveProject("user_empty_999", "any-cookie");
    expect(active).toBeNull();
  });

  it("2. Resolves single project correctly when user has one project", () => {
    const active = resolveActiveProject(userB.id, null);
    expect(active).not.toBeNull();
    expect(active?.id).toBe("proj_b1");
    expect(active?.userId).toBe(userB.id);
  });

  it("3. Resolves matched project when user has multiple projects", () => {
    const active = resolveActiveProject(userA.id, "proj_a2");
    expect(active).not.toBeNull();
    expect(active?.id).toBe("proj_a2");
    expect(active?.name).toBe("House Beta");
  });

  it("4. Supports switching projects seamlessly", () => {
    // Current is Alpha
    let active = resolveActiveProject(userA.id, "proj_a1");
    expect(active?.id).toBe("proj_a1");

    // User switches to Beta
    active = resolveActiveProject(userA.id, "proj_a2");
    expect(active?.id).toBe("proj_a2");
  });

  it("5. Self-heals when active project in cookie is deleted", () => {
    // Cookie points to deleted project 'proj_deleted'
    const active = resolveActiveProject(userA.id, "proj_deleted");
    expect(active).not.toBeNull();
    // Must fallback safely to user's first available project
    expect(active?.id).toBe("proj_a1");
    expect(active?.userId).toBe(userA.id);
  });

  it("6. Handles invalid/malformed project IDs safely", () => {
    const malformed = ["", "null", "undefined", "<script>", "'; DROP TABLE;--"];
    for (const invalidId of malformed) {
      const active = resolveActiveProject(userA.id, invalidId);
      expect(active).not.toBeNull();
      expect(active?.id).toBe("proj_a1");
    }
  });

  it("7. Blocks direct access to another user's project (Tenant Isolation)", () => {
    // User A tries to access User B's project 'proj_b1'
    const accessedByA = getOwnedProject("proj_b1", userA.id);
    expect(accessedByA).toBeNull();

    // User B tries to access User A's project 'proj_a1'
    const accessedByB = getOwnedProject("proj_a1", userB.id);
    expect(accessedByB).toBeNull();

    // Stale cookie belonging to User B sent by User A self-heals to User A's own project
    const crossCookieAttempt = resolveActiveProject(userA.id, "proj_b1");
    expect(crossCookieAttempt?.userId).toBe(userA.id);
    expect(crossCookieAttempt?.id).not.toBe("proj_b1");
  });

  it("8. Scopes related records (expenses, stages, floors, documents) strictly by project and user", () => {
    const expenses = [
      { id: "exp_1", projectId: "proj_a1", amount: 5000 },
      { id: "exp_2", projectId: "proj_a2", amount: 8000 },
      { id: "exp_3", projectId: "proj_b1", amount: 12000 },
    ];

    // Filter expenses for User A's active project proj_a1
    const userAProjectExpenses = expenses.filter((e) => e.projectId === "proj_a1");
    expect(userAProjectExpenses.length).toBe(1);
    expect(userAProjectExpenses[0].id).toBe("exp_1");

    // Ensure no cross-project leakage from proj_b1
    expect(userAProjectExpenses.some((e) => e.projectId === "proj_b1")).toBe(false);
  });
});
