FROM php:8.2-apache

# Install dependencies and PHP extensions
RUN apt-get update && apt-get install -y \
    libmariadb-dev \
    && docker-php-ext-install pdo_mysql

# Enable Apache mod_rewrite
RUN a2enmod rewrite

# Update Apache configuration to allow .htaccess and set DocumentRoot if needed
# By default Apache serves from /var/www/html
# We will copy the 'public' directory contents to /var/www/html

WORKDIR /var/www/html

# Expose port 80
EXPOSE 80
