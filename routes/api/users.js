const express = require("express");
const router = express.Router();
const gravatar = require("gravatar");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const keys = require("../../config/keys");

// Load user model of mongoose
const User = require("../../models/User");

// @route:  GET for api/users/test
// @desc:   tests users route
// @access: public
router.get("/test", (req, res) => res.json({ msg: "users work for now" }));

// @route:  GET for api/users/register
// @desc:   register a user
// @access: public
router.post("/register", (req, res) => {
  User.findOne({ email: req.body.email }).then(user => {
    // check if email already exists
    if (user) {
      return res.status(400).json({ email: "Email already exists" });
    } else {
      const avatar = gravatar.url(req.body.email, {
        s: "200",
        r: "pg",
        d: "mm"
      });

      const newUser = new User({
        name: req.body.name,
        email: req.body.email,
        avatar,
        password: req.body.password
      });

      bcrypt.genSalt(10, (err, salt) => {
        bcrypt.hash(newUser.password, salt, (err, hash) => {
          if (err) throw err;
          newUser.password = hash;
          newUser
            .save()
            .then(user => res.json(user))
            .catch(err => console.log(err));
        });
      });
    }
  });
});

// @route:  GET for api/users/login
// @desc:   finds user by email in db, checks for pwd and returns Json token
// @access: public
router.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  // find user by email
  User.findOne({ email }).then(user => {
    // check for user
    if (!user) {
      return res.status(404).json({ email: "user not found!" });
    }

    // check password
    bcrypt.compare(password, user.password).then(isMatch => {
      if (isMatch) {
        // user matched: create jwt payload
        const payload = {
          id: user.id,
          name: user.name,
          avatar: user.avatar
        };

        //sign token through jsonwebtoken
        jwt.sign(payload, keys.secretOrKey);
      } else {
        return res.status(400).json({ password: "password incorrect" });
      }
    });
  });
});

module.exports = router;
