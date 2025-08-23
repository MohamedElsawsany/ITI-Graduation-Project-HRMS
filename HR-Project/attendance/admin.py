from django.contrib import admin
from django.utils.html import format_html
from django.db.models import Q
from django.urls import reverse
from django.utils import timezone
from datetime import date, timedelta
from .models import Attendance, AttendanceSettings, AttendanceSummary


@admin.register(Attendance)
class AttendanceAdmin(admin.ModelAdmin):
    list_display = [
        'employee_name', 'date', 'check_in_time', 'check_out_time', 
        'status_badge', 'total_hours', 'overtime_hours', 'is_manual_entry',
        'created_by_name'
    ]
    list_filter = [
        'status', 'date', 'is_manual_entry', 'employee__department', 
        'employee__job_title', 'created_at'
    ]
    search_fields = [
        'employee__first_name', 'employee__last_name', 
        'employee__phone', 'employee__national_id', 'notes'
    ]
    date_hierarchy = 'date'
    readonly_fields = [
        'total_hours', 'overtime_hours', 'duration_text', 
        'is_checked_in', 'is_completed', 'created_at', 'updated_at'
    ]
    fieldsets = (
        ('Employee Information', {
            'fields': ('employee',)
        }),
        ('Date & Time', {
            'fields': ('date', 'check_in_time', 'check_out_time')
        }),
        ('Status & Hours', {
            'fields': ('status', 'total_hours', 'overtime_hours', 'break_duration')
        }),
        ('Additional Information', {
            'fields': ('notes',)
        }),
        ('System Information', {
            'fields': (
                'is_manual_entry', 'created_by', 'duration_text', 
                'is_checked_in', 'is_completed', 'created_at', 'updated_at'
            ),
            'classes': ('collapse',)
        })
    )
    ordering = ['-date', '-check_in_time']
    actions = [
        'mark_as_present', 'mark_as_late', 'mark_as_absent', 
        'calculate_hours', 'export_selected_attendance'
    ]
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related(
            'employee__department', 'employee__job_title', 'created_by'
        )

    def employee_name(self, obj):
        """Display employee name with link to employee detail"""
        name = f"{obj.employee.first_name} {obj.employee.last_name}"
        if obj.employee.department:
            name += f" ({obj.employee.department.name})"
        return name
    employee_name.short_description = 'Employee'
    employee_name.admin_order_field = 'employee__first_name'

    def status_badge(self, obj):
        """Display status with colored badge"""
        colors = {
            'Present': '#28a745',    # Green
            'Late': '#ffc107',       # Yellow  
            'Absent': '#dc3545',     # Red
            'Half Day': '#17a2b8',   # Blue
            'On Leave': '#6c757d'    # Gray
        }
        color = colors.get(obj.status, '#6c757d')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 8px; '
            'border-radius: 12px; font-size: 11px; font-weight: bold;">{}</span>',
            color, obj.status
        )
    status_badge.short_description = 'Status'
    status_badge.admin_order_field = 'status'

    def created_by_name(self, obj):
        """Display who created the record"""
        if obj.created_by:
            return obj.created_by.username
        return '-'
    created_by_name.short_description = 'Created By'
    created_by_name.admin_order_field = 'created_by__username'

    def total_hours(self, obj):
        """Display total hours with formatting"""
        if obj.total_hours:
            return f"{obj.total_hours:.2f}h"
        return '-'
    total_hours.short_description = 'Total Hours'
    total_hours.admin_order_field = 'total_hours'

    def overtime_hours(self, obj):
        """Display overtime hours with formatting"""
        if obj.overtime_hours and obj.overtime_hours > 0:
            return format_html(
                '<span style="color: #ff6b35; font-weight: bold;">{:.2f}h</span>',
                obj.overtime_hours
            )
        return '-'
    overtime_hours.short_description = 'Overtime'
    overtime_hours.admin_order_field = 'overtime_hours'

    # Custom Actions
    def mark_as_present(self, request, queryset):
        """Mark selected attendance records as Present"""
        updated = queryset.update(status='Present')
        self.message_user(request, f'{updated} records marked as Present.')
    mark_as_present.short_description = 'Mark selected as Present'

    def mark_as_late(self, request, queryset):
        """Mark selected attendance records as Late"""
        updated = queryset.update(status='Late')
        self.message_user(request, f'{updated} records marked as Late.')
    mark_as_late.short_description = 'Mark selected as Late'

    def mark_as_absent(self, request, queryset):
        """Mark selected attendance records as Absent"""
        updated = queryset.update(status='Absent')
        self.message_user(request, f'{updated} records marked as Absent.')
    mark_as_absent.short_description = 'Mark selected as Absent'

    def calculate_hours(self, request, queryset):
        """Recalculate hours for selected records"""
        updated = 0
        for attendance in queryset:
            if attendance.check_in_time and attendance.check_out_time:
                attendance.save()  # This will trigger the auto-calculation
                updated += 1
        self.message_user(request, f'Hours recalculated for {updated} records.')
    calculate_hours.short_description = 'Recalculate hours'

    def export_selected_attendance(self, request, queryset):
        """Export selected attendance records"""
        # This would integrate with your export functionality
        self.message_user(request, f'{queryset.count()} records selected for export.')
    export_selected_attendance.short_description = 'Export selected records'

    def get_list_filter(self, request):
        """Dynamic list filter based on date range"""
        filters = list(self.list_filter)
        
        # Add dynamic date filters
        today = date.today()
        week_ago = today - timedelta(days=7)
        month_ago = today - timedelta(days=30)
        
        return filters

    def changelist_view(self, request, extra_context=None):
        """Add summary statistics to changelist view"""
        extra_context = extra_context or {}
        
        # Get today's stats
        today = date.today()
        today_attendance = Attendance.objects.filter(date=today)
        
        extra_context['today_stats'] = {
            'total': today_attendance.count(),
            'present': today_attendance.filter(status='Present').count(),
            'late': today_attendance.filter(status='Late').count(),
            'absent': today_attendance.filter(status='Absent').count(),
        }
        
        return super().changelist_view(request, extra_context)


