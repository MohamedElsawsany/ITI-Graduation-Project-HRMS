from rest_framework import serializers
from django.utils import timezone
from .models import (
    Notification, 
    NotificationPreference, 
    NotificationTemplate, 
    NotificationLog,
    NotificationType
)
from accounts.models import CustomUser
from employees.models import Department
from leaves.models import LeaveRequest
from payroll.models import Payroll
from attendance.models import Attendance


class NotificationTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = NotificationType
        fields = '__all__'


class NotificationSerializer(serializers.ModelSerializer):
    sender_username = serializers.CharField(source='sender.username', read_only=True)
    sender_full_name = serializers.SerializerMethodField()
    recipient_username = serializers.CharField(source='recipient.username', read_only=True)
    recipient_full_name = serializers.SerializerMethodField()
    department_name = serializers.CharField(source='recipient_department.name', read_only=True)
    time_since = serializers.SerializerMethodField()
    is_expired = serializers.ReadOnlyField()
    is_scheduled = serializers.ReadOnlyField()
    
    # Related object details
    related_leave_details = serializers.SerializerMethodField()
    related_payroll_details = serializers.SerializerMethodField()
    related_attendance_details = serializers.SerializerMethodField()

    class Meta:
        model = Notification
        fields = [
            'id', 'title', 'message', 'notification_type', 'priority',
            'recipient', 'recipient_username', 'recipient_full_name',
            'recipient_department', 'department_name', 'is_global',
            'sender', 'sender_username', 'sender_full_name',
            'related_leave', 'related_payroll', 'related_attendance',
            'related_leave_details', 'related_payroll_details', 'related_attendance_details',
            'is_read', 'read_at', 'is_sent', 'sent_at',
            'scheduled_for', 'action_url', 'metadata',
            'created_at', 'updated_at', 'expires_at',
            'time_since', 'is_expired', 'is_scheduled'
        ]
        read_only_fields = ['is_sent', 'sent_at', 'time_since', 'is_expired', 'is_scheduled']

    def get_sender_full_name(self, obj):
        if obj.sender:
            try:
                employee = obj.sender.employee
                return f"{employee.first_name} {employee.last_name}"
            except:
                return obj.sender.username
        return None

    def get_recipient_full_name(self, obj):
        if obj.recipient:
            try:
                employee = obj.recipient.employee
                return f"{employee.first_name} {employee.last_name}"
            except:
                return obj.recipient.username
        return None

    def get_time_since(self, obj):
        now = timezone.now()
        diff = now - obj.created_at
        
        if diff.days > 0:
            return f"{diff.days} day{'s' if diff.days > 1 else ''} ago"
        elif diff.seconds > 3600:
            hours = diff.seconds // 3600
            return f"{hours} hour{'s' if hours > 1 else ''} ago"
        elif diff.seconds > 60:
            minutes = diff.seconds // 60
            return f"{minutes} minute{'s' if minutes > 1 else ''} ago"
        else:
            return "Just now"

    def get_related_leave_details(self, obj):
        if obj.related_leave:
            return {
                'id': obj.related_leave.id,
                'leave_type': obj.related_leave.leave_type,
                'start_date': obj.related_leave.start_date,
                'end_date': obj.related_leave.end_date,
                'status': obj.related_leave.status,
                'employee_name': f"{obj.related_leave.employee.first_name} {obj.related_leave.employee.last_name}"
            }
        return None

    def get_related_payroll_details(self, obj):
        if obj.related_payroll:
            return {
                'id': obj.related_payroll.id,
                'pay_period_start': obj.related_payroll.pay_period_start,
                'pay_period_end': obj.related_payroll.pay_period_end,
                'net_pay': str(obj.related_payroll.net_pay),
                'status': obj.related_payroll.status,
                'employee_name': f"{obj.related_payroll.employee.first_name} {obj.related_payroll.employee.last_name}"
            }
        return None

    def get_related_attendance_details(self, obj):
        if obj.related_attendance:
            return {
                'id': obj.related_attendance.id,
                'date': obj.related_attendance.date,
                'check_in_time': obj.related_attendance.check_in_time,
                'check_out_time': obj.related_attendance.check_out_time,
                'status': obj.related_attendance.status,
                'employee_name': f"{obj.related_attendance.employee.first_name} {obj.related_attendance.employee.last_name}"
            }
        return None

    def validate(self, data):
        # Ensure at least one recipient is specified
        if not data.get('recipient') and not data.get('recipient_department') and not data.get('is_global'):
            raise serializers.ValidationError(
                "Must specify either recipient, recipient_department, or set is_global to True"
            )
        
        # Validate scheduled_for is in the future
        if data.get('scheduled_for') and data['scheduled_for'] <= timezone.now():
            raise serializers.ValidationError(
                "scheduled_for must be in the future"
            )
        
        # Validate expires_at is after created time
        if data.get('expires_at') and data['expires_at'] <= timezone.now():
            raise serializers.ValidationError(
                "expires_at must be in the future"
            )
        
        return data


class NotificationCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating notifications"""
    
    class Meta:
        model = Notification
        fields = [
            'title', 'message', 'notification_type', 'priority',
            'recipient', 'recipient_department', 'is_global',
            'related_leave', 'related_payroll', 'related_attendance',
            'scheduled_for', 'action_url', 'metadata', 'expires_at'
        ]

    def validate(self, data):
        # Ensure at least one recipient is specified
        if not data.get('recipient') and not data.get('recipient_department') and not data.get('is_global'):
            raise serializers.ValidationError(
                "Must specify either recipient, recipient_department, or set is_global to True"
            )
        return data

    def create(self, validated_data):
        # Set sender from request user
        request = self.context.get('request')
        if request and request.user:
            validated_data['sender'] = request.user
        
        return super().create(validated_data)


class BulkNotificationCreateSerializer(serializers.Serializer):
    """Serializer for creating bulk notifications"""
    title = serializers.CharField(max_length=200)
    message = serializers.CharField()
    notification_type = serializers.ChoiceField(choices=Notification.NOTIFICATION_TYPES, default='general')
    priority = serializers.ChoiceField(choices=Notification.PRIORITY_CHOICES, default='Medium')
    
    # Recipients
    recipient_ids = serializers.ListField(
        child=serializers.IntegerField(),
        required=False,
        allow_empty=True
    )
    department_ids = serializers.ListField(
        child=serializers.IntegerField(),
        required=False,
        allow_empty=True
    )
    is_global = serializers.BooleanField(default=False)
    
    # Optional fields
    scheduled_for = serializers.DateTimeField(required=False)
    action_url = serializers.URLField(required=False)
    metadata = serializers.JSONField(default=dict)
    expires_at = serializers.DateTimeField(required=False)

    def validate(self, data):
        if not data.get('recipient_ids') and not data.get('department_ids') and not data.get('is_global'):
            raise serializers.ValidationError(
                "Must specify either recipient_ids, department_ids, or set is_global to True"
            )
        return data

    def create(self, validated_data):
        request = self.context.get('request')
        sender = request.user if request else None
        
        notifications = []
        
        # Extract recipient data
        recipient_ids = validated_data.pop('recipient_ids', [])
        department_ids = validated_data.pop('department_ids', [])
        is_global = validated_data.pop('is_global', False)
        
        if is_global:
            # Create notification for all users
            recipients = CustomUser.objects.filter(is_active=True)
            for recipient in recipients:
                notification = Notification.objects.create(
                    recipient=recipient,
                    sender=sender,
                    **validated_data
                )
                notifications.append(notification)
        
        elif department_ids:
            # Create notifications for all employees in specified departments
            from employees.models import Employee
            employees = Employee.objects.filter(department_id__in=department_ids, is_active=True)
            for employee in employees:
                notification = Notification.objects.create(
                    recipient=employee.user,
                    sender=sender,
                    **validated_data
                )
                notifications.append(notification)
        
        elif recipient_ids:
            # Create notifications for specific recipients
            recipients = CustomUser.objects.filter(id__in=recipient_ids, is_active=True)
            for recipient in recipients:
                notification = Notification.objects.create(
                    recipient=recipient,
                    sender=sender,
                    **validated_data
                )
                notifications.append(notification)
        
        return notifications


class NotificationPreferenceSerializer(serializers.ModelSerializer):
    user_username = serializers.CharField(source='user.username', read_only=True)
    
    class Meta:
        model = NotificationPreference
        fields = '__all__'
        read_only_fields = ['user', 'created_at', 'updated_at']


class NotificationTemplateSerializer(serializers.ModelSerializer):
    created_by_username = serializers.CharField(source='created_by.username', read_only=True)
    
    class Meta:
        model = NotificationTemplate
        fields = '__all__'
        read_only_fields = ['created_by', 'created_at', 'updated_at']

    def create(self, validated_data):
        request = self.context.get('request')
        if request and request.user:
            validated_data['created_by'] = request.user
        return super().create(validated_data)


class NotificationLogSerializer(serializers.ModelSerializer):
    notification_title = serializers.CharField(source='notification.title', read_only=True)
    
    class Meta:
        model = NotificationLog
        fields = '__all__'
        read_only_fields = ['created_at']


class NotificationStatsSerializer(serializers.Serializer):
    """Serializer for notification statistics"""
    total_notifications = serializers.IntegerField()
    unread_notifications = serializers.IntegerField()
    read_notifications = serializers.IntegerField()
    notifications_by_type = serializers.DictField()
    notifications_by_priority = serializers.DictField()
    recent_notifications = NotificationSerializer(many=True)


class MarkAsReadSerializer(serializers.Serializer):
    """Serializer for marking notifications as read"""
    notification_ids = serializers.ListField(
        child=serializers.IntegerField(),
        allow_empty=False
    )

    def validate_notification_ids(self, value):
        request = self.context.get('request')
        if request and request.user:
            # Verify all notifications belong to the user
            user_notifications = Notification.objects.filter(
                id__in=value,
                recipient=request.user
            ).values_list('id', flat=True)
            
            invalid_ids = set(value) - set(user_notifications)
            if invalid_ids:
                raise serializers.ValidationError(
                    f"Invalid notification IDs: {list(invalid_ids)}"
                )
        
        return value