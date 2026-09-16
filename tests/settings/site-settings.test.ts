import "../helpers/mock-admin-cookie"
import { beforeEach, describe, expect, it } from "vitest"
import { testPrisma } from "../helpers/test-prisma"
import { getSiteSettings, updateSiteSettings, getReservationWindowHours } from "../../lib/settings/service"
import { renderTransferDescription } from "../../lib/settings/transfer-description"
import {
  SITE_SETTINGS_ID,
  DEFAULT_RESERVATION_WINDOW_HOURS,
  ORDER_NUMBER_PLACEHOLDER,
} from "../../lib/settings/constants"
import { AdminAuthRequiredError } from "../../lib/auth"
import {
  VALID_TEST_IBAN,
  VALID_TEST_IBAN_ALTERNATIVE,
  createAuthenticatedAdmin,
  createSiteSettings,
  resetCommerceTables,
} from "../helpers/factories"
import { setMockAdminCookie, clearMockAdminCookie } from "../helpers/mock-admin-cookie"

beforeEach(async () => {
  await resetCommerceTables()
})

/** Geçerli, minimum bir ayar girdisi — testler yalnızca farklı kıldıkları alanı override eder. */
function buildSettingsInput(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    bankName: "Test Bankası",
    accountHolder: "Test Hesap Sahibi",
    iban: VALID_TEST_IBAN,
    transferDescriptionTemplate: `Sipariş ${ORDER_NUMBER_PLACEHOLDER}`,
    reservationWindowHours: 24,
    ...overrides,
  }
}

describe("Site ayarları — okuma (D032)", () => {
  it("ayar hiç kurulmamışken getSiteSettings null döner (uydurma varsayılan IBAN YOK)", async () => {
    expect(await getSiteSettings(testPrisma)).toBeNull()
  })

  it("ayar yokken getReservationWindowHours varsayılan pencereye düşer", async () => {
    expect(await getReservationWindowHours(testPrisma)).toBe(DEFAULT_RESERVATION_WINDOW_HOURS)
  })

  it("getSiteSettings AUTH İSTEMEZ — havale bilgisi müşteriye gösterilen public veridir", async () => {
    clearMockAdminCookie()
    await createSiteSettings({ bankName: "Public Banka" })

    const settings = await getSiteSettings(testPrisma)
    expect(settings?.bankName).toBe("Public Banka")
  })
})

describe("Site ayarları — yazma yetkisi (D032)", () => {
  it("oturumsuz updateSiteSettings reddedilir (IBAN yazma yetkisi en kritik sınırdır)", async () => {
    clearMockAdminCookie()

    await expect(updateSiteSettings(buildSettingsInput(), testPrisma)).rejects.toBeInstanceOf(AdminAuthRequiredError)

    // Reddedilen çağrı DB'ye HİÇBİR ŞEY yazmamış olmalı.
    expect(await testPrisma.siteSettings.count()).toBe(0)
  })

  it("oturumsuz çağrı, girdi GEÇERSİZ olsa bile önce auth'ta durur (girdi geçerliliği sızdırılmaz)", async () => {
    clearMockAdminCookie()

    await expect(
      updateSiteSettings(buildSettingsInput({ iban: "bozuk-iban" }), testPrisma)
    ).rejects.toBeInstanceOf(AdminAuthRequiredError)
  })
})

describe("Site ayarları — upsert ve singleton davranışı (D032)", () => {
  it("admin ile geçerli girdi ayarı oluşturur", async () => {
    const { token } = await createAuthenticatedAdmin()
    setMockAdminCookie(token)

    const result = await updateSiteSettings(buildSettingsInput({ bankName: "Ziraat Test" }), testPrisma)

    expect(result.success).toBe(true)
    if (!result.success) throw new Error("beklenmedik hata")
    expect(result.settings.bankName).toBe("Ziraat Test")
    expect(result.settings.iban).toBe(VALID_TEST_IBAN)

    const row = await testPrisma.siteSettings.findUniqueOrThrow({ where: { id: SITE_SETTINGS_ID } })
    expect(row.bankName).toBe("Ziraat Test")
  })

  it("İKİNCİ çağrı yeni satır AÇMAZ, mevcut satırı günceller (singleton + idempotent — D017'nin ruhu)", async () => {
    const { token } = await createAuthenticatedAdmin()
    setMockAdminCookie(token)

    await updateSiteSettings(buildSettingsInput({ bankName: "İlk Banka" }), testPrisma)
    const second = await updateSiteSettings(
      buildSettingsInput({ bankName: "İkinci Banka", iban: VALID_TEST_IBAN_ALTERNATIVE }),
      testPrisma
    )

    expect(second.success).toBe(true)
    if (!second.success) throw new Error("beklenmedik hata")
    expect(second.settings.bankName).toBe("İkinci Banka")
    expect(second.settings.iban).toBe(VALID_TEST_IBAN_ALTERNATIVE)

    // ASIL İDDİA: tabloda hâlâ TEK satır var.
    expect(await testPrisma.siteSettings.count()).toBe(1)
    const rows = await testPrisma.siteSettings.findMany()
    expect(rows[0].id).toBe(SITE_SETTINGS_ID)
  })

  it("AYNI girdiyle iki kez çağırmak da tek satır bırakır", async () => {
    const { token } = await createAuthenticatedAdmin()
    setMockAdminCookie(token)

    await updateSiteSettings(buildSettingsInput(), testPrisma)
    await updateSiteSettings(buildSettingsInput(), testPrisma)

    expect(await testPrisma.siteSettings.count()).toBe(1)
  })
})

