const UserModel = require("../../db/models/user.model");
const { validatePassword } = require("../helper/crypt.helper");
const sendEmail = require("../helper/email.helper");
const Helper = require("../helper/helper");
const ModelHelper = require("../helper/model.helper");
class MeController {
	static me = Helper.catchAsyncError((req, res, next) => {
		Helper.resHandler(res, 200, true, req.user, "user fetched");
	});

	static changePassword = Helper.catchAsyncError(async (req, res, next) => {
		if (req.body.password == req.body.newPassword)
			throw new Error("old password and new the same");
		const user = await ModelHelper.findOne(UserModel, { _id: req.user._id });
		if (!user) throw new AppError("there no user with this email ");
		const validPassword = await validatePassword(
			req.body.password,
			user.password,
		);
		if (!validPassword) throw new Error("invalid password");
		user.password = req.body.newPassword;
		await user.save();
		await sendEmail({
			email: user.email,
			subject: "Your password Is changed",
			text: `Your password Is changed`,
		});
		Helper.resHandler(res, 200, true, currentUser, "user password updated");
	});
	static changeEmail = Helper.catchAsyncError(async (req, res, next) => {
		const user = await ModelHelper.findOne(UserModel, { _id: req.user._id });
		if (!user) throw new AppError("there no user with this email ");
		const validPassword = await validatePassword(
			req.body.password,
			user.password,
		);
		if (!validPassword) throw new Error("invalid password");
		user.email = req.body.email;
		await user.save();
		await sendEmail({
			email: user.email,
			subject: "Your Email Is changed",
			text: `/${user._id}/active`,
		});

		Helper.resHandler(res, 200, true, currentUser, "user Email updated");
	});
	static updateMe = Helper.catchAsyncError(async (req, res, next) => {
		delete req.body.role;
		if (req.body.password)
			throw new Error("To Update Password You Must Using me/updatePassword");
		if (req.body.email)
			throw new Error("To Update email You Must Using me/updateEmail");
		const newUserData = { ...req.user._doc, ...req.body };
		const Building = await ModelHelper.updateOne(
			UserModel,
			{
				_id: req.user._id,
			},
			newUserData,
		);
		Helper.resHandler(res, 200, true, req.user, "user updated");
	});
	static deleteMe = Helper.catchAsyncError(async (req, res, next) => {
		req.user.isActive = false;
		await req.user.save();
		Helper.resHandler(res, 200, true, null, "user deleted ");
	});
	static changeProfileImage = Helper.catchAsyncError(async (req, res, next) => {
		req.user.profileImage = req.file.filename;
		await req.user.save();
		const user = { ...req.user._doc };
		delete user.role;
		delete user.tokens;
		res.status(200).json({
			status: "success",
			data: user,
		});
	});
}
module.exports = MeController;
