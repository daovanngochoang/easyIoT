

module.exports = (mongoose) => {
    

    const folderSchema = new mongoose.Schema({
        _id: {
            type: String,
            required: true,
            unique: true,
        },
        name: {
            type: String,
            required: true
        },
        quantity: {
            type: Number,
            default: 0
        },
        owner: [String],
        size : {
            type: Number,
            default: 0
        },
        files: [
            {
                type: String,
                ref : 'Files'
            }],
        createdAt: {
            type: Number,
            required: true,
          },
        },
        { versionKey: false },
        
    );
    

    const Folder = mongoose.model("Folders", folderSchema);
    return Folder;
}


