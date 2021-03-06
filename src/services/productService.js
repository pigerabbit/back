import { Product } from "../db/index.js";
import { User } from "../db/index.js";
import { Post } from "../db/index.js";
import { Group } from "../db/index.js";
import crypto from "crypto";
import { getRequiredInfoFromProductData } from "../utils/product";
import { ToggleModel } from "../db/schemas/toggle.js";
import { productsWithToggleInfo } from "../utils/productsWithToggleInfo";

class ProductService {
  /** 판매 상품 생성 함수
   * 
   * @param {Strings} userId - 유저 Id
   * @param {String} productType - 상품 type ['local', 'normal', 'coupon']
   * @param {Strings} category - 상품 카테고리
   * @param {Strings} name - 상품 이름
   * @param {Strings} description - 상품 설명
   * @param {Number} price - 상품 원가
   * @param {Number} salePrice - 판매 가격
   * @param {Number} minPurchaseQty - 공동구매 최소 인원
   * @param {Number} maxPurchaseQty - 유저가 가진 상품 재고
   * @param {Number} shippingFee - 배송비
   * @param {Number} shippingFeeCon - 무료 배송 조건
   * @param {Strings} detail - 상품 상세 설명
   * @param {Strings} shippingInfo - 배송 안내
   * @param {Number} term - 상품 type이 coupon일 때 얼마 이내에 사용해야 하는지
   * @return {Object} 생성된 상품 정보 
   */
  static async addProduct({
    userId,
    productType,
    category,
    name,
    description,
    price,
    salePrice,
    minPurchaseQty,
    maxPurchaseQty,
    shippingFee,
    shippingFeeCon,
    detail,
    shippingInfo,
    term,
  }) { 
    // PK는 UUID로 설정
    const id = crypto.randomUUID();
    // discountRate(할인율)는 {(정가 - 판매가) / 정가 } * 100
    const discountRate = Math.ceil(((price - salePrice) / price) * 100);
    const user = await User.findById({ userId });
    const userInfo = user._id;

    // 유저와 product 관계를 맺어주기 위해 유저를 조회한 뒤, 새 product 생성
    const newProduct = {
      id,
      userId,
      userInfo,
      productType,
      category,
      name,
      description,
      price,
      salePrice,
      discountRate,
      minPurchaseQty,
      maxPurchaseQty,
      shippingFee,
      shippingFeeCon,
      detail,
      shippingInfo,
      term,
    };

    // 상품을 생성한 뒤 변수로 저장
    let product = await Product.create({ newProduct });
    // 상품 생성 시에는 populate가 되어 있지 않기 때문에, 한 번 더 findProduct
    product = await Product.findProduct({ id: product.id });
    // 프론트에 전해줄 데이터만 정리해주는 함수로 다녀옴
    const resultProduct = getRequiredInfoFromProductData(product);

    return { resultProduct };
  }

  /** 상품 정보 수정 함수
   * 
   * @param {uuid} id - 상품 id
   * @param {Object} toUpdate - 수정할 상품 내용
   * @return {Object} 수정된 상품 정보
   */
  static async setProduct({ userId, id, toUpdate }) {
    let product = await Product.findProduct({ id });

    if (!product) {
      const errorMessage = "해당 상품이 존재하지 않습니다.";
      return { errorMessage };
    }

    if (product.userId !== userId) {
      const errorMessage = "해당 상품을 판매하는 유저만 수정이 가능합니다.";
      return { errorMessage };
    }

    Object.keys(toUpdate).forEach((key) => {
      if (toUpdate[key] === undefined || toUpdate[key] === null) {
        delete toUpdate[key];
      }
    });

    const updatedProduct = await Product.update({ id, toUpdate });
    product = await Product.findProduct({ id });
    const resultProduct = getRequiredInfoFromProductData(product);

    return { resultProduct };
  }

  /** 상품 전체를 반환하는 함수
   *
   * @returns 상품 전체 Object List
   */
  static async getProductList({ userId, page, perPage }) {
    const resultList = await Product.findProductList({ page, perPage });

    resultList = await productsWithToggleInfo(userId, productList.resultList);

    return resultList;
  }

