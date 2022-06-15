import { Group, Product, User } from "../db";
import crypto from "crypto";
import { GroupModel } from "../db/schemas/group";
import { nowDate } from "../utils/date-calculator.js";
import { ToggleModel } from "../db/schemas/toggle.js";
import { withToggleInfo } from "../utils/withToggleInfo";
import { addressToXY } from "../utils/addressToXY.js";

export class groupService {
  static async addGroup({
    userId,
    groupType,
    groupName,
    location,
    productId,
    deadline,
    quantity,
  }) {
    const groupId = crypto.randomUUID();
    const participantId = crypto.randomUUID();
    const { minPurchaseQty } = await Product.findProduct({ id: productId });
    const remainedPersonnel = minPurchaseQty - quantity;
    const product = await Product.findProduct({ id: productId });
    const productInfo = product._id;
    let state = 0;
    
    if (remainedPersonnel < 0) {
      const errorMessage = "구매할 수 있는 양을 초과하였습니다.";
      return { errorMessage };
    }

    if (remainedPersonnel === 0) { 
      state = 1;
    }

    const coordinates = await addressToXY(location);
    
    const participants = {
      participantId: participantId,
      userId: userId,
      participantDate: nowDate(),
      quantity: quantity,
      payment: false,
      complete: false,
      manager: true,
      review: false,
    };

    const newGroup = {
      productInfo,
      groupId,
      groupName,
      groupType,
      location,
      locationXY: {
        type: "Point",
        coordinates: coordinates,
      },
      deadline,
      participants,
      productId,
      state,
      remainedPersonnel,
    };

    const createdNewGroup = await Group.create({ newGroup });

    return createdNewGroup;
  }

  static async setQuantity({ groupId, userId, quantity }) {
    let groupInfo = await Group.findByGroupId({ groupId });

    if (!groupInfo) {
      const errorMessage =
        "정보가 없습니다. groupId 값을 다시 한 번 확인해 주세요.";
      return { errorMessage };
    }

    let participantsInfo = groupInfo.participants;
    let newValue = {};
    let priorQuantity = 0;

    const index = participantsInfo.findIndex((f) => f.userId === userId);

    if (index > -1) {
      priorQuantity = participantsInfo[index].quantity;
      participantsInfo[index]["quantity"] = quantity;
    } else {
      const errorMessage =
        "참여중인 공동구매가 아닙니다. groupId 값을 다시 한 번 확인해 주세요.";
      return { errorMessage };
    }

    const updatedRemainedPersonnel =
      groupInfo.remainedPersonnel + priorQuantity - quantity;

    if (updatedRemainedPersonnel < 0) {
      const errorMessage = "구매할 수 있는 양을 초과하였습니다.";
      return { errorMessage };
    }

    let state;
    if (updatedRemainedPersonnel === 0) {
      state = 1;
    } else { 
      state = groupInfo.state;
    }

    newValue = participantsInfo;

    const updatedParticipants = await GroupModel.findOneAndUpdate(
      { groupId },
      {
        $set: {
          participants: newValue,
          remainedPersonnel: updatedRemainedPersonnel,
          state,
        },
      },
      { returnOriginal: false }
    );

    return updatedParticipants;
  }

  static async setPayment({ groupId, userId, payment }) {
    let groupInfo = await Group.findByGroupId({ groupId });

    if (!groupInfo) {
      const errorMessage =
        "정보가 없습니다. groupId 값을 다시 한 번 확인해 주세요.";
      return { errorMessage };
    }

    let participantsInfo = groupInfo.participants;
    let newValue = {};

    const index = participantsInfo.findIndex((f) => f.userId === userId);

    if (index > -1) {
      participantsInfo[index]["payment"] = payment;
    } else {
      const errorMessage =
        "참여중인 공동구매가 아닙니다. groupId 값을 다시 한 번 확인해 주세요.";
      return { errorMessage };
    }
    newValue = participantsInfo;
    const updatedParticipants = await GroupModel.findOneAndUpdate(
      { groupId },
      { $set: { participants: newValue } },
      { returnOriginal: false }
    );

    return updatedParticipants;
  }

