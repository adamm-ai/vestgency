"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const index_1 = require("../index");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// GET /api/properties - Get all properties (public)
router.get('/', async (req, res) => {
    try {
        const { category, city, minPrice, maxPrice, limit = 50, offset = 0 } = req.query;
        // Build where clause
        const where = { isActive: true };
        if (category)
            where.category = category;
        if (city)
            where.city = { contains: city, mode: 'insensitive' };
        if (minPrice)
            where.priceNumeric = { ...where.priceNumeric, gte: BigInt(minPrice) };
        if (maxPrice)
            where.priceNumeric = { ...where.priceNumeric, lte: BigInt(maxPrice) };
        const [properties, total] = await Promise.all([
            index_1.prisma.property.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                take: Number(limit),
                skip: Number(offset),
            }),
            index_1.prisma.property.count({ where }),
        ]);
        res.json({
            properties,
            total,
            limit: Number(limit),
            offset: Number(offset),
        });
    }
    catch (error) {
        console.error('[Properties] Get all error:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});
// GET /api/properties/:id - Get property by ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const property = await index_1.prisma.property.findUnique({
            where: { id },
        });
        if (!property) {
            return res.status(404).json({ error: 'Propriété non trouvée' });
        }
        res.json({ property });
    }
    catch (error) {
        console.error('[Properties] Get by ID error:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});
// Protected routes (require auth)
router.use(auth_1.authenticate);
// POST /api/properties - Create property (Admin only)
router.post('/', auth_1.requireAdmin, async (req, res) => {
    try {
        const { name, type, category, price, priceNumeric, location, city, beds, areaNumeric, image, url, datePublished, externalId, } = req.body;
        if (!name || !category) {
            return res.status(400).json({ error: 'Nom et catégorie requis' });
        }
        const property = await index_1.prisma.property.create({
            data: {
                name,
                type,
                category,
                price,
                priceNumeric: priceNumeric ? BigInt(priceNumeric) : null,
                location,
                city,
                beds,
                areaNumeric,
                image,
                url,
                datePublished: datePublished ? new Date(datePublished) : null,
                externalId,
            },
        });
        res.status(201).json({ property });
    }
    catch (error) {
        console.error('[Properties] Create error:', error);
        res.status(500).json({ error: 'Erreur lors de la création' });
    }
});
// PUT /api/properties/:id - Update property (Admin only)
router.put('/:id', auth_1.requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        const property = await index_1.prisma.property.update({
            where: { id },
            data: {
                ...(updates.name !== undefined && { name: updates.name }),
                ...(updates.type !== undefined && { type: updates.type }),
                ...(updates.category !== undefined && { category: updates.category }),
                ...(updates.price !== undefined && { price: updates.price }),
                ...(updates.priceNumeric !== undefined && { priceNumeric: updates.priceNumeric ? BigInt(updates.priceNumeric) : null }),
                ...(updates.location !== undefined && { location: updates.location }),
                ...(updates.city !== undefined && { city: updates.city }),
                ...(updates.beds !== undefined && { beds: updates.beds }),
                ...(updates.areaNumeric !== undefined && { areaNumeric: updates.areaNumeric }),
                ...(updates.image !== undefined && { image: updates.image }),
                ...(updates.url !== undefined && { url: updates.url }),
                ...(updates.isActive !== undefined && { isActive: updates.isActive }),
            },
        });
        res.json({ property });
    }
    catch (error) {
        console.error('[Properties] Update error:', error);
        res.status(500).json({ error: 'Erreur lors de la mise à jour' });
    }
});
// DELETE /api/properties/:id - Delete property (Admin only)
router.delete('/:id', auth_1.requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        await index_1.prisma.property.delete({ where: { id } });
        res.json({ message: 'Propriété supprimée' });
    }
    catch (error) {
        console.error('[Properties] Delete error:', error);
        res.status(500).json({ error: 'Erreur lors de la suppression' });
    }
});
// POST /api/properties/import - Bulk import from JSON (Admin only)
router.post('/import', auth_1.requireAdmin, async (req, res) => {
    try {
        const { properties } = req.body;
        if (!Array.isArray(properties)) {
            return res.status(400).json({ error: 'Tableau de propriétés requis' });
        }
        const created = await index_1.prisma.property.createMany({
            data: properties.map((p) => ({
                externalId: p.id || null,
                name: p.name,
                type: p.type,
                category: p.category,
                price: p.price,
                priceNumeric: p.priceNumeric ? BigInt(p.priceNumeric) : null,
                location: p.location,
                city: p.city,
                beds: p.beds,
                areaNumeric: p.areaNumeric,
                image: p.image,
                url: p.url,
                datePublished: p.datePublished ? new Date(p.datePublished) : null,
            })),
            skipDuplicates: true,
        });
        res.json({ imported: created.count });
    }
    catch (error) {
        console.error('[Properties] Import error:', error);
        res.status(500).json({ error: 'Erreur lors de l\'import' });
    }
});
exports.default = router;
//# sourceMappingURL=properties.js.map