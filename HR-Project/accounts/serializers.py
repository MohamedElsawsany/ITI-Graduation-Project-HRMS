# accounts/serializers.py
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.tokens import RefreshToken
from .models import CustomUser
from rest_framework import serializers

class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)

        token['username'] = user.username
        token['email'] = user.email
        token['role'] = user.role
        
        # Add employee_id to token if user has an associated employee record
        try:
            from employees.models import Employee
            employee = Employee.objects.get(user=user)
            token['employee_id'] = employee.id
        except Employee.DoesNotExist:
            token['employee_id'] = None

        return token

class ListUsersSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ('id', 'username', 'email', 'role')