from rest_framework import generics, status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.db import transaction
from django.db.models import Q, Count, Sum, Avg
from django.utils import timezone
from datetime import datetime, date, timedelta
from .models import Attendance, AttendanceSettings, AttendanceSummary
from employees.models import Employee
from accounts.permissions import IsAdminOrHR
from TalentFlow.pagination import StandardResultsSetPagination
from .serializers import (
    AttendanceListSerializer,
    AttendanceDetailSerializer,
    CheckInSerializer,
    CheckOutSerializer,
    AttendanceCreateSerializer,
    AttendanceUpdateSerializer,
    AttendanceSettingsSerializer,
    AttendanceSummarySerializer,
    TodayAttendanceSerializer,
    AttendanceStatsSerializer,
    BulkAttendanceSerializer
)


# 1. List all attendance records (Admin/HR see all, employees see their own)
class AttendanceListView(generics.ListAPIView):
    """
    GET: List attendance records with filtering
    - Admin/HR can see all attendance records
    - Employees can see only their own attendance records
    """
    serializer_class = AttendanceListSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        user = self.request.user
        
        # Base queryset
        if user.is_superuser or getattr(user, 'role', None) in ['Admin', 'HR']:
            # Admin/HR can see all attendance records
            queryset = Attendance.objects.select_related(
                'employee__department',
                'employee__job_title',
                'created_by'
            ).all()
        else:
            # Regular employees can only see their own attendance
            try:
                employee = Employee.objects.get(user=user)
                queryset = Attendance.objects.filter(employee=employee).select_related(
                    'employee__department',
                    'employee__job_title',
                    'created_by'
                )
            except Employee.DoesNotExist:
                return Attendance.objects.none()

        # Apply filters
        return self.apply_filters(queryset)

    def apply_filters(self, queryset):
        """Apply various filters to the queryset"""
        # Filter by date range
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')
        
        if start_date:
            try:
                start_date = datetime.strptime(start_date, '%Y-%m-%d').date()
                queryset = queryset.filter(date__gte=start_date)
            except ValueError:
                pass

        if end_date:
            try:
                end_date = datetime.strptime(end_date, '%Y-%m-%d').date()
                queryset = queryset.filter(date__lte=end_date)
            except ValueError:
                pass

        # Filter by specific date
        date_filter = self.request.query_params.get('date')
        if date_filter:
            try:
                date_filter = datetime.strptime(date_filter, '%Y-%m-%d').date()
                queryset = queryset.filter(date=date_filter)
            except ValueError:
                pass

        # Filter by month (format: YYYY-MM)
        month = self.request.query_params.get('month')
        if month:
            try:
                year, month_num = month.split('-')
                queryset = queryset.filter(date__year=year, date__month=month_num)
            except ValueError:
                pass

        # Filter by employee (Admin/HR only)
        employee_id = self.request.query_params.get('employee')
        if employee_id and (self.request.user.is_superuser or getattr(self.request.user, 'role', None) in ['Admin', 'HR']):
            queryset = queryset.filter(employee_id=employee_id)

        # Filter by department (Admin/HR only)
        department_id = self.request.query_params.get('department')
        if department_id and (self.request.user.is_superuser or getattr(self.request.user, 'role', None) in ['Admin', 'HR']):
            queryset = queryset.filter(employee__department_id=department_id)

        # Filter by status
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)

        # Filter by checked in status
        checked_in = self.request.query_params.get('checked_in')
        if checked_in == 'true':
            queryset = queryset.filter(check_in_time__isnull=False, check_out_time__isnull=True)
        elif checked_in == 'false':
            queryset = queryset.filter(check_out_time__isnull=False)

        return queryset.order_by('-date', '-check_in_time')


# 2. Create attendance record (Manual entry by Admin/HR)
class AttendanceCreateView(generics.CreateAPIView):
    """
    POST: Create attendance record manually
    Admin and HR only
    """
    queryset = Attendance.objects.all()
    serializer_class = AttendanceCreateSerializer
    permission_classes = [IsAdminOrHR]

    @transaction.atomic
    def create(self, request, *args, **kwargs):
        return super().create(request, *args, **kwargs)


