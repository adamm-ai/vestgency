import { Router, Response } from 'express';
import { prisma } from '../index';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';

const router = Router();

// ============================================================================
// HELPER: Serialize BigInt for JSON response
// ============================================================================
function serializeProperty(property: any) {
  return {
    ...property,
    priceNumeric: property.priceNumeric ? Number(property.priceNumeric) : 0,
  };
}

function serializeProperties(properties: any[]) {
  return properties.map(serializeProperty);
}

// ============================================================================
// PUBLIC ROUTES
// ============================================================================

// GET /api/properties - Get all properties with filters
router.get('/', async (req, res) => {
  try {
    const {
      category,
      type,
      city,
      minPrice,
      maxPrice,
      minArea,
      maxArea,
      beds,
      featured,
      search,
      limit = 50,
      offset = 0,
      sort = 'createdAt',
      order = 'desc',
    } = req.query;

    // Build where clause
    const where: any = { isActive: true };

    if (category) where.category = category;
    if (type) where.type = type;
    if (city) where.city = { contains: city as string, mode: 'insensitive' };
    if (featured === 'true') where.isFeatured = true;
    if (beds) where.beds = { gte: Number(beds) };

    // Price range
    if (minPrice || maxPrice) {
      where.priceNumeric = {};
      if (minPrice) where.priceNumeric.gte = BigInt(minPrice as string);
      if (maxPrice) where.priceNumeric.lte = BigInt(maxPrice as string);
    }

    // Area range
    if (minArea || maxArea) {
      where.areaNumeric = {};
      if (minArea) where.areaNumeric.gte = Number(minArea);
      if (maxArea) where.areaNumeric.lte = Number(maxArea);
    }

    // Search in name and location
    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { location: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    // Build orderBy
    const validSortFields = ['createdAt', 'priceNumeric', 'areaNumeric', 'name', 'viewCount'];
    const sortField = validSortFields.includes(sort as string) ? sort : 'createdAt';
    const sortOrder = order === 'asc' ? 'asc' : 'desc';

    const [properties, total] = await Promise.all([
      prisma.property.findMany({
        where,
        orderBy: { [sortField as string]: sortOrder },
        take: Math.min(Number(limit), 100),
        skip: Number(offset),
      }),
      prisma.property.count({ where }),
    ]);

    res.json({
      properties: serializeProperties(properties),
      pagination: {
        total,
        limit: Number(limit),
        offset: Number(offset),
        hasMore: Number(offset) + properties.length < total,
      },
    });
  } catch (error) {
    console.error('[Properties] Get all error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/properties/featured - Get featured properties
router.get('/featured', async (req, res) => {
  try {
    const { limit = 6 } = req.query;

    const properties = await prisma.property.findMany({
      where: { isActive: true, isFeatured: true },
      orderBy: { createdAt: 'desc' },
      take: Math.min(Number(limit), 20),
    });

    res.json({ properties: serializeProperties(properties) });
  } catch (error) {
    console.error('[Properties] Get featured error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/properties/stats - Get property statistics
router.get('/stats', async (req, res) => {
  try {
    const [total, saleCount, rentCount, cityStats, typeStats] = await Promise.all([
      prisma.property.count({ where: { isActive: true } }),
      prisma.property.count({ where: { isActive: true, category: 'SALE' } }),
      prisma.property.count({ where: { isActive: true, category: 'RENT' } }),
      prisma.property.groupBy({
        by: ['city'],
        where: { isActive: true },
        _count: { city: true },
        orderBy: { _count: { city: 'desc' } },
        take: 10,
      }),
      prisma.property.groupBy({
        by: ['type'],
        where: { isActive: true },
        _count: { type: true },
        orderBy: { _count: { type: 'desc' } },
      }),
    ]);

    res.json({
      total,
      byCategory: { SALE: saleCount, RENT: rentCount },
      byCity: cityStats.map((s) => ({ city: s.city, count: s._count.city })),
      byType: typeStats.map((s) => ({ type: s.type, count: s._count.type })),
    });
  } catch (error) {
    console.error('[Properties] Get stats error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/properties/search - Advanced search
router.get('/search', async (req, res) => {
  try {
    const { q, category, type, city, limit = 20 } = req.query;

    if (!q) {
      return res.status(400).json({ error: 'Query parameter "q" is required' });
    }

    const where: any = {
      isActive: true,
      OR: [
        { name: { contains: q as string, mode: 'insensitive' } },
        { location: { contains: q as string, mode: 'insensitive' } },
        { description: { contains: q as string, mode: 'insensitive' } },
        { city: { contains: q as string, mode: 'insensitive' } },
      ],
    };

    if (category) where.category = category;
    if (type) where.type = type;
    if (city) where.city = city;

    const properties = await prisma.property.findMany({
      where,
      orderBy: { viewCount: 'desc' },
      take: Math.min(Number(limit), 50),
    });

    res.json({ properties: serializeProperties(properties), count: properties.length });
  } catch (error) {
    console.error('[Properties] Search error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/properties/:id - Get property by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const property = await prisma.property.findFirst({
      where: {
        OR: [{ id }, { externalId: id }],
      },
    });

    if (!property) {
      return res.status(404).json({ error: 'Propriete non trouvee' });
    }

    // Increment view count
    await prisma.property.update({
      where: { id: property.id },
      data: { viewCount: { increment: 1 } },
    });

    res.json({ property: serializeProperty(property) });
  } catch (error) {
    console.error('[Properties] Get by ID error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ============================================================================
// PROTECTED ROUTES (require authentication)
// ============================================================================

router.use(authenticate);

// POST /api/properties - Create property (Admin only)
router.post('/', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const {
      name,
      type = 'Appartement',
      category,
      price = 'Prix sur demande',
      priceNumeric = 0,
      location = 'Casablanca',
      city = 'Casablanca',
      beds = 0,
      baths = 0,
      area = '',
      areaNumeric = 0,
      image,
      images = [],
      features = [],
      smartTags = [],
      description,
      url,
      source = 'manual',
      externalId,
      isFeatured = false,
    } = req.body;

    if (!name || !category) {
      return res.status(400).json({ error: 'Nom et categorie requis' });
    }

    const property = await prisma.property.create({
      data: {
        name,
        type,
        category,
        price,
        priceNumeric: BigInt(priceNumeric),
        location,
        city,
        beds,
        baths,
        area,
        areaNumeric,
        image,
        images,
        features,
        smartTags,
        description,
        url,
        source,
        externalId,
        isFeatured,
      },
    });

    res.status(201).json({ property: serializeProperty(property) });
  } catch (error) {
    console.error('[Properties] Create error:', error);
    res.status(500).json({ error: 'Erreur lors de la creation' });
  }
});

// PUT /api/properties/:id - Update property (Admin only)
router.put('/:id', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Build update object
    const data: any = {};

    const stringFields = ['name', 'type', 'category', 'price', 'location', 'city', 'area', 'image', 'description', 'url', 'source'];
    const numberFields = ['beds', 'baths', 'areaNumeric', 'viewCount'];
    const booleanFields = ['isActive', 'isFeatured'];
    const jsonFields = ['images', 'features', 'smartTags'];

    stringFields.forEach((field) => {
      if (updates[field] !== undefined) data[field] = updates[field];
    });

    numberFields.forEach((field) => {
      if (updates[field] !== undefined) data[field] = Number(updates[field]);
    });

    booleanFields.forEach((field) => {
      if (updates[field] !== undefined) data[field] = Boolean(updates[field]);
    });

    jsonFields.forEach((field) => {
      if (updates[field] !== undefined) data[field] = updates[field];
    });

    if (updates.priceNumeric !== undefined) {
      data.priceNumeric = BigInt(updates.priceNumeric);
    }

    const property = await prisma.property.update({
      where: { id },
      data,
    });

    res.json({ property: serializeProperty(property) });
  } catch (error) {
    console.error('[Properties] Update error:', error);
    res.status(500).json({ error: 'Erreur lors de la mise a jour' });
  }
});

// DELETE /api/properties/:id - Delete property (Admin only)
router.delete('/:id', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.property.delete({ where: { id } });

    res.json({ message: 'Propriete supprimee' });
  } catch (error) {
    console.error('[Properties] Delete error:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression' });
  }
});

// POST /api/properties/bulk-update - Bulk update properties (Admin only)
router.post('/bulk-update', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { ids, updates } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'Liste d\'IDs requise' });
    }

    const result = await prisma.property.updateMany({
      where: { id: { in: ids } },
      data: updates,
    });

    res.json({ updated: result.count });
  } catch (error) {
    console.error('[Properties] Bulk update error:', error);
    res.status(500).json({ error: 'Erreur lors de la mise a jour groupee' });
  }
});

// POST /api/properties/import - Bulk import from JSON (Admin only)
router.post('/import', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { properties, clearExisting = false } = req.body;

    if (!Array.isArray(properties)) {
      return res.status(400).json({ error: 'Tableau de proprietes requis' });
    }

    // Optionally clear existing properties
    if (clearExisting) {
      await prisma.property.deleteMany({});
    }

    let inserted = 0;
    let errors = 0;

    for (const p of properties) {
      try {
        // Filter out banner/logo images
        const cleanImages = (p.images || []).filter(
          (img: string) =>
            img.includes('/ad/') && !img.includes('banner') && !img.includes('logo') && !img.includes('assets')
        );

        await prisma.property.create({
          data: {
            externalId: p.id || null,
            name: p.name,
            type: p.type || 'Appartement',
            category: p.category,
            price: p.price || 'Prix sur demande',
            priceNumeric: BigInt(p.priceNumeric || 0),
            location: p.location || 'Casablanca',
            city: p.city || 'Casablanca',
            beds: p.beds || 0,
            baths: p.baths || 0,
            area: p.area || '',
            areaNumeric: p.areaNumeric || 0,
            image: cleanImages[0] || p.image || null,
            images: cleanImages.length > 0 ? cleanImages : [p.image].filter(Boolean),
            features: p.features || [],
            smartTags: p.smartTags || [],
            description: p.description || null,
            url: p.url || null,
            source: 'mubawab',
            dateScraped: p.dateScraped ? new Date(p.dateScraped) : new Date(),
          },
        });
        inserted++;
      } catch (e) {
        errors++;
      }
    }

    res.json({ imported: inserted, errors, total: properties.length });
  } catch (error) {
    console.error('[Properties] Import error:', error);
    res.status(500).json({ error: 'Erreur lors de l\'import' });
  }
});

export default router;
