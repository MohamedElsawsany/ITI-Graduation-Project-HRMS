from django.db import models
from django.core.validators import MinValueValidator
from employees.models import Employee
from accounts.models import CustomUser
from datetime import date


class Payroll(models.Model):
    PAYROLL_STATUS_CHOICES = [
        ('Draft', 'Draft'),
        ('Processed', 'Processed'),
        ('Paid', 'Paid'),
        ('Cancelled', 'Cancelled'),
    ]

    employee = models.ForeignKey(Employee, on_delete=models.PROTECT, related_name='payrolls')
    pay_period_start = models.DateField()
    pay_period_end = models.DateField()
    base_salary = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0)])
    overtime_hours = models.DecimalField(max_digits=5, decimal_places=2, default=0, validators=[MinValueValidator(0)])
    overtime_rate = models.DecimalField(max_digits=8, decimal_places=2, default=0, validators=[MinValueValidator(0)])
    overtime_pay = models.DecimalField(max_digits=10, decimal_places=2, default=0, validators=[MinValueValidator(0)])
    bonuses = models.DecimalField(max_digits=10, decimal_places=2, default=0, validators=[MinValueValidator(0)])
    deductions = models.DecimalField(max_digits=10, decimal_places=2, default=0, validators=[MinValueValidator(0)])
    gross_pay = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0)])
    tax_deduction = models.DecimalField(max_digits=10, decimal_places=2, default=0, validators=[MinValueValidator(0)])
    insurance_deduction = models.DecimalField(max_digits=10, decimal_places=2, default=0, validators=[MinValueValidator(0)])
    net_pay = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0)])
    status = models.CharField(max_length=20, choices=PAYROLL_STATUS_CHOICES, default='Draft')
    processed_by = models.ForeignKey(CustomUser, on_delete=models.PROTECT, related_name='processed_payrolls', null=True, blank=True)
    created_date = models.DateTimeField(auto_now_add=True)
    processed_date = models.DateTimeField(null=True, blank=True)
    notes = models.TextField(blank=True, null=True)

    class Meta:
        unique_together = ['employee', 'pay_period_start', 'pay_period_end']
        ordering = ['-pay_period_end', '-created_date']

    def save(self, *args, **kwargs):
        # Auto-calculate overtime pay
        self.overtime_pay = self.overtime_hours * self.overtime_rate
        
        # Auto-calculate gross pay
        self.gross_pay = self.base_salary + self.overtime_pay + self.bonuses
        
        # Auto-calculate net pay
        total_deductions = self.deductions + self.tax_deduction + self.insurance_deduction
        self.net_pay = self.gross_pay - total_deductions
        
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.employee.first_name} {self.employee.last_name} - {self.pay_period_start} to {self.pay_period_end}"

    @property
    def pay_period_month(self):
        """Return the month of the pay period for filtering"""
        return self.pay_period_start.strftime('%Y-%m')

    @property
    def total_deductions(self):
        """Return total deductions"""
        return self.deductions + self.tax_deduction + self.insurance_deduction


class PayrollHistory(models.Model):
    """Track changes made to payroll records"""
    payroll = models.ForeignKey(Payroll, on_delete=models.CASCADE, related_name='history')
    changed_by = models.ForeignKey(CustomUser, on_delete=models.PROTECT)
    change_date = models.DateTimeField(auto_now_add=True)
    change_description = models.TextField()
    old_status = models.CharField(max_length=20, blank=True, null=True)
    new_status = models.CharField(max_length=20, blank=True, null=True)

    class Meta:
        ordering = ['-change_date']

    def __str__(self):
        return f"Payroll {self.payroll.id} - Changed by {self.changed_by.username} on {self.change_date}"