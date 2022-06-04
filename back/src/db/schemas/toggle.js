import { Schema, model } from "mongoose";

const ToggleSchema = new Schema({
  toggleId: {
    type: String,
    required: true,
  },
  userId: {
    type: String,
    required: true,
  },
  groups: {
    type: [String],
  },
  products: {
    type: [String],
  },
  searchWords: {
    type: [String],
  },
  deleted: {
    type: Boolean,
    default: false,
  },
});

const ToggleModel = model("Toggle", ToggleSchema);

export { ToggleModel };
