# api/serializers.py

from rest_framework import serializers
from .models import Transaction

class TransactionSerializer(serializers.ModelSerializer):
    """Serializer to map the Model instance into JSON format."""

    class Meta:
        """Meta class to map serializer's fields with the model fields."""
        model = Transaction
        fields = ('num', 'fecha', 'id_cliente', 'txn')
        read_only_fields = ('num', 'fecha', 'id_cliente', 'txn')

class NetCashFlowSerializer(serializers.ModelSerializer):
    """Serializer to return the Group by Date query instance into JSON format."""
    # Adding the calculated field "neto" for the net cashflow
    neto = serializers.DecimalField(max_digits=20,decimal_places=2)
    class Meta:
        """Meta class to map serializer's fields with the model fields."""
        model = Transaction
        fields = ('fecha', 'id_cliente', 'neto')
        read_only_fields = ('fecha', 'id_cliente', 'neto')

class MovingAverageSerializer(serializers.Serializer):
    """ Serializer to return the date and simple moving average object in JSON format. """
    fecha = serializers.DateField()
    sma = serializers.DecimalField(max_digits=20,decimal_places=2)
    

class ClientListSerializer(serializers.Serializer):
    """Serializer to map the client in the Model instance into JSON format."""
    id_cliente = serializers.IntegerField(min_value=0)
    