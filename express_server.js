const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
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
}

// this function has issue
const emailExist = (email) => {
  for (let user in users) {
    if (users[user].email === email){
      return users[user].id
    }
  }
  return false;
}

console.log(emailExist("user2@example.com"));

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
  let templateVars = { urls: urlDatabase,
  user: users[req.cookies["user_id"]] };
  res.render('urls_index', templateVars);
});

// render urls_new page
app.get("/urls/new", (req, res) => {
  if(req.cookies["user_id"]){
     let templateVars = {user: users[req.cookies["user_id"]]}
    res.render("urls_new", templateVars);
  } else {
    res.redirect("/login");
  }
 
});

// redirect shortURL to longURL page
app.get("/u/:shortURL", (req, res) => {
  let longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

// render urls_show page
app.get("/urls/:shortURL", (req, res) => {
  const templateVars = { shortURL: req.params.shortURL, 
    longURL: urlDatabase[req.params.shortURL],
    user: users[req.cookies["user_id"]]
  };
  //res.render("urls_show", templateVars);
  const longURL = urlDatabase[req.params.shortURL];
  res.render("urls_show", templateVars);
  // res.redirect(longURL);
});

//add new url
app.post("/urls", (req, res) => {
  let shortURL = generateRandomString(6);
  urlDatabase[shortURL] = req.body.longURL;
  res.redirect("/urls/" + shortURL);
});

//delete url
app.post("/urls/:shortURL/delete", (req, res) => {
  delete urlDatabase[req.params.shortURL];
  res.redirect("/urls");
});

//update long URL
app.post("/urls/:shortURL/update", (req, res) => {
  const templateVars = { shortURL: req.params.shortURL, 
    longURL: req.body.updatedLongURL,
    user: users[req.cookies["user_id"]] };
  //res.render("urls_show", templateVars);
  res.render("urls_show", templateVars);
});

// submit login 
app.post("/login", (req, res) => {
  console.log(emailExist(req.body.email));
  if(emailExist(req.body.email)){
    let user = users[emailExist(req.body.email)];
    if(user.password === req.body.password){
      res.cookie("user_id", user.id);
      res.redirect("/urls");
    } else {
      res.status(403);
      res.send("Password is wrong!")
    }
  } else {
    res.status(403);
    res.send("Email doesn't exist")
  }
});

app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/urls");
});

app.get("/register", (req, res) => {
  console.log('get in register');
  let templateVars = {
    user: users[req.cookies["user_id"]]
  }
  res.render("register", templateVars);
});

app.post("/register", (req, res) => {
  if(req.body.email === '' || req.body.password === ''){
    res.status(400);
    res.send('email or password is empty!')
  } else if(emailExist(req.body.email)){
    res.status(400);
    res.send("Email is taken! Try again!")
  } else {
    let user = {
      id: generateRandomString(8),
      email: req.body.email,
      password: req.body.password
    };
    users[user.id] = user;
    res.cookie("user_id", user.id);
    console.log(users);
    res.redirect("/urls");
  }
});

app.get("/login", (req, res) => {
  let templateVars = {
    user: users[req.cookies['user_id']]
  };
  res.render('login', templateVars);
})

function generateRandomString(length) {
  var result           = '';
  var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  var charactersLength = characters.length;
  
  for ( var i = 0; i < length; i++ ) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