  static async getParticipants({ groupId }) {
    const groupInfo = await Group.findByGroupId({ groupId });
    if (!groupInfo) {
      const errorMessage = "groupId에 대한 groupInfo가 존재하지 않습니다.";
      return { errorMessage };
    }

    const participants = groupInfo.participants;

    return participants;
  }

  static async getNotPaid({ groupId }) {
    const groupInfo = await Group.findByGroupId({ groupId });
    if (!groupInfo) {
      const errorMessage = "groupId에 대한 groupInfo가 존재하지 않습니다.";
      return { errorMessage };
    }

    const notPaid = groupInfo.notPaid;

    return notPaid;
  }

  static async setGroup({ groupId, toUpdate }) {
    let group = await Group.findByGroupId({ groupId });

    if (!group) {
      const errorMessage = "그룹 아이디를 다시 한 번 확인해 주세요.";
      return { errorMessage };
    }
    let content = "";
    if (toUpdate.state !== null) {
      switch (toUpdate.state) {
        case "1":
          console.log("case 1");
          content = "공구 인원이 달성되었습니다. 결제를 시작합니다.";
          break;
        case "-1":
          content = "기간이 마감되어 공동구매가 취소되었습니다.";
          break;
        case "3":
          content = "결제가 완료되었습니다. 배송이 곧 시작됩니다.";
          break;
        case "-3":
          content = "결제가 실패되었습니다. 다시 한 번 확인해 주세요.";
          break;
        case "4":
          content = "배송이 시작되었습니다.";
          break;
        case "-4":
          content = "배송 곧 시작될 예정입니다.";
          break;
        case "5":
          content = "배송이 완료되었습니다.";
          break;
        case "-6":
          content = "공동구매 개최자의 중단으로 공동구매가 취소되었습니다.";
          break;
      }
      group.participants.map(async (v) => {
        await User.updateAlert({
          userId: v.userId,
          from: "group",
          sendId: groupId,
          image: group.productInfo.images,
          type: group.groupType,
          groupName: group.groupName,
          content: content,
        });
      });
    }

    const updatedGroup = await Group.updateAll({ groupId, setter: toUpdate });
    return updatedGroup;
  }

  static async getGroupInfo({ userId, groupId }) {
    const group = await Group.findByGroupId({ groupId });

    // db에서 찾지 못한 경우, 에러 메시지 반환
    if (!group) {
      const errorMessage =
        "해당 그룹은 생성 내역이 없습니다. 다시 한 번 확인해 주세요.";
      return { errorMessage };
    }

    const toggleInfo = await ToggleModel.findOne({ userId });

    if (!toggleInfo) {
      const errorMessage =
        "userId에 대한 토글 데이터가 없습니다. 다시 한 번 확인해 주세요.";
      return { errorMessage };
    }

    return withToggleInfo(toggleInfo.groups, [group]);
  }

  static async getGroupByProductId({ userId, productId, state }) {
    let groups;
    if (state !== null) {
      groups = await Group.findCompletedPostByProductId({ productId, state });
    } else {
      groups = await Group.findAllByProductId({ productId });
    }

    const toggleInfo = await ToggleModel.findOne({ userId });

    if (!toggleInfo) {
      const errorMessage =
        "userId에 대한 토글 데이터가 없습니다. 다시 한 번 확인해 주세요.";
      return { errorMessage };
    }

    return withToggleInfo(toggleInfo.groups, groups);
  }

  static async getNumberInfoByGroupId({ groupId }) {
    const group = await Group.findByGroupId({ groupId });

    // db에서 찾지 못한 경우, 에러 메시지 반환
    if (!group) {
      const errorMessage =
        "해당 그룹은 생성 내역이 없습니다. 다시 한 번 확인해 주세요.";
      return { errorMessage };
    }
    console.log("group:", group);
    const productId = group.productId;

    const product = await Product.findProduct({ id: productId });
    console.log("product:", product);

    const participants = group.participants;
    const numberOfParticipants = participants.length;
    const minPurchaseQty = product.minPurchaseQty;
    const maxPurchaseQty = product.maxPurchaseQty;

    const info = {
      numberOfParticipants,
      minPurchaseQty,
      maxPurchaseQty,
    };

    return info;
  }

