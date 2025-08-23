from django.urls import path
from . import views

urlpatterns = [
    # Attendance CRUD operations
    path('attendances/', views.AttendanceListView.as_view(), name='attendance-list'),
    path('attendances/create/', views.AttendanceCreateView.as_view(), name='attendance-create'),
    path('attendances/<int:pk>/', views.AttendanceDetailView.as_view(), name='attendance-detail'),
    path('attendances/<int:pk>/update/', views.AttendanceUpdateView.as_view(), name='attendance-update'),
    path('attendances/<int:pk>/delete/', views.AttendanceDeleteView.as_view(), name='attendance-delete'),
    
    # Check-in/Check-out operations (All employees)
    path('attendance/check-in/', views.check_in, name='attendance-check-in'),
    path('attendance/check-out/', views.check_out, name='attendance-check-out'),
    
    # Today's attendance
    path('attendance/my-today/', views.my_today_attendance, name='my-today-attendance'),
    path('attendance/today-overview/', views.today_attendance_overview, name='today-attendance-overview'),
    
    # Attendance statistics and reports
    path('attendance/statistics/', views.attendance_statistics, name='attendance-statistics'),
    path('attendance/monthly-summary/', views.monthly_attendance_summary, name='monthly-attendance-summary'),
    path('attendance/my-monthly-summary/', views.my_monthly_summary, name='my-monthly-attendance-summary'),
    
    # Attendance settings
    path('attendance/settings/', views.AttendanceSettingsView.as_view(), name='attendance-settings'),
    
    # Bulk operations
    path('attendance/bulk-create/', views.bulk_create_attendance, name='bulk-create-attendance'),
    
    # Utility endpoints
    path('attendance/search-employees/', views.search_employees_for_attendance, name='search-employees-attendance'),
    path('attendance/export/', views.export_attendance_data, name='export-attendance-data'),
]