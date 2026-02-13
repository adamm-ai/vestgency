import { Router, Response } from 'express';
import { prisma } from '../index';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// GET /api/notifications - Get user notifications
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        lead: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });

    const unreadCount = await prisma.notification.count({
      where: { userId: req.user!.id, isRead: false },
    });

    res.json({ notifications, unreadCount });
  } catch (error) {
    console.error('[Notifications] Get error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// PUT /api/notifications/:id/read - Mark notification as read
router.put('/:id/read', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.notification.update({
      where: { id, userId: req.user!.id },
      data: { isRead: true },
    });

    res.json({ message: 'Notification marquée comme lue' });
  } catch (error) {
    console.error('[Notifications] Mark read error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// PUT /api/notifications/read-all - Mark all notifications as read
router.put('/read-all', async (req: AuthRequest, res: Response) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user!.id, isRead: false },
      data: { isRead: true },
    });

    res.json({ message: 'Toutes les notifications marquées comme lues' });
  } catch (error) {
    console.error('[Notifications] Mark all read error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// DELETE /api/notifications/:id - Delete notification
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.notification.delete({
      where: { id, userId: req.user!.id },
    });

    res.json({ message: 'Notification supprimée' });
  } catch (error) {
    console.error('[Notifications] Delete error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;
