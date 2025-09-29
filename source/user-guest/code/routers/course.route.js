const express = require('express');

const Router = express.Router();

const Course = require('../models/Course.model');

const Lecturer = require('../models/Lecturer.model');

const CourseCategory = require('../models/CourseCategory.model');

const CourseTopic = require('../models/CourseTopic.model');

const paypal = require('paypal-rest-sdk');

const LocalUser = require('../models/LocalUser.model');

// const FaceBookUser = require('../models/FaceBookUser.model');

const {
    ensureAuthenticated,
    forwardAuthenticated
} = require('../config/auth.config');

//Trang thông tin chi tiết khóa học
Router.get('/:nameCourse', async (req, res) => {

    console.log("👉 Route /course/:nameCourse được gọi");
    console.log("👉 req.params:", req.params);

    let nameCourse = req.params.nameCourse.toString();
   
    const courseRaw = await Course.findOne({ name: nameCourse });
console.log("📌 Trước populate:", courseRaw.idLecturer);

const course = await Course.findOne({ name: nameCourse })
  .populate('idLecturer')
  .populate('idCourseTopic');
console.log("📌 Sau populate:", course.idLecturer);

    //Tăng view Topic và Category
    course.numberOfView += 1;
    course.save();
    CourseTopic.findOne({
        _id: course.populated('idCourseTopic')
    }).then((doc)=>{
        doc.numberOfView += 1;
        doc.save();
    });
    CourseCategory.findOne({
        _id: course.idCourseTopic.idCourseCategory
    }).then((doc)=>{
        doc.numberOfView += 1;
        doc.save();
    });
    
    //Render trang chi tiết khóa học
    //Kiểm tra khóa học đã được mua chưa
    let isPaid = false;
    if (req.user != undefined) {
        for (let i = 0; i < req.user.purchasedCourses.length; i++) {
            if (req.user.purchasedCourses[i].idCourse.toString() == course._id) {
                isPaid = true;
                break;
            }
        }
    }
    //Kiểm tra khóa học có trong danh sách yêu thích không
    let isWishCourse = false;
    if (req.user != undefined && req.user.idWishList.indexOf(course._id) != -1) {
        isWishCourse = true
    }
    //Kiểm tra đã đánh giá chưa
    let isEvaluate = false;
    let myEvaluationPoint = 1;
    if(req.user != undefined) {
        for (let i = 0; i < course.userEvaluations.length; i++) {
            if (course.userEvaluations[i].idUser.toString() == req.user._id) {
                isEvaluate = true
                myEvaluationPoint = course.userEvaluations[i].point
                break;
            }
        }
    }
    //Thêm vào thông tin của những người đã review khóa học
    const userReviews = [];
    for (let i = 0; i < course.userReviews.length; i++) {
        const localUser = await LocalUser.findOne({
            _id: course.userReviews[i].idUser
        });

        if (localUser) {
            userReviews.push(localUser);
        }
    }
    
    //Đánh dấu những video đã học
    let learnedVideos = [];
    if (isPaid) {
        for (let i = 0; i < req.user.purchasedCourses.length; i++) {
            if (req.user.purchasedCourses[i].idCourse.toString() == course._id) {
                learnedVideos = req.user.purchasedCourses[i].learnedVideos;
                break;
            }
        }
    }
    
    res.render('./course/detail', {
        isAuthenticated: req.isAuthenticated(),
        isWishCourse: isWishCourse,
        course: course,
        isPaid: isPaid,
        isEvaluate: isEvaluate,
        myEvaluationPoint: myEvaluationPoint,
        userReviews: userReviews,
        learnedVideos: learnedVideos,
        user: req.user
    });
});

Router.post('/:nameCourse/evaluate', async (req, res)=>{
    const evaluationPoint = +req.body.evaluationPoint;
    const nameCourse = req.params.nameCourse;

    //Lấy ra khóa học vừa đánh giá
    const course = await Course.findOne({name: nameCourse});
    let isEvaluate = false;
    for (let i = 0; i < course.userEvaluations.length; i++) {
        // Nếu đã đánh giá thì cập nhật lại điểm đánh giá
        if (course.userEvaluations[i].idUser.toString() == req.user._id) {
            isEvaluate = true;
            course.userEvaluations[i].point = evaluationPoint;
            //Tính toán lại điểm đánh giá
            let newEvaluationPoint = 0;
            for (let i = 0; i < course.userEvaluations.length; i++) {
                newEvaluationPoint += course.userEvaluations[i].point;
            }
            newEvaluationPoint /= course.userEvaluations.length;
            newEvaluationPoint.toFixed(1);
            course.evaluationPoint = newEvaluationPoint;
            //Cập nhật lại khóa học
            course.save().then((doc)=>{
                res.json(true);
            });
            break;
        }
    }
    //Nếu người dùng chưa đánh giá thì thêm đánh giá của người dùng vào
    if (!isEvaluate) {
        course.userEvaluations.push({
            idUser: req.user._id,
            point: evaluationPoint
        });
        //Tính toán lại điểm đánh giá
        let newEvaluationPoint = 0;
        for (let i = 0; i < course.userEvaluations.length; i++) {
            newEvaluationPoint += course.userEvaluations[i].point;
        }
        newEvaluationPoint /= course.userEvaluations.length;
        newEvaluationPoint.toFixed(1);
        course.evaluationPoint = newEvaluationPoint;
        //Cập nhật lại khóa học
        course.save().then((doc)=>{
            res.json(true);
        });
    }
});

//Xử lý tác vụ người dùng nhấn nút gửi bình luận
Router.post('/:nameCourse/review', async (req, res)=>{
    const nameCourse = req.params.nameCourse;
    const review = req.body.review;
    const course = await Course.findOne({
        name: nameCourse
    });
    course.userReviews.push({
        idUser: req.user._id,
        review: review
    });
    course.save().then((doc)=>{});
    res.json(true);
});

//Vào coi bài giảng
Router.get('/:nameCourse/lessions', ensureAuthenticated, async(req, res)=>{
    const nameCourse = req.params.nameCourse;
    const course = await Course.findOne({
        name: nameCourse
    });
});

module.exports = Router;