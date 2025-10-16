import * as THREE from 'three';

export class SafetySystemVisualizer {
    constructor(container) {
        this.container = container;
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.robotMesh = null;
        this.laserScanGroup = null;
        this.laserScanMaterial = null;
        this.footprint = null;
        this.robotCenter = { x: 0, y: 0 };
        this.texture = null;
        this.isInitialized = false;
        this.animationId = null;

        // Laser scan properties
        this.laserScanPoints = [];
        this.laserScanStyle = 'spheres';
        this.showLaserScan = true;

        // Animation properties
        this.animationSpeed = 0.02;
        this.time = 0;

        // Default footprint (fallback)
        this.defaultFootprint = {
            points: [
                { x: -0.25, y: -0.25 },
                { x: 0.25, y: -0.25 },
                { x: 0.25, y: 0.25 },
                { x: -0.25, y: 0.25 }
            ]
        };

        // Initialize
        this.init();
    }

    /**
     * Initialize Three.js scene
     */
    init() {
        try {
            // Create scene
            this.scene = new THREE.Scene();
            this.scene.background = new THREE.Color(0xffffff);

            // Create camera
            this.camera = new THREE.PerspectiveCamera(
                75,
                this.container.clientWidth / this.container.clientHeight,
                0.1,
                1000
            );
            this.camera.position.set(0, 0, 1.0); // Zoom in 3x (5/3 = 1.67)
            this.camera.lookAt(0, 0, 0);

            // Create renderer
            this.renderer = new THREE.WebGLRenderer({ antialias: true });
            this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
            this.renderer.setPixelRatio(window.devicePixelRatio);
            this.container.appendChild(this.renderer.domElement);

            // Add lights
            const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
            this.scene.add(ambientLight);

            const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
            directionalLight.position.set(10, 10, 5);
            this.scene.add(directionalLight);

            // Create coordinate frame
            // this.createCoordinateFrame();

            // Create default robot mesh immediately
            this.createDefaultRobotMesh();

            // Start animation loop
            this.animate();

            // Handle window resize
            window.addEventListener('resize', this.onWindowResize.bind(this));

            this.isInitialized = true;
            console.log('SafetySystemVisualizer initialized successfully');

        } catch (error) {
            console.error('Error initializing SafetySystemVisualizer:', error);
        }
    }

    /**
     * Create coordinate frame
     */
    createCoordinateFrame() {
        const axisLength = 0.5;
        const axisWidth = 0.02;

        // X-axis (red)
        const xGeometry = new THREE.BoxGeometry(axisLength, axisWidth, axisWidth);
        const xMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
        const xAxis = new THREE.Mesh(xGeometry, xMaterial);
        xAxis.position.x = axisLength / 2;

        // Y-axis (green)
        const yGeometry = new THREE.BoxGeometry(axisWidth, axisLength, axisWidth);
        const yMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
        const yAxis = new THREE.Mesh(yGeometry, yMaterial);
        yAxis.position.y = axisLength / 2;

        // Z-axis (blue)
        const zGeometry = new THREE.BoxGeometry(axisWidth, axisWidth, axisLength);
        const zMaterial = new THREE.MeshBasicMaterial({ color: 0x0000ff });
        const zAxis = new THREE.Mesh(zGeometry, zMaterial);
        zAxis.position.z = axisLength / 2;

        this.scene.add(xAxis, yAxis, zAxis);
    }

    /**
     * Load robot texture
     * @param {string} texturePath - Path to robot texture image
     */
    async loadTexture(texturePath = '/assets/nturobot_icon.png') {
        try {
            const textureLoader = new THREE.TextureLoader();
            this.texture = await new Promise((resolve, reject) => {
                textureLoader.load(
                    texturePath,
                    (texture) => {
                        texture.wrapS = THREE.RepeatWrapping;
                        texture.wrapT = THREE.RepeatWrapping;
                        texture.repeat.set(1, 1);
                        resolve(texture);
                    },
                    undefined,
                    reject
                );
            });
            console.log('Robot texture loaded successfully');
        } catch (error) {
            console.error('Error loading robot texture:', error);
            this.texture = null;
        }
    }