describe("Site ayarları — IBAN normalizasyonu ve doğrulaması (D032)", () => {
  it("boşluklu/küçük harfli IBAN normalize edilerek saklanır, gösterim 4'lü gruplanır", async () => {
    const { token } = await createAuthenticatedAdmin()
    setMockAdminCookie(token)

    const result = await updateSiteSettings(
      buildSettingsInput({ iban: "tr33 0006 1005 1978 6457 8413 26" }),
      testPrisma
    )

    expect(result.success).toBe(true)
    if (!result.success) throw new Error("beklenmedik hata")
    expect(result.settings.iban).toBe(VALID_TEST_IBAN)
    expect(result.settings.ibanFormatted).toBe("TR33 0006 1005 1978 6457 8413 26")

    // DB'de de KANONİK (boşluksuz, büyük harfli) biçim durmalı — aynı IBAN'ın
    // iki farklı yazımla saklanması karşılaştırmayı/kopyalamayı bozardı.
    const row = await testPrisma.siteSettings.findUniqueOrThrow({ where: { id: SITE_SETTINGS_ID } })
    expect(row.iban).toBe(VALID_TEST_IBAN)
  })

  const invalidIbans: Array<[string, string]> = [
    ["yanlış mod-97 sağlama toplamı", "TR120006100519786457841326"],
    ["TR olmayan ülke kodu (geçerli bir DE IBAN'ı)", "DE89370400440532013000"],
    ["eksik hane", "TR3300061005197864578413"],
    ["fazla hane", "TR3300061005197864578413260"],
    ["harf içeren gövde", "TR33000610051978645784132X"],
    ["boş string", ""],
  ]

  it.each(invalidIbans)("geçersiz IBAN reddedilir: %s", async (_label, iban) => {
    const { token } = await createAuthenticatedAdmin()
    setMockAdminCookie(token)

    const result = await updateSiteSettings(buildSettingsInput({ iban }), testPrisma)

    expect(result.success).toBe(false)
    if (result.success) throw new Error("beklenmedik başarı")
    expect(result.error.code).toBe("INVALID_INPUT")

    // Geçersiz girdi DB'ye hiç dokunmamış olmalı.
    expect(await testPrisma.siteSettings.count()).toBe(0)
  })
})

describe("Site ayarları — havale açıklaması şablonu (D032)", () => {
  it("`{orderNumber}` yer tutucusu İÇERMEYEN şablon reddedilir (havale eşleştirmesi imkânsızlaşırdı)", async () => {
    const { token } = await createAuthenticatedAdmin()
    setMockAdminCookie(token)

    const result = await updateSiteSettings(
      buildSettingsInput({ transferDescriptionTemplate: "Takı siparişi ödemesi" }),
      testPrisma
    )

    expect(result.success).toBe(false)
    if (result.success) throw new Error("beklenmedik başarı")
    expect(result.error.code).toBe("INVALID_INPUT")
    expect(await testPrisma.siteSettings.count()).toBe(0)
  })

  it("boş şablon reddedilir", async () => {
    const { token } = await createAuthenticatedAdmin()
    setMockAdminCookie(token)

    const result = await updateSiteSettings(buildSettingsInput({ transferDescriptionTemplate: "" }), testPrisma)

    expect(result.success).toBe(false)
    if (result.success) throw new Error("beklenmedik başarı")
    expect(result.error.code).toBe("INVALID_INPUT")
  })

  it("renderTransferDescription şablonu sipariş numarasıyla doldurur", () => {
    expect(renderTransferDescription(`Sipariş ${ORDER_NUMBER_PLACEHOLDER}`, "ORD-20260916-ABC123")).toBe(
      "Sipariş ORD-20260916-ABC123"
    )
  })

  it("renderTransferDescription yer tutucunun TÜM örneklerini değiştirir", () => {
    expect(
      renderTransferDescription(`${ORDER_NUMBER_PLACEHOLDER} / ${ORDER_NUMBER_PLACEHOLDER}`, "ORD-1")
    ).toBe("ORD-1 / ORD-1")
  })

  it("renderTransferDescription yer tutucu YOKSA şablonu olduğu gibi döner (sessiz düzeltme yapmaz)", () => {
    expect(renderTransferDescription("Yer tutucusuz şablon", "ORD-1")).toBe("Yer tutucusuz şablon")
  })
})

describe("Site ayarları — rezervasyon penceresi (D018/D032)", () => {
  const invalidWindows: Array<[string, unknown]> = [
    ["sıfır", 0],
    ["negatif", -1],
    ["ondalık", 1.5],
    ["üst sınırın üstü (721 saat)", 721],
    ["sayı olmayan", "24"],
  ]

  it.each(invalidWindows)("geçersiz reservationWindowHours reddedilir: %s", async (_label, value) => {
    const { token } = await createAuthenticatedAdmin()
    setMockAdminCookie(token)

    const result = await updateSiteSettings(buildSettingsInput({ reservationWindowHours: value }), testPrisma)

    expect(result.success).toBe(false)
    if (result.success) throw new Error("beklenmedik başarı")
    expect(result.error.code).toBe("INVALID_INPUT")
    expect(await testPrisma.siteSettings.count()).toBe(0)
  })

  it("geçerli bir pencere kaydedilir ve getReservationWindowHours onu okur", async () => {
    const { token } = await createAuthenticatedAdmin()
    setMockAdminCookie(token)

    await updateSiteSettings(buildSettingsInput({ reservationWindowHours: 1 }), testPrisma)

    expect(await getReservationWindowHours(testPrisma)).toBe(1)
  })
})
