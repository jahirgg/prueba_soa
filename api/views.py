from django.shortcuts import render
from django.http import Http404
from django.contrib.auth.mixins import LoginRequiredMixin

from rest_framework import generics
from rest_framework.views import APIView
from rest_framework.response import Response

from .serializers import TransactionSerializer, NetCashFlowSerializer, MovingAverageSerializer, ClientListSerializer
from .models import Transaction
from datetime import datetime

from .forms import GenerateRandomUserForm
from django.views.generic import FormView, ListView

from django.db.models import Sum
import decimal


class ClientView(LoginRequiredMixin, generics.ListAPIView):
    """This class retrieves all the transactions for a single client"""
    serializer_class = TransactionSerializer
    
    # Controlling access to the view only for authenticated users
    redirect_field_name = 'next'
    def dispatch(self, *args, **kwargs):
        return super(ClientView, self).dispatch(*args, **kwargs)

    def get_queryset(self, format=None):
        pk = self.kwargs['pk'] 
        try:       
            # Querying all the transactions for a specific client (PK)
            return Transaction.objects.filter(id_cliente=pk).exclude(fecha__isnull=True).order_by('fecha')
        except Transaction.DoesNotExist:
            raise Http404


class ClientListView(LoginRequiredMixin, generics.ListAPIView):
    """This class returns the list of all clients in the dataset."""
    serializer_class = ClientListSerializer

    # Controlling access to the view only for authenticated users
    redirect_field_name = 'next'
    def dispatch(self, *args, **kwargs):
        return super(ClientListView, self).dispatch(*args, **kwargs)

    def get_queryset(self, format=None):
        try:
            #Querying all clients in the database
            queryset = Transaction.objects.values("id_cliente").exclude(id_cliente__isnull=True).order_by("id_cliente").distinct()         
            return queryset
        except Transaction.DoesNotExist:
            raise Http404

class MovingAverage(object):
    """ Helper class for the Moving Average Serializer """
    def __init__(self, fecha, sma):
        self.fecha = fecha
        self.sma = sma

class MovingAverageView(LoginRequiredMixin, generics.ListAPIView):    
    """This class calculates the simple moving average for the 
        last three days where the specified client (PK) has
        transactional movements."""
    serializer_class = MovingAverageSerializer
    
    # Controlling access to the view only for authenticated users
    redirect_field_name = 'next'
    def dispatch(self, *args, **kwargs):
        return super(MovingAverageView, self).dispatch(*args, **kwargs)

    def get_queryset(self, format=None):
        pk = self.kwargs['pk'] 
        """try:       
            result = calculate_moving_average(pk)
            
            print(result)
            return result
        except Transaction.DoesNotExist:
            raise Http404"""
        try:
            # Query will contain the net cashflow per day per client
            # Using the option value_list() to get a list version of the query
            # in order to iterate through it
            queryset = Transaction.objects.values('fecha','id_cliente').filter(id_cliente=pk).exclude(fecha__isnull=True).order_by('fecha').annotate(neto=Sum('txn')).values_list("fecha","neto")
                               
            N = 3 # Calculating the moving average for a three day period.                          
            total = decimal.Decimal(20.2) # Initializing running total for calculation
            sma = () # Initializing tupple that will cotain the results

            # Iterating through query reults
            for i, t in enumerate(queryset):
                if (i+1>=N): # Calculation doesn't start until the N-th element
                    total = 0
                    for j in range (i+1-N, i+1): # Iterating through N elements in queryset only
                        total += queryset[j][1]
                    # Populating the result list with objects from the helper MovingAverage class
                    sma += (MovingAverage(queryset[j][0],total/N),) 

            return sma # Passing the result set. The serializar will convert it to JSON
        except Transaction.DoesNotExist:
            raise Http404
    

class NetCashflowView(LoginRequiredMixin, generics.ListAPIView):
    """This class calculates the net cash flow per day for a specific client"""
    serializer_class = NetCashFlowSerializer
    
    # Controlling access to the view only for authenticated users
    redirect_field_name = 'next'
    def dispatch(self, *args, **kwargs):
        return super(NetCashflowView, self).dispatch(*args, **kwargs)

    def get_queryset(self, format=None):
        pk = self.kwargs['pk'] #pk contains the client number
        try:
            # Obtaining the result set with date, client id and calculating the 
            # net cash flow aggregation as a SUM with GROUP BY statement
            queryset = Transaction.objects.values('fecha','id_cliente').filter(id_cliente=pk).exclude(fecha__isnull=True).order_by('fecha').annotate(neto=Sum('txn'))
            return queryset
        except Transaction.DoesNotExist:
            raise Http404


def import_db(request):
    """ Helper method to import data set values into the Database Model """
    Transaction.objects.all().delete()
    f = open('/Users/Jahir/Development/Projects/rest_service/dataset.csv')
    next(f)
    for line in f:
        print(line)
        line = line.split(',')
        if len(line[1])>0:
            tmp = Transaction(num = line[0], 
            fecha = datetime.strptime(line[1],'%Y%m%d'),
            id_cliente = line[2],
            txn = line[3]
            )
        else:
            tmp = Transaction(num = line[0], 
            fecha = None,
            id_cliente = line[2],
            txn = None
            )
        print(tmp)
        tmp.save()
    f.close()
