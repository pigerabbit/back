import { ToggleModel } from "../schemas/toggle.js";

class Toggle {
  static async findByUserId({ userId }) {
    const toggleInfo = await ToggleModel.findOne({ userId });
    return toggleInfo;
  }

  static async create({ newUser }) {
    const toggleInfo = await ToggleModel.create(newUser);
    return toggleInfo;
  }

  static async findVeiwedProductsInfoByUserId({ userId }) {
    const list = await ToggleModel.findOne({
      userId,
    }).populate("viewedProducts");
    const viewedProducts = list.viewedProducts.reverse();
    return viewedProducts;
  }

  static async findByUserIdWithPopulateGroup({ userId }) {
    const toggleInfo = await ToggleModel.findOne({ userId }).populate({
      path: "groups",
      populate: { path: "productInfo" },
    });

    return toggleInfo;
  }

  static async findByUserIdWithPopulateProduct({ userId }) {
    const toggleInfo = await ToggleModel.findOne({ userId }).populate(
      "products"
    );
    return toggleInfo;
  }
}

export { Toggle };