    /**
     * Load robot footprint and create mesh
     * @param {Object} footprintData - Footprint data from database
     * @param {Object} tfData - TF laser to base data from database
     */
    async loadFootprint(footprintData, tfData = null) {
        try {
            console.log('Loading footprint data:', footprintData);
            console.log('Loading tf data:', tfData);
            
            // Check if footprintData has the correct structure
            if (footprintData && footprintData.properties && footprintData.properties.Footprint && Array.isArray(footprintData.properties.Footprint)) {
                this.footprint = {
                    points: footprintData.properties.Footprint.map(point => ({
                        x: parseFloat(point[0]),
                        y: parseFloat(point[1])
                    }))
                };
                console.log('Parsed footprint points:', this.footprint.points);
            } else if (footprintData && footprintData.Footprint && Array.isArray(footprintData.Footprint)) {
                // Alternative structure
                this.footprint = {
                    points: footprintData.Footprint.map(point => ({
                        x: parseFloat(point[0]),
                        y: parseFloat(point[1])
                    }))
                };
                console.log('Parsed footprint points (alt):', this.footprint.points);
            } else {
                console.warn('Invalid footprint data, using default');
                this.footprint = this.defaultFootprint;
            }

            // Calculate center
            const centerX = this.footprint.points.reduce((sum, point) => sum + point.x, 0) / this.footprint.points.length;
            const centerY = this.footprint.points.reduce((sum, point) => sum + point.y, 0) / this.footprint.points.length;
            this.robotCenter = { x: centerX, y: centerY };
            
            // Calculate footprint bounds for centering
            this.calculateFootprintBounds();

            // Load TF data if provided
            if (tfData) {
                await this.loadTFLaserToBase(tfData);
            }

            // Load texture first, then create mesh
            await this.loadTexture();
            this.createRobotMesh();
            console.log('Robot footprint loaded:', this.footprint);
            console.log('Robot center:', this.robotCenter);

        } catch (error) {
            console.error('Error loading footprint:', error);
            this.footprint = this.defaultFootprint;
            await this.loadTexture();
            this.createRobotMesh();
        }
    }

    /**
     * Calculate footprint bounds for centering
     */
    calculateFootprintBounds() {
        if (!this.footprint || !this.footprint.points || this.footprint.points.length === 0) {
            return;
        }
        
        // Find min/max coordinates
        let xMin = Infinity, xMax = -Infinity;
        let yMin = Infinity, yMax = -Infinity;
        
        this.footprint.points.forEach(point => {
            xMin = Math.min(xMin, point.x);
            xMax = Math.max(xMax, point.x);
            yMin = Math.min(yMin, point.y);
            yMax = Math.max(yMax, point.y);
        });
        
        this.footprintBounds = {
            xMin, xMax, yMin, yMax,
            width: xMax - xMin,
            height: yMax - yMin,
            centerX: (xMin + xMax) / 2,
            centerY: (yMin + yMax) / 2
        };
        
        console.log('Footprint bounds:', this.footprintBounds);
        
        // Center the camera on the footprint
        this.centerCameraOnFootprint();
    }
    
    /**
     * Center camera on footprint
     */
    centerCameraOnFootprint() {
        if (!this.footprintBounds || !this.camera) {
            return;
        }
        
        // Calculate offset to center the footprint
        const offsetX = -this.footprintBounds.centerX;
        const offsetY = -this.footprintBounds.centerY;
        
        // Update camera position to center the footprint
        this.camera.position.set(offsetX, offsetY, 1.0);
        this.camera.lookAt(offsetX, offsetY, 0);
        
        console.log(`Camera centered at (${offsetX}, ${offsetY}) for footprint bounds:`, this.footprintBounds);
    }

