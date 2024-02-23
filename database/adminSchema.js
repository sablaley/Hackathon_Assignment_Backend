const mongoose = require('mongoose')
const validator = require('validator');
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const keysecret = "yogitasabale"

const adminSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        unique: true,
        uniqueCaseInsensitive: true,
        required: true,
        validate(value) {
            if (!validator.isEmail) {
                throw new Error('not valid email')
            }
        }

    },
    password: {
        type: String,
        required: true,
        trim: true,
        minlength: 6
    },
    rpassword: {
        type: String,
        required: true,
        trim: true,
        minlength: 6
    },
    tokens: [
        {
            token: {
                type: String,
                required: true
            }
        }
    ]
})

//hash password
adminSchema.pre("save", async function (next) {
    if (this.isModified("password")) {
        this.password = await bcrypt.hash(this.password, 12)
        this.rpassword = await bcrypt.hash(this.rpassword, 12)
    }
    next()
})

//generate auth token
adminSchema.methods.generateAuthToken = async function () {
    try {
        let token23 = jwt.sign({ _id: this.id }, keysecret, { expiresIn: "1d" })
        this.tokens = this.tokens.concat({ token: token23 })
        await this.save()
        return token23;
    }
    catch (error) {
    //     res.status(422).json({ msg: error })
    }
}

//create model
module.exports = mongoose.model("admin_users", adminSchema);