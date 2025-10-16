#!/bin/bash

# Setup mDNS for ntu-amr-1.local
# This script configures Avahi to advertise the domain name

echo "Setting up mDNS for ntu-amr-1.local..."

# Get current IP address
CURRENT_IP=$(hostname -I | awk '{print $1}')
echo "Current IP: $CURRENT_IP"

# Create Avahi service file for ntu-amr-1.local
sudo tee /etc/avahi/services/ntu-amr-1.service > /dev/null <<EOF
<?xml version="1.0" standalone='no'?>
<!DOCTYPE service-group SYSTEM "avahi-service.dtd">
<service-group>
  <name replace-wildcards="yes">ntu-amr-1.local</name>
  <service>
    <type>_http._tcp</type>
    <port>8080</port>
    <txt-record>path=/</txt-record>
  </service>
  <service>
    <type>_http._tcp</type>
    <port>3000</port>
    <txt-record>path=/</txt-record>
  </service>
</service-group>
EOF

# Restart Avahi daemon
sudo systemctl restart avahi-daemon

echo "mDNS setup complete!"
echo "Domain ntu-amr-1.local should now resolve to $CURRENT_IP"
echo "You can test with: ping ntu-amr-1.local"
