from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from django.utils.safestring import mark_safe
from .models import Payroll, PayrollHistory


@admin.register(Payroll)
class PayrollAdmin(admin.ModelAdmin):
    list_display = [
        'id',
        'employee_name',
        'pay_period_display',
        'base_salary',
        'gross_pay',
        'net_pay',
        'status_badge',
        'processed_by',
        'created_date'
    ]
    
    list_filter = [
        'status',
        'pay_period_start',
        'created_date',
        'employee__department',
        'employee__job_title'
    ]
    
    search_fields = [
        'employee__first_name',
        'employee__last_name',
        'employee__national_id',
        'notes'
    ]
    
    readonly_fields = [
        'overtime_pay',
        'gross_pay',
        'net_pay',
        'total_deductions_display',
        'created_date',
        'processed_date'
    ]
    
    fieldsets = (
        ('Employee Information', {
            'fields': ('employee',)
        }),
        ('Pay Period', {
            'fields': ('pay_period_start', 'pay_period_end')
        }),
        ('Salary Details', {
            'fields': (
                'base_salary',
                ('overtime_hours', 'overtime_rate'),
                'overtime_pay',
                'bonuses'
            )
        }),
        ('Deductions', {
            'fields': (
                'deductions',
                'tax_deduction',
                'insurance_deduction',
                'total_deductions_display'
            )
        }),
        ('Calculations', {
            'fields': ('gross_pay', 'net_pay'),
            'classes': ('collapse',)
        }),
        ('Status & Processing', {
            'fields': (
                'status',
                'processed_by',
                'processed_date',
                'notes'
            )
        }),
        ('Timestamps', {
            'fields': ('created_date',),
            'classes': ('collapse',)
        })
    )
    
    ordering = ['-pay_period_end', '-created_date']
    date_hierarchy = 'pay_period_start'
    
    def employee_name(self, obj):
        return f"{obj.employee.first_name} {obj.employee.last_name}"
    employee_name.short_description = 'Employee'
    employee_name.admin_order_field = 'employee__first_name'
    
    def pay_period_display(self, obj):
        return f"{obj.pay_period_start} to {obj.pay_period_end}"
    pay_period_display.short_description = 'Pay Period'
    
    def status_badge(self, obj):
        colors = {
            'Draft': 'gray',
            'Processed': 'orange',
            'Paid': 'green',
            'Cancelled': 'red'
        }
        color = colors.get(obj.status, 'gray')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 8px; border-radius: 3px; font-size: 11px;">{}</span>',
            color,
            obj.status
        )
    status_badge.short_description = 'Status'
    status_badge.admin_order_field = 'status'
    
    def total_deductions_display(self, obj):
        return obj.total_deductions
    total_deductions_display.short_description = 'Total Deductions'
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related(
            'employee__department',
            'employee__job_title',
            'processed_by'
        )
    
    def save_model(self, request, obj, form, change):
        if not change:  # Creating new record
            obj.save()  # This will trigger the auto-calculations
            # Create history record
            PayrollHistory.objects.create(
                payroll=obj,
                changed_by=request.user,
                change_description=f"Payroll record created via Django Admin"
            )
        else:  # Updating existing record
            # Track changes
            if obj.pk:
                old_obj = Payroll.objects.get(pk=obj.pk)
                changes = []
                
                fields_to_track = ['status', 'base_salary', 'overtime_hours', 'overtime_rate', 'bonuses', 'deductions']
                for field in fields_to_track:
                    old_value = getattr(old_obj, field)
                    new_value = getattr(obj, field)
                    if old_value != new_value:
                        changes.append(f"{field}: {old_value} → {new_value}")
                
                obj.save()
                
                if changes:
                    PayrollHistory.objects.create(
                        payroll=obj,
                        changed_by=request.user,
                        change_description=f"Updated via Django Admin: {', '.join(changes)}"
                    )
            else:
                obj.save()


@admin.register(PayrollHistory)
class PayrollHistoryAdmin(admin.ModelAdmin):
    list_display = [
        'id',
        'payroll_employee',
        'change_date',
        'changed_by',
        'change_description_short',
        'status_change'
    ]
    
    list_filter = [
        'change_date',
        'changed_by',
        'old_status',
        'new_status'
    ]
    
    search_fields = [
        'payroll__employee__first_name',
        'payroll__employee__last_name',
        'changed_by__username',
        'change_description'
    ]
    
    readonly_fields = [
        'payroll',
        'changed_by',
        'change_date',
        'change_description',
        'old_status',
        'new_status'
    ]
    
    ordering = ['-change_date']
    date_hierarchy = 'change_date'
    
    def payroll_employee(self, obj):
        return f"{obj.payroll.employee.first_name} {obj.payroll.employee.last_name}"
    payroll_employee.short_description = 'Employee'
    
    def change_description_short(self, obj):
        if len(obj.change_description) > 50:
            return obj.change_description[:50] + '...'
        return obj.change_description
    change_description_short.short_description = 'Description'
    
    def status_change(self, obj):
        if obj.old_status and obj.new_status:
            return f"{obj.old_status} → {obj.new_status}"
        return '-'
    status_change.short_description = 'Status Change'
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related(
            'payroll__employee',
            'changed_by'
        )
    
    def has_add_permission(self, request):
        return False  # Don't allow manual creation of history records
    
    def has_delete_permission(self, request, obj=None):
        return False  # Don't allow deletion of history records