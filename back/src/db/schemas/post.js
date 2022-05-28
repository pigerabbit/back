import mongoose from "mongoose";
const Schema = mongoose.Schema;
const model = mongoose.model;

const PostSchema = new Schema(
  {
    id: {
      type: String,
      unique: true,
      required: true,
    },
    type: {
      type: String,
      required: true,
    },
    authorizedUsers: {
      type: Array,
      required: true,
    },
    sender: {
      type: String,
      required: true,
    },
    receiver: {
      type: String,
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: false,
    },
    content: {
      type: String,
      required: true,
    },
    postImg: {
      type: String,
      required: false,
    },
    condition: {
      type: Boolean,
      required: false,
    },
    removed: {
      type: Boolean,
      required: false,
    }
  },
  {
    timestamps: true,
  }
);

const PostModel = model("Post", PostSchema);

export { PostModel };
