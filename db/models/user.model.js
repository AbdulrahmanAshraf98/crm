const mongoose = require("mongoose");
const validator = require("validator");
const { hash, validatePassword } = require("../../app/helper/crypt");
const { generateJwtToken } = require("../../app/helper/jwttoken");

const userSchema = mongoose.Schema(
	{
		fName: {
			type: String,
			trim: true,
			lowercase: true,
			minLength: 5,
			maxLength: 20,
			required: true,
		},
		lName: {
			type: String,
			trim: true,
			lowercase: true,
			minLength: 5,
			maxLength: 20,
			required: true,
		},
		age: {
			type: Number,
			min: 18,
			default: 18,
		},
		email: {
			type: String,
			required: true,
			validate: function () {
				if (!validator.isEmail(this.email)) throw new Error("Invalid email");
			},
		},
		password: {
			type: String,
			lower: true,
			trim: true,
			required: true,
		},
		Phone: [
			{
				type: String,
				validate(value) {
					if (!validator.isMobilePhone(value, "ar-EG"))
						throw new Error("invalid number");
				},
			},
		],
		gender: {
			type: String,
			trim: true,
			lowercase: true,
			enum: ["male", "female"],
		},
		dOfBirth: {
			type: Date,
		},
		tokens: [
			{
				token: { type: String, required: true },
			},
		],
		role: {
			type: mongoose.Schema.Types.ObjectId,
		},
	},
	{
		timestamps: true,
	},
);

userSchema.pre("save", async function () {
	if (!this.isModified("password")) {
		this.password = await hash(this.password, 10);
	}
});
userSchema.statics.loginUser = async (email, password) => {
	const user = User.findOne({ email });
	if (!user) return new Error("invalid Email");
	if (!validatePassword(password, user.password))
		throw new Error("invalid password");
	return user;
};

userSchema.methods.generateToken = async function () {
	const user = this;
	const token = generateJwtToken({ _id: user._id });
	user.tokens.push(token);
	await user.save();
	return token;
};

userSchema.methods.toJSON = function () {
	const data = this.toObject();
	delete data.password;
	// delete data.tokens
	return data;
};

const User = mongoose.model("User", userSchema);

module.exports = User;
