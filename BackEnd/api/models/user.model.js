// create a new user schema
module.exports = (mongoose) => {
  // create a new schema for the user model
  const userSchema = new mongoose.Schema(
    {
      // username will be the user's email address
      username: {
        type: String, 
        required: true, 
        unique: true, 
      },
      password: {
        type: String, 
        required: true, 
      },
    },
    { versionKey: false }
  );

  // create a new user model
  const Users = mongoose.model("Users", userSchema);
  return Users;
};