  /** 공구 상품 top 10을 반환하는 함수
   *
   * @returns 상품 전체 Object List
   */
  static async getProductTopList(userId) {
    const top = 10;
    const groupList = await Group.findProductSortByGroups();
    const products = await Product.findProductListNoPage();
    let resultList = [];
    for (let i = 0; i < groupList.length; i++) {
      for (let j = 0; j < products.length; j++) {
        if (groupList[i].id === products[j].id) {
          resultList.push(products[j]);
          delete products[j];
        }
      }
    }

    for (let i = 0; i < products.length; i++) {
      resultList.push(products[i]);
    }

    resultList = resultList.slice(0, top);

    resultList = await productsWithToggleInfo(userId, resultList);

    return resultList;
  }

  /** 카테고리별 상품을 반환하는 함수
   *
   * @returns 카테고리별 상품 Object List
   */
  static async getProductCategoryList({
    userId,
    category,
    option,
    page,
    perPage,
  }) {
    const productList = await Product.findProductCategoryList({
      category,
      option,
      page,
      perPage,
    });

    if (productList.len === 0) {
      const errorMessage = "해당 카테고리 상품이 존재하지 않습니다";
      return { errorMessage };
    }

    if (option === "groups") {
      const groupList = await Group.findProductSortByGroups();
      const productList = await Product.findProductSortByReviews({
        category,
        page,
        perPage,
      });
      let resultList = [];

      for (let i = 0; i < groupList.length; i++) {
        for (let j = 0; j < productList.resultList.length; j++) {
          if (groupList[i].id === productList.resultList[j].id) {
            resultList.push(productList.resultList[j]);
            delete productList.resultList[j];
          }
        }
      }

      for (let i = 0; i < productList.resultList.length; i++) {
        if (productList.resultList[i] !== undefined) {
          resultList.push(productList.resultList[i]);
        }
      }

      const totalPage = productList.totalPage;
      const len = productList.len;

      resultList = await productsWithToggleInfo(userId, productList.resultList);

      return { resultList, totalPage, len };
    } else if (option === "reviews") {
      const reviewList = await Post.findProductSortByReviews();
      let productList = await Product.findProductSortByReviews({
        category,
        page,
        perPage,
      });

      let resultList = [];

      for (let i = 0; i < reviewList.length; i++) {
        for (let j = 0; j < productList.resultList.length; j++) {
          if (reviewList[i].id === productList.resultList[j].id) {
            resultList.push(productList.resultList[j]);
            delete productList.resultList[j];
          }
        }
      }

      for (let i = 0; i < productList.resultList.length; i++) {
        if (productList.resultList[i] !== undefined) {
          resultList.push(productList.resultList[i]);
        }
      }
      const totalPage = productList.totalPage;
      const len = productList.len;

      resultList = await productsWithToggleInfo(userId, productList.resultList);

      return { resultList, totalPage, len };
    } else if (option === "views") {
      let resultList = await Product.findProductSortByViews({
        category,
        page,
        perPage,
      });
      let totalPage = resultList.totalPage;
      let len = resultList.len;
      resultList = await productsWithToggleInfo(userId, resultList.resultList);

      return { resultList, totalPage, len };
    } else if (option === "salePrice") {
      let resultList = await Product.findProductSortByPrice({
        category,
        page,
        perPage,
      });
      let totalPage = resultList.totalPage;
      let len = resultList.len;
      resultList = await productsWithToggleInfo(userId, resultList.resultList);

      return { resultList, totalPage, len };
    } else {
      const errorMessage = "존재하지 않는 옵션입니다.";
      return { errorMessage };
    }
  }

  /** 검색어로 상품을 반환하는 함수
   *
   * @returns 검색어 상품 Object List
   */
  static async getProductSearch({ search, page, perPage }) {
    let resultList = await Product.findProductSearch({
      search,
      page,
      perPage,
    });

    if (resultList.len === 0) {
      const errorMessage = "검색한 상품이 존재하지 않습니다";
      return { errorMessage };
    }

    resultList = await productsWithToggleInfo(userId, productList.resultList);

    return resultList;
  }

