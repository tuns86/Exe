const mongoose = require('mongoose');

const CourseSchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    poster: {
        type: String,
        default: '/public/poster/default/poster.png'
    },
    description: {
        type: String,
        default: 'Đây là miêu tả khóa học'
    },
    evaluationPoint: {
        type: Number,
        default: 0
    },
    numberOfStudent: {
        type: Number,
        default: 0
    },
    numberOfView: {
        type: Number,
        default: 0
    },
    tuition: {
        type: Number,
        default: 10 //USD
    },
    idCourseTopic: {
        type: mongoose.Schema.ObjectId,
        ref: 'coursetopics'
    },
    idLecturer: {
        type: mongoose.Schema.ObjectId,
        ref: 'lecturers'
    },
    uploadDate: {
        type: Date,
        default: Date.now()
    },
    numberOfVideo: {
        type: Number,
        default: 0
    },
    videos: {
        type: [{
            name: String,
            source: String
        }]
    },
    previewIndex: {
        type: [Number]
    },
    whatYoullLearn: {
        type: [String],
        required: true
    },
    userEvaluations: {
        type: [{
            idUser: {
                type: mongoose.Schema.ObjectId,
                required: true
            },
            point: {
                type: Number,
                required: true
            }
        }]
    },
    userReviews: {
        type: [{
            idUser: {
                type: mongoose.Schema.ObjectId,
                required: true
            },
            review: String,
            date: {
                type: Date,
                default: new Date(Date.now())
            }
        }]
    },
    status: {
        type: Boolean,
        default: true
    }
});

// 👉 Thêm text index cho các field cần tìm kiếm
CourseSchema.index({ name: 'text', description: 'text' });

const Course = mongoose.model('courses', CourseSchema);

module.exports = Course;