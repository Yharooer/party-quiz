const mongoose = require('mongoose');

const prefSchema = new mongoose.Schema({
    data: {type: mongoose.Mixed}, 
});

prefSchema.statics.getPrefs = async function() {
    try {
        const pref = await Preferences.findOne({});
        if (pref) {
            if (pref.data == undefined) {
                pref.data = {};
                pref.save();
            }
            return pref.data;
        }
        throw 'Exception!';
    }
    catch (e) {
        const pref = new Preferences({data: {}});
        pref.save();
        return pref.data;
    }
}

prefSchema.statics.setPrefs = async function(data) {
    try {
        const pref = await Preferences.findOne({});
        if (pref) {
            pref.data = data;
            pref.save();
        }
        throw 'Exception!';
    }
    catch (e) {
        const pref = new Preferences({data: data});
        pref.save();
    }
}

module.exports = Preferences = mongoose.model('Preferences', prefSchema, 'preferences');