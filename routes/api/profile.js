const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const passport = require('passport');

const validateProfileInput = require('../../validation/profile');
const validateExperienceInput = require('../../validation/experience');
const validateEducationInput = require('../../validation/education');

const Profile = require('../../models/Profile');
const User = require('../../models/User');

// @route   GET api/profile/test
// @desc    Tests profile route
// @access  Public
router.get('/test', (req, res) => {
  res.status(200).json({
    msg: 'Profile works'
  });
});

// @route   GET api/profile
// @desc    Get current user profile
// @access  Private
router.get('/', passport.authenticate('jwt', {session: false}), (req, res) => {
  const errors = {};
  Profile.findOne({user: req.user.id})
    .populate('user', ['name', 'avatar'])
    .then(profile => {
      if(!profile) {
        errors.noprofile = 'There is no profile for this user';
        return res.status(404).json(errors);
      }
      return res.json(profile);
    })
    .catch(err => res.status(404).json(err));
});

// @route   POST api/profile/all
// @desc    Get all profiles
// @access  Public
router.get('/all', (req, res) => {
  const errors = {};
  Profile.find()
    .populate('user', ['name', 'avatar'])
    .then(profiles => {
      if(!profiles) {
        errors.noprofile = 'There are no profiles';
        return res.status(404).json(errors);
      }

      return res.json(profiles);
    })
    .catch(err => res.status(404).json({profile: 'There is no profile for this user'}))
})

// @route   GET api/profile/handle/:handle
// @desc    Get profile by handle
// @access  Public
router.get('/handle/:handle', (req, res) => {
  const errors = {};
  Profile.findOne({handle: req.params.handle})
    .populate('user', ['name', 'avatar'])
    .then(profile => {
      if(!profile) {
        errors.noprofile = 'There is no profile for this user';
        res.status(404).json(errors);
      }

      res.json(profile);
    })
    .catch(err => res.status(404).json({profile: 'There is no profile for this user'}))
});

// @route   GET api/profile/user/:user_id
// @desc    Get profile by user id
// @access  Public
router.get('/user/:user_id', (req, res) => {
  const errors = {};
  Profile.findOne({user: req.params.user_id})
    .populate('user', ['name', 'avatar'])
    .then(profile => {
      if(!profile) {
        errors.noprofile = 'There is no profile for this user';
        res.status(404).json(errors);
      }

      res.json(profile);
    })
    .catch(err => res.status(404).json(err));
});

// @route   POST api/profile
// @desc    Create or edit user profile
// @access  Private
router.post('/', passport.authenticate('jwt', {session: false}), (req, res) => {
  const {errors, isValid} = validateProfileInput(req.body);

  // Check validation
  if(!isValid) {
    res.status(400).json(errors);
  }

  // Get fields
  const profileFields = {};
  profileFields.user = req.user.id;
  if(req.body.handle) profileFields.handle = req.body.handle;
  if(req.body.company) profileFields.company = req.body.company;
  if(req.body.website) profileFields.website = req.body.website;
  if(req.body.location) profileFields.location = req.body.location;
  if(req.body.bio) profileFields.bio = req.body.bio;
  if(req.body.status) profileFields.status = req.body.status;

  if(typeof req.body.skills !== 'undefined') {
    profileFields.skills = req.body.skills.split(',');
  }

  profileFields.social = {};
  
  if(req.body.youtube)    profileFields.social.youtube   = req.body.youtube;
  if(req.body.twitter)    profileFields.social.twitter   = req.body.twitter;
  if(req.body.linkedin)   profileFields.social.linkedin  = req.body.linkedin;
  if(req.body.facebook)   profileFields.social.facebook  = req.body.facebook;
  if(req.body.instagram)  profileFields.social.instagram = req.body.instagram;

  Profile.findOne({user: req.user.id})
    .then(profile => {
      if(profile) {
        Profile.findOneAndUpdate(
          {user: req.user.id}, 
          {$set: profileFields}, 
          {new: true}
        )
        .then(profile => res.status(200).json(profile));
      } else {
        // check if handle exists
        Profile.findOne({ handle: profileFields.handle})
          .then(profile => {
            if(profile) {
              errors.handle = 'That handle already exists';
              res.status(400).json(errors);
            }

            new Profile(profileFields)
              .save()
              .then(profile => res.status(200).json(profile));
          });
      }
    });
});

// @route   POST api/profile/experience
// @desc    Add expirience to profile
// @access  Private
router.post('/experience', passport.authenticate('jwt', {session: false}), (req, res) => {
  const {errors, isValid} = validateExperienceInput(req.body);

  // Check validation
  if(!isValid) {
    return res.status(400).json(errors);
  }

  Profile.findOne({user: req.user.id})
    .then(profile => {
      const newExp = {
        title: req.body.title,
        company: req.body.company,
        location: req.body.location,
        from: req.body.from,
        to: req.body.to,
        current: req.body.current,
        description: req.body.description
      }

      // Add to exp array
      profile.experience.unshift(newExp);

      return profile.save();
    })
    .then(profile => res.json(profile))
    .catch(err => console.log(err))
});

// @route   POST api/profile/education
// @desc    Add education to profile
// @access  Private
router.post('/education', passport.authenticate('jwt', {session: false}), (req, res) => {
  const {errors, isValid} = validateEducationInput(req.body);
  
  // Check validation
  if(!isValid) {
    return res.status(400).json(errors);
  }

  Profile.findOne({user: req.user.id})
    .then(profile => {
      const newEdu = {
        school: req.body.school,
        degree: req.body.degree,
        fieldofstudy: req.body.fieldofstudy,
        from: req.body.from,
        to: req.body.to,
        current: req.body.current,
        description: req.body.description
      }
      
      // Add to exp array
      profile.education.unshift(newEdu);

      return profile.save();
    })
    .then(profile => res.json(profile))
    .catch(err => console.log(err))
});

// @route   DELETE api/profile/experience/:exp_id
// @desc    Delete expirience from profile
// @access  Private
router.delete('/experience/:exp_id', passport.authenticate('jwt', {session: false}), (req, res) => {
  Profile.findOne({user: req.user.id})
    .then(profile => {
      profile.experience = profile.experience
        .filter(exp => exp.id.toString() !== req.params.exp_id);

      return profile.save();
    })
    .then(profile => res.json(profile))
    .catch(err => console.log(err))
});

// @route   DELETE api/profile/education/:edu_id
// @desc    Delete education from profile
// @access  Private
router.delete('/education/:edu_id', passport.authenticate('jwt', {session: false}), (req, res) => {
  Profile.findOne({user: req.user.id})
    .then(profile => {
      profile.education = profile.education
        .filter(edu => edu.id.toString() !== req.params.edu_id);

      return profile.save();
    })
    .then(profile => res.json(profile))
    .catch(err => console.log(err))
});

// @route   DELETE api/profile/
// @desc    Delete user and profile
// @access  Private
router.delete('/', passport.authenticate('jwt', {session: false}), (req, res) => {
  Profile.findOneAndRemove({user: req.user.id})
    .then(() => {
      return User.findOneAndRemove({_id: req.user.id})
    })
    .then(() => res.json({success: true}))
    .catch(err => console.log(err));
});

module.exports = router;