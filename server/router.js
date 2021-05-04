const express = require('express');
const router = express.Router();

router.get('/', (request, respose) => {
  respose.send('The server is working').status(200);
});

module.exports = router;
