var express = require('express');
var router = express.Router();

const userModel = require('./users');
const postModel = require('./posts');

const passport = require('passport');
const localStrategy = require('passport-local');
passport.use(new localStrategy(userModel.authenticate()));

const upload = require('./multer');


/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/login', function(req, res, next) {
  res.render('login',{error : req.flash('error')});
});

// Route to handle the file upload using the Multer instance
router.post('/upload',isLoggedIn, upload.single('file'),async function (req, res) {
  if(!req.file){
    return res.status(400).send('No file was provided!')
  }
  const user = await userModel.findOne({username : req.session.passport.user});
  const postData = await postModel.create({
    image : req.file.filename,
    imageText : req.body.imagecaption,
    user : user._id,
  })
  user.posts.push(postData._id);
  await user.save();
  res.redirect('/profile');
});

router.post('/displayPicture',isLoggedIn, upload.single('profilePicture'),async function (req, res) {
  if(!req.file){
    return res.status(400).send('No photo was provided!')
  }
  const user = await userModel.findOne({username : req.session.passport.user});
  user.dp = req.file.filename;
  await user.save();
  res.redirect('/profile');
});

router.get('/profile', isLoggedIn,async function(req, res) {
  const user = await userModel.findOne(req.user).populate('posts');
  res.render('profile',{user});
});

router.get('/feed', isLoggedIn,async function(req, res) {
  const posts = await postModel.find({});
  res.render('feed',{posts});
});

router.post('/register',function(req,res,next){
  const userData = new userModel(
    {username, email, fullname} = req.body
  );
  userModel.register(userData, req.body.password)
  .then(function(){
    passport.authenticate("local")(req,res,function(){
      res.redirect('/login');
    })
  })  
})

router.post('/login', passport.authenticate("local",{
  successRedirect : "/profile",
  failureRedirect : "/login",
  failureFlash : true,
}), function(req, res) { 
});

router.get('/logout', function(req, res) {
  req.logOut(function(err){
    if(err) return next(err);
    res.redirect('/login');
  })
});

function isLoggedIn(req,res,next){
  if(req.isAuthenticated()) return next();
  res.redirect('/login');
}

module.exports = router;
