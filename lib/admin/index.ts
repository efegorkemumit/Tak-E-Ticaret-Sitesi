/**
 * `lib/admin/` — admin panel domain servisleri. SUNUCU-TARAFI (Prisma/`pg`
 * zincirini içe aktarır) — CLIENT COMPONENT'LERDEN İMPORT ETMEYİN.
 *
 * BİLİNÇLİ OLARAK BU BARREL'DAN DIŞARIDA BIRAKILANLAR (client-safe, doğrudan
 * import edilmeli — `lib/commerce`/`lib/auth`'taki aynı desen):
 * - `./schemas` (Zod şemaları)
 * - `./order-status` (OTORİTER geçiş tablosu — Prisma'ya bağımlı değil, bir
 *   admin UI'ı durum dropdown'ında hangi geçişlerin geçerli olduğunu
 *   göstermek için bunu doğrudan import edebilir)
 * - `./slug` (saf transliterasyon)
 * - `./image-validation` (saf magic-byte doğrulama)
 *
 * Her fonksiyon `requireAdmin()`'i kendi içinde çağırır — TEK, paylaşılan
 * guard; hiçbir admin fonksiyonu bunu atlamaz.
 */

export {
  listProductsForAdmin,
  getProductForAdmin,
  createProduct,
  updateProduct,
  addDescriptiveAttributeToProduct,
  removeDescriptiveAttributeFromProduct,
  // VIDEO 09 / D030 — ürünün Shopier satış kanalı bağlantısı.
  updateProductShopierLink,
} from "./products"
export type {
  AdminProductListItemDto,
  AdminProductDetailDto,
  AdminAttributeSelectionDto,
  AdminDescriptiveAttributeDto,
  AdminVariantDto,
  AdminProductImageDto,
  ProductMutationResult,
  ProductMutationErrorCode,
  AddDescriptiveAttributeResult,
  RemoveDescriptiveAttributeResult,
  UpdateProductShopierLinkResult,
  ProductShopierLinkErrorCode,
} from "./products"

export { listCategoriesForAdmin, createCategory, updateCategory } from "./categories"
export type { AdminCategoryDto, CategoryMutationResult, CategoryMutationErrorCode } from "./categories"

export { listCollectionsForAdmin, createCollection, updateCollection } from "./collections"
export type { AdminCollectionDto, CollectionMutationResult, CollectionMutationErrorCode } from "./collections"

export { listAttributeDefinitionsForAdmin, createAttributeDefinition, createAttributeValue } from "./attributes"
export type { AdminAttributeDefinitionDto, AdminAttributeValueDto, CreateAttributeDefinitionResult, CreateAttributeValueResult } from "./attributes"

export { suggestVariantSku, createVariant, updateVariant } from "./variants"
export type { VariantMutationResult, VariantMutationErrorCode } from "./variants"

export { getVariantStockBreakdown, updateVariantStock } from "./stock"
export type { VariantStockBreakdownDto, UpdateVariantStockResult } from "./stock"

export {
  uploadProductImage,
  deleteProductImage,
  reorderProductImagesAsAdmin,
  setMainProductImageAsAdmin,
} from "./images"
export type { UploadProductImageInput, UploadProductImageResult, DeleteProductImageResult, ReorderProductImagesResult } from "./images"

export { listOrdersForAdmin, getOrderDetailById, getOrderDetailByOrderNumber, updateOrderStatus } from "./orders"
export type { AdminOrderListItemDto, AdminOrderItemDto, AdminOrderDetailDto, UpdateOrderStatusResult, UpdateOrderStatusErrorCode } from "./orders"

// VIDEO 09 / D033 — havale ödemesinin manuel onayı ve reddi. D026'nın "ödeme
// onayı bu kapsamın dışında" sınırı bu turda kalkmıştır.
export { confirmOrderPayment, rejectOrderPayment } from "./payments"
export type { OrderPaymentResult, OrderPaymentErrorCode } from "./payments"

export {
  AdminServiceError,
  ProductNotFoundError,
  CategoryNotFoundError,
  CollectionNotFoundError,
  AttributeDefinitionNotFoundError,
  AttributeValueNotFoundError,
  VariantNotFoundError,
  OrderNotFoundError,
  ProductImageNotFoundError,
  InvalidOrderStatusTransitionError,
  InvalidPaymentStateError,
  StockInconsistencyError,
} from "./errors"
