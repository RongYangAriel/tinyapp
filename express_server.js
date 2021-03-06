const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const bodyParser = require("body-parser");
const cookieSession = require('cookie-session');
const bcrypt = require('bcrypt');
const saltRounds = 10;
const getUserByEmail = require('./helpers');


app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieSession({
  name: 'session',
  keys: ["abcd"],
  // Cookie Options
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}));

const urlDatabase = {
  b6UTxQ: { longURL: "https://www.tsn.ca", userID: "aJ48lW" },
  i3BoGr: { longURL: "https://www.google.ca", userID: "aJ48lW" }
};

const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
};

const urlsForUser = (id) => {
  let userUrls = {};
  Object.keys(urlDatabase).forEach(key => {
    if (urlDatabase[key].userID === id) {
      console.log(urlDatabase[key]);
      userUrls[key] = {
        longURL: urlDatabase[key].longURL,
        userID: id
      };
    }
  });
  return userUrls;
};

console.log(urlsForUser("aJ48lW"));

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

// render urls_index page
app.get('/urls', (req, res) => {
  console.log('moving to urls', req.cookies);
  console.log(urlDatabase);
  let userID = req.session["user_id"];
  let templateVars = { urls: urlsForUser(userID),
    user: users[userID]};
  res.render('urls_index', templateVars);
});

// render urls_new page
app.get("/urls/new", (req, res) => {
  if (req.session["user_id"]) {
    let templateVars = {user: users[req.session["user_id"]]};
    res.render("urls_new", templateVars);
  } else {
    res.redirect("/login");
  }
 
});

// redirect shortURL to origin longURL page
app.get("/u/:shortURL", (req, res) => {
  let longURL = urlDatabase[req.params.shortURL].longURL;
  console.log(`longURL is ${longURL}`);
  res.redirect(longURL);
});

// render urls_show page
app.get("/urls/:shortURL", (req, res) => {
  let userID = req.session["user_id"];
  let shortURL = req.params.shortURL;
  if (shortURL in urlsForUser(userID)) {
    const templateVars = { shortURL: shortURL,
      longURL: urlDatabase[shortURL].longURL,
      user: users[userID]};
    //res.render("urls_show", templateVars);
    res.render("urls_show", templateVars);
    // res.redirect(longURL);
  } else {
    res.send("Please log in first");
  }
});

//add new url
app.post("/urls", (req, res) => {
  let shortURL = generateRandomString(6);
  urlDatabase[shortURL] = {
    longURL: req.body.longURL,
    userID: req.session["user_id"]
  };
  res.redirect("/urls/" + shortURL);
});

//delete url
app.post("/urls/:shortURL/delete", (req, res) => {
  let userID = req.session["user_id"];
  let shortURL = req.params.shortURL;
  if (shortURL in urlsForUser(userID)) {
    delete urlDatabase[req.params.shortURL];
    res.redirect("/urls");
  } else {
    res.status(403);
  }
});

//update long URL
app.post("/urls/:shortURL/update", (req, res) => {
  let shortURL = req.params.shortURL;
  let newLongURL = req.body.updatedLongURL;
  let userID = req.session["user_id"];
 
  if (shortURL in urlsForUser(userID)) {
    urlDatabase[shortURL] = {
      longURL: newLongURL,
      userID: userID
    };
    const templateVars = { shortURL: shortURL,
      longURL: newLongURL,
      user: users.userID};
    //res.render("urls_show", templateVars);
    res.render("urls_show", templateVars);
  } else {
    res.status(403);
  }
});

// submit login
app.post("/login", (req, res) => {
  console.log(getUserByEmail(req.body.email, users));
  if (getUserByEmail(req.body.email, users)) {
    let user = users[getUserByEmail(req.body.email, users)];
    console.log(user);
    if (bcrypt.compareSync(req.body.password, user.password)) {
      req.session["user_id"] = user.id;
      res.redirect("/urls");
    } else {
      res.status(403);
      res.send("Password is wrong!");
    }
  } else {
    res.status(403);
    res.send("Email doesn't exist");
  }
});

app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/urls");
});

app.get("/register", (req, res) => {
  console.log('get in register');
  let templateVars = {
    user: users[req.session["user_id"]]
  };
  res.render("register", templateVars);
});

//submit user register
app.post("/register", (req, res) => {
  if (req.body.email === '' || req.body.password === '') {
    res.status(400);
    res.send('email or password is empty!');
  } else if (getUserByEmail(req.body.email, users)) {
    res.status(400);
    res.send("Email is taken! Try again!");
  } else {
    let user = {
      id: generateRandomString(8),
      email: req.body.email,
      password: bcrypt.hashSync(req.body.password, saltRounds)
    };
    users[user.id] = user;
    req.session["user_id"] = user.id;
    console.log(users);
    res.redirect("/urls");
  }
});

// render login page
app.get("/login", (req, res) => {
  let templateVars = {
    user: users[req.session['user_id']]
  };
  res.render('login', templateVars);
});


//helper function - generate randome string
const generateRandomString = (length) => {
  let result           = '';
  let characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
};

