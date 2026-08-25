import { describe, expect, it } from "vitest";
import { z } from "zod";

const leadSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters"),
  phone: z.string().trim().min(10, "Please enter a valid 10-digit phone number"),
  email: z.string().trim().email("Invalid email address").optional().or(z.literal("")),
  location: z.string().trim().min(2, "Please enter project city or locality"),
  plotArea: z.string().trim().optional(),
  builtUpArea: z.string().trim().optional(),
  floors: z.string().trim().optional(),
  budget: z.string().trim().optional(),
  constructionStage: z.string().trim().optional(),
  requirements: z.string().trim().optional(),
});

describe("lead validation schema", () => {
  it("validates valid lead submissions", () => {
    const validLead = {
      name: "Ramesh Rao",
      phone: "9876543210",
      email: "ramesh@example.com",
      location: "Bangalore, Whitefield",
      plotArea: "1200",
      builtUpArea: "2400",
      floors: "G+1",
      budget: "40L-60L",
      constructionStage: "Planning",
      requirements: "RCC framed structure with red bricks",
    };
    const parsed = leadSchema.safeParse(validLead);
    expect(parsed.success).toBe(true);
  });

  it("rejects invalid short phone numbers", () => {
    const invalidPhone = {
      name: "Ramesh Rao",
      phone: "12345",
      location: "Bangalore",
    };
    const parsed = leadSchema.safeParse(invalidPhone);
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.issues[0].message).toContain("10-digit");
    }
  });

  it("allows optional empty email", () => {
    const withoutEmail = {
      name: "Suresh Kumar",
      phone: "9123456789",
      email: "",
      location: "Hyderabad",
    };
    const parsed = leadSchema.safeParse(withoutEmail);
    expect(parsed.success).toBe(true);
  });
});
