from django.db import models
from django.utils import timezone
from accounts.models import CustomUser
from employees.models import Employee, Department
from leaves.models import LeaveRequest
from payroll.models import Payroll
from attendance.models import Attendance


class NotificationType(models.Model):
    """Define different types of notifications"""
    name = models.CharField(max_length=50, unique=True)
    description = models.TextField(blank=True, null=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

    class Meta:
        verbose_name = "Notification Type"
        verbose_name_plural = "Notification Types"


class Notification(models.Model):
    """Main notification model"""
    PRIORITY_CHOICES = [
        ('Low', 'Low'),
        ('Medium', 'Medium'),
        ('High', 'High'),
        ('Urgent', 'Urgent'),
    ]

    NOTIFICATION_TYPES = [
        ('leave_request', 'Leave Request'),
        ('leave_approved', 'Leave Approved'),
        ('leave_rejected', 'Leave Rejected'),
        ('payroll_processed', 'Payroll Processed'),
        ('attendance_alert', 'Attendance Alert'),
        ('general', 'General Announcement'),
        ('birthday', 'Birthday Reminder'),
        ('work_anniversary', 'Work Anniversary'),
        ('system', 'System Notification'),
        ('reminder', 'Reminder'),
    ]

    # Core fields
    title = models.CharField(max_length=200)
    message = models.TextField()
    notification_type = models.CharField(max_length=20, choices=NOTIFICATION_TYPES, default='general')
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='Medium')
    
    # Recipients
    recipient = models.ForeignKey(
        CustomUser, 
        on_delete=models.CASCADE, 
        related_name='received_notifications',
        null=True, 
        blank=True
    )
    recipient_department = models.ForeignKey(
        Department, 
        on_delete=models.CASCADE, 
        related_name='department_notifications',
        null=True, 
        blank=True,
        help_text="Send to all employees in this department"
    )
    is_global = models.BooleanField(
        default=False, 
        help_text="Send to all users"
    )
    
    # Sender
    sender = models.ForeignKey(
        CustomUser, 
        on_delete=models.CASCADE, 
        related_name='sent_notifications',
        null=True, 
        blank=True
    )
    
    # Related objects (optional)
    related_leave = models.ForeignKey(
        LeaveRequest, 
        on_delete=models.CASCADE, 
        null=True, 
        blank=True,
        related_name='notifications'
    )
    related_payroll = models.ForeignKey(
        Payroll, 
        on_delete=models.CASCADE, 
        null=True, 
        blank=True,
        related_name='notifications'
    )
    related_attendance = models.ForeignKey(
        Attendance, 
        on_delete=models.CASCADE, 
        null=True, 
        blank=True,
        related_name='notifications'
    )
    
    # Status and tracking
    is_read = models.BooleanField(default=False)
    read_at = models.DateTimeField(null=True, blank=True)
    is_sent = models.BooleanField(default=False)
    sent_at = models.DateTimeField(null=True, blank=True)
    
    # Scheduling
    scheduled_for = models.DateTimeField(
        null=True, 
        blank=True,
        help_text="Schedule notification for future delivery"
    )
    
    # Additional data
    action_url = models.URLField(
        blank=True, 
        null=True,
        help_text="URL to redirect when notification is clicked"
    )
    metadata = models.JSONField(
        default=dict, 
        blank=True,
        help_text="Additional data as JSON"
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    expires_at = models.DateTimeField(
        null=True, 
        blank=True,
        help_text="When this notification expires"
    )

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['recipient', 'is_read']),
            models.Index(fields=['notification_type']),
            models.Index(fields=['created_at']),
            models.Index(fields=['is_global']),
            models.Index(fields=['recipient_department']),
        ]

    def __str__(self):
        return f"{self.title} - {self.recipient or 'Global'}"

    def mark_as_read(self):
        """Mark notification as read"""
        if not self.is_read:
            self.is_read = True
            self.read_at = timezone.now()
            self.save(update_fields=['is_read', 'read_at'])

    def mark_as_sent(self):
        """Mark notification as sent"""
        if not self.is_sent:
            self.is_sent = True
            self.sent_at = timezone.now()
            self.save(update_fields=['is_sent', 'sent_at'])

    @property
    def is_expired(self):
        """Check if notification has expired"""
        if self.expires_at:
            return timezone.now() > self.expires_at
        return False

    @property
    def is_scheduled(self):
        """Check if notification is scheduled for future"""
        if self.scheduled_for:
            return timezone.now() < self.scheduled_for
        return False

    @classmethod
    def create_leave_notification(cls, leave_request, notification_type, sender=None):
        """Helper method to create leave-related notifications"""
        if notification_type == 'leave_request':
            # Notify HR/Admin about new leave request
            title = f"New Leave Request from {leave_request.employee.first_name} {leave_request.employee.last_name}"
            message = f"Leave Type: {leave_request.leave_type}\nDates: {leave_request.start_date} to {leave_request.end_date}\nReason: {leave_request.reason}"
            
            # Create notifications for HR users
            hr_users = CustomUser.objects.filter(role='hr')
            admin_users = CustomUser.objects.filter(role='admin')
            
            notifications = []
            for user in list(hr_users) + list(admin_users):
                notification = cls.objects.create(
                    title=title,
                    message=message,
                    notification_type='leave_request',
                    priority='Medium',
                    recipient=user,
                    sender=sender,
                    related_leave=leave_request,
                    action_url=f"/api/leaves/{leave_request.id}/"
                )
                notifications.append(notification)
            
            return notifications
        
        elif notification_type in ['leave_approved', 'leave_rejected']:
            # Notify employee about leave status
            status = 'approved' if notification_type == 'leave_approved' else 'rejected'
            title = f"Your Leave Request has been {status.title()}"
            message = f"Your {leave_request.leave_type} leave request from {leave_request.start_date} to {leave_request.end_date} has been {status}."
            
            if leave_request.approved_by:
                message += f"\nProcessed by: {leave_request.approved_by.username}"
            
            notification = cls.objects.create(
                title=title,
                message=message,
                notification_type=notification_type,
                priority='High',
                recipient=leave_request.employee.user,
                sender=sender,
                related_leave=leave_request,
                action_url=f"/api/leaves/{leave_request.id}/"
            )
            
            return [notification]

    @classmethod
    def create_payroll_notification(cls, payroll, sender=None):
        """Helper method to create payroll notifications"""
        title = f"Payroll Processed - {payroll.pay_period_start} to {payroll.pay_period_end}"
        message = f"Your payroll for the period {payroll.pay_period_start} to {payroll.pay_period_end} has been processed.\nNet Pay: ${payroll.net_pay}"
        
        notification = cls.objects.create(
            title=title,
            message=message,
            notification_type='payroll_processed',
            priority='Medium',
            recipient=payroll.employee.user,
            sender=sender,
            related_payroll=payroll,
            action_url=f"/api/payrolls/{payroll.id}/"
        )
        
        return [notification]

    @classmethod
    def create_attendance_alert(cls, attendance, alert_type, sender=None):
        """Helper method to create attendance alerts"""
        if alert_type == 'late_arrival':
            title = "Late Arrival Alert"
            message = f"You checked in late today at {attendance.check_in_time}. Please ensure punctuality."
        elif alert_type == 'missing_checkout':
            title = "Missing Check-out Alert"
            message = f"You forgot to check out yesterday ({attendance.date}). Please contact HR to update your attendance."
        else:
            title = "Attendance Alert"
            message = f"Attendance alert for {attendance.date}"
        
        notification = cls.objects.create(
            title=title,
            message=message,
            notification_type='attendance_alert',
            priority='Medium',
            recipient=attendance.employee.user,
            sender=sender,
            related_attendance=attendance
        )
        
        return [notification]


