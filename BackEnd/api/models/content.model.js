

// create a new user schema
module.exports = (mongoose) => {
  // create a new schema for the user model
  const contentSchema = new mongoose.Schema(
    {
      _id: mongoose.Schema.Types.ObjectId,
      date: {
        type : Number,
        required: true
      },
      body: {
        type: String,
        required: true,
      },
      type: {
        type: String, 
        required: true},
    },
    { versionKey: false }
  );


  // create a new user model
  const Content = mongoose.model("Contents", contentSchema);
  return Content;
};
