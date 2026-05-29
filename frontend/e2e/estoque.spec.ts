import { test, expect } from "@playwright/test";

test.describe("tela de estoque", () => {
  test.beforeEach(async ({ page }) => {
    // Garantir estoque padrão antes de cada teste
    await page.goto("/");
    await page.evaluate(() => localStorage.removeItem("wcalculator-stock"));
    await page.goto("/estoque");
    await page.waitForLoadState("networkidle");
  });

  test("navega para /estoque e volta para /", async ({ page }) => {
    await expect(page.getByText("Estoque de Anilhas")).toBeVisible();
    await page.getByRole("link", { name: "Voltar" }).click();
    await expect(page).toHaveURL("/");
    await expect(page.getByText("Calculadora de Anilhas")).toBeVisible();
  });

  test("quantidades padrão exibidas corretamente", async ({ page }) => {
    // 45 lb deve ter 10
    const input45 = page.getByRole("spinbutton", { name: /45 lb/i }).or(
      page.locator('[aria-label="Quantidade de 45 lb"]')
    );
    await expect(input45).toHaveValue("10");
  });

  test("botão + aumenta por 2", async ({ page }) => {
    await page.locator('[aria-label="Quantidade de 45 lb"]').click();
    const plusBtn = page.locator('[aria-label="Aumentar"]').first();
    await plusBtn.click();
    await expect(page.locator('[aria-label="Quantidade de 45 lb"]')).toHaveValue("12");
  });

  test("botão − diminui por 2", async ({ page }) => {
    const minusBtn = page.locator('[aria-label="Diminuir"]').first();
    await minusBtn.click();
    await expect(page.locator('[aria-label="Quantidade de 45 lb"]')).toHaveValue("8");
  });

  test("número ímpar é ajustado para par inferior", async ({ page }) => {
    const input = page.locator('[aria-label="Quantidade de 45 lb"]');
    await input.fill("7");
    await input.blur();
    await expect(input).toHaveValue("6");
    await expect(page.getByText("Ajustado para 6")).toBeVisible();
  });

  test("botão − desabilitado em 0", async ({ page }) => {
    const input = page.locator('[aria-label="Quantidade de 45 lb"]');
    await input.fill("0");
    await input.blur();
    const minusBtn = page.locator('[aria-label="Diminuir"]').first();
    await expect(minusBtn).toBeDisabled();
  });

  test("restaurar padrão reseta valores (com confirmação)", async ({ page }) => {
    // Mudar um valor
    const input = page.locator('[aria-label="Quantidade de 45 lb"]');
    await input.fill("4");
    await input.blur();
    await expect(input).toHaveValue("4");

    // Restaurar
    page.on("dialog", (dialog) => dialog.accept());
    await page.getByRole("button", { name: /Restaurar padrão/i }).click();
    await expect(input).toHaveValue("10");
  });

  test("persistência: estoque sobrevive ao reload", async ({ page }) => {
    const input = page.locator('[aria-label="Quantidade de 35 lb"]');
    await input.fill("4");
    await input.blur();

    await page.reload();
    await page.waitForLoadState("networkidle");
    await expect(page.locator('[aria-label="Quantidade de 35 lb"]')).toHaveValue("4");
  });
});

test.describe("estoque integrado com cálculo principal", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => localStorage.removeItem("wcalculator-stock"));
    await page.reload();
    await page.waitForSelector("#weight-input");
  });

  test("zerar 45 lb faz cálculo usar outra anilha", async ({ page }) => {
    // Zerar 45 lb no estoque
    await page.goto("/estoque");
    const input45 = page.locator('[aria-label="Quantidade de 45 lb"]');
    await input45.fill("0");
    await input45.blur();

    // Voltar e calcular
    await page.goto("/");
    await page.waitForSelector("#weight-input");
    await page.fill("#weight-input", "100");
    await page.waitForTimeout(400);

    // 45 lb não deve aparecer no resultado
    await expect(page.getByText("ANILHAS POR LADO")).toBeVisible();
    await expect(page.locator("text=/45 lb/").first()).not.toBeVisible();
  });

  test("retorno após edição de estoque exibe banner e limpa cadeia", async ({ page }) => {
    // Criar cadeia
    await page.fill("#weight-input", "80");
    await page.waitForTimeout(300);
    await page.fill("#carga-input-2", "100");
    await page.waitForTimeout(300);

    // Ir para estoque e mudar algo
    await page.goto("/estoque");
    const plusBtn = page.locator('[aria-label="Aumentar"]').first();
    await plusBtn.click();

    // Voltar
    await page.goto("/");
    await page.waitForSelector("#weight-input");

    // Banner deve aparecer
    await expect(page.getByRole("status")).toBeVisible();
    await expect(page.getByRole("status")).toContainText("Estoque atualizado");
  });
});
