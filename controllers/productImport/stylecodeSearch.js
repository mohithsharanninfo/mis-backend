const { sql, pool } = require('../../db');

const stylecodeSearchIn = async (req, res) => {
    try {
        const { searchTerm } = req.query;

        if (!searchTerm) {
            return res.status(400).json({ success: false, message: 'Search term is required' });
        }

        let request = pool.request();
        request.input('searchTerm', sql.VarChar, searchTerm);
        const result = await request.query(`
        SELECT 
        kbm.order_no,
        kbm.sold_flag,
        kbm.barcode_no,
        kbm.StyleCode,
        kbm.branch_code,
        mpc.isstock,
        mpc.islock,
        mpc.isactive,
        mpc.productpushed,
        mpc.LocaleIN AS mpc_LocaleIN,
        mpcsa.productpushed AS mpcsa_productPushed,
        mpcsa.isapproved,
        mpcsa.ExportedUrlKey,
        mpcsa.LocaleIN
    FROM 
        KTTU_BARCODE_MASTER AS kbm
        INNER JOIN mis.MarketPlaceCatalog AS mpc 
            ON kbm.barcode_no = mpc.sku
        INNER JOIN mis.MarketPlaceCatalog_StyleCode_Attributes AS mpcsa 
            ON mpc.StyleCode = mpcsa.StyleCode
     WHERE 
    mpc.productPushed = '2' and  mpc.LocaleIN ='en-IN' and
    mpcsa.productPushed = '2' and mpcsa.LocaleIN ='en-IN'  and mpcsa.ExportedUrlKey IS NOT NULL
    and mpc.StyleCode 
    in(select Stylecode from ImportedStylecodesIn_Sg where IsImported = '1' and Stylecode = @searchTerm)`);

        const response = result.recordset;

        res.status(200).json({
            success: true,
            count: response?.length,
            data: response,
        });

    } catch (err) {
        console.error('❌ Error searching stylecodes:', err);
        res.status(500).json({ success: false, message: err.message });
    }
}


const stylecodeSearchSg = async (req, res) => {
    try {
        const { searchTerm } = req.query;

        if (!searchTerm) {
            return res.status(400).json({ success: false, message: 'Search term is required' });
        }

        let request = pool.request();
        request.input('searchTerm', sql.VarChar, searchTerm);
        const result = await request.query(`
            SELECT 
            kbm.order_no,
            kbm.sold_flag,
            kbm.barcode_no,
            kbm.StyleCode,
            kbm.branch_code,
            mpc.isstock,
            mpc.islock,
            mpc.isactive,
            mpc.productpushedsg,
            mpc.LocaleSG AS mpc_LocaleSG,
            mpcsa.productpushedsg AS mpcsa_productPushedsg,
            mpcsa.isapproved,
            mpcsa.ExportedUrlKey,
            mpcsa.LocaleSG
        FROM 
            KTTU_BARCODE_MASTER AS kbm
            INNER JOIN mis.MarketPlaceCatalog AS mpc 
                ON kbm.barcode_no = mpc.sku
            INNER JOIN mis.MarketPlaceCatalog_StyleCode_Attributes AS mpcsa 
                ON mpc.StyleCode = mpcsa.StyleCode
        WHERE 
        mpc.productpushedsg = '2' and  mpc.LocaleSG ='en-SG' and
        mpcsa.productpushedsg = '2' and mpcsa.LocaleSG ='en-SG'  and mpcsa.ExportedUrlKey IS NOT NULL
        and mpc.StyleCode 
            in(select Stylecode from ImportedStylecodesIn_Sg where IsImported = '1' and Stylecode = @searchTerm)`);

        const response = result.recordset;

        res.status(200).json({
            success: true,
            count: response?.length,
            data: response,
        });

    } catch (err) {
        console.error('❌ Error searching stylecodes:', err);
        res.status(500).json({ success: false, message: err.message });
    }
}

module.exports = { stylecodeSearchIn, stylecodeSearchSg }