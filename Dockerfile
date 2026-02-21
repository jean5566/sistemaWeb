FROM php:8.2-apache

# Install dependencies and PHP extensions
RUN apt-get update && apt-get install -y \
    libmariadb-dev \
    libxml2-dev \
    libcurl4-openssl-dev \
    libzip-dev \
    unzip \
    && docker-php-ext-install pdo_mysql soap xml dom curl zip

# Install Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Enable Apache mod_rewrite
RUN a2enmod rewrite

# Update Apache configuration to allow .htaccess and set DocumentRoot if needed
# By default Apache serves from /var/www/html
# We will copy the 'public' directory contents to /var/www/html

# Expose port 80
EXPOSE 80

# Install dependencies via Composer
WORKDIR /var/www
COPY composer.json ./
RUN composer install --no-dev --optimize-autoloader

WORKDIR /var/www/html
