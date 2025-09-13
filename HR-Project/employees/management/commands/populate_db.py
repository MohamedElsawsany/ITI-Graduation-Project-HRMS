from django.core.management.base import BaseCommand
from django.contrib.auth.hashers import make_password
from django.utils import timezone
from django.db import transaction
from faker import Faker
import random
from datetime import date, timedelta, datetime, time
from decimal import Decimal

from accounts.models import CustomUser
from employees.models import Department, JobTitle, Employee
from leaves.models import LeaveRequest
from payroll.models import Payroll, PayrollHistory
from attendance.models import Attendance, AttendanceSettings, AttendanceSummary
from notification.models import (
    Notification, NotificationType, NotificationPreference, 
    NotificationTemplate, NotificationLog
)


class Command(BaseCommand):
    help = 'Populate database with fake data for testing'

    def add_arguments(self, parser):
        parser.add_argument(
            '--users',
            type=int,
            default=100,
            help='Number of users to create (default: 100)'
        )
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Clear existing data before populating'
        )
        parser.add_argument(
            '--verbose',
            action='store_true',
            help='Show detailed output'
        )

    def handle(self, *args, **options):
        fake = Faker()
        Faker.seed(12345)  # For reproducible results
        
        users_count = options['users']
        verbose = options['verbose']
        
        if options['clear']:
            self.stdout.write(self.style.WARNING('Clearing existing data...'))
            self.clear_data()
            
        self.stdout.write(self.style.SUCCESS(f'Starting to populate database with {users_count} users and related data...'))
        
        with transaction.atomic():
            # Create base data
            departments = self.create_departments(fake)
            job_titles = self.create_job_titles(fake)
            
            # Create users and employees
            users = self.create_users(fake, users_count, verbose)
            employees = self.create_employees(fake, users, departments, job_titles, verbose)
            
            # Create attendance settings
            self.create_attendance_settings()
            
            # Create related data
            self.create_leave_requests(fake, employees, verbose)
            payrolls = self.create_payrolls(fake, employees, verbose)
            attendances = self.create_attendances(fake, employees, verbose)
            
            # Create notifications
            self.create_notification_types(fake)
            self.create_notifications(fake, users, employees, verbose)
            self.create_notification_preferences(users)
            
            # Create summaries and logs
            self.create_attendance_summaries(employees)
            self.create_payroll_history(fake, payrolls, users)
            
        self.stdout.write(
            self.style.SUCCESS(
                f'Successfully populated database with:\n'
                f'- {len(users)} users\n'
                f'- {len(employees)} employees\n'
                f'- {len(departments)} departments\n'
                f'- {len(job_titles)} job titles\n'
                f'- {LeaveRequest.objects.count()} leave requests\n'
                f'- {len(payrolls)} payroll records\n'
                f'- {len(attendances)} attendance records\n'
                f'- {Notification.objects.count()} notifications'
            )
        )

    def clear_data(self):
        """Clear existing data"""
        models_to_clear = [
            NotificationLog, Notification, NotificationPreference, NotificationTemplate, NotificationType,
            AttendanceSummary, Attendance, PayrollHistory, Payroll,
            LeaveRequest, Employee, CustomUser, JobTitle, Department
        ]
        
        for model in models_to_clear:
            count = model.objects.count()
            if count > 0:
                model.objects.all().delete()
                self.stdout.write(f'Cleared {count} {model.__name__} records')

    def create_departments(self, fake):
        """Create departments"""
        dept_names = [
            'Human Resources', 'Information Technology', 'Finance', 'Marketing',
            'Sales', 'Operations', 'Customer Service', 'Legal', 'Research & Development',
            'Quality Assurance', 'Production', 'Procurement'
        ]
        
        departments = []
        for name in dept_names:
            dept, created = Department.objects.get_or_create(
                name=name,
                defaults={'description': fake.text(max_nb_chars=200)}
            )
            departments.append(dept)
            
        self.stdout.write(f'Created {len(departments)} departments')
        return departments

    def create_job_titles(self, fake):
        """Create job titles"""
        titles = [
            'Software Engineer', 'Senior Software Engineer', 'Tech Lead', 'Engineering Manager',
            'Product Manager', 'Project Manager', 'Business Analyst', 'Data Analyst',
            'HR Specialist', 'HR Manager', 'Recruiter', 'Accountant', 'Financial Analyst',
            'Marketing Specialist', 'Sales Representative', 'Sales Manager', 'Customer Support',
            'Operations Manager', 'Quality Assurance Engineer', 'DevOps Engineer',
            'UI/UX Designer', 'Content Writer', 'Legal Counsel', 'Research Scientist'
        ]
        
        job_titles = []
        for title in titles:
            job_title, created = JobTitle.objects.get_or_create(
                name=title,
                defaults={'description': fake.text(max_nb_chars=150)}
            )
            job_titles.append(job_title)
            
        self.stdout.write(f'Created {len(job_titles)} job titles')
        return job_titles

    def create_users(self, fake, count, verbose):
        """Create users with different roles"""
        users = []
        roles = ['admin', 'hr', 'employee']
        role_distribution = {
            'admin': max(1, count // 20),      # 5% admins
            'hr': max(2, count // 10),         # 10% HR
            'employee': count - max(1, count // 20) - max(2, count // 10)  # Rest employees
        }
        
        # Create admin users
        for i in range(role_distribution['admin']):
            username = f'admin_{i+1}' if i > 0 else 'admin'
            user = CustomUser.objects.create(
                username=username,
                email=fake.email(),
                first_name=fake.first_name(),
                last_name=fake.last_name(),
                password=make_password('password123'),
                role='admin',
                is_staff=True,
                is_superuser=True if i == 0 else False
            )
            users.append(user)
            if verbose:
                self.stdout.write(f'Created admin user: {username}')

        # Create HR users
        for i in range(role_distribution['hr']):
            username = f'hr_{i+1}'
            user = CustomUser.objects.create(
                username=username,
                email=fake.email(),
                first_name=fake.first_name(),
                last_name=fake.last_name(),
                password=make_password('password123'),
                role='hr',
                is_staff=True
            )
            users.append(user)
            if verbose:
                self.stdout.write(f'Created HR user: {username}')

        # Create employee users
        for i in range(role_distribution['employee']):
            username = f'emp_{i+1:04d}'
            user = CustomUser.objects.create(
                username=username,
                email=fake.email(),
                first_name=fake.first_name(),
                last_name=fake.last_name(),
                password=make_password('password123'),
                role='employee'
            )
            users.append(user)
            if verbose and i % 20 == 0:
                self.stdout.write(f'Created {i+1} employee users...')

        self.stdout.write(f'Created {len(users)} users')
        return users

    def create_employees(self, fake, users, departments, job_titles, verbose):
        """Create employee profiles"""
        employees = []
        employee_users = [u for u in users if u.role == 'employee']
        
        for i, user in enumerate(employee_users):
            # Generate consistent data
            hire_date = fake.date_between(start_date='-5y', end_date='today')
            birth_date = fake.date_between(start_date='-65y', end_date='-18y')
            
            employee = Employee.objects.create(
                user=user,
                first_name=user.first_name,
                last_name=user.last_name,
                date_of_birth=birth_date,
                gender=random.choice(['Male', 'Female']),
                phone=f"01{random.randint(100000000, 999999999)}",
                address=fake.address(),
                hire_date=hire_date,
                national_id=f"{random.randint(10000000000000, 99999999999999)}",
                marital_status=random.choice(['Single', 'Married', 'Widowed', 'Divorced']),
                emergency_contact=f"01{random.randint(100000000, 999999999)}",
                annual_leave_balance=random.randint(15, 30),
                is_active=random.choice([True] * 9 + [False]),  # 90% active
                department=random.choice(departments),
                job_title=random.choice(job_titles)
            )
            employees.append(employee)
            
            if verbose and i % 50 == 0:
                self.stdout.write(f'Created {i+1} employees...')

        # Assign some employees as department managers
        for dept in departments:
            if employees:
                manager_employee = random.choice(employees)
                if manager_employee.user.role == 'employee':
                    dept.manager = manager_employee.user
                    dept.save()

        self.stdout.write(f'Created {len(employees)} employee profiles')
        return employees

    def create_attendance_settings(self):
        """Create attendance settings"""
        AttendanceSettings.objects.get_or_create(
            pk=1,
            defaults={
                'standard_work_hours': Decimal('8.0'),
                'standard_start_time': time(9, 0),
                'standard_end_time': time(17, 0),
                'late_threshold_minutes': 15,
                'overtime_threshold_hours': Decimal('8.0'),
                'break_duration_hours': Decimal('1.0'),
            }
        )
        self.stdout.write('Created attendance settings')

    def create_leave_requests(self, fake, employees, verbose):
        """Create leave requests"""
        leave_count = 0
        statuses = ['Pending', 'Approved', 'Rejected']
        leave_types = ['Annual', 'Sick', 'Maternity', 'Unpaid']
        
        for employee in employees:
            # Each employee has 1-5 leave requests
            num_leaves = random.randint(1, 5)
            
            for _ in range(num_leaves):
                start_date = fake.date_between(start_date='-1y', end_date='+3m')
                end_date = start_date + timedelta(days=random.randint(1, 10))
                
                leave_request = LeaveRequest.objects.create(
                    employee=employee,
                    leave_type=random.choice(leave_types),
                    start_date=start_date,
                    end_date=end_date,
                    reason=fake.text(max_nb_chars=200),
                    status=random.choice(statuses),
                    request_date=fake.date_between(start_date=start_date - timedelta(days=30), end_date=start_date)
                )
                
                # If approved/rejected, assign approver
                if leave_request.status in ['Approved', 'Rejected']:
                    hr_admin_users = CustomUser.objects.filter(role__in=['hr', 'admin'])
                    if hr_admin_users.exists():
                        leave_request.approved_by = random.choice(hr_admin_users)
                        leave_request.save()
                
                leave_count += 1
                
        self.stdout.write(f'Created {leave_count} leave requests')

    def create_payrolls(self, fake, employees, verbose):
        """Create payroll records"""
        payrolls = []
        current_date = date.today()
        
        for employee in employees:
            # Create 6 months of payroll data
            for months_ago in range(6):
                period_start = date(
                    current_date.year,
                    current_date.month - months_ago,
                    1
                )
                if period_start.month <= 0:
                    period_start = period_start.replace(year=period_start.year - 1, month=period_start.month + 12)
                
                # Calculate period end (last day of month)
                if period_start.month == 12:
                    period_end = period_start.replace(year=period_start.year + 1, month=1, day=1) - timedelta(days=1)
                else:
                    period_end = period_start.replace(month=period_start.month + 1, day=1) - timedelta(days=1)
                
                base_salary = Decimal(str(random.uniform(3000, 12000)))
                overtime_hours = Decimal(str(random.uniform(0, 20)))
                overtime_rate = base_salary / Decimal('160')  # Hourly rate
                bonuses = Decimal(str(random.uniform(0, 1000))) if random.random() < 0.3 else Decimal('0')
                deductions = Decimal(str(random.uniform(0, 200)))
                tax_rate = Decimal('0.15')  # 15% tax
                insurance = Decimal(str(random.uniform(100, 300)))
                
                payroll = Payroll.objects.create(
                    employee=employee,
                    pay_period_start=period_start,
                    pay_period_end=period_end,
                    base_salary=base_salary,
                    overtime_hours=overtime_hours,
                    overtime_rate=overtime_rate,
                    bonuses=bonuses,
                    deductions=deductions,
                    tax_deduction=(base_salary + bonuses) * tax_rate,
                    insurance_deduction=insurance,
                    status=random.choice(['Processed', 'Paid']),
                    processed_date=fake.date_time_between(start_date=period_end, end_date='now', tzinfo=timezone.get_current_timezone())
                )
                payrolls.append(payroll)
        
        self.stdout.write(f'Created {len(payrolls)} payroll records')
        return payrolls

    def create_attendances(self, fake, employees, verbose):
        """Create attendance records"""
        attendances = []
        current_date = date.today()
        
        for employee in employees:
            # Create 90 days of attendance data
            for days_ago in range(90):
                attendance_date = current_date - timedelta(days=days_ago)
                
                # Skip weekends (assuming Saturday=5, Sunday=6)
                if attendance_date.weekday() >= 5:
                    continue
                
                # 95% attendance rate
                if random.random() > 0.95:
                    # Absent
                    attendance = Attendance.objects.create(
                        employee=employee,
                        date=attendance_date,
                        status='Absent'
                    )
                else:
                    # Present with varying times
                    base_start = time(9, 0)  # 9:00 AM
                    start_minute = random.randint(-30, 60)  # -30 to +60 minutes variation
                    
                    check_in_time = (datetime.combine(attendance_date, base_start) + 
                                   timedelta(minutes=start_minute)).time()
                    
                    # Work 7-9 hours
                    work_hours = random.uniform(7, 9)
                    check_out_time = (datetime.combine(attendance_date, check_in_time) + 
                                    timedelta(hours=work_hours)).time()
                    
                    # Random break duration
                    break_duration = Decimal(str(random.uniform(0.5, 1.5)))
                    
                    attendance = Attendance.objects.create(
                        employee=employee,
                        date=attendance_date,
                        check_in_time=check_in_time,
                        check_out_time=check_out_time,
                        break_duration=break_duration
                    )
                
                attendances.append(attendance)
                
            if verbose and len(attendances) % 1000 == 0:
                self.stdout.write(f'Created {len(attendances)} attendance records...')
        
        self.stdout.write(f'Created {len(attendances)} attendance records')
        return attendances

    def create_notification_types(self, fake):
        """Create notification types"""
        types = [
            ('leave_request', 'Leave Request Notifications'),
            ('payroll', 'Payroll Notifications'),
            ('attendance', 'Attendance Notifications'),
            ('general', 'General Announcements'),
            ('system', 'System Notifications'),
        ]
        
        for name, description in types:
            NotificationType.objects.get_or_create(
                name=name,
                defaults={'description': description}
            )
        
        self.stdout.write(f'Created {len(types)} notification types')

    def create_notifications(self, fake, users, employees, verbose):
        """Create notifications"""
        notification_count = 0
        
        # Create various types of notifications
        for employee in employees:
            # Leave notifications
            leave_requests = LeaveRequest.objects.filter(employee=employee)
            for leave_request in leave_requests:
                if random.random() < 0.8:  # 80% chance
                    Notification.objects.create(
                        title=f"Leave Request - {leave_request.leave_type}",
                        message=f"Leave request from {leave_request.start_date} to {leave_request.end_date}",
                        notification_type='leave_request',
                        priority=random.choice(['Low', 'Medium', 'High']),
                        recipient=employee.user,
                        related_leave=leave_request,
                        is_read=random.choice([True, False])
                    )
                    notification_count += 1

            # Payroll notifications
            payrolls = Payroll.objects.filter(employee=employee)
            for payroll in payrolls:
                if random.random() < 0.6:  # 60% chance
                    Notification.objects.create(
                        title="Payroll Processed",
                        message=f"Your payroll for {payroll.pay_period_start} to {payroll.pay_period_end} has been processed",
                        notification_type='payroll_processed',
                        priority='Medium',
                        recipient=employee.user,
                        related_payroll=payroll,
                        is_read=random.choice([True, False])
                    )
                    notification_count += 1

        # General notifications for all users
        for _ in range(50):  # 50 general notifications
            Notification.objects.create(
                title=fake.sentence(nb_words=6),
                message=fake.text(max_nb_chars=300),
                notification_type='general',
                priority=random.choice(['Low', 'Medium', 'High']),
                is_global=True,
                sender=random.choice([u for u in users if u.role in ['admin', 'hr']]),
                is_read=False
            )
            notification_count += 1

        self.stdout.write(f'Created {notification_count} notifications')

    def create_notification_preferences(self, users):
        """Create notification preferences for users"""
        for user in users:
            NotificationPreference.objects.get_or_create(
                user=user,
                defaults={
                    'email_notifications': random.choice([True, False]),
                    'email_leave_requests': True,
                    'email_payroll_updates': True,
                    'email_attendance_alerts': random.choice([True, False]),
                    'email_general_announcements': random.choice([True, False]),
                    'in_app_notifications': True,
                    'push_notifications': random.choice([True, False])
                }
            )
        
        self.stdout.write(f'Created notification preferences for {len(users)} users')

    def create_attendance_summaries(self, employees):
        """Create attendance summaries"""
        current_date = date.today()
        
        for employee in employees:
            # Create summaries for last 6 months
            for months_ago in range(6):
                summary_month = date(
                    current_date.year,
                    current_date.month - months_ago,
                    1
                )
                if summary_month.month <= 0:
                    summary_month = summary_month.replace(year=summary_month.year - 1, month=summary_month.month + 12)
                
                AttendanceSummary.update_or_create_summary(employee, summary_month)
        
        self.stdout.write(f'Created attendance summaries for {len(employees)} employees')

    def create_payroll_history(self, fake, payrolls, users):
        """Create payroll history records"""
        hr_admin_users = [u for u in users if u.role in ['hr', 'admin']]
        history_count = 0
        
        # Add history for some payroll records
        for payroll in random.sample(payrolls, min(len(payrolls), 200)):  # Random 200 payrolls
            num_changes = random.randint(1, 3)
            
            for _ in range(num_changes):
                PayrollHistory.objects.create(
                    payroll=payroll,
                    changed_by=random.choice(hr_admin_users),
                    change_description=fake.sentence(),
                    old_status='Draft',
                    new_status=payroll.status
                )
                history_count += 1
        
        self.stdout.write(f'Created {history_count} payroll history records')