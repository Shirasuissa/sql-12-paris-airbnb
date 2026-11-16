// Controller for /api/hosts
//
// Step 4: getHostListings(req, res)
//   - hostId is not a number -> 400, no places found -> 404
//   - try/catch -> 500 { error }

const { getListingsByHost } = require("../dal/hosts.dal");

async function getHostListings(req, res) {
    const hostId = Number(req.params.hostId);

    if (req.params.hostId.trim() === "" || !Number.isFinite(hostId)) {
        return res.status(400).json({error: "Invalid host ID"});
    }

    try {
        const listings = await getListingsByHost(hostId);

        if (listings.length === 0) {
            return res.status(404).json({error: "Host not found"});
        }

        return res.json(listings);

    } catch (error) {
        console.error(error);
        return res.status(500).json({error: "Database query failed"});
    }
}

module.exports = { getHostListings };