    /**
     * Load TF laser to base data
     * @param {Object} tfData - TF data from server
     */
    async loadTFLaserToBase(tfData) {
        try {
            if (tfData && tfData.Position && tfData.Orientation) {
                // Validate Position array
                if (Array.isArray(tfData.Position) && tfData.Position.length >= 3) {
                    // Validate Orientation array
                    if (Array.isArray(tfData.Orientation) && tfData.Orientation.length >= 4) {
                        console.log('Raw TF Position array:', tfData.Position);
                        console.log('Raw TF Orientation array:', tfData.Orientation);

                        // Parse values with detailed logging
                        const posX = parseFloat(tfData.Position[0]);
                        const posY = parseFloat(tfData.Position[1]);
                        const posZ = parseFloat(tfData.Position[2]);
                        const rotX = parseFloat(tfData.Orientation[0]);
                        const rotY = parseFloat(tfData.Orientation[1]);
                        const rotZ = parseFloat(tfData.Orientation[2]);
                        const rotW = parseFloat(tfData.Orientation[3]);

                        // Check for NaN values
                        if (isNaN(posX) || isNaN(posY) || isNaN(posZ) ||
                            isNaN(rotX) || isNaN(rotY) || isNaN(rotZ) || isNaN(rotW)) {
                            console.error('NaN values detected in TF data');
                            this.tfLaserToBase = null;
                            return;
                        }

                        this.tfLaserToBase = new THREE.Matrix4();
                        this.tfLaserToBase.compose(
                            new THREE.Vector3(posX, posY, posZ),
                            new THREE.Quaternion(rotX, rotY, rotZ, rotW),
                            new THREE.Vector3(1, 1, 1)
                        );
                        console.log("TF laser to base loaded:", this.tfLaserToBase);
                    } else {
                        console.error('Invalid TF Orientation array:', tfData.Orientation);
                        this.tfLaserToBase = null;
                    }
                } else {
                    console.error('Invalid TF Position array:', tfData.Position);
                    this.tfLaserToBase = null;
                }
            } else {
                console.error('Invalid TF data format - missing Position or Orientation');
                this.tfLaserToBase = null;
            }
        } catch (error) {
            console.error('Error loading robot TF:', error);
            this.tfLaserToBase = null;
        }
    }

    /**
     * Create robot mesh from footprint
     */
    createRobotMesh() {
        // Remove existing robot mesh
        if (this.robotMesh) {
            this.scene.remove(this.robotMesh);
        }

        if (this.texture && this.footprint) {
            // Create mesh with texture
            this.robotMesh = this.createTexturedMesh();
        } else {
            // Create fallback mesh
            this.robotMesh = this.createFallbackMesh();
        }

        // Set position based on footprint centering
        if (this.footprintBounds) {
            const offsetX = -this.footprintBounds.centerX;
            const offsetY = -this.footprintBounds.centerY;
            this.robotMesh.position.set(offsetX, offsetY, 0.1);
            console.log(`Robot mesh positioned at (${offsetX}, ${offsetY}) for centering`);
        } else {
            this.robotMesh.position.set(0, 0, 0.1);
            console.log('Robot mesh positioned at (0,0) - no footprint bounds');
        }
        this.scene.add(this.robotMesh);
    }

    /**
     * Create textured mesh from footprint
     */
    createTexturedMesh() {
        const shape = new THREE.Shape();
        const points = this.footprint.points;

        // Move to first point
        shape.moveTo(points[0].x, points[0].y);

        // Draw footprint edges
        for (let i = 1; i < points.length; i++) {
            shape.lineTo(points[i].x, points[i].y);
        }
        // Close shape
        shape.lineTo(points[0].x, points[0].y);

        const geometry = new THREE.ShapeGeometry(shape);

        // Calculate UV mapping for proper texture placement
        const uvs = geometry.attributes.uv;
        const positions = geometry.attributes.position;

        // Find bounds of geometry
        let minX = Infinity, maxX = -Infinity;
        let minY = Infinity, maxY = -Infinity;
        for (let i = 0; i < positions.count; i++) {
            minX = Math.min(minX, positions.getX(i));
            maxX = Math.max(maxX, positions.getX(i));
            minY = Math.min(minY, positions.getY(i));
            maxY = Math.max(maxY, positions.getY(i));
        }

        // Update UV coordinates
        for (let i = 0; i < uvs.count; i++) {
            const x = positions.getX(i);
            const y = positions.getY(i);
            uvs.setXY(
                i,
                (x - minX) / (maxX - minX),
                (y - minY) / (maxY - minY)
            );
        }

        geometry.attributes.uv.needsUpdate = true;

        const material = new THREE.MeshBasicMaterial({
            map: this.texture,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.8
        });

        return new THREE.Mesh(geometry, material);
    }

    /**
     * Create fallback mesh (colored rectangle)
     */
    createFallbackMesh() {
        const geometry = new THREE.PlaneGeometry(0.5, 0.5);
        const material = new THREE.MeshBasicMaterial({
            color: 0x666666,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.8
        });
        return new THREE.Mesh(geometry, material);
    }

    /**
     * Create default robot mesh (rectangle)
     */
    createDefaultRobotMesh() {
        if (this.robotMesh) {
            this.scene.remove(this.robotMesh);
        }

        this.robotMesh = this.createFallbackMesh();
        this.robotMesh.position.set(0, 0, 0.1);
        this.scene.add(this.robotMesh);
        console.log('Default robot mesh created at (0,0)');
    }

