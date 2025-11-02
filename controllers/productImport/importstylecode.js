const axios = require("axios");
const { sql, pool } = require("../../db");

async function getApiUrls() {
  const result = await pool.request().query(`
    SELECT TransType, URL 
    FROM EcomAPIURL 
    WHERE TransType IN ('Productimport_SG','Productimport_IN')
  `);

  return result.recordset.reduce((acc, row) => {
    acc[row.TransType] = row.URL;
    return acc;
  }, {});
}

async function updateLocalesInDatabase(selectedRows) {
  const connectedPool = await pool.connect();
  const transaction = new sql.Transaction(connectedPool);
  await transaction.begin();

  try {
    for (const row of selectedRows) {
      const { Stylecode, LocaleIN, LocaleSG, LocaleAE, LocaleUS } = row;

      const request = new sql.Request(transaction);
      request.input("stylecode", sql.VarChar, Stylecode);
      request.input("LocaleIN", sql.VarChar, LocaleIN ? "en-IN" : "");
      request.input("LocaleSG", sql.VarChar, LocaleSG ? "en-SG" : "");
      request.input("LocaleAE", sql.VarChar, LocaleAE ? "en-AE" : "");
      request.input("LocaleUS", sql.VarChar, LocaleUS ? "en-US" : "");

      await request.query(`
        UPDATE mis.marketplacecatalog_stylecode_attributes
        SET LocaleIN = @LocaleIN,
            LocaleSG = @LocaleSG,
            LocaleAE = @LocaleAE,
            LocaleUS = @LocaleUS
        WHERE stylecode = @stylecode;

        UPDATE mis.marketplacecatalog
        SET IsActive = '1'
        WHERE marketplacecode = 'Bhima' AND stylecode = @stylecode;
      `);
    }

    await transaction.commit();
  } catch (err) {
    await transaction.rollback();
    console.error("❌ Error during DB update:", err.message);
    throw err;
  }
}


async function insertImportedStylecode(stylecode, IsImported, LocaleIN, LocaleSG) {
  try {
    await pool
      .request()
      .input("Stylecode", sql.VarChar, stylecode)
      .input("IsImported", sql.Bit, IsImported)
      .input("LocaleIN", sql.Bit, LocaleIN)
      .input("LocaleSG", sql.Bit, LocaleSG)
      .query(
        `INSERT INTO ImportedStylecodesIn_Sg (Stylecode, IsImported, LocaleIN, LocaleSG)
         VALUES (@Stylecode, @IsImported, @LocaleIN, @LocaleSG)`
      );
  } catch (err) {
    console.error("Error inserting imported stylecode:", err);
  }
}

