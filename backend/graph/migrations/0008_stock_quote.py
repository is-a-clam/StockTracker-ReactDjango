# Generated by Django 3.2 on 2021-06-09 08:36

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('graph', '0007_alter_stock_keystats'),
    ]

    operations = [
        migrations.AddField(
            model_name='stock',
            name='quote',
            field=models.JSONField(default=list),
        ),
    ]
