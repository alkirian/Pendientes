const bcrypt = require('bcrypt');

async function hashPassword() {
    const password = 'password123';
    const hash = await bcrypt.hash(password, 10);
    console.log('HASH:', hash);
}

hashPassword();