    /**
     * Generate simulated laser scan data
     */
    generateLaserScanData() {
        this.laserScanPoints = [];
        
        // Simulate laser scan around robot
        const numPoints = 360;
        const radius = 2.0;
        
        for (let i = 0; i < numPoints; i++) {
            const angle = (i / numPoints) * 2 * Math.PI;
            
            // Add some noise and obstacles
            const noise = Math.random() * 0.3;
            const obstacle = Math.sin(angle * 3) * 0.5 + Math.cos(angle * 2) * 0.3;
            const distance = radius + noise + obstacle;
            
            const x = Math.cos(angle) * distance;
            const y = Math.sin(angle) * distance;
            
            this.laserScanPoints.push(new THREE.Vector3(x, y, 0.05));
        }
    }

    /**
     * Update laser scan visualization
     */
    updateLaserScan() {
        // Clear previous laser scan
        this.clearLaserScan();

        if (!this.showLaserScan || this.laserScanPoints.length === 0) {
            return;
        }

        // Generate new scan data
        this.generateLaserScanData();

        // Create laser scan group
        this.laserScanGroup = new THREE.Group();

        // Create material
        this.laserScanMaterial = new THREE.MeshBasicMaterial({
            color: 0x2196f3,
            transparent: true,
            opacity: 0.7
        });

        // Create points for laser scan (much lighter than spheres)
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(this.laserScanPoints.length * 3);
        
        this.laserScanPoints.forEach((point, index) => {
            positions[index * 3] = point.x;
            positions[index * 3 + 1] = point.y;
            positions[index * 3 + 2] = point.z;
        });
        
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        
        const pointsMaterial = new THREE.PointsMaterial({
            color: 0x2196f3,
            size: 0.02,
            transparent: true,
            opacity: 0.8
        });
        
        const points = new THREE.Points(geometry, pointsMaterial);
        this.laserScanGroup.add(points);
        
        // Apply same offset as robot for centering
        if (this.footprintBounds) {
            const offsetX = -this.footprintBounds.centerX;
            const offsetY = -this.footprintBounds.centerY;
            this.laserScanGroup.position.set(offsetX, offsetY, 0);
        }

        this.scene.add(this.laserScanGroup);
    }

    /**
     * Clear laser scan visualization
     */
    clearLaserScan() {
        if (this.laserScanGroup) {
            while (this.laserScanGroup.children.length > 0) {
                const child = this.laserScanGroup.children[0];
                this.laserScanGroup.remove(child);
                if (child.geometry) {
                    child.geometry.dispose();
                }
                if (child.material) {
                    child.material.dispose();
                }
            }
            this.scene.remove(this.laserScanGroup);
            this.laserScanGroup = null;
        }
    }

    /**
     * Animation loop
     */
    animate() {
        this.animationId = requestAnimationFrame(this.animate.bind(this));

        this.time += this.animationSpeed;

        // Keep robot static - no rotation animation
        // if (this.robotMesh) {
        //     this.robotMesh.rotation.z = Math.sin(this.time * 0.5) * 0.1;
        // }

        this.renderer.render(this.scene, this.camera);
    }

    /**
     * Handle window resize
     */
    onWindowResize() {
        if (this.camera && this.renderer && this.container) {
            // Update camera aspect ratio
            this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
            this.camera.updateProjectionMatrix();
            
            // Update renderer size
            this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
            
            // Re-center camera on footprint if bounds are available
            if (this.footprintBounds) {
                const offsetX = -this.footprintBounds.centerX;
                const offsetY = -this.footprintBounds.centerY;
                this.camera.position.set(offsetX, offsetY, 1.0);
                this.camera.lookAt(offsetX, offsetY, 0);
                console.log('Camera re-centered after resize:', this.camera.position);
            }
        }
    }

    /**
     * Set laser scan visibility
     * @param {boolean} visible - Whether to show laser scan
     */
    setLaserScanVisible(visible) {
        this.showLaserScan = visible;
        if (!visible) {
            this.clearLaserScan();
        }
    }

    /**
     * Set laser scan style
     * @param {string} style - Style: 'spheres', 'points', 'flat'
     */
    setLaserScanStyle(style) {
        this.laserScanStyle = style;
        this.updateLaserScan();
    }

