#!/bin/bash

# Create timestamp for the package name
timestamp=$(date +"%Y%m%d_%H%M%S")
package_name="ros_web_ws_${timestamp}.tar.gz"

echo "Creating package: $package_name"

# Create tar.gz file including node_modules
tar -czf $package_name \
    --exclude='.git' \
    --exclude='.DS_Store' \
    --exclude='*.log' \
    --exclude='build' \
    --exclude='devel' \
    --exclude='.vscode' \
    .

echo "Package created successfully!"
echo "Package location: $package_name"
echo "Package size: $(du -h $package_name | cut -f1)" 