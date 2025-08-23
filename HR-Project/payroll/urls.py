from django.urls import path
from . import views

urlpatterns = [
    # List views
    path('payrolls/', views.PayrollListView.as_view(), name='payroll-list'),  # Admin/HR only
    path('payrolls/my-payrolls/', views.MyPayrollListView.as_view(), name='my-payrolls'),  # Employee's own payrolls
    
    # CRUD operations
    path('payrolls/create/', views.PayrollCreateView.as_view(), name='payroll-create'),  # Admin/HR only
    path('payrolls/<int:pk>/', views.PayrollDetailView.as_view(), name='payroll-detail'),  # Admin/HR see any, Employee see own
    path('payrolls/<int:pk>/update/', views.PayrollUpdateView.as_view(), name='payroll-update'),  # Admin/HR only
    path('payrolls/<int:pk>/delete/', views.PayrollDeleteView.as_view(), name='payroll-delete'),  # Admin/HR only
    
    # Status management
    path('payrolls/<int:pk>/status/', views.update_payroll_status, name='payroll-status-update'),  # Admin/HR only
    
    # History and tracking
    path('payrolls/<int:pk>/history/', views.payroll_history, name='payroll-history'),  # Admin/HR only
    
    # Summary and reports
    path('payrolls/summary/', views.payroll_summary, name='payroll-summary'),  # Admin/HR only
    
    # Bulk operations
    path('payrolls/bulk-create/', views.bulk_create_payrolls, name='bulk-create-payrolls'),  # Admin/HR only
]

# URL Examples and Usage:
"""
1. GET /api/payrolls/ - List all payrolls (Admin/HR only)
   - Query params: ?month=2024-01&employee=5&status=Paid&department=2

2. GET /api/payrolls/my-payrolls/ - Employee's own payrolls
   - Query params: ?month=2024-01&status=Paid

3. POST /api/payrolls/create/ - Create new payroll (Admin/HR only)

4. GET /api/payrolls/123/ - Get specific payroll details
   - Admin/HR can see any, employees can see their own

5. PUT/PATCH /api/payrolls/123/update/ - Update payroll (Admin/HR only)

6. DELETE /api/payrolls/123/delete/ - Delete payroll (Admin/HR only)

7. PATCH /api/payrolls/123/status/ - Update payroll status (Admin/HR only)
   - Body: {"status": "Processed"}

8. GET /api/payrolls/123/history/ - Get payroll change history (Admin/HR only)

9. GET /api/payrolls/summary/ - Get payroll summary statistics (Admin/HR only)
   - Query params: ?month=2024-01

10. POST /api/payrolls/bulk-create/ - Bulk create payrolls (Admin/HR only)
"""