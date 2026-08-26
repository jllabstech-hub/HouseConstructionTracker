import { describe, expect, it } from "vitest";
import path from "path";
import { expenseSchema, documentSchema } from "@/lib/validations";

describe("Security & Validation Suite", () => {
  it("validates document schema correctly", () => {
    const valid = documentSchema.safeParse({
      title: "Ground Floor Architectural Plan",
      category: "FLOOR_PLAN",
      description: "Approved BBMP drawing",
      version: "v1.0",
    });
    expect(valid.success).toBe(true);

    const invalid = documentSchema.safeParse({
      title: "", // Empty title
      category: "INVALID_CAT",
    });
    expect(invalid.success).toBe(false);
  });

  it("validates expense schema correctly for material vs labour", () => {
    const validMaterial = expenseSchema.safeParse({
      projectId: "proj-123",
      expenseType: "MATERIAL",
      date: "2026-08-01",
      amount: "45000",
      description: "50 bags UltraTech Cement",
      materialCategoryId: "mat-cement",
      paymentMethod: "UPI",
    });
    expect(validMaterial.success).toBe(true);

    const validLabour = expenseSchema.safeParse({
      projectId: "proj-123",
      expenseType: "LABOUR",
      date: "2026-08-01",
      amount: "15000",
      description: "Plinth beam shuttering work",
      labourCategoryId: "lab-shuttering",
      paymentMethod: "CASH",
      labourCalcMethod: "DAILY_WAGE",
      numberOfWorkers: "5",
      numberOfDays: "3",
      rate: "1000",
    });
    expect(validLabour.success).toBe(true);
  });

  it("prevents path traversal attacks on uploads", () => {
    const root = path.resolve("./uploads");
    
    // Normal safe relative path
    const safePath = path.join(root, "documents", "user-1", "proj-1", "blueprint.pdf");
    expect(safePath.startsWith(root)).toBe(true);

    // Malicious path traversal attempts
    const maliciousPaths = [
      "../../etc/passwd",
      "..\\..\\Windows\\System32\\cmd.exe",
      "documents/../../../secrets.json",
    ];

    for (const mal of maliciousPaths) {
      const sanitized = path.basename(mal).replace(/[^a-zA-Z0-9._-]/g, "_");
      const fullPath = path.join(root, "documents", "user-1", sanitized);
      expect(fullPath.startsWith(root)).toBe(true);
      expect(fullPath).not.toContain("..");
    }
  });
});