# 3. Attendance detail view
class AttendanceDetailView(generics.RetrieveAPIView):
    """
    GET: Retrieve specific attendance record
    Admin/HR can see any attendance, employees can see their own
    """
    serializer_class = AttendanceDetailSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        
        if user.is_superuser or getattr(user, 'role', None) in ['Admin', 'HR']:
            return Attendance.objects.select_related(
                'employee__department',
                'employee__job_title',
                'created_by'
            ).all()
        else:
            try:
                employee = Employee.objects.get(user=user)
                return Attendance.objects.filter(employee=employee).select_related(
                    'employee__department',
                    'employee__job_title',
                    'created_by'
                )
            except Employee.DoesNotExist:
                return Attendance.objects.none()


# 4. Update attendance record
class AttendanceUpdateView(generics.UpdateAPIView):
    """
    PUT/PATCH: Update attendance record
    Admin and HR only
    """
    queryset = Attendance.objects.all()
    serializer_class = AttendanceUpdateSerializer
    permission_classes = [IsAdminOrHR]

    @transaction.atomic
    def update(self, request, *args, **kwargs):
        return super().update(request, *args, **kwargs)


# 5. Delete attendance record
class AttendanceDeleteView(generics.DestroyAPIView):
    """
    DELETE: Delete attendance record
    Admin and HR only
    """
    queryset = Attendance.objects.all()
    permission_classes = [IsAdminOrHR]

    @transaction.atomic
    def destroy(self, request, *args, **kwargs):
        attendance = self.get_object()
        employee_name = f"{attendance.employee.first_name} {attendance.employee.last_name}"
        
        super().destroy(request, *args, **kwargs)
        return Response(
            {"message": f"Attendance record for {employee_name} on {attendance.date} deleted successfully."},
            status=status.HTTP_200_OK
        )


# 6. Check-in endpoint (All employees)
@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def check_in(request):
    """
    POST: Check in employee
    All authenticated employees can check in
    """
    serializer = CheckInSerializer(data=request.data, context={'request': request})
    
    if serializer.is_valid():
        attendance = serializer.save()
        response_serializer = TodayAttendanceSerializer(attendance)
        return Response({
            'message': 'Successfully checked in',
            'attendance': response_serializer.data
        }, status=status.HTTP_201_CREATED)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# 7. Check-out endpoint (All employees)
@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def check_out(request):
    """
    POST: Check out employee
    All authenticated employees can check out
    """
    serializer = CheckOutSerializer(data=request.data, context={'request': request})
    
    if serializer.is_valid():
        attendance = serializer.save()
        response_serializer = TodayAttendanceSerializer(attendance)
        return Response({
            'message': 'Successfully checked out',
            'attendance': response_serializer.data
        }, status=status.HTTP_200_OK)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# 8. Today's attendance status for current user
@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def my_today_attendance(request):
    """
    GET: Get current user's attendance status for today
    All authenticated employees
    """
    try:
        employee = Employee.objects.get(user=request.user)
        today = date.today()
        
        try:
            attendance = Attendance.objects.get(employee=employee, date=today)
            serializer = TodayAttendanceSerializer(attendance)
            return Response(serializer.data)
        except Attendance.DoesNotExist:
            return Response({
                'message': 'No attendance record for today',
                'date': today,
                'is_checked_in': False,
                'is_completed': False
            })
    except Employee.DoesNotExist:
        return Response(
            {'error': 'Employee profile not found'},
            status=status.HTTP_404_NOT_FOUND
        )


# 9. Today's attendance overview (Admin/HR only)
@api_view(['GET'])
@permission_classes([IsAdminOrHR])
def today_attendance_overview(request):
    """
    GET: Get today's attendance overview for all employees
    Admin and HR only
    """
    today = date.today()
    
    # Get all active employees
    total_employees = Employee.objects.filter(is_active=True).count()
    
    # Get today's attendance records
    today_attendances = Attendance.objects.filter(date=today).select_related('employee')
    
    # Count by status
    status_counts = today_attendances.values('status').annotate(count=Count('id'))
    status_dict = {item['status']: item['count'] for item in status_counts}
    
    # Count check-in status
    checked_in_count = today_attendances.filter(
        check_in_time__isnull=False, 
        check_out_time__isnull=True
    ).count()
    
    completed_count = today_attendances.filter(
        check_in_time__isnull=False, 
        check_out_time__isnull=False
    ).count()
    
    present_count = status_dict.get('Present', 0) + status_dict.get('Late', 0)
    absent_count = total_employees - today_attendances.count()
    
    attendance_rate = (present_count / total_employees * 100) if total_employees > 0 else 0

    data = {
        'date': today,
        'total_employees': total_employees,
        'present_count': present_count,
        'absent_count': absent_count,
        'late_count': status_dict.get('Late', 0),
        'on_leave_count': status_dict.get('On Leave', 0),
        'currently_checked_in': checked_in_count,
        'completed_attendance': completed_count,
        'not_checked_in': total_employees - today_attendances.count(),
        'attendance_rate': round(attendance_rate, 2),
        'status_breakdown': status_dict
    }
    
    return Response(data)


