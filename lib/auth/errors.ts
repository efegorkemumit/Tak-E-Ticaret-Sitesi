/**
 * Admin auth modülünün fırlattığı hata tipleri — commerce'in
 * `lib/commerce/errors.ts`'teki desenle aynı gerekçeyle: ham DB hatası hiçbir
 * zaman doğrudan çağırana sızmaz, yapılandırılmış bir hata sınıfı üzerinden
 * iletilir.
 */

export class AdminAuthRequiredError extends Error {
  constructor() {
    super("Bu işlem için admin girişi gereklidir.")
    this.name = "AdminAuthRequiredError"
  }
}

/** `createFirstAdmin` — setup penceresi eşzamanlı bir istekle veya daha önce kapatılmış. */
export class SetupAlreadyCompletedError extends Error {
  constructor() {
    super("Kurulum zaten tamamlanmış; ilk admin hesabı daha önce oluşturuldu.")
    this.name = "SetupAlreadyCompletedError"
  }
}
