const mongoose = require('mongoose');

const schedulerSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    lastname: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    email: {
        type: String,
        required: true
    },
});

schedulerSchema.methods.cleanup = function() {
    return {
        name: this.name,
        lastname: this.lastname,
        date: this.date,
        email: this.email
    }
}

const Scheduler = mongoose.model('Scheduler', schedulerSchema);

module.exports = Scheduler;