  /** 검색어 + 옵션별로 상품을 반환하는 함수
   *
   * optionField = ["salePrice", "reviews", "views", "likes"]
   * @returns 검색어 + 옵션 상품 Object List
   */
  static async getProductSearchSortByOption({
    search,
    option,
    page,
    perPage,
    userId,
  }) {
    // 검색어에 해당하는 상품이 존재하는지 확인
    const product = await Product.findProductSearch({ search, page, perPage });

    if (product.len === 0) {
      const errorMessage = "검색한 상품이 존재하지 않습니다";
      return { errorMessage };
    }

    if (option === "groups") {
      const reviewList = await Group.findProductSortByGroups();
      const productList = await Product.findProductSearchSortByGroups({
        search,
        page,
        perPage,
      });
      let resultList = [];

      for (let i = 0; i < reviewList.length; i++) {
        for (let j = 0; j < productList.resultList.length; j++) {
          if (reviewList[i].id === productList.resultList[j].id) {
            resultList.push(productList.resultList[j]);
            delete productList.resultList[j];
          }
        }
      }

      for (let i = 0; i < productList.resultList.length; i++) {
        if (productList.resultList[i] !== undefined) {
          resultList.push(productList.resultList[i]);
        }
      }

      const totalPage = productList.totalPage;
      const len = productList.len;

      resultList = await productsWithToggleInfo(userId, productList.resultList);

      return { resultList, totalPage, len };
    } else if (option === "reviews") {
      const reviewList = await Post.findProductSortByReviews();
      const productList = await Product.findProductSearchSortByReviews({
        search,
        page,
        perPage,
      });
      let resultList = [];

      for (let i = 0; i < reviewList.length; i++) {
        for (let j = 0; j < productList.resultList.length; j++) {
          if (reviewList[i].id === productList.resultList[j].id) {
            resultList.push(productList.resultList[j]);
            delete productList.resultList[j];
          }
        }
      }

      for (let i = 0; i < productList.resultList.length; i++) {
        if (productList.resultList[i] !== undefined) {
          resultList.push(productList.resultList[i]);
        }
      }

      const totalPage = productList.totalPage;
      const len = productList.len;

      resultList = await productsWithToggleInfo(userId, productList.resultList);

      return { resultList, totalPage, len };
    } else if (option === "views") {
      let resultList = await Product.findProductSearchSortByViews({
        search,
        page,
        perPage,
      });
      let totalPage = resultList.totalPage;
      let len = resultList.len;
      resultList = await productsWithToggleInfo(userId, resultList.resultList);
      return { resultList, totalPage, len };
    } else if (option === "salePrice") {
      let resultList = await Product.findProductSearchSortByPrice({
        search,
        page,
        perPage,
      });
      let totalPage = resultList.totalPage;
      let len = resultList.len;
      resultList = await productsWithToggleInfo(userId, resultList.resultList);

      return { resultList, totalPage, len };
    } else {
      const errorMessage = "존재하지 않는 옵션입니다.";
      return { errorMessage };
    }
  }

  /** 상품 id와 일치하는 상품을 조회하는 함수
   *
   * @param {Strings} id - 상품 id
   * @returns 상품 Object
   */
  static async getProduct({ id, userId }) {
    let product = await Product.findProduct({ id });

    if (!product) {
      const errorMessage = "해당 상품이 존재하지 않습니다.";
      return { errorMessage };
    }

    if (product.removed) {
      const errorMessage = "삭제된 상품입니다.";
      return { errorMessage };
    }

    const toUpdate = {
      views: product.views + 1,
    };

    await Product.update({ id, toUpdate });
    product = await Product.findProduct({ id });
    let resultProduct = getRequiredInfoFromProductData(product);

    const resultList = await productsWithToggleInfo(userId, [resultProduct]);

    return resultProduct;
  }

  /** 상품 id와 일치하는 상품을 삭제하는 함수
   *
   * @param {Strings} id - 상품 id
   * @returns 상품 Object
   */
  static async deleteProduct({ userId, id }) {
    const product = await Product.findProduct({ id });

    if (product.userId !== userId) {
      const errorMessage = "다른 유저의 상품을 삭제할 수 없습니다.";
      return { errorMessage };
    }

    const toUpdate = {
      removed: true,
    };

    await Product.update({ id, toUpdate });

    return product;
  }

  /** 유저가 파는 상품 리스트 반환하는 함수
   *
   * @param {Strings} userId - 유저 id
   * @returns 상품 Object
   */
  static async getUserProduct({ userId }) {
    let resultList = await Product.findUserProduct({ userId });

    resultList = await productsWithToggleInfo(userId, resultList);

    return { resultList };
  }
}

export { ProductService };