  static async getListbyBoolean({ userId, boolean }) {
    const groups = await Group.findAllbyBoolean({ userId, boolean });

    if (!groups) {
      const errorMessage = "아이디를 다시 한 번 확인해 주세요.";
      return { errorMessage };
    }

    const toggleInfo = await ToggleModel.findOne({ userId });

    if (!toggleInfo) {
      const errorMessage =
        "userId에 대한 토글 데이터가 없습니다. 다시 한 번 확인해 주세요.";
      return { errorMessage };
    }

    return withToggleInfo(toggleInfo.groups, groups);
  }

  static async addParticipants({ userId, groupId, quantity }) {
    const groupInfo = await Group.findByGroupId({ groupId });

    if (!groupInfo) {
      const errorMessage = "groupId에 대한 groupInfo가 존재하지 않습니다.";
      return { errorMessage };
    }

    let participantsInfo = groupInfo.participants;
    let newValue = {};

    const index = participantsInfo.findIndex((f) => f.userId === userId);

    if (index > -1) {
      const errorMessage = "이미 공동구매에 참여하고 있는 상태입니다.";
      return { errorMessage };
    } else {
      const participantId = crypto.randomUUID();
      const participant = {
        participantId: participantId,
        userId: userId,
        participantDate: nowDate(),
        quantity: quantity,
        payment: false,
        complete: false,
        manager: false,
        review: false,
      };

      participantsInfo.push(participant);
    }

    const updatedRemainedPersonnel = groupInfo.remainedPersonnel - quantity;

    if (updatedRemainedPersonnel < 0) {
      const errorMessage = "구매할 수 있는 양을 초과하였습니다.";
      return { errorMessage };
    }
    
    let state;
    if (updatedRemainedPersonnel === 0) { 
      state = 1;
    }

    newValue = participantsInfo;
    const updatedParticipants = await GroupModel.findOneAndUpdate(
      { groupId },
      {
        $set: {
          participants: newValue,
          remainedPersonnel: updatedRemainedPersonnel,
          state,
        },
      },
      { returnOriginal: false }
    );

    return updatedParticipants;
  }

  static async deleteParticipant({ userId, groupId }) {
    const groupInfo = await Group.findByGroupId({ groupId });

    if (!groupInfo) {
      const errorMessage = "groupId에 대한 groupInfo가 존재하지 않습니다.";
      return { errorMessage };
    }

    let participantsInfo = groupInfo.participants;
    let newValue = {};
    let updatedRemainedPersonnel;
    const index = participantsInfo.findIndex((f) => f.userId === userId);

    if (index > -1) {
      // 배열에서 index의 원소를 제거
      if (participantsInfo[index].manager === true) {
        await GroupModel.findOneAndUpdate(
          { groupId },
          { $set: { state: "-6" } },
          { returnOriginal: false }
        );
      }
      updatedRemainedPersonnel =
        groupInfo.remainedPersonnel + participantsInfo[index].quantity;

      participantsInfo.splice(index, 1);
    } else {
      const errorMessage = "이미 공동구매 참여자가 아닙니다.";
      return { errorMessage };
    }

    newValue = participantsInfo;
    const updatedParticipants = await GroupModel.findOneAndUpdate(
      { groupId },
      {
        $set: {
          participants: newValue,
          remainedPersonnel: updatedRemainedPersonnel,
        },
      },
      { returnOriginal: false }
    );

    return updatedParticipants;
  }

  static async getStateInfo({ groupId, userId }) {
    const groupInfo = await Group.findByGroupId({ groupId });

    if (!groupInfo) {
      const errorMessage = "groupId에 대한 groupInfo가 존재하지 않습니다.";
      return { errorMessage };
    }

    let participantsInfo = groupInfo.participants;
    const index = participantsInfo.findIndex((f) => f.userId === userId);

    let stateInfo = {};
    if (index > -1) {
      stateInfo = {
        state: groupInfo.state,
        payment: participantsInfo[index].payment,
      };
    } else {
      stateInfo = { state: -6 };
    }

    return stateInfo;
  }

