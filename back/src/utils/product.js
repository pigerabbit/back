export function getRequiredInfoFromProductData(data) {
  return {
    userId: data.userId,
    businessName: data.businessName,
    id: data.id,
    images: data.images,
    category: data.category,
    name: data.name,
    description: data.description,
    descriptionImg: data.descriptionImg,
    price: data.price,
    salePrice: data.salePrice,
    discountRate: data.discountRate,
    minPurchaseQty: data.minPurchaseQty,
    maxPurchaseQty: data.maxPurchaseQty,
    views: data.views,
    shippingFee: data.shippingFee,
    shippingFeeCon: data.shippingFeeCon,
    detail: data.detail,
    detailImg: data.detailImg,
    shippingInfo: data.shippingInfo,
  };
}