    /**
     * Get current robot center
     * @returns {Object} Robot center coordinates
     */
    getRobotCenter() {
        return this.robotCenter;
    }
    
    /**
     * Get footprint bounds
     * @returns {Object} Footprint bounds information
     */
    getFootprintBounds() {
        return this.footprintBounds;
    }
    
    /**
     * Manually center camera on footprint
     */
    centerOnFootprint() {
        if (this.footprintBounds) {
            this.centerCameraOnFootprint();
        } else {
            console.warn('No footprint bounds available for centering');
        }
    }
    
    /**
     * Force update camera position (for debugging)
     */
    forceUpdateCamera() {
        if (!this.camera) {
            console.warn('Cannot force update camera: camera not initialized');
            return;
        }
        
        if (!this.footprintBounds) {
            console.warn('Cannot force update camera: no footprint bounds');
            return;
        }
        
        try {
            const offsetX = -this.footprintBounds.centerX;
            const offsetY = -this.footprintBounds.centerY;
            
            this.camera.position.set(offsetX, offsetY, 1.0);
            this.camera.lookAt(offsetX, offsetY, 0);
            this.camera.updateProjectionMatrix();
            
            console.log('Force updated camera to:', this.camera.position);
        } catch (error) {
            console.error('Error force updating camera:', error);
        }
    }
    
    /**
     * Force resize and re-center (for external calls)
     */
    forceResize() {
        if (this.container && this.camera && this.renderer) {
            console.log('Force resizing Three.js container');
            this.onWindowResize();
        } else {
            console.warn('Cannot force resize: missing container, camera, or renderer');
        }
    }