# 10. Attendance statistics by date range (Admin/HR only)
@api_view(['GET'])
@permission_classes([IsAdminOrHR])
def attendance_statistics(request):
    """
    GET: Get attendance statistics for date range
    Admin and HR only
    """
    start_date = request.query_params.get('start_date')
    end_date = request.query_params.get('end_date')
    
    if not start_date or not end_date:
        return Response(
            {'error': 'start_date and end_date parameters are required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        start_date = datetime.strptime(start_date, '%Y-%m-%d').date()
        end_date = datetime.strptime(end_date, '%Y-%m-%d').date()
    except ValueError:
        return Response(
            {'error': 'Invalid date format. Use YYYY-MM-DD'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Get attendance records for the date range
    attendances = Attendance.objects.filter(
        date__range=[start_date, end_date]
    ).select_related('employee')
    
    # Group by date and calculate statistics
    daily_stats = []
    current_date = start_date
    
    while current_date <= end_date:
        day_attendances = attendances.filter(date=current_date)
        total_employees = Employee.objects.filter(is_active=True).count()
        
        status_counts = day_attendances.values('status').annotate(count=Count('id'))
        status_dict = {item['status']: item['count'] for item in status_counts}
        
        present_count = status_dict.get('Present', 0) + status_dict.get('Late', 0)
        absent_count = total_employees - day_attendances.count()
        attendance_rate = (present_count / total_employees * 100) if total_employees > 0 else 0
        
        daily_stats.append({
            'date': current_date,
            'total_employees': total_employees,
            'present_count': present_count,
            'absent_count': absent_count,
            'late_count': status_dict.get('Late', 0),
            'on_leave_count': status_dict.get('On Leave', 0),
            'not_checked_in': absent_count,
            'attendance_rate': round(attendance_rate, 2)
        })
        
        current_date += timedelta(days=1)
    
    # Calculate overall statistics
    overall_stats = {
        'total_days': (end_date - start_date).days + 1,
        'average_attendance_rate': round(
            sum(day['attendance_rate'] for day in daily_stats) / len(daily_stats), 2
        ) if daily_stats else 0,
        'total_present': sum(day['present_count'] for day in daily_stats),
        'total_absent': sum(day['absent_count'] for day in daily_stats),
        'total_late': sum(day['late_count'] for day in daily_stats),
    }
    
    return Response({
        'date_range': {
            'start_date': start_date,
            'end_date': end_date
        },
        'overall_statistics': overall_stats,
        'daily_statistics': daily_stats
    })


# 11. Monthly attendance summary
@api_view(['GET'])
@permission_classes([IsAdminOrHR])
def monthly_attendance_summary(request):
    """
    GET: Get monthly attendance summary for all employees
    Admin and HR only
    """
    month = request.query_params.get('month')  # Format: YYYY-MM
    
    if not month:
        # Default to current month
        today = date.today()
        month = f"{today.year}-{today.month:02d}"
    
    try:
        year, month_num = month.split('-')
        year, month_num = int(year), int(month_num)
        month_date = date(year, month_num, 1)
    except ValueError:
        return Response(
            {'error': 'Invalid month format. Use YYYY-MM'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Get or create summaries for all employees
    employees = Employee.objects.filter(is_active=True)
    summaries = []
    
    for employee in employees:
        summary = AttendanceSummary.update_or_create_summary(employee, month_date)
        summaries.append(summary)
    
    # Paginate results
    paginator = StandardResultsSetPagination()
    result_page = paginator.paginate_queryset(summaries, request)
    serializer = AttendanceSummarySerializer(result_page, many=True)
    
    return paginator.get_paginated_response(serializer.data)


# 12. Employee's own monthly summary
@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def my_monthly_summary(request):
    """
    GET: Get current user's monthly attendance summary
    All authenticated employees
    """
    try:
        employee = Employee.objects.get(user=request.user)
    except Employee.DoesNotExist:
        return Response(
            {'error': 'Employee profile not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    month = request.query_params.get('month')  # Format: YYYY-MM
    
    if not month:
        # Default to current month
        today = date.today()
        month = f"{today.year}-{today.month:02d}"
    
    try:
        year, month_num = month.split('-')
        year, month_num = int(year), int(month_num)
        month_date = date(year, month_num, 1)
    except ValueError:
        return Response(
            {'error': 'Invalid month format. Use YYYY-MM'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    summary = AttendanceSummary.update_or_create_summary(employee, month_date)
    serializer = AttendanceSummarySerializer(summary)
    
    return Response(serializer.data)


# 13. Attendance settings (Admin only)
class AttendanceSettingsView(generics.RetrieveUpdateAPIView):
    """
    GET: Retrieve attendance settings
    PUT/PATCH: Update attendance settings (Admin only)
    """
    serializer_class = AttendanceSettingsSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return AttendanceSettings.get_settings()

    def get_permissions(self):
        """Different permissions for GET and PUT/PATCH"""
        if self.request.method == 'GET':
            return [permissions.IsAuthenticated()]
        else:
            from accounts.permissions import IsAdmin
            return [IsAdmin()]


# 14. Bulk attendance operations (Admin/HR only)
@api_view(['POST'])
@permission_classes([IsAdminOrHR])
@transaction.atomic
def bulk_create_attendance(request):
    """
    POST: Create multiple attendance records
    Admin and HR only
    """
    serializer = BulkAttendanceSerializer(data=request.data, context={'request': request})
    
    if serializer.is_valid():
        result = serializer.save()
        return Response({
            'message': f"Bulk attendance creation completed",
            'created_count': result['created_count'],
            'error_count': result['error_count'],
            'errors': result['errors']
        }, status=status.HTTP_201_CREATED if result['created_count'] > 0 else status.HTTP_400_BAD_REQUEST)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# 15. Search employees for attendance (Admin/HR only)
@api_view(['GET'])
@permission_classes([IsAdminOrHR])
def search_employees_for_attendance(request):
    """
    GET: Search employees for attendance operations
    Admin and HR only
    """
    query = request.query_params.get('q', '').strip()
    
    if not query:
        return Response(
            {'error': 'Query parameter "q" is required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    employees = Employee.objects.filter(
        Q(first_name__icontains=query) |
        Q(last_name__icontains=query) |
        Q(phone__icontains=query) |
        Q(national_id__icontains=query),
        is_active=True
    ).select_related('department', 'job_title')[:20]  # Limit to 20 results
    
    from employees.serializers import EmployeeBasicSerializer
    serializer = EmployeeBasicSerializer(employees, many=True)
    
    return Response({
        'query': query,
        'count': employees.count(),
        'employees': serializer.data
    })


# 16. Export attendance data (Admin/HR only)
@api_view(['GET'])
@permission_classes([IsAdminOrHR])
def export_attendance_data(request):
    """
    GET: Export attendance data for a date range
    Admin and HR only
    Returns data suitable for CSV export
    """
    start_date = request.query_params.get('start_date')
    end_date = request.query_params.get('end_date')
    
    if not start_date or not end_date:
        return Response(
            {'error': 'start_date and end_date parameters are required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        start_date = datetime.strptime(start_date, '%Y-%m-%d').date()
        end_date = datetime.strptime(end_date, '%Y-%m-%d').date()
    except ValueError:
        return Response(
            {'error': 'Invalid date format. Use YYYY-MM-DD'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    attendances = Attendance.objects.filter(
        date__range=[start_date, end_date]
    ).select_related(
        'employee__department',
        'employee__job_title'
    ).order_by('date', 'employee__first_name')
    
    export_data = []
    for attendance in attendances:
        export_data.append({
            'date': attendance.date.strftime('%Y-%m-%d'),
            'employee_name': f"{attendance.employee.first_name} {attendance.employee.last_name}",
            'employee_id': attendance.employee.id,
            'department': attendance.employee.department.name,
            'job_title': attendance.employee.job_title.name,
            'check_in_time': attendance.check_in_time.strftime('%H:%M:%S') if attendance.check_in_time else '',
            'check_out_time': attendance.check_out_time.strftime('%H:%M:%S') if attendance.check_out_time else '',
            'total_hours': str(attendance.total_hours) if attendance.total_hours else '0',
            'overtime_hours': str(attendance.overtime_hours),
            'status': attendance.status,
            'notes': attendance.notes or ''
        })
    
    return Response({
        'date_range': {
            'start_date': start_date.strftime('%Y-%m-%d'),
            'end_date': end_date.strftime('%Y-%m-%d')
        },
        'total_records': len(export_data),
        'data': export_data
    })