import { Schema, model } from "mongoose";
import { stringify } from "uuid";

const alertSchema = new Schema(
  {
    from: {
      type: String,
      required: true,
    },
    sendId: {
      type: String,
      required: true,
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
    coordinates: [],
    required: false,
  },
  placeUrl: {
    type: String,
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
      coordinates: [],
    },
    distance: {
      type: Number,
      required: false,
    },
    address: {
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
  },
  {
    timestamps: true,
  }
);

const UserModel = model("User", UserSchema);

export { UserModel };
