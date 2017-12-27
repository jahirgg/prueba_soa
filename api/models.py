from django.db import models

# Create your models here.

class Transaction(models.Model):
    """Esta clase es la representación de una Transacción"""
    num = models.PositiveIntegerField()
    fecha = models.DateField(null=True)
    id_cliente = models.BigIntegerField(null=True)
    txn = models.DecimalField(max_digits=20,decimal_places=2,null=True)

    def __str__(self):
        """Representación textual de una instancia del modelo"""
        return "{}".format(self.num)