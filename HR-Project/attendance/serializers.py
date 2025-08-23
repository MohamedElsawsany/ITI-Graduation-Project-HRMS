from rest_framework import serializers
from django.utils import timezone
from datetime import datetime, date, time, timedelta
from .models import Attendance, AttendanceSettings, AttendanceSummary
from employees.models import Employee
from accounts.models import CustomUser


class EmployeeBasicSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    department_name = serializers.CharField(source='department.name', read_only=True)
    job_title_name = serializers.CharField(source='job_title.name', read_only=True)

    class Meta:
        model = Employee
        fields = ['id', 'full_name', 'department_name', 'job_title_name']

    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}".strip()


class AttendanceListSerializer(serializers.ModelSerializer):
    employee_details = EmployeeBasicSerializer(source='employee', read_only=True)
    duration_text = serializers.ReadOnlyField()
    is_checked_in = serializers.ReadOnlyField()
    is_completed = serializers.ReadOnlyField()
    created_by_name = serializers.CharField(source='created_by.username', read_only=True)

    class Meta:
        model = Attendance
        fields = [
            'id', 'employee_details', 'date', 'check_in_time', 'check_out_time',
            'status', 'total_hours', 'overtime_hours', 'duration_text',
            'is_checked_in', 'is_completed', 'is_manual_entry', 'created_by_name'
        ]


class AttendanceDetailSerializer(serializers.ModelSerializer):
    employee_details = EmployeeBasicSerializer(source='employee', read_only=True)
    duration_text = serializers.ReadOnlyField()
    is_checked_in = serializers.ReadOnlyField()
    is_completed = serializers.ReadOnlyField()
    created_by_name = serializers.CharField(source='created_by.username', read_only=True)

    class Meta:
        model = Attendance
        fields = [
            'id', 'employee_details', 'date', 'check_in_time', 'check_out_time',
            'status', 'total_hours', 'overtime_hours', 'break_duration',
            'notes', 'duration_text', 'is_checked_in', 'is_completed',
            'is_manual_entry', 'created_by', 'created_by_name',
            'created_at', 'updated_at'
        ]


class CheckInSerializer(serializers.Serializer):
    """Serializer for employee check-in"""
    notes = serializers.CharField(max_length=500, required=False, allow_blank=True)

    def create(self, validated_data):
        request = self.context['request']
        
        # Get employee from request user
        try:
            employee = Employee.objects.get(user=request.user)
        except Employee.DoesNotExist:
            raise serializers.ValidationError("Employee profile not found for current user.")

        today = date.today()
        now = timezone.now().time()

        # Check if already checked in today
        existing_attendance = Attendance.objects.filter(
            employee=employee,
            date=today
        ).first()

        if existing_attendance:
            if existing_attendance.check_in_time:
                raise serializers.ValidationError("You have already checked in today.")
            else:
                # Update existing record with check-in time
                existing_attendance.check_in_time = now
                existing_attendance.notes = validated_data.get('notes', existing_attendance.notes)
                existing_attendance.save()
                return existing_attendance

        # Create new attendance record
        attendance = Attendance.objects.create(
            employee=employee,
            date=today,
            check_in_time=now,
            notes=validated_data.get('notes', ''),
            is_manual_entry=False
        )

        return attendance


class CheckOutSerializer(serializers.Serializer):
    """Serializer for employee check-out"""
    notes = serializers.CharField(max_length=500, required=False, allow_blank=True)

    def create(self, validated_data):
        request = self.context['request']
        
        # Get employee from request user
        try:
            employee = Employee.objects.get(user=request.user)
        except Employee.DoesNotExist:
            raise serializers.ValidationError("Employee profile not found for current user.")

        today = date.today()
        now = timezone.now().time()

        # Find today's attendance record
        try:
            attendance = Attendance.objects.get(employee=employee, date=today)
        except Attendance.DoesNotExist:
            raise serializers.ValidationError("No check-in record found for today. Please check in first.")

        # Check if already checked out
        if attendance.check_out_time:
            raise serializers.ValidationError("You have already checked out today.")

        # Check if checked in
        if not attendance.check_in_time:
            raise serializers.ValidationError("You must check in before checking out.")

        # Update with check-out time
        attendance.check_out_time = now
        if validated_data.get('notes'):
            attendance.notes = validated_data['notes'] if not attendance.notes else f"{attendance.notes}\nCheck-out: {validated_data['notes']}"
        attendance.save()  # This will auto-calculate total hours and status

        return attendance


class AttendanceCreateSerializer(serializers.ModelSerializer):
    """Serializer for manual attendance creation by HR/Admin"""
    
    class Meta:
        model = Attendance
        fields = [
            'employee', 'date', 'check_in_time', 'check_out_time',
            'status', 'break_duration', 'notes'
        ]

    def validate(self, data):
        # Validate date is not in the future
        if data['date'] > date.today():
            raise serializers.ValidationError("Attendance date cannot be in the future.")

        # Validate time logic
        if data.get('check_in_time') and data.get('check_out_time'):
            if data['check_in_time'] >= data['check_out_time']:
                raise serializers.ValidationError("Check-out time must be after check-in time.")

        # Check for duplicate attendance
        employee = data['employee']
        attendance_date = data['date']
        
        if self.instance:  # Update case
            existing = Attendance.objects.filter(
                employee=employee, 
                date=attendance_date
            ).exclude(id=self.instance.id)
        else:  # Create case
            existing = Attendance.objects.filter(
                employee=employee, 
                date=attendance_date
            )

        if existing.exists():
            raise serializers.ValidationError("Attendance record already exists for this employee on this date.")

        return data

    def create(self, validated_data):
        request = self.context['request']
        validated_data['created_by'] = request.user
        validated_data['is_manual_entry'] = True
        return super().create(validated_data)


class AttendanceUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating attendance records by HR/Admin"""
    
    class Meta:
        model = Attendance
        fields = [
            'check_in_time', 'check_out_time', 'status', 
            'break_duration', 'notes'
        ]

    def validate(self, data):
        # Validate time logic
        check_in = data.get('check_in_time', self.instance.check_in_time)
        check_out = data.get('check_out_time', self.instance.check_out_time)
        
        if check_in and check_out and check_in >= check_out:
            raise serializers.ValidationError("Check-out time must be after check-in time.")

        return data


class AttendanceSettingsSerializer(serializers.ModelSerializer):
    updated_by_name = serializers.CharField(source='updated_by.username', read_only=True)

    class Meta:
        model = AttendanceSettings
        fields = [
            'id', 'standard_work_hours', 'standard_start_time', 'standard_end_time',
            'late_threshold_minutes', 'overtime_threshold_hours', 'break_duration_hours',
            'updated_by', 'updated_by_name', 'created_at', 'updated_at'
        ]
        read_only_fields = ['updated_by', 'created_at', 'updated_at']

    def update(self, instance, validated_data):
        validated_data['updated_by'] = self.context['request'].user
        return super().update(instance, validated_data)


class AttendanceSummarySerializer(serializers.ModelSerializer):
    employee_details = EmployeeBasicSerializer(source='employee', read_only=True)
    month_display = serializers.SerializerMethodField()

    class Meta:
        model = AttendanceSummary
        fields = [
            'id', 'employee_details', 'month', 'month_display',
            'total_days', 'present_days', 'absent_days', 'late_days',
            'half_days', 'leave_days', 'total_work_hours', 'total_overtime_hours',
            'average_hours_per_day', 'attendance_percentage', 'punctuality_percentage',
            'created_at', 'updated_at'
        ]

    def get_month_display(self, obj):
        return obj.month.strftime('%B %Y')


class TodayAttendanceSerializer(serializers.ModelSerializer):
    """Serializer for today's attendance status"""
    employee_details = EmployeeBasicSerializer(source='employee', read_only=True)
    is_checked_in = serializers.ReadOnlyField()
    is_completed = serializers.ReadOnlyField()
    duration_text = serializers.ReadOnlyField()
    current_work_hours = serializers.SerializerMethodField()

    class Meta:
        model = Attendance
        fields = [
            'id', 'employee_details', 'date', 'check_in_time', 'check_out_time',
            'status', 'is_checked_in', 'is_completed', 'duration_text',
            'current_work_hours', 'notes'
        ]

    def get_current_work_hours(self, obj):
        """Calculate current work hours if checked in but not checked out"""
        if obj.check_in_time and not obj.check_out_time:
            check_in = datetime.combine(obj.date, obj.check_in_time)
            now = timezone.now()
            
            # Handle timezone-naive datetime comparison
            if timezone.is_naive(check_in):
                check_in = timezone.make_aware(check_in)
            
            if now.date() == obj.date:
                duration = now - check_in
                hours = duration.total_seconds() / 3600
                return round(hours - float(obj.break_duration or 0), 2)
        
        return obj.total_hours


class AttendanceStatsSerializer(serializers.Serializer):
    """Serializer for attendance statistics"""
    date = serializers.DateField()
    total_employees = serializers.IntegerField()
    present_count = serializers.IntegerField()
    absent_count = serializers.IntegerField()
    late_count = serializers.IntegerField()
    on_leave_count = serializers.IntegerField()
    not_checked_in = serializers.IntegerField()
    attendance_rate = serializers.DecimalField(max_digits=5, decimal_places=2)


class BulkAttendanceSerializer(serializers.Serializer):
    """Serializer for bulk attendance operations"""
    date = serializers.DateField()
    attendances = serializers.ListField(
        child=serializers.DictField(),
        allow_empty=False
    )

    def validate_date(self, value):
        if value > date.today():
            raise serializers.ValidationError("Date cannot be in the future.")
        return value

    def validate_attendances(self, value):
        if not value:
            raise serializers.ValidationError("At least one attendance record is required.")
        
        employee_ids = [item.get('employee_id') for item in value]
        if len(employee_ids) != len(set(employee_ids)):
            raise serializers.ValidationError("Duplicate employee IDs found in attendance list.")
        
        return value

    def create(self, validated_data):
        request = self.context['request']
        attendance_date = validated_data['date']
        attendances_data = validated_data['attendances']
        
        created_attendances = []
        errors = []

        for attendance_data in attendances_data:
            try:
                employee_id = attendance_data.get('employee_id')
                employee = Employee.objects.get(id=employee_id)
                
                # Check if attendance already exists
                if Attendance.objects.filter(employee=employee, date=attendance_date).exists():
                    errors.append({
                        'employee_id': employee_id,
                        'error': 'Attendance already exists for this date'
                    })
                    continue

                attendance = Attendance.objects.create(
                    employee=employee,
                    date=attendance_date,
                    check_in_time=attendance_data.get('check_in_time'),
                    check_out_time=attendance_data.get('check_out_time'),
                    status=attendance_data.get('status', 'Present'),
                    break_duration=attendance_data.get('break_duration', 0),
                    notes=attendance_data.get('notes', ''),
                    created_by=request.user,
                    is_manual_entry=True
                )
                created_attendances.append(attendance)

            except Employee.DoesNotExist:
                errors.append({
                    'employee_id': employee_id,
                    'error': 'Employee not found'
                })
            except Exception as e:
                errors.append({
                    'employee_id': employee_id,
                    'error': str(e)
                })

        return {
            'created_count': len(created_attendances),
            'error_count': len(errors),
            'created_attendances': created_attendances,
            'errors': errors
        }