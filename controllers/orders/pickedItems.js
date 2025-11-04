const { sql, pool, poolBos } = require('../../db');

const pickedItemsOnly = async (req, res) => {
    try {
        const request = poolBos.request();

        const result = request.query(``)

    } catch (err) {
        throw new Error(err)
    }
}

module.exports = { pickedItemsOnly }