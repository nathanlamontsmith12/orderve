const express       = require('express');
const router        = express.Router();
const Users         = require('../models/User');
const Events        = require('../models/Event');
const Services      = require('../models/Service');
const Bids          = require('../models/Bid');
//new bid
router.get('/new/:id', async (req,res)=>{
    try{
        const currentUser = await Users.findById(req.session.userId);
        if(currentUser.services.length > 0) {
            const event = await Events.findById(req.params.id);
            console.log('--------- event ---------');
            console.log(event);
            res.render('bids/new.ejs', {
                event: event,
                currentUserId: req.session.userId,
                currentSession: req.session
            });
        }else {
            req.session.message = "You need to make a Chef profile";
            res.redirect(`users/${req.session.userId}`);
        }
        
    }catch(err){
        console.log(err);
        res.send(err);
    }
});
//create bid
router.post('/events/:id/', async (req,res)=>{
    try{
        const createdBid = await Bids.create(req.body);
        const foundEvent = await Events.findById(req.params.id);
        const currentUser = await Users.findById(req.session.userId);
        const currentServiceId = currentUser.services[0]._id;
        const currentService = await Services.findById(currentServiceId);
        foundEvent.services.push(createdBid);
        await foundEvent.save();
        currentUser.services[0].bids.push(createdBid);
        await currentUser.save();
        currentService.bids.push(createdBid);
        await currentService.save();
        req.session.message = "You need to make a service profile";
        
        res.redirect(`/users/${req.session.userId}`);
    
    }catch(err){
        console.log(err);
        res.send(err);
    }
});

// show bid
router.get('/:id', async (req,res)=>{
    try{
        const foundBid = await Bids.findById(req.params.id);
        const foundService = await Services.findOne({'bids._id': req.params.id});
        const foundEvent = await Events.findOne({'services._id': req.params.id});
        const foundUser = await Users.findOne({'services._id': foundService._id});
        console.log('----------------');
        console.log(foundUser);
        res.render('bids/show.ejs',{
            user: foundUser,
            event: foundEvent,
            service: foundService,
            bid: foundBid,
            currentUserId: req.session.userId,
            currentSession: req.session
        });
    }catch(err){
        console.log(err);
        res.send(err);
    }
});

//edit route
router.get('/:id/edit', async (req, res)=>{
    try{
        
        const foundBid = await Bids.findById(req.params.id);
        const foundEvent = await Events.findOne({'services._id': req.params.id});
        // const user = await Users.findOne({'services._id': req.params.id});
        res.render('bids/edit.ejs',{
            // user: user,
            event: foundEvent,
            bid: foundBid,
            currentUserId: req.session.userId,
            currentSession: req.session
        });
    }catch(err){
        res.send(err);
    }
});

// put route
router.put('/:id', async (req, res)=>{
    // find one service by id and update
    
    try{
        console.log('about to update..' + JSON.stringify(req.body));
        const bid = await Bids.findByIdAndUpdate(req.params.id, req.body, {new: true});
       
        const foundService = await Services.findOne({'bids._id': req.params.id});
        const user = await Users.findById(req.session.userId);
        const event = await Events.findOne({'services._id': req.params.id});
        await foundService.bids.id(req.params.id).remove();  
        await foundService.bids.push(bid);
        await foundService.save();

        // find the bid in the users' services' bids array and remove it then push it
        const updatedBidInUserServices = await user.services.id(foundService._id).bids.id(req.params.id).remove();
        console.log(updatedBidInUserServices);
        await user.services.id(foundService._id).bids.push(bid);
        await user.save();

        // find the bid in the events services array remove and push updated
        const updatedBidInEventServices = await event.services.id(req.params.id).remove();
        console.log('events =============');
        console.log(updatedBidInEventServices);
        event.services.push(bid);
        await event.save();

        // redirect to bid show page
        res.redirect('/bids/' + req.params.id);
    }catch(err){
        res.send(err);
        console.log(err);
    }
});

router.delete('/:id', async (req,res)=>{
    try{
        const bid = await Bids.findByIdAndDelete(req.params.id);
        console.log(bid);
        const foundService = await Services.findOne({'bids._id': req.params.id});
        const currentUser = await Users.findById(req.session.userId);
        const event = await Events.findOne({'services._id': req.params.id});
        currentUser.services.id(foundService._id).bids.id(req.params.id).remove();
        await currentUser.save();
        foundService.bids.id(req.params.id).remove();
        await foundService.save();
        event.services.id(req.params.id).remove();
        await event.save();
        console.log('bid deleted >>>>>>>>>>>>>>>>');
        res.redirect(`/services/${foundService._id}`);
    } catch(err){
        console.log(err);
        res.send(err);
    }
})


// PATCH route -- change status of bid to/from accepted 
router.patch('/:id', async (req, res)=>{

        // req.body.accepted == either yes or no

        const update = {};

    if (req.body.accepted === "yes") {
        update.accepted = true;
    } else {
        update.accepted = false;
    }
            
     try{
        // most of this code copied from above and adapted slightly 
        // update the bid to change only the updated acceptance status 
        const bid = await Bids.findByIdAndUpdate(req.params.id, update, {new: true});

        console.log("updated bid: ", bid);

        // find all places that the bid lives, and capture them in constants: 
        const foundService = await Services.findOne({'bids._id': req.params.id});
        const user = await Users.findById(req.session.userId);
        const event = await Events.findOne({'services._id': req.params.id});

        // update in the foundService FIRST 
        await foundService.bids.id(req.params.id).remove();  
        await foundService.bids.push(bid);
        await foundService.save();

        // find the bid in the users' services' bids array, remove, push updated bid, SAVE
        const updatedBidInUserServices = await user.services.id(foundService._id).bids.id(req.params.id).remove();
        await user.services.id(foundService._id).bids.push(bid);
        await user.save();

        // find the bid in the events services array remove and push updated
        const updatedBidInEventServices = await event.services.id(req.params.id).remove();
        console.log('events =============');
        console.log(updatedBidInEventServices);
        event.services.push(bid);
        await event.save();

        // redirect to bid show page
        res.redirect(`/bids/${req.params.id}`);
    }catch(err){
        res.send(err);
        console.log(err);
    }
})


module.exports = router;