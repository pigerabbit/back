import crypto from "crypto";
import { UserModel } from "../schemas/user";

export class User {
  static async create({ newUser }) {
    const createdNewUser = await UserModel.create(newUser);
    return createdNewUser;
  }

  static async isEmailExists({ email, type }) {
    return await UserModel.findOne({ email, type });
  }

  // static async findByEmail({ email, type }) {
  //   const user = await UserModel.findOne({ email, type });
  //   return user;
  // }

  static async findByEmail({ email }) {
    const user = await UserModel.findOne({ email });
    return user;
  }

  static async findAll() {
    //회원탈퇴한 유저는 제외
    const users = await UserModel.find(
      { deleted: false },
      {
        _id: false,
        id: true,
        name: true,
        email: true,
        address: true,
        businessName: true,
        type: true,
      }
    );
    return users;
  }

  static async findById({ userId }) {
    const user = await UserModel.findOne({ id: userId }).lean();
    return user;
  }

  static async updateAll({ userId, setter }) {
    const updatedUser = await UserModel.findOneAndUpdate(
      { id: userId },
      { $set: setter },
      { returnOriginal: false }
    );
    return updatedUser;
  }

  static async findByName({ name }) {
    const user = await UserModel.findOne({ name });
    return user;
  }

  static async findByBusinessName({ businessName }) {
    const businessNameList = await UserModel.find({
      business: {
        $elemMatch: {
          businessName: businessName,
        },
      },
    });

    return businessNameList;
  }

  /** 유저의 alert 목록을 보는 함수
   *
   * @param {String} userId - 유저 id
   * @returns alertList
   * db.articles.find( { $and : [ { title : A }, { writer : "Alpha" } ] } )
   */
  static async getAlertList({ userId }) {
    const alertList = await UserModel.find(
      {
        id: userId,
      },
      { alertList: 1, _id: 0 }
    )
      .sort({ createdAt: -1 })
      .lean();
    return alertList;
  }

  /** sendId로 알림 삭제 함수
   *
   * @param {String} sendId - 알림을 보낸 위치
   * @returns deleteAlert
   */
  static async deleteAlertList({ alertId }) {
    const deleteAlert = await UserModel.updateOne(
      { "alertList.alertId": alertId },
      { $set: { "alertList.$.removed": true } }
    );

    return deleteAlert;
  }

  /** postId로 알림 삭제 함수
   *
   * @param {String} sendId - 알림을 보낸 위치
   * @returns deleteAlert
   */
  static async deleteAlertListByPostId({ postId }) { 
    const deleteAlert = await UserModel.updateOne(
      { "alertList.postId": postId },
      { $set: { "alertList.$.removed": true } }
    );

    return deleteAlert;
  }

  /** 알림 업데이트 함수
   *
   * @param {String} userId - 알림을 업데이트할 유저 id
   * @param {String} from - post / product / group
   * @param {String} sendId - 알림을 보낸 위치
   * @param {String} content - 알림 내용
   */
  static async updateAlert({
    userId,
    from,
    productId,
    sendId,
    postId,
    image,
    type,
    groupName,
    content,
    seller,
  }) {
    const alertId = crypto.randomUUID();
    const newAlert = {
      alertId,
      from,
      productId,
      sendId,
      postId,
      image,
      type,
      groupName,
      content,
      removed: false,
      seller,
    };
    const updateAlert = await UserModel.findOneAndUpdate(
      { id: userId },
      {
        $set: {
          alertsExist: true,
        },
        $push: {
          alertList: newAlert,
        },
      }
    )
      .sort({ createdAt: -1 })
      .lean();

    return updateAlert;
  }
}
