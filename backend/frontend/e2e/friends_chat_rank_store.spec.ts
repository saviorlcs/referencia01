import { expect, test } from "@playwright/test";

test("amigos + chat + rank + equip loja (modo teste)", async ({
	page,
	context,
	browser,
}) => {
	// Usuário A
	await page.goto("/");
	// garante que o harness está carregado
	await page.waitForFunction(() => !!window["__TEST__"]);
	// semente: A -> nick "LucasA"
	await page.evaluate(() => window["__TEST__"].seedUser("LucasA"));

	// Dê XP p/ aparecer no ranking
	await page.evaluate(() => window["__TEST__"].giveXP(120));

	// Equipa item de loja (persistência)
	await page.evaluate(() => window["__TEST__"].equipCosmetic());

	// Abre segunda janela: Usuário B
	const pageB = await browser.newPage({ baseURL: "http://127.0.0.1:3000" });
	await pageB.goto("/");
	await pageB.waitForFunction(() => !!window["__TEST__"]);
	await pageB.evaluate(() => window["__TEST__"].seedUser("LucasB"));
	await pageB.evaluate(() => window["__TEST__"].giveXP(80));

	// === Chat (simplificado) ===
	// Se o seu chat estiver numa rota/aba, navegue por texto/role:
	// Ex.: await page.getByRole('tab', { name: /chat/i }).click();

	// Como não sabemos seus seletores, valide "presença de UI" minimamente:
	await expect(page).toHaveTitle(/ciclo|study|timer/i);

	// === Ranking ===
	// Espera que A (120 xp) esteja acima de B (80 xp).
	// Se você tiver um data-testid, melhor; abaixo, exemplo genérico:
	// const rows = await page.locator('[data-testid="leaderboard-item"]').allTextContents();
	// expect(rows[0]).toMatch(/LucasA/);

	// === Visual do equipado ===
	// Tira screenshot para inspeção manual + regressão visual
	await page.screenshot({
		path: "e2e-artifacts/equip-visual-A.png",
		fullPage: true,
	});
	await pageB.screenshot({
		path: "e2e-artifacts/leaderboard-AB.png",
		fullPage: true,
	});

	// Apenas sanity: páginas renderizaram sem tela branca
	await expect(page.locator("body")).toBeVisible();
	await expect(pageB.locator("body")).toBeVisible();
});
