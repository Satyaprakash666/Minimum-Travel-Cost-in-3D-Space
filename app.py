from flask import Flask, render_template, request, jsonify
import heapq

app = Flask(__name__)

def dijkstra_3d(cities, tunnels, source, destination, maintenance_cities):
    adj = [[] for _ in range(len(cities))]
    for u, v, cost in tunnels:
        adj[u].append((v, cost))
        adj[v].append((u, cost)) 

    distances = [float('inf')] * len(cities)
    distances[source] = 0
    previous = [-1] * len(cities)

    heap = [(0, source)]

    while heap:
        current_dist, u = heapq.heappop(heap)

        if current_dist > distances[u]:
            continue

        if u == destination:
            break

        if u in maintenance_cities:
            continue
        for v, cost in adj[u]:
            if v in maintenance_cities:
                continue

            new_dist = current_dist + cost
            if new_dist < distances[v]:
                distances[v] = new_dist
                previous[v] = u
                heapq.heappush(heap, (new_dist, v))

    path = []
    if distances[destination] != float('inf'):
        current = destination
        while current != -1:
            path.append(current)
            current = previous[current]
        path.reverse()

    return distances[destination] if distances[destination] != float('inf') else -1, path

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/calculate', methods=['POST'])
def calculate():
    try:
        data = request.get_json()
        # print("Received data:", data)

        if not all(key in data for key in ['num_cities', 'num_tunnels', 'cities', 'tunnels', 'source', 'destination', 'maintenance_cities']):
            return jsonify({'error': 'Missing required fields'}), 400

        num_cities = data['num_cities']
        num_tunnels = data['num_tunnels']
        cities = data['cities']
        tunnels = data['tunnels']
        source = data['source'] - 1 
        destination = data['destination'] - 1
        maintenance_cities = [x - 1 for x in data['maintenance_cities']] 

        if not isinstance(num_cities, int) or num_cities < 2:
            return jsonify({'error': 'Invalid number of cities'}), 400

        if not isinstance(num_tunnels, int) or num_tunnels < 1:
            return jsonify({'error': 'Invalid number of tunnels'}), 400

        if not isinstance(cities, list) or len(cities) != num_cities:
            return jsonify({'error': 'Invalid cities data'}), 400

        if not isinstance(tunnels, list) or len(tunnels) != num_tunnels:
            return jsonify({'error': 'Invalid tunnels data'}), 400

        if not isinstance(source, int) or source < 0 or source >= num_cities:
            return jsonify({'error': 'Invalid source city'}), 400

        if not isinstance(destination, int) or destination < 0 or destination >= num_cities:
            return jsonify({'error': 'Invalid destination city'}), 400

        if not isinstance(maintenance_cities, list):
            return jsonify({'error': 'Invalid maintenance cities data'}), 400

        tunnels = [[u-1, v-1, cost] for u, v, cost in tunnels]

        min_cost, path = dijkstra_3d(cities, tunnels, source, destination, maintenance_cities)
        print("Calculated result:", {'min_cost': min_cost, 'path': path}) 

        path = [x + 1 for x in path] if path else []

        return jsonify({
            'min_cost': min_cost,
            'path': path
        })

    except Exception as e:
        print("Error:", str(e))
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True) 