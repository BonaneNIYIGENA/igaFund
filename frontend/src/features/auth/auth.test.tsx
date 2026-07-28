import { ReactNode } from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { Login } from "./Login";
import { Register } from "./Register";
import { AuthProvider } from "./AuthContext";
import { LocaleProvider } from "@/lib/i18n";
import { ThemeProvider } from "@/lib/theme";

const okTokens = { access: "a", refresh: "r", user: { id: 1, email: "s@example.com", role: "student", full_name: "Sam" } };

vi.mock("../../lib/api", () => ({
  getToken: () => null,
  api: vi.fn(async (path: string) => {
    if (path === "/auth/login" || path === "/auth/register") return okTokens;
    throw new Error("unauthorized");
  }),
}));

function renderWith(ui: ReactNode) {
  return render(
    <ThemeProvider>
      <LocaleProvider>
        <MemoryRouter>
          <AuthProvider>{ui}</AuthProvider>
        </MemoryRouter>
      </LocaleProvider>
    </ThemeProvider>,
  );
}

describe("Login", () => {
  beforeEach(() => localStorage.clear());

  it("renders the sign-in form", () => {
    renderWith(<Login />);
    expect(screen.getByRole("heading", { name: /welcome back/i })).toBeInTheDocument();
  });

  it("stores a token on successful submit", async () => {
    renderWith(<Login />);
    await userEvent.type(screen.getByLabelText(/email/i), "s@example.com");
    await userEvent.type(screen.getByLabelText(/^password$/i), "Passw0rd!");
    await userEvent.click(screen.getByRole("button", { name: /sign in/i }));
    expect(localStorage.getItem("access")).toBe("a");
  });
});

describe("Register", () => {
  beforeEach(() => localStorage.clear());

  it("offers student and donor self-service roles", () => {
    renderWith(<Register />);
    expect(screen.getByRole("button", { name: /a student/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /a donor/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /an ambassador/i })).not.toBeInTheDocument();
  });

  it("selects a role and registers", async () => {
    renderWith(<Register />);
    const donor = screen.getByRole("button", { name: /a donor/i });
    await userEvent.click(donor);
    expect(donor).toHaveAttribute("aria-pressed", "true");
    await userEvent.type(screen.getByLabelText(/full name/i), "Dana Donor");
    await userEvent.type(screen.getByLabelText(/email/i), "d@example.com");
    await userEvent.type(screen.getByLabelText(/^password$/i), "Passw0rd!");
    await userEvent.type(screen.getByLabelText(/confirm password/i), "Passw0rd!");
    await userEvent.click(screen.getByRole("button", { name: /create donor account/i }));
    expect(localStorage.getItem("access")).toBe("a");
  });
});
