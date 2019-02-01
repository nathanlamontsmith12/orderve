const express       = require('express');
const router        = express.Router();
const bcrypt        = require('bcryptjs');
const Users         = require('../models/User');
const Events        = require('../models/Event');
const Services      = require('../models/Service');

// index route
router.get('/', async (req,res)=>{
    try{
        // EXCLUDE YOUR ACCOUNT ON INDEX
        const allUsers = await Users.find({ _id: { $ne: req.session.userId } });
        
        res.render('users/index.ejs', {
            users: allUsers, 
            currentUserId: req.session.userId,
            currentSession: req.session
        }
        );
    } catch(err){
        res.send(err);
    }
});


// show route
router.get('/:id', async (req,res)=>{
    if(req.session.logged){
        try{
            console.log(req.session);
            const clickedUser = await Users.findById({ _id: req.params.id });

            res.render('users/show.ejs', {
                user: clickedUser,
                currentUserId: req.session.userId,
                currentSession: req.session
            });
        } catch(err){
            res.send(err);
        }
    } else{
        req.session.message = 'You need to log in or register to view the Orderves!';
        res.redirect('/auth/loginPage');
    }
});

//edit route
router.get('/:id/edit', async (req, res)=>{
    // FETCH RANDOM IMAGE FROM UNSPLASH  


    try{
        const thisUser = await Users.findById({ _id: req.session.userId });

        res.render('users/edit.ejs', {
            user: thisUser,
            currentSession: req.session,
            currentUserId: req.session.userId,
            // src: source
        });
    } catch(err){
        res.send(err);
    }
});



// put route
router.put('/:id', async (req, res)=>{

    try{
        // req.body *may* need to be restructured if errors
        const updatedUser = await Users.findByIdAndUpdate(req.params.id , req.body);

        res.redirect('/users/' + req.params.id);
    } catch(err){
        res.send(err);
    }
    
});

// delete route
router.delete('/:id', async (req,res) => {
    // CLEAR THE SESSION!
    req.session.userId = "";
    req.session.logged = false;

    try{
        const deletedUser = await Users.findByIdAndRemove(req.params.id);
        let eventIds = [];

        for (let i = 0; i < deletedUser.events.length; i++) {
           eventIds.push(deletedUser.events[i]._id);
        }

        await Events.deleteMany({ _id: { $in: eventIds } });

        res.redirect('/');
    } catch(err){
        res.send(err);
    }

});


module.exports = router;