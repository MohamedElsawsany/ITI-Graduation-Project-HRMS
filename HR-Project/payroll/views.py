from rest_framework import generics, status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.db import transaction
from django.db.models import Q, Sum, Count, Case, When, IntegerField
from django.utils import timezone
from datetime import datetime, date
from .models import Payroll, PayrollHistory
from employees.models import Employee
from accounts.permissions import IsAdminOrHR
from TalentFlow.pagination import StandardResultsSetPagination
from .serializers import (
    PayrollListSerializer,
    PayrollDetailSerializer,
    PayrollCreateSerializer,
    PayrollUpdateSerializer,
    PayrollStatusUpdateSerializer,
    PayrollHistorySerializer,
    PayrollSummarySerializer
)



# 1. List all payrolls (Admin and HR only)
class PayrollListView(generics.ListAPIView):
    """
    GET: List all payroll records with filtering by month, employee, status
    Admin and HR only
    """
    serializer_class = PayrollListSerializer
    permission_classes = [IsAdminOrHR]
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        queryset = Payroll.objects.select_related(
            'employee__department',
            'employee__job_title',
            'processed_by'
        ).all()

        # Filter by month (format: YYYY-MM)
        month = self.request.query_params.get('month')
        if month:
            try:
                year, month_num = month.split('-')
                queryset = queryset.filter(
                    pay_period_start__year=year,
                    pay_period_start__month=month_num
                )
            except ValueError:
                pass  # Invalid format, ignore filter

        # Filter by employee
        employee_id = self.request.query_params.get('employee')
        if employee_id:
            queryset = queryset.filter(employee_id=employee_id)

        # Filter by status
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)

        # Filter by department
        department_id = self.request.query_params.get('department')
        if department_id:
            queryset = queryset.filter(employee__department_id=department_id)

        return queryset.order_by('-pay_period_end', '-created_date')


# 2. Employee's own payroll history
class MyPayrollListView(generics.ListAPIView):
    """
    GET: List current user's payroll records with filtering by month
    Authenticated employees can see their own payroll history
    """
    serializer_class = PayrollListSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        # Get the employee record for current user
        try:
            employee = Employee.objects.get(user=self.request.user)
        except Employee.DoesNotExist:
            return Payroll.objects.none()

        queryset = Payroll.objects.filter(employee=employee).select_related(
            'employee__department',
            'employee__job_title',
            'processed_by'
        )

        # Filter by month (format: YYYY-MM)
        month = self.request.query_params.get('month')
        if month:
            try:
                year, month_num = month.split('-')
                queryset = queryset.filter(
                    pay_period_start__year=year,
                    pay_period_start__month=month_num
                )
            except ValueError:
                pass  # Invalid format, ignore filter

        # Filter by status
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)

        return queryset.order_by('-pay_period_end', '-created_date')


# 3. Create new payroll record
class PayrollCreateView(generics.CreateAPIView):
    """
    POST: Create a new payroll record
    Admin and HR only
    """
    queryset = Payroll.objects.all()
    serializer_class = PayrollCreateSerializer
    permission_classes = [IsAdminOrHR]

    @transaction.atomic
    def create(self, request, *args, **kwargs):
        """Override to ensure atomic transaction and add history"""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Save the payroll object
        payroll = serializer.save()
        
        # Create history record
        PayrollHistory.objects.create(
            payroll=payroll,
            changed_by=request.user,
            change_description=f"Payroll record created with status '{payroll.status}'"
        )
        
        # Return the created payroll data including the ID
        response_data = serializer.data
        headers = self.get_success_headers(response_data)
        return Response(response_data, status=status.HTTP_201_CREATED, headers=headers)


# 4. Payroll detail view
class PayrollDetailView(generics.RetrieveAPIView):
    """
    GET: Retrieve specific payroll record
    Admin/HR can see any payroll, employees can see their own
    """
    serializer_class = PayrollDetailSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        
        # Admin and HR can see all payrolls
        if user.is_superuser or getattr(user, 'role', None) in ['Admin', 'HR']:
            return Payroll.objects.select_related(
                'employee__department',
                'employee__job_title',
                'processed_by'
            ).all()
        
        # Regular employees can only see their own payrolls
        try:
            employee = Employee.objects.get(user=user)
            return Payroll.objects.filter(employee=employee).select_related(
                'employee__department',
                'employee__job_title',
                'processed_by'
            )
        except Employee.DoesNotExist:
            return Payroll.objects.none()


# 5. Update payroll record
class PayrollUpdateView(generics.UpdateAPIView):
    """
    PUT/PATCH: Update payroll record
    Admin and HR only, only Draft payrolls can be updated
    """
    queryset = Payroll.objects.all()
    serializer_class = PayrollUpdateSerializer
    permission_classes = [IsAdminOrHR]

    @transaction.atomic
    def update(self, request, *args, **kwargs):
        """Override to add history tracking"""
        payroll = self.get_object()
        old_data = {
            'base_salary': payroll.base_salary,
            'overtime_hours': payroll.overtime_hours,
            'overtime_rate': payroll.overtime_rate,
            'bonuses': payroll.bonuses,
            'deductions': payroll.deductions,
        }
        
        response = super().update(request, *args, **kwargs)
        
        if response.status_code == status.HTTP_200_OK:
            payroll.refresh_from_db()
            changes = []
            
            # Track what changed
            for field, old_value in old_data.items():
                new_value = getattr(payroll, field)
                if old_value != new_value:
                    changes.append(f"{field}: {old_value} → {new_value}")
            
            if changes:
                PayrollHistory.objects.create(
                    payroll=payroll,
                    changed_by=request.user,
                    change_description=f"Payroll updated: {', '.join(changes)}"
                )
        
        return response


