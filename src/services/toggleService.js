import { Toggle } from "../db";
import crypto from "crypto";
import { ToggleModel } from "../db/schemas/toggle";

class toggleService {
  static async addToggle({ userId }) {
    const existToggleInfo = await Toggle.findByUserId({ userId });
    if (existToggleInfo) {
      const errorMessage = "user_id에 대한 toggleInfo가 이미 존재합니다.";
      return { errorMessage };
    }

    const toggleId = crypto.randomUUID();

    const newUser = { userId, toggleId };
    const toggleInfo = await Toggle.create({ newUser });

    return toggleInfo;
  }

  static async setToggleGroup({ userId, toUpdate }) {
    let toggleInfo = await Toggle.findByUserId({ userId });

    if (!toggleInfo) {
      const errorMessage =
        "정보가 없습니다. user_id 값을 다시 한 번 확인해 주세요.";
      return { errorMessage };
    }

    let groupsInfo = toggleInfo.groups;
    let newValue = {};
    const index = groupsInfo.findIndex((f) => f == toUpdate.objectId);

    if (index > -1) {
      groupsInfo.splice(index, 1);
    } else {
      groupsInfo.push(toUpdate.objectId);
    }
    newValue = groupsInfo;
    const updatedToggle = await ToggleModel.findOneAndUpdate(
      { userId },
      { $set: { groups: newValue } },
      { returnOriginal: false }
    );

    return updatedToggle;
  }

  static async setToggleProduct({ userId, toUpdate }) {
    let toggleInfo = await Toggle.findByUserId({ userId });

    if (!toggleInfo) {
      const errorMessage =
        "정보가 없습니다. user_id 값을 다시 한 번 확인해 주세요.";
      return { errorMessage };
    }

    let productsInfo = toggleInfo.products;
    let newValue = {};
    const index = productsInfo.findIndex((f) => f == toUpdate.objectId);
    if (index > -1) {
      productsInfo.splice(index, 1);
    } else {
      productsInfo.push(toUpdate.objectId);
    }
    newValue = productsInfo;
    const updatedToggle = await ToggleModel.findOneAndUpdate(
      { userId },
      { $set: { products: newValue } },
      { returnOriginal: false }
    );

    return updatedToggle;
  }

  static async setToggleSearchWord({ userId, toUpdate }) {
    let toggleInfo = await Toggle.findByUserId({ userId });

    if (!toggleInfo) {
      const errorMessage =
        "정보가 없습니다. user_id 값을 다시 한 번 확인해 주세요.";
      return { errorMessage };
    }

    let searchWordsInfo = toggleInfo.searchWords;
    let newValue = {};
    const index = searchWordsInfo.findIndex((f) => f === toUpdate.searchWord);
    if (index > -1) {
      searchWordsInfo.splice(index, 1);
      searchWordsInfo.push(toUpdate.searchWord);
    } else {
      searchWordsInfo.push(toUpdate.searchWord);
    }
    newValue = searchWordsInfo;
    const updatedToggle = await ToggleModel.findOneAndUpdate(
      { userId },
      { $set: { searchWords: newValue } },
      { returnOriginal: false }
    );

    return updatedToggle;
  }

  static async deleteToggleSearchWord({ userId, searchWord }) {
    let toggleInfo = await Toggle.findByUserId({ userId });

    if (!toggleInfo) {
      const errorMessage =
        "정보가 없습니다. user_id 값을 다시 한 번 확인해 주세요.";
      return { errorMessage };
    }

    let searchWordsInfo = toggleInfo.searchWords;
    let newValue = {};
    const index = searchWordsInfo.findIndex((f) => f === searchWord);
    if (index > -1) {
      searchWordsInfo.splice(index, 1);
    } else {
      searchWordsInfo.push(searchWord);
    }
    newValue = searchWordsInfo;
    const updatedToggle = await ToggleModel.findOneAndUpdate(
      { userId },
      { $set: { searchWords: newValue } },
      { returnOriginal: false }
    );

    return updatedToggle;
  }

  static async setToggleViewedProducts({ userId, objectId }) {
    let toggleInfo = await Toggle.findByUserId({ userId });
    if (!toggleInfo) {
      const errorMessage =
        "정보가 없습니다. user_id 값을 다시 한 번 확인해 주세요.";
      return { errorMessage };
    }

    let viewedProductsInfo = toggleInfo.viewedProducts;
    let newValue = {};
    let index = viewedProductsInfo.findIndex((f) => {
      return f.toString() === objectId.toString();
    });

    if (index > -1) {
      // [사과, 배, 감] => (1) [사과, 배, 감, 딸기] (2) [배, 감, 사과]
      viewedProductsInfo.splice(index, 1);
      viewedProductsInfo.push(objectId);
    } else {
      viewedProductsInfo.push(objectId);
    }

    newValue = viewedProductsInfo;
    const updatedToggle = await ToggleModel.findOneAndUpdate(
      { userId },
      { $set: { viewedProducts: newValue } },
      { returnOriginal: false }
    );

    return updatedToggle;
  }

  static async getToggleGroup({ userId }) {
    const toggleInfo = await Toggle.findByUserIdWithPopulateGroup({ userId });
    if (!toggleInfo) {
      const errorMessage = "userId에 대한 toggleInfo가 존재하지 않습니다.";
      return { errorMessage };
    }

    const toggleGroups = toggleInfo.groups;

    return toggleGroups;
  }

  static async getToggleProduct({ userId }) {
    const toggleInfo = await Toggle.findByUserIdWithPopulateProduct({ userId });
    if (!toggleInfo) {
      const errorMessage = "userId에 대한 toggleInfo가 존재하지 않습니다.";
      return { errorMessage };
    }

    const toggleProducts = toggleInfo.products;

    return toggleProducts;
  }

  static async getToggleSearchWords({ userId }) {
    const toggleInfo = await Toggle.findByUserId({ userId });
    if (!toggleInfo) {
      const errorMessage = "userId에 대한 toggleInfo가 존재하지 않습니다.";
      return { errorMessage };
    }

    const toggleSearchWords = toggleInfo.searchWords;

    return toggleSearchWords;
  }

  static async getToggleViewedProducts({ userId }) {
    const veiwedProductsInfo = await Toggle.findVeiwedProductsInfoByUserId({
      userId,
    });
    if (!veiwedProductsInfo) {
      const errorMessage = "userId에 대한 toggleInfo가 존재하지 않습니다.";
      return { errorMessage };
    }

    return veiwedProductsInfo;
  }
}

export { toggleService };
