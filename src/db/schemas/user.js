import { Schema, model } from "mongoose";
import { stringify } from "uuid";

const alertSchema = new Schema(
  {
    alertId: {
      type: String,
      required: true,
    },
    from: {
      type: String,
      required: true,
    },
    productId: {
      type: String,
      required: true,
    },
    sendId: {
      type: String,
      required: true,
    },
    postId: {
      type: String,
      required: false,
    },
    image: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      required: true,
    },
    groupName: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    seller: {
      type: Boolean,
      required: true,
      default: false,
    },
    removed: {
      type: Boolean,
      required: true,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const businessSchema = new Schema({
  businessName: {
    type: String,
    required: true,
    unique: true,
  },
  ownerName: {
    type: String,
    required: true,
  },
  businessLocation: {
    type: String,
    required: true,
  },
  locationXY: {
    type: { type: String },
    coordinates: [Number],
    required: false,
  },
});

const UserSchema = new Schema(
  {
    id: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
      unique: true,
    },
    email: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    locationXY: {
      type: {
        type: String,
        default: "Point",
      },
      coordinates: [Number],
    },
    distance: {
      type: Number,
      required: false,
    },
    address: {
      type: String,
      required: true,
    },
    phoneNumber: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      required: false,
    },
    seller: {
      type: Boolean,
      required: true,
      default: false,
    },
    business: [businessSchema],
    imageLink: {
      type: String,
      required: false,
      default:
        "https://bobpullbucket.s3.ap-northeast-2.amazonaws.com/default-rabbit.jpg",
    },
    reportedBy: {
      type: [String],
      required: false,
    },
    deleted: {
      type: Boolean,
      required: false,
      default: false,
    },
    alertList: [alertSchema],
    alertsExist: {
      type: Boolean,
      default: false,
    },
    viewAlertTime: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

const UserModel = model("User", UserSchema);

export { UserModel };