@admin.register(AttendanceSettings)
class AttendanceSettingsAdmin(admin.ModelAdmin):
    list_display = [
        'standard_work_hours', 'standard_start_time', 'standard_end_time',
        'late_threshold_minutes', 'overtime_threshold_hours', 'break_duration_hours',
        'updated_by_name', 'updated_at'
    ]
    readonly_fields = ['created_at', 'updated_at', 'updated_by']
    fieldsets = (
        ('Work Schedule', {
            'fields': (
                'standard_work_hours', 'standard_start_time', 
                'standard_end_time', 'break_duration_hours'
            )
        }),
        ('Thresholds', {
            'fields': ('late_threshold_minutes', 'overtime_threshold_hours')
        }),
        ('System Information', {
            'fields': ('updated_by', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )

    def updated_by_name(self, obj):
        """Display who last updated settings"""
        return obj.updated_by.username if obj.updated_by else '-'
    updated_by_name.short_description = 'Updated By'
    updated_by_name.admin_order_field = 'updated_by__username'

    def save_model(self, request, obj, form, change):
        """Set updated_by when saving"""
        obj.updated_by = request.user
        super().save_model(request, obj, form, change)

    def has_delete_permission(self, request, obj=None):
        """Prevent deletion of settings"""
        return False

    def has_add_permission(self, request):
        """Prevent adding multiple settings (should be singleton)"""
        return not AttendanceSettings.objects.exists()


@admin.register(AttendanceSummary)
class AttendanceSummaryAdmin(admin.ModelAdmin):
    list_display = [
        'employee_name', 'month_display', 'total_days', 'present_days',
        'absent_days', 'late_days', 'attendance_percentage_display',
        'punctuality_percentage_display', 'average_hours_per_day'
    ]
    list_filter = [
        'month', 'employee__department', 'employee__job_title'
    ]
    search_fields = [
        'employee__first_name', 'employee__last_name'
    ]
    readonly_fields = [
        'total_days', 'present_days', 'absent_days', 'late_days',
        'half_days', 'leave_days', 'total_work_hours', 'total_overtime_hours',
        'average_hours_per_day', 'attendance_percentage', 'punctuality_percentage',
        'created_at', 'updated_at'
    ]
    fieldsets = (
        ('Employee & Period', {
            'fields': ('employee', 'month')
        }),
        ('Attendance Counts', {
            'fields': (
                'total_days', 'present_days', 'absent_days', 
                'late_days', 'half_days', 'leave_days'
            )
        }),
        ('Hours Summary', {
            'fields': (
                'total_work_hours', 'total_overtime_hours', 'average_hours_per_day'
            )
        }),
        ('Performance Metrics', {
            'fields': ('attendance_percentage', 'punctuality_percentage')
        }),
        ('System Information', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )
    ordering = ['-month', 'employee__first_name']
    actions = ['recalculate_summaries', 'export_summaries']

    def get_queryset(self, request):
        return super().get_queryset(request).select_related(
            'employee__department', 'employee__job_title'
        )

    def employee_name(self, obj):
        """Display employee name with department"""
        name = f"{obj.employee.first_name} {obj.employee.last_name}"
        if obj.employee.department:
            name += f" ({obj.employee.department.name})"
        return name
    employee_name.short_description = 'Employee'
    employee_name.admin_order_field = 'employee__first_name'

    def month_display(self, obj):
        """Display month in readable format"""
        return obj.month.strftime('%B %Y')
    month_display.short_description = 'Month'
    month_display.admin_order_field = 'month'

    def attendance_percentage_display(self, obj):
        """Display attendance percentage with color coding"""
        percentage = obj.attendance_percentage
        if percentage >= 95:
            color = '#28a745'  # Green
        elif percentage >= 85:
            color = '#ffc107'  # Yellow
        else:
            color = '#dc3545'  # Red
        
        return format_html(
            '<span style="color: {}; font-weight: bold;">{:.1f}%</span>',
            color, percentage
        )
    attendance_percentage_display.short_description = 'Attendance %'
    attendance_percentage_display.admin_order_field = 'attendance_percentage'

    def punctuality_percentage_display(self, obj):
        """Display punctuality percentage with color coding"""
        percentage = obj.punctuality_percentage
        if percentage >= 90:
            color = '#28a745'  # Green
        elif percentage >= 75:
            color = '#ffc107'  # Yellow
        else:
            color = '#dc3545'  # Red
        
        return format_html(
            '<span style="color: {}; font-weight: bold;">{:.1f}%</span>',
            color, percentage
        )
    punctuality_percentage_display.short_description = 'Punctuality %'
    punctuality_percentage_display.admin_order_field = 'punctuality_percentage'

    # Custom Actions
    def recalculate_summaries(self, request, queryset):
        """Recalculate selected summaries"""
        updated = 0
        for summary in queryset:
            summary.calculate_summary()
            updated += 1
        self.message_user(request, f'{updated} summaries recalculated.')
    recalculate_summaries.short_description = 'Recalculate selected summaries'

    def export_summaries(self, request, queryset):
        """Export selected summaries"""
        self.message_user(request, f'{queryset.count()} summaries selected for export.')
    export_summaries.short_description = 'Export selected summaries'

    def has_add_permission(self, request):
        """Summaries are auto-generated, prevent manual addition"""
        return False

    def has_delete_permission(self, request, obj=None):
        """Allow deletion of summaries"""
        return True


# Custom admin site configuration
class AttendanceAdminSite(admin.AdminSite):
    """Custom admin site for attendance management"""
    site_header = 'Attendance Management'
    site_title = 'Attendance Admin'
    index_title = 'Attendance Dashboard'

    def index(self, request, extra_context=None):
        """Custom admin index with attendance dashboard"""
        extra_context = extra_context or {}
        
        today = date.today()
        
        # Today's statistics
        today_attendance = Attendance.objects.filter(date=today)
        extra_context['today_stats'] = {
            'total': today_attendance.count(),
            'present': today_attendance.filter(status='Present').count(),
            'late': today_attendance.filter(status='Late').count(),
            'absent': today_attendance.filter(status='Absent').count(),
            'checked_in': today_attendance.filter(
                check_in_time__isnull=False, 
                check_out_time__isnull=True
            ).count(),
        }
        
        # This week's statistics
        week_start = today - timedelta(days=today.weekday())
        week_attendance = Attendance.objects.filter(
            date__range=[week_start, today]
        )
        extra_context['week_stats'] = {
            'total': week_attendance.count(),
            'present': week_attendance.filter(status='Present').count(),
            'late': week_attendance.filter(status='Late').count(),
            'absent': week_attendance.filter(status='Absent').count(),
        }
        
        return super().index(request, extra_context)


# Advanced filters
class DateRangeFilter(admin.SimpleListFilter):
    """Custom filter for date ranges"""
    title = 'Date Range'
    parameter_name = 'date_range'

    def lookups(self, request, model_admin):
        return (
            ('today', 'Today'),
            ('yesterday', 'Yesterday'),
            ('this_week', 'This Week'),
            ('last_week', 'Last Week'),
            ('this_month', 'This Month'),
            ('last_month', 'Last Month'),
        )

    def queryset(self, request, queryset):
        today = date.today()
        
        if self.value() == 'today':
            return queryset.filter(date=today)
        elif self.value() == 'yesterday':
            yesterday = today - timedelta(days=1)
            return queryset.filter(date=yesterday)
        elif self.value() == 'this_week':
            week_start = today - timedelta(days=today.weekday())
            return queryset.filter(date__range=[week_start, today])
        elif self.value() == 'last_week':
            week_start = today - timedelta(days=today.weekday() + 7)
            week_end = today - timedelta(days=today.weekday() + 1)
            return queryset.filter(date__range=[week_start, week_end])
        elif self.value() == 'this_month':
            month_start = today.replace(day=1)
            return queryset.filter(date__range=[month_start, today])
        elif self.value() == 'last_month':
            last_month = today.replace(day=1) - timedelta(days=1)
            month_start = last_month.replace(day=1)
            month_end = today.replace(day=1) - timedelta(days=1)
            return queryset.filter(date__range=[month_start, month_end])
        
        return queryset


class AttendanceStatusFilter(admin.SimpleListFilter):
    """Custom filter for attendance status combinations"""
    title = 'Attendance Status'
    parameter_name = 'attendance_status'

    def lookups(self, request, model_admin):
        return (
            ('working', 'Working (Present + Late)'),
            ('not_working', 'Not Working (Absent + On Leave)'),
            ('incomplete', 'Incomplete Records'),
            ('overtime', 'Has Overtime'),
        )

    def queryset(self, request, queryset):
        if self.value() == 'working':
            return queryset.filter(status__in=['Present', 'Late'])
        elif self.value() == 'not_working':
            return queryset.filter(status__in=['Absent', 'On Leave'])
        elif self.value() == 'incomplete':
            return queryset.filter(
                Q(check_in_time__isnull=True) | Q(check_out_time__isnull=True)
            )
        elif self.value() == 'overtime':
            return queryset.filter(overtime_hours__gt=0)
        
        return queryset


# Add custom filters to AttendanceAdmin
AttendanceAdmin.list_filter = [
    DateRangeFilter, AttendanceStatusFilter, 'status', 'is_manual_entry',
    'employee__department', 'employee__job_title', 'created_at'
]

# Register custom admin site (optional)
# attendance_admin_site = AttendanceAdminSite(name='attendance_admin')
# attendance_admin_site.register(Attendance, AttendanceAdmin)
# attendance_admin_site.register(AttendanceSettings, AttendanceSettingsAdmin)
# attendance_admin_site.register(AttendanceSummary, AttendanceSummaryAdmin)