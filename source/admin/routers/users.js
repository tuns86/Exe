const express = require('express');

const Router = express.Router();

const passport = require('passport');

const {
    ensureAuthenticated,
    forwardAuthenticated
} = require('../config/auth');

const LocalUser = require('../models/LocalUser.model');

const nodemailer = require("nodemailer");

const {
    google
} = require('googleapis');

const OAuth2 = google.auth.OAuth2;

const bcrypt = require('bcryptjs');

const fs = require('fs');

const path = require('path');

const multer = require('multer');
const FaceBookUser = require('../models/FaceBookUser.model');

const Course = require('../models/Course.model');

const CourseTopic = require('../models/CourseTopic.model');

const CourseCategory = require('../models/CourseCategory.model');

//Xác thục bởi facebook
Router.get(
    "/auth/facebook",
    passport.authenticate("facebook", {
        scope: ["email", "user_photos"],
    })
);

//Redirect từ facebook => web browser
Router.get(
    "/auth/facebook/callback",
    passport.authenticate("facebook", {
        failureRedirect: "/",
    }),
    function (req, res, next) {
        res.redirect("/");
    }
);

//GET LOGIN
Router.get('/login', forwardAuthenticated, (req, res) => {
    res.render('./user/login');
});

//GET register
Router.get('/register', forwardAuthenticated, (req, res) => {
    res.render('./user/register');
});

//POST register
Router.post("/register", async function (req, res) {
    const { name, email, password, password2, gender } = req.body;
    let errors = [];

    if (!name || !email || !password || !password2) {
        errors.push({ msg: "Please enter all fields" });
    }
    if (password != password2) {
        errors.push({ msg: "Passwords do not match" });
    }
    if (password.length < 6) {
        errors.push({ msg: "Password must be at least 6 characters" });
    }

    if (errors.length > 0) {
        return res.render("./user/register", { errors });
    }

    // cần await
    const existingUser = await LocalUser.findOne({ email: email });
    if (existingUser) {
        errors.push({ msg: "Account existed, Try another email" });
        return res.render("./user/register", { errors });
    }

    // cần await
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new LocalUser({
        name,
        email,
        password: hashedPassword,
        gender,
        isAuth: true
    });

    await newUser.save();

    req.flash("success_msg", "You are registered and can now log in");
    res.redirect("/users/login");
});


// POST login
Router.post("/login", async function (req, res, next) {
    const { email, password } = req.body;
    let errors = [];

    if (!email || !password) {
        errors.push({ msg: "Please enter all fields" });
        return res.render("./user/login", { errors });
    }

    try {
        const user = await LocalUser.findOne({ email: email });

        if (!user) {
            errors.push({ msg: "This email is not registered" });
            return res.render("./user/login", { errors });
        }

        // So sánh password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            errors.push({ msg: "Incorrect password" });
            return res.render("./user/login", { errors });
        }

        // Đăng nhập thành công → lưu session
        req.session.user = {
            id: user._id,
            name: user.name,
            email: user.email,
            gender: user.gender,
        };

        req.flash("success_msg", "You are now logged in");
        res.redirect("/");

    } catch (err) {
        console.error(err);
        errors.push({ msg: "Something went wrong, please try again" });
        res.render("./user/login", { errors });
    }
});


Router.get('/logout', (req, res) => {
    req.flash('success_msg', 'You now log out');
    req.logout();
    res.redirect('/');
});

Router.get('/account', ensureAuthenticated, (req, res) => {
    res.render('./user/account', {
        user: req.user
    });
});

Router.get('/updateInfor', ensureAuthenticated, (req, res) => {
    res.render('./user/updateinfor', {
        name: req.user.name,
        isLocalAccount: (req.user.password != undefined) ? true : false
    });
});

Router.post('/updateInfor', async (req, res) => {
    const name = req.body.name;
    const oldPassword = req.body.oldPassword;
    const newPassword = req.body.newPassword;
    const confPassword = req.body.confPassword;
    const gender = req.body.gender;

    let errors = [];
    //Nếu là localaccount
    if (req.user.password != undefined) {
        if (!name || !newPassword || !confPassword || !gender || !oldPassword) {
            errors.push({
                msg: "Please enter all fields",
            });
        }

        if (newPassword != confPassword) {
            errors.push({
                msg: "Passwords do not match",
            });
        }

        if (newPassword.length < 6) {
            errors.push({
                msg: "Password must be at least 6 characters",
            });
        }

        const isMatch = await bcrypt.compare(oldPassword, req.user.password);
        if (!isMatch) {
            errors.push({ msg: 'Old password is incorrect' });
}
    }
    //Nếu không phải Local Account
    else {
        if (!name) {
            errors.push({
                msg: "Please enter all fields",
            });
        }
    }

    if (errors.length > 0) {
        res.render("./user/updateinfor", {
            name: req.user.name,
            errors,
        });
    } else {
        req.user.name = name;
        req.user.gender = gender;
        //Không phải account local
        if (req.user.password != undefined) {
            req.user.password = await bcrypt.hash(newPassword, 10);
        }

        req.user.save().then(() => {
            req.flash("success_msg", "Your are updated");
            res.redirect("/users/account");
        });
    }
});

//Get update Avatar
Router.get("/updateAvatar", ensureAuthenticated, (req, res) => {
    res.render("./user/updateAvatar");
});

//Upload avatar
Router.post("/updateAvatar", function (req, res) {
    fs.mkdir(path.join(__dirname, "../public/avatar/" + req.user._id.toString()), () => {});

    const storage = multer.diskStorage({
        destination: function (req, file, cb) {
            cb(null, "./public/avatar/" + req.user._id.toString());
        },
        filename: function (req, file, cb) {
            let avatar =
                "/public/avatar/" + req.user._id.toString() + "/" + "avatar.png";
            req.user.avatar = avatar;
            req.user.save();
            cb(null, "avatar.png");
        },
    });
    const upload = multer({
        storage,
    });
    upload.single("fuMain")(req, res, function async (err) {
        if (err) {
            console.log(err);
        } else {
            res.redirect("/users/account");
        }
    });
});

Router.get('/wish-list-change', ensureAuthenticated, async (req, res)=>{
    courseID = req.query.courseID;
    if (courseID != undefined) {
        let index;
        if ((index = req.user.idWishList.indexOf(courseID)) == -1) {
            req.user.idWishList.push(courseID);  
        }
        else {
            req.user.idWishList.splice(index, 1);
        }
        req.user.save();
        res.end();
    }
});

Router.get('/my-wish-list', ensureAuthenticated, async (req, res)=>{
    let courses = [];
    for (let i = 0; i < req.user.idWishList.length; i++) {
        const course = await Course
            .findOne({_id: req.user.idWishList[i]}, [
                'poster',
                '_id',
                'name',
                'idLecturer',
                'evaluationPoint',
                'numberOfEvaluation',
                'tuition',
                'numberOfStudent',
                'idCourseTopic'
            ])
            .populate('idCourseTopic');
        await courses.push(course);
    }
    await res.render('./user/my-wish-list', {
        isAuthenticated: req.isAuthenticated(),
        courses: courses
    });
});



module.exports = Router;