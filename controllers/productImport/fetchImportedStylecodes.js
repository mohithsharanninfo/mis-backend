 const { sql, pool } = require('../../db');
 
 const fetchImportedProducts = async (req, res) => {
  try {
    const { fromDate, toDate } = req.query; 

    const request = pool.request();

    if (fromDate) request.input('FromDate', sql.DateTime, fromDate);
    if (toDate) request.input('ToDate', sql.DateTime, toDate);

    const result = await request.execute('dbo.GetImportedProductsIn');

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

module.exports = {
    fetchImportedProducts,
    fetchImportedProductsSg
}
