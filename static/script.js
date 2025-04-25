document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('inputForm');
    const numCitiesInput = document.getElementById('numCities');
    const numTunnelsInput = document.getElementById('numTunnels');
    const numMaintenanceInput = document.getElementById('numMaintenance');
    const cityCoordinatesDiv = document.getElementById('cityCoordinates');
    const tunnelConnectionsDiv = document.getElementById('tunnelConnections');
    const maintenanceCitiesDiv = document.getElementById('maintenanceCities');
    const resultText = document.getElementById('resultText');

    // Generate input fields based on numbers
    numCitiesInput.addEventListener('input', generateCityInputs);
    numTunnelsInput.addEventListener('input', generateTunnelInputs);
    numMaintenanceInput.addEventListener('input', generateMaintenanceInputs);

    function generateCityInputs() {
        const numCities = parseInt(numCitiesInput.value);
        cityCoordinatesDiv.innerHTML = '';
        
        for (let i = 1; i <= numCities; i++) {
            const div = document.createElement('div');
            div.className = 'city-coordinates';
            div.innerHTML = `
                <span class="city-label">City ${i}</span>
                <div class="coordinate-input">
                    <input type="number" class="city-x" placeholder="x" required tabindex="${(i-1)*3 + 1}">
                </div>
                <div class="coordinate-input">
                    <input type="number" class="city-y" placeholder="y" required tabindex="${(i-1)*3 + 2}">
                </div>
                <div class="coordinate-input">
                    <input type="number" class="city-z" placeholder="z" required tabindex="${(i-1)*3 + 3}">
                </div>
            `;
            cityCoordinatesDiv.appendChild(div);
        }
    }

    function generateTunnelInputs() {
        const numTunnels = parseInt(numTunnelsInput.value);
        tunnelConnectionsDiv.innerHTML = '';
        
        for (let i = 1; i <= numTunnels; i++) {
            const div = document.createElement('div');
            div.className = 'tunnel-coordinates';
            div.innerHTML = `
                <span class="tunnel-label">Tunnel ${i}</span>
                <div class="coordinate-input">
                    <input type="number" class="tunnel-u" placeholder="u" required tabindex="${(i-1)*3 + 1}">
                </div>
                <div class="coordinate-input">
                    <input type="number" class="tunnel-v" placeholder="v" required tabindex="${(i-1)*3 + 2}">
                </div>
                <div class="coordinate-input">
                    <input type="number" class="tunnel-cost" placeholder="cost" required min="0" tabindex="${(i-1)*3 + 3}">
                </div>
            `;
            tunnelConnectionsDiv.appendChild(div);
        }

        // Add event listeners for cost validation
        const costInputs = tunnelConnectionsDiv.querySelectorAll('.tunnel-cost');
        costInputs.forEach(input => {
            input.addEventListener('input', validateCost);
            input.addEventListener('change', validateCost);
        });
    }

    function validateCost(event) {
        const input = event.target;
        const value = parseFloat(input.value);
        
        if (value < 0) {
            input.value = 0;
            showError(input, 'Cost cannot be negative');
        } else {
            hideError(input);
        }
    }

    function showError(input, message) {
        // Remove any existing error message
        hideError(input);
        
        // Create error message element
        const error = document.createElement('div');
        error.className = 'error-message';
        error.textContent = message;
        
        // Add error message after the input
        input.parentNode.appendChild(error);
        
        // Add error class to input
        input.classList.add('error');
    }

    function hideError(input) {
        // Remove error message if it exists
        const error = input.parentNode.querySelector('.error-message');
        if (error) {
            error.remove();
        }
        
        // Remove error class from input
        input.classList.remove('error');
    }

    function generateMaintenanceInputs() {
        const numMaintenance = parseInt(numMaintenanceInput.value);
        maintenanceCitiesDiv.innerHTML = '';
        
        for (let i = 1; i <= numMaintenance; i++) {
            const div = document.createElement('div');
            div.className = 'form-group';
            div.innerHTML = `
                <label>Maintenance City ${i}:</label>
                <input type="number" class="maintenance-city" required tabindex="${i}">
            `;
            maintenanceCitiesDiv.appendChild(div);
        }
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Validate all cost inputs before submission
        const costInputs = tunnelConnectionsDiv.querySelectorAll('.tunnel-cost');
        let hasError = false;
        
        costInputs.forEach(input => {
            const value = parseFloat(input.value);
            if (value < 0) {
                showError(input, 'Cost cannot be negative');
                hasError = true;
            }
        });

        if (hasError) {
            return;
        }
        
        // Collect all input data
        const numCities = parseInt(numCitiesInput.value);
        const numTunnels = parseInt(numTunnelsInput.value);
        const source = parseInt(document.getElementById('source').value);
        const destination = parseInt(document.getElementById('destination').value);
        const numMaintenance = parseInt(numMaintenanceInput.value);

        // Collect city coordinates
        const cities = [];
        const cityInputs = cityCoordinatesDiv.querySelectorAll('.city-coordinates');
        cityInputs.forEach(input => {
            const x = parseFloat(input.querySelector('.city-x').value);
            const y = parseFloat(input.querySelector('.city-y').value);
            const z = parseFloat(input.querySelector('.city-z').value);
            cities.push([x, y, z]);
        });

        // Collect tunnel connections
        const tunnels = [];
        const tunnelInputs = tunnelConnectionsDiv.querySelectorAll('.tunnel-coordinates');
        tunnelInputs.forEach(input => {
            const u = parseInt(input.querySelector('.tunnel-u').value);
            const v = parseInt(input.querySelector('.tunnel-v').value);
            const cost = parseFloat(input.querySelector('.tunnel-cost').value);
            tunnels.push([u, v, cost]);
        });

        // Collect maintenance cities
        const maintenanceCities = [];
        const maintenanceInputs = maintenanceCitiesDiv.querySelectorAll('.maintenance-city');
        maintenanceInputs.forEach(input => {
            maintenanceCities.push(parseInt(input.value));
        });

        // Prepare data for API
        const data = {
            num_cities: numCities,
            num_tunnels: numTunnels,
            cities: cities,
            tunnels: tunnels,
            source: source,
            destination: destination,
            maintenance_cities: maintenanceCities
        };

        console.log('Sending data to server:', data);

        try {
            const response = await fetch('https://minimumtravelcost.onrender.com/calculate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            console.log('Response status:', response.status);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('Server error:', errorText);
                throw new Error(`Server error: ${response.status} ${errorText}`);
            }

            const result = await response.json();
            console.log('Received result:', result);
            
            if (result.error) {
                throw new Error(result.error);
            }

            // Update result display
            if (result.min_cost !== undefined) {
                resultText.textContent = result.min_cost;
                // Add red color if no path found (-1)
                if (result.min_cost === -1) {
                    resultText.style.color = 'var(--error-color)';
                    resultText.textContent = '-1';
                } else {
                    resultText.style.color = 'var(--success-color)';
                }
            } else {
                throw new Error('No minimum cost in response');
            }
            
            // Update visualization with the path
            if (result.path && result.path.length > 0) {
                updateVisualization(cities, tunnels, result.path);
            } else {
                updateVisualization(cities, tunnels);
            }
        } catch (error) {
            console.error('Error:', error);
            resultText.textContent = `Error: ${error.message}`;
            resultText.style.color = 'var(--error-color)';
        }
    });

    // Three.js visualization
    let scene, camera, renderer, controls;
    let citySpheres = [];
    let tunnelLines = [];
    let pathLines = [];

    function initThreeJS() {
        scene = new THREE.Scene();
        scene.background = new THREE.Color(0xf0f0f0);

        const container = document.getElementById('graphContainer');
        const width = container.clientWidth;
        const height = container.clientHeight;

        camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
        camera.position.z = 50;

        renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(width, height);
        container.appendChild(renderer.domElement);

        // Add lights
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
        directionalLight.position.set(1, 1, 1);
        scene.add(directionalLight);

        // Initialize OrbitControls
        controls = new THREE.OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.minDistance = 10;
        controls.maxDistance = 100;

        // Add grid helper
        const gridHelper = new THREE.GridHelper(100, 20);
        scene.add(gridHelper);

        // Add axes helper
        const axesHelper = new THREE.AxesHelper(20);
        scene.add(axesHelper);

        // Handle window resize
        window.addEventListener('resize', () => {
            const width = container.clientWidth;
            const height = container.clientHeight;
            camera.aspect = width / height;
            camera.updateProjectionMatrix();
            renderer.setSize(width, height);
        });

        animate();
    }

    function animate() {
        requestAnimationFrame(animate);
        if (controls) {
            controls.update();
        }
        renderer.render(scene, camera);
    }

    function updateVisualization(cities, tunnels, path = []) {
        // Clear previous visualization
        citySpheres.forEach(sphere => scene.remove(sphere));
        tunnelLines.forEach(line => scene.remove(line));
        pathLines.forEach(line => scene.remove(line));
        citySpheres = [];
        tunnelLines = [];
        pathLines = [];

        // Validate cities array
        if (!cities || !Array.isArray(cities) || cities.length === 0) {
            console.error('Invalid cities data');
            return;
        }

        // Find the bounds of the cities
        let minX = Infinity, maxX = -Infinity;
        let minY = Infinity, maxY = -Infinity;
        let minZ = Infinity, maxZ = -Infinity;

        cities.forEach(city => {
            if (!Array.isArray(city) || city.length !== 3) {
                console.error('Invalid city coordinates:', city);
                return;
            }
            minX = Math.min(minX, city[0]);
            maxX = Math.max(maxX, city[0]);
            minY = Math.min(minY, city[1]);
            maxY = Math.max(maxY, city[1]);
            minZ = Math.min(minZ, city[2]);
            maxZ = Math.max(maxZ, city[2]);
        });

        // Calculate scale factor to fit all cities in view
        const maxRange = Math.max(maxX - minX, maxY - minY, maxZ - minZ);
        const scale = maxRange > 0 ? 20 / maxRange : 1; // Scale to fit in 20 units

        // Add cities
        cities.forEach((city, index) => {
            if (!Array.isArray(city) || city.length !== 3) {
                console.error('Invalid city coordinates:', city);
                return;
            }

            const geometry = new THREE.SphereGeometry(1, 32, 32);
            const material = new THREE.MeshPhongMaterial({ 
                color: path.includes(index) ? 0x00ff00 : 0x4a6bff,
                emissive: path.includes(index) ? 0x00ff00 : 0x4a6bff,
                emissiveIntensity: 0.2
            });
            const sphere = new THREE.Mesh(geometry, material);
            
            // Scale coordinates to fit in view
            sphere.position.x = (city[0] - minX) * scale;
            sphere.position.y = (city[1] - minY) * scale;
            sphere.position.z = (city[2] - minZ) * scale;
            
            scene.add(sphere);
            citySpheres.push(sphere);

            // Add city label
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.width = 128;
            canvas.height = 64;
            context.fillStyle = 'rgba(255, 255, 255, 0.8)';
            context.fillRect(0, 0, canvas.width, canvas.height);
            context.font = '24px Arial';
            context.fillStyle = '#000000';
            context.textAlign = 'center';
            context.fillText(`City ${index}`, canvas.width/2, canvas.height/2);

            const texture = new THREE.CanvasTexture(canvas);
            const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
            const sprite = new THREE.Sprite(spriteMaterial);
            sprite.position.copy(sphere.position);
            sprite.position.y += 2;
            scene.add(sprite);
        });

        // Add tunnels
        if (tunnels && Array.isArray(tunnels)) {
            tunnels.forEach(tunnel => {
                if (!Array.isArray(tunnel) || tunnel.length !== 3) {
                    console.error('Invalid tunnel data:', tunnel);
                    return;
                }

                const u = tunnel[0];
                const v = tunnel[1];
                
                // Validate city indices
                if (u < 0 || u >= cities.length || v < 0 || v >= cities.length) {
                    console.error('Invalid city indices in tunnel:', tunnel);
                    return;
                }

                const startCity = cities[u];
                const endCity = cities[v];
                
                if (!startCity || !endCity) {
                    console.error('Cities not found for tunnel:', tunnel);
                    return;
                }

                const geometry = new THREE.BufferGeometry();
                const material = new THREE.LineBasicMaterial({ 
                    color: 0x666666,
                    transparent: true,
                    opacity: 0.5
                });

                const points = [];
                points.push(new THREE.Vector3(
                    (startCity[0] - minX) * scale,
                    (startCity[1] - minY) * scale,
                    (startCity[2] - minZ) * scale
                ));
                points.push(new THREE.Vector3(
                    (endCity[0] - minX) * scale,
                    (endCity[1] - minY) * scale,
                    (endCity[2] - minZ) * scale
                ));

                geometry.setFromPoints(points);
                const line = new THREE.Line(geometry, material);
                scene.add(line);
                tunnelLines.push(line);
            });
        }

        // Add path if provided
        if (path && Array.isArray(path) && path.length > 0) {
            for (let i = 0; i < path.length - 1; i++) {
                const startIndex = path[i];
                const endIndex = path[i + 1];
                
                // Validate path indices
                if (startIndex < 0 || startIndex >= cities.length || 
                    endIndex < 0 || endIndex >= cities.length) {
                    console.error('Invalid city indices in path:', path);
                    continue;
                }

                const startCity = cities[startIndex];
                const endCity = cities[endIndex];
                
                if (!startCity || !endCity) {
                    console.error('Cities not found for path segment:', startIndex, endIndex);
                    continue;
                }
                
                const geometry = new THREE.BufferGeometry();
                const material = new THREE.LineBasicMaterial({ 
                    color: 0x00ff00,
                    linewidth: 3
                });

                const points = [];
                points.push(new THREE.Vector3(
                    (startCity[0] - minX) * scale,
                    (startCity[1] - minY) * scale,
                    (startCity[2] - minZ) * scale
                ));
                points.push(new THREE.Vector3(
                    (endCity[0] - minX) * scale,
                    (endCity[1] - minY) * scale,
                    (endCity[2] - minZ) * scale
                ));

                geometry.setFromPoints(points);
                const line = new THREE.Line(geometry, material);
                scene.add(line);
                pathLines.push(line);
            }
        }

        // Adjust camera to fit all objects
        const box = new THREE.Box3().setFromObject(scene);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const fov = camera.fov * (Math.PI / 180);
        let cameraZ = Math.abs(maxDim / Math.tan(fov / 2));
        camera.position.z = cameraZ * 1.5;
        camera.lookAt(center);
        controls.target.copy(center);
    }

    // Initialize Three.js when the page loads
    window.addEventListener('load', () => {
        initThreeJS();
    });

    // Add event listeners for rotation controls
    document.getElementById('rotateLeft').addEventListener('click', () => {
        if (controls) {
            controls.rotateLeft(Math.PI / 4);
        }
    });

    document.getElementById('rotateRight').addEventListener('click', () => {
        if (controls) {
            controls.rotateRight(Math.PI / 4);
        }
    });

    document.getElementById('resetView').addEventListener('click', () => {
        if (controls) {
            controls.reset();
        }
    });
}); 
