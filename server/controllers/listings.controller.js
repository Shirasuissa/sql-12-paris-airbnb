// Controller for /api/listings - reads req.query / req.params, validates, calls the DAL,
// sets the status code and sends JSON. No SQL here.
//
// Step 2: getListings(req, res)
//   - read neighbourhood, roomType, minPrice, maxPrice, sort, limit from req.query
//   - validate: limit (default 20, max 50), minPrice/maxPrice are numbers, sort is "price" or "rating"
//     (anything else -> 400 { error })
//   - map sort to a column name here: ORDER BY can't be a parameter
//
// Step 3: getListingById(req, res)
//   - id is not a number -> 400, no such id -> 404
//   - convert hostIsSuperhost 't' / 'f' to true / false
//
// Every controller: try/catch -> 500 { error } when the DAL throws.

const { getListings: getListingsFromDal } = require("../dal/listings.dal");
const { getListingById: getListingByIdFromDal } = require("../dal/listings.dal");

async function getListings(req, res) {
    const {
        neighbourhood,
        roomType,
        minPrice,
        maxPrice,
        sort = "price",
        limit = "20"
    } = req.query;

    if (sort !== "price" && sort !== "rating") {
        return res.status(400).json({error: "Invalid sort value"});
    }

    const parsedLimit = Number(limit);

    if (typeof limit !== "string" || limit.trim() === "" || !Number.isInteger(parsedLimit) || parsedLimit <= 0) {
        return res.status(400).json({error: "limit must be a positive whole number"});
    }

    for (const [name, value] of [["minPrice", minPrice],["maxPrice", maxPrice]]) {
        if (value !== undefined && (typeof value !== "string" || value.trim() === "" || !Number.isFinite(Number(value)) || Number(value) < 0)) {
            return res.status(400).json({error: `${name} must be a non-negative number`});
        }
    }

    const orderBy = sort === "rating" ? "review_scores_rating DESC" : "price ASC";

    try {
        const listings = await getListingsFromDal({
            neighbourhood,
            roomType,
            minPrice: minPrice === undefined ? undefined : Number(minPrice),
            maxPrice: maxPrice === undefined ? undefined : Number(maxPrice),
            orderBy,
            limit: Math.min(parsedLimit, 50)
        });

        return res.json(listings);

    } catch (error) {
        console.error(error);

        return res.status(500).json({ error: "Database query failed" });
    }
}

async function getListingById(req, res) {
    const id = Number(req.params.id);

    if (req.params.id.trim() === "" ||!Number.isFinite(id)) {
        return res.status(400).json({ error: "Invalid listing ID"});
    }

    try {
        const listing = await getListingByIdFromDal(id);

        if (!listing) {
            return res.status(404).json({error: "Listing not found"});
        }

        listing.hostIsSuperhost =
            listing.hostIsSuperhost === "t";

        return res.json(listing);

    } catch (error) {
        console.error(error);
        return res.status(500).json({error: "Database query failed"});
    }
}

module.exports = { getListings, getListingById };