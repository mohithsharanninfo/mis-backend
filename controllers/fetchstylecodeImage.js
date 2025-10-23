const { sql, pool } = require('../db');

const fetchStylecodeImages = async (req, res) => {
    try {
        const { stylecodes } = req.body;

        if (!stylecodes || stylecodes.length === 0) {
            return res.status(400).json({ success: false, message: 'No stylecodes provided' });
        }

        const stylecodeValues = stylecodes.map(item => item.Stylecode);

        let request = pool.request();

        stylecodeValues.forEach((code, index) => {
            request.input(`Stylecode${index}`, sql.VarChar, code);
        });

        const inClause = stylecodeValues.map((_, index) => `@Stylecode${index}`).join(',');

        const result = await request.query(`SELECT * FROM mis.vStylecodeBarcodeData WHERE Stylecode IN (${inClause})`);

        const mergedData = result?.recordset.map(row => {
        const match = stylecodes.find(item => item.Stylecode === row.Stylecode);

            return {
                ...row,
                ...match
            };
        });

        res.status(200).json({ success: true, data: mergedData });

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};



module.exports = { fetchStylecodeImages }