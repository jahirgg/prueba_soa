from celery import task

from .serializers import  MovingAverageSerializer
from .models import Transaction
from django.db.models import Sum
import decimal
import time

class MovingAverage(object):
    """ Helper class for the Moving Average Serializer """
    def __init__(self, fecha, sma):
        self.fecha = fecha
        self.sma = sma

@task
def print_random_total(total):
    print(total)
    return 'Cliente '+total

@task(ignore_result=True)
def send_email(recepient, title, subject):
    print('sending email')

@task
def rebuild_search_index():
     time.sleep(500) # mimicking a long running process
     print('rebuilt search index')
     return 42

@task
def calculate_moving_average(pk):
    try:     
        time.sleep(500) # mimicking a long running process
        print('Esperando') 
        print(pk)      
        # Query will contain the net cashflow per day per client
        # Using the option value_list() to get a list version of the query
        # in order to iterate through it
        queryset = Transaction.objects.values('fecha','id_cliente').filter(id_cliente=pk).exclude(fecha__isnull=True).order_by('fecha').annotate(neto=Sum('txn')).values_list("fecha","neto")
        print(queryset)                    
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