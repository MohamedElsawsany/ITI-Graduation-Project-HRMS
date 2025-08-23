from rest_framework import generics, status, filters
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from django.db.models import Q, Count
from django.shortcuts import get_object_or_404

from .models import (
    Notification, 
    NotificationPreference, 
    NotificationTemplate, 
    NotificationLog,
    NotificationType
)
from .serializers import (
    NotificationSerializer,
    NotificationCreateSerializer,
    BulkNotificationCreateSerializer,
    NotificationPreferenceSerializer,
    NotificationTemplateSerializer,
    NotificationLogSerializer,
    NotificationStatsSerializer,
    MarkAsReadSerializer,
    NotificationTypeSerializer
)
from accounts.permissions import IsAdminOrHR, IsAdmin


# Notification CRUD Views
class NotificationListView(generics.ListAPIView):
    """List notifications for the authenticated user"""
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['notification_type', 'priority', 'is_read', 'is_sent']
    search_fields = ['title', 'message']
    ordering_fields = ['created_at', 'priority', 'is_read']
    ordering = ['-created_at']

    def get_queryset(self):
        user = self.request.user
        
        # Base queryset - user's notifications and global notifications
        queryset = Notification.objects.filter(
            Q(recipient=user) | 
            Q(is_global=True) |
            Q(recipient_department=getattr(user, 'employee', None) and user.employee.department)
        ).select_related('sender', 'recipient', 'recipient_department')
        
        # Filter by read status
        is_read = self.request.query_params.get('is_read')
        if is_read is not None:
            queryset = queryset.filter(is_read=is_read.lower() == 'true')
        
        # Filter by date range
        date_from = self.request.query_params.get('date_from')
        date_to = self.request.query_params.get('date_to')
        if date_from:
            queryset = queryset.filter(created_at__date__gte=date_from)
        if date_to:
            queryset = queryset.filter(created_at__date__lte=date_to)
        
        # Exclude expired notifications
        exclude_expired = self.request.query_params.get('exclude_expired', 'true')
        if exclude_expired.lower() == 'true':
            queryset = queryset.filter(
                Q(expires_at__isnull=True) | Q(expires_at__gt=timezone.now())
            )
        
        return queryset


class AllNotificationsListView(generics.ListAPIView):
    """List all notifications (Admin/HR only)"""
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated, IsAdminOrHR]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['notification_type', 'priority', 'is_read', 'is_sent', 'recipient', 'sender']
    search_fields = ['title', 'message', 'recipient__username', 'sender__username']
    ordering_fields = ['created_at', 'priority', 'is_read']
    ordering = ['-created_at']

    def get_queryset(self):
        return Notification.objects.all().select_related(
            'sender', 'recipient', 'recipient_department'
        )


class NotificationDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update, or delete a notification"""
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        
        # Admin/HR can see all notifications
        if hasattr(user, 'role') and user.role in ['admin', 'hr']:
            return Notification.objects.all()
        
        # Regular users can only see their own notifications
        return Notification.objects.filter(
            Q(recipient=user) | 
            Q(is_global=True) |
            Q(recipient_department=getattr(user, 'employee', None) and user.employee.department)
        )

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        # Mark as read when retrieved
        if instance.recipient == request.user and not instance.is_read:
            instance.mark_as_read()
        
        serializer = self.get_serializer(instance)
        return Response(serializer.data)


class NotificationCreateView(generics.CreateAPIView):
    """Create a new notification (Admin/HR only)"""
    serializer_class = NotificationCreateSerializer
    permission_classes = [IsAuthenticated, IsAdminOrHR]

    def perform_create(self, serializer):
        serializer.save(sender=self.request.user)


class BulkNotificationCreateView(generics.CreateAPIView):
    """Create bulk notifications (Admin/HR only)"""
    serializer_class = BulkNotificationCreateSerializer
    permission_classes = [IsAuthenticated, IsAdminOrHR]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        notifications = serializer.save()
        
        return Response({
            'message': f'Successfully created {len(notifications)} notifications',
            'notification_count': len(notifications)
        }, status=status.HTTP_201_CREATED)


# Notification Actions
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_as_read(request):
    """Mark multiple notifications as read"""
    serializer = MarkAsReadSerializer(data=request.data, context={'request': request})
    serializer.is_valid(raise_exception=True)
    
    notification_ids = serializer.validated_data['notification_ids']
    
    # Update notifications
    updated_count = Notification.objects.filter(
        id__in=notification_ids,
        recipient=request.user,
        is_read=False
    ).update(
        is_read=True,
        read_at=timezone.now()
    )
    
    return Response({
        'message': f'Marked {updated_count} notifications as read',
        'updated_count': updated_count
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_all_as_read(request):
    """Mark all user's notifications as read"""
    updated_count = Notification.objects.filter(
        Q(recipient=request.user) | 
        Q(is_global=True) |
        Q(recipient_department=getattr(request.user, 'employee', None) and request.user.employee.department),
        is_read=False
    ).update(
        is_read=True,
        read_at=timezone.now()
    )
    
    return Response({
        'message': f'Marked {updated_count} notifications as read',
        'updated_count': updated_count
    })


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_read_notifications(request):
    """Delete all read notifications for the user"""
    deleted_count, _ = Notification.objects.filter(
        recipient=request.user,
        is_read=True
    ).delete()
    
    return Response({
        'message': f'Deleted {deleted_count} read notifications',
        'deleted_count': deleted_count
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def notification_stats(request):
    """Get notification statistics for the user"""
    user = request.user
    
    # Get user's notifications
    user_notifications = Notification.objects.filter(
        Q(recipient=user) | 
        Q(is_global=True) |
        Q(recipient_department=getattr(user, 'employee', None) and user.employee.department)
    )
    
    # Calculate statistics
    total_notifications = user_notifications.count()
    unread_notifications = user_notifications.filter(is_read=False).count()
    read_notifications = total_notifications - unread_notifications
    
    # Notifications by type
    notifications_by_type = dict(
        user_notifications.values('notification_type').annotate(
            count=Count('id')
        ).values_list('notification_type', 'count')
    )
    
    # Notifications by priority
    notifications_by_priority = dict(
        user_notifications.values('priority').annotate(
            count=Count('id')
        ).values_list('priority', 'count')
    )
    
    # Recent notifications (last 5)
    recent_notifications = user_notifications.order_by('-created_at')[:5]
    
    stats_data = {
        'total_notifications': total_notifications,
        'unread_notifications': unread_notifications,
        'read_notifications': read_notifications,
        'notifications_by_type': notifications_by_type,
        'notifications_by_priority': notifications_by_priority,
        'recent_notifications': recent_notifications
    }
    
    serializer = NotificationStatsSerializer(stats_data)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdminOrHR])
def system_notification_stats(request):
    """Get system-wide notification statistics (Admin/HR only)"""
    # Total notifications
    total_notifications = Notification.objects.count()
    total_sent = Notification.objects.filter(is_sent=True).count()
    total_read = Notification.objects.filter(is_read=True).count()
    
    # Notifications by type
    notifications_by_type = dict(
        Notification.objects.values('notification_type').annotate(
            count=Count('id')
        ).values_list('notification_type', 'count')
    )
    
    # Notifications by priority
    notifications_by_priority = dict(
        Notification.objects.values('priority').annotate(
            count=Count('id')
        ).values_list('priority', 'count')
    )
    
    # Recent notifications
    recent_notifications = Notification.objects.order_by('-created_at')[:10]
    
    # Monthly statistics (last 6 months)
    from django.db.models import TruncMonth
    monthly_stats = list(
        Notification.objects.filter(
            created_at__gte=timezone.now() - timezone.timedelta(days=180)
        ).annotate(
            month=TruncMonth('created_at')
        ).values('month').annotate(
            count=Count('id')
        ).order_by('month')
    )
    
    stats_data = {
        'total_notifications': total_notifications,
        'total_sent': total_sent,
        'total_read': total_read,
        'read_percentage': round((total_read / total_notifications * 100) if total_notifications > 0 else 0, 2),
        'notifications_by_type': notifications_by_type,
        'notifications_by_priority': notifications_by_priority,
        'monthly_stats': monthly_stats,
        'recent_notifications': recent_notifications
    }
    
    serializer = NotificationStatsSerializer(stats_data)
    return Response(serializer.data)


