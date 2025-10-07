const express = require('express');

const Router = express.Router();

const Course = require('../models/Course.model');

const Lecturer = require('../models/Lecturer.model');

const CourseCategory = require('../models/CourseCategory.model');

const CourseTopic = require('../models/CourseTopic.model');

const paymentConfig = require("../config/vietqr.config");

const crypto = require("crypto");

const {
    ensureAuthenticated,
    forwardAuthenticated
} = require('../config/auth.config');

Router.get('/:nameCourse/checkout', ensureAuthenticated, async (req, res) => {
  const course = await Course.findOne({ name: req.params.nameCourse });
  const now = new Date();
  const date = `${now.getDate()}/${now.getMonth() + 1}/${now.getFullYear()}`;

    const paymentCode = crypto.randomBytes(8).toString('hex').toUpperCase();
    
    req.session.paymentInfo = {
    code: paymentCode,
    userId: req.user._id,
    courseId: course._id,
    amount: course.tuition
  };

  // ⚡️ Tạo QR link
  const { bank } = paymentConfig;
  const qrUrl = `https://img.vietqr.io/image/${bank.id}-${bank.account_no}-${bank.template}.png?amount=${course.tuition}&addInfo=${encodeURIComponent(` ${paymentCode} thanh toan`)}&accountName=${encodeURIComponent(bank.account_name)}`;

  res.render('./payment/checkout', {
    isAuthenticated: req.isAuthenticated(),
    course,
    date,
    user: req.user,
    qrUrl,
    paymentCode
  });
});

Router.get('/check/:amount', async (req, res) => {
  try {
    const { amount } = req.params;
    const paymentInfo = req.session.paymentInfo;
    
  if (!paymentInfo) {
      return res.json({ matched: false, message: "Không tìm thấy thông tin thanh toán trong session." });
    }

    const response = await fetch("https://script.google.com/macros/s/AKfycbxISPBjvmjim0S7_BoQR9tiJB1N9bsr5PyFbjshIsA_bm2Ap3r1x6MzMFpwRl0VpWKZ/exec");
    const data = await response.json();

    if (!data || !data.data || data.data.length === 0) {
      return res.json({ matched: false, message: "Không có dữ liệu giao dịch" });
    }

    // Giao dịch mới nhất
    const latest = data.data[data.data.length - 1];
    const desc = latest["Mô tả"];
    const price = latest["Giá trị"];


    // So sánh mô tả và số tiền (chênh lệch < 1000đ)
    const matched =
      desc.includes(paymentInfo.code) && price >= parseInt(amount);

    res.json({ matched, desc, price });
  } catch (error) {
    console.error("❌ Lỗi check thanh toán:", error);
    res.json({ matched: false, error: true });
  }
});



Router.post('/:nameCourse/confirm', ensureAuthenticated, async (req, res) => {
  try {
    const course = await Course.findOne({ name: req.params.nameCourse }).populate('idCourseTopic');

    course.numberOfStudent += 1;
    await course.save();

    const topic = await CourseTopic.findById(course.idCourseTopic);
    if (topic) {
      topic.numberOfSignUp += 1;
      await topic.save();

      const category = await CourseCategory.findById(topic.idCourseCategory);
      if (category) {
        category.numberOfSignUp += 1;
        await category.save();
      }
    }

    req.user.purchasedCourses.push({
      idCourse: course._id,
      learnedVideos: []
    });
    await req.user.save();

    console.log('✅ Mua thành công:', course.name);
    res.redirect('/my-courses');
  } catch (err) {
    console.error("❌ Lỗi xác nhận thanh toán:", err);
    res.redirect('/my-courses');
  }
});

//Thanh toán thành công trả về trang ds khóa học
Router.get('/:nameCourse/success', async (req, res) =>{
    const course = await Course.findOne({
        name: req.params.nameCourse
    }).populate('idCourseTopic');

    //Tăng học sinh khóa học, tăng đăng kí của Topic, category
    course.numberOfStudent += 1;
    course.save();
    CourseTopic.findOne({
        _id: course.populated('idCourseTopic')
    }).then(doc=>{
        doc.numberOfSignUp += 1;
        doc.save();
    });
    CourseCategory.findOne({
        _id: course.idCourseTopic.idCourseCategory
    }).then(doc=>{
        doc.numberOfSignUp += 1;
        doc.save();
    });

    //Thêm khóa học vào danh sách khóa học đã mua
    req.user.purchasedCourses.push({
        idCourse: course._id,
        learnedVideos: []
    });
    req.user.save().then(console.log('Mua thành công'));

    //CHuyển hướng về danh sách khóa học
    res.redirect('/my-courses');
});

//Thanh toán thất bại trả về trang ds khóa học
Router.get('/:nameCourse/fail', (req, res)=>{
    res.redirect('/my-courses');
});

module.exports = Router;