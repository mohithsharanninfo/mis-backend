const express = require('express');
const { loginController, getUserDetails, logoutUser } = require('../controllers/logincontroller');
const userVerification = require('../middleware/userverification');
const { fetchStylecodeImages, fetchProductImage } = require('../controllers/productImport/fetchstylecodeImage');
const { sendStylecodesToApi, reImportStylecode } = require('../controllers/productImport/importstylecode');
const { fetchImportedProducts, fetchImportedProductsSg, checkImportedStylecode } = require('../controllers/productImport/fetchImportedStylecodes');
const { stylecodeSearchIn, stylecodeSearchSg, stylecodeSearchImportflow } = require('../controllers/productImport/stylecodeSearch');
const { deliverySatus, searchOrderstatus } = require('../controllers/orders/deliveryStatus');

const router = express.Router();

router.post('/login',loginController);
router.post('/logout', logoutUser);

router.get('/getuserdetails', userVerification, getUserDetails)

router.post('/getStylecodeImages', fetchStylecodeImages)
router.post('/getProductImages', fetchProductImage)

router.post('/importStylecode', sendStylecodesToApi)
router.get('/importedProducts',fetchImportedProducts)
router.get('/importedProductsSg',fetchImportedProductsSg)
router.post('/re_importStylecode',reImportStylecode)

router.get('/searchstylecodeIn',stylecodeSearchIn)
router.get('/searchstylecodeSg',stylecodeSearchSg)
router.get('/searchstylecodeCsv',stylecodeSearchImportflow)
router.post('/checkstylecodeimport',checkImportedStylecode)

router.get('/deliveryStatus',deliverySatus)
router.get('/searchStatus',searchOrderstatus)

module.exports = router;