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

// async function sendStylecodesToApi(req, res) {
//   const { jsonPayload } = req.body;
//   const failedStylecodes = [];

//   try {
//     const apiUrls = await getApiUrls();

//     const batchSize = 10;
//     const apiCalls = [];

//     for (const item of jsonPayload) {
//       //const payload = JSON.stringify([item]);
//       const { Stylecode, Sku, LocaleIN, LocaleSG } = item;

//       if (LocaleIN == 1) {
//         const checklocaleIn = await pool.request().
//           query(`select * from mis.MarketPlaceCatalog where MarketPlaceCode='BHIMA' AND StyleCode='${Stylecode}' AND SKU='${Sku}' AND LocaleIN='en-IN'`);

//         for (const value of checklocaleIn?.recordset) {
//           const payload = JSON.stringify([value]);
//           const { Stylecode, LocaleIN, LocaleSG } = value;
//           apiCalls.push({
//             Stylecode,
//             locale: "IN",
//             promise: axios
//               .post(apiUrls?.Productimport_IN, payload, {
//                 headers: { "Content-Type": "application/json" },
//               }).then((response) => {
//                 if (response?.data && response?.data?.success) {
//                   insertImportedStylecode(Stylecode, 1, LocaleIN, LocaleSG)
//                 } else {
//                   insertImportedStylecode(Stylecode, 0, LocaleIN, LocaleSG)
//                   failedStylecodes.push({
//                     Stylecode,
//                     reason: `API error (IN) - ${response.data.message || 'Unknown error'}`,
//                   });
//                 }
//               })
//               .catch((err) => {
//                 insertImportedStylecode(Stylecode, 0, LocaleIN, LocaleSG)
//                 failedStylecodes.push({
//                   Stylecode,
//                   reason: `API error (IN) - ${err.message}`,
//                 });
//               }),
//           });
//         }
//       }

//       if (LocaleSG == 1) {
//         const checklocaleSg = await pool.request().
//           query(`select * from mis.MarketPlaceCatalog where MarketPlaceCode='BHIMA' AND StyleCode='${Stylecode}' AND SKU='${Sku}' AND LocaleIN='en-SG'`);
//         for (const value of checklocaleSg?.recordset) {
//           const payload = JSON.stringify([value]);
//           const { Stylecode, LocaleIN, LocaleSG } = value;

//           apiCalls.push({
//             Stylecode,
//             locale: "SG",
//             promise: axios
//               .post(apiUrls?.Productimport_IN, payload, {
//                 headers: { "Content-Type": "application/json" },
//               }).then((response) => {
//                 if (response?.data && response?.data?.success) {
//                   insertImportedStylecode(Stylecode, 1, LocaleIN, LocaleSG)
//                 } else {
//                   insertImportedStylecode(Stylecode, 0, LocaleIN, LocaleSG)
//                   failedStylecodes.push({
//                     Stylecode,
//                     reason: `API error (SG) - ${response.data.message || 'Unknown error'}`,
//                   });
//                 }
//               })
//               .catch((err) => {
//                 insertImportedStylecode(Stylecode, 0, LocaleIN, LocaleSG)
//                 failedStylecodes.push({
//                   Stylecode,
//                   reason: `API error (SG) - ${err.message}`,
//                 });
//               }),
//           });
//         }

//       }
//     }

//     // Process in controlled batches
//     for (let i = 0; i < apiCalls.length; i += batchSize) {
//       const batch = apiCalls.slice(i, i + batchSize);
//       await Promise.allSettled(batch.map((b) => b.promise));
//     }

//     await updateLocalesInDatabase(jsonPayload);

//     const successCount = jsonPayload.length - failedStylecodes.length;

//     res.setHeader('Cache-Control', 'no-store')

//     res.status(200).json({
//       success: failedStylecodes.length === 0,
//       message: `Import completed: ${successCount}/${jsonPayload.length} succeeded.`,
//       failedStylecodes,
//     });
//   } catch (err) {
//     res.status(500).json({
//       success: false,
//       message: "Import failed unexpectedly",
//       error: err.message,
//       failedStylecodes,
//     });
//   }
// }

async function sendStylecodesToApi(req, res) {
  const { jsonPayload } = req.body;
  const failedStylecodes = [];
  const batchSize = 10;

  try {
    const apiUrls = await getApiUrls();

    // Collect all stylecodes and skus to query in one go
    const stylecodes = jsonPayload.map(i => i.Stylecode);
    const skus = jsonPayload.map(i => i.Sku);

    // 1️⃣ Fetch all catalog data in a single query
    const styleList = stylecodes.map(s => `'${s}'`).join(',');
    const skuList = skus.map(s => `'${s}'`).join(',');

    const catalogQuery = `
      SELECT * FROM mis.MarketPlaceCatalog
      WHERE MarketPlaceCode='BHIMA'
      AND StyleCode IN (${styleList})
      AND SKU IN (${skuList})
    `;
    const catalogData = await pool.request().query(catalogQuery);

    // Index results by Stylecode+SKU for quick lookup
    const catalogMap = new Map();
    for (const row of catalogData.recordset) {
      catalogMap.set(`${row.StyleCode}_${row.SKU}_${row.LocaleIN}`, row);
      catalogMap.set(`${row.StyleCode}_${row.SKU}_${row.LocaleSG}`, row);
    }

    const apiCalls = [];

    // 2️⃣ Build API call promises
    for (const item of jsonPayload) {
      const { Stylecode, Sku, LocaleIN, LocaleSG } = item;

      const handleLocale = async (localeKey, localeName, apiUrl) => {
        const dataKey = `${Stylecode}_${Sku}_${localeKey}`;
        const value = catalogMap.get(dataKey);
        if (!value) return;

        const payload = JSON.stringify([value]);

        try {
          const response = await axios.post(apiUrl, payload, {
            headers: { "Content-Type": "application/json" },
          });

          if (response?.data?.success) {
            await insertImportedStylecode(Stylecode, 1, LocaleIN, LocaleSG);
          } else {
            await insertImportedStylecode(Stylecode, 0, LocaleIN, LocaleSG);
            failedStylecodes.push({
              Stylecode,
              reason: `API error (${localeName}) - ${response.data.message || 'Unknown error'}`,
            });
          }
        } catch (err) {
          await insertImportedStylecode(Stylecode, 0, LocaleIN, LocaleSG);
          failedStylecodes.push({
            Stylecode,
            reason: `API error (${localeName}) - ${err.message}`,
          });
        }
      };

      if (LocaleIN == 1)
        apiCalls.push(() => handleLocale('en-IN', 'IN', apiUrls?.Productimport_IN));

      if (LocaleSG == 1)
        apiCalls.push(() => handleLocale('en-SG', 'SG', apiUrls?.Productimport_IN));
    }

    // 3️⃣ Execute in batches of 10 for concurrency safety
    for (let i = 0; i < apiCalls.length; i += batchSize) {
      const batch = apiCalls.slice(i, i + batchSize);
      await Promise.allSettled(batch.map(fn => fn()));
    }

    // 4️⃣ Final bulk update
    await updateLocalesInDatabase(jsonPayload);

    const successCount = jsonPayload.length - failedStylecodes.length;
    res.setHeader('Cache-Control', 'no-store');

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

module.exports = { sendStylecodesToApi };