  static async checkState({ groupId }) {
    const groupInfo = await Group.findByGroupId({ groupId });

    if (!groupInfo) {
      const errorMessage = "groupId에 대한 groupInfo가 존재하지 않습니다.";
      return { errorMessage };
    }

    const checkState = groupInfo.state;

    if (checkState < 0) {
      const errorMessage = "가뭄이 들은 당근밭입니다.";
      throw new Error(errorMessage);
    }

    return checkState;
  }

  static async getSortedGroupsByRemainedTimeInfo(userId) {
    const groups = await Group.findSortedGroupsByRemainedTimeInfo();

    const toggleInfo = await ToggleModel.findOne({ userId });

    if (!toggleInfo) {
      const errorMessage =
        "userId에 대한 토글 데이터가 없습니다. 다시 한 번 확인해 주세요.";
      return { errorMessage };
    }

    return withToggleInfo(toggleInfo.groups, groups);
  }

  static async getSortedGroupsByRemainedPersonnelInfo(userId) {
    const groups = await Group.findSortedGroupsByRemainedPersonnelInfo();

    const toggleInfo = await ToggleModel.findOne({ userId });

    if (!toggleInfo) {
      const errorMessage =
        "userId에 대한 토글 데이터가 없습니다. 다시 한 번 확인해 주세요.";
      return { errorMessage };
    }

    return withToggleInfo(toggleInfo.groups, groups);

    return groups;
  }

  /** 상품이 삭제되면 공구에 참여 중인 유저에게 알림이 가는 함수
   *
   * @param {String} id - productId
   * @param {Object} product - 삭제되는 상품 정보
   */
  static async deleteProduct({ id, product }) {
    const participants = await Group.findParticipantsByProductId({
      productId: id,
    });

    const deletedProductGroupList = await Group.findAllByProductId({
      productId: id,
    });

    deletedProductGroupList.map(async (v) => {
      await GroupModel.findOneAndUpdate(
        { groupId: v.groupId },
        { $set: { state: "-7" } }, // 판매자의 상품 삭제 state는 -7
        { returnOriginal: false }
      );
    });

    participants.map((v) => {
      const firstList = v;
      firstList.map(async (v) => {
        await User.updateAlert({
          userId: v.userId,
          from: "group",
          sendId: product.id,
          image: product.images,
          type: v.groupType,
          groupName: v.groupName,
          content: `판매자의 판매 중단으로 공동구매가 취소되었습니다.`,
        });
      });
    });
  }

  static async deleteGroup({ userId, groupId }) {
    const groupInfo = await Group.findByGroupId({ groupId });

    if (!groupInfo) {
      const errorMessage = "groupId에 대한 groupInfo가 존재하지 않습니다.";
      return { errorMessage };
    }
    const productId = groupInfo.productId;
    const productInfo = await Product.findProduct({ id: productId });
    const sellerId = productInfo.userId;

    if (sellerId !== userId) {
      const errorMessage = "판매자가 아닙니다.";
      return { errorMessage };
    }

    const updatedGroup = await GroupModel.findOneAndUpdate(
      { groupId },
      { $set: { state: "-7" } },
      { returnOriginal: false }
    );

    return updatedGroup;
  }

  static async findNearGroupList({ userId }) {
    const perPage = 3;
    const user = await User.findById({ userId });
    const len = await GroupModel.countDocuments({
      delete: false,
      state: 0,
    });
    console.log("len =====>", len);

    // 랜덤 페이지 생성 (최댓값 포함 X)
    const page = Math.floor(Math.random() * (len - 1)) + 1;
    console.log("page =====>", page);
    console.log("x =====>", parseFloat(user.locationXY.coordinates[0]));
    console.log("x =====>", parseFloat(user.locationXY.coordinates[0]));
    
    const groupList = await GroupModel.aggregate([
      {
        $geoNear: {
          spherical: true,
          maxDistance: 50000, // 5km 이내의 공구
          near: {
            type: "Point",
            coordinates: [
              parseFloat(user.locationXY.coordinates[0]),
              parseFloat(user.locationXY.coordinates[1]),
            ],
          },
          distanceField: "distance",
          query: { state: 0, groupType: "local" },
        },
      },
      { '$sort': { 'createdAt': -1 } },
      {
        '$facet': {
          data: [{ $skip: (page - 1) * perPage }, { $limit: perPage }] 
        }
      }
    ]);
    
    return groupList;
  }
}