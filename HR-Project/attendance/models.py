from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone
from datetime import datetime, date, time, timedelta
from employees.models import Employee
from accounts.models import CustomUser


class Attendance(models.Model):
    STATUS_CHOICES = [
        ('Present', 'Present'),
        ('Late', 'Late'),
        ('Absent', 'Absent'),
        ('Half Day', 'Half Day'),
        ('On Leave', 'On Leave'),
    ]

    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='attendances')
    date = models.DateField()
    check_in_time = models.TimeField(null=True, blank=True)
    check_out_time = models.TimeField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Present')
    total_hours = models.DecimalField(max_digits=4, decimal_places=2, null=True, blank=True, validators=[MinValueValidator(0), MaxValueValidator(24)])
    overtime_hours = models.DecimalField(max_digits=4, decimal_places=2, default=0, validators=[MinValueValidator(0)])
    break_duration = models.DecimalField(max_digits=4, decimal_places=2, default=0, validators=[MinValueValidator(0)])  # in hours
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # For manual attendance entries by HR/Admin
    created_by = models.ForeignKey(CustomUser, on_delete=models.SET_NULL, null=True, blank=True, related_name='created_attendances')
    is_manual_entry = models.BooleanField(default=False)

    class Meta:
        unique_together = ['employee', 'date']
        ordering = ['-date', '-check_in_time']
        indexes = [
            models.Index(fields=['employee', 'date']),
            models.Index(fields=['date']),
            models.Index(fields=['status']),
        ]

    def __str__(self):
        return f"{self.employee.first_name} {self.employee.last_name} - {self.date}"

    def save(self, *args, **kwargs):
        # Auto-calculate total hours if both check-in and check-out are provided
        if self.check_in_time and self.check_out_time:
            # Convert times to datetime for calculation
            check_in = datetime.combine(self.date, self.check_in_time)
            check_out = datetime.combine(self.date, self.check_out_time)
            
            # Handle case where check-out is next day
            if check_out < check_in:
                check_out += timedelta(days=1)
            
            # Calculate total hours (subtract break duration)
            total_time = check_out - check_in
            total_hours = total_time.total_seconds() / 3600
            self.total_hours = round(total_hours - float(self.break_duration), 2)
            
            # Calculate overtime (assuming 8 hours is standard work day)
            standard_hours = 8
            if self.total_hours > standard_hours:
                self.overtime_hours = round(self.total_hours - standard_hours, 2)
            else:
                self.overtime_hours = 0
            
            # Auto-determine status based on times
            if not self.is_manual_entry:
                self.auto_determine_status()
        
        super().save(*args, **kwargs)

    def auto_determine_status(self):
        """Auto-determine attendance status based on check-in time and total hours"""
        if not self.check_in_time:
            self.status = 'Absent'
            return
        
        # Define standard work start time (9:00 AM)
        standard_start = time(9, 0)
        late_threshold = time(9, 15)  # 15 minutes grace period
        
        if self.check_in_time <= standard_start:
            self.status = 'Present'
        elif self.check_in_time <= late_threshold:
            self.status = 'Present'  # Within grace period
        else:
            self.status = 'Late'
        
        # Check for half day based on total hours
        if self.total_hours and self.total_hours < 4:
            self.status = 'Half Day'

    @property
    def is_checked_in(self):
        """Check if employee is currently checked in (has check-in but no check-out)"""
        return self.check_in_time is not None and self.check_out_time is None

    @property
    def is_completed(self):
        """Check if attendance record is complete (has both check-in and check-out)"""
        return self.check_in_time is not None and self.check_out_time is not None

    @property
    def duration_text(self):
        """Return human-readable duration"""
        if self.total_hours:
            hours = int(self.total_hours)
            minutes = int((self.total_hours - hours) * 60)
            return f"{hours}h {minutes}m"
        return "0h 0m"


