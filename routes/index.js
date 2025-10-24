const express = require('express');
const { loginController, getUserDetails } = require('../controllers/logincontroller');
const userVerification = require('../middleware/userverification');
const { fetchStylecodeImages } = require('../controllers/fetchstylecodeImage');
const { sendStylecodesToApi } = require('../controllers/importstylecode');
const { fetchImportedProducts, fetchImportedProductsSg } = require('../controllers/fetchImportedStylecodes');
const { stylecodeSearchIn, stylecodeSearchSg } = require('../controllers/stylecodeSearch');

const router = express.Router();

router.post('/login',loginController);
router.get('/getuserdetails', userVerification, getUserDetails)
router.post('/getStylecodeImages', fetchStylecodeImages)
router.post('/importStylecode', sendStylecodesToApi)
router.get('/importedProducts',fetchImportedProducts)
router.get('/importedProductsSg',fetchImportedProductsSg)

router.get('/searchstylecodeIn',stylecodeSearchIn)
router.get('/searchstylecodeSg',stylecodeSearchSg)

module.exports = router;