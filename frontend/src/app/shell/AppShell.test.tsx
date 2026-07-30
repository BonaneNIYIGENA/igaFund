import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { LocaleProvider } from "@/lib/i18n";
import { ThemeProvider } from "@/lib/theme";
import type { Role } from "@/lib/api";
import { AppShell } from "./AppShell";

let mockRole: Role = "student";
let mockIsNative = false;

vi.mock("@/features/auth/AuthContext", () => ({
  useAuth: () => ({
    user: { id: 1, email: "u@example.com", full_name: "Test User", role: mockRole },
    logout: vi.fn(),
  }),
}));

vi.mock("@capacitor/core", () => ({
  Capacitor: { isNativePlatform: () => mockIsNative },
}));

vi.mock("@/lib/api", async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  endpoints: { notifications: vi.fn(async () => ({ notifications: [] })) },
}));

function renderShell() {
  return render(
    <ThemeProvider>
      <LocaleProvider>
        <MemoryRouter>
          <AppShell title="Test page">content</AppShell>
        </MemoryRouter>
      </LocaleProvider>
    </ThemeProvider>,
  );
}

describe("AppShell APK download button", () => {
  afterEach(() => {
    mockRole = "student";
    mockIsNative = false;
  });

  it("shows the download link for a student on the web", () => {
    mockRole = "student";
    mockIsNative = false;
    renderShell();
    expect(screen.getAllByRole("link", { name: /android app/i }).length).toBeGreaterThan(0);
  });

  it("shows the download link for an ambassador on the web", () => {
    mockRole = "ambassador";
    mockIsNative = false;
    renderShell();
    expect(screen.getAllByRole("link", { name: /android app/i }).length).toBeGreaterThan(0);
  });

  it("hides the download link for a donor", () => {
    mockRole = "donor";
    mockIsNative = false;
    renderShell();
    expect(screen.queryByRole("link", { name: /android app/i })).not.toBeInTheDocument();
  });

  it("hides the download link for an admin", () => {
    mockRole = "admin";
    mockIsNative = false;
    renderShell();
    expect(screen.queryByRole("link", { name: /android app/i })).not.toBeInTheDocument();
  });

  it("hides the download link for a student inside the native Android app", () => {
    mockRole = "student";
    mockIsNative = true;
    renderShell();
    expect(screen.queryByRole("link", { name: /android app/i })).not.toBeInTheDocument();
  });

  it("points the download link at the bundled APK", () => {
    mockRole = "ambassador";
    mockIsNative = false;
    renderShell();
    const links = screen.getAllByRole("link", { name: /android app/i });
    for (const link of links) {
      expect(link).toHaveAttribute("href", "/downloads/igaFund.apk");
      expect(link).toHaveAttribute("download");
    }
  });
});