class AttendanceSettings(models.Model):
    """Global attendance settings"""
    standard_work_hours = models.DecimalField(max_digits=4, decimal_places=2, default=8.0)
    standard_start_time = models.TimeField(default=time(9, 0))  # 9:00 AM
    standard_end_time = models.TimeField(default=time(17, 0))   # 5:00 PM
    late_threshold_minutes = models.IntegerField(default=15)    # Minutes after start time
    overtime_threshold_hours = models.DecimalField(max_digits=4, decimal_places=2, default=8.0)
    break_duration_hours = models.DecimalField(max_digits=4, decimal_places=2, default=1.0)  # Default lunch break
    
    # Tracking
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    updated_by = models.ForeignKey(CustomUser, on_delete=models.SET_NULL, null=True, blank=True)

    class Meta:
        verbose_name = "Attendance Settings"
        verbose_name_plural = "Attendance Settings"

    def __str__(self):
        return f"Attendance Settings (Updated: {self.updated_at.strftime('%Y-%m-%d')})"

    @classmethod
    def get_settings(cls):
        """Get current attendance settings, create default if none exist"""
        settings, created = cls.objects.get_or_create(
            pk=1,  # Ensure only one settings record
            defaults={
                'standard_work_hours': 8.0,
                'standard_start_time': time(9, 0),
                'standard_end_time': time(17, 0),
                'late_threshold_minutes': 15,
                'overtime_threshold_hours': 8.0,
                'break_duration_hours': 1.0,
            }
        )
        return settings


class AttendanceSummary(models.Model):
    """Monthly attendance summary for employees"""
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='attendance_summaries')
    month = models.DateField()  # First day of the month
    
    # Counts
    total_days = models.IntegerField(default=0)
    present_days = models.IntegerField(default=0)
    absent_days = models.IntegerField(default=0)
    late_days = models.IntegerField(default=0)
    half_days = models.IntegerField(default=0)
    leave_days = models.IntegerField(default=0)
    
    # Hours
    total_work_hours = models.DecimalField(max_digits=6, decimal_places=2, default=0)
    total_overtime_hours = models.DecimalField(max_digits=6, decimal_places=2, default=0)
    average_hours_per_day = models.DecimalField(max_digits=4, decimal_places=2, default=0)
    
    # Calculated fields
    attendance_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    punctuality_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['employee', 'month']
        ordering = ['-month', 'employee__first_name']

    def __str__(self):
        return f"{self.employee.first_name} {self.employee.last_name} - {self.month.strftime('%Y-%m')}"

    def calculate_summary(self):
        """Calculate summary statistics from attendance records"""
        from django.db.models import Count, Sum, Q
        
        # Get attendance records for the month
        attendances = Attendance.objects.filter(
            employee=self.employee,
            date__year=self.month.year,
            date__month=self.month.month
        )
        
        # Count by status
        status_counts = attendances.values('status').annotate(count=Count('id'))
        status_dict = {item['status']: item['count'] for item in status_counts}
        
        self.present_days = status_dict.get('Present', 0)
        self.absent_days = status_dict.get('Absent', 0)
        self.late_days = status_dict.get('Late', 0)
        self.half_days = status_dict.get('Half Day', 0)
        self.leave_days = status_dict.get('On Leave', 0)
        self.total_days = attendances.count()
        
        # Calculate hours
        hours_sum = attendances.aggregate(
            total_hours=Sum('total_hours'),
            total_overtime=Sum('overtime_hours')
        )
        
        self.total_work_hours = hours_sum['total_hours'] or 0
        self.total_overtime_hours = hours_sum['total_overtime'] or 0
        
        # Calculate averages and percentages
        if self.total_days > 0:
            working_days = self.present_days + self.late_days + self.half_days
            self.attendance_percentage = round((working_days / self.total_days) * 100, 2)
            self.punctuality_percentage = round((self.present_days / self.total_days) * 100, 2)
            
            if working_days > 0:
                self.average_hours_per_day = round(self.total_work_hours / working_days, 2)
        
        self.save()

    @classmethod
    def update_or_create_summary(cls, employee, month_date):
        """Update or create summary for given employee and month"""
        summary, created = cls.objects.get_or_create(
            employee=employee,
            month=month_date,
            defaults={
                'total_days': 0,
                'present_days': 0,
                'absent_days': 0,
                'late_days': 0,
                'half_days': 0,
                'leave_days': 0,
                'total_work_hours': 0,
                'total_overtime_hours': 0,
                'average_hours_per_day': 0,
                'attendance_percentage': 0,
                'punctuality_percentage': 0,
            }
        )
        
        summary.calculate_summary()
        return summary