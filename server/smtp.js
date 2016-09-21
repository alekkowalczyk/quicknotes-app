/**
 * Created by Alek Kowalczyk on 29.12.2015.
 */
Meteor.startup(function(){
    process.env.MAIL_URL = 'smtp://contact@a7pl.us:Zaq1Mju7&@smtp.webio.pl:587/'
});

Meteor.methods({
    sendEmail: function (text) {
        this.unblock();

        Email.send({
            to: 'contact@a7pl.us',
            from: 'contact@a7pl.us',
            subject: 'New message from contact form',
            text: "Message from "+Meteor.userId()+"\r\n"+ text
        });
    }
});