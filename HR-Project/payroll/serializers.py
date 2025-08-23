from rest_framework import serializers
from django.utils import timezone
from datetime import date, datetime
from .models import Payroll, PayrollHistory
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


class PayrollListSerializer(serializers.ModelSerializer):
    employee_details = EmployeeBasicSerializer(source='employee', read_only=True)
    processed_by_name = serializers.CharField(source='processed_by.username', read_only=True)
    pay_period_month = serializers.ReadOnlyField()
    total_deductions = serializers.ReadOnlyField()

    class Meta:
        model = Payroll
        fields = [
            'id', 'employee_details', 'pay_period_start', 'pay_period_end',
            'pay_period_month', 'base_salary', 'gross_pay', 'total_deductions',
            'net_pay', 'status', 'processed_by_name', 'created_date', 'processed_date'
        ]


class PayrollDetailSerializer(serializers.ModelSerializer):
    employee_details = EmployeeBasicSerializer(source='employee', read_only=True)
    processed_by_name = serializers.CharField(source='processed_by.username', read_only=True)
    pay_period_month = serializers.ReadOnlyField()
    total_deductions = serializers.ReadOnlyField()

    class Meta:
        model = Payroll
        fields = [
            'id', 'employee_details', 'pay_period_start', 'pay_period_end',
            'pay_period_month', 'base_salary', 'overtime_hours', 'overtime_rate',
            'overtime_pay', 'bonuses', 'deductions', 'gross_pay', 'tax_deduction',
            'insurance_deduction', 'total_deductions', 'net_pay', 'status',
            'processed_by', 'processed_by_name', 'created_date', 'processed_date', 'notes'
        ]
        read_only_fields = ['overtime_pay', 'gross_pay', 'total_deductions', 'net_pay']


class PayrollCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payroll
        fields = [
            'id', 'employee', 'pay_period_start', 'pay_period_end', 'base_salary',
            'overtime_hours', 'overtime_rate', 'bonuses', 'deductions',
            'tax_deduction', 'insurance_deduction', 'notes'
        ]
        read_only_fields = ['id']  # Make id read-only so it's included in response

    def validate(self, data):
        # Validate date range
        if data['pay_period_start'] > data['pay_period_end']:
            raise serializers.ValidationError("Pay period start date cannot be after end date.")

        # Validate dates are not in the future
        if data['pay_period_start'] > date.today():
            raise serializers.ValidationError("Pay period start date cannot be in the future.")

        if data['pay_period_end'] > date.today():
            raise serializers.ValidationError("Pay period end date cannot be in the future.")

        # Check for overlapping pay periods for the same employee
        employee = data['employee']
        overlapping = Payroll.objects.filter(
            employee=employee,
            pay_period_start__lte=data['pay_period_end'],
            pay_period_end__gte=data['pay_period_start']
        )

        if self.instance:  # Update case
            overlapping = overlapping.exclude(id=self.instance.id)

        if overlapping.exists():
            raise serializers.ValidationError(
                "Pay period overlaps with existing payroll record for this employee."
            )

        return data

    def validate_employee(self, value):
        """Validate employee exists and is active"""
        if not value.is_active:
            raise serializers.ValidationError("Cannot create payroll for inactive employee.")
        return value

    def validate_base_salary(self, value):
        """Validate base salary is positive"""
        if value <= 0:
            raise serializers.ValidationError("Base salary must be greater than 0.")
        return value

    def validate_overtime_hours(self, value):
        """Validate overtime hours"""
        if value < 0:
            raise serializers.ValidationError("Overtime hours cannot be negative.")
        if value > 200:  # Reasonable limit
            raise serializers.ValidationError("Overtime hours seem excessive. Please verify.")
        return value

    def validate_overtime_rate(self, value):
        """Validate overtime rate"""
        if value < 0:
            raise serializers.ValidationError("Overtime rate cannot be negative.")
        return value


class PayrollUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payroll
        fields = [
            'pay_period_start', 'pay_period_end', 'base_salary',
            'overtime_hours', 'overtime_rate', 'bonuses', 'deductions',
            'tax_deduction', 'insurance_deduction', 'notes'
        ]

    def validate(self, data):
        # Only allow updates if status is Draft
        if self.instance and self.instance.status != 'Draft':
            raise serializers.ValidationError(
                f"Cannot update payroll with status '{self.instance.status}'. Only Draft payrolls can be updated."
            )

        # Validate date range
        if data.get('pay_period_start') and data.get('pay_period_end'):
            if data['pay_period_start'] > data['pay_period_end']:
                raise serializers.ValidationError("Pay period start date cannot be after end date.")

        return data


class PayrollStatusUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payroll
        fields = ['status']

    def validate_status(self, value):
        valid_transitions = {
            'Draft': ['Processed', 'Cancelled'],
            'Processed': ['Paid', 'Cancelled'],
            'Paid': [],  # Cannot change from Paid
            'Cancelled': ['Draft']  # Can reopen cancelled payroll
        }

        if self.instance:
            current_status = self.instance.status
            if value not in valid_transitions.get(current_status, []):
                raise serializers.ValidationError(
                    f"Cannot change status from '{current_status}' to '{value}'. "
                    f"Valid transitions: {valid_transitions.get(current_status, [])}"
                )

        return value

    def update(self, instance, validated_data):
        old_status = instance.status
        new_status = validated_data['status']
        
        # Set processed_by and processed_date when status changes to Processed or Paid
        if new_status in ['Processed', 'Paid'] and old_status != new_status:
            instance.processed_by = self.context['request'].user
            instance.processed_date = timezone.now()

        instance.status = new_status
        instance.save()

        # Create history record
        PayrollHistory.objects.create(
            payroll=instance,
            changed_by=self.context['request'].user,
            change_description=f"Status changed from '{old_status}' to '{new_status}'",
            old_status=old_status,
            new_status=new_status
        )

        return instance


class PayrollHistorySerializer(serializers.ModelSerializer):
    changed_by_name = serializers.CharField(source='changed_by.username', read_only=True)

    class Meta:
        model = PayrollHistory
        fields = [
            'id', 'change_date', 'changed_by', 'changed_by_name',
            'change_description', 'old_status', 'new_status'
        ]


class PayrollSummarySerializer(serializers.Serializer):
    """Serializer for payroll summary statistics"""
    month = serializers.CharField()
    total_employees = serializers.IntegerField()
    total_gross_pay = serializers.DecimalField(max_digits=12, decimal_places=2)
    total_deductions = serializers.DecimalField(max_digits=12, decimal_places=2)
    total_net_pay = serializers.DecimalField(max_digits=12, decimal_places=2)
    draft_count = serializers.IntegerField()
    processed_count = serializers.IntegerField()
    paid_count = serializers.IntegerField()
    cancelled_count = serializers.IntegerField()