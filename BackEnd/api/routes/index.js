
const router = require('express').Router();


router.use(require('./file-folder.routes'));

// user routes
router.use('/api/users', require('./user.routes'));


module.exports = router;

