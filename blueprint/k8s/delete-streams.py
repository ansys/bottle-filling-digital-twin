import requests

# Base URL
base_url = "http://api.backend.ansysokas.eastus.cloudapp.azure.com/streaming/stream"

# Step 1: GET request to fetch stream items
response = requests.get(base_url, headers={"accept": "application/json"})

if response.status_code == 200:
    data = response.json()
    items = data.get("items", [])

    for item in items:
        stream_id = item.get("id")
        if stream_id:
            # Step 2: DELETE request for each ID
            delete_payload = {"id": stream_id}
            delete_headers = {
                "accept": "*/*",
                "Content-Type": "application/json"
            }
            delete_response = requests.delete(base_url, json=delete_payload, headers=delete_headers)

            if delete_response.status_code == 204:
                print(f"Deleted stream with ID: {stream_id}")
            else:
                print(f"Failed to delete stream with ID: {stream_id}. Status code: {delete_response.status_code}")
else:
    print(f"Failed to fetch streams. Status code: {response.status_code}")