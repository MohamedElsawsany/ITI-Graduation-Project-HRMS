from django.urls import path
from . import views

urlpatterns = [
    # Notification CRUD operations
    path('notifications/', views.NotificationListView.as_view(), name='notification-list'),
    path('notifications/all/', views.AllNotificationsListView.as_view(), name='all-notifications'),
    path('notifications/create/', views.NotificationCreateView.as_view(), name='notification-create'),
    path('notifications/bulk-create/', views.BulkNotificationCreateView.as_view(), name='bulk-notification-create'),
    path('notifications/<int:pk>/', views.NotificationDetailView.as_view(), name='notification-detail'),
    
    # Notification actions
    path('notifications/mark-as-read/', views.mark_as_read, name='mark-notifications-read'),
    path('notifications/mark-all-as-read/', views.mark_all_as_read, name='mark-all-notifications-read'),
    path('notifications/delete-read/', views.delete_read_notifications, name='delete-read-notifications'),
    
    # Notification statistics and utilities
    path('notifications/stats/', views.notification_stats, name='notification-stats'),
    path('notifications/system-stats/', views.system_notification_stats, name='system-notification-stats'),
    path('notifications/unread-count/', views.unread_count, name='unread-notifications-count'),
    path('notifications/recent/', views.recent_notifications, name='recent-notifications'),
    
    # Notification preferences
    path('notifications/preferences/', views.NotificationPreferenceView.as_view(), name='notification-preferences'),
    
    # Notification templates (Admin only)
    path('notifications/templates/', views.NotificationTemplateListView.as_view(), name='notification-template-list'),
    path('notifications/templates/<int:pk>/', views.NotificationTemplateDetailView.as_view(), name='notification-template-detail'),
    
    # Notification types (Admin only)
    path('notifications/types/', views.NotificationTypeListView.as_view(), name='notification-type-list'),
    path('notifications/types/<int:pk>/', views.NotificationTypeDetailView.as_view(), name='notification-type-detail'),
    
    # Notification logs (Admin/HR only)
    path('notifications/logs/', views.NotificationLogListView.as_view(), name='notification-log-list'),
    
    # Admin utilities
    path('notifications/send-test/', views.send_test_notification, name='send-test-notification'),
    path('notifications/cleanup/', views.cleanup_old_notifications, name='cleanup-notifications'),
]

# URL Examples and Usage:
"""
BASIC NOTIFICATION OPERATIONS:
1. GET /api/notifications/ - List user's notifications
   - Query params: ?notification_type=leave_request&priority=High&is_read=false&page=1&limit=10

2. GET /api/notifications/all/ - List all notifications (Admin/HR only)
   - Query params: ?sender=5&recipient=10&date_from=2024-01-01&date_to=2024-01-31

3. POST /api/notifications/create/ - Create single notification (Admin/HR only)
   - Body: {
       "title": "System Maintenance",
       "message": "System will be down for maintenance",
       "notification_type": "system",
       "priority": "High",
       "is_global": true,
       "scheduled_for": "2024-01-15T20:00:00Z"
     }

4. POST /api/notifications/bulk-create/ - Create bulk notifications (Admin/HR only)
   - Body: {
       "title": "Monthly Meeting Reminder",
       "message": "Don't forget about tomorrow's monthly meeting",
       "department_ids": [1, 2, 3],
       "priority": "Medium"
     }

5. GET /api/notifications/123/ - Get specific notification details
6. PUT/PATCH /api/notifications/123/ - Update notification
7. DELETE /api/notifications/123/ - Delete notification

NOTIFICATION ACTIONS:
8. POST /api/notifications/mark-as-read/ - Mark specific notifications as read
   - Body: {"notification_ids": [1, 2, 3, 4]}

9. POST /api/notifications/mark-all-as-read/ - Mark all user's notifications as read

10. DELETE /api/notifications/delete-read/ - Delete all read notifications

STATISTICS AND UTILITIES:
11. GET /api/notifications/stats/ - Get user's notification statistics
12. GET /api/notifications/system-stats/ - Get system-wide stats (Admin/HR only)
13. GET /api/notifications/unread-count/ - Get count of unread notifications
14. GET /api/notifications/recent/ - Get recent notifications
    - Query params: ?limit=5

PREFERENCES:
15. GET /api/notifications/preferences/ - Get user's notification preferences
16. PUT/PATCH /api/notifications/preferences/ - Update notification preferences
    - Body: {
        "email_notifications": true,
        "email_leave_requests": true,
        "quiet_hours_enabled": true,
        "quiet_hours_start": "22:00:00",
        "quiet_hours_end": "08:00:00"
      }

TEMPLATES (Admin only):
17. GET /api/notifications/templates/ - List notification templates
18. POST /api/notifications/templates/ - Create notification template
19. GET /api/notifications/templates/123/ - Get template details
20. PUT/PATCH /api/notifications/templates/123/ - Update template
21. DELETE /api/notifications/templates/123/ - Delete template

NOTIFICATION TYPES (Admin only):
22. GET /api/notifications/types/ - List notification types
23. POST /api/notifications/types/ - Create notification type
24. GET /api/notifications/types/123/ - Get type details
25. PUT/PATCH /api/notifications/types/123/ - Update type
26. DELETE /api/notifications/types/123/ - Delete type

LOGS (Admin/HR only):
27. GET /api/notifications/logs/ - List notification logs
    - Query params: ?action=sent&notification=123

ADMIN UTILITIES:
28. POST /api/notifications/send-test/ - Send test notification
    - Body: {"recipient_id": 5}

29. POST /api/notifications/cleanup/ - Clean up old notifications
    - Body: {"days_old": 30}

FILTERING EXAMPLES:
- Get unread leave notifications: /api/notifications/?notification_type=leave_request&is_read=false
- Get high priority notifications: /api/notifications/?priority=High
- Get notifications from last week: /api/notifications/?date_from=2024-01-01&date_to=2024-01-07
- Search notifications: /api/notifications/?search=payroll
- Get notifications by type: /api/notifications/?notification_type=attendance_alert

RESPONSE EXAMPLES:

Notification List Response:
{
  "count": 25,
  "next": "http://api.example.com/notifications/?page=2",
  "previous": null,
  "results": [
    {
      "id": 1,
      "title": "Leave Request Approved",
      "message": "Your annual leave request has been approved.",
      "notification_type": "leave_approved",
      "priority": "High",
      "is_read": false,
      "created_at": "2024-01-15T10:30:00Z",
      "time_since": "2 hours ago",
      "sender_full_name": "John Doe",
      "related_leave_details": {
        "id": 5,
        "leave_type": "Annual",
        "start_date": "2024-01-20",
        "end_date": "2024-01-25"
      }
    }
  ]
}

Statistics Response:
{
  "total_notifications": 50,
  "unread_notifications": 5,
  "read_notifications": 45,
  "notifications_by_type": {
    "leave_request": 15,
    "payroll_processed": 20,
    "general": 10,
    "attendance_alert": 5
  },
  "notifications_by_priority": {
    "High": 10,
    "Medium": 30,
    "Low": 10
  }
}
"""