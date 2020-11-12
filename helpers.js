const getUserByEmail = (email, database) => {
  for (let user in database) {
    if (database[user].email === email){
      return database[user].id
    }
  }
  return false;
}


module.exports = getUserByEmail;