async function sendStylecodesToApi(req, res) {
  const { jsonPayload } = req.body;
  const failedStylecodes = [];

  try {
    const apiUrls = await getApiUrls();

    const batchSize = 10;
    const apiCalls = [];

    const stylecodes = jsonPayload.map(item => item.Stylecode);
    const sku = jsonPayload.map(item => item.Sku);

    const stylecodeList = stylecodes.map(s => `'${s.replace(/'/g, "''")}'`).join(",");
    const skuList = sku.map(s => `'${s.replace(/'/g, "''")}'`).join(",");

    const query = `
      SELECT StyleCode, MarketPlaceCode,LocaleIN, LocaleSG
      FROM mis.MarketPlaceCatalog
      WHERE MarketPlaceCode = 'BHIMA'
      AND StyleCode IN (${stylecodeList}) AND Sku IN (${skuList})
    `;

    const dbResult = await pool.request().query(query);

    const dbMap = new Map();

    for (const row of dbResult?.recordset || []) {
      dbMap.set(row.StyleCode, {
        Locale_IN: row.LocaleIN,
        Locale_SG: row.LocaleSG,
      });
    }

    const matchedRecords = jsonPayload.filter((item) => dbMap.has(item.Stylecode));

    const mergedRecords = matchedRecords.map((item) => ({
      ...item,
      ...dbMap.get(item.Stylecode),
    }));

    for (const item of mergedRecords) {
      const payload = JSON.stringify([item]);
      const { Stylecode, LocaleIN, LocaleSG, Locale_IN, Locale_SG } = item;

      if (LocaleIN == 1 && Locale_IN == 'en-IN') {
        apiCalls.push({
          Stylecode,
          locale: "IN",
          promise: axios
            .post(apiUrls.Productimport_IN, payload, {
              headers: { "Content-Type": "application/json" },
            }).then((response) => {
              if (response?.data && response?.data?.success) {
                insertImportedStylecode(Stylecode, 1, LocaleIN, LocaleSG)
              } else {
                insertImportedStylecode(Stylecode, 0, LocaleIN, LocaleSG)
                failedStylecodes.push({
                  Stylecode,
                  reason: `API error (IN) - ${response.data.message || 'Unknown error'}`,
                });
              }
            })
            .catch((err) => {
              insertImportedStylecode(Stylecode, 0, LocaleIN, LocaleSG)
              failedStylecodes.push({
                Stylecode,
                reason: `API error (IN) - ${err.message}`,
              });
            }),
        });
      }

      if (LocaleSG == 1 && Locale_SG == 'en-SG') {
        apiCalls.push({
          Stylecode,
          locale: "SG",
          promise: axios
            .post(apiUrls.Productimport_IN, payload, {
              headers: { "Content-Type": "application/json" },
            }).then((response) => {
              if (response?.data && response?.data?.success) {
                insertImportedStylecode(Stylecode, 1, LocaleIN, LocaleSG)
              } else {
                insertImportedStylecode(Stylecode, 0, LocaleIN, LocaleSG)
                failedStylecodes.push({
                  Stylecode,
                  reason: `API error (SG) - ${response.data.message || 'Unknown error'}`,
                });
              }
            })
            .catch((err) => {
              insertImportedStylecode(Stylecode, 0, LocaleIN, LocaleSG)
              failedStylecodes.push({
                Stylecode,
                reason: `API error (SG) - ${err.message}`,
              });
            }),
        });
      }
    }

    // Process in controlled batches
    for (let i = 0; i < apiCalls.length; i += batchSize) {
      const batch = apiCalls.slice(i, i + batchSize);
      await Promise.allSettled(batch.map((b) => b.promise));
    }

    await updateLocalesInDatabase(mergedRecords);

    const successCount = mergedRecords?.length - failedStylecodes?.length;

    res.setHeader('Cache-Control', 'no-store')

    res.status(200).json({
      success: failedStylecodes.length === 0,
      message: `Import completed: ${successCount}/${jsonPayload.length} succeeded.`,
      failedStylecodes,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Import failed unexpectedly",
      error: err.message,
      failedStylecodes,
    });
  }
}



const reImportStylecode = async (req, res) => {
  try {

    const { Stylecode } = req.body;

    let request = pool.request();

     request.input(`Stylecode`, sql.VarChar, Stylecode)

    const result = await request.query(`SELECT * FROM mis.vStylecodeBarcodeData WHERE Stylecode=@Stylecode`);

    const mergedData = result?.recordset.map(row => {
   
      return {
        ...row,
        ...req.body
      };
    });
    
    const apiUrls = await getApiUrls();

    const response = await axios.post(apiUrls.Productimport_IN, mergedData, {
      headers: { "Content-Type": "application/json" },
    });

    if (response?.data && response.data.success) {

      await updateLocalesInDatabase(mergedData);

      res.setHeader('Cache-Control', 'no-store')

      res.status(200).json({
        success: true,
        message: "Re-import successful.",
      });
    }

  } catch (err) {
    console.error("Re-import failed:", err);
    res.status(500).json({
      success: false,
      message: "Import failed unexpectedly",
      error: err.message,
    });
  }
};


module.exports = { sendStylecodesToApi,reImportStylecode };
