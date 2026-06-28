const bcrypt = require('bcryptjs');
const password = '123456789';
const hash = bcrypt.hashSync(password, 10);
console.log(hash);