    /**
     * Dispose resources
     */
    dispose() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }

        if (this.renderer) {
            this.renderer.dispose();
            if (this.container && this.renderer.domElement) {
                this.container.removeChild(this.renderer.domElement);
            }
        }

        if (this.scene) {
            this.scene.clear();
        }

        // Dispose texture
        if (this.texture) {
            this.texture.dispose();
            this.texture = null;
        }

        // Clear arrays
        this.laserScanPoints = [];

        // Remove event listeners
        window.removeEventListener('resize', this.onWindowResize.bind(this));
    }

    /**
     * Update laser scan data from ROS
     * @param {Object} message - Laser scan message from ROS
     */
    updateScan(message) {
        if (!this.showLaserScan) {
            return;
        }
        
        // Check if scene is available
        if (!this.scene) {
            console.warn('Scene not available for laser scan processing');
            return;
        }

        // Validate scan message
        if (!message || typeof message !== 'object') {
            console.error('Invalid scan message:', message);
            return;
        }

        // Process the scan data using only tfLaserToBase
        if (this.tfLaserToBase) {
            // Extract scan data from message
            if (message.ranges && Array.isArray(message.ranges)) {
                const ranges = message.ranges;
                const angleMin = message.angle_min || 0;
                const angleIncrement = message.angle_increment || 0.0174533; // ~1 degree in radians

                // Transform scan data using only tfLaserToBase
                this.transformAndVisualizeScanSimple(ranges, angleMin, angleIncrement);
            }
        } else {
            console.warn('TF laser to base not available, using simulated scan');
            this.updateLaserScan(); // Fallback to simulated data
        }
    }

    /**
     * Transform and visualize laser scan data using only tfLaserToBase
     * @param {Array} ranges - Laser scan ranges
     * @param {number} angleMin - Minimum angle
     * @param {number} angleIncrement - Angle increment
     */
    transformAndVisualizeScanSimple(ranges, angleMin, angleIncrement) {
        // Clear previous laser scan visualization
        this.clearLaserScan();

        // Validate that tfLaserToBase is available
        if (!this.tfLaserToBase) {
            console.warn('TF laser to base not available for laser scan');
            return;
        }

        // Clear laser points
        this.laserScanPoints = [];
        
        // Process each scan point
        const scanPoints = [];
        for (let i = 0; i < ranges.length; i++) {
            const range = ranges[i];

            // Skip invalid ranges
            if (range === Infinity || range === -Infinity || isNaN(range) || range <= 0) {
                continue;
            }

            // Calculate angle for this point
            const angle = angleMin + i * angleIncrement;

            // Skip invalid angles
            if (isNaN(angle)) {
                continue;
            }

            // Convert polar coordinates to Cartesian (in laser frame)
            const laserX = range * Math.cos(angle);
            const laserY = range * Math.sin(angle);
            const laserZ = 0.2;

            // Skip invalid laser coordinates
            if (isNaN(laserX) || isNaN(laserY) || isNaN(laserZ)) {
                continue;
            }

            // Transform from laser frame to base frame using only tfLaserToBase
            const basePoint = this.transformPoint([laserX, laserY, laserZ], this.tfLaserToBase);

            // Validate transformed point
            if (basePoint &&
                !isNaN(basePoint[0]) && !isNaN(basePoint[1]) && !isNaN(basePoint[2]) &&
                isFinite(basePoint[0]) && isFinite(basePoint[1]) && isFinite(basePoint[2])) {

                // Add some reasonable bounds checking
                if (Math.abs(basePoint[0]) < 1000 && Math.abs(basePoint[1]) < 1000 && Math.abs(basePoint[2]) < 1000) {
                    scanPoints.push(new THREE.Vector3(basePoint[0], basePoint[1], 0.05));
                }
            }
        }

        // Only visualize if we have valid points
        if (scanPoints.length > 0) {
            this.visualizeLaserScan(scanPoints);
        }
    }

    /**
     * Transform a point using a transformation matrix
     * @param {Array} point - 3D point [x, y, z]
     * @param {THREE.Matrix4} matrix - Transformation matrix
     * @returns {Array} Transformed point [x, y, z]
     */
    transformPoint(point, matrix) {
        // Validate input
        if (!point || !Array.isArray(point) || point.length < 3) {
            console.error('Invalid point for transformation:', point);
            return null;
        }

        if (!matrix || !matrix.isMatrix4) {
            console.error('Invalid matrix for transformation:', matrix);
            return null;
        }

        // Transform a 3D point using 4x4 matrix
        const vector = new THREE.Vector3(point[0], point[1], point[2]);
        vector.applyMatrix4(matrix);
        return [vector.x, vector.y, vector.z];
    }

    /**
     * Visualize laser scan points
     * @param {Array} scanPoints - Array of THREE.Vector3 points
     */
    visualizeLaserScan(scanPoints) {
        // Check if scene is available
        if (!this.scene) {
            console.warn('Scene not available for laser scan visualization');
            return;
        }

        // Validate input
        if (!scanPoints || !Array.isArray(scanPoints)) {
            console.error('Invalid scan points for visualization:', scanPoints);
            return;
        }

        if (scanPoints.length === 0) {
            console.log('No valid scan points to visualize');
            return;
        }

        // Final validation of all points
        const validPoints = scanPoints.filter(point => {
            return point &&
                !isNaN(point.x) && !isNaN(point.y) && !isNaN(point.z) &&
                isFinite(point.x) && isFinite(point.y) && isFinite(point.z) &&
                Math.abs(point.x) < 1000 && Math.abs(point.y) < 1000 && Math.abs(point.z) < 1000;
        });

        if (validPoints.length === 0) {
            console.warn('No valid points after final validation');
            return;
        }

        // Clear previous laser scan
        this.clearLaserScan();

        // Create a group to hold all laser scan elements
        try {
            this.laserScanGroup = new THREE.Group();
            if (!this.laserScanGroup) {
                console.error('Failed to create laserScanGroup');
                return;
            }
        } catch (error) {
            console.error('Error creating laserScanGroup:', error);
            return;
        }

        // Create material
        if (!this.laserScanMaterial) {
            this.laserScanMaterial = new THREE.MeshBasicMaterial({
                color: 0x2196f3,
                transparent: true,
                opacity: 0.7
            });
        }

        // Create points for laser scan (much lighter than spheres)
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(validPoints.length * 3);
        
        validPoints.forEach((point, index) => {
            positions[index * 3] = point.x;
            positions[index * 3 + 1] = point.y;
            positions[index * 3 + 2] = point.z;
        });
        
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        
        const pointsMaterial = new THREE.PointsMaterial({
            color: 0x2196f3,
            size: 0.02,
            transparent: true,
            opacity: 0.8
        });
        
        const points = new THREE.Points(geometry, pointsMaterial);
        this.laserScanGroup.add(points);
        
        // Apply same offset as robot for centering
        if (this.footprintBounds) {
            const offsetX = -this.footprintBounds.centerX;
            const offsetY = -this.footprintBounds.centerY;
            this.laserScanGroup.position.set(offsetX, offsetY, 0);
        }

        this.scene.add(this.laserScanGroup);
    }
}