class NotificationPreference(models.Model):
    """User preferences for notifications"""
    user = models.OneToOneField(
        CustomUser, 
        on_delete=models.CASCADE, 
        related_name='notification_preferences'
    )
    
    # Email preferences
    email_notifications = models.BooleanField(default=True)
    email_leave_requests = models.BooleanField(default=True)
    email_payroll_updates = models.BooleanField(default=True)
    email_attendance_alerts = models.BooleanField(default=True)
    email_general_announcements = models.BooleanField(default=True)
    
    # In-app preferences
    in_app_notifications = models.BooleanField(default=True)
    push_notifications = models.BooleanField(default=True)
    
    # Quiet hours
    quiet_hours_enabled = models.BooleanField(default=False)
    quiet_hours_start = models.TimeField(null=True, blank=True)
    quiet_hours_end = models.TimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Notification Preferences for {self.user.username}"

    class Meta:
        verbose_name = "Notification Preference"
        verbose_name_plural = "Notification Preferences"


class NotificationTemplate(models.Model):
    """Templates for different types of notifications"""
    name = models.CharField(max_length=100, unique=True)
    notification_type = models.CharField(max_length=20, choices=Notification.NOTIFICATION_TYPES)
    subject_template = models.CharField(max_length=200)
    message_template = models.TextField()
    is_active = models.BooleanField(default=True)
    
    # Template variables help text
    available_variables = models.TextField(
        help_text="Available template variables (e.g., {employee_name}, {leave_dates})",
        blank=True
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(
        CustomUser, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True
    )

    def __str__(self):
        return f"{self.name} ({self.notification_type})"

    class Meta:
        verbose_name = "Notification Template"
        verbose_name_plural = "Notification Templates"


class NotificationLog(models.Model):
    """Log of all notification activities"""
    ACTION_CHOICES = [
        ('created', 'Created'),
        ('sent', 'Sent'),
        ('read', 'Read'),
        ('failed', 'Failed'),
        ('expired', 'Expired'),
    ]

    notification = models.ForeignKey(
        Notification, 
        on_delete=models.CASCADE, 
        related_name='logs'
    )
    action = models.CharField(max_length=20, choices=ACTION_CHOICES)
    details = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True, null=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.notification.title} - {self.action} at {self.created_at}"