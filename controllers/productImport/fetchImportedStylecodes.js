const { sql, pool } = require('../../db');

const fetchImportedProducts = async (req, res) => {
  try {
    const { fromDate, toDate,Locale } = req.query;

    const request = pool.request();

     request.input('Locale', sql.NVarChar(10), Locale)
     request.input('FromDate', sql.DateTime, fromDate)
     request.input('ToDate', sql.DateTime, toDate)

    const result = await request.query(`SELECT * FROM dbo.fnGetImportedProducts(@Locale, @FromDate, @ToDate)`);

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


// const fetchImportedProductsSg = async (req, res) => {
//   try {
//     const { fromDate, toDate } = req.query;

//     const request = pool.request();

//     if (fromDate) request.input('FromDate', sql.DateTime, fromDate);
//     if (toDate) request.input('ToDate', sql.DateTime, toDate);

//     const result = await request.execute('dbo.GetImportedProductsSg');

//     res.setHeader('Cache-Control', 'no-store')

//     res.status(200).json({
//       success: true,
//       count: result.recordset.length,
//       data: result.recordset,
//     });
//   } catch (error) {
//     console.error('❌ Error fetching imported products:', error);
//     res.status(500).json({ success: false, message: error.message });
//   }
// };

const checkImportedStylecode = async (req, res) => {
  try {
    const { Stylecode, sku } = req.body;

    const request = pool.request();
    request.input('Stylecode', sql.VarChar(50), Stylecode);
    request.input('Sku', sql.VarChar(30), sku);

    const checkCoins = await request.query(`select * from KSTU_SKU_MASTER where SKU_ID=@Sku`)

    if (checkCoins?.recordset?.length > 0) {
      const result = await request.query(`
        select distinct
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
          kbm.branch_code from mis.marketplacecatalog mc inner join 
      mis.marketplacecatalog_stylecode_attributes mcs on mc.StyleCode=mcs.StyleCode 
      inner join KTTU_BARCODE_MASTER kbm
      on  mc.StyleCode=kbm.StyleCode 
      inner join mis.stylecodeimageurl mi on mc.StyleCode=mi.StyleCode
               inner join KSTU_SKU_MASTER ksm on mc.SKU = ksm.SKU_ID
      where  mc.IsActive=1 and MarketPlaceCode='BHIMA' and  IsApproved= 2 and sold_flag='N' and order_no='0' and IsStock=1 
      and mc.productPushed = 2 and mc.StyleCode=@Stylecode and ksm.SKU_ID=@Sku`)

      res.status(200).json({
        success: true,
        count: result.recordset.length,
        data: result.recordset || null,
      });


    } else {
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
              kbm.branch_code from mis.marketplacecatalog mc inner join 
          mis.marketplacecatalog_stylecode_attributes mcs on mc.StyleCode=mcs.StyleCode 
          inner join KTTU_BARCODE_MASTER kbm
          on  mc.SKU=kbm.barcode_no 
          inner join mis.stylecodeimageurl mi on mc.StyleCode=mi.StyleCode
          inner join KTTU_BARCODE_PRODUCT_DETAILS kp on kp.barcode_no=kbm.barcode_no
          where  mc.IsActive=1 and MarketPlaceCode='BHIMA' and  IsApproved= 2 and sold_flag='N' and order_no='0' and IsStock=1 
          and mc.productPushed = 2 and mc.StyleCode=@Stylecode and kbm.barcode_no=@Sku`);

      res.status(200).json({
        success: true,
        count: result.recordset.length,
        data: result.recordset || null,
      });
    }

  } catch (error) {
    console.error('❌ Error checking imported stylecode:', error);
    throw error;
  }
}

module.exports = {
  fetchImportedProducts,
  checkImportedStylecode
}
