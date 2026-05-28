import { test, expect } from "@playwright/test";

test.describe("calculadora de anilhas", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector("#weight-input");
  });

  test("página carrega sem erro", async ({ page }) => {
    await expect(page).toHaveTitle(/Weight Plate Calculator/i);
    await expect(page.getByRole("heading")).toContainText("Calculadora de Anilhas");
  });

  test("estado inicial: barra 20 kg selecionada, sem resultado", async ({ page }) => {
    const btn20 = page.getByRole("button", { name: "Barra 20 kg" });
    await expect(btn20).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByText("ANILHAS POR LADO")).not.toBeVisible();
  });

  test("seletor de barra: trocar para 15 kg muda aria-pressed", async ({ page }) => {
    const btn15 = page.getByRole("button", { name: "Barra 15 kg" });
    const btn20 = page.getByRole("button", { name: "Barra 20 kg" });
    await btn15.click();
    await expect(btn15).toHaveAttribute("aria-pressed", "true");
    await expect(btn20).toHaveAttribute("aria-pressed", "false");
  });

  test("peso exato: 1×45lb por lado — sem banner de resíduo", async ({ page }) => {
    const exact = (20 + 2 * 45 * 0.453592).toFixed(5);
    await page.fill("#weight-input", exact);
    await expect(page.getByText("ANILHAS POR LADO")).toBeVisible();
    await expect(page.locator('[data-testid="residual-banner"]')).not.toBeVisible();
    await expect(page.getByText(/45 lb/).first()).toBeVisible();
  });

  test("peso aproximado: banner com mensagem de faltou", async ({ page }) => {
    await page.fill("#weight-input", "21");
    const banner = page.locator('[data-testid="residual-banner"]');
    await expect(banner).toBeVisible();
    await expect(banner).toContainText("faltaram");
  });

  test("peso igual à barra: mensagem de erro, sem lista de anilhas", async ({ page }) => {
    await page.fill("#weight-input", "20");
    const err = page.locator('[data-testid="error-message"]');
    await expect(err).toBeVisible();
    await expect(err).toContainText("maior que o peso da barra");
    await expect(page.getByText("ANILHAS POR LADO")).not.toBeVisible();
  });

  test("separador vírgula: '82,5' funciona como '82.5'", async ({ page }) => {
    await page.fill("#weight-input", "82.5");
    const hasDot = await page.getByText("ANILHAS POR LADO").isVisible();

    await page.fill("#weight-input", "");
    await page.fill("#weight-input", "82,5");
    const hasComma = await page.getByText("ANILHAS POR LADO").isVisible();

    expect(hasDot).toBe(hasComma);
  });

  test("limpar input: resultado desaparece", async ({ page }) => {
    await page.fill("#weight-input", "100");
    await expect(page.getByText("ANILHAS POR LADO")).toBeVisible();
    await page.fill("#weight-input", "");
    await expect(page.getByText("ANILHAS POR LADO")).not.toBeVisible();
  });

  test("trocar barra com input preenchido: recalcula", async ({ page }) => {
    await page.fill("#weight-input", "60");
    await expect(page.getByText("ANILHAS POR LADO")).toBeVisible();
    await page.getByRole("button", { name: "Barra 15 kg" }).click();
    await expect(page.getByText("ANILHAS POR LADO")).toBeVisible();
  });

  test("diagrama SVG está presente após cálculo", async ({ page }) => {
    await page.fill("#weight-input", "100");
    const svg = page.locator('svg[aria-label="Diagrama da barra com anilhas"]');
    await expect(svg).toBeVisible();
  });
});
