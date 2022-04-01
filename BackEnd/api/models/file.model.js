
module.exports = (mongoose) => {
  const fileSchema = new mongoose.Schema(
    {
      _id: {
        type: String,
        required: true,
        unique: true,
      },
      size: {
        type: Number,
        default: 0
      },
      name: {
        type: String,
        required: true,
      },
      contents: [{type: mongoose.Schema.Types.ObjectId, ref: "Contents"}],

      owner: [String],
      createdAt: {
        type: Number,
        required: true,
      },
    },
    { versionKey: false }
  );

  const Files = mongoose.model("Files", fileSchema);
  return Files;
};