# 6. Delete payroll record
class PayrollDeleteView(generics.DestroyAPIView):
    """
    DELETE: Delete payroll record
    Admin and HR only, only Draft payrolls can be deleted
    """
    queryset = Payroll.objects.all()
    permission_classes = [IsAdminOrHR]

    def get_object(self):
        obj = super().get_object()
        if obj.status != 'Draft':
            from rest_framework.exceptions import ValidationError
            raise ValidationError(f"Cannot delete payroll with status '{obj.status}'. Only Draft payrolls can be deleted.")
        return obj

    @transaction.atomic
    def destroy(self, request, *args, **kwargs):
        payroll = self.get_object()
        employee_name = f"{payroll.employee.first_name} {payroll.employee.last_name}"
        
        # Create history before deletion
        PayrollHistory.objects.create(
            payroll=payroll,
            changed_by=request.user,
            change_description=f"Payroll record deleted for {employee_name} ({payroll.pay_period_start} to {payroll.pay_period_end})"
        )
        
        response = super().destroy(request, *args, **kwargs)
        return Response(
            {"message": "Payroll record deleted successfully."},
            status=status.HTTP_200_OK
        )


# 7. Update payroll status
@api_view(['PATCH'])
@permission_classes([IsAdminOrHR])
def update_payroll_status(request, pk):
    """
    PATCH: Update payroll status (Draft → Processed → Paid)
    Admin and HR only
    """
    payroll = get_object_or_404(Payroll, pk=pk)
    
    serializer = PayrollStatusUpdateSerializer(
        payroll,
        data=request.data,
        context={'request': request},
        partial=True
    )
    
    if serializer.is_valid():
        serializer.save()
        response_serializer = PayrollDetailSerializer(payroll)
        return Response(response_serializer.data, status=status.HTTP_200_OK)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# 8. Payroll history for a specific payroll
@api_view(['GET'])
@permission_classes([IsAdminOrHR])
def payroll_history(request, pk):
    """
    GET: Get history of changes for a specific payroll
    Admin and HR only
    """
    payroll = get_object_or_404(Payroll, pk=pk)
    history = PayrollHistory.objects.filter(payroll=payroll).select_related('changed_by')
    
    paginator = StandardResultsSetPagination()
    result_page = paginator.paginate_queryset(history, request)
    serializer = PayrollHistorySerializer(result_page, many=True)
    
    return paginator.get_paginated_response(serializer.data)


# 9. Payroll summary statistics
@api_view(['GET'])
@permission_classes([IsAdminOrHR])
def payroll_summary(request):
    """
    GET: Get payroll summary statistics by month
    Admin and HR only
    """
    # Get month parameter (default to current month)
    month = request.query_params.get('month')
    if month:
        try:
            year, month_num = month.split('-')
            year, month_num = int(year), int(month_num)
        except ValueError:
            return Response(
                {'error': 'Invalid month format. Use YYYY-MM'},
                status=status.HTTP_400_BAD_REQUEST
            )
    else:
        today = date.today()
        year, month_num = today.year, today.month
        month = f"{year}-{month_num:02d}"

    # Get payroll records for the month
    payrolls = Payroll.objects.filter(
        pay_period_start__year=year,
        pay_period_start__month=month_num
    )

    if not payrolls.exists():
        return Response({
            'month': month,
            'total_employees': 0,
            'total_gross_pay': '0.00',
            'total_deductions': '0.00',
            'total_net_pay': '0.00',
            'draft_count': 0,
            'processed_count': 0,
            'paid_count': 0,
            'cancelled_count': 0
        })

    # Calculate summary statistics
    summary = payrolls.aggregate(
        total_employees=Count('id'),
        total_gross_pay=Sum('gross_pay'),
        total_deductions=Sum('deductions') + Sum('tax_deduction') + Sum('insurance_deduction'),
        total_net_pay=Sum('net_pay'),
        draft_count=Count(Case(When(status='Draft', then=1), output_field=IntegerField())),
        processed_count=Count(Case(When(status='Processed', then=1), output_field=IntegerField())),
        paid_count=Count(Case(When(status='Paid', then=1), output_field=IntegerField())),
        cancelled_count=Count(Case(When(status='Cancelled', then=1), output_field=IntegerField()))
    )

    # Add month to summary
    summary['month'] = month
    
    # Handle None values
    for key, value in summary.items():
        if value is None:
            summary[key] = 0 if key.endswith('_count') or key == 'total_employees' else '0.00'

    return Response(summary)


# 10. Bulk create payrolls for multiple employees
@api_view(['POST'])
@permission_classes([IsAdminOrHR])
@transaction.atomic
def bulk_create_payrolls(request):
    """
    POST: Create payroll records for multiple employees
    Admin and HR only
    """
    payroll_data_list = request.data.get('payrolls', [])
    
    if not payroll_data_list:
        return Response(
            {'error': 'No payroll data provided'},
            status=status.HTTP_400_BAD_REQUEST
        )

    created_payrolls = []
    errors = []

    for i, payroll_data in enumerate(payroll_data_list):
        serializer = PayrollCreateSerializer(data=payroll_data)
        if serializer.is_valid():
            payroll = serializer.save()
            # Create history record
            PayrollHistory.objects.create(
                payroll=payroll,
                changed_by=request.user,
                change_description=f"Payroll record created via bulk operation"
            )
            created_payrolls.append(PayrollDetailSerializer(payroll).data)
        else:
            errors.append({
                'index': i,
                'employee_id': payroll_data.get('employee'),
                'errors': serializer.errors
            })

    return Response({
        'created': len(created_payrolls),
        'errors': len(errors),
        'payrolls': created_payrolls,
        'error_details': errors
    }, status=status.HTTP_201_CREATED if created_payrolls else status.HTTP_400_BAD_REQUEST)