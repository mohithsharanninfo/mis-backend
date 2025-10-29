const { sql, pool } = require('../../db');

const deliverySatus = async (req, res) => {

    const { fromDate, toDate } = req.query;
    try {
        const request = pool.request();

        if (fromDate) request.input('FromDate', sql.DateTime, fromDate);
        if (toDate) request.input('ToDate', sql.DateTime, toDate);

        const result = await request.query(`
            SELECT
                s.ecomorderid,
                s.Orderrefno,
                
                -- SHIPPED info----
                s.AwNo,
                s.logisticPartner,
                s.Createdon AS ShippedOn,
                s.Status ,

                -- DELIVERED info---
                d.Createdon AS DeliveredOn,
                d.Status AS Delivered_Message

                FROM Ecom_Tran_Status s
                LEFT JOIN Ecom_Tran_Status d 
                    ON s.ecomorderid = d.ecomorderid
                    AND d.Status = 'DELIVERED'
                WHERE s.Status = 'SHIPPED'
                AND LTRIM(RTRIM(ISNULL(s.AwNo, ''))) <> '' AND  s.Createdon >= @FromDate AND  s.Createdon < DATEADD(DAY, 1, @ToDate)
        `);

        res.setHeader('Cache-Control', 'no-store')

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
                s.ecomorderid,
                s.Orderrefno,
                
                -- SHIPPED info----
                s.AwNo,
                s.logisticPartner,
                s.Createdon AS ShippedOn,
                s.Status ,

                -- DELIVERED info---
                d.Createdon AS DeliveredOn,
                d.Status AS Delivered_Message

                FROM Ecom_Tran_Status s
                LEFT JOIN Ecom_Tran_Status d 
                    ON s.ecomorderid = d.ecomorderid
                    AND d.Status = 'DELIVERED'
                WHERE s.Status = 'SHIPPED'
                AND LTRIM(RTRIM(ISNULL(s.AwNo, ''))) <> '' AND (@search IS NULL OR s.ecomorderid = @search OR  s.AwNo = @search)
      `);

        res.json({ success: true, data: result?.recordset });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
};

module.exports = { deliverySatus, searchOrderstatus }