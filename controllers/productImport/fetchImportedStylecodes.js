const { sql, pool } = require('../../db');

const fetchImportedProducts = async (req, res) => {
  try {
    const { fromDate, toDate } = req.query;

    const request = pool.request();

    if (fromDate) request.input('FromDate', sql.DateTime, fromDate);
    if (toDate) request.input('ToDate', sql.DateTime, toDate);

    const result = await request.execute('dbo.GetImportedProductsIn');

    res.setHeader('Cache-Control', 'no-store')

    res.status(200).json({
      success: true,
      count: result.recordset.length,
      data: result.recordset,
    });
  } catch (error) {
    console.error('❌ Error fetching imported products:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};


const fetchImportedProductsSg = async (req, res) => {
  try {
    const { fromDate, toDate } = req.query;

    const request = pool.request();

    if (fromDate) request.input('FromDate', sql.DateTime, fromDate);
    if (toDate) request.input('ToDate', sql.DateTime, toDate);

    const result = await request.execute('dbo.GetImportedProductsSg');

    res.setHeader('Cache-Control', 'no-store')

    res.status(200).json({
      success: true,
      count: result.recordset.length,
      data: result.recordset,
    });
  } catch (error) {
    console.error('❌ Error fetching imported products:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const checkImportedStylecode = async (req,res) => {
  try {
    const { Stylecode, sku, listingBranchCode } = req.body;

    const request = pool.request();
    request.input('Stylecode', sql.VarChar(50), Stylecode);
    request.input('Sku', sql.VarChar(30), sku);
    request.input('ListingBranchCode', sql.VarChar(10), listingBranchCode);

    const result = await request.query(`select distinct
              kbm.sold_flag,
              kbm.order_no,
              kbm.barcode_no,
              kbm.StyleCode,
              mc.isstock,
              mc.islock,
              mc.isactive,
              mc.productpushed,
              mc.LocaleIN,
              mc.LocaleSG,
              mc.ListingBranchCode,
              mcs.isapproved,
              mcs.productpushed as mcs_productpushed,
              mcs.LocaleIN as mcs_LocaleIN,
              mcs.LocaleSG as mcs_LocaleSG,
              mi.ImageURL,
              kbm.branch_code from mis.marketplacecatalog mc inner join 
          mis.marketplacecatalog_stylecode_attributes mcs on mc.StyleCode=mcs.StyleCode 
          inner join KTTU_BARCODE_MASTER kbm
          on  mc.SKU=kbm.barcode_no 
          inner join mis.stylecodeimageurl mi on mc.StyleCode=mi.StyleCode
          inner join KTTU_BARCODE_PRODUCT_DETAILS kp on kp.barcode_no=kbm.barcode_no
          where  mc.IsActive=1 and MarketPlaceCode='BHIMA' and  IsApproved= 2 and sold_flag='N' and order_no='0' and IsStock=1 
          and mc.productPushed = 2 and mc.StyleCode=@Stylecode and kbm.barcode_no=@Sku and mi.SlNo='1'`);

    res.status(200).json({
      success: true,
      count: result.recordset.length,
      data: result.recordset || null,
    });

  } catch (error) {
    console.error('❌ Error checking imported stylecode:', error);
    throw error;
  }
}

module.exports = {
  fetchImportedProducts,
  fetchImportedProductsSg,
  checkImportedStylecode
}
