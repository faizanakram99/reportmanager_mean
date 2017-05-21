var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var nodemailer = require('nodemailer');
var inlineBase64 = require('nodemailer-plugin-inline-base64');

//Connect to database
mongoose.connect('mongodb://localhost/reports');

var db = mongoose.connection;

db.on('error', console.error.bind(console, 'Connection error'));
db.on('open', function(){
    console.log('Connected');
});

//Create a schema - this is like a blueprint
var reportdetails = new mongoose.Schema({
    tickets: {
        type: String,
        required:true
    },
    spent_time: {
        type: String,
        required:true
    },
    logged_time: {
        type: String,
        required:true
    },
    remarks : {
        type: String,
        required:true
    }
});

var reportSchema = new mongoose.Schema({
    date: {
        type: String,
        required: true,
        unique: true
    },
    login: {
        type: String,
        required:true
    },
    logout: {
        type: String,
        required:false
    },
    reportdetails: [reportdetails]

});

//Create schema
var Report = mongoose.model('report', reportSchema);

module.exports = function(app) {

    app.use(bodyParser.json());                         // support json encoded bodies
    app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies

    app.get('/report/:date', function(req, res) {
        //get data from mongodb and pass it to view
        Report.find({"date": req.params.date}, function(err, data) {
            if (err) throw err;
            res.end(JSON.stringify(data));
        });
    });


    app.post('/report/:date', function(req, res) {
        //get data from view and add it to mongodb
        Report.find({"date": req.params.date}, function(err, data) {
            if (err) throw err;
            if (data.length) {
                Report.update({"date": req.params.date}, req.body, null, function (err, data) {
                    if (err) throw err;
                    res.json("Updated successfully!");
                });
            } else {
                Report(req.body).save(function (err, data) {
                    if (err) throw err;
                    res.json("Saved successfully!");
                });
            }

        });
    });

    app.delete('/report/:date/:id?', function(req, res) {
        //Delete the requested item from mongodb
        if(req.params.id){
            Report.findOneAndUpdate(
                { date: req.params.date}, {$pull: {reportdetails: {_id: req.params.id}}}, function(err, data) {
                    if(err) throw err;
                    res.json(data);
                }
            );
        }else{
            Report.findOneAndRemove({date: req.params.date}, function(err, data){
                if(err) throw err;
                res.json("Deleted successfully!");
            });
        }

    });

    //email
    app.post('/report/email/:date', function(req, res) {        
        var transporter = nodemailer.createTransport({
            host: 'smtp.zoho.com',
            port: 465,  
            secure: true,                  
            auth: {
                user: 'faizan@yarikul.in',
                pass: 'Constant@55b'
            }
        });

        transporter.verify(function(error, success) {
            if (error) {
                console.log(error);
            } else {
                console.log('Server is ready to take our messages');
            }
        });

        transporter.use('compile', inlineBase64({cidPrefix: 'report_'}));

        // setup email data with unicode symbols
        var mailOptions = {
            from: '"Full Name" <email@domain.xyz>', // sender address
            to: 'email@domain.xyz', // list of receivers
            cc: 'email@domain.xyz', // carbon copy list of receivers
            bcc: 'email@domain.xyz', // bcc list of receivers
            subject: 'Daily Report - ' + req.params.date, // Subject line  
            // html: '<b>hello</b>' // html body          
            html: '<img src="'+req.body.imgData+'"/>' // html body
        };

        // send mail with defined transport object
        transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
                res.json(error);
                console.log(error);
            }
            res.json(info.response);
            console.log('Message %s sent: %s', info.messageId, info.response);
        });
    });

};