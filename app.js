require('dotenv').config();
const express = require("express");
const app = express();
const mongoose = require("mongoose");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const GitHubStrategy = require("passport-github2").Strategy;
const session = require("express-session");
const flash = require("connect-flash");
const path = require("path");
const methodOverride = require("method-override");
const cookieParser = require("cookie-parser");
const User = require("./models/users.js");

// MongoDB Connection
mongoose.connect("mongodb://127.0.0.1:27017/cognifyz")
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.error(err));

// View Engine
app.engine("ejs", require("ejs-mate"));
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname, "public")));
app.use(cookieParser());

const sessionConfig = {
  secret: "ourFirstProject",
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
    maxAge: 1000 * 60 * 60 * 24 * 7,
  },
};
app.use(session(sessionConfig));
app.use(flash());

// Passport Setup
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// GitHub OAuth Strategy
passport.use(new GitHubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/github/callback"
}, async (accessToken, refreshToken, profile, done) => {
    try {
        let user = await User.findOne({ username: profile.username });
        if (!user) {
            user = new User({
                username: profile.username,
                email: profile._json.email || "default@email.com",
                dob: "2000-01-01",
                phone: "0000000000",
                country: "GitHub"
            });
            user = await User.register(user, "github_oauth_pass");
        }
        return done(null, user);
    } catch (err) {
        return done(err);
    }
}));


// Flash messages & user in views
app.use((req, res, next) => {
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    res.locals.currUser = req.user;
    next();
});

// Auth Middleware
const isLoggedIn = (req, res, next) => {
    if (!req.isAuthenticated()) {
        req.session.redirectUrl = req.originalUrl;
        req.flash("error", "You must be logged in.");
        return res.redirect("/login");
    }
    next();
};

const saveRedirectUrl = (req,res,next)=>{
    if(req.session.redirectUrl){
        res.locals.redirectUrl = req.session.redirectUrl;
    }
    next();
}

const isAuthor = async(req, res, next)=>{
    let {id} = req.params;
    const user = await User.findById(id);

    if(!user){
        return res.status(404).send("Resource not found");
    }
    if (!req.user || !user._id.equals(req.user._id)) {
        req.flash("error", "To edit/delete you must be the one who registered.");
        let redirectUrl = res.locals.redirectUrl || "/register";
        return res.redirect(redirectUrl);
    }
    next();
}

// app.get("/", (req, res) => {
//   res.render("home", { currUser: req.user || null });
// });

// Routes
app.get("/", (req, res) => res.render("home"));

app.get("/register", (req, res) => res.render("index"));

app.post("/submit", async (req, res, next) => {
    try {
        const { username, email, dob, password, phone, country } = req.body;

        if (!username || !email || password.length < 6) {
            return res.render("register", { error: "Invalid input", submitted: false });
        }

        const user = new User({ username, email, dob, phone, country });
        const registeredUser = await User.register(user, password);

        req.login(registeredUser, err => {
            if (err) return next(err);
            req.flash("success", "Welcome to Cognifyz!");
            res.render("submit", { username, email });
        });
    } catch (err) {
        next(err);
    }
});

app.get("/login", (req, res) => res.render("login"));

app.get("/login", (req,res)=>{
    res.render("login")
})

app.post("/login",saveRedirectUrl,
    passport.authenticate("local",{
        failureRedirect: '/login', 
        failureFlash : true,
    }),
    async (req, res) => {
        try {
            req.flash("success", `Welcome back ${req.user.username}`);
            let redirectUrl = res.locals.redirectUrl || "/register";
            // console.log(redirectUrl);
            res.redirect(redirectUrl);
        } catch (err) {
            console.error("Error during login redirect:", err);
            req.flash("error", "Something went wrong. Please try again.");
            res.redirect("/login");
        }
    }  
)

app.get("/logout", (req, res, next) => {
    req.logout(err => {
        if (err) return next(err);
        req.flash("success", "Logged out successfully");
        res.redirect("/");
    });
});

app.get('/users', async(req,res)=>{
    try {
        const users = await User.find();
        res.render('users.ejs', { User: users });
    } catch (err) {
        res.status(500).send("Error fetching users");
    }
}) 

app.get("/users/:id", isLoggedIn, async(req,res)=>{
    try{
    const {id}= req.params;
    const user = await User.findById(id);
    if(!user){
        return res.status(404).send({message: "user not found"});
    }
    res.render("showUser", {user});
    }catch(err){
        res.status(500).send("Error fetching users");

    }
})

// UPDATE - Show edit form
app.get("/users/:id/edit",isLoggedIn,isAuthor, async (req, res) => {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) {
        return res.status(404).send("User not found");
    }
    res.render("editUser", { user });
});

// UPDATE - Submit edit form
app.put("/users/:id", async  (req, res) => {
    const { id } = req.params;
    let user = await User.findByIdAndUpdate(id,{...req.body.User});
    console.log(user);

    res.redirect(`/users/${id}`);
});


// DELETE - Delete user
app.delete("/users/:id", isLoggedIn, isAuthor, async(req, res) => {
    const { id } = req.params;
    let user = await User.findByIdAndDelete(id);
    res.redirect("/users");
});

// GitHub OAuth Routes
app.get("/auth/github", passport.authenticate("github", { scope: ["user:email"] }));
app.get("/auth/github/callback",
    passport.authenticate("github", {
        failureRedirect: "/login",
        failureFlash: true
    }),
    (req, res) => {
        req.flash("success", `Logged in as ${req.user.username}`);
        res.redirect("/register");
    }
);


const axios = require('axios');

const NEWS_API_KEY = process.env.NEWS_API_KEY;  
const NEWS_API_URL = 'https://newsapi.org/v2/top-headlines';

// Route to fetch news
app.get("/news", isLoggedIn, async (req, res) => {
  const category = req.query.category || "general"; 

  try {
    const response = await axios.get(NEWS_API_URL, {
      params: {
        apiKey: NEWS_API_KEY,
        country: 'us',
        category: category,
        pageSize: 10
      }
    });

    // Send the fetched articles to the front-end
    res.render("news", { articles: response.data.articles });
  } catch (error) {
    console.error('Error fetching news:', error);
    req.flash('error', 'Error fetching news');
    res.redirect('/');
  }
});

// Error handler
app.use((err, req, res, next) => {
    console.error("Unhandled error:", err.message);
    req.flash("error", "Something went wrong!");
    res.redirect("/");
});

app.listen(3000, () => {
    console.log("Server started at http://localhost:3000");
});