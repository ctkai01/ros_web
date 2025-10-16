// PUT /api/maps/:id
router.put('/:id', async (req, res) => {
    try {
        const mapId = req.params.id;
        const { siteId, info, mapData, dateTime } = req.body;

        // Validate input
        if (!mapId || !siteId || !info || !mapData || !dateTime) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Update map in database
        const query = `
            UPDATE maps 
            SET Info = ?, mapData = ?, dateTime = ?
            WHERE ID = ? AND IDSite = ?
        `;

        const [result] = await pool.execute(query, [
            info,
            mapData,
            dateTime,
            mapId,
            siteId
        ]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Map not found' });
        }

        res.json({ message: 'Map updated successfully' });
    } catch (error) {
        console.error('Error updating map:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}); 