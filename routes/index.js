const express = require('express');
const { loginController, getUserDetails } = require('../controllers/logincontroller');
const userVerification = require('../middleware/userverification');
const { fetchStylecodeImages } = require('../controllers/fetchstylecodeImage');
const { sendStylecodesToApi } = require('../controllers/importstylecode');
const { fetchImportedProducts, fetchImportedProductsSg } = require('../controllers/fetchImportedStylecodes');

const router = express.Router();

router.post('/login',loginController);
router.get('/getuserdetails', userVerification, getUserDetails)
router.post('/getStylecodeImages', fetchStylecodeImages)
router.post('/importStylecode', sendStylecodesToApi)
router.get('/importedProducts',fetchImportedProducts)
router.get('/importedProductsSg',fetchImportedProductsSg)

module.exports = router;