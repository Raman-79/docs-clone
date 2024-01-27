import { Schema, model } from "mongoose"

const DocumentModel = new Schema({
  _id: {
    type:String,
  },
  data: Object,
})

export default model("Document", DocumentModel);
