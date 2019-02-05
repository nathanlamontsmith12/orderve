const express       = require('express');
const router        = express.Router();
const Users         = require('../models/User');
const Events        = require('../models/Event');
const Services      = require('../models/Service');
const Bids          = require('../models/Bid');

// index route
router.get('/', async (req,res)=>{
    try{
        const chefs = await Services.find({});
        console.log('all the services: ' + chefs);
        console.log('==============');
        res.render('services/index.ejs',{
            isEvent: false,
            services: chefs,
            currentUserId: req.session.userId,
            currentSession: req.session
        })
    } catch(err){
        res.send(err);
    }
})
//route to the services index.ejs ** for now just listing all current chefs will eventually be used to list out chefs bids ** or orderves
router.get('/event/:id', async (req,res)=>{
    console.log('in the eents');
    try{
        const event = await Events.findById(req.params.id);;
        console.log('~~~~~~~~~~ event: ' + event);
        res.render('services/index.ejs', {
            event: event,
            isEvent: true,
            currentUserId: req.session.userId,
            currentSession: req.session
        // for each chef or service we need to see if it is in the current users events.
        // if they are then put em into new array which we will pass to the ejs file
        });
    } catch(err){
        res.send(err);
    }
});

// new route
router.get('/new', (req,res)=>{
    res.render('services/new.ejs',{
        currentUserId: req.session.userId,
        currentSession: req.session
    });
});

// create route
router.post('/', async (req,res)=>{
    
    try{
        
        const newService = req.body;
        newService.hostId = req.session.userId;

        // need hostId saved on the document created in the database 

        const user = await Users.findById(req.session.userId); // find user based on id
 
        const createdService = await Services.create(newService); // create the service in the collection
        user.services.push(createdService); // add the service to the user's array of services
        await user.save();
        res.redirect("/users/" + user._id); // redirect to the users show page
    }catch(err){
        res.send(err);
    }
});

// This route will handle when a chef makes a bid it will add the service to the event service array --- This needs work
router.get('/event/new/:id', async (req, res)=>{
    try{
        const event = await Events.findById(req.params.id);
        const user = await Users.findById(req.session.userId);
        const thisService = user.services[0];
        event.services.push(thisService);
        await event.save();
        res.redirect('/events');
    }catch(err){
        res.send(err);
    }
})

// show route
router.get('/:id', async (req,res)=>{ 
    try {   
        const service = await Services.findById(req.params.id);
        const user = await Users.findOne({'services._id': req.params.id});
        console.log('user id: ' + user._id);
        console.log('current User Id ' + req.session.userId);
        res.render('services/show.ejs',{
            serviceUser: user,
            service: service,
            currentUserId: req.session.userId,
            currentSession: req.session
        })

    } catch(err){
        res.send(err);
    }
    
});

//edit route
router.get('/:id/edit', async (req, res)=>{
    try{
        // first find the service
        const service = await Services.findById(req.params.id);
        const user = await Users.findOne({'services._id': req.params.id});
        res.render('services/edit.ejs',{
            user: user,
            service: service,
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
        const service = await Services.findByIdAndUpdate(req.params.id, req.body, {new: true});
        console.log('after ' + service);
        const user = await Users.findOne({'services._id': req.params.id});
        const event = await Events.findOne({'services._id': req.params.id});
        await user.services.id(req.params.id).remove();  
        await user.services.push(service);
        await user.save();
        if(event){
            console.log('updating in the event: ' + event + 'the service: ' + service);
            event.services.id(req.params.id).remove();
            event.services.push(service);
            await event.save();
            res.redirect('/services/' + req.params.id);
        }
        res.redirect('/services/' + req.params.id);
    }catch(err){
        res.send(err);
        console.log(err);
    }
});

router.delete('/:id', async (req, res)=>{
    try{
        const deletedService = await Services.findByIdAndDelete(req.params.id);
        console.log(`First Deleted service console.log` + deletedService);
        const foundUser = await Users.findOne({'services._id': req.params.id});
        const foundEvent = await Events.findOne({'services._id': req.params.id});
        foundUser.services.id(req.params.id).remove();
        await foundUser.save();
        console.log('deleted >>>>>>>>>>>>>>>>>');
        // delete the bids attached to this service.
        const bidsIds = [];
        
        for (let i = 0; i < deletedService.bids.length; i++){
            bidsIds.push(deletedService.bids[i]._id.toString());
        }
        console.log(`bids id array: ${bidsIds} with length of ${bidsIds.length}`);
        if (bidsIds.length > 1){
            console.log('in the length > 1');
            await Bids.deleteMany({_id:{$in: bidsIds}});
            console.log('deleted many');
        } else if (bidsIds.length !== 0) {
            console.log('in the else');
            await Bids.findById(bidsIds[0]);
            console.log('deleted one');
        }
        
        console.log('deleted from Collections >>>>>>>>>>>>>>>>>');
        if(foundEvent){
            console.log('deleted from the event' + deletedService);
            foundEvent.services.id(req.params.id).remove();
            await foundEvent.save();
            res.redirect('/users/' + req.session.userId); 
        }
        console.log('deleted' + deletedService);
        res.redirect('/users/' + req.session.userId); 
        
        // redirects to the current users show page
    }catch(err){
        console.log(err);
        res.send(err);
    }
});



module.exports = router;