# Notification Preferences Views
class NotificationPreferenceView(generics.RetrieveUpdateAPIView):
    """Get or update user's notification preferences"""
    serializer_class = NotificationPreferenceSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        preferences, created = NotificationPreference.objects.get_or_create(
            user=self.request.user
        )
        return preferences


# Notification Template Views
class NotificationTemplateListView(generics.ListCreateAPIView):
    """List and create notification templates (Admin only)"""
    serializer_class = NotificationTemplateSerializer
    permission_classes = [IsAuthenticated, IsAdmin]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['notification_type', 'is_active']
    search_fields = ['name', 'subject_template', 'message_template']

    def get_queryset(self):
        return NotificationTemplate.objects.all()


class NotificationTemplateDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update, or delete notification template (Admin only)"""
    serializer_class = NotificationTemplateSerializer
    permission_classes = [IsAuthenticated, IsAdmin]
    queryset = NotificationTemplate.objects.all()


# Notification Type Views
class NotificationTypeListView(generics.ListCreateAPIView):
    """List and create notification types (Admin only)"""
    serializer_class = NotificationTypeSerializer
    permission_classes = [IsAuthenticated, IsAdmin]
    queryset = NotificationType.objects.all()


class NotificationTypeDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update, or delete notification type (Admin only)"""
    serializer_class = NotificationTypeSerializer
    permission_classes = [IsAuthenticated, IsAdmin]
    queryset = NotificationType.objects.all()


# Notification Log Views
class NotificationLogListView(generics.ListAPIView):
    """List notification logs (Admin/HR only)"""
    serializer_class = NotificationLogSerializer
    permission_classes = [IsAuthenticated, IsAdminOrHR]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['action', 'notification']
    ordering_fields = ['created_at']
    ordering = ['-created_at']

    def get_queryset(self):
        return NotificationLog.objects.all().select_related('notification')


# Utility Views
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def unread_count(request):
    """Get count of unread notifications for the user"""
    user = request.user
    
    unread_count = Notification.objects.filter(
        Q(recipient=user) | 
        Q(is_global=True) |
        Q(recipient_department=getattr(user, 'employee', None) and user.employee.department),
        is_read=False
    ).count()
    
    return Response({'unread_count': unread_count})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def recent_notifications(request):
    """Get recent notifications for the user"""
    user = request.user
    limit = int(request.query_params.get('limit', 5))
    
    notifications = Notification.objects.filter(
        Q(recipient=user) | 
        Q(is_global=True) |
        Q(recipient_department=getattr(user, 'employee', None) and user.employee.department)
    ).order_by('-created_at')[:limit]
    
    serializer = NotificationSerializer(notifications, many=True)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsAdminOrHR])
def send_test_notification(request):
    """Send a test notification (Admin/HR only)"""
    recipient_id = request.data.get('recipient_id')
    
    if not recipient_id:
        return Response(
            {'error': 'recipient_id is required'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        from accounts.models import CustomUser
        recipient = CustomUser.objects.get(id=recipient_id)
        
        notification = Notification.objects.create(
            title="Test Notification",
            message="This is a test notification from the HR system.",
            notification_type="system",
            priority="Low",
            recipient=recipient,
            sender=request.user
        )
        
        serializer = NotificationSerializer(notification)
        return Response({
            'message': 'Test notification sent successfully',
            'notification': serializer.data
        })
        
    except CustomUser.DoesNotExist:
        return Response(
            {'error': 'Recipient not found'}, 
            status=status.HTTP_404_NOT_FOUND
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsAdminOrHR])
def cleanup_old_notifications(request):
    """Clean up old read notifications (Admin/HR only)"""
    days_old = int(request.data.get('days_old', 30))
    cutoff_date = timezone.now() - timezone.timedelta(days=days_old)
    
    deleted_count, _ = Notification.objects.filter(
        is_read=True,
        created_at__lt=cutoff_date
    ).delete()
    
    return Response({
        'message': f'Cleaned up {deleted_count} old notifications',
        'deleted_count': deleted_count,
        'cutoff_date': cutoff_date
    })