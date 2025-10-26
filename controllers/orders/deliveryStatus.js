const { sql, pool } = require('../../db');

const deliverySatus = async (req, res) => {

    const { fromDate, toDate } = req.query;
    try {
        const request = pool.request();

        if (fromDate) request.input('FromDate', sql.DateTime, fromDate);
        if (toDate) request.input('ToDate', sql.DateTime, toDate);

        const result = await request.query(`
            select od.barcode_no, OrderStatus,om.order_no,mobile_no,cust_name,delivery_date,Logistics,om.branch_order_no,Awno from OrderMaster om 
             join  orderdetails od ON om.order_no = od.order_no where order_date BETWEEN @FromDate AND @ToDate`
        );

        res.status(200).json({ success: true, data: result?.recordset });

    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error' });
        throw err;
    }
}


// API: search orders by order number or mobile
const searchOrderstatus = async (req, res) => {
    const search = req.query.search || null; // get search from query params

    try {
        const request = pool.request();
        request.input('search', sql.VarChar, search)

        const result = await request.query(`
        SELECT 
            od.barcode_no,
            om.OrderStatus,
            om.order_no,
            om.mobile_no,
            om.cust_name,
            om.delivery_date,
            om.Logistics,
            om.Awno
        FROM OrderMaster om
        JOIN orderdetails od ON om.order_no = od.order_no
        WHERE (@search IS NULL OR om.order_no = @search OR  od.barcode_no = @search)
      `);

        res.json({ success: true, data: result?.recordset });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
};

module.exports = { deliverySatus, searchOrderstatus }