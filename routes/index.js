const express = require('express');
const { loginController, getUserDetails, logoutUser } = require('../controllers/logincontroller');
const userVerification = require('../middleware/userverification');
const { fetchStylecodeImages, fetchProductImage } = require('../controllers/productImport/fetchstylecodeImage');
const { sendStylecodesToApi, reImportStylecode } = require('../controllers/productImport/importstylecode');
const { fetchImportedProducts, fetchImportedProductsSg, checkImportedStylecode } = require('../controllers/productImport/fetchImportedStylecodes');
const { stylecodeSearchIn, stylecodeSearchSg, stylecodeSearchImportflow } = require('../controllers/productImport/stylecodeSearch');
const { searchOrderstatus, shipmentSatus } = require('../controllers/orders/shipmentStatus');
const { pickedItemsOnly } = require('../controllers/orders/pickedItems');

const router = express.Router();

//////////////Auth routes ////////////
router.post('/login',loginController);
router.post('/logout', logoutUser);
router.get('/getuserdetails', userVerification, getUserDetails)


/////////////Product import related routes //////////////////
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


////////////////Orders related ///////////////
router.get('/shipmentStatus',shipmentSatus)
router.get('/searchStatus',searchOrderstatus)
router.get('/onlypickedItems',pickedItemsOnly)


module.exports = router;